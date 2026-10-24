import { centerField } from './center-field';

describe('centerField (đưa ô chữ + Xem trước ra giữa màn hình)', () => {
  let page: HTMLElement;
  let above: HTMLElement;
  let field: HTMLTextAreaElement;

  beforeEach(() => {
    page = document.createElement('div');
    above = document.createElement('div');
    field = document.createElement('textarea');
    field.style.cssText = 'display:block;height:60px;width:200px';
    const spacer = () => Object.assign(document.createElement('div'), { style: 'height:3000px' });
    page.append(spacer(), above, field, spacer());
    document.body.appendChild(page);
    window.scrollTo(0, 0);
  });

  afterEach(() => {
    page.remove();
    window.scrollTo(0, 0);
  });

  const viewH = () => window.visualViewport?.height ?? window.innerHeight;

  it('khối Xem trước + ô chữ vừa màn hình thì nằm giữa', () => {
    above.style.height = '80px';
    centerField(field, above);
    const mid = (above.getBoundingClientRect().top + field.getBoundingClientRect().bottom) / 2;
    expect(Math.abs(mid - viewH() / 2)).toBeLessThan(3);
  });

  it('chưa có Xem trước thì ô chữ nằm giữa', () => {
    centerField(field, null);
    const r = field.getBoundingClientRect();
    expect(Math.abs((r.top + r.bottom) / 2 - viewH() / 2)).toBeLessThan(3);
  });

  it('khối cao hơn màn hình thì ô chữ sát đáy, vẫn thấy chỗ đang gõ', () => {
    above.style.height = `${viewH() + 200}px`;
    centerField(field, above);
    const r = field.getBoundingClientRect();
    expect(r.bottom).toBeLessThanOrEqual(viewH());
    expect(r.bottom).toBeGreaterThan(viewH() - 20);
  });
});
