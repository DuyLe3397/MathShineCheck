"""Đọc file đề/đáp án Word (.docx) ra Markdown để Claude đọc, không cần pandoc.

  python doc_de.py <file.docx> [--out cham-bai/de]

Kết quả: <out>/<tên file>/de.md, cùng các ảnh trong đề (anh-<n>.png) mà de.md trỏ tới bằng [ảnh anh-<n>.png].
- Công thức Word (OMML) → \\(…\\); công thức MathType (ảnh WMF/EMF) đổi sang PNG để đọc bằng mắt.
- Bảng: mỗi hàng một dòng, các ô cách nhau bởi " | ".
In đường dẫn de.md; ảnh nào không đổi được thì in cảnh báo (đọc đề bằng bản PDF nếu có).
"""
import argparse
import io
import re
import sys
import zipfile
from pathlib import Path
from xml.etree import ElementTree as ET

from PIL import Image

NS = {
    'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main',
    'm': 'http://schemas.openxmlformats.org/officeDocument/2006/math',
    'a': 'http://schemas.openxmlformats.org/drawingml/2006/main',
    'r': 'http://schemas.openxmlformats.org/officeDocument/2006/relationships',
    'v': 'urn:schemas-microsoft-com:vml',
}
W, M, R = (f"{{{NS[k]}}}" for k in ('w', 'm', 'r'))
REL = '{http://schemas.openxmlformats.org/package/2006/relationships}Relationship'
# Ký hiệu Unicode trong công thức Word → lệnh LaTeX, để dap-an.md (và nhận xét chép từ đó) đúng dạng KaTeX vẽ được
LATEX = {'∘': '\\circ ', '°': '^{\\circ}', '−': '-', '≤': '\\le ', '≥': '\\ge ', '≠': '\\ne ', '±': '\\pm ',
         '·': '\\cdot ', '⋅': '\\cdot ', '×': '\\times ', '÷': '\\div ', 'π': '\\pi ', '∞': '\\infty ', 'α': '\\alpha ',
         'β': '\\beta ', 'γ': '\\gamma ', 'Δ': '\\Delta ', 'φ': '\\varphi ', '∈': '\\in ', '∉': '\\notin ', '∅': '\\varnothing ',
         '∪': '\\cup ', '∩': '\\cap ', '⇔': '\\Leftrightarrow ', '⇒': '\\Rightarrow ', '→': '\\to ', '≈': '\\approx ',
         '∠': '\\angle ', '⊥': '\\perp ', '∥': '\\parallel ', 'ℝ': '\\mathbb{R}'}


def omml(el) -> str:
    """OMML → LaTeX cho các dạng hay gặp trong đề Toán; dạng lạ thì lấy chữ bên trong."""
    tag = el.tag.removeprefix(M)

    def sub(name: str) -> str:
        c = el.find(f'm:{name}', NS)
        return omml(c) if c is not None else ''

    def val(path: str, default: str) -> str:
        c = el.find(path, NS)
        return c.get(f'{M}val', default) if c is not None else default

    if tag == 't':
        return ''.join(LATEX.get(ch, ch) for ch in el.text or '')
    if tag == 'f':
        return f"\\frac{{{sub('num')}}}{{{sub('den')}}}"
    if tag == 'sSup':
        return f"{{{sub('e')}}}^{{{sub('sup')}}}"
    if tag == 'sSub':
        return f"{{{sub('e')}}}_{{{sub('sub')}}}"
    if tag == 'sSubSup':
        return f"{{{sub('e')}}}_{{{sub('sub')}}}^{{{sub('sup')}}}"
    if tag == 'rad':
        deg = sub('deg')
        return f"\\sqrt[{deg}]{{{sub('e')}}}" if deg else f"\\sqrt{{{sub('e')}}}"
    if tag == 'd':
        body = ','.join(omml(e) for e in el.findall('m:e', NS))
        beg, end = (c.replace('{', '\\{').replace('}', '\\}') or '.' for c in (val('m:dPr/m:begChr', '('), val('m:dPr/m:endChr', ')')))
        return f"\\left{beg}{body}\\right{end}"
    if tag == 'acc':
        cmd = {'→': '\\overrightarrow', '⃗': '\\overrightarrow', '¯': '\\overline', '̅': '\\overline'}.get(val('m:accPr/m:chr', '^'), '\\widehat')
        return f"{cmd}{{{sub('e')}}}"
    if tag == 'bar':
        return f"\\overline{{{sub('e')}}}"
    if tag == 'nary':
        op = {'∑': '\\sum', '∏': '\\prod'}.get(val('m:naryPr/m:chr', '∫'), '\\int')
        return f"{op}_{{{sub('sub')}}}^{{{sub('sup')}}}{sub('e')}"
    if tag.endswith('Pr'):
        return ''
    return ''.join(omml(c) for c in el)


