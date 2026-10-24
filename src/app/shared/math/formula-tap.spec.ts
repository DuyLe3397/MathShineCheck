import { TestBed } from '@angular/core/testing';
import { FormulaEditorService } from './formula-editor.service';

// Bấm / chạm để đặt con trỏ trong Bảng soạn công thức (component thật, styles.scss của app đã được nạp):
// - chạm trúng chữ: MathLive tự đặt con trỏ (chỉ chạy khi ô soạn có user-select: text — styles.scss đặt none cho mọi phần tử)
// - chạm vùng trống: snapCaret đặt vào dòng gần nhất.
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
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const MARK = '\\text{¶}';

function fire(mf: Mf, type: string, x: number, y: number, pointerType: string): void {
  const target = (mf.shadowRoot.elementFromPoint(x, y) as Element | null) ?? mf;
  target.dispatchEvent(new PointerEvent(type, {
    bubbles: true, composed: true, cancelable: true, clientX: x, clientY: y,
    pointerId: 7, pointerType, isPrimary: true, button: 0, buttons: type === 'pointerup' ? 0 : 1,
  }));
}

describe('Bảng soạn công thức: chạm để đặt con trỏ', () => {
  let ta: HTMLTextAreaElement;
  let mf: Mf;

  beforeEach(async () => {
    // Sự kiện chạm tạo bằng code không gắn với con trỏ thật: MathLive gọi set/releasePointerCapture sẽ báo lỗi
    spyOn(Element.prototype, 'setPointerCapture');
    spyOn(Element.prototype, 'releasePointerCapture');
    ta = document.createElement('textarea');
    document.body.appendChild(ta);
    TestBed.inject(FormulaEditorService).open(ta);
    mf = await waitFor(() => document.querySelector('math-field.fe-mf'));
    await waitFor(() => (document.querySelector('formula-editor .fe-hint')?.textContent || '').startsWith('Gõ'));
  });

  afterEach(async () => {
    document.querySelector<HTMLElement>('formula-editor .fe-cancel')?.dispatchEvent(new MouseEvent('click'));
    await sleep(400);
    ta.remove();
  });

  const glyph = (ch: string) => {
    const c = mf.shadowRoot.querySelector('.ML__content');
    const s = Array.from(c.querySelectorAll('span') as NodeListOf<HTMLElement>).find((e) => !e.children.length && e.textContent?.trim() === ch)!;
    return { r: s.getBoundingClientRect(), box: c.getBoundingClientRect() };
  };
  const tapAt = async (x: number, y: number, pointerType: string) => {
    fire(mf, 'pointerdown', x, y, pointerType);
    await sleep(30);
    fire(mf, 'pointerup', x, y, pointerType);
    await sleep(200);
    mf.insert(MARK);
    return mf.getValue('latex') as string;
  };

  it('ô soạn không bị user-select: none (nếu không MathLive bỏ qua thao tác chạm)', () => {
    expect(getComputedStyle(mf).userSelect).not.toBe('none');
  });

  for (const pointerType of ['touch', 'mouse']) {
    it(`${pointerType}: chạm nửa trái chữ "b" → con trỏ trước "b"`, async () => {
      mf.value = 'abc+xyz=12345';
      mf.executeCommand('moveToMathfieldEnd');
      await sleep(300);
      const { r } = glyph('b');
      expect(await tapAt(r.left + r.width * 0.25, r.top + r.height / 2, pointerType)).toBe('a' + MARK + 'bc+xyz=12345');
    });

    it(`${pointerType}: chạm vùng trống bên phải dòng 2 → cuối dòng 2`, async () => {
      mf.value = String.raw`\begin{array}{l}abcdefgh+1\\ x=2\\ y\end{array}`;
      await sleep(300);
      const { r, box } = glyph('2');
      expect(await tapAt(Math.min(box.right - 12, r.right + 50), r.top + r.height / 2, pointerType)).toContain('x=2' + MARK);
    });
  }
});
