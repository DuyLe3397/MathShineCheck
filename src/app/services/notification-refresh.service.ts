import { Injectable } from '@angular/core';

/**
 * Cầu nối giữa nút "Làm mới" và mục Thông báo ở sidebar giáo viên: mục Thông báo đang hiện
 * trên trang thì đăng ký hàm tải lại, nút Làm mới gọi kèm. Trang không có mục Thông báo
 * (ví dụ trang chấm bài) thì không tốn thêm lượt đọc nào.
 */
@Injectable({ providedIn: 'root' })
export class NotificationRefreshService {
  private reloaders = new Set<() => Promise<void>>();

  /** Trả về hàm hủy đăng ký, gọi khi component bị hủy. */
  register(reload: () => Promise<void>): () => void {
    this.reloaders.add(reload);
    return () => this.reloaders.delete(reload);
  }

  /** Tải lại mọi mục Thông báo đang hiện; lỗi được nuốt vì thông báo chỉ là phần phụ. */
  async reloadAll(): Promise<void> {
    await Promise.allSettled([...this.reloaders].map((reload) => reload()));
  }
}
