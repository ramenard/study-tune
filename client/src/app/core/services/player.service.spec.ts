import { TestBed } from '@angular/core/testing';
import { PlayerService } from './player.service';
import { MusicService } from './music.service';

describe('PlayerService', () => {
  let service: PlayerService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        PlayerService,
        { provide: MusicService, useValue: { getStreamUrl: vi.fn().mockResolvedValue('http://x/y.mp3') } },
      ],
    });
    service = TestBed.inject(PlayerService);
  });

  it('starts idle', () => {
    expect(service.currentTrack()).toBeNull();
    expect(service.playing()).toBe(false);
    expect(service.progress()).toBe(0);
  });

  it('toggles the repeat mode', () => {
    expect(service.repeat()).toBe(false);
    service.toggleRepeat();
    expect(service.repeat()).toBe(true);
    service.toggleRepeat();
    expect(service.repeat()).toBe(false);
  });

  it('updates the volume', () => {
    service.setVolume(0.3);
    expect(service.volume()).toBe(0.3);
  });

  it('ignores an empty queue', () => {
    service.playQueue([], 0, 'Empty');
    expect(service.currentTrack()).toBeNull();
    expect(service.queueName()).toBeNull();
  });
});
