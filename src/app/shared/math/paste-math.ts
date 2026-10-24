// Dán chữ có công thức LaTeX ($…$, $$…$$, \[…\]) vào ô chữ: đổi sang dạng lưu của MathShine \(…\) (docs/adr/0006).
// Chỉ đổi lúc dán, không đổi lúc hiển thị: nội dung cũ có ký tự $ (giá $5) vẫn hiện như trước.

export interface PastedMath {
  start: number;
  end: number;
  latex: string;
}

const isSpace = (c: string | undefined) => c === undefined || /\s/.test(c);

/**
 * $ đóng của $…$ theo quy tắc Pandoc: ngay sau $ mở là ký tự khác khoảng trắng, ngay trước $ đóng cũng vậy,
 * và ngay sau $ đóng không phải chữ số ("giá $5 và $10" là chữ). Không vắt qua dòng. Bỏ qua \$ và các lệnh \….
 */
function closingDollar(text: string, from: number): number {
  if (isSpace(text[from]) || text[from] === '$') return -1;
  for (let j = from; j < text.length; j++) {
    const c = text[j];
    if (c === '\\') { j++; continue; }
    if (c === '\n') return -1;
    if (c === '$' && !isSpace(text[j - 1]) && !/\d/.test(text[j + 1] ?? '')) return j;
  }
  return -1;
}

/** Các đoạn công thức trong chữ dán vào. Đoạn đã ở dạng \(…\) thì giữ nguyên, không tính. */
export function findPastedMath(text: string): PastedMath[] {
  const out: PastedMath[] = [];
  for (let i = 0; i < text.length; ) {
    if (text.startsWith('\\(', i)) {
      const e = text.indexOf('\\)', i + 2);
      if (e < 0) break;
      i = e + 2;
      continue;
    }
    if (text.startsWith('\\[', i)) {
      const e = text.indexOf('\\]', i + 2);
      if (e > i + 2) { out.push({ start: i, end: e + 2, latex: text.slice(i + 2, e) }); i = e + 2; continue; }
    }
    if (text[i] === '\\') { i += 2; continue; } // \$ là ký tự $, không phải dấu mở
    if (text.startsWith('$$', i)) {
      const e = text.indexOf('$$', i + 2);
      if (e > i + 2) { out.push({ start: i, end: e + 2, latex: text.slice(i + 2, e) }); i = e + 2; continue; }
      i += 2;
      continue;
    }
    if (text[i] === '$') {
      const e = closingDollar(text, i + 1);
      if (e > 0) { out.push({ start: i, end: e + 1, latex: text.slice(i + 1, e) }); i = e + 1; continue; }
    }
    i++;
  }
  return out;
}

/** Đổi các đoạn công thức vẽ được (ok) sang \(…\); đoạn không vẽ được giữ nguyên là chữ. */
export function convertPastedMath(text: string, ok: (latex: string) => boolean): { text: string; count: number } {
  let out = '', last = 0, count = 0;
  for (const m of findPastedMath(text)) {
    // Công thức đứng riêng ($$, \[) có thể xuống dòng trong mã; trong LaTeX đó chỉ là khoảng trắng
    const latex = m.latex.replace(/\s*\n\s*/g, ' ').trim();
    if (!latex || !ok(latex)) continue;
    out += text.slice(last, m.start) + '\\(' + latex + '\\)';
    last = m.end;
    count++;
  }
  return { text: out + text.slice(last), count };
}
