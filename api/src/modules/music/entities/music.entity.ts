import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  ManyToMany,
  JoinColumn,
} from 'typeorm';
import { User } from '../../auth/entities/user.entity';
import { Playlist } from '../../playlist/entities/playlist.entity';
import { AlignedWord } from '../types/aligned-word';

@Entity('music')
export class Music {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', nullable: true })
  sunoId: string;

  @Column({ type: 'varchar', nullable: true })
  kieTaskId: string;

  @Column({ type: 'jsonb', nullable: true })
  alignedLyrics: AlignedWord[] | null;

  @Column({ type: 'varchar', default: 'none' })
  lyricsStatus: string;

  @Column({ type: 'varchar', nullable: true })
  title: string;

  @Column({ type: 'text', nullable: true })
  prompt: string;

  @Column({ type: 'text', nullable: true })
  lyrics: string;

  @Column({ type: 'varchar', nullable: true })
  style: string;

  @Column({ type: 'float', nullable: true })
  duration: number;

  @Column({ type: 'varchar', nullable: true })
  objectName: string;

  @Column({ type: 'varchar', nullable: true })
  publicUrl: string;

  @Column({ type: 'varchar', default: 'pending' })
  status: string;

  @Column({ type: 'varchar', nullable: true })
  userId: string;

  @ManyToOne(() => User, (user) => user.musics)
  @JoinColumn({ name: 'userId' })
  user: User;

  @ManyToMany(() => Playlist, (playlist) => playlist.musics)
  playlists: Playlist[];

  @CreateDateColumn()
  createdAt: Date;
}
