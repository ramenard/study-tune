import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Playlist } from './entities/playlist.entity';
import { Music } from '../music/entities/music.entity';
import { User } from '../auth/entities/user.entity';
import { FriendshipService } from '../friendship/friendship.service';
import { CreatePlaylistDto } from './dto/create-playlist.dto';
import { UpdatePlaylistDto } from './dto/update-playlist.dto';

@Injectable()
export class PlaylistService {
  constructor(
    @InjectRepository(Playlist)
    private readonly playlistRepo: Repository<Playlist>,
    @InjectRepository(Music)
    private readonly musicRepo: Repository<Music>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly friendshipService: FriendshipService,
  ) {}

  async getOrCreateFavorites(userId: string): Promise<Playlist> {
    const existing = await this.playlistRepo.findOne({
      where: { creatorId: userId, isDefault: true },
      relations: ['musics', 'members'],
    });

    if (existing) {
      return existing;
    }

    return this.playlistRepo.save(
      this.playlistRepo.create({
        name: 'Favoris',
        creatorId: userId,
        isDefault: true,
        members: [],
        musics: [],
      }),
    );
  }

  async toggleFavorite(userId: string, musicId: string): Promise<{ liked: boolean }> {
    const favorites = await this.getOrCreateFavorites(userId);
    const music = await this.musicRepo.findOneBy({ id: musicId });

    if (!music) {
      throw new NotFoundException(`Music ${musicId} not found`);
    }

    const alreadyLiked = favorites.musics.some((m) => m.id === musicId);

    if (alreadyLiked) {
      favorites.musics = favorites.musics.filter((m) => m.id !== musicId);
      await this.playlistRepo.save(favorites);
      return { liked: false };
    }

    favorites.musics.push(music);
    await this.playlistRepo.save(favorites);
    return { liked: true };
  }

  async create(dto: CreatePlaylistDto, userId: string): Promise<Playlist> {
    const playlist = this.playlistRepo.create({
      name: dto.name,
      creatorId: userId,
      members: [],
      musics: [],
    });

    return this.playlistRepo.save(playlist);
  }

  async findAllByUser(userId: string, page: number, limit: number): Promise<{ data: Playlist[]; total: number; page: number; limit: number }> {
    const [data, total] = await this.playlistRepo
      .createQueryBuilder('playlist')
      .leftJoinAndSelect('playlist.musics', 'music')
      .leftJoinAndSelect('playlist.members', 'member')
      .leftJoinAndSelect('playlist.creator', 'creator')
      .where('playlist.creatorId = :userId', { userId })
      .orWhere('member.id = :userId', { userId })
      .orderBy('playlist.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { data, total, page, limit };
  }

  async findOneByUser(id: string, userId: string): Promise<Playlist> {
    const playlist = await this.playlistRepo.findOne({
      where: { id },
      relations: ['musics', 'members'],
    });

    if (!playlist) {
      throw new NotFoundException(`Playlist ${id} not found`);
    }

    const isCreator = playlist.creatorId === userId;
    const isMember = playlist.members.some((member) => member.id === userId);

    if (!isCreator && !isMember) {
      throw new ForbiddenException();
    }

    return playlist;
  }

  async update(id: string, dto: UpdatePlaylistDto, userId: string): Promise<Playlist> {
    const playlist = await this.findOneByUser(id, userId);

    if (playlist.creatorId !== userId) {
      throw new ForbiddenException();
    }

    if (playlist.isDefault) {
      throw new BadRequestException('The default playlist cannot be modified');
    }

    if (dto.name) {
      playlist.name = dto.name;
    }

    return this.playlistRepo.save(playlist);
  }

  async delete(id: string, userId: string): Promise<void> {
    const playlist = await this.findOneByUser(id, userId);

    if (playlist.creatorId !== userId) {
      throw new ForbiddenException();
    }

    if (playlist.isDefault) {
      throw new BadRequestException('The default playlist cannot be deleted');
    }

    await this.playlistRepo.remove(playlist);
  }

  async addMusic(id: string, musicId: string, userId: string): Promise<Playlist> {
    const playlist = await this.findOneByUser(id, userId);

    if (playlist.creatorId !== userId) {
      throw new ForbiddenException('Only the playlist creator can add tracks');
    }

    const music = await this.musicRepo.findOneBy({ id: musicId });

    if (!music) {
      throw new NotFoundException(`Music ${musicId} not found`);
    }

    const alreadyAdded = playlist.musics.some((m) => m.id === musicId);

    if (!alreadyAdded) {
      playlist.musics.push(music);
      await this.playlistRepo.save(playlist);
    }

    return playlist;
  }

  async removeMusic(id: string, musicId: string, userId: string): Promise<Playlist> {
    const playlist = await this.findOneByUser(id, userId);

    if (playlist.creatorId !== userId) {
      throw new ForbiddenException('Only the playlist creator can remove tracks');
    }

    playlist.musics = playlist.musics.filter((m) => m.id !== musicId);

    return this.playlistRepo.save(playlist);
  }

  async shareWithMembers(id: string, memberIds: string[], userId: string): Promise<Playlist> {
    const playlist = await this.findOneByUser(id, userId);

    if (playlist.creatorId !== userId) {
      throw new ForbiddenException('Only the playlist creator can share it');
    }

    if (playlist.isDefault) {
      throw new BadRequestException('The default playlist cannot be shared');
    }

    for (const memberId of memberIds) {
      if (memberId === userId || playlist.members.some((m) => m.id === memberId)) {
        continue;
      }

      const user = await this.userRepo.findOneBy({ id: memberId });

      if (!user) {
        throw new NotFoundException(`User ${memberId} not found`);
      }

      const friends = await this.friendshipService.areFriends(userId, memberId);

      if (!friends) {
        throw new BadRequestException('You can only share a playlist with a friend');
      }

      playlist.members.push(user);
    }

    await this.playlistRepo.save(playlist);
    return this.findOneByUser(id, userId);
  }

  async addMember(id: string, memberId: string, userId: string): Promise<Playlist> {
    const playlist = await this.findOneByUser(id, userId);

    if (playlist.creatorId !== userId) {
      throw new ForbiddenException();
    }

    const user = await this.userRepo.findOneBy({ id: memberId });

    if (!user) {
      throw new NotFoundException(`User ${memberId} not found`);
    }

    const friends = await this.friendshipService.areFriends(userId, memberId);

    if (!friends) {
      throw new BadRequestException('You can only share a playlist with a friend');
    }

    const alreadyMember = playlist.members.some((m) => m.id === memberId);

    if (!alreadyMember) {
      playlist.members.push(user);
      await this.playlistRepo.save(playlist);
    }

    return playlist;
  }

  async removeMember(id: string, memberId: string, userId: string): Promise<Playlist> {
    const playlist = await this.findOneByUser(id, userId);

    if (playlist.creatorId !== userId) {
      throw new ForbiddenException();
    }

    playlist.members = playlist.members.filter((m) => m.id !== memberId);

    return this.playlistRepo.save(playlist);
  }
}