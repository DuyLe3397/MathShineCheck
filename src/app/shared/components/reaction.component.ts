import { Component, Input, Output, EventEmitter, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

export const REACTIONS = [
  { type: 'like', emoji: '👍', label: 'Thích' },
  { type: 'sad', emoji: '😢', label: 'Buồn' },
  { type: 'laugh', emoji: '😂', label: 'Cười' },
  { type: 'angry', emoji: '😡', label: 'Phẫn nộ' },
];

@Component({
  selector: 'comment-reactions',
  standalone: true,
  imports: [CommonModule],
  styles: [
    `
      :host {
        position: absolute;
        top: 0;
        right: 0;
        z-index: 5;
        line-height: 0;
      }
      .trigger-area {
        display: inline-flex;
        align-items: center;
        gap: 2px;
        padding: 1px 4px;
        border-radius: 10px;
        cursor: pointer;
        background: #f1f5f9;
        border: 1px solid #e2e8f0;
        font-size: 0.72rem;
        transition: background 0.15s;
      }
      .trigger-area:hover {
        background: #e2e8f0;
      }
      .trigger-emoji {
        font-size: 0.85rem;
        line-height: 1;
      }
      .other-badge {
        font-size: 0.7rem;
        line-height: 1;
        margin-left: 1px;
      }

      .reaction-picker-overlay {
        position: fixed;
        inset: 0;
        z-index: 1000;
        background: transparent;
      }
      .reaction-picker {
        position: absolute;
        top: 100%;
        right: 0;
        display: flex;
        gap: 2px;
        background: #fff;
        border-radius: 24px;
        padding: 6px 8px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
        z-index: 1001;
        margin-top: 4px;
      }
      .reaction-option {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 36px;
        height: 36px;
        border: none;
        background: transparent;
        border-radius: 50%;
        cursor: pointer;
        font-size: 1.3rem;
        transition:
          transform 0.15s,
          background 0.15s;
      }
      .reaction-option:hover {
        transform: scale(1.3);
        background: #f1f5f9;
      }
    `,
  ],
  template: `
    <div class="trigger-area" (click)="onTriggerClick($event)">
      <span class="trigger-emoji">{{ triggerEmoji }}</span>
      @for (r of otherSummary; track r.type) {
        <span class="other-badge">{{ r.emoji }}</span>
      }
    </div>

    @if (showPicker()) {
      @if (isMobile) {
        <div class="reaction-picker-overlay" (click)="closePicker()"></div>
      }
      <div class="reaction-picker">
        @for (r of REACTIONS; track r.type) {
          <button
            class="reaction-option"
            (click)="onPick(r.type)"
            title="{{ r.label }}"
          >
            {{ r.emoji }}
          </button>
        }
      </div>
    }
  `,
})
export class CommentReactionsComponent {
  readonly REACTIONS = REACTIONS;
  readonly isMobile = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

  @Input() reactions: Record<string, string> = {};
  @Input() currentUserId = '';
  @Output() react = new EventEmitter<string>();
  @Output() removeReaction = new EventEmitter<void>();

  showPicker = signal(false);

  get currentUserReaction(): string | null {
    return this.reactions[this.currentUserId] || null;
  }

  get triggerEmoji(): string {
    if (this.currentUserReaction) {
      const r = REACTIONS.find((x) => x.type === this.currentUserReaction);
      return r ? r.emoji : '😊';
    }
    return '😊';
  }

  get otherSummary(): { type: string; emoji: string }[] {
    const seen = new Set<string>();
    const result: { type: string; emoji: string }[] = [];
    for (const [uid, type] of Object.entries(this.reactions)) {
      if (uid !== this.currentUserId && !seen.has(type)) {
        seen.add(type);
        const r = REACTIONS.find((x) => x.type === type);
        if (r) result.push(r);
      }
    }
    return result;
  }

  onTriggerClick(e: Event): void {
    e.stopPropagation();
    if (this.currentUserReaction) {
      this.removeReaction.emit();
      this.closePicker();
    } else {
      this.showPicker.update((v) => !v);
    }
  }

  closePicker(): void {
    this.showPicker.set(false);
  }

  onPick(type: string): void {
    if (this.currentUserReaction === type) {
      this.removeReaction.emit();
    } else {
      this.react.emit(type);
    }
    this.closePicker();
  }
}
