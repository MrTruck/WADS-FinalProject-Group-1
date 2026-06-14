/*
  Warnings:

  - Added the required column `subject` to the `study_sessions` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "study_sessions" ADD COLUMN     "subject" TEXT NOT NULL;
