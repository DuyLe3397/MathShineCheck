import { Component, OnInit, inject } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-role-select',
  standalone: true,
  imports: [RouterModule],
  styles: [
    `
      :host {
        display: block;
        min-height: 100vh;
        background: #f1f5f9;
      }

      .top-bar {
        background: linear-gradient(90deg, #1e3a8a 0%, #312e81 100%);
        padding: 12px 24px;
        display: flex;
        align-items: center;
        justify-content: flex-start;
      }

      .top-bar-logo {
        height: 48px;
        width: auto;
        display: block;
      }

      .page-content {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 4rem 2rem 2rem;
        min-height: calc(100vh - 68px);
      }

      .app-title {
        font-size: 2.25rem;
        font-weight: 800;
        color: #1e3a8a;
        margin: 0 0 0.5rem;
        text-align: center;
      }

      .app-subtitle {
        font-size: 1.05rem;
        color: #64748b;
        margin: 0 0 2.5rem;
        text-align: center;
      }

      .prompt-text {
        font-size: 1.05rem;
        font-weight: 600;
        color: #1e293b;
        margin: 0 0 1.5rem;
      }

      .button-group {
        display: flex;
        flex-direction: column;
        gap: 1rem;
        width: 100%;
        max-width: 400px;
      }

      .role-btn {
        display: block;
        width: 100%;
        padding: 1rem 1.5rem;
        border: none;
        border-radius: 10px;
        color: #fff;
        font-size: 1.05rem;
        font-weight: 700;
        text-align: center;
        text-decoration: none;
        cursor: pointer;
        transition: all 0.2s ease;
        box-sizing: border-box;
      }

      .role-btn.teacher {
        background: #ef4444;

        &:hover {
          background: #dc2626;
        }
      }

      .role-btn.student {
        background: #1e3a8a;

        &:hover {
          background: #1e2f6e;
        }
      }

      .page-footer {
        margin-top: 3rem;
        font-size: 0.85rem;
        color: #94a3b8;
        text-align: center;
      }
    `,
  ],
  template: `
    <div class="top-bar">
      <div class="top-bar-logo"></div>
    </div>

    <div class="page-content">
      <h1 class="app-title">MathShine Education</h1>
      <p class="app-subtitle">Hệ thống nộp &amp; chấm điểm BTVN</p>

      <p class="prompt-text">Vui lòng chọn:</p>

      <div class="button-group">
        <a class="role-btn teacher" routerLink="/auth/teacher/login">
          Tôi là Giáo viên
        </a>
        <a class="role-btn student" routerLink="/auth/student/login">
          Tôi là Phụ huynh / Học sinh
        </a>
      </div>
      <footer class="page-footer">
        <div>© 2026 MathShine Education. All rights reserved.</div>

        <div>
          <a href="/privacy-policy">Privacy Policy</a> |
          <a href="/terms-of-service">Terms of Service</a> |
          <a href="/acceptable-use-policy">Acceptable Use Policy</a> |
          <a href="/contact">Contact</a>
        </div>

        <div>Founded &amp; Developed by Duy Le</div>
      </footer>
    </div>
  `,
})
export class RoleSelectComponent implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);

  ngOnInit(): void {
    const profile = this.authService.currentProfile;
    if (profile?.role === 'teacher') {
      this.router.navigate(['/teacher/dashboard']);
    } else if (profile?.role === 'student') {
      this.router.navigate(['/student/home']);
    }
  }
}
