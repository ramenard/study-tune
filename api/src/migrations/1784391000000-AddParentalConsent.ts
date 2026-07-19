import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddParentalConsent1784391000000 implements MigrationInterface {
  name = 'AddParentalConsent1784391000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "user" ADD "birthDate" date`);
    await queryRunner.query(
      `ALTER TABLE "user" ADD "parentEmail" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "user" ADD "parentalConsentAt" TIMESTAMP WITH TIME ZONE`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "parentalConsentAt"`);
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "parentEmail"`);
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "birthDate"`);
  }
}
