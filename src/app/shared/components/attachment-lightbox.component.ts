import { Component, HostListener, input, model } from '@angular/core';
import { MathTextComponent } from '../math/math-text.component';

/**
 * Màn hình phóng to Ảnh đính kèm (cỡ thật, ảnh lớn hơn màn hình thì thu vừa): "Hình i/N", Ghi chú ảnh ở dưới, lật qua lại bằng
 * nút ‹ › hoặc phím ←/→; chỉ đóng khi bấm đúng nút ✕ tròn màu xanh (bấm nền ngoài không đóng).
 * Hỗ trợ 2 ngón tay vuốt zoom hoặc nhấn đúp ở bất kỳ đâu trên popup, lướt ảnh trơn mượt có quán tính (momentum).
 * `index` = null là đang đóng.
 */
@Component({
  selector: 'attachment-lightbox',
  standalone: true,
  imports: [MathTextComponent],
  styles: [
    `
      .att-lightbox {
        position: fixed;
        inset: 0;
        z-index: 1000;
        background: rgba(0, 0, 0, 0.88);
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: hidden;
        touch-action: none;
        user-select: none;
        -webkit-user-select: none;
      }
      .att-lightbox.zoomed {
        cursor: grab;
      }
      .att-lightbox.dragging {
        cursor: grabbing;
      }
      .att-lightbox img {
        max-width: 92vw;
        max-height: 82vh;
        object-fit: contain;
        border-radius: 6px;
        background: #fff;
        user-select: none;
        -webkit-user-drag: none;
        transition: transform 0.25s cubic-bezier(0.2, 0, 0.2, 1);
        transform-origin: center center;
        pointer-events: none;
      }
      .att-lightbox.dragging img {
        transition: none;
      }
      .att-lb-title {
        position: absolute;
        top: 14px;
        left: 50%;
        transform: translateX(-50%);
        color: #fff;
        font-weight: 700;
        font-size: 0.95rem;
        background: rgba(0, 0, 0, 0.4);
        padding: 4px 12px;
        border-radius: 999px;
        z-index: 10;
        pointer-events: none;
      }
      .att-lb-close {
        position: absolute;
        top: 12px;
        right: 14px;
        width: 32px;
        height: 32px;
        border-radius: 50%;
        border: 1.5px solid #fff;
        background: #2563eb;
        color: #fff;
        font-size: 1.1rem;
        cursor: pointer;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.45);
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 0;
        line-height: 1;
        z-index: 10;
        pointer-events: auto;
        transition: background 0.15s;
      }
      .att-lb-close:hover {
        background: #1d4ed8;
      }
      .att-nav {
        position: absolute;
        top: 50%;
        transform: translateY(-50%);
        width: 32px;
        height: 32px;
        border-radius: 50%;
        /* Nền xanh, viền trắng để nút luôn nổi bật dù ảnh màu gì. */
        border: 1.5px solid #fff;
        background: #2563eb;
        color: #fff;
        font-size: 1.3rem;
        padding: 0 0 3px;
        line-height: 1;
        cursor: pointer;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.45);
        z-index: 10;
        pointer-events: auto;
        transition: background 0.15s;
      }
      .att-nav:hover {
        background: #1d4ed8;
      }
      .att-nav.prev {
        left: 12px;
      }
      .att-nav.next {
        right: 12px;
      }
      /* Điện thoại dựng dọc: nút ‹ › ở phía trên (dưới nút ✕ một khoảng để khỏi bấm nhầm);
         ảnh vẫn nằm giữa màn hình theo chiều dọc, chừa 130px trên/dưới để không đè lên nút. */
      @media (orientation: portrait) and (max-width: 599px) {
        .att-lightbox img {
          max-height: calc(100vh - 260px);
        }
        .att-nav {
          top: 84px;
          transform: none;
        }
      }
      /* Ảnh + ghi chú đi liền nhau và cùng được căn giữa màn hình; ghi chú nằm ngay dưới ảnh. */
      .att-lb-body {
        display: flex;
        flex-direction: column;
        align-items: center;
        max-width: 92vw;
        position: relative;
        pointer-events: none;
      }
      .att-lb-note {
        margin-top: 8px;
        max-width: 86vw;
        color: #fff;
        font-size: 0.95rem;
        text-align: center;
        background: rgba(0, 0, 0, 0.65);
        padding: 6px 14px;
        border-radius: 10px;
        white-space: pre-wrap;
        z-index: 10;
        position: relative;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.5);
        pointer-events: none;
      }
    `,
  ],
  template: `
    @if (index() !== null && urls()[index()!]) {
      <div
        class="att-lightbox"
        [class.zoomed]="isZoomed"
        [class.dragging]="isDragging || isPinching || isAnimating"
        (click)="$event.stopPropagation()"
        (dblclick)="onDoubleClick($event)"
        (mousedown)="onMouseDown($event)"
        (touchstart)="onTouchStart($event)"
        (touchmove)="onTouchMove($event)"
        (touchend)="onTouchEnd($event)"
        (touchcancel)="onTouchEnd($event)"
      >
        <div class="att-lb-title">Hình {{ index()! + 1 }}/{{ urls().length }}</div>
        <button
          class="att-lb-close"
          (click)="close(); $event.stopPropagation()"
          (touchstart)="$event.stopPropagation()"
          (mousedown)="$event.stopPropagation()"
          title="Đóng"
        >✕</button>
        @if (urls().length > 1) {
          <button
            class="att-nav prev"
            (click)="step(-1); $event.stopPropagation()"
            (touchstart)="$event.stopPropagation()"
            (mousedown)="$event.stopPropagation()"
            title="Hình trước"
          >‹</button>
        }
        <div class="att-lb-body">
          <img
            [src]="urls()[index()!]"
            alt=""
            [style.transform]="
              isZoomed
                ? 'translate(' + panX + 'px, ' + panY + 'px) scale(' + scale + ')'
                : 'none'
            "
          />
          @if (notes()[index()!]) {
            <div class="att-lb-note">Hình {{ index()! + 1 }}: <math-text [text]="notes()[index()!]" /></div>
          }
        </div>
        @if (urls().length > 1) {
          <button
            class="att-nav next"
            (click)="step(1); $event.stopPropagation()"
            (touchstart)="$event.stopPropagation()"
            (mousedown)="$event.stopPropagation()"
            title="Hình tiếp"
          >›</button>
        }
      </div>
    }
  `,
})
export class AttachmentLightboxComponent {
  urls = input<string[]>([]);
  notes = input<string[]>([]);
  index = model<number | null>(null);

