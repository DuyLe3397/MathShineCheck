// Xử lý chuỗi LaTeX cho xuống dòng / xoá dòng trong Bảng soạn công thức (xem docs/adr/0006).
// Bảng soạn chèn một dấu mốc (MARK) tại con trỏ, gọi các hàm dưới đây để dựng chuỗi mới, nạp lại rồi đưa con trỏ về dấu mốc.

export const MARK = '\\text{¶}';
const ROW_ENVS = /^(array|cases|gathered|aligned|matrix|pmatrix|bmatrix)$/;
const STRUT = /(\\mathstrut|\\vphantom\{\(\})/;
const EMPTY_ROW = /^(\s|\\mathstrut|\\vphantom\{\(\})*$/;

/**
 * Cắt dòng tại dấu mốc như trình soạn văn bản: phần sau dấu mốc chuyển xuống dòng mới, dấu mốc ở đầu dòng mới.
 * Đang ở trong khung nhiều dòng (hệ, hoặc, các dòng đã xuống) thì cắt dòng đó; chưa có khung thì bọc cả công thức
 * vào khung nhiều dòng canh trái. Dấu mốc ở trong { } (phân số, căn, mũ…) thì cắt ngay sau cả khối đó.
 * Dòng mới trống thì đặt \mathstrut (vô hình, giữ chiều cao dòng) thay vì ô ▢.
 */
export function splitLineAtMark(v: string): string | null {
  const at = v.indexOf(MARK);
  if (at < 0) return null;
  let left = v.slice(0, at);
  let right = v.slice(at + MARK.length);
  const stack: ({ env: string } | { brace: true })[] = [];
  for (let i = 0; i < left.length; i++) {
    if (left.startsWith('\\begin{', i)) { const e = left.indexOf('}', i + 7); stack.push({ env: left.slice(i + 7, e) }); i = e; }
    else if (left.startsWith('\\end{', i)) { stack.pop(); i = left.indexOf('}', i + 5); }
    else if (left[i] === '\\') i++; // bỏ qua ký tự sau dấu \ (\{ \} \\ …)
    else if (left[i] === '{') stack.push({ brace: true });
    else if (left[i] === '}') stack.pop();
  }
  let open = 0;
  while (stack.length && 'brace' in stack[stack.length - 1]) { stack.pop(); open++; }
  if (open) {
    let j = 0;
    let depth = open;
    for (; j < right.length && depth > 0; j++) {
      if (right[j] === '\\') { j++; continue; }
      if (right[j] === '{') depth++;
      else if (right[j] === '}') depth--;
    }
    const skipGroup = () => {
      if (right[j] !== '{') { j++; return; }
      let d = 0;
      for (; j < right.length; j++) {
        if (right[j] === '\\') { j++; continue; }
        if (right[j] === '{') d++;
        else if (right[j] === '}' && --d === 0) { j++; return; }
      }
    };
    while (j < right.length && (right[j] === '{' || right[j] === '^' || right[j] === '_')) {
      if (right[j] !== '{') j++;
      skipGroup();
    }
    left += right.slice(0, j);
    right = right.slice(j);
  }
  const top = stack[stack.length - 1];
  const inRows = !!top && 'env' in top && ROW_ENVS.test(top.env);
  const restEmpty = inRows ? /^\s*(\\\\|\\end\{)/.test(right) : !right.trim();
  const head = (restEmpty ? '\\mathstrut' : '') + MARK;
  return inRows ? `${left}\\\\${head}${right}` : `\\begin{array}{l}${left}\\\\${head}${right}\\end{array}`;
}

/**
 * Xoá lùi tại dấu mốc khi dấu mốc ở đầu một dòng (dòng thứ 2 trở đi) của khung nhiều dòng / hệ: nối dòng đó lên cuối
 * dòng trên (dòng trống thì mất hẳn); khung nhiều dòng canh trái chỉ còn một dòng thì bỏ khung.
 * Trả về null nếu không phải trường hợp này (để MathLive xoá như thường).
 */
export function joinLineAtMark(v: string): string | null {
  const at = v.indexOf(MARK);
  if (at < 0) return null;
  const left = v.slice(0, at);
  const right = v.slice(at + MARK.length);
  type Frame = { env: string; rowStart: number; sep: number } | { brace: true };
  const stack: Frame[] = [];
  for (let i = 0; i < left.length; i++) {
    const top = stack[stack.length - 1];
    if (left.startsWith('\\begin{', i)) {
      const e = left.indexOf('}', i + 7);
      const env = left.slice(i + 7, e);
      i = e;
      if (env === 'array' && left[i + 1] === '{') i = left.indexOf('}', i + 1); // bỏ qua {l}
      stack.push({ env, rowStart: i + 1, sep: -1 });
    } else if (left.startsWith('\\end{', i)) { stack.pop(); i = left.indexOf('}', i + 5); }
    else if (left.startsWith('\\\\', i)) { if (top && 'env' in top) { top.sep = i; top.rowStart = i + 2; } i++; }
    else if (left[i] === '\\') i++;
    else if (left[i] === '{') stack.push({ brace: true });
    else if (left[i] === '}') stack.pop();
  }
  const top = stack[stack.length - 1];
  if (!top || !('env' in top) || !ROW_ENVS.test(top.env) || top.sep < 0) return null;
  if (!EMPTY_ROW.test(left.slice(top.rowStart))) return null;
  let nv = left.slice(0, top.sep) + MARK + right.replace(/^(\s|\\mathstrut|\\vphantom\{\(\})+/, '');
  const m = /^\\begin\{array\}\{l\}([\s\S]*)\\end\{array\}$/.exec(nv);
  if (m && !hasRowSep(m[1])) nv = m[1];
  return nv;
}

/** Còn dấu ngắt dòng \\ ở ngay cấp này không (bỏ qua các khung lồng bên trong). */
export function hasRowSep(s: string): boolean {
  let depth = 0;
  for (let i = 0; i < s.length; i++) {
    if (s.startsWith('\\begin{', i)) { depth++; i = s.indexOf('}', i + 7); }
    else if (s.startsWith('\\end{', i)) { depth--; i = s.indexOf('}', i + 5); }
    else if (s.startsWith('\\\\', i)) { if (depth === 0) return true; i++; }
    else if (s[i] === '\\') i++;
  }
  return false;
}

/** \mathstrut chỉ để dòng mới trống không hiện ô ▢; dòng đã có nội dung thì bỏ đi cho chuỗi lưu gọn. */
export function cleanLatex(v: string): string {
  return v.replace(new RegExp(STRUT.source + '\\s*(?!\\s*(\\\\\\\\|\\\\end\\{))', 'g'), '').trim();
}

/** Đoạn LaTeX (từ chỗ bật gạch chân tới con trỏ) là trọn một khung \underline{…} thì con trỏ đã ra ngoài khung. */
export function isWholeUnderline(v: string): boolean {
  if (!v.startsWith('\\underline{')) return false;
  let depth = 0;
  for (let i = '\\underline'.length; i < v.length; i++) {
    if (v[i] === '\\') { i++; continue; }
    if (v[i] === '{') depth++;
    else if (v[i] === '}' && --depth === 0) return i === v.length - 1;
  }
  return false;
}
