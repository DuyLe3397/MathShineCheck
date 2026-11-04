import { Component, input } from '@angular/core';

/** Huy hiệu răng cưa xanh dương có dấu tích trắng (tự vẽ, kiểu tích xanh; không dùng hình của Meta). */
@Component({
  selector: 'verified-badge',
  standalone: true,
  styles: [':host { display: inline-flex; flex: none; line-height: 0; }'],
  template: `
    <svg [attr.width]="size()" [attr.height]="size()" viewBox="0 0 24 24" aria-hidden="true">
      <g fill="#1877f2">
        <circle cx="12" cy="12" r="8.6" />
        <circle cx="20.40" cy="12.00" r="3.2" /><circle cx="19.27" cy="16.20" r="3.2" />
        <circle cx="16.20" cy="19.27" r="3.2" /><circle cx="12.00" cy="20.40" r="3.2" />
        <circle cx="7.80" cy="19.27" r="3.2" /><circle cx="4.73" cy="16.20" r="3.2" />
        <circle cx="3.60" cy="12.00" r="3.2" /><circle cx="4.73" cy="7.80" r="3.2" />
        <circle cx="7.80" cy="4.73" r="3.2" /><circle cx="12.00" cy="3.60" r="3.2" />
        <circle cx="16.20" cy="4.73" r="3.2" /><circle cx="19.27" cy="7.80" r="3.2" />
      </g>
      <path d="M7.6 12.3l3 3 5.8-6" fill="none" stroke="#fff" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round" />
    </svg>
  `,
})
export class VerifiedBadgeComponent {
  size = input(28);
}
