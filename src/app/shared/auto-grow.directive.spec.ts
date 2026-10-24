import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { AutoGrowDirective } from './auto-grow.directive';

@Component({
  standalone: true,
  imports: [AutoGrowDirective],
  template: `<textarea
    autoGrow
    rows="1"
    style="width:200px;font-size:14px;line-height:20px;padding:4px;border:1px solid #000;box-sizing:border-box"
  ></textarea>`,
})
class HostComponent {}

describe('AutoGrowDirective', () => {
  function setup() {
    const fixture = TestBed.createComponent(HostComponent);
    document.body.appendChild(fixture.nativeElement);
    fixture.detectChanges();
    const ta: HTMLTextAreaElement = fixture.nativeElement.querySelector('textarea');
    const type = (value: string) => {
      ta.value = value;
      ta.dispatchEvent(new Event('input'));
    };
    return { fixture, ta, type };
  }

  it('cao lên theo số dòng đang gõ', () => {
    const { ta, type } = setup();
    type('một dòng');
    const one = ta.offsetHeight;
    type('1\n2\n3\n4');
    expect(ta.offsetHeight).toBeGreaterThan(one + 50);
    expect(ta.style.overflowY).toBe('hidden');
  });

  it('dừng ở 10 dòng rồi cuộn bên trong', () => {
    const { ta, type } = setup();
    type(Array.from({ length: 30 }, (_, i) => `dòng ${i}`).join('\n'));
    // 10 dòng × 20px + padding 8px + viền 2px
    expect(ta.offsetHeight).toBeLessThanOrEqual(212);
    expect(ta.style.overflowY).toBe('auto');
  });

  it('thu lại khi nội dung bị xóa từ code (vd. sau khi gửi)', () => {
    const { fixture, ta, type } = setup();
    type('1\n2\n3\n4\n5');
    const tall = ta.offsetHeight;
    ta.value = '';
    fixture.detectChanges();
    expect(ta.offsetHeight).toBeLessThan(tall);
  });
});
