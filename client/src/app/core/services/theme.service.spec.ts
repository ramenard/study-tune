import { TestBed } from '@angular/core/testing';
import { ThemeService } from './theme.service';
import { PreferenceStorage } from './preference-storage.service';

const THEME_STORAGE_KEY = 'studytune.theme';

class FakeStorage {
  readonly store = new Map<string, string>();
  readonly get = vi.fn((key: string) => this.store.get(key) ?? null);
  readonly set = vi.fn((key: string, value: string) => {
    this.store.set(key, value);
  });
  readonly remove = vi.fn((key: string) => {
    this.store.delete(key);
  });
}

function setup(initial?: string): { service: ThemeService; storage: FakeStorage } {
  const storage = new FakeStorage();
  if (initial) {
    storage.store.set(THEME_STORAGE_KEY, initial);
  }
  TestBed.configureTestingModule({
    providers: [ThemeService, { provide: PreferenceStorage, useValue: storage }],
  });
  return { service: TestBed.inject(ThemeService), storage };
}

describe('ThemeService', () => {
  afterEach(() => {
    document.documentElement.removeAttribute('data-dark');
  });

  it('initialise en mode sombre depuis le storage', () => {
    const { service } = setup('dark');
    expect(service.dark()).toBe(true);
  });

  it('initialise en mode clair depuis le storage', () => {
    const { service } = setup('light');
    expect(service.dark()).toBe(false);
  });

  it('inverse l\'état au toggle', () => {
    const { service } = setup('light');
    service.toggle();
    expect(service.dark()).toBe(true);
    service.toggle();
    expect(service.dark()).toBe(false);
  });

  it('persiste la préférence et applique data-dark au toggle', () => {
    const { service, storage } = setup('light');
    service.toggle();
    TestBed.tick();

    expect(storage.set).toHaveBeenCalledWith(THEME_STORAGE_KEY, 'dark');
    expect(document.documentElement.hasAttribute('data-dark')).toBe(true);
  });
});
