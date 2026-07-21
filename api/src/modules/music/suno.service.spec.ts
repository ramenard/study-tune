import { HttpException } from '@nestjs/common';
import { of } from 'rxjs';
import { SunoService } from './suno.service';

describe('SunoService', () => {
  let http: { post: jest.Mock; get: jest.Mock };
  let service: SunoService;

  beforeEach(() => {
    process.env.APP_PUBLIC_URL = 'https://public.example';
    process.env.KIE_WEBHOOK_SECRET = 'wh-secret';
    http = { post: jest.fn(), get: jest.fn() };
    service = new SunoService(http as never);
  });

  describe('generate', () => {
    it('posts the generation request and returns the taskId', async () => {
      http.post.mockReturnValue(of({ data: { data: { taskId: 'task-1' } } }));

      const taskId = await service.generate({
        prompt: 'lyrics',
        style: 'Pop',
        title: 'T',
      });

      expect(taskId).toBe('task-1');
      const [url, body] = http.post.mock.calls[0];
      expect(url).toContain('/api/v1/generate');
      expect(body.model).toBe('V3_5');
      expect(body.callBackUrl).toBe(
        'https://public.example/api/music/webhook/kie/wh-secret',
      );
    });

    it('throws a 402 when kie reports insufficient credits', async () => {
      http.post.mockReturnValue(of({ data: { code: 402, msg: 'no credits' } }));

      await expect(service.generate({ prompt: 'x' })).rejects.toBeInstanceOf(
        HttpException,
      );
    });

    it('throws a 502 when kie returns no taskId', async () => {
      http.post.mockReturnValue(of({ data: { msg: 'oops' } }));

      await expect(service.generate({ prompt: 'x' })).rejects.toBeInstanceOf(
        HttpException,
      );
    });
  });

  describe('getTimestampedLyrics', () => {
    it('maps aligned words and normalises missing fields', async () => {
      http.post.mockReturnValue(
        of({
          data: {
            data: {
              alignedWords: [
                { word: 'Hello', startS: 1.2, endS: 1.8, success: true },
                { word: 'world', endS: 2.5, success: false },
              ],
            },
          },
        }),
      );

      const aligned = await service.getTimestampedLyrics('task-1', 'audio-1');

      expect(aligned).toHaveLength(2);
      expect(aligned[0]).toEqual({
        word: 'Hello',
        startS: 1.2,
        endS: 1.8,
        success: true,
      });
      expect(aligned[1]).toEqual({
        word: 'world',
        startS: 0,
        endS: 2.5,
        success: false,
      });
    });

    it('returns an empty array when kie returns no aligned words', async () => {
      http.post.mockReturnValue(of({ data: { data: {} } }));

      const aligned = await service.getTimestampedLyrics('task-1', 'audio-1');

      expect(aligned).toEqual([]);
    });
  });

  describe('getGeneratedTracks', () => {
    it('maps the raw sunoData into tracks', async () => {
      http.get.mockReturnValue(
        of({
          data: {
            data: {
              status: 'SUCCESS',
              response: {
                sunoData: [
                  {
                    id: 't1',
                    title: 'Song',
                    audioUrl: 'http://a/1.mp3',
                    duration: 90,
                  },
                ],
              },
            },
          },
        }),
      );

      const { status, tracks } = await service.getGeneratedTracks('task-1');

      expect(status).toBe('SUCCESS');
      expect(tracks).toHaveLength(1);
      expect(tracks[0]).toMatchObject({
        id: 't1',
        audioUrl: 'http://a/1.mp3',
        status: 'complete',
      });
    });
  });

  describe('pollUntilComplete', () => {
    it('returns the tracks once they are all complete', async () => {
      http.get.mockReturnValue(
        of({
          data: {
            data: { id: 't1', status: 'complete', audioUrl: 'http://a/1.mp3' },
          },
        }),
      );

      const tracks = await service.pollUntilComplete(['t1'], 3, 0);

      expect(tracks[0].status).toBe('complete');
    });

    it('throws when a track fails', async () => {
      http.get.mockReturnValue(
        of({ data: { data: { id: 't1', status: 'error' } } }),
      );

      await expect(service.pollUntilComplete(['t1'], 3, 0)).rejects.toThrow(
        'failed',
      );
    });

    it('throws on timeout when never complete', async () => {
      http.get.mockReturnValue(
        of({ data: { data: { id: 't1', status: 'processing' } } }),
      );

      await expect(service.pollUntilComplete(['t1'], 1, 0)).rejects.toThrow(
        'timed out',
      );
    });
  });
});
