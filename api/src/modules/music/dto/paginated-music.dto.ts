import { Music } from '../entities/music.entity';

export class PaginatedMusicDto {
  data: Music[];
  total: number;
  page: number;
  limit: number;
}
