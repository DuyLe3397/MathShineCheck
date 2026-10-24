import { formulaAt, hasFormula, latexToLine, splitFormulas, toPlainText } from './math-text';

describe('math-text', () => {
  describe('splitFormulas', () => {
    it('tách chữ và công thức kèm vị trí trong chuỗi gốc', () => {
      const text = String.raw`Đáp số \(\frac{1}{2}\) nhé`;
      const segs = splitFormulas(text);
      expect(segs.map((s) => s.kind)).toEqual(['text', 'formula', 'text']);
      const f = segs[1];
      expect(f.kind === 'formula' && f.latex).toBe(String.raw`\frac{1}{2}`);
      expect(text.slice(f.start, f.end)).toBe(String.raw`\(\frac{1}{2}\)`);
    });

    it('nội dung cũ không có công thức thì chỉ có một đoạn chữ', () => {
      const old = 'x² − 4 ≥ 0, giá 5$';
      expect(splitFormulas(old)).toEqual([{ kind: 'text', start: 0, end: old.length, value: old }]);
      expect(hasFormula('giá $5 và $6')).toBeFalse();
    });
  });

  it('formulaAt tìm công thức chứa con trỏ', () => {
    const text = String.raw`a \(x+1\) b`;
    expect(formulaAt(text, 5)?.latex).toBe('x+1');
    expect(formulaAt(text, 0)).toBeNull();
  });

  describe('latexToLine', () => {
    const cases: [string, string][] = [
      [String.raw`\frac{x+1}{2x-3}`, '(x+1)/(2x−3)'],
      [String.raw`\sqrt{x^{2}+1}`, '√(x²+1)'],
      [String.raw`\int_{0}^{1}\left(x^{2}+1\right)\,dx=\frac{4}{3}`, '∫₀¹(x²+1)dx=4/3'],
      [String.raw`\lim_{x\to+\infty}\frac{2x+1}{x-3}=2`, 'lim(x→+∞) (2x+1)/(x−3)=2'],
      [String.raw`\begin{cases}x+y=3\\2x-y=0\end{cases}`, '{ x+y=3; 2x−y=0 }'],
      [String.raw`\left[\begin{gathered}x=1\\x=2\end{gathered}\right.`, '[ x=1; x=2 ]'],
      [String.raw`\overrightarrow{AB}`, 'vt AB'],
      [String.raw`\widehat{ABC}=60^{\circ}`, 'góc ABC=60°'],
      [String.raw`\mathrm{C}_{n}^{k}`, 'Cₙᵏ'],
      [String.raw`\begin{array}{l}x^2-4x+3=0\\ \mathstrut x=1\end{array}`, 'x²−4x+3=0\nx=1'],
      [String.raw`\mathbf{xy}+\underline{z1}`, 'xy+z1'],
    ];
    for (const [latex, line] of cases) it(`${latex} → ${line}`, () => expect(latexToLine(latex)).toBe(line));
  });

  it('toPlainText thay mỗi công thức bằng một dòng chữ', () => {
    expect(toPlainText(String.raw`Câu 3: \(\frac{1}{2}\) đúng không?`)).toBe('Câu 3: 1/2 đúng không?');
    expect(toPlainText('chữ thường')).toBe('chữ thường');
    expect(toPlainText(undefined)).toBe('');
  });
});
