import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { PlayerBarComponent } from '../player-bar/player-bar.component';
import { ProfileService } from '../../core/services/profile.service';
import { FriendshipService } from '../../core/services/friendship.service';

interface NavItem {
  id: string;
  icon: string;
  label: string;
  route: string;
}

@Component({
  selector: 'app-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, MatIconModule, PlayerBarComponent],
  templateUrl: './layout.component.html',
  styleUrl: './layout.component.scss'
})
export class LayoutComponent implements OnInit {
  private readonly profileService = inject(ProfileService);
  private readonly friendshipService = inject(FriendshipService);

  readonly navItems: NavItem[] = [
    { id: 'home',    icon: 'home',          label: 'Accueil',      route: '/' },
    { id: 'gen',     icon: 'bolt',          label: 'Générer',      route: '/generate' },
    { id: 'lib',     icon: 'library_music', label: 'Bibliothèque', route: '/library' },
    { id: 'pl',      icon: 'queue_music',   label: 'Playlists',    route: '/playlists' },
    { id: 'friends', icon: 'group',         label: 'Amis',         route: '/friends' },
    { id: 'tokens',  icon: 'toll',          label: 'Abonnement',   route: '/tokens' },
    { id: 'profile', icon: 'person',        label: 'Profil',       route: '/profile' },
  ];

  readonly generationsRemaining = this.profileService.generationsRemaining;
  readonly pendingRequests = this.friendshipService.pendingReceivedCount;
  readonly dark = signal(false);

  ngOnInit(): void {
    void this.profileService.load();
    void this.friendshipService.loadReceived();
  }

  toggleDark(): void {
    this.dark.update(v => !v);
    document.documentElement.toggleAttribute('data-dark', !this.dark());
  }
}