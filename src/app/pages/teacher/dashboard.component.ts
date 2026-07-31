import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, RouterLink } from '@angular/router';
import { FirestoreService } from '../../services/firestore.service';
import { AuthService } from '../../services/auth.service';
import { NavbarComponent } from '../../shared/components/navbar.component';
import { TeacherNotificationBellComponent } from '../../shared/components/teacher-notification-bell.component';
import { combineLatest, forkJoin, map, switchMap } from 'rxjs';
import { Assignment, Submission, Grade } from '../../models';

@Component({
  selector: 'app-teacher-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, RouterLink, NavbarComponent, TeacherNotificationBellComponent],
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

        &:hover {
          background: #334155;
          color: #fff;
        }

        &.active {
          background: rgba(37, 99, 235, 0.2);
          color: #60a5fa;
          border-left-color: #2563eb;
        }
      }

      .sidebar-footer {
        padding: 16px 20px;
        border-top: 1px solid #334155;
      }

      .user-info {
        font-size: 0.85rem;
        color: #94a3b8;
        margin-bottom: 8px;

        strong {
          color: #e2e8f0;
          display: block;
        }
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

        &:hover {
          background: #334155;
          color: #fff;
        }
      }

      .main {
        flex: 1;
        overflow-y: auto;
      }

      .header {
        background: #fff;
        padding: 20px 32px;
        border-bottom: 1px solid #e2e8f0;

        h1 {
          margin: 0;
          font-size: 1.5rem;
          color: #1e293b;
        }

        p {
          margin: 4px 0 0;
          color: #64748b;
          font-size: 0.9rem;
        }
      }

      .content {
        padding: 24px 32px;
      }

      .stats-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
        gap: 20px;
        margin-bottom: 32px;
      }

      .stat-card {
        background: #fff;
        border-radius: 12px;
        padding: 24px;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);

        .stat-label {
          font-size: 0.85rem;
          color: #64748b;
          margin-bottom: 8px;
        }

        .stat-value {
          font-size: 2rem;
          font-weight: 700;
          color: #1e293b;
        }

        .stat-icon {
          float: right;
          width: 44px;
          height: 44px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.2rem;
        }

        &:nth-child(1) .stat-icon {
          background: #dbeafe;
        }
        &:nth-child(2) .stat-icon {
          background: #fef3c7;
        }
        &:nth-child(3) .stat-icon {
          background: #d1fae5;
        }
        &:nth-child(4) .stat-icon {
          background: #ede9fe;
        }
      }

      .welcome-card {
        background: #fff;
        border-radius: 12px;
        padding: 32px;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);

        h2 {
          margin: 0 0 8px;
          color: #1e293b;
        }

        p {
          color: #64748b;
          margin: 0;
          line-height: 1.6;
        }
      }

      .loading-state {
        text-align: center;
        padding: 48px;
        color: #64748b;
      }

      @media (max-width: 768px) {
        .layout {
          flex-direction: column;
        }

        .sidebar {
          width: 100%;
        }

        .stats-grid {
          grid-template-columns: 1fr 1fr;
        }

        .content {
          padding: 16px;
        }
      }
    `,
  ],
  template: `
    <div class="layout">
      <aside class="sidebar">
        <div class="sidebar-brand">MATHSHINE EDUCATION</div>
        <nav class="sidebar-nav">
          <a class="nav-item active" routerLink="/teacher/dashboard"
            >Tổng quan</a
          >
          <a class="nav-item" routerLink="/teacher/classes">Quản lý lớp</a>
          <a class="nav-item" routerLink="/teacher/groups">Quản lý nhóm</a>
          <a class="nav-item" routerLink="/teacher/students"
            >Quản lý học sinh</a
          >
          <a class="nav-item" routerLink="/teacher/assignments">Bài tập</a>
          <a class="nav-item" routerLink="/teacher/discussions">Thảo luận</a>
          <a class="nav-item" routerLink="/teacher/statistics">Thống kê</a>
          <a class="nav-item" routerLink="/teacher/profile">Hồ sơ</a>
          <teacher-notification-bell />
        </nav>
        <div class="sidebar-footer">
          <div class="user-info" style="display:flex;align-items:center;gap:10px;">
            @if (userAvatar) {
              <div style="width:36px;height:36px;border-radius:50%;overflow:hidden;background:#334155;flex-shrink:0;">
                <img [src]="userAvatar" alt="" style="width:100%;height:100%;object-fit:cover;" />
              </div>
            } @else {
              <div style="width:36px;height:36px;border-radius:50%;background:#334155;display:flex;align-items:center;justify-content:center;font-size:1rem;color:#94a3b8;flex-shrink:0;">
                {{ userFullName.charAt(0) || 'G' }}
              </div>
            }
            <div>
              <strong>{{ userFullName }}</strong>
              {{ userSubject }}
            </div>
          </div>
          <button class="logout-btn" (click)="logout()">Đăng xuất</button>
        </div>
      </aside>

      <main class="main">
        <div class="header">
          <h1>Tổng quan</h1>
          <p>Chào mừng trở lại, {{ userFullName }}</p>
        </div>

        <div class="content">
          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-icon">HS</div>
              <div class="stat-label">Tổng số học sinh</div>
              <div class="stat-value">{{ totalStudents }}</div>
            </div>
            <div class="stat-card">
              <div class="stat-icon">P</div>
              <div class="stat-label">Bài chờ chấm</div>
              <div class="stat-value">{{ pendingSubmissions }}</div>
            </div>
            <div class="stat-card">
              <div class="stat-icon">D</div>
              <div class="stat-label">Đã chấm hôm nay</div>
              <div class="stat-value">{{ gradedToday }}</div>
            </div>
            <div class="stat-card">
              <div class="stat-icon">TB</div>
              <div class="stat-label">Điểm trung bình</div>
              <div class="stat-value">{{ averageScore }}</div>
            </div>
          </div>

          <div class="welcome-card">
            <h2>Hệ thống MathShine Check</h2>
            <p>
              Quản lý lớp học, nhóm, học sinh, giao bài tập và chấm điểm trực
              tuyến một cách dễ dàng. Sử dụng thanh điều hướng bên trái để truy
              cập các chức năng.
            </p>
          </div>
        </div>
      </main>
    </div>
  `,
})
export class TeacherDashboardComponent implements OnInit {
  private firestoreService = inject(FirestoreService);
  private authService = inject(AuthService);
  private router = inject(Router);

  userFullName = '';
  userSubject = '';
  userAvatar = '';

  totalStudents = 0;
  pendingSubmissions = 0;
  gradedToday = 0;
  averageScore = 'N/A';

  ngOnInit(): void {
    const profile = this.authService.currentProfile;
    if (profile) {
      this.userFullName = profile.fullName;
      this.userSubject = profile.subject || '';
      if (profile.uid) {
        this.firestoreService.getDocById('teachers', profile.uid).then((doc) => {
          if (doc?.avatarUrl) this.userAvatar = doc.avatarUrl;
        }).catch(() => {});
      }
    }

    this.loadStats();
  }

  private loadStats(): void {
    this.firestoreService
      .getAllGroups()
      .pipe(
        switchMap((groups) => {
          if (groups.length === 0) return [];
          const studentObservables = groups.map((g) =>
            this.firestoreService.getStudentsByGroup(g.id),
          );
          return forkJoin(studentObservables).pipe(
            map((studentArrays) => {
              const allStudents = studentArrays.flat();
              const uniqueStudents = Array.from(
                new Map(allStudents.map((s) => [s.uid, s])).values(),
              );
              this.totalStudents = uniqueStudents.length;

              return groups;
            }),
          );
        }),
        switchMap(() => {
          return forkJoin([
            this.loadPendingSubmissions(),
            this.loadGradedToday(),
            this.loadAverageScore(),
          ]);
        }),
      )
      .subscribe({
        next: ([pending, graded, avg]) => {
          this.pendingSubmissions = pending;
          this.gradedToday = graded;
          this.averageScore = avg;
        },
      });
  }

  private loadPendingSubmissions(): Promise<number> {
    return new Promise((resolve) => {
      this.firestoreService
        .getAllGroups()
        .pipe(
          switchMap((groups) => {
            if (groups.length === 0) return [];
            const assignmentObservables = groups.map((g) =>
              this.firestoreService.getAssignmentsByGroup(g.id),
            );
            return forkJoin(assignmentObservables);
          }),
          switchMap((assignmentArrays) => {
            const allAssignments = assignmentArrays.flat();
            if (allAssignments.length === 0) return [];
            const submissionObservables = allAssignments.map((a) =>
              this.firestoreService.getSubmissionsByAssignment(a.id),
            );
            return forkJoin(submissionObservables);
          }),
        )
        .subscribe((submissionArrays) => {
          const allSubmissions = submissionArrays.flat();
          const pending = allSubmissions.filter(
            (s) => s.status === 'submitted',
          ).length;
          resolve(pending);
        });
    });
  }

  private loadGradedToday(): Promise<number> {
    return new Promise((resolve) => {
      this.firestoreService
        .getAllGroups()
        .pipe(
          switchMap((groups) => {
            if (groups.length === 0) return [];
            const assignmentObservables = groups.map((g) =>
              this.firestoreService.getAssignmentsByGroup(g.id),
            );
            return forkJoin(assignmentObservables);
          }),
          switchMap((assignmentArrays) => {
            const allAssignments = assignmentArrays.flat();
            if (allAssignments.length === 0) return [];
            const gradeObservables = allAssignments.map((a) =>
              this.firestoreService.getGradesByAssignment(a.id),
            );
            return forkJoin(gradeObservables);
          }),
        )
        .subscribe((gradeArrays) => {
          const allGrades = gradeArrays.flat();
          const today = new Date().toISOString().split('T')[0];
          const graded = allGrades.filter(
            (g) => g.gradedAt && g.gradedAt.startsWith(today),
          ).length;
          resolve(graded);
        });
    });
  }

  private loadAverageScore(): Promise<string> {
    return new Promise((resolve) => {
      this.firestoreService
        .getAllGroups()
        .pipe(
          switchMap((groups) => {
            if (groups.length === 0) return [];
            const assignmentObservables = groups.map((g) =>
              this.firestoreService.getAssignmentsByGroup(g.id),
            );
            return forkJoin(assignmentObservables);
          }),
          switchMap((assignmentArrays) => {
            const allAssignments = assignmentArrays.flat();
            if (allAssignments.length === 0) return [];
            const gradeObservables = allAssignments.map((a) =>
              this.firestoreService.getGradesByAssignment(a.id),
            );
            return forkJoin(gradeObservables);
          }),
        )
        .subscribe((gradeArrays) => {
          const allGrades = gradeArrays.flat();
          if (allGrades.length === 0) {
            resolve('N/A');
          } else {
            const avg =
              allGrades.reduce((sum, g) => sum + (g.scoreValue || 0), 0) /
              allGrades.length;
            resolve(avg.toFixed(1));
          }
        });
    });
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/role-select']);
  }
}
