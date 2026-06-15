import { render, screen, fireEvent, act } from '@testing-library/react'
import NotificationPopup from '@/app/components/NotificationPopup'

describe('NotificationPopup', () => {
  const baseNotification = {
    id: '1',
    title: 'Reminder',
    message: 'Due soon',
    type: 'due-soon' as const,
    dueDate: new Date().toISOString(),
    dismissable: true,
  }

  beforeEach(() => {
    jest.useFakeTimers()
  })

  afterEach(() => {
    act(() => {
      jest.runOnlyPendingTimers()
    })
    jest.useRealTimers()
  })

  it('renders notification content and dismiss button', () => {
    render(<NotificationPopup notification={baseNotification} onDismiss={jest.fn()} />)

    expect(screen.getByText('Reminder')).toBeInTheDocument()
    expect(screen.getByText('Due soon')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Dismiss' })).toBeInTheDocument()
  })

  it('calls onDismiss when close button clicked', () => {
    const onDismiss = jest.fn()
    render(<NotificationPopup notification={baseNotification} onDismiss={onDismiss} />)

    fireEvent.click(screen.getByRole('button', { name: 'Dismiss' }))

    act(() => {
      jest.advanceTimersByTime(300)
    })

    expect(onDismiss).toHaveBeenCalled()
  })

  it('auto-dismisses after the notification timeout', () => {
    const onDismiss = jest.fn()
    render(<NotificationPopup notification={baseNotification} onDismiss={onDismiss} />)

    act(() => {
      jest.advanceTimersByTime(6300)
    })

    expect(onDismiss).toHaveBeenCalled()
  })
})
