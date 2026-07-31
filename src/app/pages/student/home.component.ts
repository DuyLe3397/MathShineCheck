import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { FirestoreService } from '../../services/firestore.service';
import { StudentNotificationService } from '../../services/student-notification.service';
import { StudentNavbarComponent } from './student-navbar.component';
import {
  Assignment,
  Submission,
  Grade,
  Permission,
  Student,
} from '../../models';

interface AttemptInfo {
  submissionId: string;
  attemptNumber: number;
  status: 'submitted' | 'graded';
  score?: number;
  gradedAt?: string;
}

interface AssignmentWithAttempts extends Assignment {
  attempts: AttemptInfo[];
  bestScore: number | undefined;
  isCompleted: boolean;
  nextAttemptNumber: number;
}

interface PendingRequest {
  permissionId: string;
  requesterName: string;
  requesterId: string;
  assignmentTitle: string;
  attemptNumber: number;
}

@Component({
  selector: 'app-student-home',
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
      .header {
        background: linear-gradient(135deg, #2563eb, #1d4ed8);
        color: #fff;
        padding: 1.5rem 1rem;
        border-radius: 0 0 24px 24px;
      }
      .header h1 {
        margin: 0;
        font-size: 1.5rem;
        font-weight: 700;
      }
      .header .subtitle {
        margin: 0.25rem 0 0;
        opacity: 0.85;
        font-size: 0.9rem;
      }
      .content {
        padding: 0.75rem 1rem 0;
      }

      .notif-card {
        background: #fef3c7;
        border-radius: 12px;
        padding: 0.85rem 1rem;
        margin-bottom: 0.75rem;
        border: 1.5px solid #f59e0b;
      }
      .notif-text {
        font-size: 0.85rem;
        color: #92400e;
        margin-bottom: 0.5rem;
        line-height: 1.4;
      }
      .notif-text strong {
        color: #1e293b;
      }
      .notif-actions {
        display: flex;
        gap: 8px;
      }
      .notif-btn {
        padding: 0.35rem 1rem;
        border: none;
        border-radius: 8px;
        font-size: 0.8rem;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.15s;
      }
      .notif-btn-accept {
        background: #16a34a;
        color: #fff;
      }
      .notif-btn-accept:hover {
        background: #15803d;
      }
      .notif-btn-deny {
        background: #dc2626;
        color: #fff;
      }
      .notif-btn-deny:hover {
        background: #b91c1c;
      }

      .assignment-card {
        background: #fff;
        border-radius: 12px;
        padding: 1rem;
        margin-bottom: 0.75rem;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
        cursor: pointer;
        transition: all 0.2s;
        border: 2px solid transparent;
      }
      .assignment-card:hover,
      .assignment-card:active {
        border-color: #2563eb;
        box-shadow: 0 3px 12px rgba(37, 99, 235, 0.2);
      }
      .card-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 0.75rem;
      }
      .card-info {
        flex: 1;
        min-width: 0;
      }
      .assignment-title {
        font-weight: 700;
        font-size: 1.1rem;
        color: #1e293b;
        margin-bottom: 0.25rem;
      }
      .assignment-date {
        font-size: 0.78rem;
        color: #94a3b8;
      }
      .assignment-desc {
        font-size: 0.82rem;
        color: #64748b;
        margin-top: 0.35rem;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .status-badge {
        font-size: 0.72rem;
        padding: 0.2rem 0.55rem;
        border-radius: 20px;
        font-weight: 600;
        white-space: nowrap;
        flex-shrink: 0;
      }
      .status-not-submitted {
        background: #fef3c7;
        color: #d97706;
      }
      .status-improving {
        background: #fce7f3;
        color: #db2777;
      }
      .status-completed {
        background: #dcfce7;
        color: #16a34a;
      }

      .attempt-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0.5rem 0.75rem;
        margin-top: 0.5rem;
        background: #f8fafc;
        border-radius: 8px;
        border: 1px solid #e2e8f0;
      }
      .attempt-label {
        font-size: 0.95rem;
        font-weight: 600;
        color: #334155;
      }
      .attempt-score-red {
        font-weight: 800;
        color: #dc2626;
      }
      .attempt-score-green {
        font-weight: 800;
        color: #16a34a;
      }
      .attempt-pending {
        font-weight: 800;
        color: #dc2626;
      }
      .badge-completed {
        display: inline-flex;
        align-items: center;
        gap: 0.3rem;
        background: #dcfce7;
        color: #16a34a;
        font-weight: 800;
        font-size: 0.75rem;
        padding: 0.25rem 0.6rem;
        border-radius: 20px;
        transform: rotate(0deg);
        white-space: nowrap;
        flex-shrink: 0;
      }
      .badge-improving {
        display: inline-flex;
        align-items: center;
        gap: 0.3rem;
        background: #fef3c7;
        color: #d97706;
        font-weight: 800;
        font-size: 0.72rem;
        padding: 0.25rem 0.6rem;
        border-radius: 20px;
        white-space: nowrap;
        flex-shrink: 0;
      }
      .btn-view-attempt {
        padding: 0.3rem 0.7rem;
        border: 1.5px solid #2563eb;
        border-radius: 6px;
        background: transparent;
        color: #2563eb;
        font-size: 0.78rem;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s;
        flex-shrink: 0;
      }
      .btn-view-attempt:hover {
        background: #eff6ff;
      }
      .comment-badge {
        display: inline-block;
        margin-left: 4px;
        background: #ef4444;
        color: #fff;
        font-weight: 800;
        font-size: 0.72rem;
        padding: 1px 5px;
        border-radius: 8px;
        line-height: 1.3;
      }
      .btn-new-attempt {
        display: block;
        width: 100%;
        margin-top: 0.6rem;
        padding: 0.55rem;
        border: 2px dashed #2563eb;
        border-radius: 8px;
        background: transparent;
        color: #2563eb;
        font-size: 0.85rem;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s;
      }
      .btn-new-attempt:hover {
        background: #eff6ff;
        border-style: solid;
      }

      .empty-state {
        text-align: center;
        padding: 3rem 1rem;
        color: #94a3b8;
      }
      .empty-state .icon {
        font-size: 3rem;
        margin-bottom: 0.5rem;
      }
      .loading {
        text-align: center;
        padding: 2rem;
        color: #64748b;
      }
    `,
  ],
  template: `
    <div class="header">
      <h1>Xin chào, {{ profile?.fullName }}</h1>
      <p class="subtitle">{{ profile?.className }} | {{ groupName() }}</p>
    </div>

    <div class="content">
      @if (loading()) {
        <div class="loading">Đang tải...</div>
      }

      @for (req of pendingRequests(); track req.permissionId) {
        <div class="notif-card">
          <div class="notif-text">
            <strong>{{ req.requesterName }}</strong> muốn được xem bài làm
            <strong>{{ req.assignmentTitle }}</strong> (lần
            {{ req.attemptNumber }}). Bạn có chấp nhận cho xem không?
          </div>
          <div class="notif-actions">
            <button
              class="notif-btn notif-btn-accept"
              (click)="respondRequest(req.permissionId, 'granted')"
            >
              Có
            </button>
            <button
              class="notif-btn notif-btn-deny"
              (click)="respondRequest(req.permissionId, 'denied')"
            >
              Không
            </button>
          </div>
        </div>
      }

      @if (!loading()) {
        @if (assignments().length === 0) {
          <div class="empty-state">
            <div class="icon">∅</div>
            <p>Chưa có bài tập nào</p>
          </div>
        }
        @for (item of assignments(); track item.id) {
          <div class="assignment-card" (click)="viewPeers(item.id)">
            <div class="card-header">
              <div class="card-info">
                <div class="assignment-title">{{ item.title }}</div>
                <div class="assignment-date">
                  {{ item.sessionDate | date: 'dd/MM/yyyy' }}
                </div>
                @if (item.description) {
                  <div class="assignment-desc">{{ item.description }}</div>
                }
              </div>
              @if (item.isCompleted) {
                <span class="badge-completed"> hoàn thành 10/10 </span>
              } @else if (item.attempts.length > 0) {
                <span class="badge-improving">
                  điểm tối đa đạt được là {{ item.bestScore ?? '?' }}/10
                </span>
              } @else {
                <span class="status-badge status-not-submitted">
                  Chưa nộp
                </span>
              }
            </div>

            @for (attempt of item.attempts; track attempt.submissionId) {
              <div class="attempt-row">
                <span class="attempt-label">
                  Kết quả chấm BTVN lần {{ attempt.attemptNumber }}:
                  @if (attempt.status === 'graded' && attempt.score != null) {
                    @if (attempt.score === 10) {
                      <span class="attempt-score-green">
                        {{ attempt.score }}/10</span
                      >
                    } @else {
                      <span class="attempt-score-red">
                        {{ attempt.score }}/10</span
                      >
                    }
                  } @else {
                    <span class="attempt-pending"> Chờ chấm</span>
                  }
                </span>
                <button
                  class="btn-view-attempt"
                  (click)="viewAttempt($event, attempt.submissionId)"
                >
                  Xem
                  @if (unreadCommentCounts()[attempt.submissionId]) {
                    <span class="comment-badge"
                      >+{{ unreadCommentCounts()[attempt.submissionId] }}</span
                    >
                  }
                </button>
              </div>
            }

            @if (!item.isCompleted) {
              <button
                class="btn-new-attempt"
                (click)="submitAttempt($event, item.id, item.nextAttemptNumber)"
              >
                Nộp bài lần {{ item.nextAttemptNumber }}
              </button>
            }
          </div>
        }
      }
    </div>

    <student-navbar />
  `,
})
export class StudentHomeComponent implements OnInit {
  private authService = inject(AuthService);
  private firestoreService = inject(FirestoreService);
  private notificationService = inject(StudentNotificationService);
  private router = inject(Router);

  profile = this.authService.currentProfile;

  loading = signal(true);
  unreadCommentCounts = signal<Record<string, number>>({});
  assignments = signal<AssignmentWithAttempts[]>([]);
  pendingRequests = signal<PendingRequest[]>([]);
  groupName = signal('');

  private allStudents: Student[] = [];
  private allAssignments: Assignment[] = [];

  ngOnInit(): void {
    this.notificationService.markTabVisited('home');
    if (this.profile?.uid) {
      this.firestoreService.updateStudent(this.profile.uid, {
        lastHomeSeenAt: new Date().toISOString(),
      });
    }
    this.loadData();
  }

  async loadData(): Promise<void> {
    const groupId = this.profile?.groupId;
    const uid = this.profile?.uid;
    if (!groupId || !uid) {
      this.loading.set(false);
      return;
    }

    this.firestoreService.getStudentsByGroup(groupId).subscribe((students) => {
      this.allStudents = students;
    });

    this.firestoreService.getGroup(groupId).subscribe((group) => {
      if (group) {
        this.groupName.set(group.name);
      }
    });

    this.firestoreService.getAssignmentsByGroup(groupId).subscribe({
      next: async (rawAssignments) => {
        this.allAssignments = rawAssignments;
        const items: AssignmentWithAttempts[] = [];

        for (const assignment of rawAssignments) {
          try {
            const subs: Submission[] = await new Promise((resolve) => {
              this.firestoreService
                .getAllSubmissionsByStudentAndAssignment(uid, assignment.id)
                .subscribe({
                  next: (s) => resolve(s),
                  error: () => resolve([]),
                });
            });

            const attempts: AttemptInfo[] = [];
            let bestScore: number | undefined;
            let isCompleted = false;

            for (let i = 0; i < subs.length; i++) {
              const sub = subs[i];
              let score: number | undefined;
              let gradedAt: string | undefined;

              if (sub.status === 'graded') {
                const grade = await new Promise<Grade | null>((resolve) => {
                  this.firestoreService.getGradeBySubmission(sub.id).subscribe({
                    next: (g) => resolve(g),
                    error: () => resolve(null),
                  });
                });
                if (grade) {
                  score = grade.scoreValue;
                  gradedAt = grade.gradedAt;
                  if (bestScore === undefined || score > bestScore)
                    bestScore = score;
                  if (score === 10) isCompleted = true;
                }
              }

              attempts.push({
                submissionId: sub.id,
                attemptNumber: sub.attemptNumber || i + 1,
                status: sub.status as 'submitted' | 'graded',
                score,
                gradedAt,
              });
            }

            items.push({
              ...assignment,
              attempts,
              bestScore,
              isCompleted,
              nextAttemptNumber: subs.length + 1,
            });
          } catch {
            items.push({
              ...assignment,
              attempts: [],
              bestScore: undefined,
              isCompleted: false,
              nextAttemptNumber: 1,
            });
          }
        }

        this.assignments.set(items);
        this.loadUnreadCommentCounts(items);
        this.loading.set(false);
        this.loadPendingRequests();
      },
      error: () => {
        this.loading.set(false);
      },
    });
  }

  private async loadPendingRequests(): Promise<void> {
    const uid = this.profile?.uid;
    if (!uid) return;

    this.firestoreService.getPermissionsForOwner(uid).subscribe((perms) => {
      const pending = perms.filter((p) => p.status === 'pending');
      const requests: PendingRequest[] = [];

      pending.forEach((p) => {
        const requester = this.allStudents.find((s) => s.uid === p.requesterId);
        const assignment = this.allAssignments.find(
          (a) => a.id === p.assignmentId,
        );
        const name = requester?.fullName || p.requesterId;
        const title = assignment?.title || p.assignmentId;

        this.firestoreService
          .getAllSubmissionsByStudentAndAssignment(
            p.requesterId,
            p.assignmentId,
          )
          .subscribe((subs) => {
            const attemptNumber =
              subs.length > 0
                ? subs[subs.length - 1].attemptNumber || subs.length
                : 1;
            requests.push({
              permissionId: p.id,
              requesterName: name,
              requesterId: p.requesterId,
              assignmentTitle: title,
              attemptNumber,
            });
            this.pendingRequests.set([...requests]);
          });
      });
      this.pendingRequests.set(requests);
    });
  }

  private loadUnreadCommentCounts(items: AssignmentWithAttempts[]): void {
    const counts: Record<string, number> = {};
    let completed = 0;
    const allSubIds = items.flatMap((a) =>
      a.attempts.map((att) => att.submissionId),
    );
    if (allSubIds.length === 0) return;
    allSubIds.forEach((subId) => {
      this.firestoreService.getSubmission(subId).then((sub) => {
        const lastSeen = sub?.lastCommentSeenAt
          ? new Date(sub.lastCommentSeenAt).getTime()
          : 0;
        this.firestoreService
          .getCommentsBySubmission(subId)
          .subscribe((comments) => {
            const unread = comments.filter(
              (c) => new Date(c.createdAt).getTime() > lastSeen,
            ).length;
            if (unread > 0) counts[subId] = unread;
            completed++;
            if (completed === allSubIds.length) {
              this.unreadCommentCounts.set(counts);
            }
          });
      });
    });
  }

  async respondRequest(
    permissionId: string,
    status: 'granted' | 'denied',
  ): Promise<void> {
    await this.firestoreService.updatePermissionStatus(permissionId, status);
    this.pendingRequests.update((list) =>
      list.filter((r) => r.permissionId !== permissionId),
    );
  }

  viewPeers(assignmentId: string): void {
    this.router.navigate(['/student/peers', assignmentId]);
  }

  viewAttempt(event: Event, submissionId: string): void {
    event.stopPropagation();
    this.router.navigate(['/student/results', submissionId]);
  }

  submitAttempt(
    event: Event,
    assignmentId: string,
    attemptNumber: number,
  ): void {
    event.stopPropagation();
    this.router.navigate(['/student/submit', assignmentId], {
      queryParams: { attempt: attemptNumber },
    });
  }
}
