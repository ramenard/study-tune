import { computed, inject, Injectable, signal } from '@angular/core';
import { Api } from '@api/api';
import { friendshipControllerFindFriends } from '@api/fn/friendship/friendship-controller-find-friends';
import { friendshipControllerFindPendingReceived } from '@api/fn/friendship/friendship-controller-find-pending-received';
import { friendshipControllerSearch } from '@api/fn/friendship/friendship-controller-search';
import { friendshipControllerSendRequest } from '@api/fn/friendship/friendship-controller-send-request';
import { friendshipControllerRespondToRequest } from '@api/fn/friendship/friendship-controller-respond-to-request';
import { Friendship } from '@api/models/friendship';
import { User } from '@api/models/user';
import { UserSearchResultDto } from '@api/models/user-search-result-dto';

@Injectable({ providedIn: 'root' })
export class FriendshipService {
  private readonly api = inject(Api);

  private readonly friendsSignal = signal<User[]>([]);
  private readonly receivedSignal = signal<Friendship[]>([]);
  private readonly searchResultsSignal = signal<UserSearchResultDto[]>([]);
  private lastQuery = '';

  readonly friends = this.friendsSignal.asReadonly();
  readonly received = this.receivedSignal.asReadonly();
  readonly searchResults = this.searchResultsSignal.asReadonly();
  readonly pendingReceivedCount = computed(() => this.receivedSignal().length);

  async loadReceived(): Promise<void> {
    const received = await this.api.invoke(friendshipControllerFindPendingReceived);
    this.receivedSignal.set(received);
  }

  async loadFriendsAndReceived(): Promise<void> {
    const [friends, received] = await Promise.all([
      this.api.invoke(friendshipControllerFindFriends),
      this.api.invoke(friendshipControllerFindPendingReceived),
    ]);
    this.friendsSignal.set(friends);
    this.receivedSignal.set(received);
  }

  async search(username: string): Promise<void> {
    this.lastQuery = username.trim();

    if (!this.lastQuery) {
      this.searchResultsSignal.set([]);
      return;
    }

    const results = await this.api.invoke(friendshipControllerSearch, { username: this.lastQuery });
    this.searchResultsSignal.set(results);
  }

  clearSearch(): void {
    this.lastQuery = '';
    this.searchResultsSignal.set([]);
  }

  async sendRequest(addresseeId: string): Promise<void> {
    await this.api.invoke(friendshipControllerSendRequest, { body: { addresseeId } });
    await this.search(this.lastQuery);
  }

  async accept(friendshipId: string): Promise<void> {
    await this.api.invoke(friendshipControllerRespondToRequest, {
      id: friendshipId,
      body: { status: 'accepted' },
    });
    await this.loadFriendsAndReceived();
  }

  async decline(friendshipId: string): Promise<void> {
    await this.api.invoke(friendshipControllerRespondToRequest, {
      id: friendshipId,
      body: { status: 'declined' },
    });
    await this.loadReceived();
  }
}
