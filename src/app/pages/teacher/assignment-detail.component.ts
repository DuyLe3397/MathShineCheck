import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { FirestoreService } from '../../services/firestore.service';
import { ImageService } from '../../services/image.service';
import { AuthService } from '../../services/auth.service';
import { NavbarComponent } from '../../shared/components/navbar.component';
import { TeacherNotificationBellComponent } from '../../shared/components/teacher-notification-bell.component';
import { Assignment, Student, Submission, Grade } from '../../models';
import { forkJoin, map, switchMap, of } from 'rxjs';

interface StudentSubmissionRow {
  student: Student;
  submission: Submission | null;
  grade: Grade | null;
  status: 'Đã chấm' | 'Đã nộp' | 'Chưa nộp';
  attemptNumber: number;
}

@Component({
  selector: 'app-assignment-detail',
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
        display: flex;
        align-items: center;
        gap: 16px;

        h1 {
          margin: 0;
          font-size: 1.5rem;
          color: #1e293b;
          flex: 1;
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

      .assignment-meta {
        display: flex;
        gap: 24px;
        color: #64748b;
        font-size: 0.9rem;
        margin-bottom: 8px;

        span {
          display: flex;
          align-items: center;
          gap: 6px;
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

      .btn-success {
        background: #16a34a;
        color: #fff;

        &:hover {
          background: #15803d;
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

      .status-badge {
        display: inline-block;
        padding: 4px 12px;
        border-radius: 20px;
        font-size: 0.8rem;
        font-weight: 500;
      }

      .status-graded {
        background: #d1fae5;
        color: #065f46;
      }

      .status-submitted {
        background: #fef3c7;
        color: #92400e;
      }

      .status-not-submitted {
        background: #f1f5f9;
        color: #64748b;
      }

      .grade-cell {
        font-weight: 700;
        color: #2563eb;
        font-size: 1rem;
      }

      .empty-state {
        text-align: center;
        padding: 40px 20px;
        color: #94a3b8;
        font-size: 0.95rem;
      }

      .loading-state {
        text-align: center;
        padding: 40px;
        color: #64748b;
      }

      .summary-bar {
        display: flex;
        gap: 20px;
        margin-bottom: 20px;
      }

      .summary-item {
        background: #fff;
        border-radius: 10px;
        padding: 16px 20px;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
        display: flex;
        align-items: center;
        gap: 12px;
        font-size: 0.9rem;
        color: #64748b;

        strong {
          font-size: 1.3rem;
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
        .content {
          padding: 16px;
        }
        .summary-bar {
          flex-wrap: wrap;
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
          <a class="nav-item" routerLink="/teacher/students"
            >Quản lý học sinh</a
          >
          <a class="nav-item active" routerLink="/teacher/assignments"
            >Bài tập</a
          >
          <a class="nav-item" routerLink="/teacher/discussions">Thảo luận</a>
          <a class="nav-item" routerLink="/teacher/statistics">Thống kê</a>
          <a class="nav-item" routerLink="/teacher/profile">Hồ sơ cá nhân</a>
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
          <h1>{{ assignment?.title || 'Chi tiết bài tập' }}</h1>
          <button class="btn btn-outline" routerLink="/teacher/assignments">
            ← Quay lại
          </button>
        </div>

        <div class="content" *ngIf="!loading">
          <div class="card" *ngIf="assignment">
            <div class="assignment-meta">
              <span
                >Ngày: {{ assignment.sessionDate | date: 'dd/MM/yyyy' }}</span
              >
              <span>{{ assignment.description }}</span>
            </div>
          </div>

          <div class="summary-bar">
            <div class="summary-item">
              <strong>{{ totalStudents }}</strong> Học sinh
            </div>
            <div class="summary-item">
              <strong>{{ submittedCount }}</strong> Đã nộp
            </div>
            <div class="summary-item">
              <strong>{{ gradedCount }}</strong> Đã chấm
            </div>
            <div class="summary-item">
              <strong>{{ notSubmittedCount }}</strong> Chưa nộp
            </div>
          </div>

          <div class="card">
            <h3 class="card-title">Danh sách bài nộp</h3>

            <table class="table" *ngIf="rows.length > 0">
              <thead>
                <tr>
                  <th>Tên học sinh</th>
                  <th>Lần nộp</th>
                  <th>Trạng thái</th>
                  <th>Điểm</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let row of rows">
                  <td>
                    <strong>{{ row.student.fullName }}</strong>
                  </td>
                  <td>
                    <span *ngIf="row.attemptNumber > 0">
                      Lần {{ row.attemptNumber }}
                    </span>
                    <span
                      *ngIf="row.attemptNumber === 0"
                      style="color: #94a3b8;"
                    >
                      -
                    </span>
                  </td>
                  <td>
                    <span
                      class="status-badge"
                      [class.status-graded]="row.status === 'Đã chấm'"
                      [class.status-submitted]="row.status === 'Đã nộp'"
                      [class.status-not-submitted]="row.status === 'Chưa nộp'"
                    >
                      {{ row.status }}
                    </span>
                  </td>
                  <td>
                    <span class="grade-cell" *ngIf="row.grade">
                      {{ row.grade.scoreValue }}
                    </span>
                    <span *ngIf="!row.grade" style="color: #94a3b8;">-</span>
                  </td>
                  <td>
                    <button
                      class="btn btn-primary btn-sm"
                      *ngIf="row.submission"
                      (click)="gradeSubmission(row.submission.id)"
                    >
                      {{ row.status === 'Đã chấm' ? 'Sửa điểm' : 'Chấm bài' }}
                    </button>
                    <button
                      class="btn btn-danger btn-sm"
                      *ngIf="row.submission"
                      (click)="deleteSubmission(row)"
                      style="margin-left:4px;"
                    >
                      Xóa
                    </button>
                    <span
                      *ngIf="!row.submission"
                      style="color: #94a3b8; font-size: 0.85rem;"
                      >Chưa nộp</span
                    >
                  </td>
                </tr>
              </tbody>
            </table>

            <div class="empty-state" *ngIf="rows.length === 0">
              Không có học sinh nào trong nhóm này.
            </div>
          </div>
        </div>

        <div class="loading-state" *ngIf="loading">Đang tải dữ liệu...</div>
      </main>
    </div>
  `,
})
export class AssignmentDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private firestoreService = inject(FirestoreService);
  private imageService = inject(ImageService);
  private authService = inject(AuthService);

  assignmentId = '';
  assignment: Assignment | null = null;
  rows: StudentSubmissionRow[] = [];
  loading = true;

  userFullName = '';
  userSubject = '';

  get totalStudents(): number {
    return this.rows.length;
  }

  get submittedCount(): number {
    return this.rows.filter(
      (r) => r.status === 'Đã nộp' || r.status === 'Đã chấm',
    ).length;
  }

  get gradedCount(): number {
    return this.rows.filter((r) => r.status === 'Đã chấm').length;
  }

  get notSubmittedCount(): number {
    return this.rows.filter((r) => r.status === 'Chưa nộp').length;
  }

  ngOnInit(): void {
    const profile = this.authService.currentProfile;
    if (profile) {
      this.userFullName = profile.fullName;
      this.userSubject = profile.subject || '';
    }

    this.assignmentId = this.route.snapshot.paramMap.get('id') || '';

    if (!this.assignmentId) {
      this.loading = false;
      return;
    }

    this.loadAssignmentDetail();
  }

  async loadAssignmentDetail(): Promise<void> {
    this.loading = true;

    const assignment = await this.firestoreService.getAssignment(
      this.assignmentId,
    );
    if (!assignment) {
      this.loading = false;
      return;
    }

    this.assignment = assignment;

    this.firestoreService
      .getStudentsByGroup(assignment.groupId)
      .pipe(
        switchMap((students) => {
          if (students.length === 0) return of([]);

          this.firestoreService
            .getSubmissionsByAssignment(this.assignmentId)
            .pipe(
              switchMap((submissions) => {
                const gradeObservables = submissions.map((s) =>
                  this.firestoreService.getGradeBySubmission(s.id),
                );
                if (gradeObservables.length === 0) {
                  return of({
                    students,
                    submissions,
                    grades: [] as (Grade | null)[],
                  });
                }
                return forkJoin(gradeObservables).pipe(
                  map((grades) => ({ students, submissions, grades })),
                );
              }),
            )
            .subscribe({
              next: (data: any) => {
                this.buildRows(data.students, data.submissions, data.grades);
                this.loading = false;
              },
              error: () => {
                this.loading = false;
              },
            });
          return of([]);
        }),
      )
      .subscribe();
  }

  private buildRows(
    students: Student[],
    submissions: Submission[],
    grades: (Grade | null)[],
  ): void {
    const rows: StudentSubmissionRow[] = [];
    for (const student of students) {
      const studentSubmissions = submissions
        .filter((s) => s.studentId === student.uid)
        .sort((a, b) => (b.attemptNumber || 0) - (a.attemptNumber || 0));

      if (studentSubmissions.length === 0) {
        rows.push({
          student,
          submission: null,
          grade: null,
          status: 'Chưa nộp',
          attemptNumber: 0,
        });
        continue;
      }

      for (const sub of studentSubmissions) {
        const grade =
          grades.find((g) => g && g.submissionId === sub.id) || null;

        let status: StudentSubmissionRow['status'];
        if (
          grade &&
          grade.scoreValue !== undefined &&
          grade.scoreValue !== null
        ) {
          status = 'Đã chấm';
        } else if (sub.status !== 'graded') {
          status = 'Đã nộp';
        } else {
          status = 'Đã nộp';
        }

        rows.push({
          student,
          submission: sub,
          grade,
          status,
          attemptNumber: sub.attemptNumber || 0,
        });
      }
    }
    this.rows = rows;
  }

  async deleteSubmission(row: StudentSubmissionRow): Promise<void> {
    if (!row.submission) return;
    const sub = row.submission;
    const msg = `Xóa bài nộp lần ${sub.attemptNumber || '?'} của ${row.student.fullName}?\nẢnh, điểm, nhận xét của lần này sẽ mất hết.`;
    if (!confirm(msg)) return;

    try {
      if (sub.imageIds?.length) {
        await this.imageService.deleteSubmissionImages(sub.imageIds);
      }
      await this.firestoreService.deleteCommentsBySubmission(sub.id);
      await this.firestoreService.deleteGrade(sub.id);
      await this.firestoreService.deleteSubmission(sub.id);

      row.submission = null;
      row.grade = null;
      row.status = 'Chưa nộp';
    } catch (err: any) {
      alert('Lỗi khi xóa: ' + (err.message || ''));
    }
  }

  gradeSubmission(submissionId: string): void {
    this.router.navigate(['/teacher/grade', submissionId]);
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/role-select']);
  }
}
