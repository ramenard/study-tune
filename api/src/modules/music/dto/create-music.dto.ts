import { IsBoolean, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateMusicDto {
  @IsString()
  @MinLength(10)
  lyrics: string;

  @IsOptional()
  @IsString()
  style?: string;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsBoolean()
  makeInstrumental?: boolean;
}