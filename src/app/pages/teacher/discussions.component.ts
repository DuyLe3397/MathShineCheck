import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { FirestoreService } from '../../services/firestore.service';
import { AuthService } from '../../services/auth.service';
import { NavbarComponent } from '../../shared/components/navbar.component';
import { TeacherNotificationBellComponent } from '../../shared/components/teacher-notification-bell.component';
import { ImageService } from '../../services/image.service';
import { Group, SchoolClass, Discussion, DiscussionReply } from '../../models';

interface DiscussionWithReplies extends Discussion {
  replies: DiscussionReply[];
  expanded: boolean;
  groupName: string;
}

@Component({
  selector: 'app-teacher-discussions',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    NavbarComponent,
    TeacherNotificationBellComponent,
  ],
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
      }
      .nav-item:hover {
        background: #334155;
        color: #fff;
      }
      .nav-item.active {
        background: rgba(37, 99, 235, 0.2);
        color: #60a5fa;
        border-left-color: #2563eb;
      }
      .sidebar-footer {
        padding: 16px 20px;
        border-top: 1px solid #334155;
      }
      .user-info {
        font-size: 0.85rem;
        color: #94a3b8;
        margin-bottom: 8px;
      }
      .user-info strong {
        color: #e2e8f0;
        display: block;
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
      }
      .logout-btn:hover {
        background: #334155;
        color: #fff;
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
        flex-wrap: wrap;
      }
      .header h1 {
        margin: 0;
        font-size: 1.5rem;
        color: #1e293b;
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
      .filters-row {
        display: flex;
        gap: 12px;
        flex-wrap: wrap;
      }
      .form-group {
        flex: 1;
        min-width: 150px;
      }
      .form-group label {
        display: block;
        font-size: 0.85rem;
        font-weight: 500;
        color: #475569;
        margin-bottom: 6px;
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
      }
      .form-select:focus {
        border-color: #2563eb;
        box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
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
      .btn-post:disabled {
        background: #94a3b8;
        cursor: not-allowed;
      }

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
        font-weight: 600;
        font-size: 0.95rem;
        color: #1e293b;
        margin-bottom: 0.25rem;
      }
      .discussion-meta {
        font-size: 0.75rem;
        color: #94a3b8;
        display: flex;
        gap: 0.75rem;
      }
      .reply-count {
        font-size: 0.75rem;
        color: #2563eb;
        font-weight: 600;
        white-space: nowrap;
      }
      .replies-section {
        padding: 0.75rem 1rem 1rem 2.25rem;
        border-top: 1px solid #e2e8f0;
        background: #f8fafc;
      }
      .reply-item {
        position: relative;
        display: flex;
        gap: 0.5rem;
        padding: 0.5rem 32px 0.5rem 0;
        border-bottom: 1px solid #f1f5f9;
        font-size: 0.85rem;
      }
      .reply-item:last-child {
        border-bottom: none;
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
      .item-menu {
        position: relative;
        margin-left: auto;
        flex-shrink: 0;
      }
      .menu-btn {
        background: none;
        border: none;
        cursor: pointer;
        font-size: 1.1rem;
        padding: 0 4px;
        color: #94a3b8;
        border-radius: 4px;
      }
      .menu-btn:hover {
        background: #f1f5f9;
        color: #1e293b;
      }
      .menu-popup {
        position: absolute;
        right: 100%;
        margin-right: 4px;
        top: 50%;
        transform: translateY(-50%);
        background: #fff;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
        z-index: 50;
        min-width: 110px;
        overflow: hidden;
      }
      .menu-overlay {
        position: fixed;
        inset: 0;
        z-index: 40;
      }
      .menu-popup button {
        display: block;
        width: calc(100% - 8px);
        margin: 2px 4px;
        padding: 8px 12px;
        border: 1px solid transparent;
        border-radius: 8px;
        background: none;
        text-align: left;
        cursor: pointer;
        font-size: 0.85rem;
        color: #334155;
      }
      .menu-popup button:hover {
        background: #f8fafc;
        border-color: #2563eb;
        box-shadow: 0 3px 12px rgba(37, 99, 235, 0.2);
      }
      .edit-area {
        display: flex;
        flex-direction: column;
        gap: 6px;
        padding: 6px 0;
      }
      .edit-input {
        width: 100%;
        padding: 6px 10px;
        border: 1px solid #e2e8f0;
        border-radius: 6px;
        font-size: 0.85rem;
      }
      .edit-actions {
        display: flex;
        gap: 6px;
      }
      .edit-save {
        background: #2563eb;
        color: #fff;
        border: none;
        border-radius: 6px;
        padding: 5px 14px;
        cursor: pointer;
        font-size: 0.82rem;
      }
      .edit-cancel {
        background: #f1f5f9;
        color: #64748b;
        border: none;
        border-radius: 6px;
        padding: 5px 14px;
        cursor: pointer;
        font-size: 0.82rem;
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
          <a class="nav-item active" routerLink="/teacher/discussions"
            >Thảo luận</a
          >
          <a class="nav-item" routerLink="/teacher/statistics">Thống kê</a>
          <a class="nav-item" routerLink="/teacher/profile">Hồ sơ</a>
          <teacher-notification-bell />
        </nav>
        <div class="sidebar-footer">
          <div class="user-info">
            <strong>{{ profile?.fullName }}</strong>
            {{ profile?.subject }}
          </div>
          <button class="logout-btn" (click)="logout()">Đăng xuất</button>
        </div>
      </aside>

      <main class="main">
        <div class="header">
          <h1>Thảo luận</h1>
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
                  @for (c of classes; track c.id) {
                    <option [value]="c.id">{{ c.name }}</option>
                  }
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
                  @for (g of filteredGroups; track g.id) {
                    <option [value]="g.id">{{ g.name }}</option>
                  }
                </select>
              </div>
            </div>
          </div>

          @if (selectedGroupId) {
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
                  <label
                    class="reply-img-btn"
                    (click)="$event.stopPropagation()"
                  >
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
                      (click)="
                        clearNewDiscussionImage(); $event.stopPropagation()
                      "
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
                <p>Chưa có thảo luận nào</p>
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
                          <button class="edit-save" (click)="saveEdit(d)">
                            Lưu
                          </button>
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
                              zoomedImage.set(d.imageUrl);
                              $event.stopPropagation()
                            "
                          />
                        }
                        <div class="discussion-meta">
                          <div
                            style="width:24px;height:24px;border-radius:50%;overflow:hidden;background:#f1f5f9;display:flex;align-items:center;justify-content:center;flex-shrink:0;"
                          >
                            @if (d.authorAvatarUrl) {
                              <img
                                [src]="d.authorAvatarUrl"
                                alt=""
                                style="width:100%;height:100%;object-fit:cover;"
                              />
                            } @else {
                              <span style="font-size:0.8rem;color:#94a3b8;"
                                >👤</span
                              >
                            }
                          </div>
                          <span>{{ d.authorName }}</span>
                          <span>{{
                            d.createdAt | date: 'dd/MM/yyyy HH:mm'
                          }}</span>
                        </div>
                      </div>
                    }
                    @if (isOwnerOf(d)) {
                      <div class="item-menu" (click)="$event.stopPropagation()">
                        <button class="menu-btn" (click)="toggleMenu(d.id)">
                          ⋮
                        </button>
                        @if (openMenuId() === d.id) {
                          <div class="menu-popup">
                            <button (click)="startEdit(d)">
                              {{ menuLabel(d).edit }}
                            </button>
                            <button (click)="deleteItem(d)">
                              {{ menuLabel(d).del }}
                            </button>
                          </div>
                        }
                      </div>
                    }
                  </div>
                  <span class="reply-count"
                    >{{ d.replies.length }} trả lời</span
                  >
                </div>

                @if (d.expanded) {
                  <div class="replies-section">
                    @if (d.replies.length === 0) {
                      <div class="no-replies">Chưa có phản hồi</div>
                    }
                    @for (reply of d.replies; track reply.id) {
                      <div class="reply-item" [id]="'reply-' + reply.id">
                        <div class="reply-avatar">
                          @if (reply.authorAvatarUrl) {
                            <img [src]="reply.authorAvatarUrl" alt="" />
                          } @else {
                            <span class="reply-avatar-placeholder">👤</span>
                          }
                        </div>
                        <div class="reply-body">
                          <div class="reply-author">{{ reply.authorName }}</div>
                          @if (editingId() === reply.id) {
                            <div
                              class="edit-area"
                              (click)="$event.stopPropagation()"
                            >
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
                                <button
                                  class="edit-cancel"
                                  (click)="cancelEdit()"
                                >
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
                          <div
                            class="item-menu"
                            (click)="$event.stopPropagation()"
                          >
                            <button
                              class="menu-btn"
                              (click)="toggleMenu(reply.id)"
                            >
                              ⋮
                            </button>
                            @if (openMenuId() === reply.id) {
                              <div class="menu-popup">
                                <button (click)="startEdit(reply)">
                                  {{ menuLabel(reply).edit }}
                                </button>
                                <button (click)="deleteItem(reply)">
                                  {{ menuLabel(reply).del }}
                                </button>
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
                      <label
                        class="reply-img-btn"
                        (click)="$event.stopPropagation()"
                      >
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
                          (click)="
                            clearReplyImage(d.id); $event.stopPropagation()
                          "
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
          } @else {
            <div class="empty-state">
              <p>Chọn lớp và nhóm để xem thảo luận</p>
            </div>
          }
        </div>
      </main>
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
export class TeacherDiscussionsComponent implements OnInit {
  private authService = inject(AuthService);
  private firestoreService = inject(FirestoreService);
  private imageService = inject(ImageService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  profile = this.authService.currentProfile;
  currentUid = this.authService.currentUser?.uid || '';

  classes: SchoolClass[] = [];
  allGroups: Group[] = [];
  filteredGroups: Group[] = [];
  selectedClassId = '';
  selectedGroupId = '';

  discussions = signal<DiscussionWithReplies[]>([]);
  loading = signal(true);
  showForm = signal(false);
  newGroupId = '';
  newContent = '';
  newDiscussionImage = signal('');
  newDiscussionImageName = signal('');
  replyTexts = signal<Record<string, string>>({});
  replyImages = signal<Record<string, string>>({});
  replyImageNames = signal<Record<string, string>>({});
  zoomedImage = signal<string | null>(null);
  openMenuId = signal('');
  editingId = signal('');
  editContent = signal('');
  editImage = signal('');
  editImageName = signal('');
  private pendingDiscussionId = '';
  private pendingReplyId = '';

  ngOnInit(): void {
    const profile = this.authService.currentProfile;
    if (!profile) {
      this.loading.set(false);
      return;
    }

    this.pendingDiscussionId =
      this.route.snapshot.queryParamMap.get('discussion') || '';
    this.pendingReplyId = this.route.snapshot.queryParamMap.get('reply') || '';

    this.firestoreService.getClasses().subscribe((classesData) => {
      this.classes = classesData;
    });

    this.firestoreService.getAllGroups().subscribe((groupsData) => {
      this.allGroups = groupsData;
      if (this.pendingDiscussionId) {
        this.firestoreService
          .getDiscussion(this.pendingDiscussionId)
          .subscribe((d) => {
            if (!d) return;
            const group = this.allGroups.find((g) => g.id === d.groupId);
            if (!group) return;
            const cls = this.classes.find((c) => c.id === group.classId);
            if (cls) this.selectedClassId = cls.id;
            this.selectedGroupId = group.id;
            this.onGroupChange();
          });
      }
    });

    this.loading.set(false);
  }

  onClassChange(): void {
    this.selectedGroupId = '';
    this.discussions.set([]);
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
      this.discussions.set([]);
      return;
    }
    this.loadDiscussions();
  }

  private loadDiscussions(): void {
    if (!this.selectedGroupId) return;
    this.loading.set(true);

    const group = this.allGroups.find((g) => g.id === this.selectedGroupId);
    const groupName = group?.name || '';

    this.firestoreService
      .getDiscussionsByGroup(this.selectedGroupId)
      .subscribe((discussions) => {
        const items: DiscussionWithReplies[] = discussions.map((d) => ({
          ...d,
          replies: [],
          expanded: false,
          groupName,
        }));
        items.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        );
        this.discussions.set(items);
        this.loadAllReplies(items);
        this.loading.set(false);

        if (this.pendingDiscussionId) {
          this.discussions.update((current) =>
            current.map((item) =>
              item.id === this.pendingDiscussionId
                ? { ...item, expanded: true }
                : item,
            ),
          );
        }
      });
  }

  private loadAllReplies(items: DiscussionWithReplies[]): void {
    let completed = 0;
    items.forEach((d) => {
      this.firestoreService
        .getRepliesByDiscussion(d.id)
        .subscribe((replies) => {
          this.discussions.update((current) =>
            current.map((item) =>
              item.id === d.id ? { ...item, replies } : item,
            ),
          );
          completed++;
          if (
            completed === items.length &&
            this.pendingDiscussionId &&
            this.pendingReplyId
          ) {
            setTimeout(() => {
              const el = document.getElementById(
                'reply-' + this.pendingReplyId,
              );
              if (el)
                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
              this.pendingDiscussionId = '';
              this.pendingReplyId = '';
            }, 400);
          }
        });
    });
  }

  toggleDiscussion(d: DiscussionWithReplies): void {
    this.discussions.update((current) =>
      current.map((item) =>
        item.id === d.id ? { ...item, expanded: !item.expanded } : item,
      ),
    );
  }

  isOwnerOf(item: any): boolean {
    return item.authorId === this.currentUid;
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
        list.map((x) => (x.id === item.id ? { ...x, content, imageUrl } : x)),
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
      authorId: this.currentUid,
      authorName: profile?.fullName || 'Giáo viên',
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
    });
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

  async createNewDiscussion(): Promise<void> {
    if (
      !this.selectedGroupId ||
      (!this.newContent && !this.newDiscussionImage())
    )
      return;
    const profile = this.authService.currentProfile;
    const groupId = this.selectedGroupId;

    await this.firestoreService.createDiscussion({
      groupId,
      authorId: this.currentUid,
      authorName: profile?.fullName || 'Giáo viên',
      authorAvatarUrl: profile?.avatarUrl || '',
      title: '',
      content: this.newContent,
      imageUrl: this.newDiscussionImage() || '',
    });

    this.newContent = '';
    this.newDiscussionImage.set('');
    this.newDiscussionImageName.set('');
    this.showForm.set(false);
    this.loadDiscussions();
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

  cancelNew(): void {
    this.newContent = '';
    this.showForm.set(false);
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/role-select']);
  }
}
