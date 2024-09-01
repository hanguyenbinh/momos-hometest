/*
  Warnings:

  - A unique constraint covering the columns `[code]` on the table `CreateMediaSourceResult` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "CreateMediaSourceResult_code_key" ON "CreateMediaSourceResult"("code");
