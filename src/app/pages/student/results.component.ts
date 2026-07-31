import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { FirestoreService } from '../../services/firestore.service';
import { ImageService } from '../../services/image.service';
import { Grade, Submission, SubmissionComment } from '../../models';

@Component({
  selector: 'app-results',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  styles: [
    `
      :host {
        display: block;
        min-height: 100vh;
        background: #f5f7fa;
        padding-bottom: 40px;
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
        padding: 0;
        line-height: 1;
      }

      .page-header h2 {
        margin: 0;
        font-size: 1.15rem;
        font-weight: 600;
        flex: 1;
      }

      .btn-peers {
        padding: 0.35rem 0.8rem;
        border: 1.5px solid rgba(255, 255, 255, 0.5);
        border-radius: 8px;
        background: transparent;
        color: #fff;
        font-size: 0.78rem;
        font-weight: 600;
        cursor: pointer;
        white-space: nowrap;
        transition: all 0.2s;
        flex-shrink: 0;
      }

      .btn-peers:hover {
        background: rgba(255, 255, 255, 0.15);
        border-color: #fff;
      }

      .container {
        padding: 1rem;
      }

      .score-section {
        text-align: center;
        padding: 2rem 1rem;
        background: #fff;
        border-radius: 16px;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
        margin-bottom: 1.25rem;
      }

      .score-label {
        font-size: 0.9rem;
        color: #64748b;
        margin-bottom: 0.5rem;
      }

      .score-value {
        font-size: 3.5rem;
        font-weight: 800;
        color: #dc2626;
        line-height: 1.1;
      }

      .score-comment {
        margin-top: 0.75rem;
        padding: 0.75rem;
        background: #f8fafc;
        border-radius: 8px;
        font-size: 0.9rem;
        color: #475569;
        white-space: pre-wrap;
      }

      .no-grade {
        text-align: center;
        padding: 2rem;
        color: #94a3b8;
      }

      .section-title {
        font-size: 1rem;
        font-weight: 600;
        color: #1e293b;
        margin: 0 0 0.75rem;
      }

      .submission-images {
        display: flex;
        flex-wrap: wrap;
        gap: 1rem;
      }

      .submission-image-card {
        background: #fff;
        border-radius: 12px;
        overflow: hidden;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
        flex: 1 1 100%;
        min-width: 0;
      }

      @media (min-width: 768px) {
        .submission-image-card {
          flex: 1 1 calc(50% - 0.5rem);
        }
      }

      .submission-image-card img {
        width: 100%;
        height: auto;
        aspect-ratio: 1;
        object-fit: cover;
        display: block;
        cursor: zoom-in;
      }

      .comments-section {
        padding: 0.75rem;
        border-top: 1px solid #f1f5f9;
      }

      .comments-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        cursor: pointer;
        padding: 0.25rem 0 0.5rem;
        font-weight: 600;
        font-size: 0.88rem;
        color: #1e293b;
        user-select: none;
      }
      .comments-header:hover {
        color: #2563eb;
      }
      .comments-toggle {
        font-size: 0.7rem;
        color: #94a3b8;
      }

      .comments-list {
        margin-bottom: 0.75rem;
      }

      .comment-content {
        color: #334155;
        word-break: break-word;
      }

      .comment-time {
        font-size: 0.72rem;
        color: #94a3b8;
        margin-top: 0.15rem;
      }

      .comment-input-row {
        display: flex;
        gap: 0.5rem;
      }

      .comment-input {
        flex: 1;
        padding: 0.5rem 0.75rem;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        font-size: 0.85rem;
        outline: none;
      }

      .comment-input:focus {
        border-color: #2563eb;
      }

      .send-btn {
        padding: 0.5rem 1rem;
        background: #2563eb;
        color: #fff;
        border: none;
        border-radius: 8px;
        font-size: 0.85rem;
        font-weight: 600;
        cursor: pointer;
        white-space: nowrap;
      }

      .send-btn:disabled {
        background: #94a3b8;
        cursor: not-allowed;
      }

      .loading {
        text-align: center;
        padding: 2rem;
        color: #64748b;
      }

      .images-loading {
        text-align: center;
        padding: 2.5rem 1rem;
        color: #64748b;
        background: #fff;
        border-radius: 12px;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
      }

      .spinner {
        width: 40px;
        height: 40px;
        margin: 0 auto 0.9rem;
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

      .comment-item {
        display: flex;
        gap: 0.5rem;
        padding: 0.5rem;
        border-bottom: 1px solid #f1f5f9;
        font-size: 0.85rem;
        cursor: pointer;
        transition: background 0.15s;
      }
      .comment-item.highlighted {
        background: #eff6ff;
        border-radius: 6px;
      }
      .comment-avatar {
        width: 28px;
        height: 28px;
        border-radius: 50%;
        overflow: hidden;
        flex-shrink: 0;
        background: #f1f5f9;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .comment-avatar img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
      .comment-avatar-placeholder {
        font-size: 0.85rem;
        color: #94a3b8;
      }
      .comment-body {
        flex: 1;
        min-width: 0;
      }
      .comment-author {
        font-weight: 600;
        color: #2563eb;
        font-size: 0.8rem;
        margin-bottom: 0.15rem;
        cursor: pointer;
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
      .reply-image {
        max-width: 200px;
        max-height: 200px;
        border-radius: 8px;
        margin-top: 0.4rem;
        cursor: zoom-in;
        display: block;
        border: 1px solid #e2e8f0;
      }
      .reply-img-btn {
        cursor: pointer;
        font-size: 1.1rem;
        line-height: 1;
        padding: 4px;
        border-radius: 4px;
        transition: background 0.15s;
      }
      .reply-img-btn:hover {
        background: #e2e8f0;
      }
      .reply-img-preview {
        cursor: pointer;
        font-size: 0.8rem;
        color: #16a34a;
        font-weight: 600;
      }

      .profile-overlay {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.5);
        z-index: 999;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 1rem;
      }
      .profile-card {
        background: #fff;
        border-radius: 16px;
        padding: 2rem;
        max-width: 360px;
        width: 100%;
        text-align: center;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        position: relative;
      }
      .profile-back {
        position: absolute;
        top: 12px;
        left: 12px;
        background: #f1f5f9;
        border: none;
        border-radius: 8px;
        padding: 6px 12px;
        font-size: 0.85rem;
        cursor: pointer;
        color: #475569;
        font-weight: 600;
      }
      .profile-back:hover {
        background: #e2e8f0;
      }
      .profile-avatar {
        width: 80px;
        height: 80px;
        border-radius: 50%;
        overflow: hidden;
        background: #f1f5f9;
        margin: 0 auto 1rem;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 2.5rem;
      }
      .profile-avatar img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
      .profile-name {
        font-size: 1.2rem;
        font-weight: 700;
        color: #1e293b;
        margin-bottom: 0.25rem;
      }
      .profile-meta {
        display: flex;
        gap: 0.5rem;
        justify-content: center;
        margin-bottom: 0.75rem;
      }
      .profile-role {
        font-size: 0.8rem;
        background: #dbeafe;
        color: #2563eb;
        padding: 0.15rem 0.6rem;
        border-radius: 6px;
        font-weight: 600;
      }
      .profile-class {
        font-size: 0.8rem;
        background: #f1f5f9;
        color: #64748b;
        padding: 0.15rem 0.6rem;
        border-radius: 6px;
        font-weight: 600;
      }
      .profile-bio {
        font-size: 0.9rem;
        color: #64748b;
        line-height: 1.5;
        white-space: pre-wrap;
      }
      .profile-loading {
        margin-top: 1rem;
        color: #94a3b8;
        font-size: 0.85rem;
      }
      .item-menu { position: relative; margin-left: auto; flex-shrink: 0; }
      .menu-btn { background: none; border: none; cursor: pointer; font-size: 1.1rem; padding: 0 4px; color: #94a3b8; border-radius: 4px; }
      .menu-btn:hover { background: #f1f5f9; color: #1e293b; }
      .menu-popup { position: absolute; right: 100%; margin-right: 4px; top: 50%; transform: translateY(-50%); background: #fff; border: 1px solid #e2e8f0; border-radius: 8px; box-shadow: 0 4px 16px rgba(0,0,0,0.15); z-index: 50; min-width: 110px; overflow: hidden; }
      .menu-overlay { position: fixed; inset: 0; z-index: 40; }
      .menu-popup button { display: block; width: calc(100% - 8px); margin: 2px 4px; padding: 8px 12px; border: 1px solid transparent; border-radius: 8px; background: none; text-align: left; cursor: pointer; font-size: 0.85rem; color: #334155; }
      .menu-popup button:hover { background: #f8fafc; border-color: #2563eb; box-shadow: 0 3px 12px rgba(37, 99, 235, 0.2); }
      .edit-area { display: flex; flex-direction: column; gap: 6px; padding: 6px 0; }
      .edit-input { width: 100%; padding: 6px 10px; border: 1px solid #e2e8f0; border-radius: 6px; font-size: 0.85rem; }
      .edit-actions { display: flex; gap: 6px; }
      .edit-save { background: #2563eb; color: #fff; border: none; border-radius: 6px; padding: 5px 14px; cursor: pointer; font-size: 0.82rem; }
      .edit-cancel { background: #f1f5f9; color: #64748b; border: none; border-radius: 6px; padding: 5px 14px; cursor: pointer; font-size: 0.82rem; }
    `,
  ],
  template: `
    <div class="page-header">
      <button class="back-btn" (click)="goBack()">←</button>
      <h2>Quay lại</h2>
      <button class="btn-peers" (click)="viewPeers()">
        Xem bài làm của bạn khác
      </button>
    </div>

    <div class="container">
      @if (loading()) {
        <div class="loading">Đang tải...</div>
      }

      @if (!loading()) {
        @if (grade()) {
          <div class="score-section">
            <div class="score-label">Điểm số</div>
            <div class="score-value">{{ grade()?.scoreValue }}</div>
            @if (grade()?.comment) {
              <div class="score-comment">{{ grade()?.comment }}</div>
            }
          </div>
        } @else {
          <div class="score-section">
            <div class="no-grade">Bài chưa được chấm</div>
          </div>
        }

        @if (imagesLoading()) {
          <div class="images-loading">
            <div class="spinner"></div>
            Đang tải hình ảnh bài làm của bạn...
          </div>
        }

        @if (!imagesLoading() && submittedImages().length > 0) {
          <div class="submission-images">
            @for (url of submittedImages(); track $index; let i = $index) {
              <div class="submission-image-card">
                <img
                  [src]="url"
                  alt="Submitted image"
                  (click)="openZoom(url)"
                />

                <div class="comments-section">
                  <div class="comments-header" (click)="toggleComments($index)">
                    <span
                      >Bình luận ({{
                        (commentsMap()[$index] || []).length
                      }})</span
                    >
                    <span class="comments-toggle">{{
                      expandedComments().has($index) ? '▲' : '▼'
                    }}</span>
                  </div>
                  @if (expandedComments().has($index)) {
                    <div class="comments-list">
                      @for (c of commentsMap()[$index] || []; track c.id) {
                        <div
                          class="comment-item"
                          [class.highlighted]="
                            highlightedAuthor() === c.authorName
                          "
                          (click)="toggleHighlightAuthor(c.authorName)"
                        >
                          <div
                            class="comment-avatar"
                            style="cursor:pointer"
                            (click)="
                              openProfile(c.authorId, c.authorName);
                              $event.stopPropagation()
                            "
                          >
                            @if (
                              c.authorAvatarUrl || avatarCache()[c.authorId]
                            ) {
                              <img
                                [src]="
                                  c.authorAvatarUrl || avatarCache()[c.authorId]
                                "
                                alt=""
                              />
                            } @else {
                              <span class="comment-avatar-placeholder">👤</span>
                            }
                          </div>
                          <div class="comment-body">
                            <div
                              class="comment-author"
                              style="cursor:pointer"
                              (click)="
                                openProfile(c.authorId, c.authorName);
                                $event.stopPropagation()
                              "
                            >
                              {{
                                c.authorName ||
                                  (c.authorRole === 'teacher'
                                    ? 'Giáo viên'
                                    : 'Bạn')
                              }}
                            </div>
                            @if (editingId() === c.id) {
                              <div class="edit-area" (click)="$event.stopPropagation()">
                                <input
                                  class="edit-input"
                                  [(ngModel)]="editContent"
                                  placeholder="Nội dung..."
                                />
                                <label class="reply-img-btn">
                                  🖇️
                                  <input
                                    type="file"
                                    accept="image/*"
                                    hidden
                                    (change)="onEditImageSelected($event)"
                                  />
                                </label>
                                @if (editImage()) {
                                  <span class="reply-img-preview"
                                    >{{ editImageName() }} ✓</span
                                  >
                                }
                                <div class="edit-actions">
                                  <button
                                    class="edit-save"
                                    (click)="saveEdit(c)"
                                  >
                                    Lưu
                                  </button>
                                  <button class="edit-cancel" (click)="cancelEdit()">
                                    Hủy
                                  </button>
                                </div>
                              </div>
                            } @else {
                              <div class="comment-content">{{ c.content }}</div>
                              @if (c.imageUrl) {
                                <img
                                  [src]="c.imageUrl"
                                  class="reply-image"
                                  (click)="
                                    zoomedImage.set(c.imageUrl);
                                    $event.stopPropagation()
                                  "
                                />
                              }
                            }
                            <div class="comment-time">
                              {{ c.createdAt | date: 'dd/MM/yyyy HH:mm' }}
                            </div>
                          </div>
                          @if (isOwnerOf(c)) {
                            <div class="item-menu" (click)="$event.stopPropagation()">
                              <button class="menu-btn" (click)="toggleMenu(c.id)">
                                ⋮
                              </button>
                              @if (openMenuId() === c.id) {
                                <div class="menu-popup">
                                  <button (click)="startEdit(c)">Sửa bình luận</button>
                                  <button (click)="deleteItem(c)">Xóa bình luận</button>
                                </div>
                              }
                            </div>
                          }
                        </div>
                      }
                    </div>

                    <div class="comment-input-row">
                      <input
                        class="comment-input"
                        type="text"
                        placeholder="Thêm bình luận..."
                        [ngModel]="newComments()[$index] || ''"
                        (ngModelChange)="updateNewComment($index, $event)"
                      />
                      <label
                        class="reply-img-btn"
                        (click)="$event.stopPropagation()"
                      >
                        🖇️
                        <input
                          type="file"
                          accept="image/*"
                          hidden
                          (change)="onCommentImageSelected($event, $index)"
                        />
                      </label>
                      @if (commentImages()[$index]) {
                        <span
                          class="reply-img-preview"
                          (click)="
                            clearCommentImage($index); $event.stopPropagation()
                          "
                          title="Xóa ảnh"
                          >{{ commentImageNames()[$index] }} ✓</span
                        >
                      }
                      <button
                        class="send-btn"
                        [disabled]="
                          !newComments()[$index] && !commentImages()[$index]
                        "
                        (click)="sendComment(i)"
                      >
                        Gửi
                      </button>
                    </div>
                  }
                </div>
              </div>
            }
          </div>
        }
      }
    </div>

    @if (openMenuId()) {
      <div class="menu-overlay" (click)="openMenuId.set('')"></div>
    }

    @if (zoomedImage()) {
      <div class="lightbox" (click)="closeZoom()">
        <img
          [src]="zoomedImage()"
          alt="Phóng to"
          (click)="$event.stopPropagation()"
        />
      </div>
    }

    @if (selectedProfile()) {
      <div class="profile-overlay" (click)="closeProfile()">
        <div class="profile-card" (click)="$event.stopPropagation()">
          <button class="profile-back" (click)="closeProfile()">
            ← Quay lại
          </button>
          <div class="profile-avatar">
            @if (selectedProfile()?.avatarUrl) {
              <img [src]="selectedProfile()?.avatarUrl" alt="" />
            } @else {
              <span>👤</span>
            }
          </div>
          <div class="profile-name">{{ selectedProfile()?.fullName }}</div>
          <div class="profile-meta">
            <span class="profile-role">{{ selectedProfile()?.role }}</span>
            @if (selectedProfile()?.className) {
              <span class="profile-class">{{
                selectedProfile()?.className
              }}</span>
            }
          </div>
          <div class="profile-bio">
            {{ selectedProfile()?.bio || 'Chưa có tiểu sử' }}
          </div>
          @if (loadingProfile()) {
            <div class="profile-loading">Đang tải...</div>
          }
        </div>
      </div>
    }
  `,
})
export class ResultsComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private authService = inject(AuthService);
  private firestoreService = inject(FirestoreService);
  private imageService = inject(ImageService);

  grade = signal<Grade | null>(null);
  submittedImages = signal<string[]>([]);
  commentsMap = signal<Record<number, SubmissionComment[]>>({});
  newComments = signal<Record<number, string>>({});
  loading = signal(true);
  zoomedImage = signal<string | null>(null);
  highlightedAuthor = signal<string | null>(null);
  avatarCache = signal<Record<string, string>>({});
  selectedProfile = signal<{
    uid: string;
    fullName: string;
    avatarUrl: string;
    bio: string;
    role: string;
    className: string;
  } | null>(null);
  loadingProfile = signal(false);
  expandedComments = signal<Set<number>>(new Set());
  commentImages = signal<Record<number, string>>({});
  commentImageNames = signal<Record<number, string>>({});
  openMenuId = signal('');
  editingId = signal('');
  editContent = signal('');
  editImage = signal('');
  editImageName = signal('');
  imagesLoading = signal(true);
  submission = signal<Submission | null>(null);
  assignmentId = '';
  profile = this.authService.currentProfile;

  ngOnInit(): void {
    const submissionId = this.route.snapshot.paramMap.get('submissionId');
    if (!submissionId) {
      this.router.navigate(['/student/home']);
      return;
    }

    this.firestoreService.getSubmission(submissionId).then((sub) => {
      if (!sub) {
        this.loading.set(false);
        this.imagesLoading.set(false);
        return;
      }
      this.submission.set(sub);
      this.assignmentId = sub.assignmentId;
      this.loadGrade(sub);
      this.loadSubmissionImages(sub);
      this.firestoreService
        .updateSubmission(submissionId, {
          lastCommentSeenAt: new Date().toISOString(),
        })
        .catch(() => {});
    });
  }

  private loadGrade(sub: Submission): void {
    this.firestoreService.getGradeBySubmission(sub.id).subscribe((g) => {
      this.grade.set(g);
      this.loading.set(false);
    });
  }

  private async loadSubmissionImages(submission: Submission): Promise<void> {
    this.imagesLoading.set(true);
    const urls: string[] = [];
    const imageIds = submission.imageIds || [];

    for (const imageId of imageIds) {
      try {
        const base64Data = await this.imageService.getSubmissionImage(imageId);
        if (base64Data) urls.push(base64Data);
      } catch {
        // skip missing images
      }
    }

    this.submittedImages.set(urls);
    this.imagesLoading.set(false);
    this.loadComments();
  }

  private loadComments(): void {
    const sub = this.submission();
    if (!sub) return;

    this.firestoreService
      .getCommentsBySubmission(sub.id)
      .subscribe((comments) => {
        const map: Record<number, SubmissionComment[]> = {};
        for (const c of comments) {
          const idx = c.imageIndex ?? 0;
          if (!map[idx]) map[idx] = [];
          map[idx].push(c);
        }
        this.commentsMap.set(map);
        this.loadAvatarForComments(comments);
      });
  }

  updateNewComment(index: number, value: string): void {
    this.newComments.update((current) => ({ ...current, [index]: value }));
  }

  async sendComment(imageIndex: number): Promise<void> {
    const sub = this.submission();
    const profile = this.authService.currentProfile;
    const content = this.newComments()[imageIndex];
    const imageUrl = this.commentImages()[imageIndex];
    if (!sub || !profile || (!content && !imageUrl)) return;

    await this.firestoreService.addComment({
      submissionId: sub.id,
      imageIndex,
      authorId: profile.uid,
      authorName: profile.fullName,
      authorAvatarUrl: profile.avatarUrl || '',
      authorRole: 'student',
      content: content || '',
      imageUrl: imageUrl || '',
    });

    this.updateNewComment(imageIndex, '');
    this.clearCommentImage(imageIndex);
    this.loadComments();
  }

  async onCommentImageSelected(
    event: Event,
    imageIndex: number,
  ): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input?.files?.[0];
    if (!file) return;
    try {
      const compressed = await this.imageService.compressImage(file);
      this.commentImages.update((m) => ({ ...m, [imageIndex]: compressed }));
      this.commentImageNames.update((m) => ({ ...m, [imageIndex]: file.name }));
    } catch {}
    input.value = '';
  }

  clearCommentImage(imageIndex: number): void {
    this.commentImages.update((m) => {
      const next = { ...m };
      delete next[imageIndex];
      return next;
    });
    this.commentImageNames.update((m) => {
      const next = { ...m };
      delete next[imageIndex];
      return next;
    });
  }

  private loadAvatarForComments(comments: SubmissionComment[]): void {
    const authorsToLoad = new Set<string>();
    for (const c of comments) {
      if (c.authorId && !c.authorAvatarUrl && !this.avatarCache()[c.authorId]) {
        authorsToLoad.add(c.authorId);
      }
    }
    authorsToLoad.forEach((id) => this.loadAuthorAvatar(id));
  }

  private async loadAuthorAvatar(authorId: string): Promise<void> {
    try {
      const teacher = await this.firestoreService.getDocById(
        'teachers',
        authorId,
      );
      if (teacher?.avatarUrl) {
        this.avatarCache.update((m) => ({
          ...m,
          [authorId]: teacher.avatarUrl,
        }));
        return;
      }
    } catch {}
    try {
      const student = await this.firestoreService.getDocById(
        'students',
        authorId,
      );
      if (student?.avatarUrl) {
        this.avatarCache.update((m) => ({
          ...m,
          [authorId]: student.avatarUrl,
        }));
        return;
      }
    } catch {}
    this.avatarCache.update((m) => ({ ...m, [authorId]: '' }));
  }

  toggleHighlightAuthor(authorName: string): void {
    this.highlightedAuthor.update((current) =>
      current === authorName ? null : authorName,
    );
  }

  async openProfile(uid: string, fullName: string): Promise<void> {
    this.loadingProfile.set(true);
    let avatarUrl = '';
    let bio = '';
    let role = '';
    let className = '';
    try {
      const teacher = await this.firestoreService.getDocById('teachers', uid);
      if (teacher) {
        role = 'Giáo viên';
        if (teacher.avatarUrl) avatarUrl = teacher.avatarUrl;
      }
    } catch {}
    if (!role) {
      try {
        const student = await this.firestoreService.getDocById('students', uid);
        if (student) {
          role = 'Học sinh';
          className = student.className || '';
          if (student.avatarUrl) avatarUrl = student.avatarUrl;
        }
      } catch {}
    }
    try {
      const profile = await this.firestoreService.getDocById(
        'userProfiles',
        uid,
      );
      if (profile?.bio) bio = profile.bio;
    } catch {}
    this.selectedProfile.set({
      uid,
      fullName,
      avatarUrl,
      bio,
      role,
      className,
    });
    this.loadingProfile.set(false);
  }

  closeProfile(): void {
    this.selectedProfile.set(null);
  }

  openZoom(url: string): void {
    this.zoomedImage.set(url);
  }

  closeZoom(): void {
    this.zoomedImage.set(null);
  }

  goBack(): void {
    this.router.navigate(['/student/home']);
  }

  viewPeers(): void {
    if (this.assignmentId) {
      this.router.navigate(['/student/peers', this.assignmentId]);
    }
  }

  toggleComments(index: number): void {
    this.expandedComments.update((s) => {
      const next = new Set(s);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  }

  isOwnerOf(item: any): boolean {
    return item.authorId === this.profile?.uid;
  }

  toggleMenu(id: string): void {
    this.openMenuId.update((c) => (c === id ? '' : id));
  }

  startEdit(item: any): void {
    this.editingId.set(item.id);
    this.editContent.set(item.content || '');
    this.editImage.set('');
    this.editImageName.set('');
    this.openMenuId.set('');
  }

  cancelEdit(): void {
    this.editingId.set('');
    this.editContent.set('');
    this.editImage.set('');
    this.editImageName.set('');
  }

  async onEditImageSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input?.files?.[0];
    if (!file) return;
    try {
      const compressed = await this.imageService.compressImage(file);
      this.editImage.set(compressed);
      this.editImageName.set(file.name);
    } catch {}
    input.value = '';
  }

  async saveEdit(c: SubmissionComment): Promise<void> {
    const content = this.editContent() || '';
    const imageUrl = this.editImage() || c.imageUrl || '';
    await this.firestoreService.updateComment(c.id, { content, imageUrl });
    this.commentsMap.update((map) => {
      const next: Record<number, SubmissionComment[]> = {};
      Object.keys(map).forEach((key) => {
        const idx = Number(key);
        next[idx] = map[idx].map((x) =>
          x.id === c.id ? { ...x, content, imageUrl } : x,
        );
      });
      return next;
    });
    this.cancelEdit();
  }

  async deleteItem(c: SubmissionComment): Promise<void> {
    if (!confirm('Xóa bình luận này?')) return;
    await this.firestoreService.deleteComment(c.id);
    this.commentsMap.update((map) => {
      const next: Record<number, SubmissionComment[]> = {};
      Object.keys(map).forEach((key) => {
        const idx = Number(key);
        next[idx] = map[idx].filter((x) => x.id !== c.id);
      });
      return next;
    });
    this.cancelEdit();
  }
}
