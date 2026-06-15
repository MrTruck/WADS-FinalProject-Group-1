import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import LoginPage from '@/app/login/page'

const mockPush = jest.fn()

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}))

describe('LoginPage', () => {
  beforeEach(() => {
    jest.resetAllMocks()
    mockPush.mockClear()
    ;(global as any).fetch = jest.fn()
  })

  it('renders login form and toggles to sign up', () => {
    render(<LoginPage />)

    expect(screen.getByText('Workload Reminder')).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: 'Login' })).toHaveLength(2)
    expect(screen.getByPlaceholderText('Enter your email')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Enter your password')).toBeInTheDocument()

    const signUpToggle = screen.getAllByRole('button', { name: 'Sign Up' })[0]
    fireEvent.click(signUpToggle)

    expect(screen.getByPlaceholderText('Enter your name')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Create Account' })).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Enter your name')).toBeRequired()
  })

  it('updates form inputs on change', () => {
    render(<LoginPage />)

    fireEvent.change(screen.getByPlaceholderText('Enter your email'), { target: { value: 'test@example.com' } })
    fireEvent.change(screen.getByPlaceholderText('Enter your password'), { target: { value: 'password123' } })

    expect((screen.getByPlaceholderText('Enter your email') as HTMLInputElement).value).toBe('test@example.com')
    expect((screen.getByPlaceholderText('Enter your password') as HTMLInputElement).value).toBe('password123')
  })

  it('enforces required fields in login and sign up modes', () => {
    render(<LoginPage />)

    expect(screen.getByPlaceholderText('Enter your email')).toBeRequired()
    expect(screen.getByPlaceholderText('Enter your password')).toBeRequired()

    fireEvent.click(screen.getAllByRole('button', { name: 'Sign Up' })[0])

    expect(screen.getByPlaceholderText('Enter your name')).toBeRequired()
  })

  it('shows a network error message when login fetch fails', async () => {
    ;(global as any).fetch.mockRejectedValue(new Error('Network failure'))

    render(<LoginPage />)

    fireEvent.change(screen.getByPlaceholderText('Enter your email'), { target: { value: 'test@example.com' } })
    fireEvent.change(screen.getByPlaceholderText('Enter your password'), { target: { value: 'password123' } })
    const loginSubmit = screen.getAllByRole('button', { name: 'Login' }).find(
      (button) => button.getAttribute('type') === 'submit'
    )
    expect(loginSubmit).toBeDefined()
    fireEvent.click(loginSubmit!) 

    expect(await screen.findByText(/Network failure/i)).toBeInTheDocument()
    expect(mockPush).not.toHaveBeenCalled()
  })

  it('shows API error message when login fails', async () => {
    ;(global as any).fetch.mockResolvedValue({
      ok: false,
      json: async () => ({ message: 'Invalid credentials' }),
    })

    render(<LoginPage />)

    fireEvent.change(screen.getByPlaceholderText('Enter your email'), { target: { value: 'test@example.com' } })
    fireEvent.change(screen.getByPlaceholderText('Enter your password'), { target: { value: 'wrongpass' } })
    const loginSubmit = screen.getAllByRole('button', { name: 'Login' }).find(
      (button) => button.getAttribute('type') === 'submit'
    )
    expect(loginSubmit).toBeDefined()
    fireEvent.click(loginSubmit!) 

    expect(await screen.findByText(/Invalid credentials/i)).toBeInTheDocument()
    expect(mockPush).not.toHaveBeenCalled()
  })

  it('redirects to dashboard on successful login', async () => {
    ;(global as any).fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    })

    render(<LoginPage />)

    fireEvent.change(screen.getByPlaceholderText('Enter your email'), { target: { value: 'test@example.com' } })
    fireEvent.change(screen.getByPlaceholderText('Enter your password'), { target: { value: 'password123' } })
    const loginSubmit = screen.getAllByRole('button', { name: 'Login' }).find(
      (button) => button.getAttribute('type') === 'submit'
    )
    expect(loginSubmit).toBeDefined()
    fireEvent.click(loginSubmit!) 

    await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/dashboard'))
  })
})
