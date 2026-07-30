import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { FirestoreService } from '../../services/firestore.service';
import { AuthService } from '../../services/auth.service';
import { NavbarComponent } from '../../shared/components/navbar.component';
import { SchoolClass } from '../../models';

@Component({
  selector: 'app-class-management',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, NavbarComponent],
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

      .form-input {
        width: 100%;
        padding: 10px 14px;
        border: 1px solid #cbd5e1;
        border-radius: 8px;
        font-size: 0.95rem;
        outline: none;
        transition: border-color 0.2s;
        box-sizing: border-box;

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
          <a class="nav-item active" routerLink="/teacher/classes"
            >Quản lý lớp</a
          >
          <a class="nav-item" routerLink="/teacher/groups">Quản lý nhóm</a>
          <a class="nav-item" routerLink="/teacher/students"
            >Quản lý học sinh</a
          >
          <a class="nav-item" routerLink="/teacher/assignments">Bài tập</a>
          <a class="nav-item" routerLink="/teacher/discussions">Thảo luận</a>
          <a class="nav-item" routerLink="/teacher/statistics">Thống kê</a>
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
          <h1>Quản lý lớp</h1>
        </div>

        <div class="content">
          <div class="card">
            <h3 class="card-title">Thêm lớp mới</h3>
            <div class="form-row">
              <div class="form-group">
                <label>Tên lớp</label>
                <input
                  class="form-input"
                  [(ngModel)]="newClassName"
                  placeholder="Ví dụ: Lớp 10A1"
                  (keyup.enter)="addClass()"
                />
              </div>
              <div class="form-group-btn">
                <label>Tên lớp</label>
                <button
                  class="btn btn-primary"
                  (click)="addClass()"
                  [disabled]="!newClassName.trim() || loading"
                >
                  Thêm lớp
                </button>
              </div>
            </div>
          </div>

          <div class="card">
            <h3 class="card-title">Danh sách lớp ({{ classes.length }})</h3>

            <div *ngIf="loading" class="loading-state">Đang tải...</div>

            <table class="table" *ngIf="!loading && classes.length > 0">
              <thead>
                <tr>
                  <th>Tên lớp</th>
                  <th>Ngày tạo</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let c of classes">
                  <td>{{ c.name }}</td>
                  <td>{{ c.createdAt | date: 'dd/MM/yyyy' }}</td>
                  <td>
                    <button class="btn btn-danger" (click)="confirmDelete(c)">
                      Xóa
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>

            <div class="empty-state" *ngIf="!loading && classes.length === 0">
              Chưa có lớp nào. Hãy thêm lớp đầu tiên.
            </div>
          </div>
        </div>
      </main>
    </div>

    <div class="dialog-overlay" *ngIf="deleteTarget" (click)="cancelDelete()">
      <div class="dialog" (click)="$event.stopPropagation()">
        <h3>Xác nhận xóa</h3>
        <p>
          Bạn có chắc chắn muốn xóa lớp <strong>{{ deleteTarget.name }}</strong
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
export class ClassManagementComponent implements OnInit {
  private firestoreService = inject(FirestoreService);
  private authService = inject(AuthService);
  private router = inject(Router);

  classes: SchoolClass[] = [];
  newClassName = '';
  loading = false;
  deleteTarget: SchoolClass | null = null;

  userFullName = '';
  userSubject = '';

  ngOnInit(): void {
    const profile = this.authService.currentProfile;
    if (profile) {
      this.userFullName = profile.fullName;
      this.userSubject = profile.subject || '';
    }
    this.loadClasses();
  }

  loadClasses(): void {
    this.loading = true;
    this.firestoreService.getClasses().subscribe({
      next: (data) => {
        this.classes = data;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      },
    });
  }

  addClass(): void {
    const name = this.newClassName.trim();
    if (!name) return;

    const profile = this.authService.currentProfile;
    this.firestoreService
      .createClass({
        name,
        createdBy: profile?.uid || '',
      })
      .then(() => {
        this.newClassName = '';
        this.loadClasses();
      });
  }

  confirmDelete(c: SchoolClass): void {
    this.deleteTarget = c;
  }

  cancelDelete(): void {
    this.deleteTarget = null;
  }

  executeDelete(): void {
    if (!this.deleteTarget) return;
    this.firestoreService.deleteClass(this.deleteTarget.id).then(() => {
      this.deleteTarget = null;
      this.loadClasses();
    });
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/role-select']);
  }
}
