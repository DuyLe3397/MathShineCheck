// Bàn phím ảo của Bảng soạn công thức (MathLive), thiết kế cho Toán 10–12.
// - Mọi tab 4 hàng để bàn phím không đổi chiều cao khi chuyển tab; mỗi hàng tối đa 10 ô.
// - Phím điều khiển nằm cố định, cùng một chỗ ở mọi tab để học sinh dễ bấm:
//     ⌫ ở ô cuối hàng 1, ↵ (xuống dòng) ngay dưới nó ở ô cuối hàng 2, ← → ở hai ô cuối hàng 4.
//   Hàng 1, 2, 4 đủ đúng 10 ô để các phím này thẳng cột giữa các tab — xem formula-keyboard.spec.ts.
// - Mỗi ký hiệu chỉ có ở một tab (trừ phím điều khiển) — xem duplicateKeys().
// - Phím chứa ký hiệu rộng (lim, ∫ có cận, log, ∑) được nới rộng thay vì thu nhỏ.

type Keycap = string | { latex?: string; insert?: string; label?: string; class?: string; width?: number; command?: string; shift?: Keycap };
export interface KeyboardLayout {
  label: string;
  rows: Keycap[][];
}

const wide = (latex: string, width = 1.5): Keycap => ({ latex, width });
// Tab abc là chữ cái thường (chữ đứng), không phải biến toán in nghiêng
const letter = (c: string): Keycap => ({ latex: `\\mathrm{${c}}`, class: 'mk-big', shift: { latex: `\\mathrm{${c.toUpperCase()}}`, class: 'mk-big' } });
const greek = (names: string): Keycap[] => names.split(' ').map((n) => ({ latex: '\\' + n, class: 'mk-big' }));
// Nhãn hai dòng cho phím Hệ / Hoặc: chữ ở trên, số dòng ở dưới, để vừa một ô
const stack = (word: string, n: number | string) => `<span class="mk-stack">${word}<b>${n}</b></span>`;

/** Hệ (ngoặc nhọn) hoặc "hoặc" (ngoặc vuông) gồm n dòng, mỗi dòng một ô trống. */
export function systemLatex(kind: 'cases' | 'or', n: number): string {
  const rows = Array(n).fill('#?').join('\\\\');
  return kind === 'cases' ? `\\begin{cases}${rows}\\end{cases}` : `\\left[\\begin{gathered}${rows}\\end{gathered}\\right.`;
}

/** Phím Hệ n / Hoặc n: được chặn trước khi MathLive xử lý để hỏi số dòng. */
export const PICK_CLASS = 'mk-pick';
/** Phím ↵ xuống dòng: được chặn trước khi MathLive xử lý để chạy xuống dòng của Bảng soạn (cắt dòng tại con trỏ). */
export const NEWLINE_CLASS = 'mk-newline';

type KeycapObject = Exclude<Keycap, string>;
// ⌫ rộng 1 ô (phím [backspace] có sẵn của MathLive rộng 1,5 ô) để thẳng cột với ↵ ở mọi tab. Cùng lệnh và biểu tượng với phím gốc.
const BACKSPACE: KeycapObject = {
  class: 'action',
  width: 1,
  command: 'performWithFeedback(deleteBackward)',
  label: '<svg class="svg-glyph"><use xlink:href="#svg-delete-backward" /></svg>',
};
// ↵ vẽ bằng nét dày (ký tự ↵ của font quá mảnh so với ⌫ ← →)
const NEWLINE: KeycapObject = {
  class: `action ${NEWLINE_CLASS}`,
  width: 1,
  insert: ' ',
  label: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M19 5v6a3 3 0 0 1-3 3H5"/><path d="M9 9.5 4.5 14 9 18.5"/></svg>',
};

