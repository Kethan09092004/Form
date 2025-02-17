/*
  Warnings:

  - Added the required column `email` to the `Response` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Response" ADD COLUMN     "email" TEXT NOT NULL;
