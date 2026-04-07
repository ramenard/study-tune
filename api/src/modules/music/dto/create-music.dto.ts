import {IsBoolean, IsOptional, IsString, MinLength} from 'class-validator';
import {Transform} from "class-transformer";

export class CreateMusicDto {
  @IsString()
  @MinLength(10)
  @Transform(({value}) => value?.replace(/\n/g, ' '))
  prompt: string;

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