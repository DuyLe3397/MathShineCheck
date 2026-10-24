import { Directive, DoCheck, ElementRef, HostListener, Input, inject } from '@angular/core';

/**
 * Textarea tự cao lên theo nội dung đang gõ (kể cả khi giá trị đổi từ code, vd. ngModel
 * xóa sau khi gửi), tối đa `autoGrowMaxRows` dòng; dài hơn thì cuộn bên trong.
 */
@Directive({
  selector: 'textarea[autoGrow]',
  standalone: true,
})
export class AutoGrowDirective implements DoCheck {
  @Input() autoGrowMaxRows = 10;

  private el: HTMLTextAreaElement = inject(ElementRef).nativeElement;
  private lastValue: string | null = null;

  constructor() {
    this.el.style.resize = 'none';
    this.el.style.overflowY = 'hidden';
  }

  @HostListener('input')
  onInput(): void {
    this.resize();
  }

  ngDoCheck(): void {
    if (this.el.value !== this.lastValue) this.resize();
  }

  private resize(): void {
    this.lastValue = this.el.value;
    const style = getComputedStyle(this.el);
    const lineHeight = parseFloat(style.lineHeight) || parseFloat(style.fontSize) * 1.4 || 20;
    const extra =
      parseFloat(style.paddingTop) +
      parseFloat(style.paddingBottom) +
      parseFloat(style.borderTopWidth) +
      parseFloat(style.borderBottomWidth);
    const max = lineHeight * this.autoGrowMaxRows + extra;
    this.el.style.height = 'auto';
    const needed = this.el.scrollHeight + parseFloat(style.borderTopWidth) + parseFloat(style.borderBottomWidth);
    this.el.style.height = `${Math.min(needed, max)}px`;
    this.el.style.overflowY = needed > max ? 'auto' : 'hidden';
  }
}
