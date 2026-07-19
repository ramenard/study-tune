import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { AuthService } from '@core/services/auth.service';
import { RegisterDto } from '@api/models/register-dto';

@Component({
  selector: 'app-register',
  imports: [ReactiveFormsModule, RouterLink, MatFormFieldModule, MatInputModule, MatButtonModule, MatCheckboxModule],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RegisterComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly loading = signal(false);
  readonly errorMessage = signal('');

  readonly form = this.formBuilder.nonNullable.group({
    username: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    consent: [false, [Validators.requiredTrue]],
    birthDate: ['', [Validators.required]],
    parentEmail: ['', [Validators.email]],
    parentalConsent: [false],
  });

  private readonly birthDate = toSignal(this.form.controls.birthDate.valueChanges, {
    initialValue: '',
  });

  readonly requiresParental = computed(() => {
    const value = this.birthDate();
    if (!value) {
      return false;
    }
    return this.computeAge(value) < 15;
  });

  submit(): void {
    if (this.form.invalid || this.loading()) {
      return;
    }

    const raw = this.form.getRawValue();

    if (this.requiresParental() && (!raw.parentEmail || !raw.parentalConsent)) {
      this.errorMessage.set(
        'Un email de responsable légal et son consentement sont requis pour les moins de 15 ans.',
      );
      return;
    }

    this.loading.set(true);
    this.errorMessage.set('');

    this.authService.register(this.buildPayload()).subscribe({
      next: () => {
        this.loading.set(false);
        void this.router.navigate(['/']);
      },
      error: () => {
        this.loading.set(false);
        this.errorMessage.set('Impossible de créer le compte. Cet email est peut-être déjà utilisé.');
      },
    });
  }

  private buildPayload(): RegisterDto {
    const raw = this.form.getRawValue();
    const payload: RegisterDto = {
      username: raw.username,
      email: raw.email,
      password: raw.password,
      consent: raw.consent,
      birthDate: raw.birthDate,
    };

    if (this.requiresParental()) {
      payload.parentEmail = raw.parentEmail;
      payload.parentalConsent = raw.parentalConsent;
    }

    return payload;
  }

  private computeAge(birthDate: string): number {
    const birth = new Date(birthDate);
    const now = new Date();
    let age = now.getFullYear() - birth.getFullYear();
    const monthDiff = now.getMonth() - birth.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birth.getDate())) {
      age -= 1;
    }

    return age;
  }
}
