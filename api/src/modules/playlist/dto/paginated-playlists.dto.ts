import { Playlist } from '../entities/playlist.entity';

export class PaginatedPlaylistsDto {
  data: Playlist[];
  total: number;
  page: number;
  limit: number;
}
