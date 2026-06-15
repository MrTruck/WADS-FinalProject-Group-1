import { prisma } from '@/lib/prisma'

export async function createBurnoutAlert(userId: string, riskLevel: string, explanation: string) {
  const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000)
  const recent = await prisma.notification.findFirst({
    where: { user_id: userId, type: 'BURNOUT_ALERT', created_at: { gte: sixHoursAgo } },
  })
  if (recent) return
  await prisma.notification.create({
    data: {
      user_id: userId,
      type: 'BURNOUT_ALERT',
      title: `Burnout risk: ${riskLevel}`,
      message: explanation,
      is_read: false,
    },
  })
}

export async function createRescheduleSuggestion(userId: string, taskId: string, suggestion: any) {
  await prisma.reschedule_prompt.create({
    data: {
      user_id: userId,
      task_id: taskId,
      suggested_new_date: suggestion.newStartTime ? new Date(suggestion.newStartTime) : null,
      reason: suggestion.reason || 'AI suggested rescheduling',
      status: 'PENDING',
    },
  })
}

export async function createSummaryDigest(userId: string, summaryText: string) {
  await prisma.notification.create({
    data: {
      user_id: userId,
      type: 'AI_REMINDER',
      title: 'Weekly productivity summary',
      message: summaryText,
      is_read: false,
    },
  })
}