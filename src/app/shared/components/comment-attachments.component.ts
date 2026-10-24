import { Component, Input, OnChanges, inject, signal } from '@angular/core';
import { ImageService } from '../../services/image.service';
import { AttachmentLightboxComponent } from './attachment-lightbox.component';
import { AttachmentRatioDirective } from '../attachment-ratio.directive';
import { MathTextComponent } from '../math/math-text.component';

/**
 * Hiển thị Ảnh đính kèm của một Nhận xét theo ảnh: 1 ảnh cả hàng, 2 ảnh chia đôi, 3 ảnh chia ba
 * (trọn ảnh, không cắt), "Hình N: ghi chú" phía dưới;
 * bấm vào thì phóng to và lật qua lại giữa các hình (xem AttachmentLightboxComponent).
 */
@Component({
  selector: 'comment-attachments',
  standalone: true,
  imports: [AttachmentLightboxComponent, AttachmentRatioDirective, MathTextComponent],
  styles: [
    `
      /* Số cột theo số ảnh: 1 ảnh cả hàng (cao tối đa 480px), 2 ảnh chia đôi (360px),
         3 ảnh chia ba (240px). */
      .att-grid {
        --att-cols: 3;
        --att-max-h: 240px;
        container-type: inline-size;
        display: grid;
        grid-template-columns: repeat(var(--att-cols), minmax(0, 1fr));
        align-items: start;
        gap: 0.5rem;
        margin-top: 0.4rem;
      }
      .att-grid.n1 {
        --att-cols: 1;
        --att-max-h: 480px;
      }
      .att-grid.n2 {
        --att-cols: 2;
        --att-max-h: 360px;
      }
      /* Điện thoại dựng dọc: mỗi ảnh một hàng, rộng hết khung. Xoay ngang thì như máy tính. */
      @media (orientation: portrait) and (max-width: 599px) {
        .att-grid,
        .att-grid.n1,
        .att-grid.n2 {
          --att-cols: 1;
          --att-max-h: 480px;
        }
      }
      /* Trọn ảnh, đúng tỉ lệ: rộng vừa ô nhưng không cao quá --att-max-h
         (--att-ratio do AttachmentRatioDirective đặt khi ảnh tải xong; 14px = viền + đệm của khung ô). */
      .att-img {
        width: min(
          calc((100cqw - (var(--att-cols) - 1) * 0.5rem) / var(--att-cols) - 14px),
          calc(var(--att-max-h) * var(--att-ratio, 100))
        );
        height: auto;
      }
      /* Viền xám bao ảnh + "Hình N: ghi chú" để biết ghi chú thuộc ảnh nào. */
      .att-item {
        margin: 0;
        min-width: 0;
        border: 2px solid #cbd5e1;
        border-radius: 10px;
        padding: 5px;
        box-sizing: border-box;
        transition: border-color 0.2s;
      }
      .att-item.viewed {
        border-color: #2563eb;
      }
      .att-item.viewed .att-num {
        color: #2563eb;
      }
      .att-item img {
        border-radius: 8px;
        border: 1px solid #e2e8f0;
        display: block;
        cursor: zoom-in;
        background: #f8fafc;
      }
      .att-placeholder {
        width: 100%;
        aspect-ratio: 4 / 3;
        border-radius: 8px;
        background: #f1f5f9;
      }
      .att-item figcaption {
        font-size: 0.875rem;
        color: #475569;
        margin-top: 3px;
        word-break: break-word;
      }
      .att-note {
        white-space: pre-wrap;
        color: #334155;
      }
      /* "Hình N" chỉ là số thứ tự: nhỏ và nhạt hơn ghi chú. */
      .att-num {
        font-size: 11px;
        font-weight: 700;
        color: #94a3b8;
      }
    `,
  ],
  template: `
    @if (urls().length) {
      <div
        class="att-grid"
        [class.n1]="urls().length === 1"
        [class.n2]="urls().length === 2"
        (click)="$event.stopPropagation()"
      >
        @for (u of urls(); track $index) {
          <figure class="att-item" [class.viewed]="u && imageService.activeAttachmentUrl() === u">
            @if (u) {
              <img [src]="u" alt="" class="att-img" attRatio (click)="openImage($index)" />
            } @else {
              <div class="att-placeholder"></div>
            }
            <figcaption>
              <b class="att-num">Hình {{ $index + 1 }}</b>@if (noteAt($index)) {: <span class="att-note"><math-text [text]="noteAt($index)" /></span>}
            </figcaption>
          </figure>
        }
      </div>
    }
    <attachment-lightbox
      [urls]="urls()"
      [notes]="imageNotes || []"
      [index]="openIndex()"
      (indexChange)="onIndexChange($event)"
    />
  `,
})
export class CommentAttachmentsComponent implements OnChanges {
  imageService = inject(ImageService);

  @Input() imageIds?: string[];
  /** Ghi chú ảnh, song song theo vị trí với imageIds. */
  @Input() imageNotes?: string[];
  /** Ảnh của bình luận cũ (lưu thẳng base64), hiển thị như Hình 1. */
  @Input() legacyUrl?: string;

  urls = signal<string[]>([]);
  openIndex = signal<number | null>(null);
  private loadToken = 0;

  openImage(idx: number): void {
    this.openIndex.set(idx);
    const u = this.urls()[idx];
    if (u) this.imageService.activeAttachmentUrl.set(u);
  }

  onIndexChange(val: number | null): void {
    this.openIndex.set(val);
    if (val !== null) {
      const u = this.urls()[val];
      if (u) this.imageService.activeAttachmentUrl.set(u);
    }
  }

  ngOnChanges(): void {
    const ids = this.imageIds || [];
    const token = ++this.loadToken;
    if (!ids.length) {
      this.urls.set(this.legacyUrl ? [this.legacyUrl] : []);
      return;
    }
    this.urls.set(ids.map(() => ''));
    ids.forEach((id, i) =>
      this.imageService.getCommentImage(id).then((url) => {
        if (token !== this.loadToken || !url) return;
        this.urls.update((list) => list.map((u, idx) => (idx === i ? url : u)));
      }),
    );
  }

  noteAt(i: number): string {
    return this.imageNotes?.[i] || '';
  }
}
