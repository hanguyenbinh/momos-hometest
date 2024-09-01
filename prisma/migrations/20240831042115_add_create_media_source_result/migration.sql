-- CreateEnum
CREATE TYPE "CreateMediaSourceResultStatus" AS ENUM ('PROCESSING', 'DONE', 'ERROR');

-- CreateTable
CREATE TABLE "CreateMediaSourceResult" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "error" JSONB,
    "status" "CreateMediaSourceResultStatus" NOT NULL DEFAULT 'PROCESSING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "CreateMediaSourceResult_pkey" PRIMARY KEY ("id")
);
