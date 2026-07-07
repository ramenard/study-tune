import { Component, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';

interface Track {
  id: number;
  title: string;
  subject: string;
  style: string;
  duration: string;
  color: string;
  date: string;
}

interface Playlist {
  id: number;
  name: string;
  count: number;
  color: string;
}

type SortKey = 'date' | 'title' | 'subject';

const STYLE_COLORS: Record<string, string> = {
  'Lo-fi':        'var(--md-sys-color-primary-container)',
  'Classique':    'var(--md-sys-color-tertiary-container)',
  'Électronique': 'var(--md-sys-color-secondary-container)',
  'Cinématique':  'var(--md-sys-color-surface-variant)',
  'Ambiant':      'var(--md-sys-color-surface-variant)',
};

@Component({
  selector: 'app-library',
  imports: [FormsModule, MatIconModule, MatMenuModule, MatButtonModule],
  templateUrl: './library.component.html',
  styleUrl: './library.component.scss'
})
export class LibraryComponent {
  readonly perPage = 8;

  readonly playlists: Playlist[] = [
    { id: 1, name: 'Révisions Physique', count: 8,  color: '#006A6A' },
    { id: 2, name: 'Histoire de France', count: 5,  color: '#4B607C' },
    { id: 3, name: 'Maths & Algos',      count: 12, color: '#7D5260' },
    { id: 4, name: 'Bio-Chimie Mix',     count: 6,  color: '#365E3D' },
  ];

  readonly tracks = signal<Track[]>([
    { id: 1,  title: 'Thermodynamique Lo-Fi',    subject: 'Physique',     style: 'Lo-fi',        duration: '3:42', color: '#006A6A', date: '2026-04-20' },
    { id: 2,  title: 'Révolution Française',      subject: 'Histoire',     style: 'Classique',    duration: '4:15', color: '#4B607C', date: '2026-04-18' },
    { id: 3,  title: 'Algorithmes & Structures',  subject: 'Informatique', style: 'Électronique', duration: '2:58', color: '#7D5260', date: '2026-04-17' },
    { id: 4,  title: 'Cellules & ADN',            subject: 'Biologie',     style: 'Cinématique',  duration: '3:21', color: '#365E3D', date: '2026-04-15' },
    { id: 5,  title: 'Mécanique Quantique Chill', subject: 'Physique',     style: 'Lo-fi',        duration: '4:02', color: '#006A6A', date: '2026-04-14' },
    { id: 6,  title: 'Guerre de Cent Ans',        subject: 'Histoire',     style: 'Cinématique',  duration: '3:55', color: '#4B607C', date: '2026-04-12' },
    { id: 7,  title: 'Dérivées & Intégrales',     subject: 'Maths',        style: 'Électronique', duration: '2:44', color: '#7D5260', date: '2026-04-10' },
    { id: 8,  title: 'Photosynthèse Ambiant',     subject: 'Biologie',     style: 'Ambiant',      duration: '3:10', color: '#365E3D', date: '2026-04-09' },
    { id: 9,  title: 'Optique Géométrique',       subject: 'Physique',     style: 'Classique',    duration: '3:33', color: '#006A6A', date: '2026-04-07' },
    { id: 10, title: 'La Renaissance',            subject: 'Histoire',     style: 'Classique',    duration: '4:20', color: '#4B607C', date: '2026-04-05' },
    { id: 11, title: 'Structures de Données',     subject: 'Informatique', style: 'Électronique', duration: '2:50', color: '#7D5260', date: '2026-04-03' },
    { id: 12, title: 'Génétique Mendélienne',     subject: 'Biologie',     style: 'Lo-fi',        duration: '3:08', color: '#365E3D', date: '2026-04-01' },
  ]);

  readonly search  = signal('');
  readonly sort    = signal<SortKey>('date');
  readonly page    = signal(1);
  readonly editId  = signal<number | null>(null);
  readonly deleteId = signal<number | null>(null);
  readonly addedTo = signal<Record<number, number>>({});
  readonly toast   = signal<string | null>(null);

  editValueStr = '';

  readonly filtered = computed(() => {
    const query   = this.search().toLowerCase();
    const sortKey = this.sort();
    const list    = this.tracks().filter(track =>
      !query || track.title.toLowerCase().includes(query) || track.subject.toLowerCase().includes(query)
    );
    if (sortKey === 'title') {
      return [...list].sort((trackA, trackB) => trackA.title.localeCompare(trackB.title));
    }
    if (sortKey === 'subject') {
      return [...list].sort((trackA, trackB) => trackA.subject.localeCompare(trackB.subject));
    }
    return [...list].sort((trackA, trackB) => trackB.date.localeCompare(trackA.date));
  });

  readonly totalPages = computed(() => Math.ceil(this.filtered().length / this.perPage));

  readonly paged = computed(() => {
    const start = (this.page() - 1) * this.perPage;
    return this.filtered().slice(start, start + this.perPage);
  });

  readonly pageNumbers = computed(() =>
    Array.from({ length: this.totalPages() }, (_unused, index) => index + 1)
  );

  readonly rangeLabel = computed(() => {
    const start = (this.page() - 1) * this.perPage + 1;
    const end   = Math.min(this.page() * this.perPage, this.filtered().length);
    return `${start}–${end} sur ${this.filtered().length}`;
  });

  styleColor(style: string): string {
    const color = STYLE_COLORS[style];
    if (color) {
      return color;
    }
    return 'var(--md-sys-color-surface-variant)';
  }

  onSearch(value: string): void {
    this.search.set(value);
    this.page.set(1);
  }

  onSort(value: string): void {
    this.sort.set(value as SortKey);
    this.page.set(1);
  }

  startEdit(track: Track): void {
    this.editId.set(track.id);
    this.editValueStr = track.title;
    this.deleteId.set(null);
  }

  saveEdit(id: number): void {
    const trimmed = this.editValueStr.trim();
    if (trimmed) {
      this.tracks.update(allTracks =>
        allTracks.map(track => {
          if (track.id !== id) return track;
          return { ...track, title: trimmed };
        })
      );
    }
    this.editId.set(null);
  }

  onEditKeydown(event: KeyboardEvent, id: number): void {
    if (event.key === 'Enter') {
      this.saveEdit(id);
      return;
    }
    if (event.key !== 'Escape') {
      return;
    }
    this.editId.set(null);
  }

  toggleDelete(id: number): void {
    if (this.deleteId() === id) {
      this.deleteId.set(null);
      return;
    }
    this.deleteId.set(id);
    this.editId.set(null);
  }

  confirmDelete(id: number): void {
    this.tracks.update(allTracks => allTracks.filter(track => track.id !== id));
    this.deleteId.set(null);
    this.showToast('Musique supprimée');
  }

  addToPlaylist(trackId: number, playlist: Playlist): void {
    this.addedTo.update(currentMap => ({ ...currentMap, [trackId]: playlist.id }));
    this.showToast(`Ajoutée à "${playlist.name}" ✓`);
  }

  playTrack(_track: Track): void {}

  setPage(pageNum: number): void {
    this.page.set(pageNum);
  }

  private showToast(message: string): void {
    this.toast.set(message);
    setTimeout(() => this.toast.set(null), 2200);
  }
}