def to_png(data: bytes, dest: Path) -> bool:
    try:
        img = Image.open(io.BytesIO(data))
        if img.format in ('WMF', 'EMF'):
            img.load(dpi=200)
        img.convert('RGB').save(dest)
        return True
    except Exception:
        return False


class Doc:
    def __init__(self, path: Path, out: Path):
        self.z = zipfile.ZipFile(path)
        rels = ET.fromstring(self.z.read('word/_rels/document.xml.rels'))
        self.rels = {r.get('Id'): 'word/' + r.get('Target').lstrip('/').removeprefix('word/') for r in rels.iter(REL)}
        self.out, self.n, self.failed = out, 0, []

    def image(self, rid: str) -> str:
        target = self.rels.get(rid)
        if not target or target not in self.z.namelist():
            return ''
        self.n += 1
        name = f'anh-{self.n}.png'
        if not to_png(self.z.read(target), self.out / name):
            self.failed.append(f'{name} ({Path(target).name})')
            return f'[ảnh {name}: không đổi được]'
        return f'[ảnh {name}]'

    def para(self, p) -> str:
        parts = []
        for el in p.iter():
            if el.tag == f'{M}oMath':
                parts.append(f'\\({omml(el).strip()}\\)')
                for c in el.iter():  # chữ trong công thức đã lấy, đánh dấu để khỏi lấy lại
                    c.set('_seen', '1')
            elif el.get('_seen'):
                continue
            elif el.tag == f'{W}t':
                parts.append(el.text or '')
            elif el.tag == f'{W}tab':
                parts.append(' ')
            elif el.tag in (f'{W}br', f'{W}cr'):
                parts.append('\n')
            elif el.tag == f"{{{NS['a']}}}blip":
                parts.append(self.image(el.get(f'{R}embed')))
            elif el.tag == f"{{{NS['v']}}}imagedata":
                parts.append(self.image(el.get(f'{R}id')))
        return re.sub(r'[ \t]+', ' ', ''.join(parts)).strip()

    def lines(self):
        body = ET.fromstring(self.z.read('word/document.xml')).find('w:body', NS)
        for el in body:
            if el.tag == f'{W}p':
                yield self.para(el)
            elif el.tag == f'{W}tbl':
                for tr in el.iter(f'{W}tr'):
                    yield ' | '.join(' '.join(self.para(p) for p in tc.iter(f'{W}p')) for tc in tr.findall('w:tc', NS))


def main() -> None:
    sys.stdout.reconfigure(encoding='utf-8')
    ap = argparse.ArgumentParser()
    ap.add_argument('docx')
    ap.add_argument('--out', default='cham-bai/de')
    a = ap.parse_args()
    src = Path(a.docx)
    out = Path(a.out) / re.sub(r'[^\w-]+', '-', src.stem).strip('-')
    out.mkdir(parents=True, exist_ok=True)
    doc = Doc(src, out)
    text = '\n'.join(line for line in doc.lines() if line)
    (out / 'de.md').write_text(text + '\n', encoding='utf-8')
    print(out / 'de.md')
    if doc.failed:
        print('CẢNH BÁO không đổi được ảnh: ' + ', '.join(doc.failed))


if __name__ == '__main__':
    main()
