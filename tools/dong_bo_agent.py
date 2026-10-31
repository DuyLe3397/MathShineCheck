"""Sinh .claude/agents/cham-bai.md từ .claude/skills/cham-bai/cham-mot-bai.md.

  python tools/dong_bo_agent.py

Hướng dẫn chấm nằm sẵn trong định nghĩa agent (system prompt), nên các subagent chấm cùng lớp dùng chung một bản
đã lưu đệm (prompt cache) thay vì mỗi bài đọc lại file với giá đầy đủ. cham-mot-bai.md vẫn là bản gốc (Claude Desktop
và subagent mặc định đọc file này): sửa nó xong thì chạy lại script này.
"""
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / '.claude' / 'skills' / 'cham-bai' / 'cham-mot-bai.md'
OUT = ROOT / '.claude' / 'agents' / 'cham-bai.md'

HEAD = """---
name: cham-bai
description: Người làm việc của skill /cham-bai — chấm một Lần nộp rồi đẩy dấu và bình luận lên MathShine. Chỉ dùng khi skill cham-bai giao việc.
tools: Read, Write, Edit, Bash
model: sonnet
# Sinh từ .claude/skills/cham-bai/cham-mot-bai.md bằng tools/dong_bo_agent.py — đừng sửa tay.
---

Bạn chấm một Lần nộp cho skill chấm bài MathShine, đúng theo hướng dẫn dưới đây (không cần đọc cham-mot-bai.md).

"""


def main() -> None:
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(HEAD + SRC.read_text(encoding='utf-8'), encoding='utf-8')
    print(OUT)


if __name__ == '__main__':
    main()
