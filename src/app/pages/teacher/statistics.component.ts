import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { FirestoreService } from '../../services/firestore.service';
import { AuthService } from '../../services/auth.service';
import { NavbarComponent } from '../../shared/components/navbar.component';
import { TeacherNotificationBellComponent } from '../../shared/components/teacher-notification-bell.component';
import { SchoolClass, Group, Student, Assignment, Grade } from '../../models';
import { forkJoin, map, switchMap, of } from 'rxjs';

interface StudentGradeRow {
  studentName: string;
  grades: { assignmentTitle: string; score: number | null }[];
  average: number | null;
}

@Component({
  selector: 'app-statistics',
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
        max-width: 1200px;
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
        align-items: flex-end;
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

      .btn-success {
        background: #16a34a;
        color: #fff;

        &:hover {
          background: #15803d;
        }
      }

      .table-wrapper {
        overflow-x: auto;
      }

      .table {
        width: 100%;
        border-collapse: collapse;
        min-width: 600px;

        th,
        td {
          padding: 12px 16px;
          text-align: center;
          border-bottom: 1px solid #e2e8f0;
          font-size: 0.9rem;
        }

        th {
          color: #64748b;
          font-weight: 600;
          font-size: 0.8rem;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          background: #f8fafc;
          position: sticky;
          top: 0;
        }

        td {
          color: #334155;

          &:first-child {
            text-align: left;
            font-weight: 500;
          }
        }
      }

      .score-cell {
        font-weight: 600;
      }

      .score-high {
        color: #16a34a;
      }

      .score-mid {
        color: #d97706;
      }

      .score-low {
        color: #ef4444;
      }

      .score-na {
        color: #94a3b8;
        font-style: italic;
      }

      .avg-cell {
        font-weight: 700;
        color: #2563eb;
        font-size: 1rem;
      }

      .summary-bar {
        display: flex;
        gap: 20px;
        margin-bottom: 20px;
        flex-wrap: wrap;
      }

      .summary-item {
        background: #fff;
        border-radius: 10px;
        padding: 16px 20px;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
        font-size: 0.9rem;
        color: #64748b;

        strong {
          display: block;
          font-size: 1.4rem;
          color: #1e293b;
          margin-bottom: 4px;
        }
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
          <a class="nav-item" routerLink="/teacher/students"
            >Quản lý học sinh</a
          >
          <a class="nav-item" routerLink="/teacher/assignments">Bài tập</a>
          <a class="nav-item" routerLink="/teacher/discussions">Thảo luận</a>
          <a class="nav-item active" routerLink="/teacher/statistics"
            >Thống kê</a
          >
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
          <h1>Thống kê</h1>
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

          <div *ngIf="selectedGroupId && !loading">
            <div class="summary-bar">
              <div class="summary-item">
                <strong>{{ studentRows.length }}</strong>
                Học sinh
              </div>
              <div class="summary-item">
                <strong>{{ assignments.length }}</strong>
                Bài tập
              </div>
              <div class="summary-item">
                <strong>{{ overallAverage }}</strong>
                Điểm TB toàn nhóm
              </div>
            </div>

            <div
              class="card"
              style="display: flex; justify-content: flex-end; padding: 16px 24px;"
            >
              <button class="btn btn-success" (click)="exportExcel()">
                Xuất Excel
              </button>
            </div>

            <div class="card">
              <h3 class="card-title">Bảng điểm chi tiết</h3>

              <div class="table-wrapper" *ngIf="studentRows.length > 0">
                <table class="table">
                  <thead>
                    <tr>
                      <th>Học sinh</th>
                      <th *ngFor="let a of assignments">{{ a.title }}</th>
                      <th>Trung bình</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr *ngFor="let row of studentRows">
                      <td>{{ row.studentName }}</td>
                      <td *ngFor="let g of row.grades" class="score-cell">
                        <ng-container *ngIf="g.score !== null; else naTpl">
                          <span
                            [class.score-high]="g.score >= 8"
                            [class.score-mid]="g.score >= 5 && g.score < 8"
                            [class.score-low]="g.score < 5"
                          >
                            {{ g.score }}
                          </span>
                        </ng-container>
                        <ng-template #naTpl>
                          <span class="score-na">-</span>
                        </ng-template>
                      </td>
                      <td>
                        <span class="avg-cell" *ngIf="row.average !== null">{{
                          row.average
                        }}</span>
                        <span class="score-na" *ngIf="row.average === null"
                          >-</span
                        >
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div class="empty-state" *ngIf="studentRows.length === 0">
                Không có dữ liệu điểm cho nhóm này.
              </div>
            </div>
          </div>

          <div class="loading-state" *ngIf="loading">Đang tải dữ liệu...</div>
        </div>
      </main>
    </div>
  `,
})
export class StatisticsComponent implements OnInit {
  private firestoreService = inject(FirestoreService);
  private authService = inject(AuthService);
  private router = inject(Router);

  classes: SchoolClass[] = [];
  allGroups: Group[] = [];
  filteredGroups: Group[] = [];
  selectedClassId = '';
  selectedGroupId = '';
  loading = false;

  assignments: Assignment[] = [];
  studentRows: StudentGradeRow[] = [];

  userFullName = '';
  userSubject = '';

  get overallAverage(): string {
    const allScores = this.studentRows
      .filter((r) => r.average !== null)
      .map((r) => r.average as number);

    if (allScores.length === 0) return 'N/A';

    const avg = allScores.reduce((sum, s) => sum + s, 0) / allScores.length;
    return avg.toFixed(1);
  }

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
    this.studentRows = [];
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
      this.studentRows = [];
      this.assignments = [];
      return;
    }
    this.loadStatistics();
  }

  loadStatistics(): void {
    this.loading = true;

    forkJoin([
      this.firestoreService.getAssignmentsByGroup(this.selectedGroupId),
      this.firestoreService.getStudentsByGroup(this.selectedGroupId),
    ])
      .pipe(
        switchMap(([assignments, students]) => {
          this.assignments = assignments;

          if (assignments.length === 0 || students.length === 0) {
            this.studentRows = students.map((s) => ({
              studentName: s.fullName,
              grades: assignments.map((a) => ({
                assignmentTitle: a.title,
                score: null,
              })),
              average: null,
            }));
            return of(void 0);
          }

          const gradeObservables = assignments.map((a) =>
            this.firestoreService.getGradesByAssignment(a.id),
          );

          return forkJoin(gradeObservables).pipe(
            map((allGradesByAssignment) => {
              const gradeMap = new Map<
                string,
                { assignmentId: string; score: number }[]
              >();
              students.forEach((s) => {
                const studentGrades: { assignmentId: string; score: number }[] =
                  [];
                allGradesByAssignment.forEach((grades, idx) => {
                  const grade = grades.find((g) => g.studentId === s.uid);
                  if (grade) {
                    studentGrades.push({
                      assignmentId: assignments[idx].id,
                      score: grade.scoreValue,
                    });
                  }
                });
                gradeMap.set(s.uid, studentGrades);
              });

              this.studentRows = students.map((s) => {
                const studentGrades = gradeMap.get(s.uid) || [];
                const grades = assignments.map((a) => {
                  const g = studentGrades.find(
                    (sg) => sg.assignmentId === a.id,
                  );
                  return {
                    assignmentTitle: a.title,
                    score: g ? g.score : null,
                  };
                });

                const validScores = grades
                  .filter((g) => g.score !== null)
                  .map((g) => g.score as number);
                const average =
                  validScores.length > 0
                    ? +(
                        validScores.reduce((sum, sc) => sum + sc, 0) /
                        validScores.length
                      ).toFixed(1)
                    : null;

                return { studentName: s.fullName, grades, average };
              });
            }),
          );
        }),
      )
      .subscribe({
        next: () => {
          this.loading = false;
        },
        error: () => {
          this.loading = false;
        },
      });
  }

  exportExcel(): void {
    alert('Chức năng xuất Excel sẽ được triển khai trong thời gian tới.');
  }

  logout(): void {
    this.authService.logout();
  }
}
