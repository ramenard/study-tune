import { Component, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-player-bar',
  imports: [MatIconModule],
  templateUrl: './player-bar.component.html',
  styleUrl: './player-bar.component.scss'
})
export class PlayerBarComponent {
  readonly playing = signal(false);
  readonly currentTrack = signal({ title: 'Thermodynamique Lo-Fi', subject: 'Physique', color: '#006A6A' });

  togglePlay(): void {
    this.playing.update(v => !v);
  }
}