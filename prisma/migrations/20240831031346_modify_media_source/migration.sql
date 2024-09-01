/*
  Warnings:

  - You are about to drop the column `isProcessed` on the `Media` table. All the data in the column will be lost.
  - You are about to drop the column `isProcessed` on the `MediaSource` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "Status" AS ENUM ('NOT_PROCESSED', 'PROCESSING', 'PROCESSED', 'FAILURE');

-- AlterTable
ALTER TABLE "Media" DROP COLUMN "isProcessed",
ADD COLUMN     "status" "Status" NOT NULL DEFAULT 'NOT_PROCESSED';

-- AlterTable
ALTER TABLE "MediaSource" DROP COLUMN "isProcessed",
ADD COLUMN     "status" "Status" NOT NULL DEFAULT 'NOT_PROCESSED';
