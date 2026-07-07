import { Component, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

interface Playlist {
  id: number;
  name: string;
  count: number;
  color: string;
  isPublic: boolean;
}

const INITIAL_PLAYLISTS: Playlist[] = [
  { id: 1, name: 'Révisions Physique',  count: 8,  color: '#006A6A', isPublic: true  },
  { id: 2, name: 'Histoire de France',  count: 5,  color: '#4B607C', isPublic: false },
  { id: 3, name: 'Maths & Algos',       count: 12, color: '#7D5260', isPublic: true  },
  { id: 4, name: 'Bio-Chimie Mix',      count: 6,  color: '#365E3D', isPublic: true  },
];

@Component({
  selector: 'app-playlists',
  imports: [MatIconModule, MatButtonModule],
  templateUrl: './playlists.component.html',
  styleUrl: './playlists.component.scss',
})
export class PlaylistsComponent {
  readonly playlists = signal<Playlist[]>(INITIAL_PLAYLISTS);
  readonly showNewForm = signal(false);
  readonly newPlaylistName = signal('');
  private nextId = INITIAL_PLAYLISTS.length + 1;

  readonly accentColors = ['#006A6A', '#4B607C', '#7D5260', '#365E3D', '#5B4C8A', '#7A4B2E'];

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

  createPlaylist(): void {
    const name = this.newPlaylistName().trim();
    if (!name) {
      return;
    }
    const colorIndex = this.nextId % this.accentColors.length;
    const newPlaylist: Playlist = {
      id: this.nextId++,
      name,
      count: 0,
      color: this.accentColors[colorIndex],
      isPublic: false,
    };
    this.playlists.update(list => [...list, newPlaylist]);
    this.showNewForm.set(false);
    this.newPlaylistName.set('');
  }

  onCreateKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      this.createPlaylist();
      return;
    }
    if (event.key === 'Escape') {
      this.cancelNewForm();
    }
  }
}
