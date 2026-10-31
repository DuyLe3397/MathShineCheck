"""Đăng nhận xét theo ảnh của cham.md thành bình luận theo ảnh trên MathShine, dưới tên giáo viên ra bài (docs/adr/0009).

  python dang_nhan_xet.py <thư mục bài nộp>

Mỗi đoạn dưới "## Ảnh <i>" (cách nhau một dòng trống) là một bình luận của ảnh đó, đúng thứ tự; công thức đã được
doc_cham.py chuẩn hóa về dạng \\(…\\) của MathShine.

Chạy lại không đăng trùng: da-dang.json giữ mã bình luận đã đăng theo từng ảnh. Đoạn nào đổi nội dung thì sửa đúng
bình luận đó; có thêm đoạn thì đăng thêm; bớt đoạn thì báo để giáo viên xóa tay. In mỗi ảnh một dòng.
"""
import json
import sys
import urllib.error
import urllib.request
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from doc_cham import load  # noqa: E402
from lay_bai import API, grading_key  # noqa: E402

ERRORS = {
    'teacher-not-found': 'không tìm thấy giáo viên ra bài (createdBy của bài tập)',
    'not-skill-comment': 'bình luận cũ không phải do skill đăng, không sửa',
    'comment-not-found': 'bình luận đã đăng trước đó bị xóa',
    'comment-changed': 'bình luận vừa bị sửa trên MathShine, không đè',
    'method-not-allowed': 'API chưa có lệnh đăng bình luận: cần deploy bản mới của email-api',
    'bad-action': 'API chưa có lệnh đăng bình luận: cần deploy bản mới của email-api',
}


def post(body: dict) -> tuple[str | None, str | None]:
    """Trả về (mã bình luận, None) hoặc (None, lý do lỗi)."""
    req = urllib.request.Request(f'{API}?action=postComment', data=json.dumps(body).encode(), method='POST',
                                 headers={'x-grading-key': grading_key(), 'Content-Type': 'application/json'})
    try:
        with urllib.request.urlopen(req, timeout=60) as res:
            return json.loads(res.read())['id'], None
    except urllib.error.HTTPError as e:
        try:
            code = json.loads(e.read())['error']
        except (ValueError, KeyError):
            code = str(e.code)
        return None, ERRORS.get(code, f'API lỗi {e.code}: {code}')
    except (urllib.error.URLError, OSError) as e:  # một dòng thay cho cả trang traceback
        return None, f'lỗi mạng: {getattr(e, "reason", e)}'


def run(d: Path) -> int:
    """Đăng/sửa mọi bình luận của một Lần nộp; trả về số bình luận lỗi."""
    sub = json.loads((d / 'bai-nop.json').read_text(encoding='utf-8'))
    state_file = d / 'da-dang.json'
    state = json.loads(state_file.read_text(encoding='utf-8')) if state_file.exists() else {}
    data, problems = load(d)
    if problems:
        print('THIẾU: ' + '; '.join(problems))
        return 1
    failed = 0
    for i, paras in sorted(data['binhLuan'].items()):
        posted = state.get(str(i), [])  # [{"id": …, "content": …}] theo thứ tự đoạn
        done, notes = 0, []
        for k, content in enumerate(paras):
            old = posted[k] if k < len(posted) else None
            if old and old['content'] == content:
                continue
            body = {'submission': sub['submissionId'], 'imageIndex': i - 1, 'content': content}
            if old:
                body['commentId'] = old['id']
            cid, error = post(body)
            if error:
                # Dừng ảnh này để thứ tự đoạn ↔ bình luận trong da-dang.json không lệch
                failed += 1
                notes.append(f'đoạn {k + 1} LỖI — {error}; các đoạn sau chưa đăng')
                break
            entry = {'id': cid, 'content': content}
            if old:
                posted[k] = entry
            else:
                posted.append(entry)
            done += 1
        if len(posted) > len(paras):
            notes.append(f'còn {len(posted) - len(paras)} bình luận cũ thừa, giáo viên xóa tay trên MathShine')
        state[str(i)] = posted
        print(f'Ảnh {i}: {len(paras)} đoạn, đăng/sửa {done}' + ('; ' + '; '.join(notes) if notes else ''))
    state_file.write_text(json.dumps(state, ensure_ascii=False), encoding='utf-8')
    return failed


if __name__ == '__main__':
    sys.stdout.reconfigure(encoding='utf-8')
    sys.exit(1 if run(Path(sys.argv[1])) else 0)
