jest.mock('pdf-parse', () => ({
  PDFParse: jest.fn(() => ({
    getText: jest.fn().mockResolvedValue({ text: 'pdf text' }),
  })),
}));

import { BadRequestException } from '@nestjs/common';
import { DocumentService } from './document.service';

describe('DocumentService', () => {
  let mistral: { generateText: jest.Mock };
  let sheetRepo: { findOne: jest.Mock; create: jest.Mock; save: jest.Mock };
  let service: DocumentService;

  beforeEach(() => {
    mistral = { generateText: jest.fn() };
    sheetRepo = {
      findOne: jest.fn(),
      create: jest.fn((v: object) => v),
      save: jest.fn((v: object) => Promise.resolve(v)),
    };
    service = new DocumentService(mistral as never, sheetRepo as never);
  });

  it('generates and persists a fresh sheet on a cache miss', async () => {
    sheetRepo.findOne.mockResolvedValue(null);
    mistral.generateText
      .mockResolvedValueOnce('SUMMARY')
      .mockResolvedValueOnce('TITRE: Ma chanson\n[Couplet 1]\nune ligne');

    const result = await service.process('user1', 'cours');

    expect(mistral.generateText).toHaveBeenCalledTimes(2);
    expect(sheetRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 'user1', title: 'Ma chanson' }),
    );
    expect(result).toEqual({
      title: 'Ma chanson',
      summary: 'SUMMARY',
      lyrics: '[Couplet 1]\nune ligne',
      cached: false,
    });
  });

  it('returns the cached sheet without calling the AI on a hit', async () => {
    sheetRepo.findOne.mockResolvedValue({
      title: 'Cached',
      summary: 'S',
      lyrics: 'L',
    });

    const result = await service.process('user1', 'cours');

    expect(mistral.generateText).not.toHaveBeenCalled();
    expect(result).toEqual({ title: 'Cached', summary: 'S', lyrics: 'L', cached: true });
  });

  it('scopes the cache lookup to the requesting user', async () => {
    sheetRepo.findOne.mockResolvedValue(null);
    mistral.generateText.mockResolvedValue('TITRE: T\nx');

    await service.process('user2', 'cours');

    expect(sheetRepo.findOne).toHaveBeenCalledWith({
      where: expect.objectContaining({ userId: 'user2' }),
    });
  });

  it('requires text or a file', async () => {
    await expect(service.process('user1')).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('processes a pdf through pdf-parse', async () => {
    sheetRepo.findOne.mockResolvedValue(null);
    mistral.generateText
      .mockResolvedValueOnce('SUMMARY')
      .mockResolvedValueOnce('TITRE: T\nlyrics');

    const result = await service.process('user1', undefined, Buffer.from('x'));

    expect(result.summary).toBe('SUMMARY');
    expect(result.cached).toBe(false);
  });
});
