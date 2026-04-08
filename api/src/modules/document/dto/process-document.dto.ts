import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class ProcessDocumentDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  text?: string;
}
