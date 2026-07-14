import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';
import { MusicService } from '../../core/services/music.service';
import { PlaylistService } from '../../core/services/playlist.service';
import { PlayerService } from '../../core/services/player.service';
import { Music } from '../../api/models/music';
import { Playlist } from '../../api/models/playlist';

type SortKey = 'date' | 'title' | 'style';

const THUMB_COLORS = ['#006A6A', '#4B607C', '#7D5260', '#365E3D', '#5B4C8A', '#7A4B2E'];

@Component({
  selector: 'app-library',
  imports: [FormsModule, MatIconModule, MatMenuModule, MatButtonModule],
  templateUrl: './library.component.html',
  styleUrl: './library.component.scss'
})
export class LibraryComponent implements OnInit {
  private readonly musicService = inject(MusicService);
  private readonly playlistService = inject(PlaylistService);
  private readonly player = inject(PlayerService);

  readonly perPage = 8;

  readonly tracks = this.musicService.musics;
  readonly loading = this.musicService.loading;
  readonly playlists = this.playlistService.playlists;

  readonly search = signal('');
  readonly sort = signal<SortKey>('date');
  readonly page = signal(1);
  readonly editId = signal<string | null>(null);
  readonly deleteId = signal<string | null>(null);
  readonly syncingId = signal<string | null>(null);
  readonly toast = signal<string | null>(null);

  editValueStr = '';

  readonly filtered = computed(() => {
    const query = this.search().toLowerCase();
    const sortKey = this.sort();
    const list = this.tracks().filter((track) =>
      !query ||
      (track.title ?? '').toLowerCase().includes(query) ||
      (track.style ?? '').toLowerCase().includes(query),
    );
    if (sortKey === 'title') {
      return [...list].sort((a, b) => (a.title ?? '').localeCompare(b.title ?? ''));
    }
    if (sortKey === 'style') {
      return [...list].sort((a, b) => (a.style ?? '').localeCompare(b.style ?? ''));
    }
    return [...list].sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''));
  });

  readonly totalPages = computed(() => Math.max(1, Math.ceil(this.filtered().length / this.perPage)));

  readonly paged = computed(() => {
    const start = (this.page() - 1) * this.perPage;
    return this.filtered().slice(start, start + this.perPage);
  });

  readonly pageNumbers = computed(() =>
    Array.from({ length: this.totalPages() }, (_unused, index) => index + 1),
  );

  ngOnInit(): void {
    void this.musicService.load();
    void this.playlistService.load();
  }

  colorFor(id: string): string {
    let hash = 0;
    for (const char of id) {
      hash = (hash + char.charCodeAt(0)) % THUMB_COLORS.length;
    }
    return THUMB_COLORS[hash];
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

  statusLabel(status: string): string {
    if (status === 'complete') {
      return 'Prête';
    }
    if (status === 'generating') {
      return 'En cours';
    }
    if (status === 'error') {
      return 'Échec';
    }
    return 'En attente';
  }

  isPlayable(track: Music): boolean {
    return track.status === 'complete';
  }

  isCurrent(track: Music): boolean {
    return this.player.currentTrack()?.id === track.id && this.player.playing();
  }

  onSearch(value: string): void {
    this.search.set(value);
    this.page.set(1);
  }

  onSort(value: string): void {
    this.sort.set(value as SortKey);
    this.page.set(1);
  }

  startEdit(track: Music): void {
    this.editId.set(track.id);
    this.editValueStr = track.title ?? '';
    this.deleteId.set(null);
  }

  async saveEdit(id: string): Promise<void> {
    const trimmed = this.editValueStr.trim();
    this.editId.set(null);
    if (!trimmed) {
      return;
    }
    await this.musicService.rename(id, trimmed);
    this.showToast('Titre mis à jour');
  }

  onEditKeydown(event: KeyboardEvent, id: string): void {
    if (event.key === 'Enter') {
      void this.saveEdit(id);
      return;
    }
    if (event.key === 'Escape') {
      this.editId.set(null);
    }
  }

  toggleDelete(id: string): void {
    this.deleteId.update((current) => (current === id ? null : id));
    this.editId.set(null);
  }

  async confirmDelete(id: string): Promise<void> {
    this.deleteId.set(null);
    await this.musicService.remove(id);
    this.showToast('Musique supprimée');
  }

  async addToPlaylist(track: Music, playlist: Playlist): Promise<void> {
    await this.playlistService.addMusic(playlist.id, track.id);
    this.showToast(`Ajoutée à « ${playlist.name} »`);
  }

  async refresh(track: Music): Promise<void> {
    if (this.syncingId()) {
      return;
    }
    this.syncingId.set(track.id);
    try {
      await this.musicService.sync(track.id);
      this.showToast('Statut mis à jour');
    } catch {
      this.showToast('Toujours en cours de génération…');
    } finally {
      this.syncingId.set(null);
    }
  }

  async play(track: Music): Promise<void> {
    if (!this.isPlayable(track)) {
      return;
    }
    if (this.player.currentTrack()?.id === track.id) {
      this.player.toggle();
      return;
    }
    const url = await this.musicService.getStreamUrl(track.id);
    this.player.play(
      {
        id: track.id,
        title: track.title ?? 'Sans titre',
        subject: track.style ?? 'Révision',
        color: this.colorFor(track.id),
      },
      url,
    );
  }

  setPage(pageNum: number): void {
    this.page.set(pageNum);
  }

  private showToast(message: string): void {
    this.toast.set(message);
    setTimeout(() => this.toast.set(null), 2200);
  }
}
