import {Module} from '@nestjs/common';
import {HttpModule} from '@nestjs/axios';
import {MusicController} from './music.controller';
import {MusicService} from './music.service';
import {SunoService} from './suno.service';
import {StorageService} from './storage.service';
import {TypeOrmModule} from "@nestjs/typeorm";
import {Music} from "./entities/music.entity";

@Module({
  imports: [HttpModule, TypeOrmModule.forFeature([Music]),],
  controllers: [MusicController],
  providers: [MusicService, SunoService, StorageService],
})
export class MusicModule {
}