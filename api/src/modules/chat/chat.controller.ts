import {Body, Controller, Post, UseGuards} from '@nestjs/common';
import {ChatService} from "./chat.service";
import {ChatDto} from "./dto/chat.dto";
import {ApiBearerAuth, ApiTags} from "@nestjs/swagger";
import {JwtAuthGuard} from "../auth/jwt-auth.guard";

@ApiBearerAuth()
@ApiTags('chat')
@UseGuards(JwtAuthGuard)
@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {
  }

  @Post()
  async chat(@Body() dto: ChatDto) {
    return this.chatService.sendMessage(dto.message);
  }
}
