import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { FirestoreService } from '../../services/firestore.service';
import { StudentNotificationService } from '../../services/student-notification.service';

@Component({
  selector: 'student-navbar',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  styles: [
    `
      :host {
        display: block;
      }

      .navbar {
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        background: #fff;
        border-top: 1px solid #e2e8f0;
        display: flex;
        align-items: center;
        justify-content: space-around;
        padding: 0.4rem 0 0.6rem;
        box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.06);
        z-index: 100;
      }

      .nav-item {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.2rem;
        text-decoration: none;
        color: #94a3b8;
        font-size: 0.78rem;
        font-weight: 700;
        cursor: pointer;
        background: none;
        border: none;
        padding: 0.25rem 0.5rem;
        transition: color 0.15s;
      }

      .nav-item .icon {
        font-size: 1.15rem;
        line-height: 1;
      }

      .badge-dot {
        position: absolute;
        top: -2px;
        right: -2px;
        min-width: 8px;
        height: 8px;
        border-radius: 50%;
        background: #ef4444;
        border: 2px solid #fff;
        animation: notification-pulse 1.5s ease-in-out infinite;
      }
      .nav-badge {
        position: absolute;
        top: -4px;
        right: -8px;
        background: #ef4444;
        color: #fff;
        font-weight: 800;
        font-size: 0.65rem;
        padding: 1px 5px;
        border-radius: 8px;
        line-height: 1.3;
        border: 2px solid #fff;
      }

      .badge-count {
        position: absolute;
        top: -6px;
        right: -8px;
        min-width: 18px;
        height: 18px;
        border-radius: 9px;
        background: #ef4444;
        color: #fff;
        font-size: 0.65rem;
        font-weight: 700;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 0 4px;
        border: 2px solid #fff;
        line-height: 1;
      }

      .nav-item {
        position: relative;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.2rem;
        text-decoration: none;
        color: #94a3b8;
        font-size: 0.78rem;
        font-weight: 700;
        cursor: pointer;
        background: none;
        border: none;
        padding: 0.25rem 0.5rem;
        transition: color 0.15s;
      }

      .nav-item .icon {
        font-size: 1.15rem;
        line-height: 1;
      }

      .nav-item.active {
        color: #2563eb;
      }

      .nav-label {
        font-weight: 600;
      }

      .profile-dropdown {
        position: fixed;
        bottom: 70px;
        right: 1rem;
        background: #fff;
        border-radius: 12px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
        padding: 0.5rem 0;
        z-index: 200;
        min-width: 180px;
      }

      .dropdown-header {
        padding: 0.6rem 1rem;
        border-bottom: 1px solid #f1f5f9;
        font-weight: 600;
        font-size: 0.85rem;
        color: #1e293b;
      }

      .dropdown-item {
        display: block;
        width: 100%;
        padding: 0.6rem 1rem;
        border: none;
        background: none;
        text-align: left;
        font-size: 0.85rem;
        color: #475569;
        cursor: pointer;
      }

      .dropdown-item:hover {
        background: #f8fafc;
      }

      .overlay {
        position: fixed;
        inset: 0;
        z-index: 150;
      }

      @keyframes notification-pulse {
        0% {
          transform: scale(1);
        }
        50% {
          transform: scale(1.4);
        }
        100% {
          transform: scale(1);
        }
      }
    `,
  ],
  template: `
    <nav class="navbar">
      <a
        class="nav-item"
        [class.active]="isActive('/student/home')"
        routerLink="/student/home"
      >
        <span class="nav-label">Trang chủ</span>
        @if (badgeCounts().home > 0) {
          <span class="badge-dot"></span>
        }
      </a>

      <a
        class="nav-item"
        [class.active]="isActive('/student/scoreboard')"
        routerLink="/student/scoreboard"
      >
        <span class="nav-label">Bảng điểm</span>
        @if (badgeCounts().scoreboard > 0) {
          <span class="badge-dot"></span>
        }
      </a>

      <a
        class="nav-item"
        [class.active]="isActive('/student/discussions')"
        routerLink="/student/discussions"
      >
        <span class="nav-label">Thảo luận</span>
        @if (badgeCounts().discussions > 0) {
          <span class="nav-badge">+{{ badgeCounts().discussions }}</span>
        }
      </a>

      <span
        class="nav-item"
        style="cursor:pointer"
        (click)="toggleProfileMenu()"
      >
        @if (profileAvatar()) {
          <span
            style="width:24px;height:24px;border-radius:50%;overflow:hidden;background:#f1f5f9;display:flex;align-items:center;justify-content:center;flex-shrink:0;"
          >
            <img
              [src]="profileAvatar()"
              alt=""
              style="width:100%;height:100%;object-fit:cover;"
            />
          </span>
        } @else {
          <span class="icon">👤</span>
        }
        <span class="nav-label">{{ profile?.fullName }}</span>
      </span>
    </nav>

    @if (profileMenuOpen()) {
      <div class="overlay" (click)="profileMenuOpen.set(false)"></div>
      <div class="profile-dropdown">
        <button
          class="dropdown-item"
          routerLink="/student/profile"
          routerLinkActive="active"
        >
          Hồ sơ cá nhân
        </button>
        <button class="dropdown-item" (click)="logout()">Đăng xuất</button>
      </div>
    }
  `,
})
export class StudentNavbarComponent implements OnInit {
  private authService = inject(AuthService);
  private firestoreService = inject(FirestoreService);
  private notificationService = inject(StudentNotificationService);
  private router = inject(Router);

