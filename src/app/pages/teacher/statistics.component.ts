import { Component, inject, OnInit, OnDestroy, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { FirestoreService } from '../../services/firestore.service';
import { AuthService } from '../../services/auth.service';
import { NavbarComponent } from '../../shared/components/navbar.component';
import { TeacherNotificationBellComponent } from '../../shared/components/teacher-notification-bell.component';
import { SchoolClass, Group, Student, Assignment, Grade } from '../../models';
import { forkJoin, map, switchMap, of } from 'rxjs';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { rankStudentRows, ScopedStudentRow, StudentGradeRow } from './statistics-ranking';

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

      .form-select,
      .form-input {
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

      .filters-divider {
        width: 100%;
        height: 1px;
        background: #e2e8f0;
        margin: 12px 0 4px;
      }

      .filter-label-row {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 0.8rem;
        font-weight: 600;
        color: #64748b;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        margin-bottom: 8px;
        margin-top: 4px;
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
        display: inline-flex;
        align-items: center;
        gap: 6px;
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

        &:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
      }

      .btn-pdf {
        background: #dc2626;
        color: #fff;

        &:hover {
          background: #b91c1c;
        }

        &:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
      }

      .export-bar {
        display: flex;
        justify-content: flex-end;
        gap: 10px;
        padding: 14px 24px;
      }

      /* ── Table ── */
      .table-wrapper {
        overflow-x: auto;
      }

      .table {
        border-collapse: collapse;
        table-layout: fixed;

        th,
        td {
          padding: 10px 14px;
          text-align: center;
          border: 2px solid #000;
          font-size: 0.9rem;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        th {
          color: #1e293b;
          font-weight: 700;
          font-size: 0.8rem;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          background: #e5e7eb;
          position: relative;
          user-select: none;
        }

        /* Assignment title headers: allow wrapping by height */
        th.th-assignment {
          white-space: normal;
          word-break: break-word;
          text-overflow: clip;
          overflow: hidden;
          vertical-align: middle;
          line-height: 1.3;
        }

        td {
          color: #334155;

          &:first-child {
            text-align: left;
            font-weight: 500;
            position: relative; /* needed for row-resize-handle */
          }
        }
      }

      /* Column resize handle (horizontal drag) */
      .resize-handle {
        position: absolute;
        right: 0;
        top: 0;
        bottom: 0;
        width: 6px;
        cursor: col-resize;
        background: transparent;
        transition: background 0.15s;

        &:hover,
        &.active {
          background: rgba(37, 99, 235, 0.4);
        }
      }

      /* Row resize handle (vertical drag) — sits at bottom of first td */
      .row-resize-handle {
        position: absolute;
        left: 0;
        right: 0;
        bottom: 0;
        height: 6px;
        cursor: row-resize;
        background: transparent;
        transition: background 0.15s;
        z-index: 1;

        &:hover,
        &.active {
          background: rgba(37, 99, 235, 0.4);
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

      /* PDF capture area header */
      .pdf-header {
        padding: 16px 20px 8px;
        background: #fff;

        .pdf-title {
          font-size: 1.15rem;
          font-weight: 700;
          color: #1e293b;
          margin: 0 0 4px;
        }

        .pdf-subtitle {
          font-size: 0.85rem;
          color: #64748b;
          margin: 0;
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
          <a class="nav-item" routerLink="/teacher/students">Quản lý học sinh</a>
          <a class="nav-item" routerLink="/teacher/assignments">Bài tập</a>
          <a class="nav-item" routerLink="/teacher/discussions">Thảo luận</a>
          <a class="nav-item active" routerLink="/teacher/statistics">Thống kê</a>
          <a class="nav-item" routerLink="/teacher/hidden-assignments">Ẩn bài tập</a>
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
          <h1>Thống kê</h1>
        </div>

        <div class="content">
          <!-- Filter card -->
          <div class="card">
            <h3 class="card-title">Bộ lọc</h3>
            <div class="filters-row">
              <div class="form-group">
                <label>Lớp</label>
                <select class="form-select" [(ngModel)]="selectedClassId" (change)="onClassChange()">
                  <option value="">-- Chọn lớp --</option>
                  <option *ngFor="let c of classes" [value]="c.id">{{ c.name }}</option>
                </select>
              </div>
              <div class="form-group">
                <label>Nhóm</label>
                <select class="form-select" [(ngModel)]="selectedGroupId" (change)="onGroupChange()">
                  <option value="">-- Chọn nhóm --</option>
                  <option *ngFor="let g of filteredGroups" [value]="g.id">{{ g.name }}</option>
                </select>
              </div>
            </div>

            <!-- Date range filter -->
            <div *ngIf="selectedGroupId" style="margin-top: 16px;">
              <div class="filters-divider"></div>
              <div class="filter-label-row">
                <span>📅</span> Lọc bài tập theo ngày buổi học
              </div>
              <div class="filters-row">
                <div class="form-group">
                  <label>Từ ngày</label>
                  <input
                    type="date"
                    class="form-input"
                    [(ngModel)]="filterFromDate"
                    (change)="applyDateFilter()"
                  />
                </div>
                <div class="form-group">
                  <label>Đến ngày</label>
                  <input
                    type="date"
                    class="form-input"
                    [(ngModel)]="filterToDate"
                    (change)="applyDateFilter()"
                  />
                </div>
                <div class="form-group" style="flex: 0; min-width: auto; align-self: flex-end;">
                  <button class="btn btn-primary" (click)="clearDateFilter()" style="height: 42px;">
                    Xoá bộ lọc ngày
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div *ngIf="selectedGroupId && !loading">
            <!-- Summary -->
            <div class="summary-bar">
              <div class="summary-item">
                <strong>{{ studentRows.length }}</strong>
                Học sinh
              </div>
              <div class="summary-item">
                <strong>{{ filteredAssignments.length }}</strong>
                Bài tập{{ filterFromDate || filterToDate ? ' (đã lọc)' : '' }}
              </div>
              <div class="summary-item">
                <strong>{{ overallAverage }}</strong>
                Điểm TB toàn nhóm
              </div>
            </div>

            <!-- Export buttons -->
            <div class="card" style="padding: 0;">
              <div class="export-bar">
                <button
                  id="btn-export-img"
                  class="btn btn-success"
                  (click)="exportPNG()"
                  [disabled]="exporting"
                >
                  <span>🖼️</span>
                  {{ exporting ? 'Đang xuất...' : 'Xuất Ảnh PNG' }}
                </button>
                <button
                  id="btn-export-pdf"
                  class="btn btn-pdf"
                  (click)="exportPDF()"
                  [disabled]="exporting"
                >
                  <span>📄</span>
                  {{ exporting ? 'Đang xuất...' : 'Xuất PDF' }}
                </button>
              </div>
            </div>

            <!-- Grade table card — this area is captured for export -->
            <div class="card" style="padding: 0; overflow: hidden;">
              <div id="grade-table-container" #gradeTableContainer>
                <!-- Header shown in PDF/PNG -->
                <div class="pdf-header">
                  <p class="pdf-title">
                    Bảng điểm chi tiết —
                    {{ selectedClassName }} / {{ selectedGroupName }}
                  </p>
                  <p class="pdf-subtitle" *ngIf="filterFromDate || filterToDate">
                    Khoảng thời gian:
                    {{ filterFromDate || '...' }} → {{ filterToDate || '...' }}
                  </p>
                </div>

                <div class="table-wrapper" *ngIf="studentRows.length > 0" style="padding: 0 20px 20px;">
                  <table
                    class="table"
                    [style.width]="tableWidth + 'px'"
                    #gradeTable
                  >
                    <thead>
                      <tr [style.height]="headerHeight + 'px'">
                        <!-- Student name column -->
                        <th [style.width]="columnWidths[0] + 'px'" [style.min-width]="columnWidths[0] + 'px'">
                          Học sinh
                          <!-- Column width resize -->
                          <div
                            class="resize-handle"
                            [class.active]="resizingColIndex === 0"
                            (mousedown)="startResize($event, 0)"
                          ></div>
                          <!-- Header row height resize -->
                          <div
                            class="row-resize-handle"
                            [class.active]="resizingHeader"
                            (mousedown)="startHeaderResize($event)"
                          ></div>
                        </th>
                        <!-- Assignment columns -->
                        <th
                          *ngFor="let a of filteredAssignments; let i = index"
                          class="th-assignment"
                          [style.width]="columnWidths[i + 1] + 'px'"
                          [style.min-width]="columnWidths[i + 1] + 'px'"
                          [title]="a.title + ' (' + a.sessionDate + ')'"
                        >
                          {{ a.title }}
                          <div
                            class="resize-handle"
                            [class.active]="resizingColIndex === i + 1"
                            (mousedown)="startResize($event, i + 1)"
                          ></div>
                        </th>
                        <!-- Average column -->
                        <th [style.width]="columnWidths[filteredAssignments.length + 1] + 'px'" [style.min-width]="columnWidths[filteredAssignments.length + 1] + 'px'">
                          Trung bình
                          <div
                            class="resize-handle"
                            [class.active]="resizingColIndex === filteredAssignments.length + 1"
                            (mousedown)="startResize($event, filteredAssignments.length + 1)"
                          ></div>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr *ngFor="let row of filteredStudentRows">
                        <td>{{ row.studentName }}</td>
                        <td *ngFor="let g of row.filteredGrades" class="score-cell">
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
                          <span class="avg-cell" *ngIf="row.filteredAverage !== null">{{ row.filteredAverage }}</span>
                          <span class="score-na" *ngIf="row.filteredAverage === null">-</span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div class="empty-state" *ngIf="studentRows.length === 0" style="padding: 40px 20px;">
                  Không có dữ liệu điểm cho nhóm này.
                </div>
              </div>
            </div>
          </div>

          <div class="loading-state" *ngIf="loading">Đang tải dữ liệu...</div>
        </div>
      </main>
    </div>
  `,
})
export class StatisticsComponent implements OnInit, OnDestroy {
  @ViewChild('gradeTableContainer') gradeTableContainerRef!: ElementRef<HTMLElement>;

  private firestoreService = inject(FirestoreService);
  private authService = inject(AuthService);
  private router = inject(Router);

  classes: SchoolClass[] = [];
  allGroups: Group[] = [];
  filteredGroups: Group[] = [];
  selectedClassId = '';
  selectedGroupId = '';
  loading = false;
  exporting = false;

  assignments: Assignment[] = [];
  studentRows: StudentGradeRow[] = [];

  // Date filter
  filterFromDate = '';
  filterToDate = '';

  // Column resize
  columnWidths: number[] = [];
  resizingColIndex = -1;
  private resizeStartX = 0;
  private resizeStartWidth = 0;
  private mouseMoveListener!: (e: MouseEvent) => void;
  private mouseUpListener!: (e: MouseEvent) => void;

  // Header row height resize
  headerHeight = 44;
  resizingHeader = false;
  private headerResizeStartY = 0;
  private headerResizeStartHeight = 0;
  private rowMouseMoveListener!: (e: MouseEvent) => void;
  private rowMouseUpListener!: (e: MouseEvent) => void;

  userFullName = '';
  userSubject = '';

  // ── Derived getters ──────────────────────────────────────────

  get selectedClassName(): string {
    return this.classes.find(c => c.id === this.selectedClassId)?.name ?? '';
  }

  get selectedGroupName(): string {
    return this.allGroups.find(g => g.id === this.selectedGroupId)?.name ?? '';
  }

  get filteredAssignments(): Assignment[] {
    if (!this.filterFromDate && !this.filterToDate) return this.assignments;

    return this.assignments.filter(a => {
      const d = a.sessionDate;
      if (this.filterFromDate && d < this.filterFromDate) return false;
      if (this.filterToDate && d > this.filterToDate) return false;
      return true;
    });
  }

  get filteredStudentRows(): ScopedStudentRow[] {
    return rankStudentRows(this.studentRows, this.filteredAssignments.map(a => a.id));
  }

  get tableWidth(): number {
    return this.columnWidths.reduce((sum, w) => sum + w, 0);
  }

  get overallAverage(): string {
    const rows = this.filteredStudentRows;
    const allScores = rows
      .filter(r => r.filteredAverage !== null)
      .map(r => r.filteredAverage as number);
    if (allScores.length === 0) return 'N/A';
    const avg = allScores.reduce((s, v) => s + v, 0) / allScores.length;
    return avg.toFixed(1);
  }

  // ── Lifecycle ────────────────────────────────────────────────

  ngOnInit(): void {
    const profile = this.authService.currentProfile;
    if (profile) {
      this.userFullName = profile.fullName;
      this.userSubject = profile.subject || '';
    }

    this.firestoreService.getClasses().subscribe(classesData => {
      this.classes = classesData;
    });

    this.firestoreService.getAllGroups().subscribe(groupsData => {
      this.allGroups = groupsData;
    });
  }

  ngOnDestroy(): void {
    this.cleanupResizeListeners();
    this.cleanupRowResizeListeners();
  }

  // ── Filter handlers ──────────────────────────────────────────

  onClassChange(): void {
    this.selectedGroupId = '';
    this.studentRows = [];
    this.assignments = [];
    this.filterFromDate = '';
    this.filterToDate = '';
    if (!this.selectedClassId) {
      this.filteredGroups = [];
      return;
    }
    this.filteredGroups = this.allGroups.filter(g => g.classId === this.selectedClassId);
  }

  onGroupChange(): void {
    if (!this.selectedGroupId) {
      this.studentRows = [];
      this.assignments = [];
      return;
    }
    this.filterFromDate = '';
    this.filterToDate = '';
    this.loadStatistics();
  }

  applyDateFilter(): void {
    // Reactive — filteredAssignments getter handles it automatically.
    // Re-initialize column widths when filter changes column count
    this.initColumnWidths();
  }

  clearDateFilter(): void {
    this.filterFromDate = '';
    this.filterToDate = '';
    this.initColumnWidths();
  }

  // ── Data loading ─────────────────────────────────────────────

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
            this.studentRows = students.map(s => ({
              studentName: s.fullName,
              grades: assignments.map(a => ({
                assignmentId: a.id,
                score: null,
              })),
              average: null,
            }));
            this.initColumnWidths();
            return of(void 0);
          }

          const gradeObservables = assignments.map(a =>
            this.firestoreService.getGradesByAssignment(a.id),
          );

          return forkJoin(gradeObservables).pipe(
            map(allGradesByAssignment => {
              const gradeMap = new Map<string, { assignmentId: string; score: number }[]>();
              students.forEach(s => {
                const studentGrades: { assignmentId: string; score: number }[] = [];
                allGradesByAssignment.forEach((grades, idx) => {
                  const sg = grades.filter(g => g.studentId === s.uid);
                  if (sg.length > 0) {
                    const highest = Math.max(...sg.map(g => g.scoreValue));
                    studentGrades.push({ assignmentId: assignments[idx].id, score: highest });
                  }
                });
                gradeMap.set(s.uid, studentGrades);
              });

              this.studentRows = students.map(s => {
                const sg = gradeMap.get(s.uid) || [];
                const grades = assignments.map(a => {
                  const found = sg.find(g => g.assignmentId === a.id);
                  return { assignmentId: a.id, score: found ? found.score : null };
                });
                const validScores = grades.filter(g => g.score !== null).map(g => g.score as number);
                const average =
                  validScores.length > 0
                    ? +(validScores.reduce((sum, sc) => sum + sc, 0) / validScores.length).toFixed(1)
                    : null;
                return { studentName: s.fullName, grades, average };
              });

              this.initColumnWidths();
            }),
          );
        }),
      )
      .subscribe({
        next: () => { this.loading = false; },
        error: () => { this.loading = false; },
      });
  }

  // ── Column resize ────────────────────────────────────────────

  private initColumnWidths(): void {
    const numCols = this.filteredAssignments.length + 2; // name + assignments + avg
    const currentLen = this.columnWidths.length;
    if (currentLen === numCols) return; // already correct size

    const newWidths: number[] = [];
    newWidths.push(currentLen > 0 ? this.columnWidths[0] : 180); // student name
    for (let i = 1; i <= numCols - 2; i++) {
      newWidths.push(currentLen > i ? this.columnWidths[i] : 110);
    }
    newWidths.push(currentLen > 0 ? this.columnWidths[currentLen - 1] : 100); // avg
    this.columnWidths = newWidths;
  }

  startResize(event: MouseEvent, colIndex: number): void {
    event.preventDefault();
    this.resizingColIndex = colIndex;
    this.resizeStartX = event.clientX;
    this.resizeStartWidth = this.columnWidths[colIndex];

    this.mouseMoveListener = (e: MouseEvent) => {
      const delta = e.clientX - this.resizeStartX;
      const newWidth = Math.max(60, this.resizeStartWidth + delta);
      this.columnWidths = this.columnWidths.map((w, i) => (i === colIndex ? newWidth : w));
    };

    this.mouseUpListener = () => {
      this.resizingColIndex = -1;
      this.cleanupResizeListeners();
    };

    document.addEventListener('mousemove', this.mouseMoveListener);
    document.addEventListener('mouseup', this.mouseUpListener);
  }

  private cleanupResizeListeners(): void {
    if (this.mouseMoveListener) {
      document.removeEventListener('mousemove', this.mouseMoveListener);
    }
    if (this.mouseUpListener) {
      document.removeEventListener('mouseup', this.mouseUpListener);
    }
  }

  // ── Header row height resize ──────────────────────────────────

  startHeaderResize(event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.resizingHeader = true;
    this.headerResizeStartY = event.clientY;
    this.headerResizeStartHeight = this.headerHeight;

    this.rowMouseMoveListener = (e: MouseEvent) => {
      const delta = e.clientY - this.headerResizeStartY;
      this.headerHeight = Math.max(28, this.headerResizeStartHeight + delta);
    };

    this.rowMouseUpListener = () => {
      this.resizingHeader = false;
      this.cleanupRowResizeListeners();
    };

    document.addEventListener('mousemove', this.rowMouseMoveListener);
    document.addEventListener('mouseup', this.rowMouseUpListener);
  }

  private cleanupRowResizeListeners(): void {
    if (this.rowMouseMoveListener) {
      document.removeEventListener('mousemove', this.rowMouseMoveListener);
    }
    if (this.rowMouseUpListener) {
      document.removeEventListener('mouseup', this.rowMouseUpListener);
    }
  }

  // ── Export ───────────────────────────────────────────────────

  private async captureTable(scale = 3): Promise<HTMLCanvasElement> {
    const el = this.gradeTableContainerRef.nativeElement;
    return html2canvas(el, {
      scale,
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false,
    });
  }

  private buildFileName(ext: string): string {
    const group = this.selectedGroupName.replace(/\s+/g, '_');
    const today = new Date().toISOString().slice(0, 10);
    return `bangdiem_${group}_${today}.${ext}`;
  }

  async exportPNG(): Promise<void> {
    if (this.exporting) return;
    this.exporting = true;
    try {
      const canvas = await this.captureTable(3);

      // Rotate to landscape if width < height (unlikely but safe)
      let finalCanvas = canvas;
      if (canvas.height > canvas.width) {
        finalCanvas = document.createElement('canvas');
        finalCanvas.width = canvas.height;
        finalCanvas.height = canvas.width;
        const ctx = finalCanvas.getContext('2d')!;
        ctx.translate(finalCanvas.width / 2, finalCanvas.height / 2);
        ctx.rotate(Math.PI / 2);
        ctx.drawImage(canvas, -canvas.width / 2, -canvas.height / 2);
      }

      const link = document.createElement('a');
      link.download = this.buildFileName('png');
      link.href = finalCanvas.toDataURL('image/png');
      link.click();
    } finally {
      this.exporting = false;
    }
  }

  async exportPDF(): Promise<void> {
    if (this.exporting) return;
    this.exporting = true;
    try {
      const canvas = await this.captureTable(3);
      const imgData = canvas.toDataURL('image/png');

      // A4 landscape in mm
      const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      const margin = 8;

      const usableW = pageW - margin * 2;
      const usableH = pageH - margin * 2;

      const imgW = canvas.width;
      const imgH = canvas.height;
      const ratio = Math.min(usableW / imgW, usableH / imgH);

      const finalW = imgW * ratio;
      const finalH = imgH * ratio;
      const offsetX = margin + (usableW - finalW) / 2;
      const offsetY = margin + (usableH - finalH) / 2;

      pdf.addImage(imgData, 'PNG', offsetX, offsetY, finalW, finalH);
      pdf.save(this.buildFileName('pdf'));
    } finally {
      this.exporting = false;
    }
  }

  logout(): void {
    this.authService.logout();
  }
}
