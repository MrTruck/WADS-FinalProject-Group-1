import { z } from 'zod'

export const registerSchema = z.object({
  name: z.string().min(2).max(100).trim(),
  email: z.string().email().toLowerCase().trim(),
  password: z
    .string()
    .min(8)
    .max(128)
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
})

export const loginSchema = z.object({
  email: z.string().email().toLowerCase().trim(),
  password: z.string().min(1),
})

export const createTaskSchema = z.object({
  title: z.string().min(1).max(255).trim(),
  description: z.string().max(2000).trim().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
  difficulty: z.enum(['EASY', 'MEDIUM', 'HARD', 'VERY_HARD']).default('MEDIUM'),
  due_date: z.string().datetime({ offset: true }).optional().nullable(),
  estimated_hours: z.number().positive().max(1000).optional().nullable(),
  category_id: z.string().cuid().optional().nullable(),
})

export const updateTaskSchema = createTaskSchema.partial().extend({
  status: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'OVERDUE']).optional(),
})

export const createCategorySchema = z.object({
  name: z.string().min(1).max(100).trim(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default('#6366f1'),
})

export const updateCategorySchema = createCategorySchema.partial()

export const createSessionSchema = z.object({
  task_id: z.string().cuid(),
  session_type: z.enum(['FOCUS', 'REVIEW', 'PRACTICE', 'READING']).default('FOCUS'),
  start_time: z.string().datetime({ offset: true }),
  end_time: z.string().datetime({ offset: true }).optional().nullable(),
  duration_mins: z.number().int().positive().max(1440).optional().nullable(),
  focus_score: z.number().int().min(0).max(100).optional().nullable(),
  interruption_count: z.number().int().min(0).default(0),
  interruption_reason: z.string().max(500).trim().optional().nullable(),
  notes: z.string().max(2000).trim().optional().nullable(),
})

export const updateSessionSchema = createSessionSchema.partial()

export const pomodoroSettingsSchema = z.object({
  work_duration: z.number().int().min(1).max(120).default(25),
  short_break: z.number().int().min(1).max(60).default(5),
  long_break: z.number().int().min(1).max(120).default(15),
  cycles_before_long_break: z.number().int().min(1).max(10).default(4),
  auto_start_breaks: z.boolean().default(false),
  auto_start_pomodoros: z.boolean().default(false),
})

export const pomodoroCycleSchema = z.object({
  start_time: z.string().datetime({ offset: true }),
  end_time: z.string().datetime({ offset: true }).optional().nullable(),
  duration_mins: z.number().int().positive().max(240).optional().nullable(),
  is_completed: z.boolean().default(false),
  cycle_number: z.number().int().positive(),
})

export const notificationSettingsSchema = z.object({
  email_notifications: z.boolean().optional(),
  push_notifications: z.boolean().optional(),
  reminder_before_minutes: z.number().int().min(0).max(10080).optional(),
  daily_digest: z.boolean().optional(),
  weekly_report: z.boolean().optional(),
  burnout_alerts: z.boolean().optional(),
})

export const sendNotificationSchema = z.object({
  user_id: z.string().cuid(),
  type: z.enum(['DEADLINE_ALERT', 'AI_REMINDER', 'SYSTEM', 'STREAK_UPDATE', 'BURNOUT_ALERT']),
  title: z.string().min(1).max(255).trim(),
  message: z.string().min(1).max(2000).trim(),
})

export const aiScheduleSchema = z.object({
  task_ids: z.array(z.string().cuid()).min(1).max(50),
  preferences: z.object({
    available_start: z.string().optional(),
    available_end: z.string().optional(),
    max_session_mins: z.number().int().min(15).max(480).optional(),
  }).optional(),
})

export const aiBurnoutSchema = z.object({
  days_back: z.number().int().min(1).max(30).default(7),
})