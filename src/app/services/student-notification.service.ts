import { Injectable, signal } from '@angular/core';

export interface BadgeCounts {
  home: number;
  scoreboard: number;
  discussions: number;
}

@Injectable({ providedIn: 'root' })
export class StudentNotificationService {
  badgeCounts = signal<BadgeCounts>({ home: 0, scoreboard: 0, discussions: 0 });

  private lastVisited: BadgeCounts = { home: 0, scoreboard: 0, discussions: 0 };

  markTabVisited(tab: keyof BadgeCounts): void {
    this.lastVisited[tab] = Date.now();
    this.badgeCounts.update((c) => ({ ...c, [tab]: 0 }));
  }

  getLastVisited(tab: keyof BadgeCounts): number {
    return this.lastVisited[tab];
  }

  updateBadge(tab: keyof BadgeCounts, count: number): void {
    this.badgeCounts.update((c) => ({ ...c, [tab]: count }));
  }
}
