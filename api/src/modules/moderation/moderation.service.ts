import {
  Injectable,
  Logger,
  ServiceUnavailableException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { Mistral } from '@mistralai/mistralai';

const HARMFUL_CATEGORIES = [
  'sexual',
  'hate_and_discrimination',
  'violence_and_threats',
  'dangerous_and_criminal_content',
  'selfharm',
];

const FLAG_THRESHOLD = 0.5;

interface ModerationResult {
  categoryScores?: Record<string, number>;
}

@Injectable()
export class ModerationService {
  private readonly logger = new Logger(ModerationService.name);
  private readonly client = new Mistral({
    apiKey: process.env.MISTRAL_API_KEY,
  });
  private readonly model = 'mistral-moderation-latest';

  async assertClean(...values: (string | undefined)[]): Promise<void> {
    const inputs = this.collectInputs(values);

    if (inputs.length === 0) {
      return;
    }

    const results = await this.moderate(inputs);
    const flagged = this.collectFlaggedCategories(results);

    if (flagged.length === 0) {
      return;
    }

    this.logger.warn(`Content rejected by moderation: ${flagged.join(', ')}`);
    throw new UnprocessableEntityException({
      message: 'Votre contenu enfreint la politique de modération',
      categories: flagged,
    });
  }

  private collectInputs(values: (string | undefined)[]): string[] {
    const inputs: string[] = [];

    for (const value of values) {
      const trimmed = value?.trim();
      if (trimmed) {
        inputs.push(trimmed);
      }
    }

    return inputs;
  }

  private async moderate(inputs: string[]): Promise<ModerationResult[]> {
    const response = await this.client.classifiers
      .moderate({ model: this.model, inputs })
      .catch((error) => {
        this.logger.error(
          `Moderation request failed: ${error?.message ?? error}`,
        );
        throw new ServiceUnavailableException(
          'La modération est momentanément indisponible, réessayez plus tard',
        );
      });

    return response?.results ?? [];
  }

  private collectFlaggedCategories(results: ModerationResult[]): string[] {
    const flagged = new Set<string>();

    for (const result of results) {
      const scores = result?.categoryScores ?? {};
      for (const category of HARMFUL_CATEGORIES) {
        const score = scores[category] ?? 0;
        if (score >= FLAG_THRESHOLD) {
          flagged.add(category);
        }
      }
    }

    return [...flagged];
  }
}
