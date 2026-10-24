import { Injectable, inject } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { filter, map, take, of } from 'rxjs';

const TEACHER_RETURN_URL_KEY = 'teacherReturnUrl';

/** Nhớ trang giáo viên đang muốn mở (vd. link trong Email thông báo) khi chưa đăng nhập. */
export function rememberTeacherReturnUrl(url: string): void {
  try {
    sessionStorage.setItem(TEACHER_RETURN_URL_KEY, url);
  } catch {}
}

/** Lấy (và xóa) trang giáo viên đã nhớ; chỉ nhận đường dẫn trong /teacher/. */
export function takeTeacherReturnUrl(): string | null {
  try {
    const url = sessionStorage.getItem(TEACHER_RETURN_URL_KEY);
    sessionStorage.removeItem(TEACHER_RETURN_URL_KEY);
    return url && url.startsWith('/teacher/') ? url : null;
  } catch {
    return null;
  }
}

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {
  private authService = inject(AuthService);
  private router = inject(Router);

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
    const requiredRole = route.data['role'] as string;
    const profile = this.authService.currentProfile;

    if (profile) {
      return this.checkRole(profile, requiredRole);
    }

    return this.authService.profileDone$.pipe(
      filter(done => done),
      take(1),
      map(() => {
        const p = this.authService.currentProfile;
        if (!p) {
          if (requiredRole === 'teacher') rememberTeacherReturnUrl(state.url);
          this.router.navigate(['/role-select']);
          return false;
        }
        return this.checkRoleValue(p, requiredRole);
      })
    );
  }

  private checkRole(profile: any, requiredRole: string) {
    if (!requiredRole || profile.role === requiredRole) {
      return of(true);
    }
    this.redirectByRole(profile.role);
    return of(false);
  }

  private checkRoleValue(profile: any, requiredRole: string): boolean {
    if (!requiredRole || profile.role === requiredRole) {
      return true;
    }
    this.redirectByRole(profile.role);
    return false;
  }

  private redirectByRole(role: string): void {
    if (role === 'teacher') {
      this.router.navigate(['/teacher/dashboard']);
    } else if (role === 'student') {
      this.router.navigate(['/student/home']);
    } else {
      this.router.navigate(['/role-select']);
    }
  }
}
