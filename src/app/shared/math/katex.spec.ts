import { loadKatex, renderFormula, spaceRows } from './katex';

const R = String.raw;

describe('spaceRows (hiển thị nhiều dòng / hệ không đè nhau)', () => {
  it('nhiều dòng: array {l} → aligned canh trái', () => {
    expect(spaceRows(R`\begin{array}{l}a=\frac{1}{2}\\ b=\frac{3}{4}\end{array}`))
      .toBe(R`\begin{aligned}&a=\frac{1}{2}\\& b=\frac{3}{4}\end{aligned}`);
  });

  it('hệ: cases → ngoặc nhọn + aligned', () => {
    expect(spaceRows(R`\begin{cases}x+y=3\\x-y=1\end{cases}`))
      .toBe(R`\left\{\begin{aligned}&x+y=3\\&x-y=1\end{aligned}\right.`);
  });

  it('lồng nhau: hệ trong một dòng của công thức nhiều dòng; hoặc (gathered) giữ nguyên', () => {
    expect(spaceRows(R`\begin{array}{l}\begin{cases}x=1\\y=2\end{cases}\\ \left[\begin{gathered}a\\b\end{gathered}\right.\end{array}`))
      .toBe(R`\begin{aligned}&\left\{\begin{aligned}&x=1\\&y=2\end{aligned}\right.\\& \left[\begin{gathered}a\\b\end{gathered}\right.\end{aligned}`);
  });

  it('không có nhiều dòng thì giữ nguyên, kể cả \\{ và array khác {l}', () => {
    for (const s of [R`\left\{x\right\}`, R`x^2+\frac{1}{2}`, R`\begin{array}{cc}1&2\\3&4\end{array}`]) expect(spaceRows(s)).toBe(s);
  });

  it('KaTeX vẽ được và hai dòng có phân số không đè nhau', async () => {
    const katex = await loadKatex();
    const el = document.createElement('span');
    document.body.appendChild(el);
    renderFormula(katex, el, R`\begin{array}{l}a=\frac{1}{2}\\ b=\frac{3}{4}\end{array}`);
    expect(el.querySelector('.katex-error')).toBeNull();
    const [f1, f2] = Array.from(el.querySelectorAll('.mfrac'));
    // Mẫu số của phân số trên (chữ 2) phải ở trên tử số của phân số dưới (chữ 3)
    const glyph = (f: Element, t: string) => Array.from(f.querySelectorAll('.mord')).find((e) => e.textContent === t)!.getBoundingClientRect();
    const g2 = glyph(f1, '2'), g3 = glyph(f2, '3');
    expect(g3.top + g3.height * 0.2).toBeGreaterThan(g2.bottom - g2.height * 0.2); // chừa phần đệm trên dưới của ô chữ
    el.remove();
  });
});
