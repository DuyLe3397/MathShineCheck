import { Component, HostBinding, inject, Input, NgZone, OnDestroy, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { NotificationRefreshService } from '../../services/notification-refresh.service';

/**
 * Nút "Làm mới" của trang giáo viên, nổi cố định ở góc trên phải màn hình để bấm được
 * cả khi đã cuộn xuống: gọi lại hàm tải dữ liệu của trang mà không tải lại cả trang,
 * kèm tải lại mục Thông báo ở sidebar nếu trang có. `action` trả về false khi người dùng
 * hủy (ví dụ không muốn bỏ thay đổi chưa lưu) thì không làm mới gì; ném lỗi thì báo thất bại.
 * Cuộn khỏi đầu trang thì thu còn icon ↻; di chuột vào hoặc vừa làm mới xong thì bung ra.
 */
@Component({
  selector: 'app-refresh-button',
  standalone: true,
  imports: [DatePipe],
  template: `
    @if (failed()) {
      <span class="status error">Làm mới thất bại</span>
    } @else if (updatedAt()) {
      <span class="status">Cập nhật lúc {{ updatedAt() | date: 'HH:mm' }}</span>
    }
    <button
      type="button"
      class="refresh-btn"
      [disabled]="disabled || refreshing()"
      (click)="run()"
      title="Tải lại dữ liệu trên trang"
    >
      <span class="icon" [class.spinning]="refreshing()">↻</span>
      <span class="label">Làm mới</span>
    </button>
  `,
  styles: [
    `
      /* Nổi cố định góc trên phải; dưới các popup (z-index 150+) để popup vẫn che được */
      :host {
        position: fixed;
        top: 16px;
        right: 16px;
        z-index: 100;
        display: inline-flex;
        align-items: center;
        gap: 10px;
        padding: 6px 6px 6px 12px;
        background: #fff;
        border: 1px solid #e2e8f0;
        border-radius: 12px;
        box-shadow: 0 4px 16px rgba(15, 23, 42, 0.12);
        transition: padding 0.2s ease, gap 0.2s ease, border-radius 0.2s ease;
      }
      .status,
      .label {
        white-space: nowrap;
        overflow: hidden;
        max-width: 160px;
        transition: max-width 0.2s ease, opacity 0.2s ease;
      }
      .status {
        font-size: 0.8rem;
        color: #64748b;
      }
      .status.error {
        color: #dc2626;
      }
      /* Thu nhỏ: chỉ còn nút tròn ↻ */
      :host(.compact:not(:hover):not(.flash)) {
        padding: 4px;
        gap: 0;
        border-radius: 999px;
        .status,
        .label {
          max-width: 0;
          opacity: 0;
        }
        .refresh-btn {
          padding: 8px;
          gap: 0;
          border-radius: 999px;
        }
      }
      .refresh-btn {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 7px 14px;
        border: 1px solid #cbd5e1;
        border-radius: 8px;
        background: #fff;
        color: #334155;
        font-size: 0.875rem;
        font-weight: 600;
        cursor: pointer;
        transition: background 0.15s ease, padding 0.2s ease;
        &:hover:not(:disabled) {
          background: #f1f5f9;
        }
        &:disabled {
          opacity: 0.55;
          cursor: not-allowed;
        }
      }
      .icon {
        display: inline-block;
        font-size: 1.05rem;
        line-height: 1;
      }
      .spinning {
        animation: spin 0.8s linear infinite;
      }
      @keyframes spin {
        to {
          transform: rotate(360deg);
        }
      }
    `,
  ],
})
export class RefreshButtonComponent implements OnInit, OnDestroy {
  private notificationRefresh = inject(NotificationRefreshService);
  private zone = inject(NgZone);

  @Input({ required: true }) action!: () => Promise<boolean | void>;
  @Input() disabled = false;
  /** Khoảng cách tới mép trên màn hình, để né header cao (trang chấm bài). */
  @HostBinding('style.top.px') @Input() top = 16;

  refreshing = signal(false);
  updatedAt = signal<Date | null>(null);
  failed = signal(false);
  private compact = signal(false);
  private flash = signal(false);
  private flashTimer?: ReturnType<typeof setTimeout>;

  @HostBinding('class.compact') get isCompact(): boolean {
    return this.compact();
  }

  @HostBinding('class.flash') get isFlashing(): boolean {
    return this.flash();
  }

  // Trang cuộn theo cửa sổ, riêng vài trang cuộn trong .main; bắt cả hai ở pha capture
  private onScroll = (): void => {
    const main = document.querySelector('.main');
    this.compact.set(Math.max(window.scrollY, main?.scrollTop ?? 0) > 0);
  };

  ngOnInit(): void {
    document.addEventListener('scroll', this.onScroll, { capture: true, passive: true });
  }

  ngOnDestroy(): void {
    document.removeEventListener('scroll', this.onScroll, { capture: true });
    clearTimeout(this.flashTimer);
  }

  async run(): Promise<void> {
    if (this.refreshing()) return;
    this.refreshing.set(true);
    let cancelled = false;
    try {
      cancelled = (await this.action()) === false;
      if (!cancelled) {
        this.failed.set(false);
        this.updatedAt.set(new Date());
      }
    } catch {
      this.failed.set(true);
    } finally {
      this.refreshing.set(false);
    }
    if (cancelled) return;

    // Thông báo là phần phụ: tải kèm nhưng không bắt nút chờ, lỗi thì chuông giữ số cũ
    this.notificationRefresh.reloadAll();
    // Đang thu nhỏ thì bung ra 2 giây cho thấy giờ cập nhật
    this.flash.set(true);
    clearTimeout(this.flashTimer);
    // Timer chỉ để đổi giao diện: chạy ngoài zone để trang vẫn được coi là ổn định
    this.zone.runOutsideAngular(() => {
      this.flashTimer = setTimeout(() => this.zone.run(() => this.flash.set(false)), 2000);
    });
  }
}
