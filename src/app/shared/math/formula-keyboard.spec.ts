import { FORMULA_LAYOUTS, duplicateKeys, isBackspaceKey, isNewlineKey, rowWidths, systemLatex } from './formula-keyboard';

describe('formula-keyboard', () => {
  it('mỗi ký hiệu chỉ có ở một tab', () => {
    expect(duplicateKeys()).toEqual([]);
  });

  it('mọi tab đều 4 hàng, mỗi hàng không quá 10 đơn vị bề ngang', () => {
    for (const l of FORMULA_LAYOUTS) expect(l.rows.length).withContext(l.label).toBe(4);
    for (const widths of rowWidths()) for (const w of widths) expect(w).toBeLessThanOrEqual(10.5);
  });

  it('ở mọi tab, ⌫ ở ô cuối hàng 1, ↵ ngay dưới ở ô cuối hàng 2, ← → ở hai ô cuối hàng 4', () => {
    rowWidths().forEach((widths, i) => {
      const { label, rows } = FORMULA_LAYOUTS[i];
      expect(isBackspaceKey(rows[0].at(-1))).withContext(`${label}: ⌫`).toBeTrue();
      expect(isNewlineKey(rows[1].at(-1))).withContext(`${label}: ↵`).toBeTrue();
      expect(rows[3].slice(-2)).withContext(label).toEqual(['[left]', '[right]']);
      // Hàng đủ 10 ô thì phím cuối hàng nằm cùng cột ở mọi tab
      for (const r of [0, 1, 3]) expect(widths[r]).withContext(`${label} hàng ${r + 1}`).toBe(10);
      rows.forEach((row, r) => {
        const others = r === 3 ? row.slice(0, -2) : r < 2 ? row.slice(0, -1) : row;
        expect(others.some((k) => k === '[left]' || k === '[right]' || k === '[backspace]' || isBackspaceKey(k) || isNewlineKey(k)))
          .withContext(`${label} hàng ${r + 1}`).toBeFalse();
      });
    });
  });

  it('systemLatex dựng hệ / hoặc n dòng', () => {
    expect(systemLatex('cases', 2)).toBe(String.raw`\begin{cases}#?\\#?\end{cases}`);
    expect(systemLatex('or', 3)).toBe(String.raw`\left[\begin{gathered}#?\\#?\\#?\end{gathered}\right.`);
  });
});
