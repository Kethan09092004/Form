/*
  Warnings:

  - A unique constraint covering the columns `[link]` on the table `Form` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `link` to the `Form` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Form" DROP CONSTRAINT "Form_userId_fkey";

-- DropForeignKey
ALTER TABLE "Response" DROP CONSTRAINT "Response_formId_fkey";

-- AlterTable
ALTER TABLE "Form" ADD COLUMN     "link" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Form_link_key" ON "Form"("link");

-- AddForeignKey
ALTER TABLE "Form" ADD CONSTRAINT "Form_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Response" ADD CONSTRAINT "Response_formId_fkey" FOREIGN KEY ("formId") REFERENCES "Form"("id") ON DELETE CASCADE ON UPDATE CASCADE;
