import { Directive, ElementRef, HostListener, OnInit, inject, output } from '@angular/core';

/** Máy tính có chuột và bàn phím thật; điện thoại / máy tính bảng cảm ứng thì không. */
export const isDesktop = (): boolean =>
  typeof matchMedia === 'function' && matchMedia('(hover: hover) and (pointer: fine)').matches;

/**
 * Trên máy tính: Enter gửi (phát `enterSend`), Shift+Enter xuống dòng. Trên điện thoại giữ nguyên Enter xuống dòng.
 * Ngoại lệ của ADR 0006 (mọi ô khác Enter chỉ xuống dòng), chỉ dùng cho ô viết / sửa nhận xét ở trang chấm bài.
 */
@Directive({ selector: 'textarea[enterSend]', standalone: true })
export class EnterSendDirective implements OnInit {
  private el = inject(ElementRef<HTMLTextAreaElement>);
  private readonly desktop = isDesktop();
  enterSend = output<void>();

  ngOnInit(): void {
    if (!this.desktop) return;
    const ta = this.el.nativeElement as HTMLTextAreaElement;
    ta.placeholder = `${ta.placeholder} · Enter để gửi, Shift+Enter xuống dòng`;
  }

  @HostListener('keydown', ['$event'])
  onKeydown(e: KeyboardEvent): void {
    if (!this.desktop || e.key !== 'Enter' || e.shiftKey || e.ctrlKey || e.altKey || e.metaKey) return;
    // Bộ gõ đang ghép chữ (dấu tiếng Việt, IME) thì Enter thuộc về bộ gõ
    if (e.isComposing || e.keyCode === 229) return;
    e.preventDefault();
    this.enterSend.emit();
  }
}
