import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { FirestoreService } from '../../services/firestore.service';
import { ImageService } from '../../services/image.service';
import { StudentNavbarComponent } from '../student/student-navbar.component';
import { UserProfile } from '../../models';

@Component({
  selector: 'app-profile',
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
        max-width: 600px;
        margin: 0 auto;
      }
      .card {
        background: #fff;
        border-radius: 12px;
        padding: 1.5rem;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
        margin-bottom: 1rem;
      }
      .card-title {
        font-size: 1rem;
        font-weight: 600;
        color: #1e293b;
        margin: 0 0 1rem;
      }
      .avatar-section {
        display: flex;
        align-items: center;
        gap: 1rem;
        margin-bottom: 1rem;
      }
      .avatar-circle {
        width: 80px;
        height: 80px;
        border-radius: 50%;
        overflow: hidden;
        border: 3px solid #e2e8f0;
        flex-shrink: 0;
        background: #f1f5f9;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .avatar-circle img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
      .avatar-placeholder {
        font-size: 2rem;
        color: #94a3b8;
      }
      .upload-btn {
        padding: 0.4rem 0.9rem;
        border: 1.5px solid #2563eb;
        border-radius: 8px;
        background: #fff;
        color: #2563eb;
        font-size: 0.8rem;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.15s;
        white-space: nowrap;
      }
      .upload-btn:hover {
        background: #eff6ff;
      }
      .avatar-input {
        display: none;
      }
      .form-group {
        margin-bottom: 1rem;
      }
      .form-group label {
        display: block;
        font-size: 0.82rem;
        font-weight: 600;
        color: #475569;
        margin-bottom: 0.3rem;
      }
      .form-input,
      .form-textarea {
        width: 100%;
        padding: 0.5rem 0.75rem;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        font-size: 0.88rem;
        outline: none;
        box-sizing: border-box;
        font-family: inherit;
        transition: border-color 0.2s;
      }
      .form-input:focus,
      .form-textarea:focus {
        border-color: #2563eb;
      }
      .form-textarea {
        resize: vertical;
        min-height: 100px;
      }
      .save-btn {
        padding: 0.6rem 1.5rem;
        background: #2563eb;
        color: #fff;
        border: none;
        border-radius: 8px;
        font-size: 0.9rem;
        font-weight: 600;
        cursor: pointer;
        transition: background 0.15s;
      }
      .save-btn:hover:not(:disabled) {
        background: #1d4ed8;
      }
      .save-btn:disabled {
        background: #94a3b8;
        cursor: not-allowed;
      }
      .info-row {
        display: flex;
        justify-content: space-between;
        padding: 0.4rem 0;
        border-bottom: 1px solid #f1f5f9;
        font-size: 0.88rem;
      }
      .info-label {
        color: #64748b;
      }
      .info-value {
        color: #1e293b;
        font-weight: 500;
      }
      .role-badge {
        display: inline-block;
        padding: 0.15rem 0.5rem;
        border-radius: 6px;
        font-size: 0.72rem;
        font-weight: 600;
      }
      .role-teacher {
        background: #dbeafe;
        color: #2563eb;
      }
      .role-student {
        background: #dcfce7;
        color: #16a34a;
      }
      .success-msg {
        background: #dcfce7;
        color: #16a34a;
        padding: 0.5rem 0.75rem;
        border-radius: 8px;
        font-size: 0.82rem;
        margin-top: 0.5rem;
      }

      .layout {
        display: flex;
        min-height: 100vh;
      }
      :host:has(.layout) {
        padding-bottom: 0;
        background: #f1f5f9;
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
      .page-header h1 {
        margin: 0;
        font-size: 1.5rem;
        color: #1e293b;
      }
      .page-header p {
        margin: 4px 0 0;
        color: #64748b;
        font-size: 0.9rem;
      }
      @media (max-width: 768px) {
        .layout {
          flex-direction: column;
        }
        .sidebar {
          width: 100%;
        }
      }
    `,
  ],
  template: `
    @if (profile?.role === 'teacher') {
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
            <a class="nav-item" routerLink="/teacher/statistics">Thống kê</a>
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
          <div class="page-header">
            <h1>Hồ sơ cá nhân</h1>
            <p>{{ profile?.fullName }}</p>
          </div>
          <div class="content">
            <div class="card">
              <div class="card-title">Thông tin tài khoản</div>
              <div class="info-row">
                <span class="info-label">Họ tên</span>
                <span class="info-value">{{ profile?.fullName }}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Vai trò</span>
                <span class="info-value">
                  <span class="role-badge role-teacher"> Giáo viên </span>
                </span>
              </div>
              @if (profile?.className) {
                <div class="info-row">
                  <span class="info-label">Lớp</span>
                  <span class="info-value">{{ profile?.className }}</span>
                </div>
              }
              @if (profile?.subject) {
                <div class="info-row">
                  <span class="info-label">Môn</span>
                  <span class="info-value">{{ profile?.subject }}</span>
                </div>
              }
            </div>

            <div class="card">
              <div class="card-title">Ảnh đại diện</div>
              <div class="avatar-section">
                <div class="avatar-circle">
                  @if (avatarDataUrl()) {
                    <img [src]="avatarDataUrl()" alt="Avatar" />
                  } @else {
                    <span class="avatar-placeholder">👤</span>
                  }
                </div>
                <div>
                  <label class="upload-btn" for="avatarFile"
                    >Thay đổi ảnh</label
                  >
                  <input
                    type="file"
                    id="avatarFile"
                    class="avatar-input"
                    accept="image/*"
                    (change)="onAvatarSelected($event)"
                  />
                  <div
                    *ngIf="savingAvatar"
                    style="font-size:0.78rem;color:#94a3b8;margin-top:0.3rem;"
                  >
                    Đang tải lên...
                  </div>
                </div>
              </div>
            </div>

            <div class="card">
              <div class="card-title">Tiểu sử</div>
              <div class="form-group">
                <textarea
                  class="form-textarea"
                  placeholder="Mô tả ngắn về bản thân..."
                  [(ngModel)]="bio"
                  rows="4"
                ></textarea>
              </div>
              <button
                class="save-btn"
                (click)="saveBio()"
                [disabled]="savingBio"
              >
                {{ savingBio ? 'Đang lưu...' : 'Lưu tiểu sử' }}
              </button>
              @if (saveSuccess) {
                <div class="success-msg">Đã lưu thành công!</div>
              }
            </div>
          </div>
        </main>
      </div>
    } @else {
      <div class="page-header">
        <h2>Hồ sơ cá nhân</h2>
        <p class="subtitle">{{ profile?.fullName }}</p>
      </div>

      <div class="content">
        <div class="card">
          <div class="card-title">Thông tin tài khoản</div>
          <div class="info-row">
            <span class="info-label">Họ tên</span>
            <span class="info-value">{{ profile?.fullName }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Vai trò</span>
            <span class="info-value">
              <span class="role-badge role-student"> Học sinh </span>
            </span>
          </div>
          @if (profile?.className) {
            <div class="info-row">
              <span class="info-label">Lớp</span>
              <span class="info-value">{{ profile?.className }}</span>
            </div>
          }
          @if (profile?.subject) {
            <div class="info-row">
              <span class="info-label">Môn</span>
              <span class="info-value">{{ profile?.subject }}</span>
            </div>
          }
        </div>

        <div class="card">
          <div class="card-title">Ảnh đại diện</div>
          <div class="avatar-section">
            <div class="avatar-circle">
              @if (avatarDataUrl()) {
                <img [src]="avatarDataUrl()" alt="Avatar" />
              } @else {
                <span class="avatar-placeholder">👤</span>
              }
            </div>
            <div>
              <label class="upload-btn" for="avatarFile">Thay đổi ảnh</label>
              <input
                type="file"
                id="avatarFile"
                class="avatar-input"
                accept="image/*"
                (change)="onAvatarSelected($event)"
              />
              <div
                *ngIf="savingAvatar"
                style="font-size:0.78rem;color:#94a3b8;margin-top:0.3rem;"
              >
                Đang tải lên...
              </div>
            </div>
          </div>
        </div>

        <div class="card">
          <div class="card-title">Tiểu sử</div>
          <div class="form-group">
            <textarea
              class="form-textarea"
              placeholder="Mô tả ngắn về bản thân..."
              [(ngModel)]="bio"
              rows="4"
            ></textarea>
          </div>
          <button class="save-btn" (click)="saveBio()" [disabled]="savingBio">
            {{ savingBio ? 'Đang lưu...' : 'Lưu tiểu sử' }}
          </button>
          @if (saveSuccess) {
            <div class="success-msg">Đã lưu thành công!</div>
          }
        </div>
      </div>

      <student-navbar />
    }
  `,
})
export class ProfileComponent implements OnInit {
  private authService = inject(AuthService);
  private firestoreService = inject(FirestoreService);
  private imageService = inject(ImageService);
  private router = inject(Router);

  profile = this.authService.currentProfile;

  avatarDataUrl = signal<string | null>(null);
  bio = '';
  savingAvatar = false;
  savingBio = false;
  saveSuccess = false;

  ngOnInit(): void {
    const profile = this.authService.currentProfile;
    if (!profile) {
      this.router.navigate(['/role-select']);
      return;
    }
    this.loadAvatar(profile.uid);
    this.loadBio(profile.uid);
  }

  private async loadAvatar(uid: string): Promise<void> {
    try {
      const profile = this.authService.currentProfile;
      if (!profile) return;
      const collectionPath =
        profile.role === 'teacher' ? 'teachers' : 'students';
      const docSnap = await this.firestoreService.getDocById(
        collectionPath,
        uid,
      );
      if (docSnap && docSnap['avatarUrl']) {
        this.avatarDataUrl.set(docSnap['avatarUrl']);
      }
    } catch {
      /* ignore */
    }
  }

  private async loadBio(uid: string): Promise<void> {
    try {
      const ref = await this.firestoreService.getDocById('userProfiles', uid);
      if (ref) {
        this.bio = ref['bio'] || '';
      }
    } catch {
      /* ignore */
    }
  }

  async onAvatarSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input?.files?.[0];
    if (!file) return;

    this.savingAvatar = true;
    try {
      const compressed = await this.imageService.compressImage(file);
      const profile = this.authService.currentProfile;
      if (profile?.uid) {
        const collectionPath =
          profile.role === 'teacher' ? 'teachers' : 'students';
        if (profile.role === 'teacher') {
          await this.firestoreService.updateTeacher(profile.uid, {
            avatarUrl: compressed,
          } as any);
        } else {
          await this.firestoreService.updateStudent(profile.uid, {
            avatarUrl: compressed,
          } as any);
        }
        this.avatarDataUrl.set(compressed);
      }
    } catch (err: any) {
      console.error('Avatar upload error:', err);
      alert('Lỗi khi tải ảnh đại diện: ' + (err?.message || String(err)));
    } finally {
      this.savingAvatar = false;
      input.value = '';
    }
  }

  async saveBio(): Promise<void> {
    const profile = this.authService.currentProfile;
    if (!profile?.uid) return;

    this.savingBio = true;
    try {
      await this.firestoreService.setDoc('userProfiles', profile.uid, {
        bio: this.bio,
        updatedAt: new Date().toISOString(),
      });
      this.saveSuccess = true;
      setTimeout(() => (this.saveSuccess = false), 2000);
    } catch {
      alert('Lỗi khi lưu tiểu sử');
    } finally {
      this.savingBio = false;
    }
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/role-select']);
  }
}
