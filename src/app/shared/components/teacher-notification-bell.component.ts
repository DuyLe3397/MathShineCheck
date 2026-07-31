import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { FirestoreService } from '../../services/firestore.service';
import { TeacherNotification } from '../../models';

@Component({
  selector: 'teacher-notification-bell',
  standalone: true,
  imports: [CommonModule, RouterModule],
  styles: [
    `
      .notif-nav-item {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 12px 20px;
        color: #cbd5e1;
        text-decoration: none;
        font-size: 0.95rem;
        transition: all 0.2s;
        border-left: 3px solid transparent;
        cursor: pointer;
        position: relative;
        background: none;
        border-top: none;
        border-right: none;
        border-bottom: none;
        width: 100%;
        text-align: left;
      }
      .notif-nav-item:hover {
        background: #334155;
        color: #fff;
      }
      .notif-badge {
        background: #ef4444;
        color: #fff;
        font-weight: 800;
        font-size: 0.68rem;
        padding: 1px 6px;
        border-radius: 8px;
        line-height: 1.3;
      }
      .notif-overlay {
        position: fixed;
        inset: 0;
        z-index: 150;
        background: rgba(0, 0, 0, 0.2);
      }
      .notif-popup {
        position: fixed;
        left: 20px;
        top: 20px;
        width: 340px;
        max-height: 70vh;
        background: #fff;
        border-radius: 12px;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.25);
        z-index: 200;
        overflow-y: auto;
      }
      .notif-header {
        padding: 14px 16px;
        font-weight: 700;
        font-size: 0.95rem;
        color: #1e293b;
        border-bottom: 1px solid #f1f5f9;
        position: sticky;
        top: 0;
        background: #fff;
      }
      .notif-empty {
        padding: 2rem 1rem;
        text-align: center;
        color: #94a3b8;
        font-size: 0.85rem;
      }
      .notif-item {
        padding: 12px 16px;
        border-bottom: 1px solid #f1f5f9;
        cursor: pointer;
        transition: background 0.15s;
        border-left: 3px solid transparent;
      }
      .notif-item.unread {
        border-left: 3px solid #ef4444;
      }
      .notif-item:hover {
        background: #f8fafc;
      }
      .notif-item-type {
        font-size: 0.68rem;
        font-weight: 700;
        display: inline-block;
        padding: 2px 8px;
        border-radius: 6px;
        margin-bottom: 4px;
      }
      .type-discussion {
        background: #dbeafe;
        color: #2563eb;
      }
      .type-submission {
        background: #fef3c7;
        color: #d97706;
      }
      .notif-item-author {
        font-weight: 600;
        font-size: 0.85rem;
        color: #1e293b;
      }
      .notif-item-content {
        font-size: 0.8rem;
        color: #64748b;
        margin-top: 2px;
        overflow: hidden;
        text-overflow: ellipsis;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
      }
      .notif-item-time {
        font-size: 0.7rem;
        color: #94a3b8;
        margin-top: 4px;
      }
    `,
  ],
  template: `
    <button class="notif-nav-item" (click)="togglePopup()">
      <span>Thông báo</span>
      @if (unreadCount() > 0) {
        <span class="notif-badge">+{{ unreadCount() }}</span>
      }
    </button>

    @if (popupOpen()) {
      <div class="notif-overlay" (click)="closePopup()"></div>
      <div class="notif-popup">
        <div class="notif-header">
          Lịch sử thông báo
          @if (unreadCount() > 0) {
            <span class="notif-badge" style="margin-left:6px;">+{{ unreadCount() }} chưa đọc</span>
          }
        </div>
        @if (notifications().length === 0) {
          <div class="notif-empty">Chưa có thông báo nào</div>
        }
        @for (n of notifications(); track n.id) {
          <div
            class="notif-item"
            [class.unread]="!n.isRead"
            (click)="openNotification(n)"
          >
            <div>
              <span class="notif-item-type" [class.type-discussion]="n.type === 'discussion'" [class.type-submission]="n.type === 'submission'">
                {{ n.type === 'discussion' ? '💬 Thảo luận' : '📝 Bài làm' }}
              </span>
            </div>
            <div class="notif-item-author">{{ n.authorName }}</div>
            <div class="notif-item-content">{{ n.content }}</div>
            <div class="notif-item-time">{{ n.createdAt | date: 'dd/MM/yyyy HH:mm' }}</div>
          </div>
        }
      </div>
    }
  `,
})
export class TeacherNotificationBellComponent implements OnInit {
  private authService = inject(AuthService);
  private firestoreService = inject(FirestoreService);
  private router = inject(Router);

  notifications = signal<TeacherNotification[]>([]);
  popupOpen = signal(false);

  unreadCount = signal(0);

  ngOnInit(): void {
    const profile = this.authService.currentProfile;
    if (!profile?.uid) return;
    this.firestoreService.getNotificationsForTeacher(profile.uid).subscribe((items) => {
      this.notifications.set(items);
      this.unreadCount.set(items.filter((n) => !n.isRead).length);
    });
  }

  togglePopup(): void {
    this.popupOpen.update((v) => !v);
  }

  closePopup(): void {
    this.popupOpen.set(false);
  }

  openNotification(n: TeacherNotification): void {
    this.closePopup();
    this.firestoreService.markNotificationRead(n.id).catch(() => {});
    this.notifications.update((list) =>
      list.map((x) => (x.id === n.id ? { ...x, isRead: true } : x)),
    );
    this.unreadCount.update((c) => Math.max(0, c - 1));

    if (n.type === 'submission' && n.submissionId) {
      this.router.navigate(['/teacher/grade', n.submissionId], {
        queryParams: { comment: n.imageIndex ?? 0 },
      });
    } else if (n.type === 'discussion' && n.discussionId) {
      this.router.navigate(['/teacher/discussions'], {
        queryParams: { discussion: n.discussionId, reply: n.replyId || '' },
      });
    }
  }
}
