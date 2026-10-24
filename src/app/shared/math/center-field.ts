// Đưa ô chữ (cùng Xem trước ngay trên nó) ra giữa phần màn hình còn nhìn thấy (docs/adr/0006).
// Trên điện thoại bàn phím che nửa dưới nhưng trang không co lại (Chrome Android, Safari iPhone): phần nhìn thấy là
// visualViewport, không phải cửa sổ.

const MARGIN = 8;

function scrollParent(el: HTMLElement): HTMLElement | null {
  for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) {
    const oy = getComputedStyle(p).overflowY;
    if ((oy === 'auto' || oy === 'scroll') && p.scrollHeight > p.clientHeight + 1) return p;
  }
  return null;
}

/**
 * Cuộn để khối [đỉnh Xem trước … đáy ô chữ] nằm giữa phần nhìn thấy. Khối cao hơn phần nhìn thấy thì để ô chữ
 * sát đáy: luôn thấy chỗ đang gõ, Xem trước thấy được phần gần ô chữ nhất.
 */
export function centerField(field: HTMLElement, above: HTMLElement | null): void {
  const vv = window.visualViewport;
  let top = vv ? vv.offsetTop : 0;
  let bottom = top + (vv ? vv.height : window.innerHeight);
  const box = scrollParent(field);
  if (box) {
    const r = box.getBoundingClientRect();
    top = Math.max(top, r.top);
    bottom = Math.min(bottom, r.bottom);
  }
  const f = field.getBoundingClientRect();
  const a = above?.getBoundingClientRect();
  const groupTop = a && a.height ? Math.min(a.top, f.top) : f.top;
  const room = bottom - top - 2 * MARGIN;
  const delta = f.bottom - groupTop <= room
    ? (groupTop + f.bottom) / 2 - (top + bottom) / 2
    : f.bottom - (bottom - MARGIN);
  if (Math.abs(delta) < 2) return;
  if (box) box.scrollBy({ top: delta, behavior: 'instant' });
  else window.scrollBy({ top: delta, behavior: 'instant' });
}

/**
 * Canh giữa ngay, rồi canh lại khi phần nhìn thấy ngừng đổi cỡ (bàn phím điện thoại đang bật lên) trong khoảng 1 giây.
 * Trả về hàm huỷ.
 */
export function centerFieldSoon(field: HTMLElement, above: () => HTMLElement | null): () => void {
  const run = () => centerField(field, above());
  run();
  const vv = window.visualViewport;
  if (!vv) return () => {};
  let t = 0;
  const onResize = () => { clearTimeout(t); t = window.setTimeout(run, 80); };
  vv.addEventListener('resize', onResize);
  const stop = window.setTimeout(() => vv.removeEventListener('resize', onResize), 1000);
  return () => { clearTimeout(t); clearTimeout(stop); vv.removeEventListener('resize', onResize); };
}
