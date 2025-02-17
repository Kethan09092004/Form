/*
  Warnings:

  - You are about to drop the `Response` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Response" DROP CONSTRAINT "Response_formId_fkey";

-- DropTable
DROP TABLE "Response";
