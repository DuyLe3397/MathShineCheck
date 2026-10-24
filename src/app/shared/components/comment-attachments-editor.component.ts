import {
  Component,
  ElementRef,
  OnDestroy,
  computed,
  inject,
  model,
  signal,
} from '@angular/core';
import {
  AttachmentDraft,
  ImageService,
  MAX_COMMENT_ATTACHMENTS,
} from '../../services/image.service';
import { AutoGrowDirective } from '../auto-grow.directive';
import { AttachmentRatioDirective } from '../attachment-ratio.directive';
import { AttachmentLightboxComponent } from './attachment-lightbox.component';
import { MathTextComponent } from '../math/math-text.component';
import { FormulaButtonComponent } from '../math/formula-button.component';
import { formulaEditorTarget } from '../math/formula-editor.component';

/**
 * Khung chọn Ảnh đính kèm cho một Nhận xét theo ảnh, dùng chung lúc soạn mới và lúc sửa:
 * nút ghim 🖇️ để thêm (chọn nhiều ảnh một lần), dán ảnh bằng Ctrl+V (ô nhập gọi `onPaste`),
 * ✕ để bỏ từng ảnh, bấm/chạm nhanh để phóng to, kéo để đổi thứ tự (chuột kéo ngay, cảm ứng giữ 0,2 giây),
 * bấm vào nhãn "Hình N" để gõ Ghi chú ảnh. Số Hình N luôn theo vị trí hiện tại.
 */
