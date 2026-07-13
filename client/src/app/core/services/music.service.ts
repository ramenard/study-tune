import { inject, Injectable, signal } from '@angular/core';
import { Api } from '../../api/api';
import { musicControllerFindAll } from '../../api/fn/music/music-controller-find-all';
import { musicControllerUpdate } from '../../api/fn/music/music-controller-update';
import { musicControllerDelete } from '../../api/fn/music/music-controller-delete';
import { musicControllerGetStreamUrl } from '../../api/fn/music/music-controller-get-stream-url';
import { Music } from '../../api/models/music';

@Injectable({ providedIn: 'root' })
export class MusicService {
  private readonly api = inject(Api);

  private readonly musicsSignal = signal<Music[]>([]);
  private readonly loadingSignal = signal(false);

  readonly musics = this.musicsSignal.asReadonly();
  readonly loading = this.loadingSignal.asReadonly();

  async load(): Promise<void> {
    this.loadingSignal.set(true);

    try {
      const result = await this.api.invoke(musicControllerFindAll, { page: 1, limit: 50 });
      this.musicsSignal.set(result.data);
    } finally {
      this.loadingSignal.set(false);
    }
  }

  async rename(id: string, title: string): Promise<void> {
    await this.api.invoke(musicControllerUpdate, { id, body: { title } });
    await this.load();
  }

  async remove(id: string): Promise<void> {
    await this.api.invoke(musicControllerDelete, { id });
    await this.load();
  }

  async getStreamUrl(id: string): Promise<string> {
    const result = await this.api.invoke(musicControllerGetStreamUrl, { id });
    return result.url;
  }
}