  scale = 1;
  panX = 0;
  panY = 0;
  isDragging = false;
  isPinching = false;
  isAnimating = false;

  get isZoomed(): boolean {
    return this.scale > 1.05;
  }

  private startX = 0;
  private startY = 0;
  private initialPanX = 0;
  private initialPanY = 0;
  private lastTapTime = 0;
  private lastTapX = 0;
  private lastTapY = 0;

  // Hỗ trợ pinch-to-zoom 2 ngón tay bất kỳ đâu trên màn hình
  private initialPinchDist = 0;
  private initialPinchScale = 1;

  // Hỗ trợ quán tính trơn mượt (momentum inertia)
  private lastMoveTime = 0;
  private lastMoveX = 0;
  private lastMoveY = 0;
  private velocityX = 0;
  private velocityY = 0;
  private animFrameId: number | null = null;

  close(): void {
    this.resetZoom();
    this.index.set(null);
  }

  step(delta: number): void {
    const i = this.index();
    const n = this.urls().length;
    if (i === null || n < 2) return;
    this.resetZoom();
    this.index.set((i + delta + n) % n);
  }

  toggleZoom(): void {
    this.stopMomentum();
    if (this.isZoomed) {
      this.resetZoom();
    } else {
      this.scale = 2.2;
      this.panX = 0;
      this.panY = 0;
    }
  }

