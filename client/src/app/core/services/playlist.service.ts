import { inject, Injectable, signal } from '@angular/core';
import { Api } from '@api/api';
import { playlistControllerFindAll } from '@api/fn/playlist/playlist-controller-find-all';
import { playlistControllerCreate } from '@api/fn/playlist/playlist-controller-create';
import { playlistControllerDelete } from '@api/fn/playlist/playlist-controller-delete';
import { playlistControllerAddMusic } from '@api/fn/playlist/playlist-controller-add-music';
import { playlistControllerRemoveMusic } from '@api/fn/playlist/playlist-controller-remove-music';
import { playlistControllerShare } from '@api/fn/playlist/playlist-controller-share';
import { playlistControllerRemoveMember } from '@api/fn/playlist/playlist-controller-remove-member';
import { Playlist } from '@api/models/playlist';

@Injectable({ providedIn: 'root' })
export class PlaylistService {
  private readonly api = inject(Api);

  private readonly playlistsSignal = signal<Playlist[]>([]);
  readonly playlists = this.playlistsSignal.asReadonly();

  async load(): Promise<void> {
    const result = await this.api.invoke(playlistControllerFindAll, { page: 1, limit: 50 });
    this.playlistsSignal.set(result.data);
  }

  async create(name: string): Promise<void> {
    await this.api.invoke(playlistControllerCreate, { body: { name } });
    await this.load();
  }

  async remove(playlistId: string): Promise<void> {
    await this.api.invoke(playlistControllerDelete, { id: playlistId });
    await this.load();
  }

  async addMusic(playlistId: string, musicId: string): Promise<void> {
    await this.api.invoke(playlistControllerAddMusic, { id: playlistId, musicId });
    await this.load();
  }

  async removeMusic(playlistId: string, musicId: string): Promise<void> {
    await this.api.invoke(playlistControllerRemoveMusic, { id: playlistId, musicId });
    await this.load();
  }

  async share(playlistId: string, memberIds: string[]): Promise<void> {
    await this.api.invoke(playlistControllerShare, { id: playlistId, body: { memberIds } });
    await this.load();
  }

  async removeMember(playlistId: string, memberId: string): Promise<void> {
    await this.api.invoke(playlistControllerRemoveMember, { id: playlistId, memberId });
    await this.load();
  }
}
