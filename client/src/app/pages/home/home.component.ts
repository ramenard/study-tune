import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { Api } from '../../api/api';
import { musicControllerFindAll } from '../../api/fn/music/music-controller-find-all';
import { friendshipControllerFindFriends } from '../../api/fn/friendship/friendship-controller-find-friends';
import { Music } from '../../api/models/music';
import { ProfileService } from '../../core/services/profile.service';

interface RecentSong {
  id: string;
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

const THUMB_COLORS = ['#006A6A', '#4B607C', '#7D5260', '#365E3D', '#6c5ce7'];

@Component({
  selector: 'app-home',
  imports: [MatIconModule, MatButtonModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HomeComponent implements OnInit {
  private readonly api = inject(Api);
  private readonly router = inject(Router);
  private readonly profileService = inject(ProfileService);

  readonly username = this.profileService.username;
  readonly plan = this.profileService.plan;
  readonly isPremium = this.profileService.isPremium;
  readonly generationsRemaining = this.profileService.generationsRemaining;
  readonly monthlyAllowance = this.profileService.monthlyAllowance;

  private readonly musicTotal = signal(0);
  private readonly friendsCount = signal(0);
  readonly recentSongs = signal<RecentSong[]>([]);

  readonly greeting = computed(() => {
    const name = this.username();
    if (!name) {
      return 'Bonjour 👋';
    }
    return `Bonjour, ${name} 👋`;
  });

  readonly planLabel = computed(() => {
    if (this.isPremium()) {
      return 'Abonné Premium';
    }
    return 'Offre découverte';
  });

  readonly generationPercent = computed(() => {
    const allowance = this.monthlyAllowance();
    if (allowance <= 0) {
      return 0;
    }
    return Math.round((this.generationsRemaining() / allowance) * 100);
  });

  readonly stats = computed<Stat[]>(() => [
    { label: 'Musiques créées', value: String(this.musicTotal()), icon: 'music_note' },
    { label: 'Amis', value: String(this.friendsCount()), icon: 'group' },
  ]);

  ngOnInit(): void {
    void this.loadMusic();
    void this.loadFriends();
  }

  goToGenerate(): void {
    void this.router.navigate(['/generate']);
  }

  goToLibrary(): void {
    void this.router.navigate(['/library']);
  }

  private async loadMusic(): Promise<void> {
    const result = await this.api.invoke(musicControllerFindAll, { page: 1, limit: 5 });
    this.musicTotal.set(result.total);
    this.recentSongs.set(result.data.map((music, index) => this.toRecentSong(music, index)));
  }

  private async loadFriends(): Promise<void> {
    const friends = await this.api.invoke(friendshipControllerFindFriends);
    this.friendsCount.set(friends.length);
  }

  private toRecentSong(music: Music, index: number): RecentSong {
    return {
      id: music.id,
      title: music.title ?? 'Sans titre',
      subject: music.style ?? 'Révision',
      duration: this.formatDuration(music.duration),
      color: THUMB_COLORS[index % THUMB_COLORS.length],
    };
  }

  private formatDuration(seconds: number): string {
    if (!seconds) {
      return '—';
    }
    const total = Math.round(seconds);
    const minutes = Math.floor(total / 60);
    const remainder = total % 60;
    return `${minutes}:${remainder.toString().padStart(2, '0')}`;
  }
}
