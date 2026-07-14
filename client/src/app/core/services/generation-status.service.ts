import { computed, inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Api } from '../../api/api';
import { musicControllerSync } from '../../api/fn/music/music-controller-sync';
import { MusicService } from './music.service';

interface PendingGeneration {
  id: string;
  title: string;
}

const POLL_INTERVAL_MS = 12000;

@Injectable({ providedIn: 'root' })
export class GenerationStatusService {
  private readonly api = inject(Api);
  private readonly musicService = inject(MusicService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly router = inject(Router);

  private readonly pendingSignal = signal<PendingGeneration[]>([]);
  private intervalId: ReturnType<typeof setInterval> | null = null;

  readonly pending = this.pendingSignal.asReadonly();
  readonly pendingCount = computed(() => this.pendingSignal().length);
  readonly isGenerating = computed(() => this.pendingSignal().length > 0);

  watch(id: string, title: string): void {
    if (this.pendingSignal().some((item) => item.id === id)) {
      return;
    }
    this.pendingSignal.update((list) => [...list, { id, title: title || 'Ta musique' }]);
    this.ensurePolling();
  }

  async checkNow(): Promise<void> {
    await this.loadPendingFromServer();
    await this.syncPending();
  }

  private async loadPendingFromServer(): Promise<void> {
    await this.musicService.load();
    const merged = [...this.pendingSignal()];

    for (const music of this.musicService.musics()) {
      const inProgress = music.status !== 'complete' && music.status !== 'error';
      if (inProgress && !merged.some((item) => item.id === music.id)) {
        merged.push({ id: music.id, title: music.title || 'Ta musique' });
      }
    }

    this.pendingSignal.set(merged);
    this.ensurePolling();
  }

  private async syncPending(): Promise<void> {
    let changed = false;

    for (const item of [...this.pendingSignal()]) {
      try {
        const music = await this.api.invoke(musicControllerSync, { id: item.id });
        if (music.status === 'complete') {
          this.notifyReady(item);
          this.remove(item.id);
          changed = true;
        } else if (music.status === 'error') {
          this.remove(item.id);
          changed = true;
        }
      } catch {
        // still generating or temporarily unreachable — keep watching
      }
    }

    if (changed) {
      await this.musicService.load();
    }
    if (this.pendingSignal().length === 0) {
      this.stopPolling();
    }
  }

  private notifyReady(item: PendingGeneration): void {
    const ref = this.snackBar.open(`« ${item.title} » est prête 🎵`, 'Voir', { duration: 7000 });
    ref.onAction().subscribe(() => void this.router.navigate(['/library']));
  }

  clear(): void {
    this.stopPolling();
    this.pendingSignal.set([]);
  }

  private remove(id: string): void {
    this.pendingSignal.update((list) => list.filter((item) => item.id !== id));
  }

  private ensurePolling(): void {
    if (this.intervalId !== null || this.pendingSignal().length === 0) {
      return;
    }
    this.intervalId = setInterval(() => void this.syncPending(), POLL_INTERVAL_MS);
  }

  private stopPolling(): void {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }
}
