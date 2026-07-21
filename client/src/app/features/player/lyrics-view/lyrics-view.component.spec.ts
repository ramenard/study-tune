import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { LyricsViewComponent } from './lyrics-view.component';
import { PlayerService } from '@core/services/player.service';
import { LyricsService } from '@core/services/lyrics.service';
import { AlignedWord } from '@shared/models/aligned-word';

describe('LyricsViewComponent', () => {
  const currentTime = signal(0);
  const currentTrack = signal<{ id: string } | null>(null);
  const aligned = signal<AlignedWord[]>([]);

  function buildComponent(): LyricsViewComponent {
    TestBed.configureTestingModule({
      imports: [LyricsViewComponent],
      providers: [
        {
          provide: PlayerService,
          useValue: { currentTime, currentTrack },
        },
        {
          provide: LyricsService,
          useValue: {
            aligned,
            raw: signal<string | null>(null),
            status: signal('ready'),
            loadForMusic: vi.fn(),
            clear: vi.fn(),
          },
        },
      ],
    });

    return TestBed.createComponent(LyricsViewComponent).componentInstance;
  }

  beforeEach(() => {
    currentTime.set(0);
    currentTrack.set(null);
    aligned.set([]);
  });

  it('returns the index of the word matching the current time', () => {
    const component = buildComponent();
    aligned.set([
      { word: 'one', startS: 0, endS: 1, success: true },
      { word: 'two', startS: 1, endS: 2, success: true },
      { word: 'three', startS: 2, endS: 3, success: true },
    ]);

    currentTime.set(1.5);

    expect(component.activeIndex()).toBe(1);
  });

  it('applies the latency offset so the highlight lags the raw time', () => {
    const component = buildComponent();
    aligned.set([
      { word: 'one', startS: 0, endS: 1, success: true },
      { word: 'two', startS: 1, endS: 2, success: true },
    ]);

    currentTime.set(1.1);

    expect(component.activeIndex()).toBe(0);
  });

  it('never marks a failed word as active', () => {
    const component = buildComponent();
    aligned.set([{ word: 'lost', startS: 0, endS: 5, success: false }]);

    currentTime.set(2);

    expect(component.activeIndex()).toBe(-1);
  });

  it('returns -1 before the first word starts', () => {
    const component = buildComponent();
    aligned.set([{ word: 'late', startS: 3, endS: 4, success: true }]);

    currentTime.set(1);

    expect(component.activeIndex()).toBe(-1);
  });

  it('treats bracketed words as non-highlightable sections and keeps line breaks', () => {
    const component = buildComponent();
    aligned.set([
      { word: '[Verse]', startS: 0, endS: 0, success: true },
      { word: '\nHello', startS: 0, endS: 1, success: true },
    ]);

    const words = component.displayWords();

    expect(words[0].isSection).toBe(true);
    expect(words[1].isSection).toBe(false);
    expect(words[1].breakBefore).toBe(true);
    expect(words[1].text).toBe('Hello');
  });
});
