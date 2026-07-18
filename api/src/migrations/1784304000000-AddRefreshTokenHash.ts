import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddRefreshTokenHash1784304000000 implements MigrationInterface {
  name = 'AddRefreshTokenHash1784304000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user" ADD "refreshTokenHash" character varying`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user" DROP COLUMN "refreshTokenHash"`,
    );
  }
}
