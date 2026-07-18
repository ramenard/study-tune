import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserConsentAt1784304600000 implements MigrationInterface {
  name = 'AddUserConsentAt1784304600000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user" ADD "consentAt" TIMESTAMP WITH TIME ZONE`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "consentAt"`);
  }
}
