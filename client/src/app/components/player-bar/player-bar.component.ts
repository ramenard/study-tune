import { Component, inject } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { PlayerService } from '../../core/services/player.service';

@Component({
  selector: 'app-player-bar',
  imports: [MatIconModule],
  templateUrl: './player-bar.component.html',
  styleUrl: './player-bar.component.scss'
})
export class PlayerBarComponent {
  private readonly player = inject(PlayerService);

  readonly currentTrack = this.player.currentTrack;
  readonly playing = this.player.playing;

  togglePlay(): void {
    this.player.toggle();
  }
}
