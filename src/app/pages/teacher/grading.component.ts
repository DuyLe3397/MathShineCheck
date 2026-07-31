import {
  Component,
  inject,
  OnInit,
  signal,
  ViewChild,
  ElementRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { FirestoreService } from '../../services/firestore.service';
import { ImageService } from '../../services/image.service';
import { AuthService } from '../../services/auth.service';
import { Submission, Grade, SubmissionComment } from '../../models';

@Component({
  selector: 'app-grading',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  styles: [
    `
      :host {
        display: block;
        min-height: 100vh;
        background: #f5f7fa;
      }
      .app-header {
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
      .app-header h2 {
        margin: 0;
        font-size: 1.15rem;
        font-weight: 600;
      }
      .app-header .sub {
        font-size: 0.8rem;
        opacity: 0.85;
        margin-left: auto;
      }
      .container {
        padding: 1rem;
        max-width: 900px;
        margin: 0 auto;
      }

      .nav-bar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 1rem;
      }
      .nav-btn {
        padding: 0.45rem 1rem;
        border: 1.5px solid #cbd5e1;
        border-radius: 8px;
        background: #fff;
        cursor: pointer;
        font-size: 0.85rem;
        color: #475569;
        transition: all 0.2s;
      }
      .nav-btn:hover:not(:disabled) {
        background: #f1f5f9;
      }
      .nav-btn:disabled {
        opacity: 0.4;
        cursor: not-allowed;
      }
      .nav-label {
        font-size: 0.9rem;
        font-weight: 600;
        color: #334155;
      }

      .image-card {
        background: #fff;
        border-radius: 12px;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
        overflow: hidden;
        margin-bottom: 1rem;
      }
      .image-card img {
        width: 100%;
        display: block;
      }
      .image-actions {
        display: flex;
        gap: 10px;
        padding: 0.75rem 1rem;
        border-top: 1px solid #e2e8f0;
        background: #f8fafc;
      }
      .action-btn {
        flex: 1;
        padding: 0.55rem;
        border: none;
        border-radius: 8px;
        font-size: 0.85rem;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s;
        text-align: center;
      }
      .btn-upload {
        background: #f59e0b;
        color: #fff;
      }
      .btn-upload:hover {
        background: #d97706;
      }
      .upload-input {
        display: none;
      }

      .comment-section {
        padding: 0.75rem 1rem;
        border-top: 1px solid #f1f5f9;
      }
      .comment-item {
        display: flex;
        gap: 0.5rem;
        padding: 0.4rem;
        border-bottom: 1px solid #f1f5f9;
        font-size: 0.85rem;
      }
      .comment-item:last-child {
        border-bottom: none;
      }
      .comment-avatar {
        width: 32px;
        height: 32px;
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
        font-size: 0.9rem;
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
        margin-bottom: 0.1rem;
      }
      .comment-content {
        color: #334155;
        word-break: break-word;
        white-space: pre-wrap;
      }
      .comment-actions {
        display: flex;
        gap: 0.5rem;
        margin-top: 0.2rem;
      }
      .comment-action-btn {
        background: none;
        border: none;
        color: #94a3b8;
        font-size: 0.7rem;
        cursor: pointer;
        padding: 0;
      }
      .comment-action-btn:hover {
        color: #2563eb;
      }
      .comment-time {
        font-size: 0.72rem;
        color: #94a3b8;
        margin-top: 0.15rem;
      }
      .comment-input-row {
        display: flex;
        gap: 0.5rem;
        margin-top: 0.5rem;
        align-items: flex-end;
      }
      .comment-input {
        flex: 1;
        padding: 0.45rem 0.7rem;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        font-size: 0.85rem;
        outline: none;
        resize: vertical;
        min-height: 36px;
        max-height: 80px;
        font-family: inherit;
      }
      .comment-input:focus {
        border-color: #2563eb;
      }
      .comment-toolbar {
        display: flex;
        gap: 2px;
        margin-bottom: 0.3rem;
      }
      .comment-toolbar button {
        padding: 2px 6px;
        border: 1px solid #e2e8f0;
        border-radius: 4px;
        background: #fff;
        cursor: pointer;
        font-size: 0.75rem;
        color: #64748b;
        transition: all 0.1s;
      }
      .comment-toolbar button:hover {
        background: #f1f5f9;
        color: #2563eb;
      }
      .comment-toolbar button.active {
        background: #eff6ff;
        color: #2563eb;
        border-color: #2563eb;
      }
      .send-btn {
        padding: 0.45rem 0.9rem;
        background: #2563eb;
        color: #fff;
        border: none;
        border-radius: 8px;
        font-size: 0.82rem;
        font-weight: 600;
        cursor: pointer;
        white-space: nowrap;
      }
      .send-btn:disabled {
        background: #94a3b8;
        cursor: not-allowed;
      }

      .bottom-panel {
        background: #fff;
        border-radius: 12px;
        padding: 1rem;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
        margin-bottom: 1rem;
      }
      .form-row {
        display: flex;
        gap: 12px;
        align-items: flex-end;
        flex-wrap: wrap;
      }
      .form-group {
        flex: 1;
        min-width: 120px;
      }
      .form-group label {
        display: block;
        font-size: 0.82rem;
        font-weight: 500;
        color: #475569;
        margin-bottom: 4px;
      }
      .form-input,
      .form-textarea {
        width: 100%;
        padding: 8px 12px;
        border: 1px solid #cbd5e1;
        border-radius: 8px;
        font-size: 0.9rem;
        outline: none;
        transition: border-color 0.2s;
        box-sizing: border-box;
        font-family: inherit;
      }
      .form-input:focus,
      .form-textarea:focus {
        border-color: #2563eb;
      }
      .form-textarea {
        resize: vertical;
        min-height: 60px;
      }
      .btn-save {
        padding: 0.7rem 2rem;
        background: #16a34a;
        color: #fff;
        border: none;
        border-radius: 8px;
        font-size: 0.95rem;
        font-weight: 700;
        cursor: pointer;
        transition: background 0.2s;
      }
      .btn-save:hover:not(:disabled) {
        background: #15803d;
      }
      .btn-save:disabled {
        background: #94a3b8;
        cursor: not-allowed;
      }
      .loading-state {
        text-align: center;
        padding: 3rem;
        color: #64748b;
      }

      .success-overlay {
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
      .success-dialog {
        background: #fff;
        border-radius: 16px;
        padding: 2rem;
        text-align: center;
        max-width: 360px;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
      }
      .success-dialog h3 {
        margin: 0 0 8px;
        color: #1e293b;
      }
      .success-dialog p {
        color: #64748b;
        margin: 0 0 20px;
      }
      .btn-back {
        padding: 0.5rem 1.5rem;
        background: #2563eb;
        color: #fff;
        border: none;
        border-radius: 8px;
        cursor: pointer;
        font-weight: 600;
      }
      .reply-image { max-width: 200px; max-height: 200px; border-radius: 8px; margin-top: 0.4rem; cursor: zoom-in; display: block; border: 1px solid #e2e8f0; }
      .reply-img-btn { cursor: pointer; font-size: 1.1rem; line-height: 1; padding: 4px; border-radius: 4px; transition: background 0.15s; }
      .reply-img-btn:hover { background: #e2e8f0; }
      .reply-img-preview { cursor: pointer; font-size: 0.8rem; color: #16a34a; font-weight: 600; }
      .lightbox { position: fixed; inset: 0; background: rgba(0,0,0,0.92); display: flex; align-items: center; justify-content: center; z-index: 9999; cursor: zoom-out; padding: 1rem; }
      .lightbox img { max-width: 100%; max-height: 100%; object-fit: contain; border-radius: 4px; }
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
    <div class="app-header">
      <button class="back-btn" (click)="goBack()">←</button>
      <h2>Chấm bài</h2>
      <span class="sub">{{ studentName }}</span>
    </div>

    <div class="container" *ngIf="!loading && submission">
      <div class="nav-bar">
        <button
          class="nav-btn"
          (click)="prevPage()"
          [disabled]="currentPage === 0"
        >
          ◀ Trước
        </button>
        <span class="nav-label"
          >Ảnh {{ currentPage + 1 }} / {{ totalPages }}</span
        >
        <button
          class="nav-btn"
          (click)="nextPage()"
          [disabled]="currentPage >= totalPages - 1"
        >
          Sau ▶
        </button>
      </div>

      <div class="image-card">
        <img [src]="currentImageUrl" alt="Bài làm" />
        <div class="image-actions">
          <button class="action-btn" (click)="downloadSubmission()">
            Tải bài làm
          </button>
          <label
            class="action-btn btn-upload"
            style="display:block;text-align:center;cursor:pointer;"
          >
            Tải ảnh đã chấm
            <input
              class="upload-input"
              type="file"
              accept="image/*"
              (change)="onImageUploaded($event)"
            />
          </label>
        </div>
      </div>

      <div class="image-card" style="padding:0.75rem 1rem;" id="comments-section">
        <div class="comment-section" style="border-top:none;padding:0;">
          <div class="comment-toolbar">
            <button
              type="button"
              [class.active]="boldActive"
              (click)="applyFormat('bold')"
            >
              <b>B</b>
            </button>
            <button
              type="button"
              [class.active]="italicActive"
              (click)="applyFormat('italic')"
            >
              <i>I</i>
            </button>
          </div>
          @for (c of imageComments(); track c.id) {
            <div class="comment-item">
              <div class="comment-avatar">
                @if (c.authorAvatarUrl) {
                  <img [src]="c.authorAvatarUrl" alt="" />
                } @else {
                  <span class="comment-avatar-placeholder">👤</span>
                }
              </div>
              <div class="comment-body">
                <div class="comment-author">{{ c.authorName }}</div>
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
                      <button class="edit-save" (click)="saveEdit(c)">
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
                    <img [src]="c.imageUrl" class="reply-image" (click)="zoomedImage.set(c.imageUrl)" />
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
          @if (imageComments().length === 0) {
            <div style="color:#94a3b8;font-size:0.82rem;padding:0.3rem 0;">
              Chưa có bình luận cho ảnh này
            </div>
          }
          <div class="comment-input-row">
            <textarea
              class="comment-input"
              placeholder="Nhận xét cho ảnh này..."
              [(ngModel)]="newCommentText"
              rows="1"
            ></textarea>
            <label class="reply-img-btn">
              🖇️
              <input type="file" accept="image/*" hidden (change)="onCommentImageSelected($event)" />
            </label>
            @if (commentImage()) {
              <span class="reply-img-preview" (click)="clearCommentImage()" title="Xóa ảnh">{{ commentImageName() }} ✓</span>
            }
            <button
              class="send-btn"
              [disabled]="!newCommentText.trim() && !commentImage()"
              (click)="sendComment()"
            >
              Gửi
            </button>
          </div>
        </div>
      </div>

      <div class="bottom-panel">
        <div class="form-row">
          <div class="form-group" style="max-width:100px;">
            <label>Điểm</label>
            <input
              class="form-input"
              type="number"
              [(ngModel)]="scoreValue"
              min="0"
              max="10"
              step="0.5"
              placeholder="0-10"
            />
          </div>
          <div class="form-group" style="flex:2;">
            <label>Nhận xét chung</label>
            <textarea
              class="form-textarea"
              [(ngModel)]="overallComment"
              placeholder="Nhận xét chung cho bài làm..."
            ></textarea>
          </div>
          <button
            class="btn-save"
            (click)="saveGrade()"
            [disabled]="saving || scoreValue === null"
          >
            {{ saving ? 'Đang lưu...' : 'Lưu & Chấm điểm' }}
          </button>
        </div>
      </div>
    </div>

    <div class="loading-state" *ngIf="loading">Đang tải dữ liệu...</div>

    <div class="success-overlay" *ngIf="showSuccess" (click)="goBack()">
      <div class="success-dialog" (click)="$event.stopPropagation()">
        <h3>Chấm điểm thành công!</h3>
        <p>Điểm và nhận xét đã được lưu.</p>
        <button class="btn-back" (click)="goBack()">Quay lại</button>
      </div>
    </div>

    @if (openMenuId()) {
      <div class="menu-overlay" (click)="openMenuId.set('')"></div>
    }

    @if (zoomedImage()) {
      <div class="lightbox" (click)="zoomedImage.set(null)">
        <img [src]="zoomedImage()" alt="" (click)="$event.stopPropagation()" />
      </div>
    }
  `,
})
export class GradingComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private firestoreService = inject(FirestoreService);
  private imageService = inject(ImageService);
  private authService = inject(AuthService);

  submissionId = '';
  submission: Submission | null = null;
  currentPage = 0;
  totalPages = 0;
  loading = true;
  saving = false;
  showSuccess = false;

  scoreValue: number | null = null;
  overallComment = '';
  studentName = '';
  currentImageUrl = '';

  imageComments = signal<SubmissionComment[]>([]);
  newCommentText = '';
  imageCommentsMap = signal<Record<number, SubmissionComment[]>>({});
  commentImage = signal('');
  commentImageName = signal('');
  zoomedImage = signal<string | null>(null);
  boldActive = false;
  italicActive = false;
  currentUid = this.authService.currentUser?.uid || '';

  openMenuId = signal('');
  editingId = signal('');
  editContent = signal('');
  editImage = signal('');
  editImageName = signal('');

  ngOnInit(): void {
    this.submissionId = this.route.snapshot.paramMap.get('submissionId') || '';
    if (!this.submissionId) {
      this.loading = false;
      return;
    }
    this.loadSubmission();
  }

  async loadSubmission(): Promise<void> {
    this.loading = true;
    const submission = await this.firestoreService.getSubmission(
      this.submissionId,
    );
    if (!submission) {
      this.loading = false;
      return;
    }
    this.submission = submission;
    this.totalPages = submission.imageIds.length;
    this.currentPage = 0;

    const commentParam = this.route.snapshot.queryParamMap.get('comment');
    if (commentParam) {
      const idx = parseInt(commentParam, 10);
      if (!isNaN(idx) && idx >= 0 && idx < this.totalPages) {
        this.currentPage = idx;
      }
    }

    this.firestoreService
      .getGradeBySubmission(this.submissionId)
      .subscribe((grade) => {
        if (grade) {
          this.scoreValue = grade.scoreValue;
          this.overallComment = grade.comment || '';
        }
      });

    const student = await this.firestoreService.getStudent(
      submission.studentId,
    );
    this.studentName = student?.fullName || '';

    await this.loadImage(this.currentPage);
    this.loadComments();
    this.loading = false;

    if (commentParam) {
      setTimeout(() => {
        const el = document.getElementById('comments-section');
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 400);
    }
  }

  async loadImage(pageIndex: number): Promise<void> {
    if (!this.submission || pageIndex >= this.submission.imageIds.length)
      return;
    const imageId = this.submission.imageIds[pageIndex];
    const base64Data = await this.imageService.getSubmissionImage(imageId);
    this.currentImageUrl = base64Data || '';
  }

  loadComments(): void {
    if (!this.submission) return;
    this.firestoreService
      .getCommentsBySubmission(this.submissionId)
      .subscribe((comments) => {
        const map: Record<number, SubmissionComment[]> = {};
        for (const c of comments) {
          const idx = c.imageIndex ?? 0;
          if (!map[idx]) map[idx] = [];
          map[idx].push(c);
        }
        this.imageCommentsMap.set(map);
        this.imageComments.set(map[this.currentPage] || []);
      });
  }

  async sendComment(): Promise<void> {
    const text = this.newCommentText.trim();
    const imageUrl = this.commentImage();
    const profile = this.authService.currentProfile;
    if ((!text && !imageUrl) || !this.submission || !profile) return;

    await this.firestoreService.addComment({
      submissionId: this.submissionId,
      imageIndex: this.currentPage,
      authorId: profile.uid,
      authorName: profile.fullName,
      authorAvatarUrl: profile.avatarUrl || '',
      authorRole: 'teacher',
      content: text,
      imageUrl: imageUrl || '',
    });

    this.newCommentText = '';
    this.clearCommentImage();
    this.loadComments();
  }

  async onCommentImageSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input?.files?.[0];
    if (!file) return;
    try {
      const compressed = await this.imageService.compressImage(file);
      this.commentImage.set(compressed);
      this.commentImageName.set(file.name);
    } catch {}
    input.value = '';
  }

  clearCommentImage(): void {
    this.commentImage.set('');
    this.commentImageName.set('');
  }

  applyFormat(format: 'bold' | 'italic'): void {
    const textarea = document.querySelector(
      '.comment-input',
    ) as HTMLTextAreaElement;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = this.newCommentText;
    const selected = text.substring(start, end);
    let replacement: string;
    if (format === 'bold') {
      replacement = `**${selected || 'nội dung'}**`;
      this.boldActive = !this.boldActive;
    } else {
      replacement = `*${selected || 'nội dung'}*`;
      this.italicActive = !this.italicActive;
    }
    this.newCommentText =
      text.substring(0, start) + replacement + text.substring(end);
    setTimeout(() => {
      textarea.focus();
      const newPos = start + replacement.length;
      textarea.setSelectionRange(newPos, newPos);
    }, 0);
  }

  async nextPage(): Promise<void> {
    if (this.currentPage < this.totalPages - 1) {
      this.newCommentText = '';
      this.currentPage++;
      await this.loadImage(this.currentPage);
      this.loadComments();
    }
  }

  async prevPage(): Promise<void> {
    if (this.currentPage > 0) {
      this.newCommentText = '';
      this.currentPage--;
      await this.loadImage(this.currentPage);
      this.loadComments();
    }
  }

  downloadSubmission(): void {
    const link = document.createElement('a');
    link.href = this.currentImageUrl;
    link.download = `bai_lam_${this.submission?.studentId || ''}_${this.currentPage + 1}.jpg`;
    link.click();
  }

  async onImageUploaded(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input?.files?.[0];
    if (!file || !this.submission) return;

    try {
      const compressed = await this.imageService.compressImage(file);
      const imageId = this.submission.imageIds[this.currentPage];
      if (imageId) {
        await this.imageService.updateSubmissionImage(imageId, compressed);
        this.currentImageUrl = compressed;
      }
    } catch (e) {
      console.error('Upload failed:', e);
    }
    input.value = '';
  }

  async saveGrade(): Promise<void> {
    if (
      !this.submission ||
      this.scoreValue === null ||
      this.scoreValue === undefined
    )
      return;
    this.saving = true;

    try {
      const profile = this.authService.currentProfile;
      await this.firestoreService.createOrUpdateGrade({
        submissionId: this.submission.id!,
        studentId: this.submission.studentId,
        assignmentId: this.submission.assignmentId,
        scoreValue: this.scoreValue,
        comment: this.overallComment,
        gradedBy: profile?.uid || '',
      });
      await this.firestoreService.updateSubmissionStatus(
        this.submissionId,
        'graded',
      );
      this.showSuccess = true;
    } catch (err: any) {
      alert('Lỗi khi lưu: ' + (err.message || 'Không xác định'));
    } finally {
      this.saving = false;
    }
  }

  goBack(): void {
    if (this.submission) {
      this.router.navigate([
        '/teacher/assignments',
        this.submission.assignmentId,
      ]);
    } else {
      this.router.navigate(['/teacher/assignments']);
    }
  }

  isOwnerOf(item: any): boolean {
    return item.authorId === this.currentUid;
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
    this.imageComments.update((list) =>
      list.map((x) => (x.id === c.id ? { ...x, content, imageUrl } : x)),
    );
    this.imageCommentsMap.update((map) => {
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
    this.imageComments.update((list) => list.filter((x) => x.id !== c.id));
    this.imageCommentsMap.update((map) => {
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
