"""Chuẩn hóa công thức về dạng \\(…\\) của MathShine: cho dap-an.md (xem trong trình xem Markdown không mất công thức)
và cho bình luận đăng lên MathShine (fix_text với wrap=False, qua doc_cham.py).

  python chuan_hoa.py <file.md> [<file.md> …]

- $…$, $$…$$, \\[…\\] → \\(…\\) (dạng lưu của MathShine); \\frac12 → \\frac{1}{2}, \\sqrt3 → \\sqrt{3}, \\hat A → \\hat{A}, x^2 → x^{2}.
- Ngoài khối mã: bọc mỗi \\(…\\) trong backtick (trình xem Markdown xóa \\ của \\( đứng trần).
Ghi đè tại chỗ; chạy lại nhiều lần cho cùng kết quả.
"""
import re
import sys
from pathlib import Path

FENCE = re.compile(r'^\s*(`{3,}|~{3,})\s*(\S*)')
CODE_SPAN = re.compile(r'(`+)(.+?)\1')
DISPLAY = re.compile(r'\$\$(.+?)\$\$|\\\[(.+?)\\\]', re.S)
INLINE = re.compile(r'\\\((.+?)\\\)')
# Mỗi đối số một token như LaTeX hiểu: \frac12 = \frac{1}{2}, \sqrt3 = \sqrt{3}
TOKEN_FIXES = [
    (re.compile(r'(\\[dt]?frac)\s*([0-9A-Za-z])\s*([0-9A-Za-z])'), r'\1{\2}{\3}'),
    (re.compile(r'(\\[dt]?frac)\s*([0-9A-Za-z])(?=\s*\{)'), r'\1{\2}'),
    (re.compile(r'(\\[dt]?frac\{[^{}]*\})\s*([0-9A-Za-z])'), r'\1{\2}'),
    (re.compile(r'(\\(?:sqrt|hat|widehat|bar|overline|vec|overrightarrow|tilde))\s*([0-9A-Za-z])'), r'\1{\2}'),
    (re.compile(r'([\^_])\s*([0-9A-Za-z])'), r'\1{\2}'),
]


def fix_latex(latex: str) -> str:
    latex = re.sub(r'\s*\n\s*', ' ', latex).strip()
    for pattern, repl in TOKEN_FIXES:
        latex = pattern.sub(repl, latex)
    return latex


def dollars_to_paren(s: str) -> str:
    """$…$ → \\(…\\) theo quy tắc Pandoc như paste-math.ts: "giá $5 và $10" vẫn là chữ."""
    out, i = [], 0
    while i < len(s):
        if s[i] == '\\':
            out.append(s[i:i + 2])
            i += 2
            continue
        if s[i] == '$' and i + 1 < len(s) and not s[i + 1].isspace() and s[i + 1] != '$':
            j = i + 1
            while j < len(s) and s[j] != '$':
                j += 2 if s[j] == '\\' else 1
            if j < len(s) and not s[j - 1].isspace() and not s[j + 1:j + 2].isdigit():
                out.append('\\(' + s[i + 1:j] + '\\)')
                i = j + 1
                continue
        out.append(s[i])
        i += 1
    return ''.join(out)


def fix_text(s: str, wrap: bool) -> str:
    s = dollars_to_paren(s)
    return INLINE.sub(lambda m: ('`\\({}\\)`' if wrap else '\\({}\\)').format(fix_latex(m[1])), s)


def prose_line(line: str) -> str:
    out, last = [], 0
    for m in CODE_SPAN.finditer(line):
        out.append(fix_text(line[last:m.start()], wrap=True))
        body = m[2].strip()
        if re.fullmatch(r'\\\(.+\\\)|\$[^$]+\$', body):
            out.append(m[1] + fix_text(body, wrap=False) + m[1])
        else:
            out.append(m[0])
        last = m.end()
    out.append(fix_text(line[last:], wrap=True))
    return ''.join(out)


def normalize(text: str) -> str:
    out, prose, fence = [], [], None

    def flush():
        if prose:
            joined = DISPLAY.sub(lambda m: '\\(' + fix_latex(m[1] or m[2]) + '\\)', '\n'.join(prose))
            out.extend(prose_line(l) for l in joined.split('\n'))
            prose.clear()

    for line in text.split('\n'):
        m = FENCE.match(line)
        if fence is None:
            if m:
                flush()
                fence = (m[1], m[2])
                out.append(line)
            else:
                prose.append(line)
        else:
            if m and m[1][0] == fence[0][0] and len(m[1]) >= len(fence[0]) and not m[2]:
                fence = None
                out.append(line)
            else:
                out.append(fix_text(line, wrap=False) if fence[1] == 'text' else line)
    flush()
    return '\n'.join(out)


def normalize_file(path: Path) -> bool:
    text = path.read_text(encoding='utf-8')
    new = normalize(text)
    if new != text:
        path.write_text(new, encoding='utf-8')
    return new != text


if __name__ == '__main__':
    sys.stdout.reconfigure(encoding='utf-8')
    for arg in sys.argv[1:]:
        print(('đã chuẩn hóa ' if normalize_file(Path(arg)) else 'đã chuẩn ') + arg)
