import { signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { GenerateComponent } from './generate.component';
import { Api } from '@api/api';
import { ProfileService } from '@core/services/profile.service';
import { GenerationStatusService } from '@core/services/generation-status.service';

describe('GenerateComponent', () => {
  let invoke: ReturnType<typeof vi.fn>;
  let generationsRemaining: ReturnType<typeof signal<number>>;
  let watch: ReturnType<typeof vi.fn>;
  let component: GenerateComponent;

  beforeEach(() => {
    invoke = vi.fn();
    generationsRemaining = signal(5);
    watch = vi.fn();

    TestBed.configureTestingModule({
      providers: [
        GenerateComponent,
        { provide: Api, useValue: { invoke } },
        { provide: ProfileService, useValue: { generationsRemaining, load: vi.fn() } },
        { provide: GenerationStatusService, useValue: { watch } },
        { provide: Router, useValue: { navigate: vi.fn() } },
      ],
    });

    component = TestBed.inject(GenerateComponent);
  });

  it('enables sheet generation only when there is prompt input', () => {
    expect(component.canGenerateSheet()).toBe(false);
    component.onPromptInput('Réviser la photosynthèse');
    expect(component.canGenerateSheet()).toBe(true);
  });

  it('requires a file when the pdf tab is active', () => {
    component.selectTab('pdf');
    expect(component.canGenerateSheet()).toBe(false);
  });

  it('fills the sheet and advances the step on success', async () => {
    invoke.mockResolvedValue({ title: 'T', summary: 'S', lyrics: 'L' });
    component.onPromptInput('cours');

    await component.generateSheet();

    expect(component.ficheTitle()).toBe('T');
    expect(component.ficheLyrics()).toBe('L');
    expect(component.step()).toBe(1);
  });

  it('blocks music generation when out of generations', async () => {
    generationsRemaining.set(0);

    await component.generateMusic();

    expect(invoke).not.toHaveBeenCalled();
    expect(component.errorMessage()).toContain('plus de génération');
  });

  it('maps a 402 response to a credits message', async () => {
    invoke.mockRejectedValue(new HttpErrorResponse({ status: 402 }));

    await component.generateMusic();

    expect(component.errorMessage()).toContain('crédits ou abonnement');
  });
});
