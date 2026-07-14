import { Component, computed, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { Api } from '../../api/api';
import { documentControllerProcess } from '../../api/fn/document/document-controller-process';
import { musicControllerGenerate } from '../../api/fn/music/music-controller-generate';
import { ProfileService } from '../../core/services/profile.service';

type GenerateStep = 0 | 1 | 2;
type SourceTab = 'prompt' | 'pdf';

const MUSIC_STYLES: string[] = [
  'Pop', 'Rock', 'Rap', 'Électronique', 'Lo-fi', 'Jazz',
];

@Component({
  selector: 'app-generate',
  imports: [MatIconModule, MatButtonModule],
  templateUrl: './generate.component.html',
  styleUrl: './generate.component.scss',
})
export class GenerateComponent {
  private readonly api = inject(Api);
  private readonly router = inject(Router);
  private readonly profileService = inject(ProfileService);

  readonly musicStyles = MUSIC_STYLES;
  readonly steps = ['Source', 'Fiche', 'Musique'];

  readonly step = signal<GenerateStep>(0);
  readonly activeTab = signal<SourceTab>('prompt');
  readonly promptText = signal('');
  readonly selectedStyle = signal('Pop');
  readonly selectedFile = signal<File | null>(null);
  readonly loadingSheet = signal(false);
  readonly loadingMusic = signal(false);
  readonly errorMessage = signal('');

  readonly ficheTitle = signal('');
  readonly ficheSummary = signal('');
  readonly ficheLyrics = signal('');

  readonly generationsRemaining = this.profileService.generationsRemaining;
  readonly hasPdfFile = computed(() => this.selectedFile() !== null);
  readonly outOfGenerations = computed(() => this.generationsRemaining() <= 0);

  readonly canGenerateSheet = computed(() => {
    if (this.loadingSheet()) {
      return false;
    }
    if (this.activeTab() === 'pdf') {
      return this.hasPdfFile();
    }
    return this.promptText().trim().length > 0;
  });

  readonly sheetBtnLabel = computed(() => {
    if (this.loadingSheet()) {
      return 'Génération de la fiche…';
    }
    return 'Générer la fiche';
  });

  readonly musicBtnLabel = computed(() => {
    if (this.loadingMusic()) {
      return 'Composition…';
    }
    return `Transformer en musique ${this.selectedStyle()}`;
  });

  selectTab(tab: SourceTab): void {
    this.activeTab.set(tab);
  }

  selectStyle(style: string): void {
    this.selectedStyle.set(style);
  }

  onPromptInput(value: string): void {
    this.promptText.set(value);
  }

  onFileDrop(event: DragEvent): void {
    event.preventDefault();
    const file = event.dataTransfer?.files?.[0] ?? null;
    if (file) {
      this.selectedFile.set(file);
    }
  }

  onFileDragOver(event: DragEvent): void {
    event.preventDefault();
  }

  onFileSelect(fileInput: HTMLInputElement): void {
    this.selectedFile.set(fileInput.files?.[0] ?? null);
  }

  async generateSheet(): Promise<void> {
    if (!this.canGenerateSheet()) {
      return;
    }

    this.loadingSheet.set(true);
    this.errorMessage.set('');

    const body =
      this.activeTab() === 'pdf'
        ? { file: this.selectedFile() }
        : { text: this.promptText() };

    try {
      const result = await this.api.invoke(documentControllerProcess, { body });
      this.ficheTitle.set(result.title);
      this.ficheSummary.set(result.summary);
      this.ficheLyrics.set(result.lyrics);
      this.step.set(1);
    } catch {
      this.errorMessage.set('La génération de la fiche a échoué. Réessaie dans un instant.');
    } finally {
      this.loadingSheet.set(false);
    }
  }

  async generateMusic(): Promise<void> {
    if (this.outOfGenerations()) {
      this.errorMessage.set('Tu n’as plus de génération ce mois-ci. Abonne-toi pour continuer.');
      return;
    }

    this.loadingMusic.set(true);
    this.errorMessage.set('');

    try {
      await this.api.invoke(musicControllerGenerate, {
        body: {
          lyrics: this.ficheLyrics(),
          style: this.selectedStyle(),
          title: this.ficheTitle(),
        },
      });
      await this.profileService.load();
      this.step.set(2);
    } catch (error) {
      this.errorMessage.set(this.resolveGenerateError(error));
    } finally {
      this.loadingMusic.set(false);
    }
  }

  reset(): void {
    this.step.set(0);
    this.promptText.set('');
    this.selectedFile.set(null);
    this.ficheTitle.set('');
    this.ficheSummary.set('');
    this.ficheLyrics.set('');
    this.errorMessage.set('');
  }

  goToLibrary(): void {
    void this.router.navigate(['/library']);
  }

  goToSubscription(): void {
    void this.router.navigate(['/tokens']);
  }

  private resolveGenerateError(error: unknown): string {
    if (error instanceof HttpErrorResponse && error.status === 402) {
      return 'Génération indisponible : crédits ou abonnement insuffisants.';
    }
    return 'La génération de la musique a échoué. Réessaie dans un instant.';
  }
}
