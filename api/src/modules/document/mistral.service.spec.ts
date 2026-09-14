const mockComplete = jest.fn();

jest.mock('@mistralai/mistralai', () => ({
  Mistral: jest.fn(() => ({ chat: { complete: mockComplete } })),
}));

import { HttpStatus } from '@nestjs/common';
import { MistralService } from './mistral.service';

describe('MistralService', () => {
  let service: MistralService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new MistralService();
  });

  it('returns the message content on success', async () => {
    mockComplete.mockResolvedValue({
      choices: [{ message: { content: 'hello' } }],
    });

    await expect(service.generateText('prompt')).resolves.toBe('hello');
  });

  it('joins array content parts', async () => {
    mockComplete.mockResolvedValue({
      choices: [{ message: { content: [{ text: 'a' }, { text: 'b' }] } }],
    });

    await expect(service.generateText('prompt')).resolves.toBe('ab');
  });

  it('throws on an empty response', async () => {
    mockComplete.mockResolvedValue({ choices: [{ message: { content: '' } }] });

    await expect(service.generateText('prompt')).rejects.toThrow('empty');
  });

  it('propagates a non-retryable error', async () => {
    mockComplete.mockRejectedValue({ statusCode: 400 });

    await expect(service.generateText('prompt')).rejects.toBeDefined();
  });

  it('does not leak the upstream status to the client', async () => {
    mockComplete.mockRejectedValue({
      statusCode: 403,
      message: 'This model is not available in your subscription tier',
    });

    await expect(service.generateText('prompt')).rejects.toMatchObject({
      status: HttpStatus.BAD_GATEWAY,
    });
  });

  it('uses the model from the environment', async () => {
    process.env.MISTRAL_MODEL = 'ministral-8b-latest';
    const configured = new MistralService();
    mockComplete.mockResolvedValue({
      choices: [{ message: { content: 'hello' } }],
    });

    await configured.generateText('prompt');

    expect(mockComplete).toHaveBeenCalledWith(
      expect.objectContaining({ model: 'ministral-8b-latest' }),
    );
    delete process.env.MISTRAL_MODEL;
  });
});
