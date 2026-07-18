import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { Mistral } from '@mistralai/mistralai';

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

@Injectable()
export class MistralService {
  private readonly logger = new Logger(MistralService.name);
  private readonly client = new Mistral({
    apiKey: process.env.MISTRAL_API_KEY,
  });
  private readonly model = 'mistral-large-latest';

  async generateText(prompt: string, attempt = 1): Promise<string> {
    this.logger.log('Sending prompt to Mistral');

    const response = await this.client.chat
      .complete({
        model: this.model,
        messages: [{ role: 'user', content: prompt }],
      })
      .catch(async (err) => {
        const status = err?.statusCode ?? err?.status;
        const isRetryable = status === 503 || status === 429;

        if (isRetryable && attempt < MAX_RETRIES) {
          const delay = RETRY_DELAY_MS * 2 ** (attempt - 1);
          this.logger.warn(
            `Mistral ${status}, retrying in ${delay}ms (attempt ${attempt}/${MAX_RETRIES})`,
          );
          await new Promise((resolve) => setTimeout(resolve, delay));
          return this.client.chat.complete({
            model: this.model,
            messages: [{ role: 'user', content: prompt }],
          });
        }

        if (isRetryable) {
          throw new ServiceUnavailableException(
            'Mistral is currently overloaded, please try again later',
          );
        }

        throw err;
      });

    const result = response?.choices?.[0]?.message?.content;

    if (!result) {
      this.logger.error(
        `Empty response from Mistral: ${JSON.stringify(response)}`,
      );
      throw new Error('Mistral returned an empty response');
    }

    return typeof result === 'string'
      ? result
      : result.map((p) => ('text' in p ? p.text : '')).join('');
  }
}
