import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { FirestoreService } from '../../services/firestore.service';
import { StudentNotificationService } from '../../services/student-notification.service';
import { StudentNavbarComponent } from './student-navbar.component';
import { ImageService } from '../../services/image.service';
import { Discussion, DiscussionReply } from '../../models';

interface DiscussionWithReplies extends Discussion {
  replies: DiscussionReply[];
  expanded: boolean;
}

@Component({
  selector: 'app-discussions',
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

      .content {
        padding: 1rem;
      }

      .create-btn {
        width: 100%;
        padding: 0.75rem;
        border: none;
        border-radius: 10px;
        background: #2563eb;
        color: #fff;
        font-weight: 700;
        font-size: 0.9rem;
        cursor: pointer;
        margin-bottom: 1rem;
        transition: background 0.2s;
      }

      .create-btn:hover {
        background: #1d4ed8;
      }

      .create-form {
        background: #fff;
        border-radius: 12px;
        padding: 1rem;
        margin-bottom: 1rem;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
      }

      .form-group {
        margin-bottom: 0.75rem;
      }

      .form-group label {
        display: block;
        font-size: 0.85rem;
        font-weight: 600;
        color: #475569;
        margin-bottom: 0.3rem;
      }

      .form-input {
        width: 100%;
        padding: 0.6rem 0.75rem;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        font-size: 0.85rem;
        outline: none;
        box-sizing: border-box;
      }

      .form-input:focus {
        border-color: #2563eb;
      }

      textarea.form-input {
        resize: vertical;
        min-height: 80px;
      }

      .form-actions {
        display: flex;
        gap: 0.5rem;
        justify-content: flex-end;
      }

      .form-btn {
        padding: 0.5rem 1.25rem;
        border: none;
        border-radius: 8px;
        font-size: 0.85rem;
        font-weight: 600;
        cursor: pointer;
      }

      .btn-cancel {
        background: #f1f5f9;
        color: #64748b;
      }

      .btn-post {
        background: #2563eb;
        color: #fff;
      }

      /* Wrapper bọc chung 1 câu hỏi + phần trả lời của nó thành 1 khối */
      .discussion-wrapper {
        margin-bottom: 0.75rem;
        border-radius: 12px;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
        overflow: hidden;
        background: #fff;
      }

      .discussion-card {
        padding: 1rem;
        cursor: pointer;
        transition: all 0.2s;
        border: 2px solid transparent;
      }

      .discussion-card:hover {
        border-color: #2563eb;
        box-shadow: 0 3px 12px rgba(37, 99, 235, 0.2);
        border-radius: 12px;
      }

      .discussion-card.is-expanded {
        background: #e2e8f0;
        border-color: #2563eb;
        box-shadow: 0 3px 12px rgba(37, 99, 235, 0.2);
        border-radius: 12px;
      }

      .discussion-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 0.5rem;
      }

      .discussion-title {
        font-weight: 700;
        font-size: 0.95rem;
        color: #1e293b;
        margin-bottom: 0.25rem;
      }

      .discussion-meta {
        font-size: 0.75rem;
        color: #94a3b8;
        display: flex;
        align-items: center;
        gap: 0.75rem;
      }

      .reply-count {
        font-size: 0.75rem;
        color: #2563eb;
        font-weight: 600;
        white-space: nowrap;
      }

      /* Khu vực trả lời: nền xám + thụt lề để học sinh dễ quan sát */
      .replies-section {
        padding: 0.75rem 1rem 1rem 2.25rem;
        border-top: 1px solid #e2e8f0;
        background: #f8fafc;
      }

      .reply-item {
        display: flex;
        gap: 0.5rem;
        padding: 0.5rem 0;
        border-bottom: 1px solid #e2e8f0;
        font-size: 0.85rem;
        transition: background 0.15s;
        cursor: pointer;
      }

      .reply-item:last-child {
        border-bottom: none;
      }

      .reply-item.highlighted {
        background: #eff6ff;
        border-left: 3px solid #2563eb;
      }

      .reply-avatar {
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

      .reply-avatar img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      .reply-avatar-placeholder {
        font-size: 0.9rem;
        color: #94a3b8;
      }

      .reply-body {
        flex: 1;
        min-width: 0;
      }

      .reply-author {
        font-weight: 600;
        color: #2563eb;
        font-size: 0.78rem;
        margin-bottom: 0.1rem;
        cursor: pointer;
      }

      .reply-author:hover {
        text-decoration: underline;
      }

      .reply-content {
        color: #334155;
        word-break: break-word;
      }

      .reply-time {
        font-size: 0.7rem;
        color: #94a3b8;
        margin-top: 0.1rem;
      }

      .no-replies {
        color: #94a3b8;
        font-size: 0.8rem;
        font-style: italic;
      }

      .reply-form {
        display: flex;
        gap: 0.5rem;
        margin-top: 0.5rem;
      }

      .reply-input {
        flex: 1;
        padding: 0.45rem 0.65rem;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        font-size: 0.82rem;
        outline: none;
        background: #fff;
      }

      .reply-input:focus {
        border-color: #2563eb;
      }

      .reply-send {
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

      .reply-send:disabled {
        background: #94a3b8;
        cursor: not-allowed;
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
      .lightbox {
        position: fixed;
        inset: 0;
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
      <h2>Thảo luận</h2>
      <p class="subtitle">Trao đổi trong nhóm</p>
    </div>

    <div class="content">
      @if (!showForm()) {
        <button class="create-btn" (click)="showForm.set(true)">
          + Tạo câu hỏi mới
        </button>
      } @else {
        <div class="create-form">
          <div class="form-group">
            <label>Nội dung câu hỏi</label>
            <textarea
              class="form-input"
              placeholder="Nhập nội dung câu hỏi..."
              [(ngModel)]="newContent"
            ></textarea>
          </div>
          <div class="form-actions">
            <button class="form-btn btn-cancel" (click)="cancelNew()">
              Hủy
            </button>
            <label class="reply-img-btn" (click)="$event.stopPropagation()">
              🖇️
              <input
                type="file"
                accept="image/*"
                hidden
                (change)="onNewDiscussionImageSelected($event)"
              />
            </label>
            @if (newDiscussionImage()) {
              <span
                class="reply-img-preview"
                (click)="clearNewDiscussionImage(); $event.stopPropagation()"
                title="Xóa ảnh"
                >{{ newDiscussionImageName() }} ✓</span
              >
            }
            <button
              class="form-btn btn-post"
              [disabled]="!newContent && !newDiscussionImage()"
              (click)="createNewDiscussion()"
            >
              Đăng
            </button>
          </div>
        </div>
      }

      @if (loading()) {
        <div class="loading">Đang tải...</div>
      }

      @if (!loading() && discussions().length === 0) {
        <div class="empty-state">
          <div class="icon">💬</div>
          <p>Chưa có cuộc thảo luận nào</p>
        </div>
      }

      @for (d of discussions(); track d.id) {
        <div class="discussion-wrapper">
          <div
            class="discussion-card"
            [class.is-expanded]="d.expanded"
            (click)="toggleDiscussion(d)"
          >
            <div class="discussion-header">
              @if (editingId() === d.id) {
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
                    <button class="edit-save" (click)="saveEdit(d)">Lưu</button>
                    <button class="edit-cancel" (click)="cancelEdit()">
                      Hủy
                    </button>
                  </div>
                </div>
              } @else {
                <div>
                  <div class="discussion-title">{{ d.content }}</div>
                  @if (d.imageUrl) {
                    <img
                      [src]="d.imageUrl"
                      class="reply-image"
                      (click)="
                        zoomedImage.set(d.imageUrl); $event.stopPropagation()
                      "
                    />
                  }
                  <div class="discussion-meta">
                    <div
                      class="discussion-avatar"
                      style="width:24px;height:24px;border-radius:50%;overflow:hidden;background:#f1f5f9;display:flex;align-items:center;justify-content:center;flex-shrink:0;cursor:pointer;"
                      (click)="
                        openProfile(d.authorId, d.authorName);
                        $event.stopPropagation()
                      "
                    >
                      @if (d.authorAvatarUrl || avatarCache()[d.authorId]) {
                        <img
                          [src]="d.authorAvatarUrl || avatarCache()[d.authorId]"
                          alt=""
                          style="width:100%;height:100%;object-fit:cover;"
                        />
                      } @else {
                        <span style="font-size:0.8rem;color:#94a3b8;">👤</span>
                      }
                    </div>
                    <span
                      >Người hỏi:
                      <strong
                        style="cursor:pointer"
                        (click)="
                          openProfile(d.authorId, d.authorName);
                          $event.stopPropagation()
                        "
                        >{{ d.authorName }}</strong
                      ></span
                    >
                    <span>{{ d.createdAt | date: 'dd/MM/yyyy HH:mm' }}</span>
                  </div>
                </div>
              }
              @if (isOwnerOf(d)) {
                <div class="item-menu" (click)="$event.stopPropagation()">
                  <button class="menu-btn" (click)="toggleMenu(d.id)">⋮</button>
                  @if (openMenuId() === d.id) {
                    <div class="menu-popup">
                      <button (click)="startEdit(d)">{{ menuLabel(d).edit }}</button>
                      <button (click)="deleteItem(d)">{{ menuLabel(d).del }}</button>
                    </div>
                  }
                </div>
              }
            </div>
            <span class="reply-count">{{ d.replies.length }} trả lời</span>
          </div>

          @if (d.expanded) {
            <div class="replies-section">
              @if (d.replies.length === 0) {
                <div class="no-replies">Chưa có phản hồi</div>
              }
              @for (reply of d.replies; track reply.id) {
                <div
                  class="reply-item"
                  [class.highlighted]="highlightedAuthor() === reply.authorName"
                  (click)="toggleHighlightAuthor(reply.authorName)"
                >
                  <div
                    class="reply-avatar"
                    style="cursor:pointer"
                    (click)="
                      openProfile(reply.authorId, reply.authorName);
                      $event.stopPropagation()
                    "
                  >
                    @if (
                      reply.authorAvatarUrl || avatarCache()[reply.authorId]
                    ) {
                      <img
                        [src]="
                          reply.authorAvatarUrl || avatarCache()[reply.authorId]
                        "
                        alt=""
                      />
                    } @else {
                      <span class="reply-avatar-placeholder">👤</span>
                    }
                  </div>
                  <div class="reply-body">
                    <div
                      class="reply-author"
                      style="cursor:pointer"
                      (click)="
                        openProfile(reply.authorId, reply.authorName);
                        $event.stopPropagation()
                      "
                    >
                      {{ reply.authorName }}
                    </div>
                    @if (editingId() === reply.id) {
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
                            (click)="saveEdit(reply)"
                          >
                            Lưu
                          </button>
                          <button class="edit-cancel" (click)="cancelEdit()">
                            Hủy
                          </button>
                        </div>
                      </div>
                    } @else {
                      <div class="reply-content">{{ reply.content }}</div>
                      @if (reply.imageUrl) {
                        <img
                          [src]="reply.imageUrl"
                          class="reply-image"
                          (click)="
                            zoomedImage.set(reply.imageUrl);
                            $event.stopPropagation()
                          "
                        />
                      }
                    }
                    <div class="reply-time">
                      {{ reply.createdAt | date: 'dd/MM/yyyy HH:mm' }}
                    </div>
                  </div>
                  @if (isOwnerOf(reply)) {
                    <div class="item-menu" (click)="$event.stopPropagation()">
                      <button
                        class="menu-btn"
                        (click)="toggleMenu(reply.id)"
                      >
                        ⋮
                      </button>
                      @if (openMenuId() === reply.id) {
                        <div class="menu-popup">
                          <button (click)="startEdit(reply)">{{ menuLabel(reply).edit }}</button>
                          <button (click)="deleteItem(reply)">{{ menuLabel(reply).del }}</button>
                        </div>
                      }
                    </div>
                  }
                </div>
              }

              <div class="reply-form">
                <input
                  class="reply-input"
                  type="text"
                  placeholder="Viết phản hồi..."
                  [ngModel]="replyTexts()[d.id] || ''"
                  (ngModelChange)="updateReplyText(d.id, $event)"
                  (click)="$event.stopPropagation()"
                />
                <label class="reply-img-btn" (click)="$event.stopPropagation()">
                  🖇️
                  <input
                    type="file"
                    accept="image/*"
                    hidden
                    (change)="onReplyImageSelected($event, d.id)"
                  />
                </label>
                @if (replyImages()[d.id]) {
                  <span
                    class="reply-img-preview"
                    (click)="clearReplyImage(d.id); $event.stopPropagation()"
                    title="Xóa ảnh"
                    >{{ replyImageNames()[d.id] }} ✓</span
                  >
                }
                <button
                  class="reply-send"
                  [disabled]="!replyTexts()[d.id] && !replyImages()[d.id]"
                  (click)="sendReply(d); $event.stopPropagation()"
                >
                  Gửi
                </button>
              </div>
            </div>
          }
        </div>
      }
    </div>

    @if (openMenuId()) {
      <div class="menu-overlay" (click)="openMenuId.set('')"></div>
    }

    @if (zoomedImage()) {
      <div class="lightbox" (click)="zoomedImage.set(null)">
        <img [src]="zoomedImage()" alt="" (click)="$event.stopPropagation()" />
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

    <student-navbar />
  `,
})
export class DiscussionsComponent implements OnInit {
  private authService = inject(AuthService);
  private firestoreService = inject(FirestoreService);
  private notificationService = inject(StudentNotificationService);
  private imageService = inject(ImageService);

  currentUid = this.authService.currentUser?.uid || '';

  profile = this.authService.currentProfile;

  discussions = signal<DiscussionWithReplies[]>([]);
  loading = signal(true);
  showForm = signal(false);
  newGroupId = '';
  newContent = '';
  replyTexts = signal<Record<string, string>>({});
  replyImages = signal<Record<string, string>>({});
  replyImageNames = signal<Record<string, string>>({});
  newDiscussionImage = signal('');
  newDiscussionImageName = signal('');
  zoomedImage = signal<string | null>(null);
  highlightedAuthor = signal<string | null>(null);
  openMenuId = signal('');
  editingId = signal('');
  editContent = signal('');
  editImage = signal('');
  editImageName = signal('');
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

  ngOnInit(): void {
    this.notificationService.markTabVisited('discussions');
    const groupId = this.profile?.groupId;
    const uid = this.profile?.uid;
    if (!groupId) {
      this.loading.set(false);
      return;
    }

    if (uid) {
      this.firestoreService.updateStudent(uid, {
        lastDiscussionsSeenAt: new Date().toISOString(),
      });
    }

    this.firestoreService
      .getDiscussionsByGroup(groupId)
      .subscribe((discussions) => {
        const items: DiscussionWithReplies[] = discussions.map((d) => ({
          ...d,
          replies: [],
          expanded: false,
        }));

        this.discussions.set(items);
        this.loadAvatarForAuthors();
        this.loadAllReplies(discussions);
      });
  }

  private loadAllReplies(discussions: Discussion[]): void {
    let completed = 0;
    const total = discussions.length;
    if (total === 0) return;
    discussions.forEach((d) => {
      this.firestoreService.getRepliesByDiscussion(d.id).subscribe({
        next: (replies) => {
          this.discussions.update((current) =>
            current.map((item) =>
              item.id === d.id ? { ...item, replies } : item,
            ),
          );
          completed++;
          if (completed === total) this.loadAvatarForAuthors();
        },
        error: () => {
          completed++;
          if (completed === total) this.loadAvatarForAuthors();
        },
      });
    });
    this.loading.set(false);
  }

  private loadAvatarForAuthors(): void {
    const discussions = this.discussions();
    const authorsToLoad = new Set<string>();
    discussions.forEach((d) => {
      if (d.authorId && !d.authorAvatarUrl && !this.avatarCache()[d.authorId]) {
        authorsToLoad.add(d.authorId);
      }
      d.replies.forEach((r) => {
        if (
          r.authorId &&
          !r.authorAvatarUrl &&
          !this.avatarCache()[r.authorId]
        ) {
          authorsToLoad.add(r.authorId);
        }
      });
    });
    authorsToLoad.forEach((id) => this.loadAuthorAvatar(id));
  }

  private async loadAuthorAvatar(authorId: string): Promise<void> {
    try {
      const doc = await this.firestoreService.getDocById('teachers', authorId);
      if (doc?.avatarUrl) {
        this.avatarCache.update((m) => ({ ...m, [authorId]: doc.avatarUrl }));
        return;
      }
    } catch {}
    try {
      const doc = await this.firestoreService.getDocById('students', authorId);
      if (doc?.avatarUrl) {
        this.avatarCache.update((m) => ({ ...m, [authorId]: doc.avatarUrl }));
        return;
      }
    } catch {}
    this.avatarCache.update((m) => ({ ...m, [authorId]: '' }));
  }

  toggleDiscussion(d: DiscussionWithReplies): void {
    this.discussions.update((current) =>
      current.map((item) =>
        item.id === d.id ? { ...item, expanded: !item.expanded } : item,
      ),
    );
  }

  updateReplyText(discussionId: string, value: string): void {
    this.replyTexts.update((current) => ({
      ...current,
      [discussionId]: value,
    }));
  }

  async sendReply(d: DiscussionWithReplies): Promise<void> {
    const content = this.replyTexts()[d.id];
    const imageUrl = this.replyImages()[d.id];
    if (!content && !imageUrl) return;
    const profile = this.authService.currentProfile;

    await this.firestoreService.addReply({
      discussionId: d.id,
      authorId: profile?.uid || '',
      authorName: profile?.fullName || 'Bạn',
      authorAvatarUrl: profile?.avatarUrl || '',
      content: content || '',
      imageUrl: imageUrl || '',
    });

    this.updateReplyText(d.id, '');
    this.clearReplyImage(d.id);

    this.firestoreService.getRepliesByDiscussion(d.id).subscribe((replies) => {
      this.discussions.update((current) =>
        current.map((item) => (item.id === d.id ? { ...item, replies } : item)),
      );
      this.loadAvatarForAuthors();
    });
  }

  async createNewDiscussion(): Promise<void> {
    if (!this.newContent && !this.newDiscussionImage()) return;
    const profile = this.authService.currentProfile;

    await this.firestoreService.createDiscussion({
      groupId: this.profile?.groupId,
      authorId: this.profile?.uid || '',
      authorName: profile?.fullName || 'Bạn',
      authorAvatarUrl: profile?.avatarUrl || '',
      title: '',
      content: this.newContent,
      imageUrl: this.newDiscussionImage() || '',
    });

    this.newContent = '';
    this.clearNewDiscussionImage();
    this.showForm.set(false);

    const groupId = this.profile?.groupId;
    if (groupId) {
      this.firestoreService
        .getDiscussionsByGroup(groupId)
        .subscribe((discussions) => {
          const items: DiscussionWithReplies[] = discussions.map((d) => ({
            ...d,
            replies: [],
            expanded: false,
          }));
          this.discussions.set(items);
          this.loadAllReplies(discussions);
        });
    }
  }

  toggleHighlightAuthor(authorName: string): void {
    this.highlightedAuthor.update((current) =>
      current === authorName ? null : authorName,
    );
  }

  cancelNew(): void {
    this.newContent = '';
    this.newDiscussionImage.set('');
    this.showForm.set(false);
  }

  isOwnerOf(item: any): boolean {
    return item.authorId === this.profile?.uid;
  }

  toggleMenu(id: string): void {
    this.openMenuId.update((c) => (c === id ? '' : id));
  }

  menuLabel(item: any): { edit: string; del: string } {
    if (item.discussionId)
      return { edit: 'Sửa bình luận', del: 'Xóa bình luận' };
    return { edit: 'Sửa câu hỏi', del: 'Xóa câu hỏi' };
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

  async saveEdit(item: any): Promise<void> {
    const content = this.editContent() || '';
    const imageUrl = this.editImage() || item.imageUrl || '';
    if (item.discussionId) {
      await this.firestoreService.updateDiscussionReply(item.id, {
        content,
        imageUrl,
      });
      this.discussions.update((list) =>
        list.map((d) => ({
          ...d,
          replies: d.replies.map((r) =>
            r.id === item.id ? { ...r, content, imageUrl } : r,
          ),
        })),
      );
    } else {
      await this.firestoreService.updateDiscussion(item.id, {
        content,
        imageUrl,
      });
      this.discussions.update((list) =>
        list.map((x) =>
          x.id === item.id ? { ...x, content, imageUrl } : x,
        ),
      );
    }
    this.cancelEdit();
  }

  async deleteItem(item: any): Promise<void> {
    if (item.discussionId) {
      if (!confirm('Xóa bình luận này?')) return;
      await this.firestoreService.deleteDiscussionReply(item.id);
      this.discussions.update((list) =>
        list.map((d) => ({
          ...d,
          replies: d.replies.filter((r) => r.id !== item.id),
        })),
      );
    } else {
      if (!confirm('Xóa câu hỏi này?')) return;
      await this.firestoreService.deleteDiscussionCascade(item.id);
      this.discussions.update((list) => list.filter((x) => x.id !== item.id));
    }
    this.cancelEdit();
  }

  async onReplyImageSelected(
    event: Event,
    discussionId: string,
  ): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input?.files?.[0];
    if (!file) return;
    try {
      const compressed = await this.imageService.compressImage(file);
      this.replyImages.update((m) => ({ ...m, [discussionId]: compressed }));
      this.replyImageNames.update((m) => ({ ...m, [discussionId]: file.name }));
    } catch {}
    input.value = '';
  }

  clearReplyImage(discussionId: string): void {
    this.replyImages.update((m) => {
      const next = { ...m };
      delete next[discussionId];
      return next;
    });
    this.replyImageNames.update((m) => {
      const next = { ...m };
      delete next[discussionId];
      return next;
    });
  }

  async onNewDiscussionImageSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input?.files?.[0];
    if (!file) return;
    try {
      const compressed = await this.imageService.compressImage(file);
      this.newDiscussionImage.set(compressed);
      this.newDiscussionImageName.set(file.name);
    } catch {}
    input.value = '';
  }

  clearNewDiscussionImage(): void {
    this.newDiscussionImage.set('');
    this.newDiscussionImageName.set('');
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
}
