import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('study_sheet')
@Index(['userId', 'contentHash'], { unique: true })
export class StudySheet {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar' })
  userId: string;

  @Column({ type: 'varchar' })
  contentHash: string;

  @Column({ type: 'varchar' })
  title: string;

  @Column({ type: 'text' })
  summary: string;

  @Column({ type: 'text' })
  lyrics: string;

  @CreateDateColumn()
  createdAt: Date;
}
