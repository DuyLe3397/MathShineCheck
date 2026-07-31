import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { FirestoreService } from '../../services/firestore.service';
import { AuthService } from '../../services/auth.service';
import { NavbarComponent } from '../../shared/components/navbar.component';
import { TeacherNotificationBellComponent } from '../../shared/components/teacher-notification-bell.component';
import { SchoolClass, Group, Student } from '../../models';

@Component({
  selector: 'app-student-management',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    NavbarComponent,
    TeacherNotificationBellComponent,
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
      }

      .content {
        padding: 24px 32px;
        max-width: 1100px;
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

      .form-row {
        display: grid;
        grid-template-columns: 1fr auto;
        gap: 12px;
      }

      .form-row .form-group {
        min-width: 0;

        label {
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

      .status-badge {
        display: inline-block;
        padding: 4px 10px;
        border-radius: 20px;
        font-size: 0.8rem;
        font-weight: 500;
      }

      .status-active {
        background: #d1fae5;
        color: #065f46;
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
        <div class="sidebar-brand">MATHSHINE EDUCATION</div>
        <nav class="sidebar-nav">
          <a class="nav-item" routerLink="/teacher/dashboard">Tổng quan</a>
          <a class="nav-item" routerLink="/teacher/classes">Quản lý lớp</a>
          <a class="nav-item" routerLink="/teacher/groups">Quản lý nhóm</a>
          <a class="nav-item active" routerLink="/teacher/students"
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
          <h1>Quản lý học sinh</h1>
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
            <h3 class="card-title">Thêm học sinh mới</h3>
            <div class="form-row">
              <div class="form-group">
                <label>Họ tên</label>
                <input
                  class="form-input"
                  [(ngModel)]="newStudent.fullName"
                  placeholder="Nguyễn Văn A"
                />
              </div>
              <div class="form-group-btn">
                <label>Họ tên</label>
                <button
                  class="btn btn-primary"
                  (click)="addStudent()"
                  [disabled]="!newStudent.fullName.trim() || saving"
                >
                  {{ saving ? 'Đang thêm...' : 'Thêm học sinh' }}
                </button>
              </div>
            </div>
          </div>

          <div class="card" *ngIf="selectedGroupId">
            <h3 class="card-title">
              Danh sách học sinh ({{ students.length }})
            </h3>

            <div *ngIf="loading" class="loading-state">Đang tải...</div>

            <table class="table" *ngIf="!loading && students.length > 0">
              <thead>
                <tr>
                  <th>Họ tên</th>
                  <th>Lớp</th>
                  <th>Nhóm</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let s of students">
                  <td>
                    <strong>{{ s.fullName }}</strong>
                  </td>
                  <td>{{ s.className }}</td>
                  <td>{{ getGroupName(s.groupId) }}</td>
                  <td>
                    <button class="btn btn-danger" (click)="confirmDelete(s)">
                      Xóa
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>

            <div class="empty-state" *ngIf="!loading && students.length === 0">
              Chưa có học sinh nào trong nhóm này.
            </div>
          </div>
        </div>
      </main>
    </div>

    <div class="dialog-overlay" *ngIf="deleteTarget" (click)="cancelDelete()">
      <div class="dialog" (click)="$event.stopPropagation()">
        <h3>Xác nhận xóa</h3>
        <p>
          Bạn có chắc chắn muốn xóa học sinh
          <strong>{{ deleteTarget.fullName }}</strong
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
export class StudentManagementComponent implements OnInit {
  private firestoreService = inject(FirestoreService);
  private authService = inject(AuthService);
  private router = inject(Router);

  classes: SchoolClass[] = [];
  allGroups: Group[] = [];
  filteredGroups: Group[] = [];
  students: Student[] = [];
  selectedClassId = '';
  selectedGroupId = '';
  loading = false;
  saving = false;
  deleteTarget: Student | null = null;

  newStudent = { fullName: '' };

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
    this.students = [];
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
      this.students = [];
      return;
    }
    this.loadStudents();
  }

  loadStudents(): void {
    this.loading = true;
    this.firestoreService.getStudentsByGroup(this.selectedGroupId).subscribe({
      next: (data) => {
        this.students = data;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      },
    });
  }

  async addStudent(): Promise<void> {
    if (
      !this.newStudent.fullName.trim() ||
      !this.selectedGroupId ||
      !this.selectedClassId
    ) {
      return;
    }

    this.saving = true;
    try {
      const classDoc = this.classes.find((c) => c.id === this.selectedClassId);
      const className = classDoc?.name || '';

      await this.firestoreService.createStudentDoc('', {
        fullName: this.newStudent.fullName.trim(),
        className,
        groupId: this.selectedGroupId,
        username: '',
        mustChangePassword: false,
      });

      this.newStudent = { fullName: '' };
      this.loadStudents();
    } catch (err: any) {
      alert('Lỗi khi tạo học sinh: ' + (err.message || 'Không xác định'));
    } finally {
      this.saving = false;
    }
  }

  confirmDelete(s: Student): void {
    this.deleteTarget = s;
  }

  cancelDelete(): void {
    this.deleteTarget = null;
  }

  executeDelete(): void {
    if (!this.deleteTarget) return;
    this.firestoreService
      .deleteStudentCascade(this.deleteTarget.uid)
      .then(() => {
        this.deleteTarget = null;
        this.loadStudents();
      });
  }

  getGroupName(groupId: string): string {
    return this.allGroups.find((g) => g.id === groupId)?.name || groupId;
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/role-select']);
  }
}
