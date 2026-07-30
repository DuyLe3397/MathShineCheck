import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { FirestoreService } from '../../services/firestore.service';
import { ImageService } from '../../services/image.service';
import {
  Assignment,
  Submission,
  Grade,
  Student,
  Permission,
} from '../../models';

interface PeerAttempt {
  attemptNumber: number;
  score?: number;
  submissionId: string;
  imageUrls: string[];
}

interface PeerInfo {
  student: Student;
  attempts: PeerAttempt[];
  permissionStatus: 'none' | 'pending' | 'granted' | 'denied';
}

@Component({
  selector: 'app-peers',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
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
        padding: 1rem;
        display: flex;
        align-items: center;
        gap: 0.75rem;
      }
      .back-btn {
        background: none;
        border: none;
        color: #fff;
        font-size: 1.3rem;
        cursor: pointer;
        line-height: 1;
      }
      .page-header h2 {
        margin: 0;
        font-size: 1.15rem;
        font-weight: 600;
      }
      .page-header .sub {
        font-size: 0.8rem;
        opacity: 0.85;
        margin-left: auto;
      }
      .container {
        padding: 1rem;
        max-width: 800px;
        margin: 0 auto;
      }

      .peer-card {
        background: #fff;
        border-radius: 12px;
        padding: 0.85rem 1rem;
        margin-bottom: 0.7rem;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
      }
      .peer-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 0.5rem;
      }
      .peer-name {
        font-weight: 700;
        font-size: 1rem;
        color: #1e293b;
      }
      .peer-attempts {
        display: flex;
        flex-wrap: wrap;
        gap: 5px;
        margin-bottom: 0.5rem;
      }
      .peer-attempt-tag {
        font-size: 0.72rem;
        padding: 0.15rem 0.45rem;
        border-radius: 6px;
        background: #dbeafe;
        color: #2563eb;
        font-weight: 600;
        white-space: nowrap;
      }

      .peer-images {
        display: flex;
        gap: 6px;
        flex-wrap: wrap;
      }
      .peer-thumb {
        width: 70px;
        height: 70px;
        border-radius: 8px;
        overflow: hidden;
        position: relative;
        flex-shrink: 0;
        border: 1px solid #e2e8f0;
      }
      .peer-thumb img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        display: block;
      }
      .peer-thumb.blurred img {
        filter: blur(14px);
      }

      .attempt-row {
        display: flex;
        align-items: flex-start;
        gap: 0.75rem;
        padding: 0.4rem 0;
        border-bottom: 1px solid #f1f5f9;
      }
      .attempt-row:last-child {
        border-bottom: none;
      }
      .attempt-label {
        font-size: 0.82rem;
        font-weight: 600;
        color: #334155;
        min-width: 85px;
        flex-shrink: 0;
        padding-top: 0.2rem;
      }
      .score-value {
        font-weight: 800;
        font-size: 1.05rem;
        color: #dc2626;
      }
      .score-value.score-perfect {
        color: #16a34a;
      }
      .attempt-images {
        display: flex;
        gap: 6px;
        flex-wrap: wrap;
      }

      .perm-btn {
        padding: 0.3rem 0.7rem;
        border: none;
        border-radius: 6px;
        font-size: 0.72rem;
        font-weight: 600;
        cursor: pointer;
        white-space: nowrap;
        transition: all 0.15s;
        flex-shrink: 0;
      }
      .perm-btn-request {
        background: #2563eb;
        color: #fff;
      }
      .perm-btn-request:hover {
        background: #1d4ed8;
      }
      .perm-btn-sent {
        background: #fef3c7;
        color: #d97706;
        cursor: not-allowed;
      }
      .perm-btn-granted {
        background: #dcfce7;
        color: #16a34a;
        cursor: pointer;
      }
      .perm-btn-granted:hover {
        background: #bbf7d0;
      }
      .perm-btn-denied {
        background: #fee2e2;
        color: #dc2626;
        cursor: not-allowed;
      }

      .loading {
        text-align: center;
        padding: 3rem;
        color: #64748b;
      }
      .spinner {
        width: 44px;
        height: 44px;
        margin: 0 auto 1rem;
        border: 4px solid #dbeafe;
        border-top-color: #2563eb;
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
      }
      @keyframes spin {
        to {
          transform: rotate(360deg);
        }
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

      .student-nav {
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        height: 64px;
        background: #fff;
        border-top: 1px solid #e2e8f0;
        display: flex;
        justify-content: space-around;
        align-items: center;
        padding: 0 1rem;
      }
      .nav-link {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 2px;
        text-decoration: none;
        color: #94a3b8;
        font-size: 0.65rem;
        font-weight: 500;
        padding: 6px 12px;
        border-radius: 8px;
        transition: all 0.2s;
      }
      .nav-link.active {
        color: #2563eb;
      }
      .nav-link .icon {
        font-size: 1.2rem;
      }

      .lightbox {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.92);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 9999;
        cursor: zoom-out;
        padding: 1rem;
      }

      .lightbox img {
        max-width: 100%;
        max-height: 100%;
        object-fit: contain;
        border-radius: 4px;
        box-shadow: 0 4px 30px rgba(0, 0, 0, 0.5);
      }
    `,
  ],
  template: `
    <div class="page-header">
      <button class="back-btn" (click)="goBack()">←</button>
      <h2>{{ assignmentTitle }}</h2>
      <span class="sub">{{ groupName }}</span>
    </div>

    <div class="container">
      @if (loading()) {
        <div class="loading">
          <div class="spinner"></div>
          Tải danh sách bài làm của các học sinh sẽ hơi lâu, vui lòng đợi...
        </div>
      }

      @if (!loading() && peers().length === 0) {
        <div class="empty-state">
          <div class="icon">∅</div>
          <p>Chưa có học sinh nào</p>
        </div>
      }

      @for (peer of peers(); track peer.student.uid) {
        <div class="peer-card">
          <div class="peer-header">
            <div class="peer-name">{{ peer.student.fullName }}</div>
            @if (peer.student.uid === profile?.uid) {
              <span style="font-size:0.72rem;color:#94a3b8;">Bạn</span>
            } @else if (peer.permissionStatus === 'granted') {
              <button
                class="perm-btn perm-btn-granted"
                (click)="viewPeerImages(peer)"
              >
                Xem bài
              </button>
            } @else if (peer.permissionStatus === 'pending') {
              <button class="perm-btn perm-btn-sent" disabled>Đã gửi</button>
            } @else if (peer.permissionStatus === 'denied') {
              <button class="perm-btn perm-btn-denied" disabled>
                Đã từ chối
              </button>
            } @else {
              <button
                class="perm-btn perm-btn-request"
                (click)="requestView(peer)"
              >
                Yêu cầu xem
              </button>
            }
          </div>

          @if (peer.attempts.length === 0) {
            <div style="padding:0.3rem 0;font-size:0.78rem;color:#94a3b8;">
              Chưa nộp bài
            </div>
          }

          @for (a of peer.attempts; track a.submissionId) {
            <div class="attempt-row">
              <div class="attempt-label">
                Lần {{ a.attemptNumber }}:
                <span
                  class="score-value"
                  [class.score-perfect]="a.score === 10"
                >
                  {{ a.score ?? '?' }}đ
                </span>
              </div>
              <div class="attempt-images">
                @for (url of a.imageUrls; track $index) {
                  <div
                    class="peer-thumb"
                    [class.blurred]="
                      peer.student.uid !== profile?.uid &&
                      peer.permissionStatus !== 'granted'
                    "
                    (click)="
                      openZoom(url, peer.student.uid, peer.permissionStatus)
                    "
                  >
                    <img [src]="url" alt="Bài làm" />
                  </div>
                }
              </div>
            </div>
          }
        </div>
      }
    </div>

    @if (zoomedImage()) {
      <div class="lightbox" (click)="closeZoom()">
        <img
          [src]="zoomedImage()"
          alt="Phóng to"
          (click)="$event.stopPropagation()"
        />
      </div>
    }

    <div class="student-nav">
      <a class="nav-link" routerLink="/student/home" routerLinkActive="active">
        Trang chủ
      </a>
      <a
        class="nav-link"
        routerLink="/student/scoreboard"
        routerLinkActive="active"
      >
        Bảng điểm
      </a>
      <a
        class="nav-link"
        routerLink="/student/discussions"
        routerLinkActive="active"
      >
        Thảo luận
      </a>
    </div>
  `,
})
export class PeersComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private authService = inject(AuthService);
  private firestoreService = inject(FirestoreService);
  private imageService = inject(ImageService);

  profile = this.authService.currentProfile;

  assignmentId = '';
  assignmentTitle = '';
  groupName = '';
  loading = signal(true);
  peers = signal<PeerInfo[]>([]);
  zoomedImage = signal<string | null>(null);

  ngOnInit(): void {
    this.assignmentId = this.route.snapshot.paramMap.get('assignmentId') || '';
    if (!this.assignmentId) {
      this.router.navigate(['/student/home']);
      return;
    }
    this.loadPeers();
  }

  private async loadPeers(): Promise<void> {
    const uid = this.profile?.uid;
    const groupId = this.profile?.groupId;
    if (!uid || !groupId) {
      this.loading.set(false);
      return;
    }

    const assignment = await this.firestoreService.getAssignment(
      this.assignmentId,
    );
    this.assignmentTitle = assignment?.title || 'Bài tập';

    const students = await new Promise<Student[]>((resolve) => {
      this.firestoreService.getStudentsByGroup(groupId).subscribe({
        next: (s) => resolve(s),
        error: () => resolve([]),
      });
    });

    const peerList: PeerInfo[] = [];
    for (const student of students) {
      const subs: Submission[] = await new Promise((resolve) => {
        this.firestoreService
          .getAllSubmissionsByStudentAndAssignment(
            student.uid,
            this.assignmentId,
          )
          .subscribe({ next: (s) => resolve(s), error: () => resolve([]) });
      });

      const attempts: PeerAttempt[] = [];
      for (let i = 0; i < subs.length; i++) {
        const sub = subs[i];
        let score: number | undefined;
        if (sub.status === 'graded') {
          const grade = await new Promise<Grade | null>((resolve) => {
            this.firestoreService.getGradeBySubmission(sub.id).subscribe({
              next: (g) => resolve(g),
              error: () => resolve(null),
            });
          });
          if (grade) score = grade.scoreValue;
        }

        const imageUrls: string[] = [];
        for (const imageId of sub.imageIds) {
          try {
            const url = await this.imageService.getSubmissionImage(imageId);
            if (url) imageUrls.push(url);
            if (imageUrls.length >= 2) break;
          } catch {
            /* skip */
          }
        }

        attempts.push({
          attemptNumber: sub.attemptNumber || i + 1,
          score,
          submissionId: sub.id,
          imageUrls,
        });
      }

      let permissionStatus: 'none' | 'pending' | 'granted' | 'denied' = 'none';
      if (student.uid !== uid) {
        const perms = await new Promise<Permission[]>((resolve) => {
          this.firestoreService.getPermissionsForOwner(student.uid).subscribe({
            next: (p) =>
              resolve(
                p.filter(
                  (x) =>
                    x.requesterId === uid &&
                    x.assignmentId === this.assignmentId,
                ),
              ),
            error: () => resolve([]),
          });
        });
        if (perms.length > 0) {
          const p = perms[0];
          if (p.status === 'granted') permissionStatus = 'granted';
          else if (p.status === 'pending') permissionStatus = 'pending';
          else if (p.status === 'denied') permissionStatus = 'denied';
        }
      }

      peerList.push({ student, attempts, permissionStatus });
    }

    this.peers.set(peerList);
    this.loading.set(false);
  }

  async requestView(peer: PeerInfo): Promise<void> {
    const uid = this.profile?.uid;
    if (!uid) return;

    await this.firestoreService.requestPermission({
      requesterId: uid,
      ownerId: peer.student.uid,
      assignmentId: this.assignmentId,
      status: 'pending',
    });

    const list = this.peers();
    const idx = list.findIndex((p) => p.student.uid === peer.student.uid);
    if (idx >= 0) {
      list[idx] = { ...list[idx], permissionStatus: 'pending' };
      this.peers.set([...list]);
    }
  }

  viewPeerImages(peer: PeerInfo): void {
    if (peer.attempts.length > 0) {
      this.router.navigate(['/student/results', peer.attempts[0].submissionId]);
    }
  }

  openZoom(url: string, studentUid: string, permissionStatus: string): void {
    if (studentUid === this.profile?.uid || permissionStatus === 'granted') {
      this.zoomedImage.set(url);
    }
  }

  closeZoom(): void {
    this.zoomedImage.set(null);
  }

  goBack(): void {
    this.router.navigate(['/student/home']);
  }
}
