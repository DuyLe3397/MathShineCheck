import { centerField } from './center-field';

describe('centerField (đưa ô chữ + Xem trước ra giữa màn hình)', () => {
  let page: HTMLElement;
  let preview: HTMLElement;
  let field: HTMLTextAreaElement;

  beforeEach(() => {
    page = document.createElement('div');
    preview = document.createElement('div');
    field = document.createElement('textarea');
    field.style.cssText = 'display:block;height:60px;width:200px';
    const spacer = () => Object.assign(document.createElement('div'), { style: 'height:3000px' });
    page.append(spacer(), field, preview, spacer());
    document.body.appendChild(page);
    window.scrollTo(0, 0);
  });

  afterEach(() => {
    page.remove();
    window.scrollTo(0, 0);
  });

  const viewH = () => window.visualViewport?.height ?? window.innerHeight;

  it('khối ô chữ + Xem trước vừa màn hình thì nằm giữa', () => {
    preview.style.height = '80px';
    centerField(field, preview);
    const mid = (field.getBoundingClientRect().top + preview.getBoundingClientRect().bottom) / 2;
    expect(Math.abs(mid - viewH() / 2)).toBeLessThan(3);
  });

  it('chưa có Xem trước thì ô chữ nằm giữa', () => {
    centerField(field, null);
    const r = field.getBoundingClientRect();
    expect(Math.abs((r.top + r.bottom) / 2 - viewH() / 2)).toBeLessThan(3);
  });

  it('khối cao hơn màn hình thì ô chữ sát đỉnh, Xem trước hiện ngay dưới', () => {
    preview.style.height = `${viewH() + 200}px`;
    centerField(field, preview);
    const r = field.getBoundingClientRect();
    expect(r.top).toBeGreaterThanOrEqual(0);
    expect(r.top).toBeLessThan(20);
  });

  it('ô chữ cao hơn màn hình thì đáy ô chữ sát đáy, vẫn thấy chỗ đang gõ', () => {
    field.style.height = `${viewH() + 200}px`;
    preview.style.height = '80px';
    centerField(field, preview);
    const r = field.getBoundingClientRect();
    expect(r.bottom).toBeLessThanOrEqual(viewH());
    expect(r.bottom).toBeGreaterThan(viewH() - 20);
  });
});
