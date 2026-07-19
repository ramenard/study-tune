import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DocumentController } from './document.controller';
import { DocumentService } from './document.service';
import { MistralService } from './mistral.service';
import { StudySheet } from './entities/study-sheet.entity';

@Module({
  imports: [TypeOrmModule.forFeature([StudySheet])],
  controllers: [DocumentController],
  providers: [DocumentService, MistralService],
  exports: [DocumentService],
})
export class DocumentModule {}
