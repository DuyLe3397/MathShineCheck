import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { FirestoreService } from '../../services/firestore.service';
import { ImageService } from '../../services/image.service';
import { StudentNavbarComponent } from './student-navbar.component';
import { Permission, Assignment, Student } from '../../models';

interface PermissionWithInfo extends Permission {
  studentName?: string;
  assignmentTitle?: string;
}

@Component({
  selector: 'app-permissions',
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

      .tab-bar {
        display: flex;
        gap: 0;
        background: #fff;
        margin: 1rem;
        border-radius: 12px;
        padding: 4px;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
      }

      .tab-btn {
        flex: 1;
        padding: 0.55rem;
        border: none;
        background: transparent;
        border-radius: 10px;
        font-size: 0.8rem;
        font-weight: 600;
        color: #64748b;
        cursor: pointer;
        transition: all 0.2s;
        white-space: nowrap;
      }

      .tab-btn.active {
        background: #2563eb;
        color: #fff;
      }

      .content {
        padding: 0 1rem;
      }

      .perm-card {
        background: #fff;
        border-radius: 12px;
        padding: 0.85rem 1rem;
        margin-bottom: 0.65rem;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
      }

      .perm-card-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 0.75rem;
      }

      .perm-card-info {
        flex: 1;
        min-width: 0;
      }

      .perm-card-title {
        font-weight: 600;
        font-size: 0.9rem;
        color: #1e293b;
        margin-bottom: 0.2rem;
      }

      .perm-card-subtitle {
        font-size: 0.78rem;
        color: #94a3b8;
      }

      .perm-status {
        font-size: 0.72rem;
        padding: 0.2rem 0.55rem;
        border-radius: 12px;
        font-weight: 600;
        white-space: nowrap;
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

      .perm-actions {
        display: flex;
        gap: 0.5rem;
        margin-top: 0.65rem;
      }

      .action-accept {
        padding: 0.4rem 1rem;
        background: #16a34a;
        color: #fff;
        border: none;
        border-radius: 8px;
        font-size: 0.8rem;
        font-weight: 600;
        cursor: pointer;
      }

      .action-deny {
        padding: 0.4rem 1rem;
        background: #dc2626;
        color: #fff;
        border: none;
        border-radius: 8px;
        font-size: 0.8rem;
        font-weight: 600;
        cursor: pointer;
      }

      .action-view {
        padding: 0.4rem 1rem;
        background: #2563eb;
        color: #fff;
        border: none;
        border-radius: 8px;
        font-size: 0.8rem;
        font-weight: 600;
        cursor: pointer;
      }

      .action-accept:hover {
        background: #15803d;
      }
      .action-deny:hover {
        background: #b91c1c;
      }
      .action-view:hover {
        background: #1d4ed8;
      }

      .graded-section {
        margin-top: 1rem;
      }

      .section-title {
        font-size: 0.95rem;
        font-weight: 600;
        color: #1e293b;
        margin: 0 0 0.5rem;
      }

      .graded-images {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
      }

      .graded-image {
        width: 100%;
        border-radius: 10px;
        overflow: hidden;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
      }

      .graded-image img {
        width: 100%;
        display: block;
      }

      .empty-state {
        text-align: center;
        padding: 3rem 1rem;
        color: #94a3b8;
      }

      .empty-state .icon {
        font-size: 2.5rem;
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
    <div class="page-header">
      <h2>Yêu cầu</h2>
      <p class="subtitle">Quản lý yêu cầu xem bài</p>
    </div>

    <div class="tab-bar">
      <button
        class="tab-btn"
        [class.active]="activeTab() === 'sent'"
        (click)="activeTab.set('sent')"
      >
        Yêu cầu đã gửi
      </button>
      <button
        class="tab-btn"
        [class.active]="activeTab() === 'received'"
        (click)="activeTab.set('received')"
      >
        Yêu cầu nhận được
      </button>
      <button
        class="tab-btn"
        [class.active]="activeTab() === 'viewable'"
        (click)="activeTab.set('viewable')"
      >
        Đã được xem
      </button>
    </div>

    <div class="content">
      @if (loading()) {
        <div class="loading">Đang tải...</div>
      }

      <!-- Sent Requests -->
      @if (activeTab() === 'sent' && !loading()) {
        @if (sentPermissions().length === 0) {
          <div class="empty-state">
            <div class="icon">📤</div>
            <p>Chưa gửi yêu cầu nào</p>
          </div>
        }
        @for (p of sentPermissions(); track p.id) {
          <div class="perm-card">
            <div class="perm-card-header">
              <div class="perm-card-info">
                <div class="perm-card-title">
                  Xin xem bài:
                  {{ p.assignmentTitle || 'Bài tập #' + p.assignmentId }}
                </div>
                <div class="perm-card-subtitle">
                  {{ p.createdAt | date: 'dd/MM/yyyy HH:mm' }}
                </div>
              </div>
              <span class="perm-status" [class]="'status-' + p.status">
                {{ getStatusLabel(p.status) }}
              </span>
            </div>
          </div>
        }
      }

      <!-- Received Requests -->
      @if (activeTab() === 'received' && !loading()) {
        @if (receivedPermissions().length === 0) {
          <div class="empty-state">
            <div class="icon">📥</div>
            <p>Không có yêu cầu nào</p>
          </div>
        }
        @for (p of receivedPermissions(); track p.id) {
          <div class="perm-card">
            <div class="perm-card-header">
              <div class="perm-card-info">
                <div class="perm-card-title">
                  {{ p.studentName || p.requesterId }} muốn xem bài của bạn
                </div>
                <div class="perm-card-subtitle">
                  {{ p.createdAt | date: 'dd/MM/yyyy HH:mm' }}
                </div>
              </div>
              <span class="perm-status" [class]="'status-' + p.status">
                {{ getStatusLabel(p.status) }}
              </span>
            </div>
            @if (p.status === 'pending') {
              <div class="perm-actions">
                <button
                  class="action-accept"
                  (click)="updateStatus(p.id, 'granted')"
                >
                  Đồng ý
                </button>
                <button
                  class="action-deny"
                  (click)="updateStatus(p.id, 'denied')"
                >
                  Từ chối
                </button>
              </div>
            }
          </div>
        }
      }

      <!-- Viewable -->
      @if (activeTab() === 'viewable' && !loading()) {
        @if (viewablePermissions().length === 0) {
          <div class="empty-state">
            <div class="icon">👁️</div>
            <p>Chưa có bài nào để xem</p>
          </div>
        }
        @for (p of viewablePermissions(); track p.id) {
          <div class="perm-card">
            <div class="perm-card-header">
              <div class="perm-card-info">
                <div class="perm-card-title">
                  Bài của {{ p.studentName || p.ownerId }}
                </div>
                <div class="perm-card-subtitle">
                  {{ getAssignmentTitle(p.assignmentId) }}
                </div>
              </div>
            </div>
            <div class="perm-actions">
              <button class="action-view" (click)="viewGradedImages(p)">
                Xem bài
              </button>
            </div>
            @if (viewedImages()[p.id]) {
              <div class="graded-section">
                <h4 class="section-title">Ảnh đã chấm</h4>
                <div class="graded-images">
                  @for (url of viewedImages()[p.id]; track $index) {
                    <div class="graded-image">
                      <img [src]="url" alt="Graded" />
                    </div>
                  }
                </div>
              </div>
            }
          </div>
        }
      }
    </div>

    <student-navbar />
  `,
})
export class PermissionsComponent implements OnInit {
  private authService = inject(AuthService);
  private firestoreService = inject(FirestoreService);
  private imageService = inject(ImageService);
  private router = inject(Router);

  profile = this.authService.currentProfile;
  currentUid = this.authService.currentUser?.uid || '';

  activeTab = signal<'sent' | 'received' | 'viewable'>('sent');
  loading = signal(true);

  sentPermissions = signal<PermissionWithInfo[]>([]);
  receivedPermissions = signal<PermissionWithInfo[]>([]);
  viewablePermissions = signal<PermissionWithInfo[]>([]);
  viewedImages = signal<Record<string, string[]>>({});

  private assignmentsMap = signal<Map<string, string>>(new Map());
  private studentsMap = signal<Map<string, string>>(new Map());

  ngOnInit(): void {
    const groupId = this.profile?.groupId;
    if (!groupId) {
      this.loading.set(false);
      return;
    }

    this.firestoreService
      .getAssignmentsByGroup(groupId)
      .subscribe((assignments) => {
        const map = new Map<string, string>();
        assignments.forEach((a) => map.set(a.id, a.title));
        this.assignmentsMap.set(map);
      });

    this.firestoreService.getStudentsByGroup(groupId).subscribe((students) => {
      const map = new Map<string, string>();
      students.forEach((s) => map.set(s.uid, s.fullName));
      this.studentsMap.set(map);
    });

    this.firestoreService
      .getPermissionsByRequester(this.currentUid)
      .subscribe((perms) => {
        this.sentPermissions.set(this.enrichPermissions(perms));
      });

    this.firestoreService
      .getPermissionsForOwner(this.currentUid)
      .subscribe((perms) => {
        this.receivedPermissions.set(this.enrichPermissions(perms));
        this.viewablePermissions.set(
          this.enrichPermissions(perms.filter((p) => p.status === 'granted')),
        );
      });

    this.loading.set(false);
  }

  private enrichPermissions(perms: Permission[]): PermissionWithInfo[] {
    const students = this.studentsMap();
    const assignments = this.assignmentsMap();
    return perms.map((p) => ({
      ...p,
      studentName: students.get(p.requesterId) || students.get(p.ownerId),
      assignmentTitle: assignments.get(p.assignmentId),
    }));
  }

  getAssignmentTitle(assignmentId: string): string {
    return (
      this.assignmentsMap().get(assignmentId) || 'Bài tập #' + assignmentId
    );
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

  async updateStatus(id: string, status: 'granted' | 'denied'): Promise<void> {
    await this.firestoreService.updatePermissionStatus(id, status);
    this.firestoreService
      .getPermissionsForOwner(this.currentUid)
      .subscribe((perms) => {
        this.receivedPermissions.set(this.enrichPermissions(perms));
        this.viewablePermissions.set(
          this.enrichPermissions(perms.filter((p) => p.status === 'granted')),
        );
      });
  }

  async viewGradedImages(p: PermissionWithInfo): Promise<void> {
    const urls: string[] = [];
    const submission =
      await this.firestoreService.getSubmissionByStudentAssignment(
        p.ownerId,
        p.assignmentId,
      );
    if (submission && submission.imageIds) {
      for (const imageId of submission.imageIds) {
        try {
          const base64Data =
            await this.imageService.getSubmissionImage(imageId);
          if (base64Data) urls.push(base64Data);
        } catch {
          break;
        }
      }
    }

    this.viewedImages.update((current) => ({ ...current, [p.id]: urls }));
  }
}
