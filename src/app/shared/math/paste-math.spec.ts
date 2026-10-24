import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormulaButtonComponent } from './formula-button.component';
import { canRender, loadKatex } from './katex';
import { convertPastedMath, findPastedMath } from './paste-math';
import { splitFormulas } from './math-text';

const R = String.raw;
// Mẫu thật giáo viên dán (lời giải từ công cụ khác): 12 công thức $…$ xen chữ, nhiều dòng
const SAMPLE = R`Câu 16. $f'(x)=\sqrt3-2\cos(x+\frac\pi4)\le0\Leftrightarrow\cos(x+\frac\pi4)\ge\frac{\sqrt3}2$
$\Leftrightarrow-\frac\pi6+k2\pi\le x+\frac\pi4\le\frac\pi6+k2\pi$
$\Leftrightarrow-\frac{5\pi}{12}+k2\pi\le x\le-\frac{\pi}{12}+k2\pi$.
Đoạn $[\frac a3;\frac a2]$ phải tồn tại nên $a>0$.
Cần $-\frac{5\pi}{12}+k2\pi\le\frac a3<\frac a2\le-\frac\pi{12}+k2\pi$, tức $-\frac{5\pi}4+6k\pi\le a\le-\frac\pi6+4k\pi$.
Điều kiện có nghiệm: $-\frac{5\pi}4+6k\pi\le-\frac\pi6+4k\pi\Leftrightarrow k\le\frac{13}{24}$, nên $k\le0$.
Nhưng khi đó $a\le-\frac\pi6<0$, loại.
Vậy có 0 giá trị. Nói cách khác, mỗi khoảng nghịch biến chỉ dài $\frac\pi3$, quá ngắn để chứa đoạn $[\frac a3;\frac a2]$.`;

describe('paste-math', () => {
  const all = () => true;

  it('mẫu thật: nhận đủ 12 công thức, chữ và xuống dòng giữ nguyên', () => {
    const { text, count } = convertPastedMath(SAMPLE, all);
    expect(count).toBe(12);
    expect(text).not.toContain('$');
    expect(text.split('\n').length).toBe(SAMPLE.split('\n').length);
    expect(text.startsWith(R`Câu 16. \(f'(x)=\sqrt3-2\cos`)).toBeTrue();
    expect(text).toContain(R`Đoạn \([\frac a3;\frac a2]\) phải tồn tại nên \(a>0\).`);
    const segs = splitFormulas(text);
    expect(segs.filter((s) => s.kind === 'formula').length).toBe(12);
  });

  it('mẫu thật: KaTeX vẽ được cả 12 công thức', async () => {
    const katex = await loadKatex();
    expect(findPastedMath(SAMPLE).filter((m) => !canRender(katex, m.latex))).toEqual([]);
  });

  it('$$…$$ và \\[…\\] (kể cả vắt qua dòng) cũng thành công thức', () => {
    expect(convertPastedMath('a $$x^2\n+1$$ b \\[\\frac12\\] c', all).text).toBe(R`a \(x^2 +1\) b \(\frac12\) c`);
  });

  it('dấu $ của tiền và chữ thường giữ nguyên (quy tắc Pandoc)', () => {
    for (const s of ['giá $5 và $10', 'có $ 5 $ đây', 'giá \\$5 và \\$6', 'một dấu $ lẻ', 'a$\nb$']) {
      expect(findPastedMath(s)).withContext(s).toEqual([]);
    }
  });

  it('công thức đã ở dạng \\(…\\) giữ nguyên; $ bên trong nó không bị đổi', () => {
    expect(convertPastedMath(R`Có \(x=\$1\) và $y$`, all).text).toBe(R`Có \(x=\$1\) và \(y\)`);
  });

  it('đoạn không vẽ được giữ nguyên là chữ', () => {
    const { text, count } = convertPastedMath(R`đúng $x^2$ sai $\frac{1$`, (l) => l === 'x^2');
    expect(text).toBe(R`đúng \(x^2\) sai $\frac{1$`);
    expect(count).toBe(1);
  });
});

@Component({
  standalone: true,
  imports: [FormulaButtonComponent],
  template: `<textarea #f></textarea><formula-button [field]="f" />`,
})
class PasteHostComponent {}

describe('Dán vào ô có nút f(x)', () => {
  const paste = (el: HTMLTextAreaElement, text: string) => {
    const dt = new DataTransfer();
    dt.setData('text/plain', text);
    const ev = new ClipboardEvent('paste', { clipboardData: dt, bubbles: true, cancelable: true });
    el.dispatchEvent(ev);
    // Trình duyệt không tự dán với sự kiện giả: không có công thức thì sự kiện không bị chặn, tự chèn như trình duyệt
    if (!ev.defaultPrevented) document.execCommand('insertText', false, text);
  };
  const settle = async () => { await loadKatex(); await new Promise((r) => setTimeout(r, 0)); };

  it('tự đổi $…$ thành công thức; Ctrl+Z một lần về đúng chữ vừa dán; chữ thường dán như cũ', async () => {
    const fixture = TestBed.createComponent(PasteHostComponent);
    fixture.detectChanges();
    const ta: HTMLTextAreaElement = fixture.nativeElement.querySelector('textarea');
    let inputs = 0;
    ta.addEventListener('input', () => inputs++);
    ta.focus();
    paste(ta, 'Ta có $x^2\\ge0$ nên xong.');
    await settle();
    expect(ta.value).toBe(R`Ta có \(x^2\ge0\) nên xong.`);
    expect(inputs).toBeGreaterThan(0); // ngModel nhận được nội dung mới
    document.execCommand('undo');
    expect(ta.value).toBe('Ta có $x^2\\ge0$ nên xong.');
    document.execCommand('undo');
    expect(ta.value).toBe('');
    paste(ta, 'giá $5 và $10');
    await settle();
    expect(ta.value).toBe('giá $5 và $10');
  });

  it('clipboard xuống dòng kiểu Windows (\\r\\n) vẫn đổi được', async () => {
    const fixture = TestBed.createComponent(PasteHostComponent);
    fixture.detectChanges();
    const ta: HTMLTextAreaElement = fixture.nativeElement.querySelector('textarea');
    ta.focus();
    paste(ta, 'Dòng 1 $a>0$\r\nDòng 2 $b<0$');
    await settle();
    expect(ta.value).toBe(R`Dòng 1 \(a>0\)` + '\n' + R`Dòng 2 \(b<0\)`);
  });
});
