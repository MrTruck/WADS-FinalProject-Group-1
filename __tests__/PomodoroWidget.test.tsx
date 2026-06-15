import { render, screen } from '@testing-library/react'
import PomodoroWidget from '@/app/components/PomodoroWidget'

describe('PomodoroWidget', () => {
  it('renders the widget and timer', () => {
    render(<PomodoroWidget />)

    expect(screen.getByText('Pomodoro')).toBeInTheDocument()
    expect(screen.getByText('Work')).toBeInTheDocument()
  })

  it('links to the pomodoro page', () => {
    render(<PomodoroWidget />)

    expect(screen.getByRole('link')).toHaveAttribute('href', '/pomodoro')
  })
})
