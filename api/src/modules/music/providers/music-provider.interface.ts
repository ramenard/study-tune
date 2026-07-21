import { AlignedWord } from '../types/aligned-word';

export interface MusicGenerationParams {
  prompt: string;
  style?: string;
  title?: string;
  makeInstrumental?: boolean;
}

export interface ProviderTrack {
  id: string;
  title: string;
  audioUrl: string;
  streamAudioUrl?: string;
  imageUrl?: string;
  status: 'pending' | 'processing' | 'complete' | 'error';
  duration?: number;
  tags?: string;
}

export interface MusicProvider {
  generate(params: MusicGenerationParams): Promise<string>;
  getGeneratedTracks(
    taskId: string,
  ): Promise<{ status: string; tracks: ProviderTrack[] }>;
  getTimestampedLyrics(taskId: string, audioId: string): Promise<AlignedWord[]>;
}

export const MUSIC_PROVIDER = Symbol('MUSIC_PROVIDER');
