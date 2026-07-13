import { Injectable, signal } from '@angular/core';

export interface PlayableTrack {
  id: string;
  title: string;
  subject: string;
  color: string;
}

@Injectable({ providedIn: 'root' })
export class PlayerService {
  private readonly audio = new Audio();
  private readonly currentTrackSignal = signal<PlayableTrack | null>(null);
  private readonly playingSignal = signal(false);

  readonly currentTrack = this.currentTrackSignal.asReadonly();
  readonly playing = this.playingSignal.asReadonly();

  constructor() {
    this.audio.addEventListener('play', () => this.playingSignal.set(true));
    this.audio.addEventListener('pause', () => this.playingSignal.set(false));
    this.audio.addEventListener('ended', () => this.playingSignal.set(false));
  }

  play(track: PlayableTrack, url: string): void {
    this.currentTrackSignal.set(track);
    this.audio.src = url;
    void this.audio.play();
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
}
