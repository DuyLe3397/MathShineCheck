import { Routes } from '@angular/router';
import { AuthGuard } from './guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'role-select'
  },
  {
    path: 'role-select',
    loadComponent: () => import('./pages/auth/role-select.component').then(m => m.RoleSelectComponent)
  },
  {
    path: 'auth/teacher/login',
    loadComponent: () => import('./pages/auth/teacher-login.component').then(m => m.TeacherLoginComponent)
  },
  {
    path: 'auth/student/login',
    loadComponent: () => import('./pages/auth/student-login.component').then(m => m.StudentLoginComponent)
  },
  {
    path: 'privacy-policy',
    loadComponent: () => import('./pages/auth/legal-pages.component').then(m => m.LegalPagesComponent)
  },
  {
    path: 'terms-of-service',
    loadComponent: () => import('./pages/auth/legal-pages.component').then(m => m.LegalPagesComponent)
  },
  {
    path: 'acceptable-use-policy',
    loadComponent: () => import('./pages/auth/legal-pages.component').then(m => m.LegalPagesComponent)
  },
  {
    path: 'contact',
    loadComponent: () => import('./pages/auth/legal-pages.component').then(m => m.LegalPagesComponent)
  },
  {
    path: 'teacher',
    canActivate: [AuthGuard],
    data: { role: 'teacher' },
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () => import('./pages/teacher/dashboard.component').then(m => m.TeacherDashboardComponent)
      },
      {
        path: 'classes',
        loadComponent: () => import('./pages/teacher/class-management.component').then(m => m.ClassManagementComponent)
      },
      {
        path: 'groups',
        loadComponent: () => import('./pages/teacher/group-management.component').then(m => m.GroupManagementComponent)
      },
      {
        path: 'students',
        loadComponent: () => import('./pages/teacher/student-management.component').then(m => m.StudentManagementComponent)
      },
      {
        path: 'assignments',
        loadComponent: () => import('./pages/teacher/assignment-management.component').then(m => m.AssignmentManagementComponent)
      },
      {
        path: 'assignments/:id',
        loadComponent: () => import('./pages/teacher/assignment-detail.component').then(m => m.AssignmentDetailComponent)
      },
      {
        path: 'grade/:submissionId',
        loadComponent: () => import('./pages/teacher/grading.component').then(m => m.GradingComponent)
      },
      {
        path: 'profile',
        loadComponent: () => import('./pages/profile/profile.component').then(m => m.ProfileComponent)
      },
      {
        path: 'discussions',
        loadComponent: () => import('./pages/teacher/discussions.component').then(m => m.TeacherDiscussionsComponent)
      },
      {
        path: 'statistics',
        loadComponent: () => import('./pages/teacher/statistics.component').then(m => m.StatisticsComponent)
      }
    ]
  },
  {
    path: 'student',
    canActivate: [AuthGuard],
    data: { role: 'student' },
    children: [
      { path: '', redirectTo: 'home', pathMatch: 'full' },
      {
        path: 'home',
        loadComponent: () => import('./pages/student/home.component').then(m => m.StudentHomeComponent)
      },
      {
        path: 'submit/:assignmentId',
        loadComponent: () => import('./pages/student/submit.component').then(m => m.SubmitComponent)
      },
      {
        path: 'peers/:assignmentId',
        loadComponent: () => import('./pages/student/peers.component').then(m => m.PeersComponent)
      },
      {
        path: 'results/:submissionId',
        loadComponent: () => import('./pages/student/results.component').then(m => m.ResultsComponent)
      },
      {
        path: 'scoreboard',
        loadComponent: () => import('./pages/student/scoreboard.component').then(m => m.ScoreboardComponent)
      },
      {
        path: 'discussions',
        loadComponent: () => import('./pages/student/discussions.component').then(m => m.DiscussionsComponent)
      },
      {
        path: 'permissions',
        loadComponent: () => import('./pages/student/permissions.component').then(m => m.PermissionsComponent)
      },
      {
        path: 'profile',
        loadComponent: () => import('./pages/profile/profile.component').then(m => m.ProfileComponent)
      }
    ]
  },
  {
    path: '**',
    loadComponent: () => import('./pages/auth/role-select.component').then(m => m.RoleSelectComponent)
  }
];
