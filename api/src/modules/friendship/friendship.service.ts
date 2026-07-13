import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Not, Repository } from 'typeorm';
import { Friendship, FriendshipStatus } from './entities/friendship.entity';
import { User } from '../auth/entities/user.entity';
import { SendRequestDto } from './dto/send-request.dto';
import { RespondRequestDto } from './dto/respond-request.dto';
import { UserSearchResultDto } from './dto/user-search-result.dto';

@Injectable()
export class FriendshipService {
  constructor(
    @InjectRepository(Friendship)
    private readonly friendshipRepo: Repository<Friendship>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async searchUsers(query: string, currentUserId: string): Promise<UserSearchResultDto[]> {
    const trimmed = query.trim();

    if (!trimmed) {
      return [];
    }

    const users = await this.userRepo.find({
      where: { username: ILike(`%${trimmed}%`), id: Not(currentUserId) },
      take: 10,
    });

    const relationships = await this.friendshipRepo.find({
      where: [{ requesterId: currentUserId }, { addresseeId: currentUserId }],
    });

    return users.map((user) => ({
      id: user.id,
      username: user.username,
      relationship: this.resolveRelationship(relationships, currentUserId, user.id),
    }));
  }

  private resolveRelationship(relationships: Friendship[], currentUserId: string, otherUserId: string): string {
    const relationship = relationships.find(
      (item) =>
        (item.requesterId === currentUserId && item.addresseeId === otherUserId) ||
        (item.requesterId === otherUserId && item.addresseeId === currentUserId),
    );

    if (!relationship) {
      return 'none';
    }

    if (relationship.status === FriendshipStatus.ACCEPTED) {
      return 'friends';
    }

    if (relationship.requesterId === currentUserId) {
      return 'request_sent';
    }

    return 'request_received';
  }

  async sendRequest(dto: SendRequestDto, requesterId: string): Promise<Friendship> {
    if (requesterId === dto.addresseeId) {
      throw new BadRequestException('You cannot send a friend request to yourself');
    }

    const addressee = await this.userRepo.findOneBy({ id: dto.addresseeId });

    if (!addressee) {
      throw new NotFoundException(`User ${dto.addresseeId} not found`);
    }

    const existing = await this.friendshipRepo.findOne({
      where: [
        { requesterId, addresseeId: dto.addresseeId },
        { requesterId: dto.addresseeId, addresseeId: requesterId },
      ],
    });

    if (existing) {
      throw new BadRequestException('A friendship request already exists between these users');
    }

    return this.friendshipRepo.save(
      this.friendshipRepo.create({
        requesterId,
        addresseeId: dto.addresseeId,
        status: FriendshipStatus.PENDING,
      }),
    );
  }

  async respondToRequest(id: string, dto: RespondRequestDto, userId: string): Promise<Friendship> {
    const friendship = await this.friendshipRepo.findOneBy({ id });

    if (!friendship) {
      throw new NotFoundException(`Friendship request ${id} not found`);
    }

    if (friendship.addresseeId !== userId) {
      throw new ForbiddenException();
    }

    if (friendship.status !== FriendshipStatus.PENDING) {
      throw new BadRequestException('This request has already been responded to');
    }

    if (dto.status === FriendshipStatus.DECLINED) {
      return this.friendshipRepo.remove(friendship);
    }

    friendship.status = dto.status;

    return this.friendshipRepo.save(friendship);
  }

  async findFriends(userId: string): Promise<User[]> {
    const friendships = await this.friendshipRepo.find({
      where: [
        { requesterId: userId, status: FriendshipStatus.ACCEPTED },
        { addresseeId: userId, status: FriendshipStatus.ACCEPTED },
      ],
      relations: ['requester', 'addressee'],
    });

    return friendships.map((friendship) => {
      if (friendship.requesterId === userId) {
        return friendship.addressee;
      }

      return friendship.requester;
    });
  }

  async findPendingReceived(userId: string): Promise<Friendship[]> {
    return this.friendshipRepo.find({
      where: { addresseeId: userId, status: FriendshipStatus.PENDING },
      relations: ['requester'],
    });
  }

  async findPendingSent(userId: string): Promise<Friendship[]> {
    return this.friendshipRepo.find({
      where: { requesterId: userId, status: FriendshipStatus.PENDING },
      relations: ['addressee'],
    });
  }

  async areFriends(userIdA: string, userIdB: string): Promise<boolean> {
    const friendship = await this.friendshipRepo.findOne({
      where: [
        { requesterId: userIdA, addresseeId: userIdB, status: FriendshipStatus.ACCEPTED },
        { requesterId: userIdB, addresseeId: userIdA, status: FriendshipStatus.ACCEPTED },
      ],
    });

    return !!friendship;
  }

  async removeFriend(id: string, userId: string): Promise<void> {
    const friendship = await this.friendshipRepo.findOneBy({ id });

    if (!friendship) {
      throw new NotFoundException(`Friendship ${id} not found`);
    }

    const isInvolved = friendship.requesterId === userId || friendship.addresseeId === userId;

    if (!isInvolved) {
      throw new ForbiddenException();
    }

    if (friendship.status !== FriendshipStatus.ACCEPTED) {
      throw new BadRequestException('This is not an accepted friendship');
    }

    await this.friendshipRepo.remove(friendship);
  }
}