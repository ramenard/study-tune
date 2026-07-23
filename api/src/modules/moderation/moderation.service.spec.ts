const mockModerate = jest.fn();

jest.mock('@mistralai/mistralai', () => ({
  Mistral: jest.fn(() => ({ classifiers: { moderate: mockModerate } })),
}));

import {
  ServiceUnavailableException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { ModerationService } from './moderation.service';

describe('ModerationService', () => {
  let service: ModerationService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new ModerationService();
  });

  it('passes content that stays under the threshold', async () => {
    mockModerate.mockResolvedValue({
      results: [
        { categoryScores: { sexual: 0.01, violence_and_threats: 0.02 } },
      ],
    });

    await expect(
      service.assertClean('un cours sur la photosynthèse'),
    ).resolves.toBeUndefined();
    expect(mockModerate).toHaveBeenCalledWith({
      model: 'mistral-moderation-latest',
      inputs: ['un cours sur la photosynthèse'],
    });
  });

  it('skips the api call when every input is empty', async () => {
    await service.assertClean(undefined, '   ');

    expect(mockModerate).not.toHaveBeenCalled();
  });

  it('rejects content above the threshold', async () => {
    mockModerate.mockResolvedValue({
      results: [{ categoryScores: { violence_and_threats: 0.9 } }],
    });

    await expect(service.assertClean('contenu violent')).rejects.toBeInstanceOf(
      UnprocessableEntityException,
    );
  });

  it('ignores non-harmful categories such as health or law', async () => {
    mockModerate.mockResolvedValue({
      results: [{ categoryScores: { health: 0.99, law: 0.99 } }],
    });

    await expect(
      service.assertClean('symptômes de la grippe pour un cours de médecine'),
    ).resolves.toBeUndefined();
  });

  it('reports each flagged category once', async () => {
    mockModerate.mockResolvedValue({
      results: [
        { categoryScores: { sexual: 0.8 } },
        { categoryScores: { sexual: 0.7, selfharm: 0.95 } },
      ],
    });

    await expect(service.assertClean('a', 'b')).rejects.toMatchObject({
      response: { categories: ['sexual', 'selfharm'] },
    });
  });

  it('translates moderation api failures into a 503', async () => {
    mockModerate.mockRejectedValue(new Error('network down'));

    await expect(service.assertClean('texte')).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
  });
});
