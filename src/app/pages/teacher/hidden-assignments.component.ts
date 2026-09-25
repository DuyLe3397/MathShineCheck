import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { forkJoin } from 'rxjs';
import { FirestoreService } from '../../services/firestore.service';
import { AuthService } from '../../services/auth.service';
import { TeacherNotificationBellComponent } from '../../shared/components/teacher-notification-bell.component';
import { SchoolClass, Group, Student, Assignment } from '../../models';

@Component({
  selector: 'app-hidden-assignments',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, TeacherNotificationBellComponent],
  styles: [
    `
      :host {
        display: block;
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
        max-width: 1400px;
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

      .form-select {
        width: 100%;
        padding: 10px 14px;
        border: 1px solid #cbd5e1;
        border-radius: 8px;
        font-size: 0.95rem;
        outline: none;
        background: #fff;
        box-sizing: border-box;

        &:focus {
          border-color: #2563eb;
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
        }
      }

      .panes {
        display: grid;
        grid-template-columns: 280px 1fr;
        gap: 20px;
        align-items: start;
      }

      .student-list {
        padding: 8px;
      }

      .student-item {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
        width: 100%;
        padding: 10px 12px;
        border: none;
        border-radius: 8px;
        background: transparent;
        text-align: left;
        font-size: 0.95rem;
        color: #334155;
        cursor: pointer;

        &:hover {
          background: #f1f5f9;
        }

        &.selected {
          background: rgba(37, 99, 235, 0.1);
          color: #1d4ed8;
          font-weight: 600;
        }
      }

      .hidden-badge {
        flex-shrink: 0;
        font-size: 0.75rem;
        font-weight: 600;
        padding: 2px 8px;
        border-radius: 999px;
        background: #fef3c7;
        color: #92400e;
      }

      .detail-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        flex-wrap: wrap;
        margin-bottom: 16px;

        h3 {
          margin: 0;
          font-size: 1.1rem;
          color: #1e293b;
        }

        span {
          font-size: 0.85rem;
          color: #64748b;
        }
      }

      .assignment-row {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 10px 12px;
        border-bottom: 1px solid #f1f5f9;
        cursor: pointer;

        &:last-child {
          border-bottom: none;
        }

        &.is-hidden .assignment-title {
          color: #94a3b8;
          text-decoration: line-through;
        }

        input {
          width: 18px;
          height: 18px;
          cursor: pointer;
        }
      }

      .assignment-date {
        width: 90px;
        flex-shrink: 0;
        font-size: 0.85rem;
        color: #64748b;
      }

      .assignment-title {
        flex: 1;
        color: #1e293b;
      }

      .actions {
        display: flex;
        justify-content: flex-end;
        align-items: center;
        gap: 10px;
        margin-top: 20px;
      }

      .save-status {
        font-size: 0.85rem;
        color: #16a34a;
        margin-right: auto;

        &.error {
          color: #dc2626;
        }
      }

      .btn {
        padding: 10px 20px;
        border: none;
        border-radius: 8px;
        font-size: 0.9rem;
        font-weight: 500;
        cursor: pointer;

        &:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
      }

      .btn-primary {
        background: #2563eb;
        color: #fff;

        &:hover:not(:disabled) {
          background: #1d4ed8;
        }
      }

      .btn-outline {
        background: #fff;
        color: #334155;
        border: 1px solid #cbd5e1;

        &:hover:not(:disabled) {
          background: #f1f5f9;
        }
      }

      .empty-state {
        text-align: center;
        padding: 40px 20px;
        color: #94a3b8;
        font-size: 0.95rem;
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
        .panes {
          grid-template-columns: 1fr;
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
          <a class="nav-item" routerLink="/teacher/students">Quản lý học sinh</a>
          <a class="nav-item" routerLink="/teacher/assignments">Bài tập</a>
          <a class="nav-item" routerLink="/teacher/discussions">Thảo luận</a>
          <a class="nav-item" routerLink="/teacher/statistics">Thống kê</a>
          <a class="nav-item active" routerLink="/teacher/hidden-assignments">Ẩn bài tập</a>
          <a class="nav-item" routerLink="/teacher/profile">Hồ sơ</a>
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
          <h1>Ẩn bài tập</h1>
          <p>Bỏ tích một bài để ẩn bài đó khỏi trang chủ và bảng điểm của học sinh. Bài tập mới tạo luôn hiện với cả nhóm.</p>
        </div>

        <div class="content">
          <div class="card">
            <div class="filters-row">
              <div class="form-group">
                <label>Lớp</label>
                <select class="form-select" [ngModel]="selectedClassId" (change)="onClassChange($any($event.target))">
                  <option value="">-- Chọn lớp --</option>
                  <option *ngFor="let c of classes" [value]="c.id">{{ c.name }}</option>
                </select>
              </div>
              <div class="form-group">
                <label>Nhóm</label>
                <select class="form-select" [ngModel]="selectedGroupId" (change)="onGroupChange($any($event.target))">
                  <option value="">-- Chọn nhóm --</option>
                  <option *ngFor="let g of filteredGroups" [value]="g.id">{{ g.name }}</option>
                </select>
              </div>
            </div>
          </div>

          <div class="empty-state" *ngIf="loading">Đang tải dữ liệu...</div>
          <div class="card save-status error" *ngIf="loadError">{{ loadError }}</div>

          <div class="panes" *ngIf="selectedGroupId && !loading && !loadError">
            <div class="card student-list">
              <div class="empty-state" *ngIf="students.length === 0">Nhóm chưa có học sinh.</div>
              <button
                *ngFor="let s of students"
                class="student-item"
                [class.selected]="s.uid === selectedStudentId"
                (click)="selectStudent(s.uid)"
              >
                <span>{{ s.fullName }}</span>
                <span class="hidden-badge" *ngIf="hiddenCount(s.uid) > 0">Ẩn {{ hiddenCount(s.uid) }}</span>
              </button>
            </div>

            <div class="card">
              <div class="empty-state" *ngIf="!selectedStudent">Chọn một học sinh để ẩn hoặc hiện bài tập.</div>

              <ng-container *ngIf="selectedStudent">
                <div class="detail-header">
                  <h3>{{ selectedStudent.fullName }}</h3>
                  <span>Hiện {{ assignments.length - draftHidden.size }} / {{ assignments.length }} bài</span>
                </div>

                <div class="empty-state" *ngIf="assignments.length === 0">Nhóm chưa có bài tập.</div>

                <label
                  *ngFor="let a of assignments"
                  class="assignment-row"
                  [class.is-hidden]="draftHidden.has(a.id)"
                >
                  <input type="checkbox" [checked]="!draftHidden.has(a.id)" (change)="toggle(a.id)" />
                  <span class="assignment-date">{{ a.sessionDate | date: 'dd/MM/yyyy' }}</span>
                  <span class="assignment-title">{{ a.title }}</span>
                </label>

                <div class="actions">
                  <span class="save-status" [class.error]="saveError" *ngIf="saveMessage">{{ saveMessage }}</span>
                  <button class="btn btn-outline" (click)="showAll()" [disabled]="saving || draftHidden.size === 0">
                    Hiện tất cả
                  </button>
                  <button class="btn btn-primary" (click)="save()" [disabled]="saving || !isDirty">
                    {{ saving ? 'Đang lưu...' : 'Lưu' }}
                  </button>
                </div>
              </ng-container>
            </div>
          </div>
        </div>
      </main>
    </div>
  `,
})
export class HiddenAssignmentsComponent implements OnInit {
  private firestoreService = inject(FirestoreService);
  private authService = inject(AuthService);

