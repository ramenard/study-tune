jest.mock('pdf-parse', () => ({
  PDFParse: jest.fn(() => ({
    getText: jest.fn().mockResolvedValue({ text: 'pdf text' }),
  })),
}));

import { BadRequestException } from '@nestjs/common';
import { DocumentService } from './document.service';

describe('DocumentService', () => {
  let mistral: { generateText: jest.Mock };
  let service: DocumentService;

  beforeEach(() => {
    mistral = { generateText: jest.fn() };
    service = new DocumentService(mistral as never);
  });

  it('processes text into title, summary and lyrics', async () => {
    mistral.generateText
      .mockResolvedValueOnce('SUMMARY')
      .mockResolvedValueOnce('TITRE: Ma chanson\n[Couplet 1]\nune ligne');

    const result = await service.processText('cours');

    expect(mistral.generateText).toHaveBeenCalledTimes(2);
    expect(result).toEqual({
      title: 'Ma chanson',
      summary: 'SUMMARY',
      lyrics: '[Couplet 1]\nune ligne',
    });
  });

  it('requires text or a file', async () => {
    await expect(service.process()).rejects.toBeInstanceOf(BadRequestException);
  });

  it('processes a pdf through pdf-parse', async () => {
    mistral.generateText
      .mockResolvedValueOnce('SUMMARY')
      .mockResolvedValueOnce('TITRE: T\nlyrics');

    const result = await service.process(undefined, Buffer.from('x'));

    expect(result.summary).toBe('SUMMARY');
  });
});
