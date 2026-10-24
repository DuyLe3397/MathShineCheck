import { AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, NgZone, OnDestroy, ViewChild, inject } from '@angular/core';
import { formulaAt } from './math-text';
import { FORMULA_LAYOUTS, NEWLINE_CLASS, PICK_CLASS, systemLatex } from './formula-keyboard';
import { MARK, cleanLatex, isWholeUnderline, joinLineAtMark, splitLineAtMark } from './formula-lines';

export type TextField = HTMLTextAreaElement | HTMLInputElement;
export interface OpenFormulaOptions {
  /** Đoạn \(…\) đang sửa trong ô chữ (bấm vào công thức ở phần Xem trước). */
  range?: [number, number];
  latex?: string;
}

let activeField: TextField | null = null;
/**
 * Ô chữ đang được Bảng soạn công thức dùng (null nếu bảng đang đóng). Ô nào tự đóng khi mất focus (vd. ô Ghi chú ảnh)
 * thì bỏ qua lần mất focus do bảng soạn mở ra.
 */
export function formulaEditorTarget(): TextField | null {
  return activeField;
}

// MathLive không có kiểu cho các phần nội bộ dùng ở đây (_mathfield, executeCommand dạng mảng…)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Mf = any;

const MF_FONT = 1.55; // rem
const MF_MIN_SCALE = 0.85;
const IDLE_MS = 150;
const BARS_MS = 5000;
const HOLD_MS = 500; // chạm giữ bao lâu thì chuyển sang kéo con trỏ (vuốt nhanh hơn thế vẫn là cuộn)
const STEP_X = 14;
const STEP_Y = 28;

// Thanh cuộn của vùng nội dung nằm trong shadow DOM của MathLive nên CSS của trang không tới được: chèn thẳng vào shadow root.
const SHADOW_CSS = `
  .ML__content::-webkit-scrollbar { width: 6px; height: 10px; }
  .ML__content::-webkit-scrollbar-corner, .ML__content::-webkit-scrollbar-track { background: transparent; }
  .ML__content::-webkit-scrollbar-thumb { background: transparent; border-radius: 999px; }
  :host(.show-bars) .ML__content::-webkit-scrollbar-thumb { background: #a9b4c4; }
  @supports not selector(::-webkit-scrollbar) {
    .ML__content { scrollbar-width: thin; scrollbar-color: transparent transparent; }
    :host(.show-bars) .ML__content { scrollbar-color: #a9b4c4 transparent; }
  }`;

/**
 * Bảng soạn công thức (xem CONTEXT.md, docs/adr/0006): bảng trượt lên trên bàn phím toán của MathLive.
 * Chỉ tạo một bảng cho cả ứng dụng (FormulaEditorService). MathLive được tải khi mở lần đầu.
 * Mọi xử lý gõ phím chạy ngoài Angular zone để gõ nhanh không kích hoạt change detection.
 */
