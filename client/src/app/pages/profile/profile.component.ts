import { Component, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

interface Skill {
  label: string;
  percent: number;
}

interface Badge {
  icon: string;
  label: string;
}

interface ProfileStat {
  value: string;
  icon: string;
}

@Component({
  selector: 'app-profile',
  imports: [MatIconModule, MatButtonModule],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss',
})
export class ProfileComponent {
  readonly isEditing = signal(false);
  readonly displayName = signal('Alex Martin');
  readonly username = signal('@alexmartin');
  editNameValue = '';

  readonly stats: ProfileStat[] = [
    { value: '28 musiques', icon: 'music_note'  },
    { value: '41 fiches',   icon: 'description' },
  ];

  readonly skills: Skill[] = [
    { label: 'Physique',     percent: 78 },
    { label: 'Histoire',     percent: 55 },
    { label: 'Informatique', percent: 92 },
    { label: 'Biologie',     percent: 44 },
  ];

  readonly badges: Badge[] = [
    { icon: 'music_note',  label: 'Premier Beat'     },
    { icon: 'description', label: '10 Fiches'        },
    { icon: 'group',       label: '5 Amis'           },
    { icon: 'bolt',        label: 'Power User'       },
    { icon: 'star',        label: '100 Générations'  },
    { icon: 'share',       label: 'Partageur'        },
  ];

  startEdit(): void {
    this.editNameValue = this.displayName();
    this.isEditing.set(true);
  }

  cancelEdit(): void {
    this.isEditing.set(false);
  }

  onEditInput(value: string): void {
    this.editNameValue = value;
  }

  saveEdit(): void {
    const trimmed = this.editNameValue.trim();
    if (trimmed) {
      this.displayName.set(trimmed);
    }
    this.isEditing.set(false);
  }

  onEditKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      this.saveEdit();
      return;
    }
    if (event.key === 'Escape') {
      this.cancelEdit();
    }
  }
}
