import { TestBed } from '@angular/core/testing';
import { RefreshButtonComponent } from './refresh-button.component';

async function render(action: () => Promise<boolean | void>) {
  const fixture = TestBed.createComponent(RefreshButtonComponent);
  fixture.componentRef.setInput('action', action);
  fixture.detectChanges();
  const el = fixture.nativeElement as HTMLElement;
  const click = async () => {
    el.querySelector('button')!.click();
    await fixture.whenStable();
    fixture.detectChanges();
  };
  return { el, click };
}

describe('Nút Làm mới', () => {
  it('làm mới xong thì hiện "Cập nhật lúc"', async () => {
    const { el, click } = await render(async () => {});
    await click();
    expect(el.textContent).toContain('Cập nhật lúc');
  });

  it('người dùng hủy (action trả false) thì không hiện "Cập nhật lúc"', async () => {
    const { el, click } = await render(async () => false);
    await click();
    expect(el.textContent).not.toContain('Cập nhật lúc');
  });

  it('tải lỗi thì báo "Làm mới thất bại"', async () => {
    const { el, click } = await render(async () => {
      throw new Error('mất mạng');
    });
    await click();
    expect(el.textContent).toContain('Làm mới thất bại');
  });

  it('khóa nút trong lúc đang tải để không bấm chồng', async () => {
    let finish!: () => void;
    let calls = 0;
    const { el } = await render(
      () =>
        new Promise<void>((resolve) => {
          calls++;
          finish = resolve;
        }),
    );
    const button = el.querySelector('button')!;
    button.click();
    button.click();
    expect(calls).toBe(1);
    finish();
  });
});
