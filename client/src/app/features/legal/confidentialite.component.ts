import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-confidentialite',
  imports: [RouterLink, MatIconModule],
  templateUrl: './confidentialite.component.html',
  styleUrl: './legal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfidentialiteComponent {}
