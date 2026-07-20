import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-mentions-legales',
  imports: [RouterLink, MatIconModule],
  templateUrl: './mentions-legales.component.html',
  styleUrl: './legal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MentionsLegalesComponent {}
