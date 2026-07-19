import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  Equals,
  IsBoolean,
  IsDateString,
  IsEmail,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class RegisterDto {
  @ApiProperty()
  @IsEmail()
  email: string;

  @ApiProperty()
  @IsString()
  @MinLength(8)
  password: string;

  @ApiProperty()
  @IsString()
  username: string;

  @ApiProperty()
  @Equals(true)
  consent: boolean;

  @ApiProperty({ example: '2008-05-01' })
  @IsDateString()
  birthDate: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  parentEmail?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  parentalConsent?: boolean;
}
