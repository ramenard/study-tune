import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { PlayerService } from '@core/services/player.service';
import { PlaylistService } from '@core/services/playlist.service';
import { FavoritesService } from '@core/services/favorites.service';
import { MusicService } from '@core/services/music.service';
import { LyricsViewComponent } from '@features/player/lyrics-view/lyrics-view.component';

@Component({
  selector: 'app-player-bar',
  imports: [MatIconModule, MatMenuModule, LyricsViewComponent],
  templateUrl: './player-bar.component.html',
  styleUrl: './player-bar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PlayerBarComponent {
  private readonly player = inject(PlayerService);
  private readonly playlistService = inject(PlaylistService);
  private readonly favoritesService = inject(FavoritesService);
  private readonly musicService = inject(MusicService);

  readonly currentTrack = this.player.currentTrack;
  readonly playing = this.player.playing;
  readonly currentTime = this.player.currentTime;
  readonly duration = this.player.duration;
  readonly volume = this.player.volume;
  readonly repeat = this.player.repeat;
  readonly queueName = this.player.queueName;
  readonly playlists = this.playlistService.playlists;
  readonly showLyrics = signal(false);

  readonly isLiked = computed(() => {
    const track = this.currentTrack();
    return track ? this.favoritesService.isFavorite(track.id) : false;
  });

  readonly volumeIcon = computed(() => {
    const value = this.volume();
    if (value === 0) {
      return 'volume_off';
    }
    if (value < 0.5) {
      return 'volume_down';
    }
    return 'volume_up';
  });

  loadPlaylists(): void {
    void this.playlistService.load();
  }

  toggleLyrics(): void {
    this.showLyrics.update((visible) => !visible);
  }

  togglePlay(): void {
    this.player.toggle();
  }

  next(): void {
    this.player.next();
  }

  previous(): void {
    this.player.previous();
  }

  toggleRepeat(): void {
    this.player.toggleRepeat();
  }

  toggleLike(): void {
    const track = this.currentTrack();
    if (!track) {
      return;
    }
    void this.favoritesService.toggle(track.id);
  }

  onSeek(value: string): void {
    this.player.seek(Number(value));
  }

  onVolume(value: string): void {
    this.player.setVolume(Number(value));
  }

  async addCurrentToPlaylist(playlistId: string): Promise<void> {
    const track = this.currentTrack();
    if (!track) {
      return;
    }
    await this.playlistService.addMusic(playlistId, track.id);
  }

  async downloadCurrent(): Promise<void> {
    const track = this.currentTrack();
    if (!track) {
      return;
    }
    await this.musicService.download(track.id, track.title);
  }

  formatTime(seconds: number): string {
    if (!seconds || !isFinite(seconds)) {
      return '0:00';
    }
    const total = Math.floor(seconds);
    const minutes = Math.floor(total / 60);
    const remainder = total % 60;
    return `${minutes}:${remainder.toString().padStart(2, '0')}`;
  }
}
