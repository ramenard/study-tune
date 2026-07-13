import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { FriendshipService } from './friendship.service';
import { SendRequestDto } from './dto/send-request.dto';
import { RespondRequestDto } from './dto/respond-request.dto';
import { UserSearchResultDto } from './dto/user-search-result.dto';

type AuthRequest = Request & { user: { id: string } };

@ApiTags('friendship')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('friendship')
export class FriendshipController {
  constructor(private readonly friendshipService: FriendshipService) {}

  @Post('request')
  @HttpCode(HttpStatus.CREATED)
  async sendRequest(@Body() dto: SendRequestDto, @Req() req: AuthRequest) {
    return this.friendshipService.sendRequest(dto, req.user.id);
  }

  @Patch(':id/respond')
  async respondToRequest(@Param('id') id: string, @Body() dto: RespondRequestDto, @Req() req: AuthRequest) {
    return this.friendshipService.respondToRequest(id, dto, req.user.id);
  }

  @Get('search')
  @ApiQuery({ name: 'username', required: true, type: String })
  @ApiOkResponse({ type: [UserSearchResultDto] })
  async search(@Query('username') username: string, @Req() req: AuthRequest): Promise<UserSearchResultDto[]> {
    return this.friendshipService.searchUsers(username, req.user.id);
  }

  @Get()
  async findFriends(@Req() req: AuthRequest) {
    return this.friendshipService.findFriends(req.user.id);
  }

  @Get('requests/received')
  async findPendingReceived(@Req() req: AuthRequest) {
    return this.friendshipService.findPendingReceived(req.user.id);
  }

  @Get('requests/sent')
  async findPendingSent(@Req() req: AuthRequest) {
    return this.friendshipService.findPendingSent(req.user.id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeFriend(@Param('id') id: string, @Req() req: AuthRequest) {
    return this.friendshipService.removeFriend(id, req.user.id);
  }
}