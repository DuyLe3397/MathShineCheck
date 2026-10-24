// Vẽ Công thức bằng KaTeX. KaTeX chỉ được tải khi trang thật sự có công thức (import động, chunk riêng).
import type katexType from 'katex';

type Katex = typeof katexType;
let katexPromise: Promise<Katex> | null = null;

export function loadKatex(): Promise<Katex> {
  katexPromise ??= import('katex').then((m) => (m as unknown as { default?: Katex }).default ?? (m as unknown as Katex));
  return katexPromise;
}

// Lệnh riêng của MathLive mà KaTeX không biết; \frac → \dfrac để phân số luôn lớn như Casio,
// kể cả trong khung nhiều dòng / hệ (ở đó \displaystyle bên ngoài không có tác dụng).
const MACROS: Record<string, string> = {
  '\\differentialD': '\\mathrm{d}',
  '\\exponentialE': '\\mathrm{e}',
  '\\imaginaryI': '\\mathrm{i}',
  '\\placeholder': '\\square',
  '\\frac': '\\dfrac',
};

/**
 * Chỉ dùng khi hiển thị (dữ liệu lưu giữ nguyên): KaTeX đặt các dòng của array / cases cách đều một khoảng cố định,
 * không tính chiều cao từng dòng, nên dòng có phân số đè lên dòng sau. aligned có đo nên đổi sang aligned, mỗi dòng
 * mở đầu bằng & để canh trái như cũ; hệ giữ ngoặc nhọn bằng \left\{ … \right.
 */
export function spaceRows(latex: string): string {
  const stack: string[] = [];
  let out = '';
  for (let i = 0; i < latex.length; ) {
    const rest = latex.slice(i);
    const begin = /^\\begin\{(\w+\*?)\}(\{l\})?/.exec(rest);
    if (begin) {
      const own = (begin[1] === 'array' && begin[2]) || begin[1] === 'cases';
      stack.push(own ? begin[1] : '');
      out += !own ? begin[0] : begin[1] === 'cases' ? '\\left\\{\\begin{aligned}&' : '\\begin{aligned}&';
      i += begin[0].length;
      continue;
    }
    const end = /^\\end\{(\w+\*?)\}/.exec(rest);
    if (end) {
      const top = stack.pop();
      out += top === 'cases' ? '\\end{aligned}\\right.' : top ? '\\end{aligned}' : end[0];
      i += end[0].length;
      continue;
    }
    if (rest.startsWith('\\\\')) {
      // Xuống dòng, có thể kèm khoảng cách [..]: dòng mới của aligned cũng mở đầu bằng &
      const row = /^\\\\(\s*\[[^\]]*\])?/.exec(rest)![0];
      out += row + (stack.at(-1) ? '&' : '');
      i += row.length;
      continue;
    }
    // Giữ nguyên các lệnh khác (kể cả \{ \& …) để không nhầm với ký tự đặc biệt
    const cmd = /^\\(?:[A-Za-z]+|.)/.exec(rest);
    const tok = cmd ? cmd[0] : latex[i];
    out += tok;
    i += tok.length;
  }
  return out;
}

const options = (throwOnError: boolean) => ({
  throwOnError,
  trust: false,
  strict: 'ignore' as const,
  maxSize: 8,
  maxExpand: 300,
  macros: { ...MACROS },
});

export function renderFormula(katex: Katex, el: HTMLElement, latex: string): void {
  katex.render('\\displaystyle ' + spaceRows(latex), el, options(false));
}

/** Công thức có vẽ được không (cùng cách vẽ như khi hiển thị). */
export function canRender(katex: Katex, latex: string): boolean {
  try {
    katex.renderToString('\\displaystyle ' + spaceRows(latex), options(true));
    return true;
  } catch {
    return false;
  }
}