  classes: SchoolClass[] = [];
  allGroups: Group[] = [];
  filteredGroups: Group[] = [];
  selectedClassId = '';
  selectedGroupId = '';
  loading = false;
  loadError = '';

  students: Student[] = [];
  assignments: Assignment[] = [];
  /** Bài bị ẩn đã lưu, theo uid học sinh. */
  private savedHidden = new Map<string, Set<string>>();

  selectedStudentId = '';
  draftHidden = new Set<string>();
  saving = false;
  saveMessage = '';
  saveError = false;

  userFullName = '';
  userSubject = '';

  get selectedStudent(): Student | undefined {
    return this.students.find(s => s.uid === this.selectedStudentId);
  }

  get isDirty(): boolean {
    if (!this.selectedStudentId) return false;
    const saved = this.savedHidden.get(this.selectedStudentId) ?? new Set<string>();
    return saved.size !== this.draftHidden.size || [...saved].some(id => !this.draftHidden.has(id));
  }

  ngOnInit(): void {
    const profile = this.authService.currentProfile;
    if (profile) {
      this.userFullName = profile.fullName;
      this.userSubject = profile.subject || '';
    }
    this.firestoreService.getClasses().subscribe(data => (this.classes = data));
    this.firestoreService.getAllGroups().subscribe(data => (this.allGroups = data));
  }

