import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { FirestoreService } from '../../services/firestore.service';
import { AuthService } from '../../services/auth.service';
import { NavbarComponent } from '../../shared/components/navbar.component';
import { TeacherNotificationBellComponent } from '../../shared/components/teacher-notification-bell.component';
import { SchoolClass, Group, Assignment } from '../../models';

@Component({
  selector: 'app-assignment-management',
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
        max-width: 1000px;
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

      .filters-row {
        display: flex;
        gap: 12px;
        flex-wrap: wrap;
      }

      .form-group {
        flex: 1;
        min-width: 150px;

        label {
          display: block;
          font-size: 0.85rem;
          font-weight: 500;
          color: #475569;
          margin-bottom: 6px;
        }
      }

      .form-input,
      .form-select,
      .form-textarea {
        width: 100%;
        padding: 10px 14px;
        border: 1px solid #cbd5e1;
        border-radius: 8px;
        font-size: 0.95rem;
        outline: none;
        transition: border-color 0.2s;
        box-sizing: border-box;
        background: #fff;
        font-family: inherit;

        &:focus {
          border-color: #2563eb;
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
        }
      }

      .form-textarea {
        resize: vertical;
        min-height: 80px;
      }

      .form-row {
        display: flex;
        gap: 12px;
        align-items: flex-end;
        flex-wrap: wrap;
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
        text-decoration: none;
        display: inline-block;
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
        font-size: 0.8rem;
        padding: 6px 14px;

        &:hover {
          background: #f1f5f9;
        }
      }

      .btn-sm {
        padding: 6px 14px;
        font-size: 0.8rem;
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

      .td-actions {
        display: flex;
        gap: 8px;
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
        .form-row {
          flex-direction: column;
        }
        .filters-row {
          flex-direction: column;
        }
        .form-group {
          min-width: 100%;
        }
      }
    `,
  ],
  template: `
    <div class="layout">
      <aside class="sidebar">
        <div class="sidebar-brand">MMATHSHINE EDUCATION</div>
        <nav class="sidebar-nav">
          <a class="nav-item" routerLink="/teacher/dashboard">Tổng quan</a>
          <a class="nav-item" routerLink="/teacher/classes">Quản lý lớp</a>
          <a class="nav-item" routerLink="/teacher/groups">Quản lý nhóm</a>
          <a class="nav-item" routerLink="/teacher/students"
            >Quản lý học sinh</a
          >
          <a class="nav-item active" routerLink="/teacher/assignments"
            >Bài tập</a
          >
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
          <h1>Quản lý bài tập</h1>
        </div>

        <div class="content">
          <div class="card">
            <h3 class="card-title">Bộ lọc</h3>
            <div class="filters-row">
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
              <div class="form-group">
                <label>Nhóm</label>
                <select
                  class="form-select"
                  [(ngModel)]="selectedGroupId"
                  (change)="onGroupChange()"
                >
                  <option value="">-- Chọn nhóm --</option>
                  <option *ngFor="let g of filteredGroups" [value]="g.id">
                    {{ g.name }}
                  </option>
                </select>
              </div>
            </div>
          </div>

          <div class="card" *ngIf="selectedGroupId">
            <h3 class="card-title">Tạo bài tập mới</h3>
            <div class="form-row">
              <div class="form-group">
                <label>Tiêu đề</label>
                <input
                  class="form-input"
                  [(ngModel)]="newAssignment.title"
                  placeholder="Ví dụ: Bài tập tuần 1"
                />
              </div>
              <div class="form-group">
                <label>Ngày học</label>
                <input
                  class="form-input"
                  [(ngModel)]="newAssignment.sessionDate"
                  type="date"
                />
              </div>
            </div>
            <div class="form-group" style="margin-top: 12px;">
              <label>Mô tả</label>
              <textarea
                class="form-textarea"
                [(ngModel)]="newAssignment.description"
                placeholder="Mô tả nội dung bài tập..."
              ></textarea>
            </div>
            <div style="margin-top: 16px;">
              <button
                class="btn btn-primary"
                (click)="createNewAssignment()"
                [disabled]="
                  !newAssignment.title.trim() ||
                  !newAssignment.sessionDate ||
                  saving
                "
              >
                {{ saving ? 'Đang tạo...' : 'Tạo bài tập' }}
              </button>
            </div>
          </div>

          <div class="card" *ngIf="selectedGroupId">
            <h3 class="card-title">
              Danh sách bài tập ({{ assignments.length }})
            </h3>

            <div *ngIf="loading" class="loading-state">Đang tải...</div>

            <table class="table" *ngIf="!loading && assignments.length > 0">
              <thead>
                <tr>
                  <th>Tiêu đề</th>
                  <th>Ngày học</th>
                  <th>Mô tả</th>
                  <th>Ngày tạo</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let a of assignments">
                  <td>
                    <strong>{{ a.title }}</strong>
                  </td>
                  <td>{{ a.sessionDate | date: 'dd/MM/yyyy' }}</td>
                  <td>
                    {{ a.description | slice: 0 : 60
                    }}{{ a.description.length > 60 ? '...' : '' }}
                  </td>
                  <td>{{ a.createdAt | date: 'dd/MM/yyyy' }}</td>
                  <td>
                    <div class="td-actions">
                      <button
                        class="btn btn-outline btn-sm"
                        (click)="viewDetail(a.id)"
                      >
                        Xem
                      </button>
                      <button class="btn btn-danger" (click)="confirmDelete(a)">
                        Xóa
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>

            <div
              class="empty-state"
              *ngIf="!loading && assignments.length === 0"
            >
              Chưa có bài tập nào trong nhóm này.
            </div>
          </div>
        </div>
      </main>
    </div>

    <div class="dialog-overlay" *ngIf="deleteTarget" (click)="cancelDelete()">
      <div class="dialog" (click)="$event.stopPropagation()">
        <h3>Xác nhận xóa</h3>
        <p>
          Bạn có chắc chắn muốn xóa bài tập
          <strong>{{ deleteTarget.title }}</strong
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
export class AssignmentManagementComponent implements OnInit {
  private firestoreService = inject(FirestoreService);
  private authService = inject(AuthService);
  private router = inject(Router);

  classes: SchoolClass[] = [];
  allGroups: Group[] = [];
  filteredGroups: Group[] = [];
  assignments: Assignment[] = [];
  selectedClassId = '';
  selectedGroupId = '';
  loading = false;
  saving = false;
  deleteTarget: Assignment | null = null;

  newAssignment = {
    title: '',
    sessionDate: '',
    description: '',
  };

  userFullName = '';
  userSubject = '';

  ngOnInit(): void {
    const profile = this.authService.currentProfile;
    if (profile) {
      this.userFullName = profile.fullName;
      this.userSubject = profile.subject || '';
    }

    this.firestoreService.getClasses().subscribe((classesData) => {
      this.classes = classesData;
    });

    this.firestoreService.getAllGroups().subscribe((groupsData) => {
      this.allGroups = groupsData;
    });
  }

  onClassChange(): void {
    this.selectedGroupId = '';
    this.assignments = [];
    if (!this.selectedClassId) {
      this.filteredGroups = [];
      return;
    }
    this.filteredGroups = this.allGroups.filter(
      (g) => g.classId === this.selectedClassId,
    );
  }

  onGroupChange(): void {
    if (!this.selectedGroupId) {
      this.assignments = [];
      return;
    }
    this.loadAssignments();
  }

  loadAssignments(): void {
    this.loading = true;
    this.firestoreService
      .getAssignmentsByGroup(this.selectedGroupId)
      .subscribe({
        next: (data) => {
          this.assignments = data;
          this.loading = false;
        },
        error: () => {
          this.loading = false;
        },
      });
  }

  createNewAssignment(): void {
    if (
      !this.newAssignment.title.trim() ||
      !this.newAssignment.sessionDate ||
      !this.selectedGroupId
    )
      return;

    this.saving = true;
    const profile = this.authService.currentProfile;

    this.firestoreService
      .createAssignment({
        title: this.newAssignment.title.trim(),
        sessionDate: this.newAssignment.sessionDate,
        description: this.newAssignment.description.trim(),
        groupId: this.selectedGroupId,
        createdBy: profile?.uid || '',
      })
      .then(() => {
        this.newAssignment = { title: '', sessionDate: '', description: '' };
        this.saving = false;
        this.loadAssignments();
      })
      .catch(() => {
        this.saving = false;
      });
  }

  viewDetail(assignmentId: string): void {
    this.router.navigate(['/teacher/assignments', assignmentId]);
  }

  confirmDelete(a: Assignment): void {
    this.deleteTarget = a;
  }

  cancelDelete(): void {
    this.deleteTarget = null;
  }

  executeDelete(): void {
    if (!this.deleteTarget) return;
    this.firestoreService.deleteAssignmentCascade(this.deleteTarget.id).then(() => {
      this.deleteTarget = null;
      this.loadAssignments();
    });
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/role-select']);
  }
}
