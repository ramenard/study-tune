import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, ManyToMany, JoinColumn, JoinTable } from 'typeorm';
import { User } from '../../auth/entities/user.entity';
import { Music } from '../../music/entities/music.entity';

@Entity('playlist')
export class Playlist {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar' })
  name: string;

  @Column({ type: 'varchar' })
  creatorId: string;

  @ManyToOne(() => User, (user) => user.createdPlaylists)
  @JoinColumn({ name: 'creatorId' })
  creator: User;

  @ManyToMany(() => User, (user) => user.sharedPlaylists)
  @JoinTable({
    name: 'playlist_members',
    joinColumn: { name: 'playlistId' },
    inverseJoinColumn: { name: 'userId' },
  })
  members: User[];

  @ManyToMany(() => Music, (music) => music.playlists)
  @JoinTable({
    name: 'playlist_music',
    joinColumn: { name: 'playlistId' },
    inverseJoinColumn: { name: 'musicId' },
  })
  musics: Music[];

  @CreateDateColumn()
  createdAt: Date;
}