@Component({
  selector: 'comment-attachments-editor',
  standalone: true,
  imports: [AttachmentLightboxComponent, AutoGrowDirective, AttachmentRatioDirective, MathTextComponent, FormulaButtonComponent],
  styles: [
    `
      .att-editor {
        margin-top: 0.4rem;
      }
      .att-head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        font-size: 0.75rem;
        color: #64748b;
      }
      .att-add {
        /* Cùng rộng với nút Gửi của trang (nếu trang khai báo) để hai nút thẳng tâm. */
        width: var(--send-btn-width, 44px);
        box-sizing: border-box;
        height: 30px;
        border: 1.5px solid #2563eb;
        border-radius: 8px;
        background: #fff;
        font-size: 1.1rem;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        line-height: 1;
      }
      .att-add:hover {
        background: #eff6ff;
      }
      .att-add.disabled {
        opacity: 0.4;
        cursor: not-allowed;
      }
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
      /* Khung ôm sát ảnh để nút ✕ nằm đúng góc ảnh. */
      .att-img-box {
        position: relative;
        width: fit-content;
      }
      /* Viền xám bao ảnh + "Hình N: ghi chú" để biết ghi chú thuộc ảnh nào. */
      .att-thumb {
        position: relative;
        min-width: 0;
        border: 1px solid #cbd5e1;
        border-radius: 10px;
        padding: 6px;
        box-sizing: border-box;
        touch-action: none;
        user-select: none;
        -webkit-user-select: none;
        -webkit-touch-callout: none;
        cursor: zoom-in;
        transition: transform 0.12s;
      }
      .att-thumb img {
        background: #f8fafc;
        border-radius: 8px;
        border: 1px solid #e2e8f0;
        display: block;
        pointer-events: none;
      }
      .att-thumb.dragging {
        transform: scale(1.06);
        z-index: 2;
        cursor: grabbing;
      }
      .att-thumb.dragging img {
        border: 2px solid #2563eb;
        box-shadow: 0 6px 16px rgba(37, 99, 235, 0.35);
      }
      .att-remove {
        position: absolute;
        top: -6px;
        right: -6px;
        width: 22px;
        height: 22px;
        border-radius: 50%;
        border: none;
        background: #ef4444;
        color: #fff;
        font-size: 0.7rem;
        font-weight: 700;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.25);
      }
      .att-label {
        font-size: 0.875rem;
        color: #475569;
        margin-top: 3px;
        cursor: text;
        word-break: break-word;
        border-radius: 4px;
        padding: 1px 3px;
      }
      .att-label:hover {
        background: #f1f5f9;
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
      .att-label .att-placeholder {
        color: #94a3b8;
        font-style: italic;
      }
      .att-note-edit {
        display: flex;
        align-items: flex-start;
        gap: 3px;
        margin-top: 3px;
        font-size: 0.875rem;
        font-weight: 700;
        color: #475569;
        white-space: nowrap;
      }
      .att-note-edit textarea {
        flex: 1;
        line-height: 1.35;
        font-family: inherit;
        min-width: 0;
        font-size: 0.875rem;
        padding: 2px 4px;
        border: 1px solid #93c5fd;
        border-radius: 4px;
        outline: none;
      }
      .att-hint {
        font-size: 0.7rem;
        color: #94a3b8;
        margin-top: 0.3rem;
      }
      .att-error {
        font-size: 0.72rem;
        color: #dc2626;
        margin-top: 0.3rem;
      }
    `,
  ],
  template: `
    <div class="att-editor" (click)="$event.stopPropagation()">
      <div class="att-head">
        <span>Ảnh đính kèm ({{ items().length }}/{{ max }})</span>
        <label
          class="att-add"
          [class.disabled]="items().length >= max || busy()"
          title="Thêm ảnh (hoặc dán ảnh bằng Ctrl+V trong ô bình luận)"
        >
          🖇️
          <input
            type="file"
            accept="image/*"
            multiple
            hidden
            [disabled]="items().length >= max || busy()"
            (change)="onFiles($event)"
          />
        </label>
      </div>
      @if (items().length) {
        <div
          class="att-grid"
          [class.n1]="items().length === 1"
          [class.n2]="items().length === 2"
        >
          @for (it of items(); track it; let i = $index) {
            <div
              class="att-thumb"
              [attr.data-att-index]="i"
              [class.dragging]="dragIndex() === i"
              (pointerdown)="onPointerDown($event, i)"
              (contextmenu)="$event.preventDefault()"
            >
              <div class="att-img-box">
                <img [src]="it.dataUrl" alt="" class="att-img" attRatio draggable="false" />
                <button
                  type="button"
                  class="att-remove"
                  title="Bỏ ảnh này"
                  (pointerdown)="$event.stopPropagation()"
                  (click)="remove(i)"
                >
                  ✕
                </button>
              </div>
              @if (editingNote() === it) {
                <div class="att-note-edit" (pointerdown)="$event.stopPropagation()">
                  <span class="att-num">Hình {{ i + 1 }}:</span>
                  <textarea
                    #noteInput
                    rows="1"
                    autoGrow
                    enterkeyhint="enter"
                    [value]="it.note || ''"
                    placeholder="ghi chú..."
                    (input)="setNote(it, noteInput.value)"
                    (blur)="onNoteBlur(noteInput)"
                  ></textarea>
                  <formula-button [field]="noteInput" [small]="true" />
                </div>
              } @else {
                <div
                  class="att-label"
                  title="Bấm để ghi chú cho hình này"
                  (pointerdown)="$event.stopPropagation()"
                  (click)="startNote(it)"
                >
                  <b class="att-num">Hình {{ i + 1 }}</b
                  >@if (it.note) {: <span class="att-note"><math-text [text]="it.note" /></span>} @else {
                    <span class="att-placeholder"> ✎</span>
                  }
                </div>
              }
            </div>
          }
        </div>
        @if (items().length > 1) {
          <div class="att-hint">Kéo ảnh để đổi thứ tự · bấm "Hình N" để ghi chú</div>
        } @else {
          <div class="att-hint">Bấm "Hình 1" để ghi chú</div>
        }
      }
      @if (busy()) {
        <div class="att-hint">Đang xử lý ảnh...</div>
      }
      @if (error()) {
        <div class="att-error">{{ error() }}</div>
      }
    </div>
    <attachment-lightbox [urls]="previewUrls()" [notes]="previewNotes()" [(index)]="previewIndex" />
  `,
})
export class CommentAttachmentsEditorComponent implements OnDestroy {
  private imageService = inject(ImageService);
  private host = inject(ElementRef<HTMLElement>);

  items = model<AttachmentDraft[]>([]);
  readonly max = MAX_COMMENT_ATTACHMENTS;
  busy = signal(false);
  error = signal('');
  dragIndex = signal<number | null>(null);
  editingNote = signal<AttachmentDraft | null>(null);
  previewIndex = signal<number | null>(null);
  previewUrls = computed(() => this.items().map((d) => d.dataUrl));
  previewNotes = computed(() => this.items().map((d) => (d.note || '').trim()));

  private pressTimer?: ReturnType<typeof setTimeout>;
  private pending: { index: number; el: HTMLElement; pointerId: number; mouse: boolean } | null =
    null;
  private startX = 0;
  private startY = 0;

