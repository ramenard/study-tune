import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

export interface SunoGenerateDto {
  prompt: string;
  style?: string;
  title?: string;
  makeInstrumental?: boolean;
}

export interface KieTrack {
  id: string;
  title: string;
  audioUrl: string;
  streamAudioUrl?: string;
  imageUrl?: string;
  status: 'pending' | 'processing' | 'complete' | 'error';
  duration?: number;
  tags?: string;
}

@Injectable()
export class SunoService {
  private readonly logger = new Logger(SunoService.name);
  private readonly baseUrl = 'https://api.kie.ai';
  private readonly apiKey = process.env.KIE_API_KEY;

  constructor(private readonly http: HttpService) {}

  private get headers() {
    return {
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
    };
  }

  async generate(dto: SunoGenerateDto): Promise<string> {
    this.logger.log(`Generating music for prompt: "${dto.prompt}"`);

    const callBackUrl = `${process.env.APP_PUBLIC_URL}/music/webhook/kie`;

    console.log('callBackUrl', callBackUrl);

    const { data } = await firstValueFrom(
      this.http.post(
        `${this.baseUrl}/api/v1/generate`,
        {
          prompt: dto.prompt,
          style: dto.style ?? '',
          title: dto.title ?? '',
          instrumental: dto.makeInstrumental ?? false,
          customMode: !!(dto.style || dto.title),
          model: 'V3_5',
          callBackUrl, // ✅
        },
        { headers: this.headers },
      ),
    );

    this.logger.log(`Raw response: ${JSON.stringify(data)}`);

    const taskId: string = data?.data?.taskId ?? data?.taskId;

    if (!taskId) {
      this.logger.error(`No taskId in response: ${JSON.stringify(data)}`);

      if (data?.code === 402) {
        throw new HttpException(
          { statusCode: 402, error: 'INSUFFICIENT_CREDITS', message: data.msg },
          HttpStatus.PAYMENT_REQUIRED,
        );
      }

      throw new HttpException(
        { statusCode: 502, error: 'KIE_NO_TASK_ID', message: data?.msg ?? 'Kie.ai returned no taskId' },
        HttpStatus.BAD_GATEWAY,
      );
    }
    this.logger.log(`Generation started, taskId: ${taskId}`);
    return taskId;
  }

  async pollUntilComplete(
    ids: string[],
    maxRetries = 40,
    intervalMs = 5000,
  ): Promise<KieTrack[]> {
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      await this.sleep(intervalMs);

      const results = await Promise.all(ids.map((id) => this.getTrack(id)));
      const allDone = results.every((t) => t.status === 'complete');

      if (allDone) {
        this.logger.log('All tracks generated successfully');
        return results;
      }

      const pending = results.filter(
        (t) => t.status === 'pending' || t.status === 'processing',
      );
      this.logger.log(
        `Waiting... ${pending.length} track(s) still processing (attempt ${attempt + 1}/${maxRetries})`,
      );

      const failed = results.find((t) => t.status === 'error');
      if (failed) {
        throw new Error(`Track ${failed.id} failed during generation`);
      }
    }

    throw new Error('Suno generation timed out after maximum retries');
  }

  private async getTrack(id: string): Promise<KieTrack> {
    const { data } = await firstValueFrom(
      this.http.get(`${this.baseUrl}/api/v1/music/${id}`, {
        headers: this.headers,
      }),
    );

    const track = data?.data ?? data;

    return {
      id: track.id ?? id,
      title: track.title ?? 'Untitled',
      audioUrl: track.audioUrl ?? track.audio_url ?? '',
      streamAudioUrl: track.streamAudioUrl ?? '',
      imageUrl: track.imageUrl ?? '',
      status: this.mapStatus(track.status),
      duration: track.duration,
      tags: track.tags,
    };
  }

  private mapStatus(raw: string): KieTrack['status'] {
    const s = raw?.toLowerCase();
    if (s === 'complete' || s === 'completed' || s === 'success') return 'complete';
    if (s === 'error' || s === 'failed') return 'error';
    if (s === 'processing' || s === 'running') return 'processing';
    return 'pending';
  }

  private sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}