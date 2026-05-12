/*
  Warnings:

  - The primary key for the `categories` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `createdAt` on the `categories` table. All the data in the column will be lost.
  - You are about to drop the column `id` on the `categories` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `categories` table. All the data in the column will be lost.
  - The primary key for the `tasks` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `createdAt` on the `tasks` table. All the data in the column will be lost.
  - You are about to drop the column `id` on the `tasks` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `tasks` table. All the data in the column will be lost.
  - The `status` column on the `tasks` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `priority` column on the `tasks` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the `User` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[user_id,name]` on the table `categories` will be added. If there are existing duplicate values, this will fail.
  - The required column `category_id` was added to the `categories` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.
  - Added the required column `updated_at` to the `categories` table without a default value. This is not possible if the table is not empty.
  - Made the column `color` on table `categories` required. This step will fail if there are existing NULL values in that column.
  - The required column `task_id` was added to the `tasks` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.
  - Added the required column `updated_at` to the `tasks` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "role" AS ENUM ('USER', 'ADMIN');

-- CreateEnum
CREATE TYPE "task_status" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'OVERDUE');

-- CreateEnum
CREATE TYPE "task_priority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "difficulty" AS ENUM ('EASY', 'MEDIUM', 'HARD', 'VERY_HARD');

-- CreateEnum
CREATE TYPE "session_type" AS ENUM ('FOCUS', 'REVIEW', 'PRACTICE', 'READING', 'LECTURE', 'DISCUSSION', 'PLANNING', 'BREAK', 'ADMIN');

-- CreateEnum
CREATE TYPE "notification_type" AS ENUM ('DEADLINE_ALERT', 'AI_REMINDER', 'SYSTEM', 'STREAK_UPDATE', 'BURNOUT_ALERT', 'PUSH_TEST');

-- CreateEnum
CREATE TYPE "suggestion_status" AS ENUM ('ACTIVE', 'ACCEPTED', 'DISMISSED');

-- CreateEnum
CREATE TYPE "source_type" AS ENUM ('MANUAL', 'GOOGLE_CALENDAR', 'OUTLOOK');

-- CreateEnum
CREATE TYPE "day_of_week" AS ENUM ('MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY');

-- DropForeignKey
ALTER TABLE "categories" DROP CONSTRAINT "categories_user_id_fkey";

-- DropForeignKey
ALTER TABLE "tasks" DROP CONSTRAINT "tasks_category_id_fkey";

-- DropForeignKey
ALTER TABLE "tasks" DROP CONSTRAINT "tasks_user_id_fkey";

-- AlterTable
ALTER TABLE "categories" DROP CONSTRAINT "categories_pkey",
DROP COLUMN "createdAt",
DROP COLUMN "id",
DROP COLUMN "updatedAt",
ADD COLUMN     "category_id" TEXT NOT NULL,
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "color" SET NOT NULL,
ALTER COLUMN "color" SET DEFAULT '#6366f1',
ADD CONSTRAINT "categories_pkey" PRIMARY KEY ("category_id");

-- AlterTable
ALTER TABLE "tasks" DROP CONSTRAINT "tasks_pkey",
DROP COLUMN "createdAt",
DROP COLUMN "id",
DROP COLUMN "updatedAt",
ADD COLUMN     "actual_hours" DOUBLE PRECISION,
ADD COLUMN     "completed_at" TIMESTAMP(3),
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "difficulty" "difficulty" NOT NULL DEFAULT 'MEDIUM',
ADD COLUMN     "estimated_hours" DOUBLE PRECISION,
ADD COLUMN     "task_id" TEXT NOT NULL,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "workload_score" DOUBLE PRECISION,
DROP COLUMN "status",
ADD COLUMN     "status" "task_status" NOT NULL DEFAULT 'PENDING',
DROP COLUMN "priority",
ADD COLUMN     "priority" "task_priority" NOT NULL DEFAULT 'MEDIUM',
ADD CONSTRAINT "tasks_pkey" PRIMARY KEY ("task_id");

-- DropTable
DROP TABLE "User";

-- DropEnum
DROP TYPE "TaskPriority";

-- DropEnum
DROP TYPE "TaskStatus";

-- DropEnum
DROP TYPE "UserRole";

-- CreateTable
CREATE TABLE "users" (
    "user_id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "role" NOT NULL DEFAULT 'USER',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "user_preferences" (
    "user_preferences_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "rest_days" "day_of_week"[],
    "peak_productivity_windows" TEXT[],
    "hard_task_windows" TEXT[],
    "easy_task_windows" TEXT[],
    "available_start_time" TEXT,
    "available_end_time" TEXT,
    "custom_availability" JSONB,
    "max_weekly_study_hours" INTEGER NOT NULL DEFAULT 20,
    "max_daily_study_hours" INTEGER NOT NULL DEFAULT 6,
    "preferred_session_length" INTEGER NOT NULL DEFAULT 25,
    "break_reminder_enabled" BOOLEAN NOT NULL DEFAULT true,
    "burnout_alert_threshold" INTEGER NOT NULL DEFAULT 70,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_preferences_pkey" PRIMARY KEY ("user_preferences_id")
);

-- CreateTable
CREATE TABLE "task_dependencies" (
    "task_dependency_id" TEXT NOT NULL,
    "task_id" TEXT NOT NULL,
    "depends_on_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "task_dependencies_pkey" PRIMARY KEY ("task_dependency_id")
);

-- CreateTable
CREATE TABLE "study_sessions" (
    "study_session_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "task_id" TEXT NOT NULL,
    "session_type" "session_type" NOT NULL DEFAULT 'FOCUS',
    "session_tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "start_time" TIMESTAMP(3) NOT NULL,
    "end_time" TIMESTAMP(3),
    "duration_mins" INTEGER,
    "break_minutes" INTEGER,
    "focus_score" INTEGER,
    "interruption_count" INTEGER NOT NULL DEFAULT 0,
    "interruption_reason" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "study_sessions_pkey" PRIMARY KEY ("study_session_id")
);

-- CreateTable
CREATE TABLE "break_logs" (
    "break_log_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "start_time" TIMESTAMP(3) NOT NULL,
    "end_time" TIMESTAMP(3) NOT NULL,
    "duration_mins" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "break_logs_pkey" PRIMARY KEY ("break_log_id")
);

-- CreateTable
CREATE TABLE "study_streaks" (
    "study_streak_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "current_streak" INTEGER NOT NULL DEFAULT 0,
    "longest_streak" INTEGER NOT NULL DEFAULT 0,
    "last_study_date" TIMESTAMP(3) NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "study_streaks_pkey" PRIMARY KEY ("study_streak_id")
);

-- CreateTable
CREATE TABLE "pomodoro_settings" (
    "pomodoro_settings_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "work_duration" INTEGER NOT NULL DEFAULT 25,
    "short_break" INTEGER NOT NULL DEFAULT 5,
    "long_break" INTEGER NOT NULL DEFAULT 15,
    "cycles_before_long_break" INTEGER NOT NULL DEFAULT 4,
    "auto_start_breaks" BOOLEAN NOT NULL DEFAULT false,
    "auto_start_pomodoros" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pomodoro_settings_pkey" PRIMARY KEY ("pomodoro_settings_id")
);

-- CreateTable
CREATE TABLE "pomodoro_cycles" (
    "pomodoro_cycle_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "study_session_id" TEXT,
    "start_time" TIMESTAMP(3) NOT NULL,
    "end_time" TIMESTAMP(3),
    "duration_mins" INTEGER,
    "is_completed" BOOLEAN NOT NULL DEFAULT false,
    "cycle_number" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pomodoro_cycles_pkey" PRIMARY KEY ("pomodoro_cycle_id")
);

-- CreateTable
CREATE TABLE "notification_settings" (
    "notification_settings_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "in_app_enabled" BOOLEAN NOT NULL DEFAULT true,
    "email_enabled" BOOLEAN NOT NULL DEFAULT true,
    "push_enabled" BOOLEAN NOT NULL DEFAULT true,
    "reminder_before_minutes" INTEGER NOT NULL DEFAULT 24,
    "daily_digest" BOOLEAN NOT NULL DEFAULT true,
    "weekly_report" BOOLEAN NOT NULL DEFAULT true,
    "burnout_alerts" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notification_settings_pkey" PRIMARY KEY ("notification_settings_id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "notification_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" "notification_type" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "read_at" TIMESTAMP(3),
    "push_subscription_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("notification_id")
);

-- CreateTable
CREATE TABLE "push_subscriptions" (
    "push_subscription_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "auth_key" TEXT NOT NULL,
    "p256dh_key" TEXT NOT NULL,
    "user_agent" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_used_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "push_subscriptions_pkey" PRIMARY KEY ("push_subscription_id")
);

-- CreateTable
CREATE TABLE "calendar_events" (
    "calendar_event_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "task_id" TEXT,
    "title" TEXT NOT NULL,
    "start_time" TIMESTAMP(3) NOT NULL,
    "end_time" TIMESTAMP(3) NOT NULL,
    "source" "source_type" NOT NULL DEFAULT 'MANUAL',
    "is_ai_generated" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "calendar_events_pkey" PRIMARY KEY ("calendar_event_id")
);

-- CreateTable
CREATE TABLE "reschedule_prompts" (
    "reschedule_prompt_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "task_id" TEXT NOT NULL,
    "suggested_new_date" TIMESTAMP(3) NOT NULL,
    "reason" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reschedule_prompts_pkey" PRIMARY KEY ("reschedule_prompt_id")
);

-- CreateTable
CREATE TABLE "burnout_metrics" (
    "burnout_metric_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "study_duration" INTEGER,
    "session_count" INTEGER,
    "break_count" INTEGER,
    "overload_score" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "burnout_metrics_pkey" PRIMARY KEY ("burnout_metric_id")
);

-- CreateTable
CREATE TABLE "productivity_logs" (
    "productivity_log_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "planned_minutes" INTEGER,
    "planned_sessions" INTEGER,
    "actual_minutes" INTEGER,
    "tasks_completed" INTEGER,
    "avg_focus_score" DOUBLE PRECISION,
    "completion_rate" DOUBLE PRECISION,
    "overload_score" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "productivity_logs_pkey" PRIMARY KEY ("productivity_log_id")
);

-- CreateTable
CREATE TABLE "weekly_summaries" (
    "weekly_summary_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "week_start" TIMESTAMP(3) NOT NULL,
    "total_study_mins" INTEGER NOT NULL,
    "tasks_completed" INTEGER NOT NULL,
    "avg_focus_score" DOUBLE PRECISION NOT NULL,
    "burnout_risk" DOUBLE PRECISION,
    "ai_insight_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "weekly_summaries_pkey" PRIMARY KEY ("weekly_summary_id")
);

-- CreateTable
CREATE TABLE "ai_insights" (
    "ai_insight_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "burnout_risk_score" DOUBLE PRECISION,
    "burnout_risk_label" TEXT,
    "study_streak_days" INTEGER,
    "weekly_hours" DOUBLE PRECISION,
    "recommendations" TEXT[],
    "raw_payload" JSONB,
    "generated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_insights_pkey" PRIMARY KEY ("ai_insight_id")
);

-- CreateTable
CREATE TABLE "ai_suggestions" (
    "ai_suggestion_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" "suggestion_status" NOT NULL DEFAULT 'ACTIVE',
    "accepted_at" TIMESTAMP(3),
    "dismissed_at" TIMESTAMP(3),
    "scheduled_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_suggestions_pkey" PRIMARY KEY ("ai_suggestion_id")
);

-- CreateTable
CREATE TABLE "ai_request_logs" (
    "ai_request_log_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "feature" TEXT NOT NULL,
    "input_data" JSONB NOT NULL,
    "output_data" JSONB NOT NULL,
    "latency_ms" INTEGER NOT NULL,
    "success" BOOLEAN NOT NULL,
    "error_msg" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_request_logs_pkey" PRIMARY KEY ("ai_request_log_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "user_preferences_user_id_key" ON "user_preferences"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "task_dependencies_task_id_depends_on_id_key" ON "task_dependencies"("task_id", "depends_on_id");

-- CreateIndex
CREATE UNIQUE INDEX "study_streaks_user_id_key" ON "study_streaks"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "pomodoro_settings_user_id_key" ON "pomodoro_settings"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "notification_settings_user_id_key" ON "notification_settings"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "push_subscriptions_endpoint_key" ON "push_subscriptions"("endpoint");

-- CreateIndex
CREATE UNIQUE INDEX "burnout_metrics_user_id_date_key" ON "burnout_metrics"("user_id", "date");

-- CreateIndex
CREATE UNIQUE INDEX "productivity_logs_user_id_date_key" ON "productivity_logs"("user_id", "date");

-- CreateIndex
CREATE UNIQUE INDEX "weekly_summaries_user_id_week_start_key" ON "weekly_summaries"("user_id", "week_start");

-- CreateIndex
CREATE UNIQUE INDEX "categories_user_id_name_key" ON "categories"("user_id", "name");

-- AddForeignKey
ALTER TABLE "user_preferences" ADD CONSTRAINT "user_preferences_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "categories" ADD CONSTRAINT "categories_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("category_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_dependencies" ADD CONSTRAINT "task_dependencies_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "tasks"("task_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_dependencies" ADD CONSTRAINT "task_dependencies_depends_on_id_fkey" FOREIGN KEY ("depends_on_id") REFERENCES "tasks"("task_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "study_sessions" ADD CONSTRAINT "study_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "study_sessions" ADD CONSTRAINT "study_sessions_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "tasks"("task_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "break_logs" ADD CONSTRAINT "break_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "study_streaks" ADD CONSTRAINT "study_streaks_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pomodoro_settings" ADD CONSTRAINT "pomodoro_settings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pomodoro_cycles" ADD CONSTRAINT "pomodoro_cycles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pomodoro_cycles" ADD CONSTRAINT "pomodoro_cycles_study_session_id_fkey" FOREIGN KEY ("study_session_id") REFERENCES "study_sessions"("study_session_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_settings" ADD CONSTRAINT "notification_settings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_push_subscription_id_fkey" FOREIGN KEY ("push_subscription_id") REFERENCES "push_subscriptions"("push_subscription_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "push_subscriptions" ADD CONSTRAINT "push_subscriptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calendar_events" ADD CONSTRAINT "calendar_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calendar_events" ADD CONSTRAINT "calendar_events_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "tasks"("task_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reschedule_prompts" ADD CONSTRAINT "reschedule_prompts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reschedule_prompts" ADD CONSTRAINT "reschedule_prompts_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "tasks"("task_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "burnout_metrics" ADD CONSTRAINT "burnout_metrics_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "productivity_logs" ADD CONSTRAINT "productivity_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "weekly_summaries" ADD CONSTRAINT "weekly_summaries_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "weekly_summaries" ADD CONSTRAINT "weekly_summaries_ai_insight_id_fkey" FOREIGN KEY ("ai_insight_id") REFERENCES "ai_insights"("ai_insight_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_insights" ADD CONSTRAINT "ai_insights_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_suggestions" ADD CONSTRAINT "ai_suggestions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_request_logs" ADD CONSTRAINT "ai_request_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;
