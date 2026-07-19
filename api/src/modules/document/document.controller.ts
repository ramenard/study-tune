import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { Request } from 'express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';
import { DocumentService } from './document.service';
import { ProcessDocumentDto } from './dto/process-document.dto';
import { DocumentResultDto } from './dto/document-result.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

type AuthRequest = Request & { user: { id: string } };

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
  @ApiOkResponse({ type: DocumentResultDto })
  async process(
    @Req() req: AuthRequest,
    @Body() dto: ProcessDocumentDto,
    @UploadedFile() file?: Express.Multer.File,
  ): Promise<DocumentResultDto> {
    return this.documentService.process(req.user.id, dto.text, file?.buffer);
  }
}
