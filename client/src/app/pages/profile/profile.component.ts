import { ChangeDetectionStrategy, Component, OnInit, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { ProfileService } from '../../core/services/profile.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-profile',
  imports: [MatIconModule, MatButtonModule],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfileComponent implements OnInit {
  private readonly profileService = inject(ProfileService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly profile = this.profileService.profile;
  readonly username = this.profileService.username;
  readonly isPremium = this.profileService.isPremium;
  readonly generationsRemaining = this.profileService.generationsRemaining;
  readonly monthlyAllowance = this.profileService.monthlyAllowance;

  readonly initials = computed(() => {
    const name = this.username();
    return name ? name.slice(0, 2).toUpperCase() : '?';
  });

  readonly planLabel = computed(() => (this.isPremium() ? 'Premium' : 'Découverte'));

  readonly memberSince = computed(() => {
    const current = this.profile();
    if (!current) {
      return '';
    }
    return new Date(current.createdAt).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long' });
  });

  ngOnInit(): void {
    void this.profileService.load();
  }

  goToSubscription(): void {
    void this.router.navigate(['/tokens']);
  }

  logout(): void {
    this.authService.logout();
    void this.router.navigate(['/login']);
  }
}
