import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPlaylistIsDefault1784024593710 implements MigrationInterface {
  name = 'AddPlaylistIsDefault1784024593710';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "playlist" ADD "isDefault" boolean NOT NULL DEFAULT false`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "playlist" DROP COLUMN "isDefault"`);
  }
}
