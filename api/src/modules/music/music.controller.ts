import {Body, Controller, Get, Param, Post, HttpCode, HttpStatus, UseGuards} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { MusicService } from './music.service';
import { CreateMusicDto } from './dto/create-music.dto';
import {JwtAuthGuard} from "../auth/jwt-auth.guard";

@ApiTags('music')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('music')
export class MusicController {
  constructor(private readonly musicService: MusicService) {}

  @Post('generate')
  @HttpCode(HttpStatus.ACCEPTED)
  async generate(@Body() dto: CreateMusicDto) {
    return this.musicService.generateAndStore(dto);
  }

  @Post('webhook/kie')
  @HttpCode(HttpStatus.OK)
  async kieWebhook(@Body() payload: any) {
    return this.musicService.handleKieWebhook(payload);
  }

  @Get()
  async findAll() {
    return this.musicService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.musicService.findOne(id);
  }

  @Get(':id/stream')
  async getStreamUrl(@Param('id') id: string) {
    return this.musicService.getStreamUrl(id);
  }
}