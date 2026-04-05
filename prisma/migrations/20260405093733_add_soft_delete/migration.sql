-- AlterTable
ALTER TABLE "transactions" ADD COLUMN "deletedAt" DATETIME;

-- AlterTable
ALTER TABLE "users" ADD COLUMN "deletedAt" DATETIME;
