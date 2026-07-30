import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-teacher-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  styles: [`
    .teacher-auth {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #f5f7fa;
      padding: 2rem;
    }

    .auth-card {
      width: 100%;
      max-width: 420px;
      background: #fff;
      border-radius: 20px;
      padding: 2.5rem 2rem;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    }

    .back-link {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      color: #667eea;
      text-decoration: none;
      font-size: 0.9rem;
      font-weight: 500;
      margin-bottom: 1.5rem;

      &:hover {
        text-decoration: underline;
      }
    }

    .auth-title {
      font-size: 1.8rem;
      font-weight: 700;
      color: #333;
      margin: 0 0 0.3rem;
      text-align: center;
    }

    .auth-subtitle {
      font-size: 0.9rem;
      color: #888;
      text-align: center;
      margin: 0 0 2rem;
    }

    .form-group {
      margin-bottom: 1.2rem;
    }

    .form-label {
      display: block;
      font-size: 0.85rem;
      font-weight: 600;
      color: #444;
      margin-bottom: 0.4rem;
    }

    .form-input {
      width: 100%;
      padding: 0.75rem 1rem;
      border: 2px solid #e0e0e0;
      border-radius: 10px;
      font-size: 1rem;
      color: #333;
      transition: border-color 0.2s ease;
      box-sizing: border-box;
      outline: none;

      &:focus {
        border-color: #667eea;
      }

      &.ng-invalid.ng-touched {
        border-color: #e74c3c;
      }
    }

    .submit-btn {
      width: 100%;
      padding: 0.85rem;
      background: #2563eb;
      color: #fff;
      border: none;
      border-radius: 10px;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.2s;
      margin-top: 0.5rem;

      &:hover {
        opacity: 0.9;
      }

      &:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }
    }

    .error-message {
      background: #fdeaea;
      color: #c0392b;
      padding: 0.75rem 1rem;
      border-radius: 10px;
      font-size: 0.85rem;
      margin-bottom: 1rem;
      text-align: center;
    }
  `],
  template: `
    <div class="teacher-auth">
      <div class="auth-card">
        <a class="back-link" routerLink="/role-select">
          ← Quay lại
        </a>

        <h2 class="auth-title">Giáo viên</h2>
        <p class="auth-subtitle">Đăng nhập vào hệ thống</p>

        <div class="error-message" *ngIf="errorMessage">{{ errorMessage }}</div>

        <form #authForm="ngForm" (ngSubmit)="onSubmit()">
          <div class="form-group">
            <label class="form-label" for="email">Email</label>
            <input
              class="form-input"
              id="email"
              name="email"
              type="email"
              placeholder="Nhập địa chỉ email"
              [(ngModel)]="email"
              required
              email
              #emailField="ngModel"
            />
          </div>

          <div class="form-group">
            <label class="form-label" for="password">Mật khẩu</label>
            <input
              class="form-input"
              id="password"
              name="password"
              type="password"
              placeholder="Nhập mật khẩu"
              [(ngModel)]="password"
              required
              minlength="6"
              #passwordField="ngModel"
            />
          </div>

          <button
            class="submit-btn"
            type="submit"
            [disabled]="authForm.invalid || loading"
          >
            {{ loading ? 'Đang xử lý...' : 'Đăng nhập' }}
          </button>
        </form>
      </div>
    </div>
  `
})
export class TeacherLoginComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  loading = false;
  errorMessage = '';

  email = '';
  password = '';

  async onSubmit(): Promise<void> {
    this.errorMessage = '';
    this.loading = true;

    try {
      await this.authService.loginAsTeacher(this.email, this.password);
      this.router.navigate(['/teacher/dashboard']);
    } catch (error: any) {
      this.errorMessage = this.getErrorMessage(error);
    } finally {
      this.loading = false;
    }
  }

  private getErrorMessage(error: any): string {
    const code = error?.code;
    switch (code) {
      case 'auth/user-not-found':
        return 'Email không tồn tại trong hệ thống';
      case 'auth/wrong-password':
        return 'Mật khẩu không chính xác';
      case 'auth/invalid-credential':
        return 'Email hoặc mật khẩu không chính xác';
      case 'auth/invalid-email':
        return 'Email không hợp lệ';
      case 'auth/network-request-failed':
        return 'Lỗi kết nối mạng. Vui lòng thử lại';
      default:
        return error?.message || 'Có lỗi xảy ra. Vui lòng thử lại';
    }
  }
}
