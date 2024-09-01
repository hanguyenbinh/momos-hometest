-- DropForeignKey
ALTER TABLE "Media" DROP CONSTRAINT "Media_sourceId_fkey";

-- AlterTable
ALTER TABLE "Media" ALTER COLUMN "sourceId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Media" ADD CONSTRAINT "Media_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "MediaSource"("id") ON DELETE SET NULL ON UPDATE CASCADE;
