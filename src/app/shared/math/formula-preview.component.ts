import { AfterViewChecked, ChangeDetectionStrategy, Component, ElementRef, Input, NgZone, OnDestroy, inject } from '@angular/core';
import { FormulaHit, MathTextComponent } from './math-text.component';
import { FormulaEditorService } from './formula-editor.service';
import { TextField } from './formula-editor.component';
import { hasFormula } from './math-text';

/** Phần Xem trước của từng ô chữ (để canh ô chữ ra giữa màn hình kèm cả Xem trước). */
export const previewOf = new WeakMap<Element, HTMLElement>();

/**
 * Phần "Xem trước" ngay dưới ô chữ khi nội dung có Công thức; bấm vào công thức để sửa lại trong Bảng soạn.
 * Đặt ngay sau hàng chứa ô chữ. Tự canh trái và rộng đúng bằng ô chữ (không tính nút f(x), đính kèm, Gửi bên cạnh).
 */
@Component({
  selector: 'formula-preview',
  standalone: true,
  imports: [MathTextComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: 'display: block' },
  template: `
    @if (show) {
      <div class="formula-preview" (click)="$event.stopPropagation()">
        <span class="formula-preview-label">Xem trước (bấm vào để sửa)</span>
        <math-text [text]="text" [editable]="true" (formulaClick)="edit($event)" />
      </div>
    }
  `,
})
export class FormulaPreviewComponent implements AfterViewChecked, OnDestroy {
  @Input({ required: true }) field!: TextField;
  @Input() text: string | null | undefined = '';
  private readonly editor = inject(FormulaEditorService);
  private readonly host: HTMLElement = inject(ElementRef).nativeElement;
  private readonly zone = inject(NgZone);
  private observer: ResizeObserver | null = null;
  private observed: Element | null = null;
  private frame = 0;

  get show(): boolean {
    return hasFormula(this.text);
  }

  edit(hit: FormulaHit): void {
    this.editor.open(this.field, { range: [hit.start, hit.end], latex: hit.latex });
  }

  ngAfterViewChecked(): void {
    previewOf.set(this.field as unknown as Element, this.host);
    const field = this.show ? (this.field as unknown as Element) : null;
    if (field === this.observed) return;
    this.observer?.disconnect();
    this.observed = field;
    if (!field || typeof ResizeObserver === 'undefined') return;
    this.zone.runOutsideAngular(() => {
      this.observer = new ResizeObserver(() => this.scheduleAlign());
      this.observer.observe(field);
      if (this.host.parentElement) this.observer.observe(this.host.parentElement);
    });
    this.scheduleAlign();
  }

  ngOnDestroy(): void {
    if (previewOf.get(this.field as unknown as Element) === this.host) previewOf.delete(this.field as unknown as Element);
    this.observer?.disconnect();
    cancelAnimationFrame(this.frame);
  }

  private scheduleAlign(): void {
    cancelAnimationFrame(this.frame);
    this.frame = requestAnimationFrame(() => this.align());
  }

  private align(): void {
    const field = this.observed as HTMLElement | null;
    const s = this.host.style;
    if (!field?.isConnected || !field.offsetWidth) { s.marginLeft = s.width = ''; return; }
    const f = field.getBoundingClientRect();
    const natural = this.host.getBoundingClientRect().left - (parseFloat(s.marginLeft) || 0);
    s.marginLeft = `${Math.round(f.left - natural)}px`;
    s.width = `${Math.round(f.width)}px`;
  }
}
