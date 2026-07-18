import { effect, inject, Injectable, signal } from '@angular/core';
import { PreferenceStorage } from './preference-storage.service';

const THEME_STORAGE_KEY = 'studytune.theme';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly storage = inject(PreferenceStorage);
  private readonly darkSignal = signal(this.readInitial());

  readonly dark = this.darkSignal.asReadonly();

  constructor() {
    effect(() => {
      const isDark = this.darkSignal();
      document.documentElement.toggleAttribute('data-dark', isDark);
      this.storage.set(THEME_STORAGE_KEY, isDark ? 'dark' : 'light');
    });
  }

  toggle(): void {
    this.darkSignal.update((value) => !value);
  }

  setDark(value: boolean): void {
    this.darkSignal.set(value);
  }

  private readInitial(): boolean {
    const stored = this.storage.get(THEME_STORAGE_KEY);
    if (stored === 'dark') {
      return true;
    }
    if (stored === 'light') {
      return false;
    }
    return this.prefersDark();
  }

  private prefersDark(): boolean {
    if (typeof window === 'undefined' || !window.matchMedia) {
      return false;
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  }
}
