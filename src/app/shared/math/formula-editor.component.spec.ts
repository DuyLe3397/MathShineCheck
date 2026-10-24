import { TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { FormulaEditorService } from './formula-editor.service';
import { MathTextComponent } from './math-text.component';

// Chạy thật MathLive trong trình duyệt của Karma: mở Bảng soạn cho một ô chữ, soạn, bấm Chèn, kiểm tra ô chữ.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Mf = any;

const waitFor = async <T>(fn: () => T | null | undefined, ms = 15000): Promise<T> => {
  const t0 = Date.now();
  for (;;) {
    const v = fn();
    if (v) return v;
    if (Date.now() - t0 > ms) throw new Error('hết thời gian chờ');
    await new Promise((r) => setTimeout(r, 50));
  }
};

describe('FormulaEditor (MathLive thật)', () => {
  let textarea: HTMLTextAreaElement;
  let service: FormulaEditorService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(FormulaEditorService);
    textarea = document.createElement('textarea');
    textarea.value = 'Đáp số ';
    document.body.appendChild(textarea);
  });

  afterEach(() => {
    textarea.remove();
    document.querySelector('formula-editor .fe-cancel')?.dispatchEvent(new MouseEvent('click'));
  });

  it('soạn công thức, xuống dòng rồi Chèn vào chỗ con trỏ', async () => {
    let inputs = 0;
    textarea.addEventListener('input', () => inputs++);
    textarea.setSelectionRange(textarea.value.length, textarea.value.length);
    service.open(textarea);
    const mf: Mf = await waitFor(() => document.querySelector('math-field.fe-mf'));
    await waitFor(() => (document.querySelector('formula-editor .fe-hint')?.textContent || '').startsWith('Gõ'));
    mf.value = 'x+1=2';
    mf.executeCommand('moveToMathfieldEnd');
    mf.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, composed: true }));
    expect(mf.value).toContain('\\begin{array}{l}x+1=2\\\\');
    mf.insert('y=3');
    const insert = document.querySelector<HTMLButtonElement>('formula-editor .fe-insert')!;
    await waitFor(() => !insert.disabled);
    await new Promise((r) => setTimeout(r, 400)); // qua thời gian chống bấm nhầm sau khi bàn phím đổi cỡ
    insert.click();
    expect(textarea.value).toMatch(/^Đáp số \\\(\\begin\{array\}\{l\}x\+1=2\\\\ ?y=3\\end\{array\}\\\)$/);
    expect(inputs).toBe(1);
    expect(document.querySelector<HTMLElement>('formula-editor .fe-sheet')!.hidden).toBeTrue();
  });

  it('↶ ↷ lùi / tiến từng lần gõ, xuống dòng chỉ là một bước (không lộ dấu ¶)', async () => {
    service.open(textarea);
    const mf: Mf = await waitFor(() => document.querySelector('math-field.fe-mf'));
    await waitFor(() => (document.querySelector('formula-editor .fe-hint')?.textContent || '').startsWith('Gõ'));
    const nav = (n: string) => document.querySelector(`formula-editor [data-nav="${n}"]`)!.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
    // Lệnh chèn gọi từ code không phát 'input' như khi gõ thật nên phát kèm
    const type = (c: string) => { mf.executeCommand(['insert', c]); mf.dispatchEvent(new Event('input')); };
    for (const c of ['x', '+', '1']) type(c);
    mf.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, composed: true }));
    const afterEnter = mf.value;
    type('y');
    const seen: string[] = [];
    for (let i = 0; i < 5; i++) { nav('undo'); seen.push(mf.value); }
    expect(seen).toEqual([afterEnter, 'x+1', 'x+', 'x', '']);
    nav('redo'); nav('redo');
    expect(mf.value).toBe('x+');
    type('2');
    nav('redo'); // gõ mới thì bỏ nhánh "tương lai" cũ
    expect(mf.value).toBe('x+2');
    document.dispatchEvent(new PointerEvent('pointerup'));
  });

  it('bấm f(x) khi con trỏ nằm trong một công thức thì sửa công thức đó', async () => {
    textarea.value = String.raw`a \(x^2\) b`;
    textarea.setSelectionRange(5, 5);
    service.open(textarea);
    const mf: Mf = await waitFor(() => document.querySelector('math-field.fe-mf'));
    await waitFor(() => mf.value === 'x^2' || null);
    expect(document.querySelector('formula-editor .fe-insert')!.textContent).toBe('Lưu');
  });
});

@Component({ standalone: true, imports: [MathTextComponent], template: `<div style="white-space: pre-wrap"><math-text [text]="text" /></div>` })
class HostComponent {
  text = String.raw`Đáp số \(\frac{1}{2}\) nhé`;
}

describe('MathTextComponent', () => {
  it('vẽ công thức bằng KaTeX, chữ giữ nguyên', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    await waitFor(() => el.querySelector('.katex'));
    expect(el.textContent).toContain('Đáp số');
    expect(el.querySelector('.f .katex .mfrac')).not.toBeNull();
  });

  it('nội dung cũ không có công thức hiện y như trước', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.componentInstance.text = 'x² − 4 ≥ 0, giá $5';
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent.trim()).toBe('x² − 4 ≥ 0, giá $5');
    expect(fixture.nativeElement.querySelector('.f')).toBeNull();
  });

  it('Xem trước: ô nền phủ kín công thức cao (phân số, hệ), kể cả công thức dài phải xuống dòng', async () => {
    const fixture = TestBed.createComponent(EditableHostComponent);
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    document.body.appendChild(el);
    await waitFor(() => el.querySelector('.f-box'));
    await document.fonts.ready; // font KaTeX tải xong thì ô nền được vẽ lại theo cỡ thật
    await new Promise((r) => setTimeout(r, 100));
    const boxes = Array.from(el.querySelectorAll('.f-box'), (b) => b.getBoundingClientRect());
    const bases = Array.from(el.querySelectorAll('.katex-html > .katex-base'), (b) => b.getBoundingClientRect());
    const inside = (b: DOMRect) => boxes.some((x) => b.left >= x.left - 0.5 && b.right <= x.right + 0.5 && b.top >= x.top - 0.5 && b.bottom <= x.bottom + 0.5);
    expect(bases.length).toBeGreaterThan(3);
    expect(bases.filter((b) => !inside(b)).map((b) => JSON.stringify(b))).withContext(JSON.stringify(boxes)).toEqual([]);
    expect(boxes.length).toBeGreaterThan(3); // công thức dài tách thành nhiều ô, mỗi dòng một ô
    expect(Math.max(...boxes.map((b) => b.height))).toBeGreaterThan(40); // ô cao theo công thức, không chỉ bằng dòng chữ
    el.remove();
  });
});

@Component({
  standalone: true,
  imports: [MathTextComponent],
  template: `<div class="formula-preview" style="width: 240px"><math-text [text]="text" [editable]="true" /></div>`,
})
class EditableHostComponent {
  text = String.raw`Ta có \(\frac{x+1}{2x-3}\) và \(\begin{cases}x+y=3\\x-y=1\end{cases}\) rồi \(\frac{1}{2}+\frac{2}{3}+\frac{3}{4}+\frac{4}{5}+\frac{5}{6}+\frac{6}{7}=k\) hết.`;
}
