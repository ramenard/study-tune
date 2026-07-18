import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { Router, RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { PlayerBarComponent } from '../player-bar/player-bar.component';
import { ProfileService } from '@core/services/profile.service';
import { FriendshipService } from '@core/services/friendship.service';
import { FavoritesService } from '@core/services/favorites.service';
import { GenerationStatusService } from '@core/services/generation-status.service';
import { AuthService } from '@core/services/auth.service';
import { ThemeService } from '@core/services/theme.service';
import { NavItem } from '@shared/models/nav-item';

@Component({
  selector: 'app-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, MatIconModule, PlayerBarComponent],
  templateUrl: './layout.component.html',
  styleUrl: './layout.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LayoutComponent implements OnInit {
  private readonly profileService = inject(ProfileService);
  private readonly friendshipService = inject(FriendshipService);
  private readonly favoritesService = inject(FavoritesService);
  private readonly generationStatus = inject(GenerationStatusService);
  private readonly authService = inject(AuthService);
  private readonly themeService = inject(ThemeService);
  private readonly router = inject(Router);

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
  readonly generatingCount = this.generationStatus.pendingCount;
  readonly isGenerating = this.generationStatus.isGenerating;
  readonly dark = this.themeService.dark;

  ngOnInit(): void {
    void this.profileService.load();
    void this.friendshipService.loadReceived();
    void this.favoritesService.load();
    void this.generationStatus.checkNow();
  }

  toggleDark(): void {
    this.themeService.toggle();
  }

  logout(): void {
    this.authService.logout();
    void this.router.navigate(['/login']);
  }
}