@Component({
  selector: 'formula-editor',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="fe-scrim" #scrim hidden></div>
    <div class="fe-sheet" #sheet role="dialog" aria-label="Soạn công thức" hidden>
      <div class="fe-head">
        <div class="fe-title"><b>Soạn công thức</b><span class="fe-hint" #hint>Đang tải bàn phím toán…</span></div>
        <div class="fe-fmt" #fmt role="group" aria-label="Định dạng">
          <button type="button" data-fmt="bold" title="In đậm" aria-label="In đậm" aria-pressed="false"><b>B</b></button>
          <button type="button" data-fmt="underline" title="Gạch chân" aria-label="Gạch chân" aria-pressed="false"><u>U</u></button>
        </div>
        <button type="button" class="fe-cancel" #cancel aria-label="Hủy, đóng bảng soạn">Hủy</button>
      </div>
      <div class="fe-mf-wrap" #wrap>
        <div class="fe-pick" #pick hidden>
          <span class="fe-pick-title" #pickTitle></span>
          <div class="fe-pick-row" #pickRow></div>
          <button type="button" class="fe-pick-close" #pickClose aria-label="Đóng">✕</button>
        </div>
      </div>
      <div class="fe-actions">
        <button type="button" class="fe-insert" #insert disabled>Chèn</button>
        <div class="fe-nav" #nav role="group" aria-label="Hoàn tác, làm lại">
          <button type="button" data-nav="undo" title="Hoàn tác (quay lại lần gõ trước)" aria-label="Hoàn tác">↶</button>
          <button type="button" data-nav="redo" title="Làm lại (tiến tới)" aria-label="Làm lại">↷</button>
        </div>
      </div>
    </div>
  `,
})
export class FormulaEditorComponent implements AfterViewInit, OnDestroy {
  @ViewChild('scrim', { static: true }) private scrimRef!: ElementRef<HTMLElement>;
  @ViewChild('sheet', { static: true }) private sheetRef!: ElementRef<HTMLElement>;
  @ViewChild('hint', { static: true }) private hintRef!: ElementRef<HTMLElement>;
  @ViewChild('fmt', { static: true }) private fmtRef!: ElementRef<HTMLElement>;
  @ViewChild('cancel', { static: true }) private cancelRef!: ElementRef<HTMLButtonElement>;
  @ViewChild('wrap', { static: true }) private wrapRef!: ElementRef<HTMLElement>;
  @ViewChild('pick', { static: true }) private pickRef!: ElementRef<HTMLElement>;
  @ViewChild('pickTitle', { static: true }) private pickTitleRef!: ElementRef<HTMLElement>;
  @ViewChild('pickRow', { static: true }) private pickRowRef!: ElementRef<HTMLElement>;
  @ViewChild('pickClose', { static: true }) private pickCloseRef!: ElementRef<HTMLButtonElement>;
  @ViewChild('insert', { static: true }) private insertRef!: ElementRef<HTMLButtonElement>;
  @ViewChild('nav', { static: true }) private navRef!: ElementRef<HTMLElement>;

  private readonly zone = inject(NgZone);
  private readonly abort = new AbortController();
  private mf: Mf | null = null;
  private loading: Promise<void> | null = null;
  private editing: { field: TextField; range: [number, number]; isEdit: boolean } | null = null;

  private mfScale = 1;
  private insertTimer = 0;
  private barsTimer = 0;
  private caretFrame = 0;
  private lastPointer = 0;
  private lastGeometryChange = 0;
  private pickKind: 'cases' | 'or' = 'cases';
  private rawDelete: () => unknown = () => this.mf?.executeCommand('deleteBackward');
  private fmt = { bold: false, boldFrom: null as number | null, underline: false, underlineFrom: null as number | null, underlineValue: null as string | null };
  private styling = false;
  // Lịch sử của Bảng soạn cho ↶ ↷: MathLive tự ghi theo từng bước nhỏ bên trong xuống dòng / nối dòng (lộ dấu ¶, có lúc kẹt),
  // nên tự giữ: mỗi lần nội dung đổi lưu một bản; xuống dòng / nối dòng chỉ lưu bản cuối (quiet trong lúc chạy).
  private history = { states: [] as { latex: string; pos: number }[], index: -1, quiet: false };
  private pan: {
    id: number; x: number; y: number; left: number; top: number; sx: number; sy: number;
    sc: HTMLElement; mode: 'tap' | 'scroll' | 'caret'; timer: number;
  } | null = null;

  ngAfterViewInit(): void {
    this.zone.runOutsideAngular(() => this.wireStaticUi());
  }

  ngOnDestroy(): void {
    this.abort.abort();
  }

  /** Mở bảng soạn cho một ô chữ. Con trỏ đang nằm trong một Công thức thì sửa Công thức đó. */
  open(field: TextField, opts: OpenFormulaOptions = {}): void {
    this.zone.runOutsideAngular(() => {
      const caret = field.selectionStart ?? field.value.length;
      const inside = opts.range || field.selectionStart !== field.selectionEnd ? null : formulaAt(field.value, caret);
      const range: [number, number] = opts.range ?? (inside ? [inside.start, inside.end] : [caret, field.selectionEnd ?? caret]);
      this.editing = { field, range, isEdit: !!(opts.range || inside) };
      const latex = inside ? inside.latex : opts.latex ?? '';
      activeField = field;
      field.blur();
      this.scrimRef.nativeElement.hidden = false;
      this.sheetRef.nativeElement.hidden = false;
      this.insertRef.nativeElement.textContent = this.editing.isEdit ? 'Lưu' : 'Chèn';
      this.loading ??= this.loadMathLive();
      this.loading.then(() => this.startEditing(latex)).catch(() => {
        this.hintRef.nativeElement.textContent = 'Không tải được bàn phím toán, kiểm tra mạng rồi thử lại.';
      });
    });
  }

  // ---------- Khởi tạo ----------

  private wireStaticUi(): void {
    const signal = this.abort.signal;
    const fmt = this.fmtRef.nativeElement;
    fmt.addEventListener('pointerdown', (ev) => ev.preventDefault(), { signal }); // giữ con trỏ trong ô soạn
    fmt.addEventListener('click', (ev) => {
      const t = (ev.target as HTMLElement).closest<HTMLElement>('[data-fmt]');
      if (!t || !this.mf) return;
      this.toggleFormat(t.dataset['fmt'] as 'bold' | 'underline');
    }, { signal });
    // Hàng nút cạnh Chèn: hoàn tác / làm lại. Chạy ngay khi nhấn (không đợi nhả tay); giữ nút thì lặp lại.
    const nav = this.navRef.nativeElement;
    let repeat = 0;
    const stopRepeat = () => { clearTimeout(repeat); clearInterval(repeat); repeat = 0; };
    nav.addEventListener('pointerdown', (ev) => {
      ev.preventDefault(); // giữ con trỏ trong ô soạn
      const t = (ev.target as HTMLElement).closest<HTMLElement>('[data-nav]');
      if (!t || !this.mf) return;
      const cmd = t.dataset['nav']!;
      const step = () => {
        this.stepHistory(cmd === 'undo' ? -1 : 1);
        this.lastPointer = 0; // cho phép tự cuộn theo con trỏ ngay
      };
      step();
      stopRepeat();
      repeat = window.setTimeout(() => { repeat = window.setInterval(step, 80); }, 400);
    }, { signal });
    for (const t of ['pointerup', 'pointercancel', 'pointerleave']) nav.addEventListener(t, stopRepeat, { signal });
    // Bỏ qua lần bấm ngay sau khi bàn phím đổi cỡ: bảng soạn vừa xê dịch, ngón tay có thể chạm nhầm nút
    const settled = () => performance.now() - this.lastGeometryChange > 350;
    this.cancelRef.nativeElement.addEventListener('click', () => { if (settled()) this.close(false); }, { signal });
    this.insertRef.nativeElement.addEventListener('click', () => { if (this.flushInsertState() && settled()) this.close(true); }, { signal });
    this.pickRowRef.nativeElement.addEventListener('click', (ev) => {
      const b = (ev.target as HTMLElement).closest<HTMLElement>('[data-n]');
      if (!b || !this.mf) return;
      this.pickRef.nativeElement.hidden = true;
      this.mf.focus();
      this.mf.executeCommand(['insert', systemLatex(this.pickKind, Number(b.dataset['n'])), { selectionMode: 'placeholder' }]);
      this.record(); // chèn từ code không phát 'input'
      this.updateInsertState();
    }, { signal });
    this.pickCloseRef.nativeElement.addEventListener('click', () => { this.pickRef.nativeElement.hidden = true; this.mf?.focus(); }, { signal });
    document.addEventListener('keydown', (ev) => { if (ev.key === 'Escape' && this.editing) this.close(false); }, { signal });
    // Thanh cuộn hiện khi chạm vào màn hình lúc đang soạn
    document.addEventListener('pointerdown', () => { if (this.editing) this.showBars(); }, { capture: true, signal });
    // Hệ n / Hoặc n: chặn phím trước khi MathLive xử lý, hỏi số dòng rồi chèn
    window.addEventListener('pointerdown', (ev) => {
      const kc = (ev.target as Element | null)?.closest?.(`.MLK__keycap.${PICK_CLASS}`);
      if (!kc) return;
      ev.preventDefault();
      ev.stopImmediatePropagation();
      this.pickKind = kc.textContent?.trim().startsWith('Hệ') ? 'cases' : 'or';
      this.pickTitleRef.nativeElement.textContent = this.pickKind === 'cases' ? 'Hệ mấy dòng?' : 'Hoặc mấy dòng?';
      // 2 và 3 dòng đã có phím riêng nên chỉ hỏi từ 4 dòng trở lên
      this.pickRowRef.nativeElement.innerHTML = [4, 5, 6, 7, 8, 9].map((n) => `<button type="button" data-n="${n}">${n}</button>`).join('');
      this.pickRef.nativeElement.hidden = false;
    }, { capture: true, signal });
    // Phím ↵ trên bàn phím: xuống dòng của Bảng soạn (cắt dòng tại con trỏ), không để MathLive chèn gì
    window.addEventListener('pointerdown', (ev) => {
      if (!(ev.target as Element | null)?.closest?.(`.${NEWLINE_CLASS}`) || !this.mf) return;
      ev.preventDefault();
      ev.stopImmediatePropagation();
      this.newline();
    }, { capture: true, signal });
    for (const t of ['pointerup', 'click']) {
      window.addEventListener(t, (ev) => {
        if ((ev.target as Element | null)?.closest?.(`.MLK__keycap.${PICK_CLASS}, .${NEWLINE_CLASS}`)) { ev.preventDefault(); ev.stopImmediatePropagation(); }
      }, { capture: true, signal });
    }
    // Đổi tab của bàn phím thì co nhãn chữ của tab mới cho vừa ô
    document.addEventListener('click', (ev) => {
      if ((ev.target as Element | null)?.closest?.('.MLK__toolbar')) setTimeout(() => this.fitKeycaps(), 30);
    }, { signal });
  }

  private async loadMathLive(): Promise<void> {
    const ml = await import('mathlive');
    const MathfieldElement = ml.MathfieldElement as Mf;
    try { MathfieldElement.soundsDirectory = null; } catch { /* bỏ qua */ }
    await customElements.whenDefined('math-field');
    const mf: Mf = document.createElement('math-field');
    mf.setAttribute('math-virtual-keyboard-policy', 'manual');
    mf.className = 'fe-mf';
    this.wrapRef.nativeElement.insertBefore(mf, this.pickRef.nativeElement);
    this.mf = mf;
    this.setupMathField(mf);
  }

  private setupMathField(mf: Mf): void {
    const signal = this.abort.signal;
    mf.smartFence = true;
    mf.popoverPolicy = 'off';
    mf.mathModeSpace = '\\;'; // dấu cách trên bàn phím máy chèn khoảng trắng (mặc định MathLive bỏ qua trong công thức)
    mf.menuItems = [];
    this.injectShadowCss();

    // Sau mỗi phím MathLive gọi scrollIntoView() nội bộ 2 lần: vẽ lại + đo bố cục + cuộn tới con trỏ, ép trình duyệt tính lại
    // bố cục đồng bộ. Hàm này cũng là nơi MathLive vẽ lại công thức nên không bỏ được: gộp tối đa một lần mỗi khung hình.
    // Bỏ phần cuộn cả trang của nó (bảng soạn cố định). Dùng thuộc tính nội bộ _mathfield: ghim phiên bản mathlive.
    mf.onScrollIntoView = () => {};
    const inner: Mf = mf._mathfield;
    if (inner && typeof inner.scrollIntoView === 'function') {
      const original = inner.scrollIntoView.bind(inner);
      let frame = 0;
      inner.scrollIntoView = () => {
        if (frame) return;
        frame = requestAnimationFrame(() => { frame = 0; original(); this.scheduleCaret(); });
      };
    }
    // Chặn lệnh xoá lùi để xoá được cả dòng. Phím ⌫ ảo gọi performWithFeedback(deleteBackward), Backspace máy tính gọi
    // deleteBackward; cả hai đều đi qua executeCommand của đối tượng nội bộ.
    if (inner && typeof inner.executeCommand === 'function') {
      const exec = inner.executeCommand.bind(inner);
      let busy = false;
      this.rawDelete = () => { const was = busy; busy = true; try { return exec('deleteBackward'); } finally { busy = was; } };
      const isDeleteBackward = (c: unknown) => c === 'deleteBackward' || c === 'performWithFeedback(deleteBackward)'
        || (Array.isArray(c) && (c[0] === 'deleteBackward' || (c[0] === 'performWithFeedback' && c[1] === 'deleteBackward')));
      inner.executeCommand = (cmd: unknown, ...rest: unknown[]) => {
        if (!busy && isDeleteBackward(cmd)) {
          busy = true;
          try { if (this.joinLineBackward()) return true; } finally { busy = false; }
        }
        return exec(cmd, ...rest);
      };
    }

    const kb: Mf = (window as Mf).mathVirtualKeyboard;
    kb.layouts = FORMULA_LAYOUTS;
    const place = () => {
      const h = kb.visible ? kb.boundingRect.height : 0;
      this.lastGeometryChange = performance.now();
      document.documentElement.style.setProperty('--ml-kb-h', h + 'px');
      requestAnimationFrame(() => this.fitKeycaps());
    };
    kb.addEventListener('geometrychange', place, { signal });
    kb.addEventListener('virtual-keyboard-toggle', place, { signal });

    mf.addEventListener('input', () => { this.updateInsertState(); this.showBars(); this.applyBold(); this.record(); }, { signal });
    mf.addEventListener('selection-change', () => this.scheduleCaret(), { signal });
    mf.addEventListener('input', () => this.scheduleCaret(), { signal });
    mf.addEventListener('keydown', (ev: KeyboardEvent) => {
      const undoKey = (ev.ctrlKey || ev.metaKey) && !ev.altKey ? ev.key.toLowerCase() : '';
      if (undoKey === 'z' || undoKey === 'y') { ev.preventDefault(); ev.stopImmediatePropagation(); this.stepHistory(undoKey === 'y' || ev.shiftKey ? 1 : -1); }
      else if (ev.key === 'Enter' && !ev.isComposing) { ev.preventDefault(); ev.stopImmediatePropagation(); this.newline(); }
      else if (ev.key === 'Escape') { ev.preventDefault(); this.close(false); }
    }, { capture: true, signal });
    this.wireTouch(mf);
  }

  private startEditing(latex: string): void {
    const mf = this.mf;
    if (!mf || !this.editing) return;
    this.mfScale = 1;
    mf.style.fontSize = '';
    mf.value = latex;
    this.history = { states: [{ latex: mf.value, pos: mf.position }], index: 0, quiet: false };
    this.resetFormat();
    this.injectShadowCss();
    mf.focus();
    mf.applyStyle({ variantStyle: '' });
    (window as Mf).mathVirtualKeyboard.show({ animate: true });
    this.flushInsertState();
  }

  private close(commit: boolean): void {
    const ed = this.editing;
    if (!ed) return;
    const { field, range } = ed;
    let caret = range[1];
    if (commit && this.mf) {
      const text = '\\(' + this.currentLatex() + '\\)';
      field.setRangeText(text, range[0], range[1], 'end');
      caret = range[0] + text.length;
      // ngModel nghe sự kiện input: chạy trong Angular zone để giao diện cập nhật
      this.zone.run(() => field.dispatchEvent(new Event('input', { bubbles: true })));
    }
    this.editing = null;
    this.pickRef.nativeElement.hidden = true;
    (window as Mf).mathVirtualKeyboard?.hide({ animate: false });
    this.mf?.blur();
    this.sheetRef.nativeElement.hidden = true;
    this.scrimRef.nativeElement.hidden = true;
    document.documentElement.style.setProperty('--ml-kb-h', '0px');
    field.focus({ preventScroll: true });
    try { field.setSelectionRange(caret, caret); } catch { /* bỏ qua */ }
    activeField = null;
  }

  // ---------- Trạng thái nút Chèn, cỡ chữ ----------

  private currentLatex(): string {
    let v = '';
    try { v = this.mf.getValue('latex-expanded'); } catch { v = this.mf?.value ?? ''; }
    return cleanLatex(v || '');
  }

  // Gõ nhanh: kiểm tra nút Chèn / dòng gợi ý / cỡ chữ chỉ chạy khi ngừng gõ (mỗi lần phải đọc lại cả chuỗi và đo bố cục)
  private updateInsertState(): void {
    clearTimeout(this.insertTimer);
    this.insertTimer = window.setTimeout(() => this.flushInsertState(), IDLE_MS);
  }

  private flushInsertState(): boolean {
    clearTimeout(this.insertTimer);
    if (!this.mf) return false;
    this.fitField();
    const v = this.currentLatex();
    const blank = /\\placeholder/.test(v);
    const btn = this.insertRef.nativeElement, hint = this.hintRef.nativeElement;
    const text = blank ? 'Còn ô trống ▢, điền hết rồi bấm Chèn' : v ? 'Bấm Chèn để đưa vào nội dung' : 'Gõ hoặc bấm phím bên dưới';
    if (btn.disabled !== (!v || blank)) btn.disabled = !v || blank;
    if (hint.textContent !== text) { hint.textContent = text; hint.classList.toggle('warn', blank); }
    return !btn.disabled;
  }

  private content(): HTMLElement | null {
    return this.mf?.shadowRoot?.querySelector('.ML__content') ?? null;
  }

  // Ô soạn cao dần theo công thức; quá cao thì thu nhỏ nhẹ (≥ 85%), phần còn lại cuộn. Tính từ cỡ hiện tại, chỉ đổi khi chênh
  // đáng kể (mỗi lần đổi cỡ MathLive phải vẽ lại cả công thức).
  private fitField(): void {
    const content = this.content();
    if (!content || !this.mf) return;
    const cs = getComputedStyle(content);
    const pad = parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom);
    const maxH = parseFloat(cs.maxHeight) - pad;
    const natural = (content.scrollHeight - pad) / this.mfScale;
    const target = Math.min(1, Math.max(MF_MIN_SCALE, maxH / natural));
    if (!Number.isFinite(target) || Math.abs(target - this.mfScale) < 0.02) return;
    this.mfScale = target;
    this.mf.style.fontSize = target === 1 ? '' : (MF_FONT * target).toFixed(3) + 'rem';
  }

  // Phím chỉ có chữ (Hệ 2, Hoặc n…) mà dài hơn ô thì co cỡ chữ cho vừa; phím ký hiệu giữ nguyên cỡ
  private fitKeycaps(): void {
    document.querySelectorAll<HTMLElement>('.MLK__layer.is-visible .MLK__keycap').forEach((kc) => {
      if (kc.querySelector('.ML__latex')) return;
      kc.style.fontSize = '';
      const fs = parseFloat(getComputedStyle(kc).fontSize);
      const need = kc.scrollWidth, have = kc.clientWidth - 6;
      if (need > have && have > 0) kc.style.fontSize = Math.max(10, (fs * have) / need).toFixed(1) + 'px';
    });
  }

  private injectShadowCss(): void {
    const sr: ShadowRoot | null = this.mf?.shadowRoot ?? null;
    // Gỡ khối nút bàn phím/menu (đã ẩn): nếu còn, sau mỗi lần vẽ MathLive đọc offsetHeight để căn khối này → ép tính lại bố cục
    sr?.querySelector('.ML__toggles')?.remove();
    if (!sr || sr.getElementById('fe-shadow-css')) return;
    const st = document.createElement('style');
    st.id = 'fe-shadow-css';
    st.textContent = SHADOW_CSS;
    sr.appendChild(st);
    this.content()?.addEventListener('scroll', () => this.showBars(), { passive: true, signal: this.abort.signal });
  }

  // ---------- Thanh cuộn, tự cuộn theo con trỏ ----------

  private showBars(): void {
    const mf = this.mf;
    if (!mf) return;
    mf.classList.add('show-bars');
    clearTimeout(this.barsTimer);
    this.barsTimer = window.setTimeout(() => mf.classList.remove('show-bars'), BARS_MS);
  }

  private scheduleCaret(): void {
    if (!this.caretFrame) this.caretFrame = requestAnimationFrame(() => { this.caretFrame = 0; this.keepCaretVisible(); });
  }

  // Chỉ cuộn khi con trỏ đã ra ngoài khung, và không cuộn ngay sau khi bấm/chạm đặt con trỏ (chữ vừa bấm sẽ trượt khỏi tay)
  private keepCaretVisible(): void {
    if (performance.now() - this.lastPointer < 400) return;
    const caret = this.mf?.shadowRoot?.querySelector('.ML__caret, .ML__text-caret') as HTMLElement | null;
    const sc = this.content();
    if (!caret || !sc) return;
    const c = caret.getBoundingClientRect(), box = sc.getBoundingClientRect();
    if (!c.width && !c.height) return;
    const barH = sc.offsetHeight - sc.clientHeight;
    if (c.right > box.right) sc.scrollLeft += c.right - box.right + 12;
    else if (c.left < box.left) sc.scrollLeft -= box.left - c.left + 12;
    if (c.bottom > box.bottom - barH) sc.scrollTop += c.bottom - box.bottom + barH + 4;
    else if (c.top < box.top) sc.scrollTop -= box.top - c.top + 4;
  }

  // Cảm ứng (chuột giữ nguyên: kéo để bôi đen, lăn để cuộn):
  // chạm nhẹ = đặt con trỏ; vuốt = cuộn; chạm giữ ~0,5 giây rồi kéo = dịch con trỏ từng chữ / từng dòng.
  private wireTouch(mf: Mf): void {
    const signal = this.abort.signal;
    mf.addEventListener('pointerdown', () => { this.lastPointer = performance.now(); }, { capture: true, signal });
    mf.addEventListener('pointerdown', (ev: PointerEvent) => {
      if (ev.pointerType !== 'touch') return;
      const sc = this.content();
      if (!sc) return;
      const pan = { id: ev.pointerId, x: ev.clientX, y: ev.clientY, left: sc.scrollLeft, top: sc.scrollTop, sx: ev.clientX, sy: ev.clientY, sc, mode: 'tap' as const, timer: 0 };
      this.pan = pan;
      pan.timer = window.setTimeout(() => {
        if (this.pan !== pan || pan.mode !== 'tap') return;
        (pan as { mode: string }).mode = 'caret';
        mf.classList.add('caret-drag');
        try { navigator.vibrate?.(10); } catch { /* bỏ qua */ }
      }, HOLD_MS);
    }, { capture: true, signal });
    mf.addEventListener('pointermove', (ev: PointerEvent) => {
      const pan = this.pan;
      if (!pan || ev.pointerId !== pan.id) return;
      const dx = ev.clientX - pan.x, dy = ev.clientY - pan.y;
      if (pan.mode === 'tap') {
        if (Math.hypot(dx, dy) < 8) return;
        clearTimeout(pan.timer);
        pan.mode = 'scroll';
      }
      ev.stopImmediatePropagation();
      ev.preventDefault();
      if (pan.mode === 'scroll') {
        pan.sc.scrollLeft = pan.left - dx;
        pan.sc.scrollTop = pan.top - dy;
        return;
      }
      while (ev.clientX - pan.sx >= STEP_X) { mf.executeCommand('moveToNextChar'); pan.sx += STEP_X; }
      while (pan.sx - ev.clientX >= STEP_X) { mf.executeCommand('moveToPreviousChar'); pan.sx -= STEP_X; }
      while (ev.clientY - pan.sy >= STEP_Y) { mf.executeCommand('moveDown'); pan.sy += STEP_Y; }
      while (pan.sy - ev.clientY >= STEP_Y) { mf.executeCommand('moveUp'); pan.sy -= STEP_Y; }
      this.lastPointer = 0;
      this.keepCaretVisible();
    }, { capture: true, signal });
    mf.addEventListener('contextmenu', (ev: Event) => { if (this.pan) ev.preventDefault(); }, { signal });
    const endPan = (ev: PointerEvent) => {
      const pan = this.pan;
      if (!pan || ev.pointerId !== pan.id) return;
      clearTimeout(pan.timer);
      if (pan.mode !== 'tap') { ev.stopImmediatePropagation(); ev.preventDefault(); }
      mf.classList.remove('caret-drag');
      this.pan = null;
    };
    mf.addEventListener('pointerup', endPan, { capture: true, signal });
    mf.addEventListener('pointercancel', endPan, { capture: true, signal });

    // Chạm / bấm (không kéo) vào vùng trống: đặt con trỏ vào đúng dòng gần nhất (xem snapCaret). Vuốt hoặc kéo con trỏ thì
    // endPan đã chặn sự kiện này; kéo chuột để bôi đen thì có di chuyển nên bỏ qua.
    let down: { x: number; y: number } | null = null;
    mf.addEventListener('pointerdown', (ev: PointerEvent) => { down = { x: ev.clientX, y: ev.clientY }; }, { capture: true, signal });
    mf.addEventListener('pointerup', (ev: PointerEvent) => {
      const start = down;
      down = null;
      if (!start || Math.hypot(ev.clientX - start.x, ev.clientY - start.y) > 6) return;
      const { clientX: x, clientY: y } = ev;
      setTimeout(() => { if (mf.selectionIsCollapsed) this.snapCaret(x, y); }, 0); // sau khi MathLive tự đặt con trỏ
    }, { capture: true, signal });
  }

  /**
   * Chạm vào chỗ không có chữ (bên phải một dòng ngắn, lề trái, giữa hai dòng…) thì MathLive chỉ đặt con trỏ trước/sau cả khung
   * nhiều dòng. Ở đây: chọn dòng gần chỗ chạm nhất theo chiều dọc; chạm bên phải dòng → cuối dòng, bên trái → đầu dòng, còn lại
   * → cạnh chữ gần nhất. Chạm trúng chữ thì giữ kết quả của MathLive (đã chính xác).
   */
  private snapCaret(x: number, y: number): void {
    const mf = this.mf;
    const latex = mf?.shadowRoot?.querySelector('.ML__content .ML__latex') as HTMLElement | null;
    if (!latex) return;
    const glyphs = Array.from(latex.querySelectorAll('span'))
      .filter((s) => !s.children.length && (s.textContent ?? '').trim() && !s.closest('.ML__caret'))
      .map((s) => s.getBoundingClientRect())
      .filter((r) => r.width > 0 && r.height > 0);
    if (!glyphs.length) return;
    if (glyphs.some((r) => x >= r.left - 2 && x <= r.right + 2 && y >= r.top - 2 && y <= r.bottom + 2)) return;
    // Gom chữ thành các dòng theo vị trí dọc. Bỏ qua ký tự cao bất thường (ngoặc { của hệ, ∫, ∑…): chúng trùm nhiều dòng.
    const heights = glyphs.map((r) => r.height).sort((a, b) => a - b);
    const normal = heights[Math.floor(heights.length / 2)] * 1.8;
    const rows: { top: number; bottom: number; items: DOMRect[] }[] = [];
    for (const r of glyphs.filter((g) => g.height <= normal).sort((a, b) => a.top - b.top)) {
      const cy = (r.top + r.bottom) / 2;
      const row = rows.find((w) => cy >= w.top && cy <= w.bottom);
      if (row) { row.items.push(r); row.top = Math.min(row.top, r.top); row.bottom = Math.max(row.bottom, r.bottom); }
      else rows.push({ top: r.top, bottom: r.bottom, items: [r] });
    }
    if (!rows.length) return;
    const dist = (w: { top: number; bottom: number }) => (y < w.top ? w.top - y : y > w.bottom ? y - w.bottom : 0);
    const row = rows.reduce((a, b) => (dist(b) < dist(a) ? b : a));
    row.items.sort((a, b) => a.left - b.left);
    const first = row.items[0], last = row.items[row.items.length - 1];
    const mid = (r: DOMRect) => (r.left + r.right) / 2;
    let target: DOMRect;
    let bias: -1 | 1;
    if (x <= first.left) { target = first; bias = -1; }
    else if (x >= last.right) { target = last; bias = 1; }
    else {
      target = row.items.reduce((a, b) => (Math.abs(mid(b) - x) < Math.abs(mid(a) - x) ? b : a));
      bias = x < mid(target) ? -1 : 1;
    }
    const offset = mf.getOffsetFromPoint(mid(target), (target.top + target.bottom) / 2, { bias });
    if (typeof offset === 'number' && offset >= 0) mf.position = offset;
  }

  // ---------- Xuống dòng / xoá dòng ----------

  private caretToMark(): void {
    const mf = this.mf;
    for (let p = 0; p <= mf.lastOffset; p++) {
      if (mf.getValue(p, p + 1, 'latex') === MARK) { mf.position = p + 1; this.rawDelete(); return; }
    }
  }

  private newline(): void {
    const mf = this.mf;
    mf.focus();
    if (!String(mf.value).trim()) return;
    this.quietly(() => {
      if (!mf.selectionIsCollapsed) mf.executeCommand('deleteBackward');
      mf.insert(MARK, { selectionMode: 'after' });
      const next = splitLineAtMark(mf.getValue('latex'));
      if (next == null) return;
      mf.value = next;
      this.caretToMark();
    });
    this.updateInsertState();
  }

  private joinLineBackward(): boolean {
    const mf = this.mf;
    if (!mf.selectionIsCollapsed || !/\\begin\{/.test(mf.value)) return false;
    let joined = false;
    this.quietly(() => {
      mf.insert(MARK, { selectionMode: 'after' });
      const next = joinLineAtMark(mf.getValue('latex'));
      if (next == null) { this.rawDelete(); return; }
      mf.value = next;
      this.caretToMark();
      joined = true;
    });
    if (joined) this.updateInsertState();
    return joined;
  }

  // ---------- Hoàn tác / làm lại ----------

  /** Chạy một thao tác gồm nhiều bước của MathLive, chỉ lưu kết quả cuối vào lịch sử. */
  private quietly(run: () => void): void {
    const h = this.history;
    const was = h.quiet;
    h.quiet = true;
    try { run(); } finally { h.quiet = was; }
    this.record();
  }

  private record(): void {
    const h = this.history, mf = this.mf;
    if (h.quiet || !mf || h.index < 0) return;
    const latex = mf.value, pos = mf.position;
    if (h.states[h.index].latex === latex) { h.states[h.index].pos = pos; return; }
    // Vừa thêm rồi bỏ ngay (vd. bật rồi tắt U khi chưa gõ gì): coi như chưa từng có
    if (h.index > 0 && h.states[h.index - 1].latex === latex) { h.states.length = h.index--; return; }
    h.states.length = h.index + 1;
    h.states.push({ latex, pos });
    if (h.states.length > 300) h.states.shift();
    h.index = h.states.length - 1;
  }

  private stepHistory(dir: -1 | 1): void {
    const h = this.history, mf = this.mf;
    const target = h.states[h.index + dir];
    if (!mf || !target) return;
    h.index += dir;
    h.quiet = true;
    try {
      mf.focus();
      mf.value = target.latex;
      mf.position = Math.min(target.pos, mf.lastOffset);
    } finally { h.quiet = false; }
    // Khung gạch chân đang mở có thể vừa bị bỏ đi: tắt công tắc U cho khỏi lệch
    if (this.fmt.underline) { this.fmt.underlineFrom = this.fmt.underlineValue = null; this.setFormat('underline', false); }
    this.updateInsertState();
    this.scheduleCaret();
  }

  // ---------- In đậm / gạch chân (công tắc) ----------
  // B: nhớ vị trí lúc bật, mỗi lần gõ thì in đậm lại cả đoạn từ đó tới con trỏ (MathLive chỉ giữ kiểu cho 1 ký tự).
  // U: bật thì chèn khung \underline{…} và gõ vào trong; tắt thì đưa con trỏ ra hẳn ngoài khung.

  private setFormat(name: 'bold' | 'underline', on: boolean): void {
    this.fmt[name] = on;
    this.fmtRef.nativeElement.querySelector(`[data-fmt="${name}"]`)?.setAttribute('aria-pressed', String(on));
  }

  private resetFormat(): void {
    this.setFormat('bold', false);
    this.setFormat('underline', false);
    this.fmt.boldFrom = this.fmt.underlineFrom = this.fmt.underlineValue = null;
  }

  private applyBold(): void {
    const f = this.fmt, mf = this.mf;
    if (!f.bold || f.boldFrom == null || this.styling) return;
    const pos = mf.position;
    f.boldFrom = Math.min(f.boldFrom, pos);
    if (pos <= f.boldFrom) return;
    this.styling = true;
    try { mf.applyStyle({ variantStyle: 'bold' }, { range: [f.boldFrom, pos], operation: 'set' }); } finally { this.styling = false; }
  }

  private toggleFormat(name: 'bold' | 'underline'): void {
    const mf = this.mf, f = this.fmt;
    mf.focus();
    if (name === 'underline' && f.underline) {
      if (mf.value === f.underlineValue) mf.executeCommand('undo');
      else for (let i = 0; i < 12 && !isWholeUnderline(mf.getValue(f.underlineFrom, mf.position, 'latex')); i++) mf.executeCommand('moveAfterParent');
      f.underlineFrom = f.underlineValue = null;
      this.setFormat('underline', false);
    } else if (name === 'bold' && f.bold) {
      mf.applyStyle({ variantStyle: '' });
      f.boldFrom = null;
      this.setFormat('bold', false);
    } else if (!mf.selectionIsCollapsed) {
      if (name === 'bold') mf.applyStyle({ variantStyle: 'bold' }, { operation: 'toggle' });
      else mf.executeCommand(['insert', '\\underline{#@}', { selectionMode: 'after' }]);
    } else if (name === 'bold') {
      f.boldFrom = mf.position;
      mf.applyStyle({ variantStyle: 'bold' });
      this.setFormat('bold', true);
    } else {
      f.underlineFrom = mf.position;
      mf.executeCommand(['insert', '\\underline{#?}', { selectionMode: 'placeholder' }]);
      f.underlineValue = mf.value;
      this.setFormat('underline', true);
    }
    this.record();
    this.updateInsertState();
  }
}
