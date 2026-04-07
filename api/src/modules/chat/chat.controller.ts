import {Body, Controller, Post} from '@nestjs/common';
import {ChatService} from "./chat.service";
import {ChatDto} from "./dto/chat.dto";
import {ApiTags} from "@nestjs/swagger";

@ApiTags('chat')
@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {
  }

  @Post()
  async chat(@Body() dto: ChatDto) {
    return this.chatService.sendMessage(dto.message);
  }
}
