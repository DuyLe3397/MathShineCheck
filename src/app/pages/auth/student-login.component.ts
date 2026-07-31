import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { FirestoreService } from '../../services/firestore.service';
import { SchoolClass, Group } from '../../models';

@Component({
  selector: 'app-student-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  styles: [
    `
      .auth-wrap {
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        background: #f5f7fa;
        padding: 2rem;
      }
      .card {
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
      }
      .back-link:hover {
        text-decoration: underline;
      }
      h2 {
        font-size: 1.8rem;
        font-weight: 700;
        color: #333;
        margin: 0 0 0.3rem;
        text-align: center;
      }
      .sub {
        font-size: 0.9rem;
        color: #888;
        text-align: center;
        margin: 0 0 2rem;
      }
      .form-group {
        margin-bottom: 1.2rem;
      }
      label {
        display: block;
        font-size: 0.85rem;
        font-weight: 600;
        color: #444;
        margin-bottom: 0.4rem;
      }
      select,
      input {
        width: 100%;
        padding: 0.75rem 1rem;
        border: 2px solid #e0e0e0;
        border-radius: 10px;
        font-size: 1rem;
        color: #333;
        outline: none;
        box-sizing: border-box;
        background: #fff;
      }
      select:focus,
      input:focus {
        border-color: #667eea;
      }
      select {
        appearance: none;
        background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23666' d='M6 8L1 3h10z'/%3E%3C/svg%3E");
        background-repeat: no-repeat;
        background-position: right 1rem center;
        cursor: pointer;
      }
      .btn {
        width: 100%;
        padding: 0.85rem;
        background: #2563eb;
        color: #fff;
        border: none;
        border-radius: 10px;
        font-size: 1rem;
        font-weight: 600;
        cursor: pointer;
        margin-top: 0.5rem;
      }
      .btn:hover {
        opacity: 0.9;
      }
      .btn:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }
      .error {
        background: #fdeaea;
        color: #c0392b;
        padding: 0.75rem 1rem;
        border-radius: 10px;
        font-size: 0.85rem;
        margin-bottom: 1rem;
        text-align: center;
      }
    `,
  ],
  template: `
    <div class="auth-wrap">
      <div class="card">
        <a class="back-link" routerLink="/role-select">← Quay lại</a>
        <h2>Học sinh</h2>
        <p class="sub">Vào hệ thống xem bài tập</p>
        <div class="error" *ngIf="errorMessage">{{ errorMessage }}</div>
        <form #form="ngForm" (ngSubmit)="onSubmit()">
          <div class="form-group">
            <label for="fullName">Họ tên</label>
            <input
              id="fullName"
              name="fullName"
              type="text"
              placeholder="Nhập họ tên đầy đủ"
              [(ngModel)]="fullName"
              (ngModelChange)="fullName = $event.toUpperCase()"
              required
            />
          </div>
          <div class="form-group">
            <label for="phone">Số điện thoại</label>
            <input
              id="phone"
              name="phone"
              type="tel"
              placeholder="Nhập số điện thoại"
              [(ngModel)]="phone"
              (keypress)="onPhoneKeyPress($event)"
              required
            />
          </div>
          <div class="form-group">
            <label for="className">Lớp</label>
            <select
              id="className"
              name="className"
              [(ngModel)]="className"
              required
              (ngModelChange)="onClassChange()"
            >
              <option value="" disabled selected>Chọn lớp</option>
              <option *ngFor="let c of classes" [value]="c.name">
                {{ c.name }}
              </option>
            </select>
          </div>
          <div class="form-group">
            <label for="groupId">Nhóm</label>
            <select id="groupId" name="groupId" [(ngModel)]="groupId" required>
              <option value="" disabled selected>
                {{ groups.length === 0 ? 'Chọn lớp trước' : 'Chọn nhóm' }}
              </option>
              <option *ngFor="let g of groups" [value]="g.id">
                {{ g.name }}
              </option>
            </select>
          </div>
          <button
            class="btn"
            type="submit"
            [disabled]="form.invalid || loading"
          >
            {{ loading ? 'Đang xử lý...' : 'Vào hệ thống' }}
          </button>
        </form>
      </div>
    </div>
  `,
})
export class StudentLoginComponent implements OnInit {
  private authService = inject(AuthService);
  private firestoreService = inject(FirestoreService);
  private router = inject(Router);

  classes: SchoolClass[] = [];
  groups: Group[] = [];
  fullName = '';
  phone = '';
  className = '';
  groupId = '';
  loading = false;
  errorMessage = '';

  ngOnInit(): void {
    this.firestoreService
      .getClasses('server')
      .subscribe((classes) => (this.classes = classes));
  }

  onPhoneKeyPress(event: KeyboardEvent): void {
    const char = event.key;
    if (
      !/^[0-9]$/.test(char) &&
      char !== 'Backspace' &&
      char !== 'Delete' &&
      char !== 'Tab' &&
      char !== 'ArrowLeft' &&
      char !== 'ArrowRight'
    ) {
      event.preventDefault();
    }
  }

  onClassChange(): void {
    this.groupId = '';
    this.groups = [];
    if (!this.className) return;
    const cls = this.classes.find((c) => c.name === this.className);
    if (cls)
      this.firestoreService
        .getGroupsByClass(cls.id, 'server')
        .subscribe((groups) => (this.groups = groups));
  }

  onSubmit(): void {
    this.errorMessage = '';
    this.loading = true;
    this.authService
      .getStudentByInfo(this.fullName, this.className, this.groupId, this.phone)
      .subscribe({
        next: (student) => {
          this.loading = false;
          if (student) {
            this.authService.loginStudentAsGuest(student);
            this.router.navigate(['/student/home']);
          } else {
            this.errorMessage =
              'Không tìm thấy học sinh. Kiểm tra lại Họ tên, SĐT, Lớp và Nhóm.';
          }
        },
        error: () => {
          this.loading = false;
          this.errorMessage = 'Lỗi kết nối. Vui lòng thử lại.';
        },
      });
  }
}
