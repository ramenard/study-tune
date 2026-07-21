import { ApiProperty } from '@nestjs/swagger';
import { AlignedWord } from '../types/aligned-word';

export class AlignedWordDto implements AlignedWord {
  @ApiProperty()
  word: string;

  @ApiProperty()
  startS: number;

  @ApiProperty()
  endS: number;

  @ApiProperty()
  success: boolean;
}

export class LyricsResponseDto {
  @ApiProperty({ enum: ['none', 'pending', 'ready', 'failed'] })
  lyricsStatus: string;

  @ApiProperty({ type: [AlignedWordDto], nullable: true })
  alignedLyrics: AlignedWordDto[] | null;

  @ApiProperty({ nullable: true })
  lyrics: string | null;
}