const R = String.raw;
export const FORMULA_LAYOUTS: KeyboardLayout[] = [
  { label: 'Cơ bản', rows: [
    [R`\frac{#@}{#?}`, R`#@^{2}`, R`#@^{#?}`, R`\sqrt{#0}`, R`\sqrt[#?]{#0}`, R`\left|#0\right|`, '[(]', '[)]', R`\pi`, BACKSPACE],
    ['[7]', '[8]', '[9]', R`\div`, R`\times`, 'x', 'y', R`\le`, R`\ge`, NEWLINE],
    ['[4]', '[5]', '[6]', '[-]', '[+]', 'a', 'b', 'n', R`\ne`, '[=]'],
    ['[1]', '[2]', '[3]', '[0]', '[.]', '[,]', ';', R`\pm`, '[left]', '[right]'],
  ] },
  { label: 'Giải tích', rows: [
    [wide(R`\lim_{x\to#?}`), wide(R`\lim_{x\to+\infty}`, 2), wide(R`\int_{#?}^{#?}#0\,dx`, 2), wide(R`\int #0\,dx`), R`\infty`, R`\to`, BACKSPACE],
    [R`#@'`, wide(R`\log_{#?}#0`), R`\ln`, R`e^{#?}`, R`\sin`, R`\cos`, R`\tan`, wide(R`\max_{#?}`), NEWLINE],
    [
      { label: stack('Hệ', 2), latex: systemLatex('cases', 2) }, { label: stack('Hệ', 3), latex: systemLatex('cases', 3) }, { label: stack('Hệ', 'n'), class: PICK_CLASS, insert: ' ' },
      { label: stack('Hoặc', 2), latex: systemLatex('or', 2) }, { label: stack('Hoặc', 3), latex: systemLatex('or', 3) }, { label: stack('Hoặc', 'n'), class: PICK_CLASS, insert: ' ' },
      { latex: R`\textstyle\sum_{#?}^{#?}`, insert: R`\sum_{#?}^{#?}`, width: 1.5 }, wide(R`\min_{#?}`), R`\cot`,
    ],
    [wide(R`\lim_{x\to#?^{+}}`), wide(R`\lim_{x\to#?^{-}}`), wide(R`\left.#0\right|_{#?}^{#?}`), R`#@''`, wide(R`f\left(#?\right)`), R`\approx`, '[left]', '[right]'],
  ] },
  { label: 'Tập hợp', rows: [
    [R`\overrightarrow{#0}`, R`\widehat{#0}`, R`\angle`, R`\triangle`, R`\perp`, R`\parallel`, R`#@^{\circ}`, R`\cdot`, R`\overline{#0}`, BACKSPACE],
    [R`\in`, R`\notin`, R`\subset`, R`\cup`, R`\cap`, R`\emptyset`, R`\mathbb{R}`, R`\mathbb{N}`, R`\mathbb{Z}`, NEWLINE],
    [R`\mathrm{C}_{#?}^{#?}`, R`\mathrm{A}_{#?}^{#?}`, R`\mathrm{P}_{#?}`, R`#@!`, R`\forall`, R`\exists`, R`\Rightarrow`, R`\Leftrightarrow`, R`\backsim`, R`\cong`],
    [R`\subseteq`, R`\mathbb{Q}`, R`\setminus`, R`\mathbb{N}^{*}`, wide(R`\left[#?;#?\right]`), wide(R`\left(#?;#?\right)`), R`\left\{#?\right\}`, '[left]', '[right]'],
  ] },
  // abc và αβγ tự dựng, cũng 4 hàng như các tab khác (bản có sẵn của MathLive cao 5 hàng).
  // abc gần QWERTY: chỉ chữ p xuống cuối hàng 3 để chừa chỗ cho ⌫.
  { label: 'abc', rows: [
    [...[...'qwertyuio'].map(letter), BACKSPACE],
    [...[...'asdfghjkl'].map(letter), NEWLINE],
    ['[shift]', ...[...'zxcvbnmp'].map(letter)],
    [':', R`\%`, { label: 'dấu cách', insert: R`\;`, width: 5, class: 'action' }, R`\ldots`, '[left]', '[right]'],
  ] },
  { label: 'αβγ', rows: [
    [...greek('alpha beta gamma delta epsilon eta theta lambda mu'), BACKSPACE],
    [...greek('nu kappa rho sigma tau varphi chi psi omega'), NEWLINE],
    greek('Gamma Delta Theta Lambda Xi Pi Sigma Phi Psi Omega'),
    [...greek('varepsilon vartheta varrho varsigma phi Upsilon zeta xi'), '[left]', '[right]'],
  ] },
];

const CONTROL_KEYS = new Set(['[backspace]', '[left]', '[right]', '[shift]']);
const isControl = (kc: Keycap) =>
  typeof kc === 'string' ? CONTROL_KEYS.has(kc) : !!kc.command?.includes('deleteBackward') || !!kc.class?.includes(NEWLINE_CLASS);

/** Các phím bị trùng giữa các tab (phải rỗng). */
export function duplicateKeys(layouts: KeyboardLayout[] = FORMULA_LAYOUTS): string[] {
  const seen = new Map<string, string>();
  const dups: string[] = [];
  for (const layout of layouts) for (const row of layout.rows) for (const kc of row) {
    if (isControl(kc)) continue;
    // Hệ n / Hoặc n không chèn gì (mở hộp chọn số dòng) nên phân biệt theo nhãn
    const id = typeof kc === 'string' ? kc : kc.class === PICK_CLASS ? kc.label ?? '' : (kc.insert ?? kc.latex ?? kc.label ?? '');
    const prev = seen.get(id);
    if (prev) dups.push(`${id} (${prev} & ${layout.label})`);
    else seen.set(id, layout.label);
  }
  return dups;
}

/** Tổng bề ngang (số ô) của từng hàng. */
export function rowWidths(layouts: KeyboardLayout[] = FORMULA_LAYOUTS): number[][] {
  // Phím [backspace] có sẵn của MathLive rộng 1,5 ô; các phím khác mặc định 1 ô
  const w = (k: Keycap) => (typeof k === 'string' ? (k === '[backspace]' ? 1.5 : 1) : k.width ?? 1);
  return layouts.map((l) => l.rows.map((r) => r.reduce((s, k) => s + w(k), 0)));
}

/** Phím ở ô cuối của một hàng là ⌫ / ↵ (dùng cho test vị trí cố định). */
export const isBackspaceKey = (kc: Keycap | undefined) => !!kc && typeof kc !== 'string' && !!kc.command?.includes('deleteBackward');
export const isNewlineKey = (kc: Keycap | undefined) => !!kc && typeof kc !== 'string' && !!kc.class?.includes(NEWLINE_CLASS);
