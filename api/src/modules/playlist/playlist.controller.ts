import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PlaylistService } from './playlist.service';
import { CreatePlaylistDto } from './dto/create-playlist.dto';
import { UpdatePlaylistDto } from './dto/update-playlist.dto';
import { PaginatedPlaylistsDto } from './dto/paginated-playlists.dto';
import { FavoriteToggleDto } from './dto/favorite-toggle.dto';
import { Playlist } from './entities/playlist.entity';

type AuthRequest = Request & { user: { id: string } };

@ApiTags('playlist')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('playlist')
export class PlaylistController {
  constructor(private readonly playlistService: PlaylistService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreatePlaylistDto, @Req() req: AuthRequest) {
    return this.playlistService.create(dto, req.user.id);
  }

  @Get()
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiOkResponse({ type: PaginatedPlaylistsDto })
  async findAll(
    @Req() req: AuthRequest,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
  ): Promise<PaginatedPlaylistsDto> {
    return this.playlistService.findAllByUser(req.user.id, Number(page), Number(limit));
  }

  @Get('favorites')
  @ApiOkResponse({ type: Playlist })
  async favorites(@Req() req: AuthRequest): Promise<Playlist> {
    return this.playlistService.getOrCreateFavorites(req.user.id);
  }

  @Post('favorites/tracks/:musicId/toggle')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: FavoriteToggleDto })
  async toggleFavorite(@Param('musicId') musicId: string, @Req() req: AuthRequest): Promise<FavoriteToggleDto> {
    return this.playlistService.toggleFavorite(req.user.id, musicId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Req() req: AuthRequest) {
    return this.playlistService.findOneByUser(id, req.user.id);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: UpdatePlaylistDto, @Req() req: AuthRequest) {
    return this.playlistService.update(id, dto, req.user.id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id') id: string, @Req() req: AuthRequest) {
    return this.playlistService.delete(id, req.user.id);
  }

  @Post(':id/music/:musicId')
  async addMusic(@Param('id') id: string, @Param('musicId') musicId: string, @Req() req: AuthRequest) {
    return this.playlistService.addMusic(id, musicId, req.user.id);
  }

  @Delete(':id/music/:musicId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeMusic(@Param('id') id: string, @Param('musicId') musicId: string, @Req() req: AuthRequest) {
    return this.playlistService.removeMusic(id, musicId, req.user.id);
  }

  @Post(':id/member/:memberId')
  async addMember(@Param('id') id: string, @Param('memberId') memberId: string, @Req() req: AuthRequest) {
    return this.playlistService.addMember(id, memberId, req.user.id);
  }

  @Delete(':id/member/:memberId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeMember(@Param('id') id: string, @Param('memberId') memberId: string, @Req() req: AuthRequest) {
    return this.playlistService.removeMember(id, memberId, req.user.id);
  }
}