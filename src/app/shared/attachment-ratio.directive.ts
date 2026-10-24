import { Directive, ElementRef, HostListener, inject } from '@angular/core';

/**
 * Ghi tỉ lệ rộng/cao thật của ảnh vào biến CSS `--att-ratio` khi ảnh tải xong, để CSS
 * tính cỡ hiển thị: vừa bề ngang ô, nhưng không cao quá `--att-max-h` (giữ đúng tỉ lệ).
 */
@Directive({
  selector: 'img[attRatio]',
  standalone: true,
})
export class AttachmentRatioDirective {
  private img: HTMLImageElement = inject(ElementRef).nativeElement;

  @HostListener('load')
  onLoad(): void {
    const { naturalWidth: w, naturalHeight: h } = this.img;
    if (w && h) this.img.style.setProperty('--att-ratio', String(w / h));
  }
}
