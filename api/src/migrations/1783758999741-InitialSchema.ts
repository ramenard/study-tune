import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1783758999741 implements MigrationInterface {
  name = 'InitialSchema1783758999741';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
    await queryRunner.query(
      `CREATE TABLE "playlist" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "creatorId" uuid NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_538c2893e2024fabc7ae65ad142" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "music" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "sunoId" character varying, "title" character varying, "prompt" text, "lyrics" text, "style" character varying, "duration" double precision, "objectName" character varying, "publicUrl" character varying, "status" character varying NOT NULL DEFAULT 'pending', "userId" uuid, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_c92b010dd889692dd54286f75e2" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "user" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "email" character varying NOT NULL, "password" character varying NOT NULL, "username" character varying NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_e12875dfb3b1d92d7d7c5377e22" UNIQUE ("email"), CONSTRAINT "PK_cace4a159ff9f2512dd42373760" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."friendship_status_enum" AS ENUM('pending', 'accepted', 'declined')`,
    );
    await queryRunner.query(
      `CREATE TABLE "friendship" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "requesterId" uuid NOT NULL, "addresseeId" uuid NOT NULL, "status" "public"."friendship_status_enum" NOT NULL DEFAULT 'pending', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_dbd6fb568cd912c5140307075cc" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "playlist_members" ("playlistId" uuid NOT NULL, "userId" uuid NOT NULL, CONSTRAINT "PK_6a014aee3726b7a23cb6bf55989" PRIMARY KEY ("playlistId", "userId"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_f3615c69fc423c61977ac3c283" ON "playlist_members" ("playlistId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_3119f4d5cb2785659e2346edbf" ON "playlist_members" ("userId") `,
    );
    await queryRunner.query(
      `CREATE TABLE "playlist_music" ("playlistId" uuid NOT NULL, "musicId" uuid NOT NULL, CONSTRAINT "PK_5b33e546cc76cc0ddea36331b66" PRIMARY KEY ("playlistId", "musicId"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_c66c7c187640fa4977df0fa714" ON "playlist_music" ("playlistId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_9ddafa74f4aec73f103c6a4f11" ON "playlist_music" ("musicId") `,
    );
    await queryRunner.query(
      `ALTER TABLE "playlist" ADD CONSTRAINT "FK_2b2e2d0e397930853ded06a8d6b" FOREIGN KEY ("creatorId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "music" ADD CONSTRAINT "FK_eb2faa9b0e0579b8dda67f1ad72" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "friendship" ADD CONSTRAINT "FK_b29f15b88ee36453605ade63cb2" FOREIGN KEY ("requesterId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "friendship" ADD CONSTRAINT "FK_8012340b570c83b55e0d3ef829a" FOREIGN KEY ("addresseeId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "playlist_members" ADD CONSTRAINT "FK_f3615c69fc423c61977ac3c2839" FOREIGN KEY ("playlistId") REFERENCES "playlist"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "playlist_members" ADD CONSTRAINT "FK_3119f4d5cb2785659e2346edbf1" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "playlist_music" ADD CONSTRAINT "FK_c66c7c187640fa4977df0fa7142" FOREIGN KEY ("playlistId") REFERENCES "playlist"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "playlist_music" ADD CONSTRAINT "FK_9ddafa74f4aec73f103c6a4f11d" FOREIGN KEY ("musicId") REFERENCES "music"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "playlist_music" DROP CONSTRAINT "FK_9ddafa74f4aec73f103c6a4f11d"`,
    );
    await queryRunner.query(
      `ALTER TABLE "playlist_music" DROP CONSTRAINT "FK_c66c7c187640fa4977df0fa7142"`,
    );
    await queryRunner.query(
      `ALTER TABLE "playlist_members" DROP CONSTRAINT "FK_3119f4d5cb2785659e2346edbf1"`,
    );
    await queryRunner.query(
      `ALTER TABLE "playlist_members" DROP CONSTRAINT "FK_f3615c69fc423c61977ac3c2839"`,
    );
    await queryRunner.query(
      `ALTER TABLE "friendship" DROP CONSTRAINT "FK_8012340b570c83b55e0d3ef829a"`,
    );
    await queryRunner.query(
      `ALTER TABLE "friendship" DROP CONSTRAINT "FK_b29f15b88ee36453605ade63cb2"`,
    );
    await queryRunner.query(
      `ALTER TABLE "music" DROP CONSTRAINT "FK_eb2faa9b0e0579b8dda67f1ad72"`,
    );
    await queryRunner.query(
      `ALTER TABLE "playlist" DROP CONSTRAINT "FK_2b2e2d0e397930853ded06a8d6b"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_9ddafa74f4aec73f103c6a4f11"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_c66c7c187640fa4977df0fa714"`,
    );
    await queryRunner.query(`DROP TABLE "playlist_music"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_3119f4d5cb2785659e2346edbf"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_f3615c69fc423c61977ac3c283"`,
    );
    await queryRunner.query(`DROP TABLE "playlist_members"`);
    await queryRunner.query(`DROP TABLE "friendship"`);
    await queryRunner.query(`DROP TYPE "public"."friendship_status_enum"`);
    await queryRunner.query(`DROP TABLE "user"`);
    await queryRunner.query(`DROP TABLE "music"`);
    await queryRunner.query(`DROP TABLE "playlist"`);
  }
}
