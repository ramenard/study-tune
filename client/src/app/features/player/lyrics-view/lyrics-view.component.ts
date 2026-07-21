import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  ElementRef,
  inject,
} from '@angular/core';
import { PlayerService } from '@core/services/player.service';
import { LyricsService } from '@core/services/lyrics.service';

interface DisplayWord {
  text: string;
  index: number;
  isSection: boolean;
  breakBefore: boolean;
}

@Component({
  selector: 'app-lyrics-view',
  templateUrl: './lyrics-view.component.html',
  styleUrl: './lyrics-view.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LyricsViewComponent {
  private readonly player = inject(PlayerService);
  private readonly elementRef = inject(ElementRef<HTMLElement>);
  readonly lyrics = inject(LyricsService);

  readonly displayWords = computed<DisplayWord[]>(() => {
    const words = this.lyrics.aligned();

    return words.map((word, index) => {
      const breakBefore = word.word.includes('\n');
      const text = word.word.replace(/\n/g, ' ').trim();
      const isSection = text.startsWith('[') && text.endsWith(']');

      return { text, index, isSection, breakBefore };
    });
  });

  readonly activeIndex = computed(() => {
    const time = this.player.currentTime();
    const words = this.lyrics.aligned();

    return words.findIndex((word) => {
      return word.success && time >= word.startS && time < word.endS;
    });
  });

  constructor() {
    effect(() => {
      const track = this.player.currentTrack();
      if (!track) {
        this.lyrics.clear();
        return;
      }
      void this.lyrics.loadForMusic(track.id);
    });

    effect(() => {
      const index = this.activeIndex();
      if (index < 0) {
        return;
      }
      this.scrollToActive(index);
    });
  }

  private scrollToActive(index: number): void {
    const host = this.elementRef.nativeElement;
    const element = host.querySelector(`[data-index="${index}"]`);
    if (!element) {
      return;
    }
    element.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }
}
