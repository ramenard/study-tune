import {Injectable} from '@nestjs/common';
import {firstValueFrom} from "rxjs";
import {HttpService} from "@nestjs/axios";

@Injectable()
export class ChatService {
  constructor(private readonly httpService: HttpService) {
  }

  public async sendMessage(message: string) {
    const apiKey = process.env.HUGGING_TOKEN;
    const model = 'tiiuae/falcon-7b-instruct';

    const response = await firstValueFrom(
      this.httpService.post(
        'https://router.huggingface.co/v1/chat/completions',
        {
          model: 'mistralai/Mistral-7B-Instruct-v0.2',
          messages: [
            { role: 'user', content: message }
          ],
          max_tokens: 200
        },
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
        },
      ),
    );

    return response.data;
  }
}
