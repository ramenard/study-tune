import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PlaylistController } from './playlist.controller';
import { PlaylistService } from './playlist.service';
import { Playlist } from './entities/playlist.entity';
import { Music } from '../music/entities/music.entity';
import { User } from '../auth/entities/user.entity';
import { FriendshipModule } from '../friendship/friendship.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Playlist, Music, User]),
    FriendshipModule,
  ],
  controllers: [PlaylistController],
  providers: [PlaylistService],
})
export class PlaylistModule {}
