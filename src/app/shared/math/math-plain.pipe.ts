import { Pipe, PipeTransform } from '@angular/core';
import { toPlainText } from './math-text';

/** Nội dung có Công thức → một dòng chữ (danh sách rút gọn, Thông báo). */
@Pipe({ name: 'mathPlain', standalone: true })
export class MathPlainPipe implements PipeTransform {
  transform(text: string | null | undefined): string {
    return toPlainText(text);
  }
}
