import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  HttpCode,
  HttpStatus,
  StreamableFile,
  UseGuards,
  Req,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Request } from 'express';
import { MusicService } from './music.service';
import { CreateMusicDto } from './dto/create-music.dto';
import { UpdateMusicDto } from './dto/update-music.dto';
import { PaginatedMusicDto } from './dto/paginated-music.dto';
import { GenerateMusicResponseDto } from './dto/generate-music-response.dto';
import { StreamUrlDto } from './dto/stream-url.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

type AuthRequest = Request & { user: { id: string } };

@ApiTags('music')
@Controller('music')
export class MusicController {
  constructor(private readonly musicService: MusicService) {}

  @Post('webhook/kie')
  @HttpCode(HttpStatus.OK)
  async kieWebhook(@Body() payload: any) {
    return this.musicService.handleKieWebhook(payload);
  }

  @Post('generate')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiResponse({ status: HttpStatus.ACCEPTED, type: GenerateMusicResponseDto })
  async generate(
    @Body() dto: CreateMusicDto,
    @Req() req: AuthRequest,
  ): Promise<GenerateMusicResponseDto> {
    return this.musicService.generateAndStore(dto, req.user.id);
  }

  @Get()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiOkResponse({ type: PaginatedMusicDto })
  async findAll(
    @Req() req: AuthRequest,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
  ): Promise<PaginatedMusicDto> {
    return this.musicService.findAllByUser(
      req.user.id,
      Number(page),
      Number(limit),
    );
  }

  @Post(':id/sync')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async sync(@Param('id') id: string, @Req() req: AuthRequest) {
    return this.musicService.syncFromKie(id, req.user.id);
  }

  @Get(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async findOne(@Param('id') id: string, @Req() req: AuthRequest) {
    return this.musicService.findOneByUser(id, req.user.id);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateMusicDto,
    @Req() req: AuthRequest,
  ) {
    return this.musicService.update(id, dto, req.user.id);
  }

  @Get(':id/stream')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOkResponse({ type: StreamUrlDto })
  async getStreamUrl(
    @Param('id') id: string,
    @Req() req: AuthRequest,
  ): Promise<StreamUrlDto> {
    return this.musicService.getStreamUrl(id, req.user.id);
  }

  @Get(':id/download')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async download(
    @Param('id') id: string,
    @Req() req: AuthRequest,
  ): Promise<StreamableFile> {
    const { stream, filename } = await this.musicService.getDownload(
      id,
      req.user.id,
    );
    return new StreamableFile(stream, {
      type: 'audio/mpeg',
      disposition: `attachment; filename="${filename}"`,
    });
  }

  @Delete(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(
    @Param('id') id: string,
    @Req() req: AuthRequest,
  ): Promise<void> {
    return this.musicService.delete(id, req.user.id);
  }
}
