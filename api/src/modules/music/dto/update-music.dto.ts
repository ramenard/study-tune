import { IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateMusicDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  style?: string;

  @IsOptional()
  @IsString()
  @MinLength(10)
  lyrics?: string;
}
