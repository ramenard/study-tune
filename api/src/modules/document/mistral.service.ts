import {
  BadGatewayException,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { Mistral } from '@mistralai/mistralai';

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;
const DEFAULT_MODEL = 'mistral-small-latest';
const RETRYABLE_STATUSES = [429, 503];

@Injectable()
export class MistralService {
  private readonly logger = new Logger(MistralService.name);
  private readonly client = new Mistral({
    apiKey: process.env.MISTRAL_API_KEY,
  });
  private readonly model = process.env.MISTRAL_MODEL ?? DEFAULT_MODEL;

  async generateText(prompt: string, attempt = 1): Promise<string> {
    this.logger.log(`Sending prompt to Mistral (${this.model})`);

    try {
      const response = await this.client.chat.complete({
        model: this.model,
        messages: [{ role: 'user', content: prompt }],
      });
      return this.extractContent(response);
    } catch (error) {
      return this.handleFailure(error, prompt, attempt);
    }
  }

  private extractContent(response: any): string {
    const result = response?.choices?.[0]?.message?.content;

    if (!result) {
      this.logger.error(
        `Empty response from Mistral: ${JSON.stringify(response)}`,
      );
      throw new Error('Mistral returned an empty response');
    }

    if (typeof result === 'string') {
      return result;
    }

    return this.joinContentParts(result);
  }

  private joinContentParts(parts: any[]): string {
    let text = '';

    for (const part of parts) {
      if ('text' in part) {
        text += part.text;
      }
    }

    return text;
  }

  private async handleFailure(
    error: any,
    prompt: string,
    attempt: number,
  ): Promise<string> {
    const status = error?.statusCode ?? error?.status;
    const isRetryable = RETRYABLE_STATUSES.includes(status);

    if (isRetryable && attempt < MAX_RETRIES) {
      const delay = RETRY_DELAY_MS * 2 ** (attempt - 1);
      this.logger.warn(
        `Mistral ${status}, retrying in ${delay}ms (attempt ${attempt}/${MAX_RETRIES})`,
      );
      await this.wait(delay);
      return this.generateText(prompt, attempt + 1);
    }

    if (isRetryable) {
      throw new ServiceUnavailableException(
        'Mistral is currently overloaded, please try again later',
      );
    }

    if (!status) {
      throw error;
    }

    this.logger.error(
      `Mistral call failed with status ${status}: ${error?.message ?? error}`,
    );
    throw new BadGatewayException(
      `AI generation is unavailable (upstream status ${status})`,
    );
  }

  private wait(delay: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, delay));
  }
}
