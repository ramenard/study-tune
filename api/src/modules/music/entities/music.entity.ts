import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('music')
export class Music {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', nullable: true })
  sunoId: string;

  @Column({ type: 'varchar', nullable: true })
  title: string;

  @Column({ type: 'text', nullable: true })
  prompt: string;

  @Column({ type: 'varchar', nullable: true })
  style: string;

  @Column({ type: 'float', nullable: true })
  duration: number;

  @Column({ type: 'varchar', nullable: true })
  objectName: string;

  @Column({ type: 'varchar', nullable: true })
  publicUrl: string;

  @CreateDateColumn()
  createdAt: Date;
}