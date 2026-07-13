import { computed, inject, Injectable, signal } from '@angular/core';
import { Api } from '../../api/api';
import { authControllerMe } from '../../api/fn/auth/auth-controller-me';
import { ProfileDto } from '../../api/models/profile-dto';

@Injectable({ providedIn: 'root' })
export class ProfileService {
  private readonly api = inject(Api);

  private readonly profileSignal = signal<ProfileDto | null>(null);
  private readonly loadingSignal = signal(false);

  readonly profile = this.profileSignal.asReadonly();
  readonly loading = this.loadingSignal.asReadonly();

  readonly username = computed(() => this.profileSignal()?.username ?? '');
  readonly plan = computed(() => this.profileSignal()?.plan ?? 'free');
  readonly isPremium = computed(() => this.plan() === 'premium');
  readonly generationsRemaining = computed(
    () => this.profileSignal()?.generationsRemaining ?? 0,
  );
  readonly monthlyAllowance = computed(
    () => this.profileSignal()?.monthlyAllowance ?? 0,
  );

  async load(): Promise<void> {
    this.loadingSignal.set(true);

    try {
      const profile = await this.api.invoke(authControllerMe);
      this.profileSignal.set(profile);
    } finally {
      this.loadingSignal.set(false);
    }
  }

  clear(): void {
    this.profileSignal.set(null);
  }
}
