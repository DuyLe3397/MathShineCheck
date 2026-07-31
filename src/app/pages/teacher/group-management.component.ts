import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { FirestoreService } from '../../services/firestore.service';
import { AuthService } from '../../services/auth.service';
import { NavbarComponent } from '../../shared/components/navbar.component';
import { TeacherNotificationBellComponent } from '../../shared/components/teacher-notification-bell.component';
import { SchoolClass, Group } from '../../models';

@Component({
  selector: 'app-group-management',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, NavbarComponent, TeacherNotificationBellComponent],
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
      }

      .content {
        padding: 24px 32px;
        max-width: 900px;
      }

      .card {
        background: #fff;
        border-radius: 12px;
        padding: 24px;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
        margin-bottom: 20px;
      }

      .card-title {
        font-size: 1.1rem;
        font-weight: 600;
        color: #1e293b;
        margin: 0 0 16px;
      }

      .form-row {
        display: grid;
        grid-template-columns: 1fr auto;
        gap: 12px;
      }

      .form-group {
        min-width: 0;

        label {
          display: block;
          font-size: 0.85rem;
          font-weight: 500;
          color: #475569;
          margin-bottom: 6px;
          line-height: 1.2;
        }
      }

      .form-group-btn {
        min-width: 0;

        label {
          display: block;
          font-size: 0.85rem;
          font-weight: 500;
          margin-bottom: 6px;
          line-height: 1.2;
          visibility: hidden;
        }
      }

      .form-input,
      .form-select {
        width: 100%;
        padding: 10px 14px;
        border: 1px solid #cbd5e1;
        border-radius: 8px;
        font-size: 0.95rem;
        outline: none;
        transition: border-color 0.2s;
        box-sizing: border-box;
        background: #fff;

        &:focus {
          border-color: #2563eb;
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
        }
      }

      .btn {
        padding: 10px 20px;
        border: none;
        border-radius: 8px;
        font-size: 0.9rem;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s;
        white-space: nowrap;
        justify-self: start;
      }

      .btn-primary {
        background: #2563eb;
        color: #fff;

        &:hover {
          background: #1d4ed8;
        }

        &:disabled {
          background: #94a3b8;
          cursor: not-allowed;
        }
      }

      .btn-danger {
        background: #ef4444;
        color: #fff;
        padding: 6px 14px;
        font-size: 0.8rem;

        &:hover {
          background: #dc2626;
        }
      }

      .btn-outline {
        background: transparent;
        border: 1px solid #cbd5e1;
        color: #475569;

        &:hover {
          background: #f1f5f9;
        }
      }

      .table {
        width: 100%;
        border-collapse: collapse;

        th,
        td {
          padding: 12px 16px;
          text-align: left;
          border-bottom: 1px solid #e2e8f0;
          font-size: 0.9rem;
        }

        th {
          color: #64748b;
          font-weight: 600;
          font-size: 0.8rem;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        td {
          color: #334155;
        }
      }

      .empty-state {
        text-align: center;
        padding: 40px 20px;
        color: #94a3b8;
        font-size: 0.95rem;
      }

      .dialog-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
      }

      .dialog {
        background: #fff;
        border-radius: 16px;
        padding: 32px;
        max-width: 420px;
        width: 90%;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);

        h3 {
          margin: 0 0 12px;
          color: #1e293b;
        }

        p {
          color: #64748b;
          margin: 0 0 24px;
          line-height: 1.5;
        }
      }

      .dialog-actions {
        display: flex;
        gap: 12px;
        justify-content: flex-end;
      }

      .loading-state {
        text-align: center;
        padding: 24px;
        color: #64748b;
      }

      @media (max-width: 768px) {
        .layout {
          flex-direction: column;
        }
        .sidebar {
          width: 100%;
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
          <a class="nav-item" routerLink="/teacher/dashboard">Tổng quan</a>
          <a class="nav-item" routerLink="/teacher/classes">Quản lý lớp</a>
          <a class="nav-item active" routerLink="/teacher/groups"
            >Quản lý nhóm</a
          >
          <a class="nav-item" routerLink="/teacher/students"
            >Quản lý học sinh</a
          >
          <a class="nav-item" routerLink="/teacher/assignments">Bài tập</a>
          <a class="nav-item" routerLink="/teacher/discussions">Thảo luận</a>
          <a class="nav-item" routerLink="/teacher/statistics">Thống kê</a>
          <teacher-notification-bell />
        </nav>
        <div class="sidebar-footer">
          <div class="user-info">
            <strong>{{ userFullName }}</strong>
            {{ userSubject }}
          </div>
          <button class="logout-btn" (click)="logout()">Đăng xuất</button>
        </div>
      </aside>

      <main class="main">
        <div class="header">
          <h1>Quản lý nhóm</h1>
        </div>

        <div class="content">
          <div class="card">
            <h3 class="card-title">Chọn lớp</h3>
            <div class="form-group">
              <label>Lớp</label>
              <select
                class="form-select"
                [(ngModel)]="selectedClassId"
                (change)="onClassChange()"
              >
                <option value="">-- Chọn lớp --</option>
                <option *ngFor="let c of classes" [value]="c.id">
                  {{ c.name }}
                </option>
              </select>
            </div>
          </div>

          <div class="card" *ngIf="selectedClassId">
            <h3 class="card-title">Thêm nhóm mới</h3>
            <div class="form-row">
              <div class="form-group">
                <label>Tên nhóm</label>
                <input
                  class="form-input"
                  [(ngModel)]="newGroupName"
                  placeholder="Ví dụ: Nhóm 1"
                  (keyup.enter)="addGroup()"
                />
              </div>
              <div class="form-group-btn">
                <label>Tên nhóm</label>
                <button
                  class="btn btn-primary"
                  (click)="addGroup()"
                  [disabled]="!newGroupName.trim() || loading"
                >
                  Thêm nhóm
                </button>
              </div>
            </div>
          </div>

          <div class="card" *ngIf="selectedClassId">
            <h3 class="card-title">Danh sách nhóm ({{ groups.length }})</h3>

            <div *ngIf="loading" class="loading-state">Đang tải...</div>

            <table class="table" *ngIf="!loading && groups.length > 0">
              <thead>
                <tr>
                  <th>Tên nhóm</th>
                  <th>Ngày tạo</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let g of groups">
                  <td>{{ g.name }}</td>
                  <td>{{ g.createdAt | date: 'dd/MM/yyyy' }}</td>
                  <td>
                    <button class="btn btn-danger" (click)="confirmDelete(g)">
                      Xóa
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>

            <div class="empty-state" *ngIf="!loading && groups.length === 0">
              Chưa có nhóm nào trong lớp này.
            </div>
          </div>
        </div>
      </main>
    </div>

    <div class="dialog-overlay" *ngIf="deleteTarget" (click)="cancelDelete()">
      <div class="dialog" (click)="$event.stopPropagation()">
        <h3>Xác nhận xóa</h3>
        <p>
          Bạn có chắc chắn muốn xóa nhóm <strong>{{ deleteTarget.name }}</strong
          >? Hành động này không thể hoàn tác.
        </p>
        <div class="dialog-actions">
          <button class="btn btn-outline" (click)="cancelDelete()">Hủy</button>
          <button class="btn btn-danger" (click)="executeDelete()">Xóa</button>
        </div>
      </div>
    </div>
  `,
})
export class GroupManagementComponent implements OnInit {
  private firestoreService = inject(FirestoreService);
  private authService = inject(AuthService);
  private router = inject(Router);

  classes: SchoolClass[] = [];
  groups: Group[] = [];
  selectedClassId = '';
  newGroupName = '';
  loading = false;
  deleteTarget: Group | null = null;

  userFullName = '';
  userSubject = '';

  ngOnInit(): void {
    const profile = this.authService.currentProfile;
    if (profile) {
      this.userFullName = profile.fullName;
      this.userSubject = profile.subject || '';
    }
    this.firestoreService.getClasses().subscribe((data) => {
      this.classes = data;
    });
  }

  onClassChange(): void {
    if (!this.selectedClassId) {
      this.groups = [];
      return;
    }
    this.loadGroups();
  }

  loadGroups(): void {
    this.loading = true;
    this.firestoreService.getGroupsByClass(this.selectedClassId).subscribe({
      next: (data) => {
        this.groups = data;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      },
    });
  }

  addGroup(): void {
    const name = this.newGroupName.trim();
    if (!name || !this.selectedClassId) return;

    const profile = this.authService.currentProfile;
    this.firestoreService
      .createGroup({
        name,
        classId: this.selectedClassId,
        teacherIds: profile?.uid ? [profile.uid] : [],
      })
      .then(() => {
        this.newGroupName = '';
        this.loadGroups();
      });
  }

  confirmDelete(g: Group): void {
    this.deleteTarget = g;
  }

  cancelDelete(): void {
    this.deleteTarget = null;
  }

  executeDelete(): void {
    if (!this.deleteTarget) return;
    this.firestoreService.deleteGroup(this.deleteTarget.id).then(() => {
      this.deleteTarget = null;
      this.loadGroups();
    });
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/role-select']);
  }
}
