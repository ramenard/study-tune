import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
  ManyToMany,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import { Music } from '../../music/entities/music.entity';
import { Playlist } from '../../playlist/entities/playlist.entity';

@Entity('user')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', unique: true })
  email: string;

  @Exclude()
  @Column({ type: 'varchar', select: false })
  password: string;

  @Column({ type: 'varchar' })
  username: string;

  @Column({ type: 'varchar', default: 'free' })
  plan: string;

  @Column({ type: 'int', default: 0 })
  generationsUsed: number;

  @Column({ type: 'timestamptz', default: () => 'now()' })
  periodStart: Date;

  @OneToMany(() => Music, (music) => music.user)
  musics: Music[];

  @OneToMany(() => Playlist, (playlist) => playlist.creator)
  createdPlaylists: Playlist[];

  @ManyToMany(() => Playlist, (playlist) => playlist.members)
  sharedPlaylists: Playlist[];

  @CreateDateColumn()
  createdAt: Date;
}
