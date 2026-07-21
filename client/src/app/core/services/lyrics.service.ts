import { inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '@env/environment';
import { AlignedWord } from '@shared/models/aligned-word';

interface LyricsResponse {
  lyricsStatus: 'none' | 'pending' | 'ready' | 'failed';
  alignedLyrics: AlignedWord[] | null;
  lyrics: string | null;
}

type LyricsStatus = 'idle' | 'loading' | 'ready' | 'failed';

@Injectable({ providedIn: 'root' })
export class LyricsService {
  private readonly http = inject(HttpClient);
  private readonly maxRetries = 6;
  private readonly retryDelayMs = 5000;
  private currentMusicId: string | null = null;

  private readonly alignedSignal = signal<AlignedWord[]>([]);
  private readonly rawSignal = signal<string | null>(null);
  private readonly statusSignal = signal<LyricsStatus>('idle');

  readonly aligned = this.alignedSignal.asReadonly();
  readonly raw = this.rawSignal.asReadonly();
  readonly status = this.statusSignal.asReadonly();

  async loadForMusic(musicId: string): Promise<void> {
    this.currentMusicId = musicId;
    this.alignedSignal.set([]);
    this.rawSignal.set(null);
    this.statusSignal.set('loading');

    for (let attempt = 0; attempt < this.maxRetries; attempt++) {
      if (this.currentMusicId !== musicId) {
        return;
      }

      const response = await this.fetchLyrics(musicId);
      if (this.currentMusicId !== musicId) {
        return;
      }

      if (response === null) {
        this.statusSignal.set('failed');
        return;
      }

      this.rawSignal.set(response.lyrics);

      if (response.lyricsStatus === 'ready' && response.alignedLyrics !== null) {
        this.alignedSignal.set(response.alignedLyrics);
        this.statusSignal.set('ready');
        return;
      }

      if (response.lyricsStatus === 'failed' || response.lyricsStatus === 'none') {
        this.statusSignal.set('failed');
        return;
      }

      await this.delay(this.retryDelayMs);
    }

    this.statusSignal.set('failed');
  }

  clear(): void {
    this.currentMusicId = null;
    this.alignedSignal.set([]);
    this.rawSignal.set(null);
    this.statusSignal.set('idle');
  }

  private async fetchLyrics(musicId: string): Promise<LyricsResponse | null> {
    try {
      return await firstValueFrom(
        this.http.get<LyricsResponse>(`${environment.apiUrl}/music/${musicId}/lyrics`),
      );
    } catch {
      return null;
    }
  }

  private delay(durationMs: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, durationMs));
  }
}
