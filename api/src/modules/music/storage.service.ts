import { Injectable, Logger } from '@nestjs/common';
import * as Minio from 'minio';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { Readable } from 'stream';

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly bucket = process.env.MINIO_BUCKET ?? 'music';

  private readonly client = new Minio.Client({
    endPoint: process.env.MINIO_ENDPOINT ?? 'localhost',
    port: parseInt(process.env.MINIO_PORT ?? '9000'),
    useSSL: false,
    accessKey: process.env.MINIO_ACCESS_KEY ?? 'minioadmin',
    secretKey: process.env.MINIO_SECRET_KEY ?? 'minioadmin',
  });

  constructor(private readonly http: HttpService) {}

  async ensureBucket(): Promise<void> {
    const exists = await this.client.bucketExists(this.bucket);
    if (!exists) {
      await this.client.makeBucket(this.bucket, 'us-east-1');
      this.logger.log(`Bucket "${this.bucket}" created`);
    }
  }

  async downloadAndStore(audioUrl: string, trackId: string): Promise<string> {
    this.logger.log(`Downloading audio from: ${audioUrl}`);

    const response = await firstValueFrom(
      this.http.get(audioUrl, {
        responseType: 'stream',
        timeout: 60000, // 60s pour les gros fichiers
        headers: {
          'User-Agent': 'Mozilla/5.0', // certains CDN bloquent sans User-Agent
        },
      }),
    );

    const stream = response.data as Readable;
    const contentLength = response.headers['content-length'];
    const objectName = `tracks/${trackId}.mp3`;

    await this.client.putObject(
      this.bucket,
      objectName,
      stream,
      contentLength ? parseInt(contentLength) : undefined,
      { 'Content-Type': 'audio/mpeg' },
    );

    this.logger.log(`Stored in MinIO: ${objectName}`);
    return objectName;
  }

  getPublicUrl(objectName: string): string {
    const host = process.env.MINIO_PUBLIC_URL ?? 'http://localhost:9000';
    return `${host}/${this.bucket}/${objectName}`;
  }

  async getPresignedUrl(objectName: string, expirySeconds = 3600): Promise<string> {
    return this.client.presignedGetObject(this.bucket, objectName, expirySeconds);
  }
}