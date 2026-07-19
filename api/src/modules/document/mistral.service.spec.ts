const mockComplete = jest.fn();

jest.mock('@mistralai/mistralai', () => ({
  Mistral: jest.fn(() => ({ chat: { complete: mockComplete } })),
}));

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
});
