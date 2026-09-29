import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, RouterLink } from '@angular/router';
import { FirestoreService } from '../../services/firestore.service';
import { AuthService } from '../../services/auth.service';
import { NavbarComponent } from '../../shared/components/navbar.component';
import { TeacherNotificationBellComponent } from '../../shared/components/teacher-notification-bell.component';
import { RefreshButtonComponent } from '../../shared/components/refresh-button.component';

interface PendingAssignmentItem {
  id: string;
  title: string;
  pendingCount: number;
}

@Component({
  selector: 'app-teacher-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    RouterLink,
    NavbarComponent,
    TeacherNotificationBellComponent, RefreshButtonComponent,
  ],
  styles: [
    `
      :host {
        display: block;
        padding: 0;
        min-height: 100vh;
        background: #f1f5f9;
      }

      .layout {
        display: flex;
        min-height: 100vh;
      }

      .sidebar {
        width: 260px;
        background: #1e293b;
        color: #fff;
        display: flex;
        flex-direction: column;
        flex-shrink: 0;
      }

      .sidebar-brand {
        padding: 24px 20px;
        font-size: 1.25rem;
        font-weight: 700;
        border-bottom: 1px solid #334155;
        letter-spacing: 1px;
      }

      .sidebar-nav {
        padding: 16px 0;
        flex: 1;
      }

      .nav-item {
        display: flex;
        align-items: center;
        padding: 12px 20px;
        color: #cbd5e1;
        text-decoration: none;
        font-size: 0.95rem;
        transition: all 0.2s;
        border-left: 3px solid transparent;

        &:hover {
          background: #334155;
          color: #fff;
        }

        &.active {
          background: rgba(37, 99, 235, 0.2);
          color: #60a5fa;
          border-left-color: #2563eb;
        }
      }

      .sidebar-footer {
        padding: 16px 20px;
        border-top: 1px solid #334155;
      }

      .user-info {
        font-size: 0.85rem;
        color: #94a3b8;
        margin-bottom: 8px;

        strong {
          color: #e2e8f0;
          display: block;
        }
      }

      .logout-btn {
        width: 100%;
        padding: 8px;
        background: transparent;
        border: 1px solid #475569;
        color: #94a3b8;
        border-radius: 6px;
        cursor: pointer;
        font-size: 0.85rem;
        transition: all 0.2s;

        &:hover {
          background: #334155;
          color: #fff;
        }
      }

      .main {
        flex: 1;
        overflow-y: auto;
      }

      .header {
        background: #fff;
        padding: 20px 32px;
        border-bottom: 1px solid #e2e8f0;

        h1 {
          margin: 0;
          font-size: 1.5rem;
          color: #1e293b;
        }

        p {
          margin: 4px 0 0;
          color: #64748b;
          font-size: 0.9rem;
        }
      }

      .content {
        padding: 24px 32px;
      }

      .stats-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
        gap: 20px;
        margin-bottom: 32px;
      }

      .stat-card {
        background: #fff;
        border-radius: 12px;
        padding: 24px;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);

        .stat-label {
          font-size: 0.85rem;
          color: #64748b;
          margin-bottom: 8px;
        }

        .stat-value {
          font-size: 2rem;
          font-weight: 700;
          color: #1e293b;
        }

        .stat-icon {
          float: right;
          width: 44px;
          height: 44px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.2rem;
        }

        &:nth-child(1) .stat-icon {
          background: #dbeafe;
        }
        &:nth-child(2) .stat-icon {
          background: #fef3c7;
        }
        &:nth-child(3) .stat-icon {
          background: #d1fae5;
        }
        &:nth-child(4) .stat-icon {
          background: #ede9fe;
        }

        .stat-action {
          margin-top: 14px;
          padding-top: 10px;
          border-top: 1px dashed #e2e8f0;
        }

        .btn-view-pending {
          background: transparent;
          border: none;
          color: #2563eb;
          font-size: 0.85rem;
          font-weight: 600;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 0;
          transition: all 0.2s ease;

          &:hover:not(:disabled) {
            color: #1d4ed8;
            transform: translateX(2px);
          }

          &:disabled {
            color: #94a3b8;
            cursor: not-allowed;
            opacity: 0.6;
            transform: none;
          }
        }
      }

      .welcome-card {
        background: #fff;
        border-radius: 12px;
        padding: 32px;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);

        h2 {
          margin: 0 0 8px;
          color: #1e293b;
        }

        p {
          color: #64748b;
          margin: 0;
          line-height: 1.6;
        }
      }

      .loading-state {
        text-align: center;
        padding: 48px;
        color: #64748b;
      }

      /* Modal styles */
      .modal-backdrop {
        position: fixed;
        inset: 0;
        background: rgba(15, 23, 42, 0.6);
        backdrop-filter: blur(4px);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 9999;
        padding: 20px;
        animation: fadeIn 0.15s ease-out;
      }

      .modal-dialog {
        background: #fff;
        border-radius: 16px;
        width: 100%;
        max-width: 520px;
        max-height: 85vh;
        display: flex;
        flex-direction: column;
        box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
        overflow: hidden;
        animation: scaleUp 0.15s ease-out;
      }

      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }

      @keyframes scaleUp {
        from { transform: scale(0.96); opacity: 0; }
        to { transform: scale(1); opacity: 1; }
      }

      .modal-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 18px 24px;
        border-bottom: 1px solid #e2e8f0;
      }

      .modal-title-wrap {
        display: flex;
        align-items: center;
        gap: 12px;
      }

      .modal-title {
        font-size: 1.15rem;
        font-weight: 700;
        color: #1e293b;
        margin: 0;
      }

      .modal-badge {
        background: #fef3c7;
        color: #b45309;
        font-size: 0.75rem;
        font-weight: 600;
        padding: 3px 10px;
        border-radius: 9999px;
      }

      .modal-close-btn {
        background: transparent;
        border: none;
        color: #94a3b8;
        font-size: 1.5rem;
        line-height: 1;
        cursor: pointer;
        padding: 4px 8px;
        border-radius: 6px;
        transition: all 0.2s;

        &:hover {
          background: #f1f5f9;
          color: #1e293b;
        }
      }

      .modal-body {
        padding: 16px 24px;
        overflow-y: auto;
        max-height: 60vh;
      }

      .pending-list {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .pending-item {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 14px 16px;
        background: #f8fafc;
        border: 1px solid #e2e8f0;
        border-radius: 10px;
        cursor: pointer;
        transition: all 0.2s ease;

        &:hover {
          background: #f0fdf4;
          border-color: #86efac;
          transform: translateY(-1px);
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);

          .item-arrow {
            transform: translateX(3px);
            color: #16a34a;
          }
        }
      }

      .pending-item-info {
        flex: 1;
        min-width: 0;
        margin-right: 12px;
      }

      .pending-item-title {
        display: block;
        font-weight: 600;
        font-size: 0.95rem;
        color: #1e293b;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .pending-item-meta {
        display: flex;
        align-items: center;
        gap: 10px;
        flex-shrink: 0;
      }

      .count-badge {
        background: #fee2e2;
        color: #dc2626;
        font-size: 0.8rem;
        font-weight: 600;
        padding: 4px 10px;
        border-radius: 6px;
      }

      .item-arrow {
        color: #94a3b8;
        font-size: 1.1rem;
        transition: all 0.2s;
      }

      .empty-state {
        text-align: center;
        padding: 32px 16px;
        color: #64748b;
        font-size: 0.9rem;
      }

      .modal-footer {
        padding: 14px 24px;
        border-top: 1px solid #e2e8f0;
        display: flex;
        justify-content: flex-end;
      }

      .btn-close {
        padding: 8px 20px;
        background: #f1f5f9;
        border: 1px solid #cbd5e1;
        color: #475569;
        font-size: 0.9rem;
        font-weight: 500;
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.2s;

        &:hover {
          background: #e2e8f0;
          color: #1e293b;
        }
      }

      @media (max-width: 768px) {
        .layout {
          flex-direction: column;
        }

        .sidebar {
          width: 100%;
        }

        .stats-grid {
          grid-template-columns: 1fr 1fr;
        }

        .content {
          padding: 16px;
        }
      }
    `,
  ],
  template: `
    <div class="layout">
      <aside class="sidebar">
        <div class="sidebar-brand">MATHSHINE EDUCATION</div>
        <nav class="sidebar-nav">
          <a class="nav-item active" routerLink="/teacher/dashboard"
            >Tổng quan</a
          >
          <a class="nav-item" routerLink="/teacher/classes">Quản lý lớp</a>
          <a class="nav-item" routerLink="/teacher/groups">Quản lý nhóm</a>
          <a class="nav-item" routerLink="/teacher/students"
            >Quản lý học sinh</a
          >
          <a class="nav-item" routerLink="/teacher/assignments">Bài tập</a>
          <a class="nav-item" routerLink="/teacher/discussions">Thảo luận</a>
          <a class="nav-item" routerLink="/teacher/statistics">Thống kê</a>
          <a class="nav-item" routerLink="/teacher/hidden-assignments">Ẩn bài tập</a>
          <a class="nav-item" routerLink="/teacher/profile">Hồ sơ</a>
          <teacher-notification-bell />
        </nav>
        <div class="sidebar-footer">
          <div
            class="user-info"
            style="display:flex;align-items:center;gap:10px;"
          >
            @if (userAvatar) {
              <div
                style="width:36px;height:36px;border-radius:50%;overflow:hidden;background:#334155;flex-shrink:0;"
              >
                <img
                  [src]="userAvatar"
                  alt=""
                  style="width:100%;height:100%;object-fit:cover;"
                />
              </div>
            } @else {
              <div
                style="width:36px;height:36px;border-radius:50%;background:#334155;display:flex;align-items:center;justify-content:center;font-size:1rem;color:#94a3b8;flex-shrink:0;"
              >
                {{ userFullName.charAt(0) || 'G' }}
              </div>
            }
            <div>
              <strong>{{ userFullName }}</strong>
              {{ userSubject }}
            </div>
          </div>
          <button class="logout-btn" (click)="logout()">Đăng xuất</button>
        </div>
      </aside>

      <main class="main">
        <div class="header">
          <app-refresh-button [action]="refresh" />
          <h1>Tổng quan</h1>
          <p>Chào mừng trở lại, {{ userFullName }}</p>
        </div>

        <div class="content">
          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-icon">HS</div>
              <div class="stat-label">Tổng số học sinh</div>
              <div class="stat-value">{{ totalStudents }}</div>
            </div>
            <div class="stat-card">
              <div class="stat-icon">P</div>
              <div class="stat-label">Bài chờ chấm</div>
              <div class="stat-value">{{ pendingSubmissions }}</div>
              <div class="stat-action">
                <button
                  type="button"
                  class="btn-view-pending"
                  [disabled]="pendingSubmissions === 0"
                  (click)="openPendingModal()"
                >
                  Xem chi tiết <span>&rarr;</span>
                </button>
              </div>
            </div>
            <div class="stat-card">
              <div class="stat-icon">D</div>
              <div class="stat-label">Đã chấm hôm nay</div>
              <div class="stat-value">{{ gradedToday }}</div>
            </div>
            <div class="stat-card">
              <div class="stat-icon">TB</div>
              <div class="stat-label">Điểm trung bình</div>
              <div class="stat-value">{{ averageScore }}</div>
            </div>
          </div>

          <div class="welcome-card">
            <h2>Hệ thống MathShine Check</h2>
            <p>
              Quản lý lớp học, nhóm, học sinh, giao bài tập và chấm điểm trực
              tuyến một cách dễ dàng. Sử dụng thanh điều hướng bên trái để truy
              cập các chức năng.
            </p>
          </div>
        </div>
      </main>

      <!-- Modal Danh sách bài tập chờ chấm -->
      @if (showPendingModal) {
        <div class="modal-backdrop" (click)="closePendingModal()">
          <div class="modal-dialog" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <div class="modal-title-wrap">
                <h3 class="modal-title">Bài tập chờ chấm</h3>
                <span class="modal-badge">{{ pendingSubmissions }} bài cần chấm</span>
              </div>
              <button
                type="button"
                class="modal-close-btn"
                (click)="closePendingModal()"
                title="Đóng"
              >
                &times;
              </button>
            </div>

            <div class="modal-body">
              @if (pendingLoading) {
                <div class="empty-state">Đang tải...</div>
              } @else if (pendingAssignments.length === 0) {
                <div class="empty-state">
                  Hiện không có bài tập nào đang chờ chấm.
                </div>
              } @else {
                <div class="pending-list">
                  @for (item of pendingAssignments; track item.id) {
                    <div
                      class="pending-item"
                      (click)="openAssignmentDetail(item.id)"
                      role="button"
                      tabindex="0"
                      title="Mở trang chấm bài trong tab mới"
                    >
                      <div class="pending-item-info">
                        <span class="pending-item-title">{{ item.title }}</span>
                      </div>
                      <div class="pending-item-meta">
                        <span class="count-badge">{{ item.pendingCount }} bài</span>
                        <span class="item-arrow">&rarr;</span>
                      </div>
                    </div>
                  }
                </div>
              }
            </div>

            <div class="modal-footer">
              <button
                type="button"
                class="btn-close"
                (click)="closePendingModal()"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
})
export class TeacherDashboardComponent implements OnInit {
  private firestoreService = inject(FirestoreService);
  private authService = inject(AuthService);
  private router = inject(Router);

  userFullName = '';
  userSubject = '';
  userAvatar = '';

  totalStudents = 0;
  pendingSubmissions = 0;
  pendingAssignments: PendingAssignmentItem[] = [];
  showPendingModal = false;
  pendingLoading = false;
  gradedToday = 0;
  averageScore = 'N/A';

  ngOnInit(): void {
    const profile = this.authService.currentProfile;
    if (profile) {
      this.userFullName = profile.fullName;
      this.userSubject = profile.subject || '';
      if (profile.uid) {
        this.firestoreService
          .getDocById('teachers', profile.uid)
          .then((doc) => {
            if (doc?.avatarUrl) this.userAvatar = doc.avatarUrl;
          })
          .catch(() => {});
      }
    }

    this.loadStats().catch(() => {});
  }

  async openPendingModal(): Promise<void> {
    if (this.pendingSubmissions === 0) return;
    this.showPendingModal = true;
    this.pendingLoading = true;
    try {
      await this.loadPendingAssignments();
    } catch {
      this.pendingAssignments = [];
    } finally {
      this.pendingLoading = false;
    }
  }

  /** Làm mới các ô số; popup chờ chấm đang mở thì tải lại luôn danh sách trong đó. */
  refresh = async (): Promise<void> => {
    await this.loadStats();
    if (this.showPendingModal) await this.loadPendingAssignments();
  };

  private async loadPendingAssignments(): Promise<void> {
    const submissions = await this.firestoreService.getPendingSubmissions();
    const countByAssignment = new Map<string, number>();
    submissions.forEach((s) =>
      countByAssignment.set(s.assignmentId, (countByAssignment.get(s.assignmentId) || 0) + 1),
    );
    const assignments = await this.firestoreService.getAssignmentsByIds([
      ...countByAssignment.keys(),
    ]);
    this.pendingAssignments = assignments
      .map((a) => ({
        id: a.id,
        title: a.title || 'Bài tập không có tiêu đề',
        pendingCount: countByAssignment.get(a.id) || 0,
      }))
      .sort((a, b) => b.pendingCount - a.pendingCount);
  }

  closePendingModal(): void {
    this.showPendingModal = false;
  }

  openAssignmentDetail(assignmentId: string): void {
    window.open(`/teacher/assignments/${assignmentId}`, '_blank');
  }

  private async loadStats(): Promise<void> {
    const stats = await this.firestoreService.getDashboardStats();
    this.totalStudents = stats.totalStudents;
    this.pendingSubmissions = stats.pendingSubmissions;
    this.gradedToday = stats.gradedToday;
    this.averageScore =
      stats.averageScore === null ? 'N/A' : stats.averageScore.toFixed(1);
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/role-select']);
  }
}
