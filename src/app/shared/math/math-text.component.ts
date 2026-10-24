import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  NgZone,
  OnChanges,
  OnDestroy,
  Output,
  inject,
} from '@angular/core';
import { hasFormula, splitFormulas } from './math-text';
import { loadKatex, renderFormula } from './katex';

export interface FormulaHit {
  start: number;
  end: number;
  latex: string;
}

/**
 * Hiển thị nội dung có Công thức: chữ giữ nguyên, mỗi \(…\) được KaTeX vẽ xếp chồng.
 * Đặt trong phần tử đang có white-space: pre-wrap (giống {{ content }} trước đây).
 * Công thức dài tự xuống dòng tại các điểm ngắt của KaTeX; khối không ngắt được mà rộng hơn khung thì thu nhỏ (≥ 55%).
 */
@Component({
  selector: 'math-text',
  standalone: true,
  template: '',
  host: { class: 'math-text' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MathTextComponent implements OnChanges, OnDestroy {
  @Input() text: string | null | undefined = '';
  /** Cho bấm vào công thức để sửa (phần Xem trước dưới ô nhập). */
  @Input() editable = false;
  @Output() formulaClick = new EventEmitter<FormulaHit>();

  private readonly host: HTMLElement = inject(ElementRef).nativeElement;
  private readonly zone = inject(NgZone);
  private resizeObserver: ResizeObserver | null = null;
  private fitFrame = 0;
  private renderId = 0;
  private boxes: { box: HTMLElement; span: HTMLElement }[] = [];

  constructor() {
    this.host.addEventListener('pointerdown', (ev) => { if (this.boxAt(ev)) ev.preventDefault(); }); // giữ con trỏ trong ô nhập
    this.host.addEventListener('click', (ev) => {
      const span = this.boxAt(ev);
      if (span) { ev.stopPropagation(); span.click(); }
    });
  }

  ngOnChanges(): void {
    this.render();
  }

  ngOnDestroy(): void {
    this.resizeObserver?.disconnect();
    cancelAnimationFrame(this.fitFrame);
  }

  private render(): void {
    const text = this.text ?? '';
    const id = ++this.renderId;
    this.host.classList.toggle('math-text-edit', this.editable);
    if (!hasFormula(text)) {
      this.host.textContent = text;
      return;
    }
    this.host.textContent = '';
    const formulas: { el: HTMLElement; latex: string }[] = [];
    for (const seg of splitFormulas(text)) {
      if (seg.kind === 'text') {
        this.host.appendChild(document.createTextNode(seg.value));
        continue;
      }
      const span = document.createElement('span');
      span.className = 'f';
      span.textContent = seg.latex; // tạm thời, trong lúc KaTeX đang tải
      if (this.editable) {
        span.setAttribute('role', 'button');
        span.tabIndex = 0;
        span.title = 'Bấm để sửa công thức';
        const hit: FormulaHit = { start: seg.start, end: seg.end, latex: seg.latex };
        span.addEventListener('pointerdown', (ev) => ev.preventDefault()); // giữ con trỏ trong ô nhập
        span.addEventListener('click', (ev) => { ev.stopPropagation(); this.zone.run(() => this.formulaClick.emit(hit)); });
        span.addEventListener('keydown', (ev) => {
          if (ev.key === 'Enter') { ev.preventDefault(); this.zone.run(() => this.formulaClick.emit(hit)); }
        });
        for (const t of ['focus', 'blur']) span.addEventListener(t, () => this.drawBoxes());
      }
      this.host.appendChild(span);
      formulas.push({ el: span, latex: seg.latex });
    }
    this.zone.runOutsideAngular(() => {
      loadKatex().then((katex) => {
        if (id !== this.renderId) return;
        for (const f of formulas) renderFormula(katex, f.el, f.latex);
        this.observeSize();
        this.scheduleFit();
        document.fonts?.ready.then(() => this.scheduleFit());
      });
    });
  }

  private observeSize(): void {
    if (this.resizeObserver || typeof ResizeObserver === 'undefined') return;
    const box = this.host.parentElement;
    if (!box) return;
    this.resizeObserver = new ResizeObserver(() => this.scheduleFit());
    this.resizeObserver.observe(box);
  }

  private scheduleFit(): void {
    cancelAnimationFrame(this.fitFrame);
    this.fitFrame = requestAnimationFrame(() => this.fit());
  }

  private fit(): void {
    const box = this.host.parentElement;
    if (!box) return;
    const cs = getComputedStyle(box);
    const avail = box.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight) - 8;
    this.host.querySelectorAll<HTMLElement>('.f').forEach((span) => {
      span.style.fontSize = '';
      const widest = Math.max(0, ...Array.from(span.querySelectorAll('.katex-base'), (b) => b.getBoundingClientRect().width));
      if (avail > 0 && widest > avail) span.style.fontSize = Math.max(0.55, avail / widest).toFixed(3) + 'em';
    });
    this.drawBoxes();
  }

  /**
   * Ô nền của công thức bấm được (Xem trước): nền của phần tử inline chỉ cao bằng dòng chữ nên phân số, hệ, tích phân
   * tràn ra ngoài. Vẽ riêng một ô cho mỗi đoạn công thức trên từng dòng, ôm khít các khối .katex-base của KaTeX
   * (KaTeX chỉ ngắt dòng giữa các khối). Đệm trên dưới là padding của .katex-base (math.scss) nên dòng chữ chừa sẵn chỗ;
   * đệm hai bên là padding của span.
   */
  private drawBoxes(): void {
    if (!this.editable) return;
    this.host.querySelector(':scope > .f-boxes')?.remove();
    this.boxes = [];
    const spans = Array.from(this.host.querySelectorAll<HTMLElement>(':scope > .f'));
    if (!spans.some((s) => s.querySelector('.katex'))) return;
    const layer = document.createElement('div');
    layer.className = 'f-boxes';
    const origin = this.host.getBoundingClientRect();
    for (const span of spans) {
      const pad = parseFloat(getComputedStyle(span).paddingLeft) || 0;
      const lines: DOMRect[][] = [];
      for (const b of Array.from(span.querySelectorAll<HTMLElement>('.katex-html > .katex-base'), (el) => el.getBoundingClientRect())) {
        const line = lines.at(-1);
        // Khối sau nằm bên trái khối trước: công thức đã xuống dòng
        if (!line || b.left < line[line.length - 1].right - 1) lines.push([b]);
        else line.push(b);
      }
      for (const line of lines) {
        const top = Math.min(...line.map((r) => r.top)), bottom = Math.max(...line.map((r) => r.bottom));
        const box = document.createElement('div');
        box.className = 'f-box' + (document.activeElement === span ? ' focus' : '');
        Object.assign(box.style, {
          left: `${line[0].left - pad - origin.left}px`,
          top: `${top - origin.top}px`,
          width: `${line[line.length - 1].right - line[0].left + 2 * pad}px`,
          height: `${bottom - top}px`,
        });
        layer.appendChild(box);
        this.boxes.push({ box, span });
      }
    }
    this.host.prepend(layer);
  }

  /** Bấm vào phần đệm của ô nền (ngoài chữ của công thức) cũng là sửa công thức đó. Sự kiện rơi vào chính thẻ math-text. */
  private boxAt(ev: MouseEvent): HTMLElement | null {
    if (ev.target !== this.host) return null;
    const hit = this.boxes.find(({ box }) => {
      const r = box.getBoundingClientRect();
      return ev.clientX >= r.left && ev.clientX <= r.right && ev.clientY >= r.top && ev.clientY <= r.bottom;
    });
    return hit?.span ?? null;
  }
}
