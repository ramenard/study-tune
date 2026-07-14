import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { PlaylistService } from '../../core/services/playlist.service';
import { PlayerService } from '../../core/services/player.service';
import { Playlist } from '../../api/models/playlist';

const ACCENT_COLORS = ['#006A6A', '#4B607C', '#7D5260', '#365E3D', '#5B4C8A', '#7A4B2E'];

@Component({
  selector: 'app-playlists',
  imports: [MatIconModule, MatButtonModule],
  templateUrl: './playlists.component.html',
  styleUrl: './playlists.component.scss',
})
export class PlaylistsComponent implements OnInit {
  private readonly playlistService = inject(PlaylistService);
  private readonly player = inject(PlayerService);

  readonly playlists = this.playlistService.playlists;
  readonly showNewForm = signal(false);
  readonly newPlaylistName = signal('');
  readonly selectedId = signal<string | null>(null);
  readonly busy = signal(false);

  readonly selectedPlaylist = computed(() =>
    this.playlists().find((playlist) => playlist.id === this.selectedId()) ?? null,
  );

  ngOnInit(): void {
    void this.playlistService.load();
  }

  colorFor(id: string): string {
    let hash = 0;
    for (const char of id) {
      hash = (hash + char.charCodeAt(0)) % ACCENT_COLORS.length;
    }
    return ACCENT_COLORS[hash];
  }

  openNewForm(): void {
    this.showNewForm.set(true);
  }

  cancelNewForm(): void {
    this.showNewForm.set(false);
    this.newPlaylistName.set('');
  }

  onNameInput(value: string): void {
    this.newPlaylistName.set(value);
  }

  async createPlaylist(): Promise<void> {
    const name = this.newPlaylistName().trim();
    if (!name || this.busy()) {
      return;
    }

    this.busy.set(true);
    try {
      await this.playlistService.create(name);
      this.cancelNewForm();
    } finally {
      this.busy.set(false);
    }
  }

  select(id: string): void {
    this.selectedId.update((current) => (current === id ? null : id));
  }

  async deletePlaylist(event: Event, id: string): Promise<void> {
    event.stopPropagation();
    await this.playlistService.remove(id);
    if (this.selectedId() === id) {
      this.selectedId.set(null);
    }
  }

  async removeMusic(playlistId: string, musicId: string): Promise<void> {
    await this.playlistService.removeMusic(playlistId, musicId);
  }

  onCreateKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      void this.createPlaylist();
      return;
    }
    if (event.key === 'Escape') {
      this.cancelNewForm();
    }
  }

  playableCount(playlist: Playlist): number {
    return playlist.musics.filter((music) => music.status === 'complete').length;
  }

  playPlaylist(event: Event, playlist: Playlist): void {
    event.stopPropagation();
    const tracks = playlist.musics
      .filter((music) => music.status === 'complete')
      .map((music) => ({
        id: music.id,
        title: music.title || 'Sans titre',
        subject: music.style || 'Révision',
        color: this.colorFor(music.id),
      }));

    if (tracks.length === 0) {
      return;
    }
    this.player.playQueue(tracks, 0, playlist.name);
  }

  formatDuration(seconds: number | undefined): string {
    if (!seconds) {
      return '—';
    }
    const total = Math.round(seconds);
    const minutes = Math.floor(total / 60);
    const remainder = total % 60;
    return `${minutes}:${remainder.toString().padStart(2, '0')}`;
  }
}
