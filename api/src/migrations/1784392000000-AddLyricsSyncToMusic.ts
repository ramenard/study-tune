import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddLyricsSyncToMusic1784392000000 implements MigrationInterface {
  name = 'AddLyricsSyncToMusic1784392000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "music" ADD "kieTaskId" character varying`,
    );
    await queryRunner.query(`ALTER TABLE "music" ADD "alignedLyrics" jsonb`);
    await queryRunner.query(
      `ALTER TABLE "music" ADD "lyricsStatus" character varying NOT NULL DEFAULT 'none'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "music" DROP COLUMN "lyricsStatus"`);
    await queryRunner.query(`ALTER TABLE "music" DROP COLUMN "alignedLyrics"`);
    await queryRunner.query(`ALTER TABLE "music" DROP COLUMN "kieTaskId"`);
  }
}