  async onFiles(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files || []);
    input.value = '';
    await this.addFiles(files, false);
  }

  /** Gắn vào sự kiện (paste) của ô nhập bình luận: ảnh trong clipboard thành Ảnh đính kèm. */
  onPaste(event: ClipboardEvent): void {
    const data = event.clipboardData;
    if (!data) return;
    const files = Array.from(data.items)
      .filter((it) => it.kind === 'file' && it.type.startsWith('image/'))
      .map((it) => it.getAsFile())
      .filter((f): f is File => !!f);
    if (!files.length) return;
    // Chỉ chặn dán chữ khi clipboard không có chữ (vd. ảnh chụp màn hình).
    if (!data.types.includes('text/plain')) event.preventDefault();
    this.addFiles(files, true);
  }

  private async addFiles(files: File[], pasted: boolean): Promise<void> {
    if (!files.length) return;
    const room = this.max - this.items().length;
    this.error.set(files.length > room ? `Chỉ đính kèm được tối đa ${this.max} ảnh.` : '');
    if (room <= 0) return;
    this.busy.set(true);
    try {
      const added: AttachmentDraft[] = [];
      for (const file of files.slice(0, room)) {
        try {
          const dataUrl = pasted
            ? await this.imageService.compressPastedImage(file)
            : await this.imageService.compressImage(file);
          added.push({ dataUrl, note: '' });
        } catch {}
      }
      this.items.set([...this.items(), ...added]);
    } finally {
      this.busy.set(false);
    }
  }

  remove(i: number): void {
    this.items.set(this.items().filter((_, idx) => idx !== i));
    this.error.set('');
  }

  startNote(it: AttachmentDraft): void {
    this.editingNote.set(it);
    setTimeout(() =>
      this.host.nativeElement.querySelector('.att-note-edit textarea')?.focus(),
    );
  }

  setNote(it: AttachmentDraft, note: string): void {
    // Sửa tại chỗ để giữ nguyên đối tượng (ô nhập không bị dựng lại, mất con trỏ).
    it.note = note;
    this.items.set([...this.items()]);
  }

  /** Rời ô ghi chú thì đóng ô — trừ khi do Bảng soạn công thức mở ra cho chính ô này (sẽ quay lại sau khi chèn). */
  onNoteBlur(input: HTMLTextAreaElement): void {
    if (formulaEditorTarget() === input) return;
    this.editingNote.set(null);
  }

  onPointerDown(e: PointerEvent, i: number): void {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    this.endDrag();
    this.startX = e.clientX;
    this.startY = e.clientY;
    const mouse = e.pointerType === 'mouse';
    this.pending = { index: i, el: e.currentTarget as HTMLElement, pointerId: e.pointerId, mouse };
    // Chuột: kéo là đổi chỗ ngay. Cảm ứng: giữ 0,2 giây để không nhầm với chạm.
    if (!mouse) this.pressTimer = setTimeout(() => this.beginDrag(), 200);
    window.addEventListener('pointermove', this.onPointerMove, { passive: false });
    window.addEventListener('pointerup', this.onPointerUp);
    window.addEventListener('pointercancel', this.endDrag);
  }

  private beginDrag(): void {
    const p = this.pending;
    if (!p) return;
    this.dragIndex.set(p.index);
    try {
      p.el.setPointerCapture(p.pointerId);
    } catch {}
    if (!p.mouse) navigator.vibrate?.(20);
  }

  private onPointerMove = (e: PointerEvent): void => {
    const moved = Math.hypot(e.clientX - this.startX, e.clientY - this.startY);
    if (this.dragIndex() === null) {
      if (this.pending?.mouse && moved > 4) this.beginDrag();
      else if (moved > 8) return this.endDrag();
      if (this.dragIndex() === null) return;
    }
    e.preventDefault();
    const from = this.dragIndex()!;
    const target = document.elementFromPoint(e.clientX, e.clientY)?.closest('[data-att-index]');
    if (!target || !this.host.nativeElement.contains(target)) return;
    const to = Number(target.getAttribute('data-att-index'));
    if (Number.isNaN(to) || to === from) return;
    const next = [...this.items()];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    this.items.set(next);
    this.dragIndex.set(to);
  };

  /** Thả tay mà chưa kéo (bấm/chạm nhanh, không di chuyển) thì mở ảnh phóng to. */
  private onPointerUp = (): void => {
    const tapped = this.pending && this.dragIndex() === null ? this.pending.index : null;
    this.endDrag();
    if (tapped !== null) this.previewIndex.set(tapped);
  };

  private endDrag = (): void => {
    clearTimeout(this.pressTimer);
    this.pending = null;
    this.dragIndex.set(null);
    window.removeEventListener('pointermove', this.onPointerMove);
    window.removeEventListener('pointerup', this.onPointerUp);
    window.removeEventListener('pointercancel', this.endDrag);
  };

  ngOnDestroy(): void {
    this.endDrag();
  }
}
