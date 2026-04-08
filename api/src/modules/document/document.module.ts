import { Module } from '@nestjs/common';
import { DocumentController } from './document.controller';
import { DocumentService } from './document.service';
import { MistralService } from './mistral.service';

@Module({
  controllers: [DocumentController],
  providers: [DocumentService, MistralService],
  exports: [DocumentService],
})
export class DocumentModule {}