  resetZoom(): void {
    this.stopMomentum();
    this.scale = 1;
    this.isDragging = false;
    this.isPinching = false;
    this.panX = 0;
    this.panY = 0;
  }

  onDoubleClick(e: MouseEvent): void {
    e.stopPropagation();
    this.toggleZoom();
  }

  onMouseDown(e: MouseEvent): void {
    if (!this.isZoomed || e.button !== 0) return;
    const target = e.target as HTMLElement;
    if (target?.closest('.att-nav') || target?.closest('.att-lb-close')) return;

    e.preventDefault();
    e.stopPropagation();
    this.stopMomentum();
    this.isDragging = true;
    this.startX = e.clientX;
    this.startY = e.clientY;
    this.initialPanX = this.panX;
    this.initialPanY = this.panY;
    this.lastMoveTime = Date.now();
    this.lastMoveX = e.clientX;
    this.lastMoveY = e.clientY;
    this.velocityX = 0;
    this.velocityY = 0;
  }

  @HostListener('window:mousemove', ['$event'])
  onMouseMove(e: MouseEvent): void {
    if (!this.isZoomed || !this.isDragging) return;
    const now = Date.now();
    const dt = now - this.lastMoveTime;
    if (dt > 0) {
      const vx = (e.clientX - this.lastMoveX) / dt;
      const vy = (e.clientY - this.lastMoveY) / dt;
      this.velocityX = vx * 0.7 + this.velocityX * 0.3;
      this.velocityY = vy * 0.7 + this.velocityY * 0.3;
      this.lastMoveTime = now;
      this.lastMoveX = e.clientX;
      this.lastMoveY = e.clientY;
    }
    const maxPanX = window.innerWidth * (this.scale - 0.2);
    const maxPanY = window.innerHeight * (this.scale - 0.2);
    this.panX = Math.max(-maxPanX, Math.min(maxPanX, this.initialPanX + (e.clientX - this.startX)));
    this.panY = Math.max(-maxPanY, Math.min(maxPanY, this.initialPanY + (e.clientY - this.startY)));
  }

  @HostListener('window:mouseup')
  onMouseUp(): void {
    if (this.isDragging) {
      this.isDragging = false;
      const speed = Math.hypot(this.velocityX, this.velocityY);
      if (speed > 0.12 && this.isZoomed) {
        this.startMomentum();
      }
    }
  }

  onTouchStart(e: TouchEvent): void {
    this.stopMomentum();

    // 2 ngón tay: Bắt đầu Pinch-to-zoom ở bất kỳ vị trí nào trên popup
    if (e.touches.length === 2) {
      this.isPinching = true;
      this.isDragging = false;
      this.initialPinchDist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY,
      );
      this.initialPinchScale = this.scale;
      return;
    }

    if (e.touches.length !== 1) return;
    const touch = e.touches[0];
    const now = Date.now();
    const dx = Math.abs(touch.clientX - this.lastTapX);
    const dy = Math.abs(touch.clientY - this.lastTapY);

    if (now - this.lastTapTime < 320 && dx < 35 && dy < 35) {
      // Nhấn đúp 2 lần: chuyển đổi trạng thái phóng to
      this.toggleZoom();
      this.lastTapTime = 0;
      e.preventDefault();
      return;
    }

    this.lastTapTime = now;
    this.lastTapX = touch.clientX;
    this.lastTapY = touch.clientY;

