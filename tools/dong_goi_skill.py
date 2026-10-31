"""Đóng gói một skill trong .claude/skills thành file zip để tải lên Claude Desktop / claude.ai (Settings → Capabilities → Skills).

  python tools/dong_goi_skill.py [tên skill] [--kem-khoa]

Kết quả: dist/skills/<tên skill>.zip, bên trong là thư mục <tên skill>/ chứa SKILL.md.
- Bỏ __pycache__, *.pyc, khoa.txt có sẵn.
- Frontmatter chỉ giữ các trường claude.ai nhận (bỏ trường riêng của Claude Code như disable-model-invocation).
- --kem-khoa: thêm <tên skill>/khoa.txt lấy từ MATHSHINE_GRADING_KEY hoặc ~/.mathshine-grading-key.
  Ai có file zip là đọc được bài học sinh qua API chấm bài: không chia sẻ file zip đó.
"""
import argparse
import os
import re
import sys
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
ALLOWED = {'name', 'description', 'license', 'allowed-tools', 'metadata', 'compatibility'}
SKIP_DIRS = {'__pycache__'}
SKIP_FILES = {'khoa.txt'}


def clean_skill_md(text: str) -> str:
    m = re.match(r'---\n(.*?)\n---\n', text, re.S)
    if not m:
        sys.exit('SKILL.md thiếu frontmatter')
    kept, fields = [], {}
    for line in m.group(1).splitlines():
        key = line.split(':', 1)[0].strip()
        if line[:1].isspace() and kept:  # dòng tiếp của trường trước
            kept.append(line)
        elif key in ALLOWED:
            kept.append(line)
            fields[key] = line.split(':', 1)[1].strip()
        else:
            print(f'  bỏ trường frontmatter: {key}')
    name, desc = fields.get('name', ''), fields.get('description', '')
    if not re.fullmatch(r'[a-z0-9]+(-[a-z0-9]+)*', name) or len(name) > 64:
        sys.exit(f'name không hợp lệ: {name!r} (chữ thường, số, gạch nối; tối đa 64 ký tự)')
    if not desc or len(desc) > 1024 or '<' in desc or '>' in desc:
        sys.exit('description phải có, tối đa 1024 ký tự, không chứa < >')
    return '---\n' + '\n'.join(kept) + '\n---\n' + text[m.end():]


def grading_key() -> str:
    key = os.environ.get('MATHSHINE_GRADING_KEY', '').strip()
    f = Path.home() / '.mathshine-grading-key'
    if not key and f.exists():
        key = f.read_text(encoding='utf-8').strip()
    if not key:
        sys.exit('--kem-khoa: không tìm thấy khóa (MATHSHINE_GRADING_KEY hoặc ~/.mathshine-grading-key)')
    return key


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument('skill', nargs='?', default='cham-bai')
    ap.add_argument('--kem-khoa', action='store_true', help='đóng kèm khóa chấm bài vào khoa.txt')
    a = ap.parse_args()

    src = ROOT / '.claude' / 'skills' / a.skill
    if not (src / 'SKILL.md').exists():
        sys.exit(f'Không thấy {src / "SKILL.md"}')
    out = ROOT / 'dist' / 'skills' / f'{a.skill}.zip'
    out.parent.mkdir(parents=True, exist_ok=True)

    with zipfile.ZipFile(out, 'w', zipfile.ZIP_DEFLATED) as z:
        for f in sorted(src.rglob('*')):
            rel = f.relative_to(src)
            if f.is_dir() or SKIP_DIRS & set(rel.parts) or f.suffix == '.pyc' or rel.as_posix() in SKIP_FILES:
                continue
            arc = f'{a.skill}/{rel.as_posix()}'
            if rel.as_posix() == 'SKILL.md':
                z.writestr(arc, clean_skill_md(f.read_text(encoding='utf-8')))
            else:
                z.write(f, arc)
            print(f'  + {arc}')
        if a.kem_khoa:
            z.writestr(f'{a.skill}/khoa.txt', grading_key() + '\n')
            print(f'  + {a.skill}/khoa.txt (khóa chấm bài — không chia sẻ file zip này)')
    print(out)


if __name__ == '__main__':
    sys.stdout.reconfigure(encoding='utf-8')
    main()
