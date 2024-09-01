/*
  Warnings:

  - Added the required column `sourceId` to the `Media` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Media" ADD COLUMN     "sourceId" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "Media" ADD CONSTRAINT "Media_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "MediaSource"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