  profile = this.authService.currentProfile;
  profileMenuOpen = signal(false);
  badgeCounts = this.notificationService.badgeCounts;
  profileAvatar = signal('');

  ngOnInit(): void {
    const uid = this.profile?.uid;
    const groupId = this.profile?.groupId;
    if (!uid || !groupId) return;

    this.firestoreService
      .getDocById('students', uid)
      .then((doc) => {
        if (doc?.avatarUrl) this.profileAvatar.set(doc.avatarUrl);
      })
      .catch(() => {});

    const subscribeWithTimestamps = (
      homeSeen: number,
      scoreboardSeen: number,
      discussionsSeen: number,
    ) => {
      this.firestoreService.getPermissionsForOwner(uid).subscribe((perms) => {
        const pending = perms.filter((p) => {
          if (p.status !== 'pending') return false;
          return new Date(p.createdAt).getTime() > homeSeen;
        }).length;
        this.notificationService.updateBadge('home', pending);
      });

      this.firestoreService
        .getPermissionsByRequester(uid)
        .subscribe((perms) => {
          const responded = perms.filter((p) => {
            if (p.status === 'pending') return false;
            return new Date(p.createdAt).getTime() > scoreboardSeen;
          }).length;
          this.notificationService.updateBadge('scoreboard', responded);
        });

      this.firestoreService
        .getDiscussionsByGroup(groupId)
        .subscribe((discussions) => {
          const count = discussions.filter((d) => {
            if (new Date(d.createdAt).getTime() > discussionsSeen) return true;
            if (
              d.lastReplyAt &&
              new Date(d.lastReplyAt).getTime() > discussionsSeen
            )
              return true;
            return false;
          }).length;
          this.notificationService.updateBadge('discussions', count);
        });
    };

    this.firestoreService
      .getStudent(uid)
      .then((student) => {
        const homeSeen = student?.lastHomeSeenAt
          ? new Date(student.lastHomeSeenAt).getTime()
          : 0;
        const scoreboardSeen = student?.lastScoreboardSeenAt
          ? new Date(student.lastScoreboardSeenAt).getTime()
          : 0;
        const discussionsSeen = student?.lastDiscussionsSeenAt
          ? new Date(student.lastDiscussionsSeenAt).getTime()
          : 0;
        subscribeWithTimestamps(homeSeen, scoreboardSeen, discussionsSeen);
      })
      .catch(() => {
        subscribeWithTimestamps(0, 0, 0);
      });
  }

  isActive(path: string): boolean {
    return this.router.url.startsWith(path);
  }

  toggleProfileMenu(): void {
    this.profileMenuOpen.update((v) => !v);
  }

  async logout(): Promise<void> {
    this.profileMenuOpen.set(false);
    await this.authService.logout();
    this.router.navigate(['/role-select']);
  }
}
