import { Component, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

interface Song {
  id: number;
  title: string;
  subject: string;
  duration: string;
  color: string;
}

interface Stat {
  label: string;
  value: string;
  icon: string;
}

@Component({
  selector: 'app-home',
  imports: [MatIconModule, MatButtonModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent {
  readonly tokens = signal(350);

  readonly stats: Stat[] = [
    { label: 'Musiques créées',   value: '28', icon: 'music_note' },
    { label: 'Fiches générées',   value: '41', icon: 'description' },
    { label: 'Amis',              value: '4',  icon: 'group' },
  ];

  readonly recentSongs = signal<Song[]>([
    { id: 1, title: 'Thermodynamique Lo-Fi',    subject: 'Physique',      duration: '3:42', color: '#006A6A' },
    { id: 2, title: 'Révolution Française',     subject: 'Histoire',      duration: '4:15', color: '#4B607C' },
    { id: 3, title: 'Algorithmes & Structures', subject: 'Informatique',  duration: '2:58', color: '#7D5260' },
    { id: 4, title: 'Cellules & ADN',           subject: 'Biologie',      duration: '3:21', color: '#365E3D' },
  ]);

  get tokenPercent(): number {
    return Math.min(100, Math.round(this.tokens() / 500 * 100));
  }
}