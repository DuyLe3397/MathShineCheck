import { Injectable, inject } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { filter, map, take, of } from 'rxjs';

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
