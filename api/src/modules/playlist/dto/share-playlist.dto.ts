import { ArrayNotEmpty, IsArray, IsUUID } from 'class-validator';

export class SharePlaylistDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('4', { each: true })
  memberIds: string[];
}
