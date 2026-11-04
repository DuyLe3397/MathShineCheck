import { Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { FirestoreService } from '../../services/firestore.service';
import { environment } from '../../../environments/environment';
import { VerifiedBadgeComponent } from '../../shared/components/verified-badge.component';

type State = 'loading' | 'off' | 'code' | 'on';

/**
 * Thẻ bật thông báo qua Zalo Bot trên trang chủ học sinh: lấy mã 6 số, học sinh nhắn mã cho bot,
 * thẻ tự nhận ra khi đã liên kết (xem email-api/lib/zalo.js).
 */
@Component({
  selector: 'app-zalo-link-card',
  standalone: true,
  imports: [VerifiedBadgeComponent],
  styles: [
    `
      .card {
        background: #fff;
        border: 1px solid #dbeafe;
        border-radius: 14px;
        padding: 0.9rem 1rem;
        margin-bottom: 1rem;
        box-shadow: 0 1px 3px rgba(15, 23, 42, 0.06);
      }
      .row {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        justify-content: space-between;
        flex-wrap: wrap;
      }
      .title {
        font-weight: 600;
        color: #1e3a8a;
      }
      .muted {
        color: #64748b;
        font-size: 0.875rem;
        margin: 0.35rem 0 0;
      }
      .code {
        font-size: 1.6rem;
        font-weight: 700;
        letter-spacing: 0.08em;
        color: #0f172a;
        margin: 0.5rem 0;
        user-select: all;
      }
      ol {
        margin: 0.25rem 0 0.5rem 1.1rem;
        padding: 0;
        color: #334155;
        font-size: 0.9rem;
      }
      button,
      a.btn {
        border: none;
        border-radius: 10px;
        padding: 0.5rem 0.9rem;
        font-weight: 600;
        cursor: pointer;
        font-size: 0.9rem;
        text-decoration: none;
        display: inline-block;
      }
      .primary {
        background: #2563eb;
        color: #fff;
      }
      .ghost {
        background: #f1f5f9;
        color: #334155;
      }
      .actions {
        display: flex;
        gap: 0.5rem;
        flex-wrap: wrap;
      }
      .green {
        background: #16a34a;
        color: #fff;
      }
      .full {
        display: block;
        width: 100%;
        text-align: center;
        padding: 0.75rem 1rem;
        box-sizing: border-box;
      }
      .card-on {
        border-color: #bfdbfe;
        background: #eff6ff;
      }
      .on {
        color: #1d4ed8;
        font-weight: 600;
        display: inline-flex;
        align-items: center;
        gap: 0.6rem;
      }
      .check {
        width: 28px;
        height: 28px;
        flex: none;
      }
    `,
  ],
  template: `
    @switch (state()) {
      @case ('off') {
        <div class="card">
          <div class="row">
            <div>
              <div class="title">🔔 Nhận thông báo qua Zalo</div>
              <p class="muted">Bot của MathShine Check sẽ báo ngay khi bài được chấm hoặc trợ giảng nhận xét</p>
            </div>
            <button class="primary" (click)="start()" [disabled]="busy()">Bật</button>
          </div>
          @if (error()) {
            <p class="muted">{{ error() }}</p>
          }
        </div>
      }
      @case ('code') {
        <div class="card">
          <a class="btn green full" [href]="botUrl" target="_blank" rel="noopener" (click)="copy()">
            Sao chép mã và mở {{ botName }}
          </a>
        </div>
      }
      @case ('on') {
        <div class="card card-on">
          <div class="row">
            <span class="on">
              <verified-badge [size]="28" />
              Đã bật
            </span>
          </div>
        </div>
      }
    }
  `,
})
export class ZaloLinkCardComponent implements OnInit, OnDestroy {
  private authService = inject(AuthService);
  private firestoreService = inject(FirestoreService);

  readonly botName = environment.zaloBotName;
  readonly botUrl = environment.zaloBotUrl;
  private readonly studentId = this.authService.currentProfile?.uid || '';

  state = signal<State>('loading');
  code = signal('');
  busy = signal(false);
  copied = signal(false);
  error = signal('');
  private timer?: ReturnType<typeof setInterval>;

  async ngOnInit(): Promise<void> {
    // Chưa cấu hình API Zalo thì ẩn thẻ
    if (!environment.zaloNotifyUrl || !this.studentId) return;
    try {
      const chat = await this.firestoreService.getZaloChat(this.studentId);
      this.state.set(chat ? 'on' : 'off');
    } catch {
      this.state.set('off');
    }
  }

  ngOnDestroy(): void {
    this.stopPolling();
  }

  async start(): Promise<void> {
    this.busy.set(true);
    this.error.set('');
    try {
      this.code.set(await this.firestoreService.createZaloLinkCode(this.studentId));
      this.state.set('code');
      this.startPolling();
    } catch {
      this.error.set('Không tạo được mã, em thử lại nhé.');
    } finally {
      this.busy.set(false);
    }
  }

  /** Chép mã; trình duyệt trong Zalo có thể chặn Clipboard API nên có cách dự phòng execCommand. */
  async copy(): Promise<void> {
    const text = `MS-${this.code()}`;
    try {
      await navigator.clipboard.writeText(text);
      this.copied.set(true);
      return;
    } catch {}
    try {
      const area = document.createElement('textarea');
      area.value = text;
      area.setAttribute('readonly', '');
      area.style.position = 'fixed';
      area.style.opacity = '0';
      document.body.appendChild(area);
      area.select();
      const ok = document.execCommand('copy');
      area.remove();
      if (ok) this.copied.set(true);
    } catch {}
  }

  async check(): Promise<void> {
    const chat = await this.firestoreService.getZaloChat(this.studentId).catch(() => null);
    if (chat) {
      this.stopPolling();
      this.state.set('on');
    }
  }

  // Tự kiểm tra mỗi 4 giây trong 30 phút mã còn hiệu lực
  private startPolling(): void {
    this.stopPolling();
    const until = Date.now() + 30 * 60 * 1000;
    this.timer = setInterval(() => {
      if (Date.now() > until) this.stopPolling();
      else this.check();
    }, 4000);
  }

  private stopPolling(): void {
    if (this.timer) clearInterval(this.timer);
    this.timer = undefined;
  }
}
