import { inject, Injectable, signal } from '@angular/core';
import { Api } from '../../api/api';
import { playlistControllerFavorites } from '../../api/fn/playlist/playlist-controller-favorites';
import { playlistControllerToggleFavorite } from '../../api/fn/playlist/playlist-controller-toggle-favorite';

@Injectable({ providedIn: 'root' })
export class FavoritesService {
  private readonly api = inject(Api);
  private readonly idsSignal = signal<ReadonlySet<string>>(new Set());

  readonly ids = this.idsSignal.asReadonly();

  async load(): Promise<void> {
    const favorites = await this.api.invoke(playlistControllerFavorites);
    this.idsSignal.set(new Set(favorites.musics.map((music) => music.id)));
  }

  isFavorite(musicId: string): boolean {
    return this.idsSignal().has(musicId);
  }

  async toggle(musicId: string): Promise<void> {
    const result = await this.api.invoke(playlistControllerToggleFavorite, { musicId });
    const next = new Set(this.idsSignal());
    if (result.liked) {
      next.add(musicId);
    } else {
      next.delete(musicId);
    }
    this.idsSignal.set(next);
  }
}
