import { Body, Controller, Get, Param, Patch, Post, HttpCode, HttpStatus, UseGuards, Req, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { MusicService } from './music.service';
import { CreateMusicDto } from './dto/create-music.dto';
import { UpdateMusicDto } from './dto/update-music.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

type AuthRequest = Request & { user: { id: string } };

@ApiTags('music')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('music')
export class MusicController {
  constructor(private readonly musicService: MusicService) {}

  @Post('generate')
  @HttpCode(HttpStatus.ACCEPTED)
  async generate(@Body() dto: CreateMusicDto, @Req() req: AuthRequest) {
    return this.musicService.generateAndStore(dto, req.user.id);
  }

  @Post('webhook/kie')
  @HttpCode(HttpStatus.OK)
  async kieWebhook(@Body() payload: any) {
    return this.musicService.handleKieWebhook(payload);
  }

  @Get()
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async findAll(
    @Req() req: AuthRequest,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
  ) {
    return this.musicService.findAllByUser(req.user.id, Number(page), Number(limit));
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Req() req: AuthRequest) {
    return this.musicService.findOneByUser(id, req.user.id);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateMusicDto, @Req() req: AuthRequest) {
    return this.musicService.update(id, dto, req.user.id);
  }

  @Get(':id/stream')
  async getStreamUrl(@Param('id') id: string, @Req() req: AuthRequest) {
    return this.musicService.getStreamUrl(id, req.user.id);
  }
}