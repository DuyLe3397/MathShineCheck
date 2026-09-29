import { Component, HostBinding, Input, signal } from '@angular/core';
import { DatePipe } from '@angular/common';

/**
 * Nút "Làm mới" đặt trong .header của trang giáo viên: gọi lại hàm tải dữ liệu của trang
 * mà không tải lại cả trang. `action` trả về false khi người dùng hủy (ví dụ không muốn
 * bỏ thay đổi chưa lưu) thì giữ nguyên mốc "Cập nhật lúc"; ném lỗi thì báo thất bại.
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
      Làm mới
    </button>
  `,
  styles: [
    `
      /* float cho header dạng block, order + margin-left cho header dạng flex */
      :host {
        float: right;
        order: 99;
        margin: -4px 0 -4px auto;
        display: inline-flex;
        align-items: center;
        gap: 10px;
      }
      .status {
        font-size: 0.8rem;
        color: #64748b;
        white-space: nowrap;
      }
      .status.error {
        color: #dc2626;
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
        transition: background 0.15s ease;
        &:hover:not(:disabled) {
          background: #f1f5f9;
        }
        &:disabled {
          opacity: 0.55;
          cursor: not-allowed;
        }
      }
      :host(.on-dark) .status {
        color: rgba(255, 255, 255, 0.85);
      }
      :host(.on-dark) .status.error {
        color: #fecaca;
      }
      :host(.on-dark) .refresh-btn {
        background: transparent;
        color: #fff;
        border: 1.5px solid rgba(255, 255, 255, 0.5);
        &:hover:not(:disabled) {
          background: rgba(255, 255, 255, 0.15);
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
export class RefreshButtonComponent {
  @Input({ required: true }) action!: () => Promise<boolean | void>;
  @Input() disabled = false;
  /** Đặt trên nền tối (header xanh của trang chấm bài). */
  @HostBinding('class.on-dark') @Input() onDark = false;

  refreshing = signal(false);
  updatedAt = signal<Date | null>(null);
  failed = signal(false);

  async run(): Promise<void> {
    if (this.refreshing()) return;
    this.refreshing.set(true);
    try {
      const done = await this.action();
      if (done !== false) {
        this.failed.set(false);
        this.updatedAt.set(new Date());
      }
    } catch {
      this.failed.set(true);
    } finally {
      this.refreshing.set(false);
    }
  }
}
