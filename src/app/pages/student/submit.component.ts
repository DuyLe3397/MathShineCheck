import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { FirestoreService } from '../../services/firestore.service';
import { ImageService } from '../../services/image.service';
import { Assignment } from '../../models';

interface ImageFile {
  file: File;
  preview: string;
  progress: number;
  uploaded: boolean;
  error: boolean;
}

@Component({
  selector: 'app-submit',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
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
        padding: 1rem;
        display: flex;
        align-items: center;
        gap: 0.75rem;
      }

      .back-btn {
        background: none;
        border: none;
        color: #fff;
        font-size: 1.3rem;
        cursor: pointer;
        padding: 0;
        line-height: 1;
      }

      .page-header h2 {
        margin: 0;
        font-size: 1.15rem;
        font-weight: 600;
      }

      .container {
        padding: 1rem;
      }

      .assignment-info-card {
        background: #fff;
        border-radius: 12px;
        padding: 1rem;
        margin-bottom: 1rem;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
      }

      .assignment-info-card h3 {
        margin: 0 0 0.5rem;
        font-size: 1.1rem;
        color: #1e293b;
      }

      .assignment-info-card .desc {
        color: #64748b;
        font-size: 0.9rem;
        margin: 0;
        white-space: pre-wrap;
        word-break: break-word;
      }

      .assignment-info-card .date {
        font-size: 0.8rem;
        color: #94a3b8;
        margin-top: 0.5rem;
      }

      .upload-section {
        margin-bottom: 1rem;
      }

      .upload-section h3 {
        font-size: 1rem;
        color: #1e293b;
        margin: 0 0 0.75rem;
      }

      .image-preview-list {
        display: flex;
        flex-wrap: wrap;
        gap: 0.75rem;
        margin-bottom: 0.75rem;
      }

      .image-preview-item {
        width: 90px;
        height: 90px;
        border-radius: 10px;
        overflow: hidden;
        position: relative;
        border: 2px solid #e2e8f0;
        background: #f8fafc;
      }

      .image-preview-item img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      .remove-btn {
        position: absolute;
        top: 2px;
        right: 2px;
        width: 22px;
        height: 22px;
        border-radius: 50%;
        background: rgba(0, 0, 0, 0.55);
        color: #fff;
        border: none;
        font-size: 0.75rem;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        line-height: 1;
      }

      .progress-bar {
        height: 4px;
        background: #e2e8f0;
        border-radius: 2px;
        margin-top: 4px;
        overflow: hidden;
      }

      .progress-fill {
        height: 100%;
        background: #2563eb;
        transition: width 0.3s;
      }

      .progress-fill.done {
        background: #16a34a;
      }

      .progress-fill.error {
        background: #dc2626;
      }

      .upload-label {
        display: inline-flex;
        align-items: center;
        gap: 0.4rem;
        padding: 0.5rem 1rem;
        border: 2px dashed #cbd5e1;
        border-radius: 10px;
        color: #64748b;
        cursor: pointer;
        font-size: 0.85rem;
        transition: all 0.2s;
      }

      .upload-label:hover {
        border-color: #2563eb;
        color: #2563eb;
      }

      .file-input {
        display: none;
      }

      .submit-bar {
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        padding: 0.75rem 1rem 1.25rem;
        background: #fff;
        box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.06);
      }

      .submit-btn {
        width: 100%;
        padding: 0.85rem;
        border: none;
        border-radius: 12px;
        background: #2563eb;
        color: #fff;
        font-size: 1rem;
        font-weight: 700;
        cursor: pointer;
        transition: background 0.2s;
      }

      .submit-btn:disabled {
        background: #94a3b8;
        cursor: not-allowed;
      }

      .submit-btn:hover:not(:disabled) {
        background: #1d4ed8;
      }

      .error-msg {
        color: #dc2626;
        font-size: 0.85rem;
        margin-top: 0.5rem;
        text-align: center;
      }
    `,
  ],
  template: `
    <div class="page-header">
      <button class="back-btn" (click)="goBack()">←</button>
      <h2>
        Nộp bài tập{{
          attemptNumber() > 1 ? ' (Lần ' + attemptNumber() + ')' : ''
        }}
      </h2>
    </div>

    <div class="container">
      @if (assignment()) {
        <div class="assignment-info-card">
          <h3>{{ assignment()?.title }}</h3>
          @if (assignment()?.description) {
            <p class="desc">{{ assignment()?.description }}</p>
          }
          <div class="date">
            Ngày học: {{ assignment()?.sessionDate | date: 'dd/MM/yyyy' }}
          </div>
        </div>
      }

      <div class="upload-section">
        <h3>Ảnh bài làm</h3>

        <div class="image-preview-list">
          @for (img of images(); track img.file.name + $index; let i = $index) {
            <div>
              <div class="image-preview-item">
                <img [src]="img.preview" alt="preview" />
                <button class="remove-btn" (click)="removeImage(i)">×</button>
              </div>
              <div class="progress-bar">
                <div
                  class="progress-fill"
                  [class.done]="img.uploaded"
                  [class.error]="img.error"
                  [style.width.%]="img.progress"
                ></div>
              </div>
            </div>
          }
        </div>

        <label class="upload-label">
          + Thêm ảnh
          <input
            #fileInput
            type="file"
            class="file-input"
            accept="image/*"
            multiple
            (change)="onFilesSelected(fileInput)"
          />
        </label>
      </div>
    </div>

    <div class="submit-bar">
      <button
        class="submit-btn"
        [disabled]="submitting() || images().length === 0"
        (click)="submit()"
      >
        @if (submitting()) {
          Đang nộp...
        } @else {
          Nộp bài
        }
      </button>
      @if (errorMsg()) {
        <div class="error-msg">{{ errorMsg() }}</div>
      }
    </div>
  `,
})
export class SubmitComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private authService = inject(AuthService);
  private firestoreService = inject(FirestoreService);
  private imageService = inject(ImageService);

  assignment = signal<Assignment | null>(null);
  attemptNumber = signal(1);
  images = signal<ImageFile[]>([]);
  submitting = signal(false);
  errorMsg = signal('');

  ngOnInit(): void {
    const assignmentId = this.route.snapshot.paramMap.get('assignmentId');
    if (!assignmentId) {
      this.router.navigate(['/student/home']);
      return;
    }

    const attemptParam = this.route.snapshot.queryParamMap.get('attempt');
    if (attemptParam) this.attemptNumber.set(Number(attemptParam));

    this.firestoreService
      .getAssignmentsByGroup(this.authService.currentProfile?.groupId || '')
      .subscribe((assignments) => {
        const found = assignments.find((a) => a.id === assignmentId);
        if (found) this.assignment.set(found);
      });
  }

  onFilesSelected(input: HTMLInputElement): void {
    const files = input.files;
    if (!files) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file.type.startsWith('image/')) continue;

      const reader = new FileReader();
      reader.onload = () => {
        this.images.update((current) => [
          ...current,
          {
            file,
            preview: reader.result as string,
            progress: 0,
            uploaded: false,
            error: false,
          },
        ]);
      };
      reader.readAsDataURL(file);
    }

    input.value = '';
  }

  removeImage(index: number): void {
    this.images.update((current) => current.filter((_, i) => i !== index));
  }

  async submit(): Promise<void> {
    const profile = this.authService.currentProfile;
    const assignmentId = this.route.snapshot.paramMap.get('assignmentId');
    if (!profile || !assignmentId) return;

    this.submitting.set(true);
    this.errorMsg.set('');

    const imageList = this.images();

    try {
      const imageIds: string[] = [];
      for (let i = 0; i < imageList.length; i++) {
        const img = imageList[i];

        this.images.update((current) => {
          const updated = [...current];
          updated[i] = { ...updated[i], progress: 30 };
          return updated;
        });

        const compressed = await this.imageService.compressImage(img.file);

        this.images.update((current) => {
          const updated = [...current];
          updated[i] = { ...updated[i], progress: 70 };
          return updated;
        });

        const imageId = await this.retry(() =>
          this.imageService.saveSubmissionImage('', profile.uid, compressed, i),
        );
        imageIds.push(imageId);

        this.images.update((current) => {
          const updated = [...current];
          updated[i] = { ...updated[i], progress: 100, uploaded: true };
          return updated;
        });
      }

      await this.retry(() =>
        this.firestoreService.createSubmission({
          assignmentId,
          studentId: profile.uid,
          imageIds,
          attemptNumber: this.attemptNumber(),
          status: 'submitted',
        }),
      );

      this.router.navigate(['/student/home']);
    } catch (err: any) {
      const msg = err?.message || '';
      if (/size|limit|large/i.test(msg)) {
        this.errorMsg.set(
          'Ảnh quá lớn, hệ thống không lưu được. Vui lòng thử lại với ảnh khác.',
        );
      } else if (/network|unavailable|offline|internet|temporal/i.test(msg)) {
        this.errorMsg.set(
          'Mất kết nối mạng. Vui lòng kiểm tra Wifi/4G và thử lại.',
        );
      } else {
        this.errorMsg.set('Có lỗi xảy ra khi nộp bài. Vui lòng thử lại.');
      }
      this.submitting.set(false);
    }
  }

  private async retry<T>(fn: () => Promise<T>, attempts = 2): Promise<T> {
    let lastErr: any;
    for (let i = 0; i < attempts; i++) {
      try {
        return await fn();
      } catch (err) {
        lastErr = err;
        if (i < attempts - 1) {
          await new Promise((r) => setTimeout(r, 1500));
        }
      }
    }
    throw lastErr;
  }

  goBack(): void {
    this.router.navigate(['/student/home']);
  }
}