  onClassChange(select: HTMLSelectElement): void {
    if (!this.confirmDiscard()) {
      select.value = this.selectedClassId;
      return;
    }
    this.selectedClassId = select.value;
    this.filteredGroups = this.allGroups.filter(g => g.classId === select.value);
    this.resetGroup();
  }

  onGroupChange(select: HTMLSelectElement): void {
    if (!this.confirmDiscard()) {
      select.value = this.selectedGroupId;
      return;
    }
    this.resetGroup();
    this.selectedGroupId = select.value;
    if (select.value) this.loadGroup(select.value);
  }

  selectStudent(uid: string): void {
    if (uid === this.selectedStudentId || !this.confirmDiscard()) return;
    this.selectedStudentId = uid;
    this.draftHidden = new Set(this.savedHidden.get(uid) ?? []);
    this.saveMessage = '';
  }

  hiddenCount(uid: string): number {
    return this.savedHidden.get(uid)?.size ?? 0;
  }

  toggle(assignmentId: string): void {
    const next = new Set(this.draftHidden);
    if (next.has(assignmentId)) next.delete(assignmentId);
    else next.add(assignmentId);
    this.draftHidden = next;
    this.saveMessage = '';
  }

  showAll(): void {
    this.draftHidden = new Set();
    this.saveMessage = '';
  }

  async save(): Promise<void> {
    const student = this.selectedStudent;
    if (!student || this.saving) return;
    this.saving = true;
    this.saveMessage = '';
    // Chỉ lưu id của bài thuộc nhóm hiện tại — bỏ id bài của nhóm cũ nếu học sinh từng chuyển nhóm
    const groupAssignmentIds = new Set(this.assignments.map(a => a.id));
    const assignmentIds = [...this.draftHidden].filter(id => groupAssignmentIds.has(id));
    try {
      await this.firestoreService.setHiddenAssignments({
        studentId: student.uid,
        groupId: this.selectedGroupId,
        assignmentIds,
        updatedBy: this.authService.currentUser?.uid ?? '',
        updatedAt: new Date().toISOString(),
      });
      this.savedHidden.set(student.uid, new Set(assignmentIds));
      this.draftHidden = new Set(assignmentIds);
      this.saveError = false;
      this.saveMessage = 'Đã lưu.';
    } catch {
      this.saveError = true;
      this.saveMessage = 'Lưu thất bại. Kiểm tra kết nối hoặc luật Firestore.';
    } finally {
      this.saving = false;
    }
  }

  logout(): void {
    this.authService.logout();
  }

  private loadGroup(groupId: string): void {
    this.loading = true;
    forkJoin([
      this.firestoreService.getStudentsByGroup(groupId),
      this.firestoreService.getAssignmentsByGroup(groupId),
      this.firestoreService.getHiddenAssignmentsByGroup(groupId),
    ]).subscribe({
      next: ([students, assignments, hiddenDocs]) => {
        this.students = [...students].sort((a, b) => a.fullName.localeCompare(b.fullName, 'vi'));
        this.assignments = assignments;
        this.savedHidden = new Map(hiddenDocs.map(d => [d.studentId, new Set(d.assignmentIds ?? [])]));
        this.loading = false;
      },
      error: (err) => {
        console.error('Tải dữ liệu ẩn bài tập thất bại', err);
        this.loadError = 'Không tải được dữ liệu của nhóm. Kiểm tra kết nối hoặc luật Firestore cho hiddenAssignments.';
        this.loading = false;
      },
    });
  }

  private resetGroup(): void {
    this.selectedGroupId = '';
    this.loadError = '';
    this.students = [];
    this.assignments = [];
    this.savedHidden = new Map();
    this.selectedStudentId = '';
    this.draftHidden = new Set();
    this.saveMessage = '';
  }

  private confirmDiscard(): boolean {
    return !this.isDirty || confirm('Bạn có thay đổi chưa lưu. Bỏ qua các thay đổi này?');
  }
}
