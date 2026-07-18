import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSubscriptionFields1783927113968 implements MigrationInterface {
  name = 'AddSubscriptionFields1783927113968';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user" ADD "plan" character varying NOT NULL DEFAULT 'free'`,
    );
    await queryRunner.query(
      `ALTER TABLE "user" ADD "generationsUsed" integer NOT NULL DEFAULT '0'`,
    );
    await queryRunner.query(
      `ALTER TABLE "user" ADD "periodStart" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "periodStart"`);
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "generationsUsed"`);
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "plan"`);
  }
}
