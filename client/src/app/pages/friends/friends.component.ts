import { Component, computed, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

type FriendStatus = 'online' | 'offline';
type ActiveTab = 'friends' | 'suggestions' | 'requests';

interface Friend {
  id: number;
  name: string;
  username: string;
  initials: string;
  color: string;
  status: FriendStatus;
}

interface Suggestion {
  id: number;
  name: string;
  username: string;
  initials: string;
  color: string;
  mutualCount: number;
}

interface FriendRequest {
  id: number;
  name: string;
  username: string;
  initials: string;
  color: string;
}

@Component({
  selector: 'app-friends',
  imports: [MatIconModule, MatButtonModule],
  templateUrl: './friends.component.html',
  styleUrl: './friends.component.scss',
})
export class FriendsComponent {
  readonly activeTab = signal<ActiveTab>('friends');
  readonly search = signal('');

  readonly friends = signal<Friend[]>([
    { id: 1, name: 'Sara Petit',    username: '@sarapetit',  initials: 'SP', color: '#006A6A', status: 'online'  },
    { id: 2, name: 'Luca Torres',   username: '@lucatorres', initials: 'LT', color: '#4B607C', status: 'online'  },
    { id: 3, name: 'Emma Dubois',   username: '@emmad',      initials: 'ED', color: '#7D5260', status: 'offline' },
  ]);

  readonly suggestions = signal<Suggestion[]>([
    { id: 10, name: 'Hugo Renard',   username: '@hugorenard',  initials: 'HR', color: '#365E3D', mutualCount: 3 },
    { id: 11, name: 'Léa Martin',    username: '@leamartin',   initials: 'LM', color: '#5B4C8A', mutualCount: 1 },
    { id: 12, name: 'Noah Bernard',  username: '@noahb',       initials: 'NB', color: '#7A4B2E', mutualCount: 2 },
  ]);

  readonly requests = signal<FriendRequest[]>([
    { id: 20, name: 'Camille Roy',   username: '@camilleroy', initials: 'CR', color: '#006A6A' },
    { id: 21, name: 'Tom Girard',    username: '@tomgirard',  initials: 'TG', color: '#4B607C' },
  ]);

  readonly addedIds = signal<number[]>([]);

  readonly filteredFriends = computed(() => {
    const query = this.search().toLowerCase();
    if (!query) {
      return this.friends();
    }
    return this.friends().filter(friend =>
      friend.name.toLowerCase().includes(query) ||
      friend.username.toLowerCase().includes(query)
    );
  });

  readonly filteredSuggestions = computed(() => {
    const query = this.search().toLowerCase();
    if (!query) {
      return this.suggestions();
    }
    return this.suggestions().filter(suggestion =>
      suggestion.name.toLowerCase().includes(query) ||
      suggestion.username.toLowerCase().includes(query)
    );
  });

  readonly filteredRequests = computed(() => {
    const query = this.search().toLowerCase();
    if (!query) {
      return this.requests();
    }
    return this.requests().filter(request =>
      request.name.toLowerCase().includes(query) ||
      request.username.toLowerCase().includes(query)
    );
  });

  readonly requestCount = computed(() => this.requests().length);

  selectTab(tab: ActiveTab): void {
    this.activeTab.set(tab);
    this.search.set('');
  }

  onSearch(value: string): void {
    this.search.set(value);
  }

  addFriend(id: number): void {
    this.addedIds.update(ids => [...ids, id]);
  }

  acceptRequest(id: number): void {
    const accepted = this.requests().find(request => request.id === id);
    if (!accepted) {
      return;
    }
    const newFriend: Friend = {
      id: accepted.id,
      name: accepted.name,
      username: accepted.username,
      initials: accepted.initials,
      color: accepted.color,
      status: 'offline',
    };
    this.friends.update(list => [...list, newFriend]);
    this.requests.update(list => list.filter(request => request.id !== id));
  }

  rejectRequest(id: number): void {
    this.requests.update(list => list.filter(request => request.id !== id));
  }
}
