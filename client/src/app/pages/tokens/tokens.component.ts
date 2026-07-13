import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { ProfileService } from '../../core/services/profile.service';

@Component({
  selector: 'app-tokens',
  imports: [MatIconModule, MatButtonModule],
  templateUrl: './tokens.component.html',
  styleUrl: './tokens.component.scss',
})
export class TokensComponent implements OnInit {
  private readonly profileService = inject(ProfileService);

  readonly plan = this.profileService.plan;
  readonly isPremium = this.profileService.isPremium;
  readonly generationsRemaining = this.profileService.generationsRemaining;
  readonly monthlyAllowance = this.profileService.monthlyAllowance;

  readonly loading = signal(false);
  readonly message = signal('');

  readonly planLabel = computed(() => (this.isPremium() ? 'Premium' : 'Découverte'));

  readonly quotaPercent = computed(() => {
    const allowance = this.monthlyAllowance();
    if (allowance <= 0) {
      return 0;
    }
    return Math.round((this.generationsRemaining() / allowance) * 100);
  });

  ngOnInit(): void {
    void this.profileService.load();
  }

  async subscribe(): Promise<void> {
    this.loading.set(true);
    this.message.set('');

    try {
      await this.profileService.subscribe();
      this.message.set('Bienvenue chez Premium ! Tu as 2 générations débloquées ce mois-ci.');
    } catch {
      this.message.set('Impossible de traiter ton abonnement pour le moment.');
    } finally {
      this.loading.set(false);
    }
  }

  async unsubscribe(): Promise<void> {
    this.loading.set(true);
    this.message.set('');

    try {
      await this.profileService.unsubscribe();
      this.message.set('Ton abonnement a été résilié. Tu es repassé à l’offre découverte.');
    } catch {
      this.message.set('Impossible de résilier ton abonnement pour le moment.');
    } finally {
      this.loading.set(false);
    }
  }
}
