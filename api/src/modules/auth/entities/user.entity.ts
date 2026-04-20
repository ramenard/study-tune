import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany, ManyToMany } from 'typeorm';
import { Music } from '../../music/entities/music.entity';
import { Playlist } from '../../playlist/entities/playlist.entity';

@Entity('user')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', unique: true })
  email: string;

  @Column({ type: 'varchar' })
  password: string;

  @Column({ type: 'varchar' })
  username: string;

  @OneToMany(() => Music, (music) => music.user)
  musics: Music[];

  @OneToMany(() => Playlist, (playlist) => playlist.creator)
  createdPlaylists: Playlist[];

  @ManyToMany(() => Playlist, (playlist) => playlist.members)
  sharedPlaylists: Playlist[];

  @CreateDateColumn()
  createdAt: Date;
}