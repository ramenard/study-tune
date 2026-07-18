import { ApiProperty } from '@nestjs/swagger';
import { Equals, IsEmail, IsString, MinLength } from 'class-validator';

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
}
