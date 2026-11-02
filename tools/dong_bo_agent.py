"""Sinh các agent của skill cham-bai trong .claude/agents từ hướng dẫn gốc trong .claude/skills/cham-bai:
  cham-mot-bai.md → cham-bai.md      (chấm một Lần nộp)
  chot-dap-an.md  → chot-dap-an.md   (đọc đề, đáp án, ghi dap-an.md)

  python tools/dong_bo_agent.py

Hướng dẫn nằm sẵn trong định nghĩa agent (system prompt), nên các subagent cùng lớp dùng chung một bản đã lưu đệm
(prompt cache) thay vì mỗi bài đọc lại file với giá đầy đủ. File trong skill vẫn là bản gốc (Claude Desktop và
subagent mặc định đọc chúng): sửa xong thì chạy lại script này.
"""
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SKILL = ROOT / '.claude' / 'skills' / 'cham-bai'
AGENTS = ROOT / '.claude' / 'agents'

# (file gốc, tên agent, mô tả, câu mở đầu)
SPECS = [
    ('cham-mot-bai.md', 'cham-bai',
     'Người làm việc của skill /cham-bai — chấm một Lần nộp rồi đẩy dấu và bình luận lên MathShine. Chỉ dùng khi skill cham-bai giao việc.',
     'Bạn chấm một Lần nộp cho skill chấm bài MathShine, đúng theo hướng dẫn dưới đây (không cần đọc cham-mot-bai.md).'),
    ('chot-dap-an.md', 'chot-dap-an',
     'Người làm việc của skill /cham-bai — đọc đề và đáp án, ghi dap-an.md gọn cho người chấm. Chỉ dùng khi skill cham-bai giao việc.',
     'Bạn chốt đáp án cho skill chấm bài MathShine, đúng theo hướng dẫn dưới đây (không cần đọc chot-dap-an.md).'),
]


def main() -> None:
    AGENTS.mkdir(parents=True, exist_ok=True)
    for src, name, desc, intro in SPECS:
        out = AGENTS / f'{name}.md'
        head = (f'---\nname: {name}\ndescription: {desc}\ntools: Read, Write, Edit, Bash\nmodel: sonnet\n'
                f'# Sinh từ .claude/skills/cham-bai/{src} bằng tools/dong_bo_agent.py — đừng sửa tay.\n---\n\n{intro}\n\n')
        out.write_text(head + (SKILL / src).read_text(encoding='utf-8'), encoding='utf-8')
        print(out)


if __name__ == '__main__':
    main()
