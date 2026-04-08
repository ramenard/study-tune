import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

@Injectable()
export class GeminiService {
  private readonly logger = new Logger(GeminiService.name);
  private readonly baseUrl = 'https://generativelanguage.googleapis.com/v1beta';
  private readonly model = 'gemini-2.5-flash';
  private readonly apiKey = process.env.GEMINI_API_KEY;

  constructor(private readonly http: HttpService) {}

  private async callGemini(body: object, attempt = 1): Promise<string> {
    const response = await firstValueFrom(
      this.http.post(
        `${this.baseUrl}/models/${this.model}:generateContent?key=${this.apiKey}`,
        body,
      ),
    ).catch(async (err) => {
      const status = err?.response?.status;
      const isRetryable = status === 503 || status === 429;

      if (isRetryable && attempt < MAX_RETRIES) {
        const delay = RETRY_DELAY_MS * 2 ** (attempt - 1);
        this.logger.warn(`Gemini ${status}, retrying in ${delay}ms (attempt ${attempt}/${MAX_RETRIES})`);
        await new Promise((resolve) => setTimeout(resolve, delay));
        return { data: await this.callGemini(body, attempt + 1) };
      }

      if (isRetryable) {
        throw new ServiceUnavailableException('Gemini is currently overloaded, please try again later');
      }

      throw err;
    });

    if (typeof response.data === 'string') {
      return response.data;
    }

    const result = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!result) {
      this.logger.error(`Empty response from Gemini: ${JSON.stringify(response.data)}`);
      throw new Error('Gemini returned an empty response');
    }

    return result;
  }

  async generateText(prompt: string): Promise<string> {
    this.logger.log('Sending prompt to Gemini');
    return this.callGemini({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { maxOutputTokens: 4096 },
    });
  }

  async generateFromPdf(base64Pdf: string, prompt: string): Promise<string> {
    this.logger.log('Sending PDF to Gemini');
    return this.callGemini({
      contents: [
        {
          parts: [
            { inline_data: { mime_type: 'application/pdf', data: base64Pdf } },
            { text: prompt },
          ],
        },
      ],
      generationConfig: { maxOutputTokens: 4096 },
    });
  }
}