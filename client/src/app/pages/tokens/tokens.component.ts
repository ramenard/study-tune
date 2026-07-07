import { Component, computed, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

interface TokenPack {
  id: string;
  label: string;
  tokens: number;
  price: string;
  isPopular: boolean;
}

interface HistoryEntry {
  date: string;
  label: string;
  amount: number;
}

const PACKS: TokenPack[] = [
  { id: 'starter', label: 'Starter', tokens: 100,  price: '1,99 €',  isPopular: false },
  { id: 'popular', label: 'Popular', tokens: 500,  price: '7,99 €',  isPopular: true  },
  { id: 'pro',     label: 'Pro',     tokens: 1200, price: '14,99 €', isPopular: false },
  { id: 'studio',  label: 'Studio',  tokens: 3000, price: '29,99 €', isPopular: false },
];

const HISTORY: HistoryEntry[] = [
  { date: '12 avr.', label: 'Génération — Thermodynamique Lo-Fi', amount: -10 },
  { date: '12 avr.', label: 'Fiche — Premier Principe',           amount: -5  },
  { date: '8 avr.',  label: 'Achat Pack Popular',                 amount: +500 },
  { date: '2 avr.',  label: 'Génération — Algorithmes',           amount: -10 },
];

@Component({
  selector: 'app-tokens',
  imports: [MatIconModule, MatButtonModule],
  templateUrl: './tokens.component.html',
  styleUrl: './tokens.component.scss',
})
export class TokensComponent {
  readonly packs = PACKS;
  readonly history = HISTORY;

  readonly balance = signal(247);
  readonly selectedPackId = signal<string | null>(null);
  readonly isPaying = signal(false);
  readonly successPack = signal<TokenPack | null>(null);

  readonly balancePercent = computed(() => Math.min(100, Math.round(this.balance() / 500 * 100)));
  readonly estimatedGenerations = computed(() => Math.floor(this.balance() / 10));
  readonly estimatedSheets = computed(() => Math.floor(this.balance() / 5));

  readonly selectedPack = computed(() => {
    const packId = this.selectedPackId();
    if (!packId) {
      return null;
    }
    return PACKS.find(pack => pack.id === packId) ?? null;
  });

  readonly ctaTitle = computed(() => {
    const pack = this.selectedPack();
    if (!pack) {
      return 'Sélectionne un pack';
    }
    return `Pack ${pack.label} — ${pack.price}`;
  });

  readonly purchaseBtnIcon = computed(() => {
    if (this.isPaying()) {
      return 'hourglass_empty';
    }
    return 'credit_card';
  });

  readonly purchaseBtnLabel = computed(() => {
    if (this.isPaying()) {
      return 'Paiement...';
    }
    return 'Payer';
  });

  readonly canPurchase = computed(() => !!this.selectedPackId() && !this.isPaying());

  selectPack(id: string): void {
    this.selectedPackId.set(id);
  }

  purchase(): void {
    const pack = this.selectedPack();
    if (!pack) {
      return;
    }
    this.isPaying.set(true);
    setTimeout(() => {
      this.balance.update(current => current + pack.tokens);
      this.isPaying.set(false);
      this.successPack.set(pack);
      this.selectedPackId.set(null);
      setTimeout(() => this.successPack.set(null), 3000);
    }, 1800);
  }

  historyIcon(amount: number): string {
    if (amount > 0) {
      return 'add_circle';
    }
    return 'remove_circle';
  }

  historyAmountLabel(amount: number): string {
    if (amount > 0) {
      return `+${amount}`;
    }
    return `${amount}`;
  }
}
