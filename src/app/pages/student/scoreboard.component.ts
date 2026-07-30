import { Component, inject, OnInit, signal, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { FirestoreService } from '../../services/firestore.service';
import { StudentNotificationService } from '../../services/student-notification.service';
import { StudentNavbarComponent } from './student-navbar.component';
import {
  Student,
  Assignment,
  Grade,
  Permission,
  Submission,
} from '../../models';

interface ScoreRow {
  studentId: string;
  fullName: string;
  scores: Map<string, { score: number; gradeId: string; submissionId: string }>;
}

@Component({
  selector: 'app-scoreboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, StudentNavbarComponent],
  styles: [
    `
      :host {
        display: block;
        min-height: 100vh;
        background: #f5f7fa;
        padding-bottom: 80px;
      }

      .page-header {
        background: #2563eb;
        color: #fff;
        padding: 1.5rem 1rem;
        border-radius: 0 0 24px 24px;
      }

      .page-header h2 {
        margin: 0;
        font-size: 1.3rem;
        font-weight: 700;
      }

      .page-header .subtitle {
        margin: 0.25rem 0 0;
        opacity: 0.85;
        font-size: 0.85rem;
      }

      .table-wrapper {
        margin: 1rem;
        background: #fff;
        border-radius: 12px;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
      }

      .table-nav {
        display: flex;
        align-items: center;
        justify-content: flex-end;
        gap: 8px;
        padding: 10px 12px 0;
      }
      .nav-btn {
        background: #f1f5f9;
        border: 1px solid #e2e8f0;
        border-radius: 6px;
        padding: 4px 10px;
        font-size: 1.1rem;
        cursor: pointer;
        color: #475569;
        line-height: 1;
        transition: all 0.15s;
      }
      .nav-btn:hover:not(:disabled) {
        background: #2563eb;
        color: #fff;
        border-color: #2563eb;
      }
      .nav-btn:disabled {
        opacity: 0.4;
        cursor: not-allowed;
      }
      .nav-indicator {
        font-size: 0.8rem;
        font-weight: 600;
        color: #64748b;
        min-width: 50px;
        text-align: center;
      }
      .table-scroll {
        overflow-x: auto;
      }

      table {
        width: auto;
        border-collapse: collapse;
        table-layout: auto;
      }

      th,
      td {
        padding: 0.65rem 0.75rem;
        font-size: 0.82rem;
        text-align: center;
        border-bottom: 1px solid #f1f5f9;
        white-space: nowrap;
        border-right: 2px solid #cbd5e1;
      }
      th:last-child,
      td:last-child {
        border-right: none;
      }

      tbody tr:hover {
        background: rgb(180, 196, 218);
        box-shadow: 0 2px 8px rgba(37, 99, 235, 0.15);
      }

      tbody tr:active {
        background: #dbeafe;
        box-shadow: 0 2px 8px rgba(37, 99, 235, 0.2);
      }

      tbody tr:hover td,
      tbody tr:active td {
        border-top: 2px solid #2563eb;
        border-left: 2px solid #2563eb;
        border-right: 2px solid #2563eb;
        border-bottom: 2px solid #2563eb;
      }

      .stt {
        width: 40px;
      }
      .name-cell {
        text-align: left;
        font-weight: 600;
        color: #1e293b;
      }
      .score-cell {
        font-weight: 700;
        color: #dc2626;
        font-size: 0.9rem;
      }

      .no-score {
        color: #cbd5e1;
        font-style: italic;
      }

      .request-btn {
        padding: 0.3rem 0.6rem;
        border: none;
        border-radius: 6px;
        font-size: 0.7rem;
        cursor: pointer;
        background: #dbeafe;
        color: #2563eb;
        font-weight: 600;
        white-space: nowrap;
        transition: all 0.15s;
      }

      .request-btn:hover {
        background: #bfdbfe;
      }
      .request-btn:disabled {
        background: #f1f5f9;
        color: #94a3b8;
        cursor: not-allowed;
      }

      .request-btn.sent {
        background: #fef3c7;
        color: #d97706;
      }

      .permissions-section {
        margin: 0 1rem 1rem;
      }

      .perm-section-title {
        font-size: 0.95rem;
        font-weight: 600;
        color: #1e293b;
        margin: 0 0 0.5rem;
      }

      .perm-card {
        background: #fff;
        border-radius: 10px;
        padding: 0.75rem;
        margin-bottom: 0.5rem;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 0.75rem;
      }

      .perm-info {
        flex: 1;
        min-width: 0;
      }

      .perm-title {
        font-weight: 600;
        font-size: 0.85rem;
        color: #1e293b;
      }

      .perm-subtitle {
        font-size: 0.75rem;
        color: #94a3b8;
        margin-top: 0.15rem;
      }

      .perm-status {
        font-size: 0.72rem;
        padding: 0.2rem 0.5rem;
        border-radius: 12px;
        font-weight: 600;
      }

      .status-pending {
        background: #fef3c7;
        color: #d97706;
      }
      .status-granted {
        background: #dcfce7;
        color: #16a34a;
      }
      .status-denied {
        background: #fee2e2;
        color: #dc2626;
      }

      .loading {
        text-align: center;
        padding: 2rem;
        color: #64748b;
      }
    `,
  ],
  template: `
    <div class="page-header">
      <h2>Bảng điểm</h2>
      <p class="subtitle">Lớp {{ profile?.className }}</p>
    </div>

    @if (loading()) {
      <div class="loading">Đang tải...</div>
    }

    @if (!loading()) {
      <div class="table-wrapper">
        @if (totalPages > 1) {
          <div class="table-nav">
            <button
              class="nav-btn"
              (click)="prevPage()"
              [disabled]="currentPage() === 0"
            >
              ‹
            </button>
            <span class="nav-indicator"
              >{{ currentPage() + 1 }} / {{ totalPages }}</span
            >
            <button
              class="nav-btn"
              (click)="nextPage()"
              [disabled]="currentPage() >= totalPages - 1"
            >
              ›
            </button>
          </div>
        }
        <div class="table-scroll">
          <table>
            <thead>
              <tr>
                <th class="stt">STT</th>
                <th class="name-cell">Họ tên</th>
                @for (a of paginatedAssignments(); track a.id) {
                  <th>{{ a.title }}</th>
                }
              </tr>
            </thead>
            <tbody>
              @for (row of rows(); track row.studentId; let idx = $index) {
                <tr>
                  <td class="stt">{{ idx + 1 }}</td>
                  <td class="name-cell">{{ row.fullName }}</td>
                  @for (a of paginatedAssignments(); track a.id) {
                    <td class="score-cell">
                      @if (row.scores.has(a.id)) {
                        {{ row.scores.get(a.id)?.score }}
                      } @else {
                        @if (row.studentId !== currentUid && canRequest(a.id)) {
                          <button
                            class="request-btn"
                            [class.sent]="
                              sentRequestMap()[a.id + '_' + row.studentId]
                            "
                            [disabled]="
                              sentRequestMap()[a.id + '_' + row.studentId]
                            "
                            (click)="requestView(a.id, row.studentId)"
                          >
                            {{
                              sentRequestMap()[a.id + '_' + row.studentId]
                                ? 'Đã gửi'
                                : 'Xin xem bài'
                            }}
                          </button>
                        } @else {
                          <span class="no-score">-</span>
                        }
                      }
                    </td>
                  }
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>

      @if (myPermissions().length > 0) {
        <div class="permissions-section">
          <h3 class="perm-section-title">Yêu cầu xem bài đã gửi</h3>
          @for (p of myPermissions(); track p.id) {
            <div class="perm-card">
              <div class="perm-info">
                <div class="perm-title">
                  Xin xem bài của {{ getStudentName(p.ownerId) }}
                </div>
                <div class="perm-subtitle">
                  {{ p.createdAt | date: 'dd/MM/yyyy HH:mm' }}
                </div>
              </div>
              <span class="perm-status" [class]="'status-' + p.status">
                {{ getStatusLabel(p.status) }}
              </span>
            </div>
          }
        </div>
      }
    }

    <student-navbar />
  `,
})
export class ScoreboardComponent implements OnInit {
  private authService = inject(AuthService);
  private firestoreService = inject(FirestoreService);
  private notificationService = inject(StudentNotificationService);
  private router = inject(Router);

  profile = this.authService.currentProfile;
  currentUid = this.authService.currentUser?.uid || '';

  students = signal<Student[]>([]);
  assignments = signal<Assignment[]>([]);
  grades = signal<Grade[]>([]);
  mySubmissions = signal<Submission[]>([]);
  myPermissions = signal<Permission[]>([]);
  rows = signal<ScoreRow[]>([]);
  sentRequestMap = signal<Record<string, boolean>>({});
  loading = signal(true);
  currentPage = signal(0);
  pageSize = signal(3);
  totalPages = 0;
  paginatedAssignments = signal<Assignment[]>([]);

  ngOnInit(): void {
    this.notificationService.markTabVisited('scoreboard');
    const uid = this.profile?.uid;
    if (uid) {
      this.firestoreService.updateStudent(uid, {
        lastScoreboardSeenAt: new Date().toISOString(),
      });
    }
    const groupId = this.profile?.groupId;
    if (!groupId) {
      this.loading.set(false);
      return;
    }

    this.firestoreService.getStudentsByGroup(groupId).subscribe((students) => {
      this.students.set(students);
      this.buildRows();
    });

    this.firestoreService
      .getAssignmentsByGroup(groupId)
      .subscribe((assignments) => {
        this.assignments.set(assignments);
        this.updatePageSize();
        this.loadGrades(assignments);
      });

    this.firestoreService
      .getPermissionsByRequester(this.currentUid)
      .subscribe((perms) => {
        this.myPermissions.set(perms);
        const map: Record<string, boolean> = {};
        perms.forEach((p) => {
          map[`${p.assignmentId}_${p.ownerId}`] = true;
        });
        this.sentRequestMap.set(map);
      });
  }

  private loadGrades(assignments: Assignment[]): void {
    const allGrades: Grade[] = [];
    let completed = 0;

    if (assignments.length === 0) {
      this.grades.set([]);
      this.buildRows();
      return;
    }

    assignments.forEach((a) => {
      this.firestoreService.getGradesByAssignment(a.id).subscribe((grades) => {
        allGrades.push(...grades);
        completed++;
        if (completed === assignments.length) {
          this.grades.set(allGrades);
          this.loadMySubmissions(assignments);
        }
      });
    });
  }

  private loadMySubmissions(assignments: Assignment[]): void {
    const allSubs: Submission[] = [];
    let completed = 0;

    if (assignments.length === 0) {
      this.mySubmissions.set([]);
      this.buildRows();
      return;
    }

    assignments.forEach((a) => {
      this.firestoreService
        .getSubmissionByStudentAndAssignment(this.currentUid, a.id)
        .subscribe((sub) => {
          if (sub) allSubs.push(sub);
          completed++;
          if (completed === assignments.length) {
            this.mySubmissions.set(allSubs);
            this.buildRows();
          }
        });
    });
  }

  buildRows(): void {
    const students = this.students();
    const assignments = this.assignments();
    const grades = this.grades();

    const rows: ScoreRow[] = students.map((s) => {
      const scores = new Map<
        string,
        { score: number; gradeId: string; submissionId: string }
      >();
      grades.forEach((g) => {
        if (g.studentId === s.uid) {
          const existing = scores.get(g.assignmentId);
          if (!existing || g.scoreValue > existing.score) {
            scores.set(g.assignmentId, {
              score: g.scoreValue,
              gradeId: g.id,
              submissionId: g.submissionId,
            });
          }
        }
      });
      return { studentId: s.uid, fullName: s.fullName, scores };
    });

    this.rows.set(rows);
    this.loading.set(false);
  }

  canRequest(assignmentId: string): boolean {
    return this.mySubmissions().some(
      (sub) => sub.assignmentId === assignmentId && sub.status === 'graded',
    );
  }

  async requestView(assignmentId: string, ownerId: string): Promise<void> {
    const key = `${assignmentId}_${ownerId}`;
    await this.firestoreService.requestPermission({
      requesterId: this.currentUid,
      ownerId,
      assignmentId,
      status: 'pending',
    });
    this.sentRequestMap.update((current) => ({ ...current, [key]: true }));
  }

  getStudentName(uid: string): string {
    return this.students().find((s) => s.uid === uid)?.fullName || uid;
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'pending':
        return 'Đang chờ';
      case 'granted':
        return 'Đã đồng ý';
      case 'denied':
        return 'Đã từ chối';
      default:
        return status;
    }
  }

  @HostListener('window:resize')
  onResize(): void {
    this.updatePageSize();
  }

  private updatePageSize(): void {
    const width = window.innerWidth;
    const availableWidth = width - (width < 768 ? 20 : 40) - 150 - 40;
    const colWidth = 100;
    this.pageSize.set(Math.max(1, Math.floor(availableWidth / colWidth)));
    this.updatePaginated();
  }

  private updatePaginated(): void {
    const ass = this.assignments();
    this.totalPages = Math.max(1, Math.ceil(ass.length / this.pageSize()));
    if (this.currentPage() >= this.totalPages) {
      this.currentPage.set(0);
    }
    const start = this.currentPage() * this.pageSize();
    this.paginatedAssignments.set(ass.slice(start, start + this.pageSize()));
  }

  nextPage(): void {
    if (this.currentPage() < this.totalPages - 1) {
      this.currentPage.update((p) => p + 1);
      this.updatePaginated();
    }
  }

  prevPage(): void {
    if (this.currentPage() > 0) {
      this.currentPage.update((p) => p - 1);
      this.updatePaginated();
    }
  }
}
