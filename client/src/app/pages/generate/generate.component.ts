import { Component, computed, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

type GenerateStep = 0 | 1 | 2;
type SourceTab = 'prompt' | 'pdf';

interface CourseSection {
  title: string;
  bullets: string[];
}

const MUSIC_STYLES: string[] = [
  'Lo-fi', 'Classique', 'Électronique', 'Cinématique', 'Rap', 'Ambiant',
];

const COURSE_SECTIONS: CourseSection[] = [
  {
    title: 'Énergie interne (U)',
    bullets: ["Fonction d'état extensive", 'ΔU = Q + W', 'Indépendante du chemin'],
  },
  {
    title: 'Travail & Chaleur',
    bullets: ['W = −P·ΔV (quasi-statique)', 'Q > 0 : système reçoit de la chaleur'],
  },
  {
    title: 'Transformations',
    bullets: ['Isotherme : T = cste → ΔU = 0', 'Adiabatique : Q = 0', 'Isochore : W = 0'],
  },
];

@Component({
  selector: 'app-generate',
  imports: [MatIconModule, MatButtonModule],
  templateUrl: './generate.component.html',
  styleUrl: './generate.component.scss',
})
export class GenerateComponent {
  readonly musicStyles = MUSIC_STYLES;
  readonly courseSections = COURSE_SECTIONS;
  readonly steps = ['Source', 'Fiche', 'Musique'];

  readonly step = signal<GenerateStep>(0);
  readonly activeTab = signal<SourceTab>('prompt');
  readonly promptText = signal('');
  readonly selectedStyle = signal('Lo-fi');
  readonly isLoading = signal(false);
  readonly hasPdfFile = signal(false);

  readonly canGenerate = computed(() => {
    if (this.activeTab() === 'pdf') {
      return this.hasPdfFile() && !this.isLoading();
    }
    return this.promptText().trim().length > 0 && !this.isLoading();
  });

  readonly sheetBtnIcon = computed(() => {
    if (this.isLoading()) {
      return 'hourglass_empty';
    }
    return 'auto_awesome';
  });

  readonly sheetBtnLabel = computed(() => {
    if (this.isLoading()) {
      return 'Génération...';
    }
    return 'Générer la fiche';
  });

  readonly musicBtnIcon = computed(() => {
    if (this.isLoading()) {
      return 'hourglass_empty';
    }
    return 'music_note';
  });

  readonly musicBtnLabel = computed(() => {
    if (this.isLoading()) {
      return 'Composition...';
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
    this.hasPdfFile.set(true);
  }

  onFileDragOver(event: DragEvent): void {
    event.preventDefault();
  }

  onFileSelect(fileInput: HTMLInputElement): void {
    if (!fileInput.files || fileInput.files.length === 0) {
      return;
    }
    this.hasPdfFile.set(true);
  }

  generateSheet(): void {
    this.isLoading.set(true);
    setTimeout(() => {
      this.isLoading.set(false);
      this.step.set(1);
    }, 2000);
  }

  generateMusic(): void {
    this.isLoading.set(true);
    setTimeout(() => {
      this.isLoading.set(false);
      this.step.set(2);
    }, 2500);
  }

  reset(): void {
    this.step.set(0);
    this.promptText.set('');
    this.isLoading.set(false);
    this.hasPdfFile.set(false);
  }
}
