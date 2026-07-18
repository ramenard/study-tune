import { computed, inject, Injectable, signal } from '@angular/core';
import { MusicService } from './music.service';
import { PlayableTrack } from '@shared/models/playable-track';

@Injectable({ providedIn: 'root' })
export class PlayerService {
  private readonly musicService = inject(MusicService);
  private readonly audio = new Audio();

  private readonly currentTrackSignal = signal<PlayableTrack | null>(null);
  private readonly playingSignal = signal(false);
  private readonly currentTimeSignal = signal(0);
  private readonly durationSignal = signal(0);
  private readonly volumeSignal = signal(1);
  private readonly repeatSignal = signal(false);
  private readonly queueSignal = signal<PlayableTrack[]>([]);
  private readonly queueNameSignal = signal<string | null>(null);
  private queueIndex = 0;

  readonly currentTrack = this.currentTrackSignal.asReadonly();
  readonly playing = this.playingSignal.asReadonly();
  readonly currentTime = this.currentTimeSignal.asReadonly();
  readonly duration = this.durationSignal.asReadonly();
  readonly volume = this.volumeSignal.asReadonly();
  readonly repeat = this.repeatSignal.asReadonly();
  readonly queueName = this.queueNameSignal.asReadonly();
  readonly progress = computed(() => {
    const total = this.durationSignal();
    return total > 0 ? this.currentTimeSignal() / total : 0;
  });

  constructor() {
    this.audio.volume = this.volumeSignal();
    this.audio.addEventListener('play', () => this.playingSignal.set(true));
    this.audio.addEventListener('pause', () => this.playingSignal.set(false));
    this.audio.addEventListener('timeupdate', () => this.currentTimeSignal.set(this.audio.currentTime));
    this.audio.addEventListener('loadedmetadata', () => this.durationSignal.set(this.audio.duration || 0));
    this.audio.addEventListener('ended', () => this.handleEnded());
  }

  play(track: PlayableTrack): void {
    this.setQueue([track], 0, null);
  }

  playQueue(tracks: PlayableTrack[], startIndex: number, name: string | null): void {
    if (tracks.length === 0) {
      return;
    }
    this.setQueue(tracks, startIndex, name);
  }

  toggle(): void {
    if (!this.currentTrackSignal()) {
      return;
    }
    if (this.audio.paused) {
      void this.audio.play();
      return;
    }
    this.audio.pause();
  }

  next(): void {
    const queue = this.queueSignal();
    if (queue.length === 0) {
      return;
    }
    this.queueIndex = (this.queueIndex + 1) % queue.length;
    void this.loadCurrent();
  }

  previous(): void {
    const queue = this.queueSignal();
    if (queue.length === 0) {
      return;
    }
    if (this.audio.currentTime > 3) {
      this.audio.currentTime = 0;
      return;
    }
    this.queueIndex = (this.queueIndex - 1 + queue.length) % queue.length;
    void this.loadCurrent();
  }

  seek(seconds: number): void {
    if (this.durationSignal() <= 0) {
      return;
    }
    this.audio.currentTime = seconds;
    this.currentTimeSignal.set(seconds);
  }

  setVolume(value: number): void {
    this.volumeSignal.set(value);
    this.audio.volume = value;
  }

  toggleRepeat(): void {
    this.repeatSignal.update((value) => !value);
  }

  stop(): void {
    this.audio.pause();
    this.audio.removeAttribute('src');
    this.audio.load();
    this.currentTrackSignal.set(null);
    this.playingSignal.set(false);
    this.currentTimeSignal.set(0);
    this.durationSignal.set(0);
    this.queueSignal.set([]);
    this.queueNameSignal.set(null);
    this.queueIndex = 0;
  }

  private setQueue(tracks: PlayableTrack[], startIndex: number, name: string | null): void {
    this.queueSignal.set(tracks);
    this.queueNameSignal.set(name);
    this.queueIndex = startIndex;
    void this.loadCurrent();
  }

  private async loadCurrent(): Promise<void> {
    const track = this.queueSignal()[this.queueIndex];
    if (!track) {
      return;
    }
    this.currentTrackSignal.set(track);
    this.currentTimeSignal.set(0);
    const url = await this.musicService.getStreamUrl(track.id);
    this.audio.src = url;
    void this.audio.play();
  }

  private handleEnded(): void {
    if (this.repeatSignal()) {
      this.audio.currentTime = 0;
      void this.audio.play();
      return;
    }
    if (this.queueSignal().length <= 1) {
      this.playingSignal.set(false);
      return;
    }
    this.next();
  }
}
