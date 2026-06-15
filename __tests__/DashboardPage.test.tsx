import { render, screen, fireEvent, act } from '@testing-library/react'
import DashboardCalendar from '@/app/dashboard/page'

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}))

describe('DashboardCalendar', () => {
  beforeEach(() => {
    jest.resetAllMocks()
    Object.defineProperty(document, 'cookie', {
      writable: true,
      value: '',
    })

    ;(global as any).fetch = jest.fn((input: RequestInfo) => {
      const url = typeof input === 'string' ? input : input.url
      if (url.endsWith('/api/v1/tasks')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ data: { tasks: [] } }),
        })
      }

      if (url.endsWith('/api/v1/analytics/progress')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            data: {
              tasks: {
                total: 0,
                completion_rate_percent: 0,
                breakdown: { COMPLETED: 0 },
              },
              sessions: { total_count: 0, total_duration_mins: 0 },
              streak: { current: 0, longest: 0 },
            },
          }),
        })
      }

      if (url.endsWith('/api/ai/burnout')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ riskLevel: 'Low', burnoutRiskScore: 20 }),
        })
      }

      return Promise.resolve({ ok: false, json: () => Promise.resolve({}) })
    })
  })

  it('renders dashboard header and initial controls', async () => {
    await act(async () => {
      render(<DashboardCalendar />)
    })

    expect(screen.getByRole('heading', { name: 'Dashboard' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /\+ New Task/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /monthly/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /weekly/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /daily/i })).toBeInTheDocument()

    expect(await screen.findByText('Upcoming Tasks')).toBeInTheDocument()
    expect(screen.getByText('No upcoming tasks.')).toBeInTheDocument()
  })

  it('opens new task modal when clicking New Task', async () => {
    await act(async () => {
      render(<DashboardCalendar />)
    })

    fireEvent.click(screen.getByRole('button', { name: /\+ New Task/i }))

    expect(await screen.findByPlaceholderText('What needs to be done?')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /create task/i })).toBeInTheDocument()
  })

  it('shows validation error when creating a new task without a title', async () => {
    await act(async () => {
      render(<DashboardCalendar />)
    })

    fireEvent.click(screen.getByRole('button', { name: /\+ New Task/i }))
    fireEvent.click(screen.getByRole('button', { name: /create task/i }))

    expect(await screen.findByText(/Title is required\./i)).toBeInTheDocument()
    expect(screen.getByPlaceholderText('What needs to be done?')).toBeInTheDocument()
  })

  it('displays an error banner when task creation fails', async () => {
    const originalFetch = (global as any).fetch
    ;(global as any).fetch = jest.fn(async (input: RequestInfo, init?: RequestInit) => {
      const url = typeof input === 'string' ? input : input.url
      const method = init?.method || (typeof input !== 'string' && input instanceof Request ? input.method : 'GET')

      if (url.endsWith('/api/v1/tasks') && method === 'POST') {
        return Promise.resolve({
          ok: false,
          json: () => Promise.resolve({ message: 'Unable to create task' }),
        })
      }

      if (url.endsWith('/api/v1/analytics/progress')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            data: {
              tasks: { total: 0, completion_rate_percent: 0, breakdown: { COMPLETED: 0 } },
              sessions: { total_count: 0, total_duration_mins: 0 },
              streak: { current: 0, longest: 0 },
            },
          })
        })
      }

      if (url.endsWith('/api/ai/burnout')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ riskLevel: 'Low', burnoutRiskScore: 20 }),
        })
      }

      return originalFetch(input, init)
    })

    await act(async () => {
      render(<DashboardCalendar />)
    })

    fireEvent.click(screen.getByRole('button', { name: /\+ New Task/i }))
    fireEvent.change(screen.getByPlaceholderText('What needs to be done?'), { target: { value: 'Test task' } })
    fireEvent.click(screen.getByRole('button', { name: /create task/i }))

    expect(await screen.findByText(/Unable to create task/i)).toBeInTheDocument()
  })

  it('closes the new task modal when the close button is clicked', async () => {
    await act(async () => {
      render(<DashboardCalendar />)
    })

    fireEvent.click(screen.getByRole('button', { name: /\+ New Task/i }))
    fireEvent.click(screen.getByText('✕'))

    await act(async () => {
      await Promise.resolve()
    })

    expect(screen.queryByPlaceholderText('What needs to be done?')).not.toBeInTheDocument()
  })

  it('changes calendar views when toggled', async () => {
    await act(async () => {
      render(<DashboardCalendar />)
    })

    fireEvent.click(screen.getByRole('button', { name: /weekly/i }))
    expect(screen.getByText(/Sun/)).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /daily/i }))
    expect(screen.getByText(/Today/)).toBeInTheDocument()
  })
})
