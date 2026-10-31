"""Đẩy Ảnh đã chấm (cham-<i>.jpg) lên MathShine, đè lên ảnh bài làm như nút "Tải ảnh đã chấm" (docs/adr/0009).

  python day_anh.py <thư mục bài nộp> [--khoi-phuc]

- Trước lần đẩy đầu, chép ảnh gốc sang goc-<i>.ban-dau.jpg (không bao giờ ghi đè) để khôi phục được.
- Chỉ đè khi ảnh trên MathShine còn đúng bản đã lấy về hoặc đã đẩy lần trước (so SHA-256, ghi trong da-day.json);
  giáo viên vừa vẽ hay tải ảnh khác lên thì bỏ qua ảnh đó và báo.
- --khoi-phuc: đẩy lại ảnh gốc goc-<i>.ban-dau.jpg thay cho ảnh đã chấm.
In mỗi ảnh một dòng. Mã thoát 1 nếu có ảnh không đẩy được.
"""
import base64
import hashlib
import json
import shutil
import sys
import urllib.error
import urllib.request
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from lay_bai import API, grading_key  # noqa: E402

ERRORS = {
    'image-changed': 'ảnh trên MathShine đã đổi (giáo viên vừa vẽ hoặc tải ảnh khác?), không đè',
    'image-too-large': 'ảnh quá 900KB',
    'image-not-in-submission': 'ảnh không thuộc Lần nộp này',
    'method-not-allowed': 'API chưa có lệnh đẩy ảnh: cần deploy bản mới của email-api',
    'bad-action': 'API chưa có lệnh đẩy ảnh: cần deploy bản mới của email-api',
}


def sha(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def upload(submission: str, image_id: str, expect: str, jpeg: bytes) -> str | None:
    """Trả về None nếu thành công, hoặc lý do lỗi."""
    body = json.dumps({'submission': submission, 'imageId': image_id, 'expectSha256': expect,
                       'jpegBase64': base64.b64encode(jpeg).decode()}).encode()
    req = urllib.request.Request(f'{API}?action=uploadGraded', data=body, method='POST',
                                 headers={'x-grading-key': grading_key(), 'Content-Type': 'application/json'})
    try:
        with urllib.request.urlopen(req, timeout=60):
            return None
    except urllib.error.HTTPError as e:
        try:
            code = json.loads(e.read())['error']
        except (ValueError, KeyError):
            code = str(e.code)
        return ERRORS.get(code, f'API lỗi {e.code}: {code}')
    except (urllib.error.URLError, OSError) as e:  # một dòng thay cho cả trang traceback
        return f'lỗi mạng: {getattr(e, "reason", e)}'


def run(d: Path, restore: bool = False) -> int:
    """Đẩy (hoặc khôi phục) mọi ảnh của một Lần nộp; trả về số ảnh lỗi."""
    sub = json.loads((d / 'bai-nop.json').read_text(encoding='utf-8'))
    state_file = d / 'da-day.json'
    state = json.loads(state_file.read_text(encoding='utf-8')) if state_file.exists() else {}
    # Khôi phục theo các ảnh đã từng đẩy (da-day.json), không theo cham-*.jpg hiện có
    pages = sorted(map(int, state)) if restore else sorted(int(p.stem.split('-')[1]) for p in d.glob('cham-*.jpg'))
    failed = 0
    for i in pages:
        backup = d / f'goc-{i}.ban-dau.jpg'
        if not backup.exists():
            shutil.copyfile(d / f'goc-{i}.jpg', backup)
        jpeg = (backup if restore else d / f'cham-{i}.jpg').read_bytes()
        if not restore and state.get(str(i)) == sha(jpeg):
            print(f'Ảnh {i}: đã đẩy đúng bản này rồi')
            continue
        expect = state.get(str(i)) or sha(backup.read_bytes())
        error = upload(sub['submissionId'], sub['imageIds'][i - 1], expect, jpeg)
        if error:
            failed += 1
            print(f'Ảnh {i}: LỖI — {error}')
            continue
        if restore:
            state.pop(str(i), None)
        else:
            state[str(i)] = sha(jpeg)
        print(f'Ảnh {i}: đã {"khôi phục ảnh gốc" if restore else "đẩy ảnh đã chấm"}')
    state_file.write_text(json.dumps(state), encoding='utf-8')
    return failed


if __name__ == '__main__':
    sys.stdout.reconfigure(encoding='utf-8')
    sys.exit(1 if run(Path(sys.argv[1]), '--khoi-phuc' in sys.argv[2:]) else 0)
