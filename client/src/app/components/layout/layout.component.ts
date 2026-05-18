import { Component, signal } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { PlayerBarComponent } from '../player-bar/player-bar.component';

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
export class LayoutComponent {
  readonly navItems: NavItem[] = [
    { id: 'home',    icon: 'home',          label: 'Accueil',      route: '/' },
    { id: 'gen',     icon: 'bolt',          label: 'Générer',      route: '/generate' },
    { id: 'lib',     icon: 'library_music', label: 'Bibliothèque', route: '/library' },
    { id: 'pl',      icon: 'queue_music',   label: 'Playlists',    route: '/playlists' },
    { id: 'friends', icon: 'group',         label: 'Amis',         route: '/friends' },
    { id: 'tokens',  icon: 'toll',          label: 'Tokens',       route: '/tokens' },
    { id: 'profile', icon: 'person',        label: 'Profil',       route: '/profile' },
  ];

  readonly tokens = signal(350);
  readonly dark = signal(false);

  toggleDark(): void {
    this.dark.update(v => !v);
    document.documentElement.toggleAttribute('data-dark', !this.dark());
  }
}