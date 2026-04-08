import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UploadedFile, UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import {ApiBearerAuth, ApiBody, ApiConsumes, ApiTags} from '@nestjs/swagger';
import { DocumentService } from './document.service';
import { ProcessDocumentDto } from './dto/process-document.dto';
import {JwtAuthGuard} from "../auth/jwt-auth.guard";

@ApiBearerAuth()
@ApiTags('document')
@UseGuards(JwtAuthGuard)
@Controller('document')
export class DocumentController {
  constructor(private readonly documentService: DocumentService) {}

  @Post('process')
  @HttpCode(HttpStatus.OK)
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary', nullable: true },
        text: { type: 'string', nullable: true },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage() }))
  async process(
    @Body() dto: ProcessDocumentDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.documentService.process(dto.text, file?.buffer);
  }
}
