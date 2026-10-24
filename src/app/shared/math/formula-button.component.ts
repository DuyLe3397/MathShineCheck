import { ChangeDetectionStrategy, Component, Input, OnDestroy, OnInit, inject } from '@angular/core';
import { FormulaEditorService } from './formula-editor.service';
import { TextField } from './formula-editor.component';
import { canRender, loadKatex } from './katex';
import { convertPastedMath, findPastedMath } from './paste-math';
import { centerFieldSoon } from './center-field';
import { previewOf } from './formula-preview.component';

/**
 * Nút f(x) cạnh ô chữ: mở Bảng soạn công thức (con trỏ đang ở trong một Công thức thì sửa Công thức đó).
 * Ô chữ có nút này thì dán chữ có $…$, $$…$$, \[…\] sẽ tự thành Công thức (paste-math.ts).
 */
@Component({
  selector: 'formula-button',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button
      type="button"
      class="fx-btn"
      [class.fx-btn-sm]="small"
      title="Soạn công thức"
      aria-label="Soạn công thức"
      (pointerdown)="$event.preventDefault()"
      (click)="open($event)"
    >
      <span class="fx" aria-hidden="true"><i>f</i>(<i>x</i>)</span>
    </button>
  `,
})
export class FormulaButtonComponent implements OnInit, OnDestroy {
  @Input({ required: true }) field!: TextField;
  @Input() small = false;
  private readonly editor = inject(FormulaEditorService);
  private readonly pasteListener = (ev: Event) => this.onPaste(ev as ClipboardEvent);
  // Bấm vào ô chữ (hoặc đóng Bảng soạn, khi con trỏ được trả về ô chữ): đưa ô chữ và Xem trước ra giữa màn hình
  // Ô chữ nhận con trỏ ngay lúc nhấn xuống; cuộn lúc đó thì chữ trượt dưới chuột và nhả ra sẽ bôi đen nhầm,
  // nên đang nhấn thì đợi nhả tay mới cuộn.
  private readonly focusListener = () => {
    if (this.pressing) this.centerOnRelease = true;
    else this.center();
  };
  private readonly pointerDownListener = () => {
    this.pressing = true;
    const done = new AbortController();
    const release = () => {
      done.abort();
      this.pressing = false;
      if (this.centerOnRelease) { this.centerOnRelease = false; this.center(); }
    };
    for (const t of ['pointerup', 'pointercancel']) window.addEventListener(t, release, { capture: true, signal: done.signal });
  };
  private pressing = false;
  private centerOnRelease = false;
  private stopCentering: () => void = () => {};

  ngOnInit(): void {
    this.field.addEventListener('paste', this.pasteListener);
    this.field.addEventListener('focus', this.focusListener);
    this.field.addEventListener('pointerdown', this.pointerDownListener);
  }

  ngOnDestroy(): void {
    this.field.removeEventListener('paste', this.pasteListener);
    this.field.removeEventListener('focus', this.focusListener);
    this.field.removeEventListener('pointerdown', this.pointerDownListener);
    this.stopCentering();
  }

  private center(): void {
    this.stopCentering();
    this.stopCentering = centerFieldSoon(this.field, () => previewOf.get(this.field) ?? null);
  }

  open(ev: Event): void {
    ev.stopPropagation();
    this.editor.open(this.field);
  }

  /**
   * Dán làm hai bước hoàn tác: trước hết dán đúng chữ gốc, sau đó đổi các công thức vẽ được sang \(…\).
   * Ctrl+Z lần đầu trả về đúng chữ vừa dán (còn $…$), lần nữa thì bỏ hẳn phần dán.
   */
  private onPaste(ev: ClipboardEvent): void {
    if (ev.defaultPrevented) return;
    // Clipboard trên Windows xuống dòng bằng \r\n, ô chữ tự đổi thành \n: đổi trước để so khớp được chỗ vừa dán
    const raw = (ev.clipboardData?.getData('text/plain') ?? '').replace(/\r\n?/g, '\n');
    if (!findPastedMath(raw).length) return; // không có công thức: để trình duyệt dán như thường
    ev.preventDefault();
    const f = this.field;
    const start = f.selectionStart ?? f.value.length;
    insertText(f, raw);
    const end = start + raw.length;
    loadKatex().then((katex) => {
      const { text, count } = convertPastedMath(raw, (latex) => canRender(katex, latex));
      if (!count || f.value.slice(start, end) !== raw) return; // người dùng đã sửa chỗ đó trong lúc chờ: thôi
      f.setSelectionRange(start, end);
      insertText(f, text);
    });
  }
}

/** Chèn chữ vào chỗ đang chọn như khi gõ: giữ được Ctrl+Z của trình duyệt và phát sự kiện input cho ngModel. */
function insertText(f: TextField, text: string): void {
  f.focus();
  if (document.execCommand?.('insertText', false, text)) return;
  f.setRangeText(text, f.selectionStart ?? f.value.length, f.selectionEnd ?? f.value.length, 'end');
  f.dispatchEvent(new Event('input', { bubbles: true }));
}