    if (this.isZoomed) {
      this.isDragging = true;
      this.startX = touch.clientX;
      this.startY = touch.clientY;
      this.initialPanX = this.panX;
      this.initialPanY = this.panY;
      this.lastMoveTime = now;
      this.lastMoveX = touch.clientX;
      this.lastMoveY = touch.clientY;
      this.velocityX = 0;
      this.velocityY = 0;
    }
  }

  onTouchMove(e: TouchEvent): void {
    // 2 ngón tay: Pinch-to-zoom trên toàn bộ màn hình popup
    if (e.touches.length === 2 && this.isPinching) {
      e.preventDefault();
      const currentDist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY,
      );
      if (this.initialPinchDist > 0) {
        const rawScale = this.initialPinchScale * (currentDist / this.initialPinchDist);
        this.scale = Math.max(0.85, Math.min(4.5, rawScale));
      }
      return;
    }

    // 1 ngón tay: Kéo rê di chuyển (Pan) khi đã phóng to
    if (!this.isZoomed || !this.isDragging || e.touches.length !== 1) return;
    const touch = e.touches[0];
    const now = Date.now();
    const dt = now - this.lastMoveTime;
    if (dt > 0) {
      const vx = (touch.clientX - this.lastMoveX) / dt;
      const vy = (touch.clientY - this.lastMoveY) / dt;
      this.velocityX = vx * 0.7 + this.velocityX * 0.3;
      this.velocityY = vy * 0.7 + this.velocityY * 0.3;
      this.lastMoveTime = now;
      this.lastMoveX = touch.clientX;
      this.lastMoveY = touch.clientY;
    }

    const maxPanX = window.innerWidth * (this.scale - 0.2);
    const maxPanY = window.innerHeight * (this.scale - 0.2);
    this.panX = Math.max(-maxPanX, Math.min(maxPanX, this.initialPanX + (touch.clientX - this.startX)));
    this.panY = Math.max(-maxPanY, Math.min(maxPanY, this.initialPanY + (touch.clientY - this.startY)));
    e.preventDefault();
  }

  onTouchEnd(e?: TouchEvent): void {
    if (this.isPinching) {
      this.isPinching = false;
      if (this.scale < 1.05) {
        this.resetZoom();
      } else {
        this.scale = Math.min(4.0, Math.max(1.0, this.scale));
      }
      return;
    }

    if (this.isDragging) {
      this.isDragging = false;
      const speed = Math.hypot(this.velocityX, this.velocityY);
      if (speed > 0.12 && this.isZoomed) {
        this.startMomentum();
      }
    }
  }

  private startMomentum(): void {
    this.stopMomentum();
    this.isAnimating = true;
    let vx = this.velocityX * 16;
    let vy = this.velocityY * 16;

    const maxSpeed = 40;
    const speed = Math.hypot(vx, vy);
    if (speed > maxSpeed) {
      vx = (vx / speed) * maxSpeed;
      vy = (vy / speed) * maxSpeed;
    }

    const step = () => {
      if (!this.isAnimating) return;
      vx *= 0.92;
      vy *= 0.92;

      if (Math.hypot(vx, vy) < 0.2) {
        this.stopMomentum();
        return;
      }

      const maxPanX = window.innerWidth * (this.scale - 0.2);
      const maxPanY = window.innerHeight * (this.scale - 0.2);

      this.panX = Math.max(-maxPanX, Math.min(maxPanX, this.panX + vx));
      this.panY = Math.max(-maxPanY, Math.min(maxPanY, this.panY + vy));

      if (Math.abs(this.panX) >= maxPanX) vx = 0;
      if (Math.abs(this.panY) >= maxPanY) vy = 0;

      this.animFrameId = requestAnimationFrame(step);
    };

    this.animFrameId = requestAnimationFrame(step);
  }

  private stopMomentum(): void {
    this.isAnimating = false;
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
  }

  @HostListener('document:keydown', ['$event'])
  onKey(e: KeyboardEvent): void {
    if (this.index() === null) return;
    if (e.key === 'ArrowLeft') this.step(-1);
    else if (e.key === 'ArrowRight') this.step(1);
  }
}
