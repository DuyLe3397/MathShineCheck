import { MARK, cleanLatex, isWholeUnderline, joinLineAtMark, splitLineAtMark } from './formula-lines';

const R = String.raw;
const at = (s: string) => s.replace('|', MARK);

describe('formula-lines', () => {
  describe('splitLineAtMark (Enter)', () => {
    it('cuối dòng: bọc khung nhiều dòng, dòng mới trống không có ô ▢', () => {
      expect(splitLineAtMark(at('x+1=2|'))).toBe(R`\begin{array}{l}x+1=2\\\mathstrut` + MARK + R`\end{array}`);
    });
    it('giữa dòng: phần sau con trỏ xuống dòng mới', () => {
      expect(splitLineAtMark(at('x+1|=2'))).toBe(R`\begin{array}{l}x+1\\` + MARK + R`=2\end{array}`);
    });
    it('trong khung nhiều dòng: cắt đúng dòng đó', () => {
      expect(splitLineAtMark(at(R`\begin{array}{l}ab+|cd\\ ef\end{array}`))).toBe(R`\begin{array}{l}ab+\\` + MARK + R`cd\\ ef\end{array}`);
    });
    it('trong hệ: thêm phương trình', () => {
      expect(splitLineAtMark(at(R`\begin{cases}x+y=3|\end{cases}`))).toBe(R`\begin{cases}x+y=3\\\mathstrut` + MARK + R`\end{cases}`);
    });
    it('trong phân số: cắt sau cả phân số', () => {
      expect(splitLineAtMark(at(R`\frac{1|}{2}+3`))).toBe(R`\begin{array}{l}\frac{1}{2}\\` + MARK + R`+3\end{array}`);
    });
  });

  describe('joinLineAtMark (xoá lùi)', () => {
    it('dòng trống: mất dòng, bỏ khung', () => {
      expect(joinLineAtMark(R`\begin{array}{l}x+1=2\\\mathstrut` + MARK + R`\end{array}`)).toBe('x+1=2' + MARK);
    });
    it('đầu dòng 2: nối lên dòng 1', () => {
      expect(joinLineAtMark(R`\begin{array}{l}a=1\\ b=2\\` + MARK + R`c=3\end{array}`)).toBe(R`\begin{array}{l}a=1\\ b=2` + MARK + R`c=3\end{array}`);
    });
    it('trong hệ: nối hai phương trình', () => {
      expect(joinLineAtMark(R`\begin{cases}x+y=3\\ ` + MARK + R`x-y=1\end{cases}`)).toBe(R`\begin{cases}x+y=3` + MARK + R`x-y=1\end{cases}`);
    });
    it('giữa dòng hoặc dòng đầu: để MathLive xoá như thường', () => {
      expect(joinLineAtMark(R`\begin{array}{l}a=1\\ b` + MARK + R`=2\end{array}`)).toBeNull();
      expect(joinLineAtMark(R`\begin{array}{l}` + MARK + R`a=1\\ b=2\end{array}`)).toBeNull();
      expect(joinLineAtMark('ab' + MARK)).toBeNull();
    });
  });

  it('cleanLatex bỏ \\mathstrut ở dòng có nội dung, giữ ở dòng trống', () => {
    expect(cleanLatex(R`\begin{array}{l}a\\ \mathstrut b\\ \vphantom{(}\end{array}`)).toBe(R`\begin{array}{l}a\\ b\\ \vphantom{(}\end{array}`);
  });

  it('isWholeUnderline', () => {
    expect(isWholeUnderline(R`\underline{z1}`)).toBeTrue();
    expect(isWholeUnderline(R`\underline{z\frac{1}{2}`)).toBeFalse();
  });
});
