import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { FriendshipService } from '../../core/services/friendship.service';

type ActiveTab = 'friends' | 'add' | 'requests';

const AVATAR_COLORS = ['#006A6A', '#4B607C', '#7D5260', '#365E3D', '#5B4C8A', '#7A4B2E'];

@Component({
  selector: 'app-friends',
  imports: [MatIconModule, MatButtonModule],
  templateUrl: './friends.component.html',
  styleUrl: './friends.component.scss',
})
export class FriendsComponent implements OnInit {
  private readonly friendship = inject(FriendshipService);

  readonly activeTab = signal<ActiveTab>('friends');
  readonly search = signal('');

  readonly friends = this.friendship.friends;
  readonly received = this.friendship.received;
  readonly searchResults = this.friendship.searchResults;
  readonly requestCount = this.friendship.pendingReceivedCount;

  readonly filteredFriends = computed(() => {
    const query = this.search().toLowerCase().trim();
    if (!query) {
      return this.friends();
    }
    return this.friends().filter((friend) => friend.username.toLowerCase().includes(query));
  });

  ngOnInit(): void {
    void this.friendship.loadFriendsAndReceived();
  }

  selectTab(tab: ActiveTab): void {
    this.activeTab.set(tab);
    this.search.set('');
    this.friendship.clearSearch();
  }

  onSearch(value: string): void {
    this.search.set(value);
    if (this.activeTab() === 'add') {
      void this.friendship.search(value);
    }
  }

  add(userId: string): void {
    void this.friendship.sendRequest(userId);
  }

  accept(friendshipId: string): void {
    void this.friendship.accept(friendshipId);
  }

  refuse(friendshipId: string): void {
    void this.friendship.decline(friendshipId);
  }

  initials(username: string): string {
    return username.slice(0, 2).toUpperCase();
  }

  colorFor(id: string): string {
    let hash = 0;
    for (const char of id) {
      hash = (hash + char.charCodeAt(0)) % AVATAR_COLORS.length;
    }
    return AVATAR_COLORS[hash];
  }
}
