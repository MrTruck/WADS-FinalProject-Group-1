/*
  Warnings:

  - Added the required column `comprehension` to the `study_sessions` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "study_sessions" ADD COLUMN     "comprehension" INTEGER NOT NULL;
