import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <nav class="navbar">
      <div class="nav-left">
        <a routerLink="/teacher/dashboard" class="logo">MATHSHINE CHECK</a>
        <div class="nav-links">
          <a routerLink="/teacher/dashboard" routerLinkActive="active">Tổng quan</a>
          <a routerLink="/teacher/classes" routerLinkActive="active">Lớp học</a>
          <a routerLink="/teacher/groups" routerLinkActive="active">Nhóm</a>
          <a routerLink="/teacher/students" routerLinkActive="active">Học sinh</a>
          <a routerLink="/teacher/assignments" routerLinkActive="active">Bài tập</a>
          <a routerLink="/teacher/statistics" routerLinkActive="active">Thống kê</a>
        </div>
      </div>
      <div class="nav-right">
        <span class="teacher-name">{{ currentProfile?.fullName }}</span>
        <button class="btn btn-outline btn-sm" (click)="logout()">Đăng xuất</button>
      </div>
    </nav>
  `,
  styles: [`
    .navbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: #1e293b;
      color: white;
      padding: 0 24px;
      height: 60px;
      position: sticky;
      top: 0;
      z-index: 1000;
    }
    .nav-left {
      display: flex;
      align-items: center;
      gap: 32px;
    }
    .logo {
      font-size: 18px;
      font-weight: 700;
      color: #2563eb;
      text-decoration: none;
      letter-spacing: 1px;
    }
    .nav-links {
      display: flex;
      gap: 4px;
    }
    .nav-links a {
      color: #94a3b8;
      text-decoration: none;
      padding: 8px 14px;
      border-radius: 6px;
      font-size: 14px;
      font-weight: 500;
      transition: all 0.2s;
    }
    .nav-links a:hover {
      color: white;
      background: rgba(255,255,255,0.08);
    }
    .nav-links a.active {
      color: white;
      background: rgba(37,99,235,0.2);
    }
    .nav-right {
      display: flex;
      align-items: center;
      gap: 16px;
    }
    .teacher-name {
      font-size: 14px;
      font-weight: 500;
      color: #e2e8f0;
    }
    .btn-sm {
      padding: 6px 14px;
      font-size: 13px;
    }
  `]
})
export class NavbarComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  currentProfile = this.authService.currentProfile;

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/role-select']);
  }
}
