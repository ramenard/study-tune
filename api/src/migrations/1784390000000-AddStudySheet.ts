import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddStudySheet1784390000000 implements MigrationInterface {
  name = 'AddStudySheet1784390000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "study_sheet" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "userId" character varying NOT NULL,
        "contentHash" character varying NOT NULL,
        "title" character varying NOT NULL,
        "summary" text NOT NULL,
        "lyrics" text NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_study_sheet" PRIMARY KEY ("id")
      )`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_study_sheet_user_hash" ON "study_sheet" ("userId", "contentHash")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_study_sheet_user_hash"`);
    await queryRunner.query(`DROP TABLE "study_sheet"`);
  }
}
