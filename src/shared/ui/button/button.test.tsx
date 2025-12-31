import { render, screen } from '@testing-library/react'
import { Button } from './button'

describe('Button', () => {
  it('renders a button with default styles', () => {
    render(<Button>Click me</Button>)
    const button = screen.getByRole('button', { name: 'Click me' })
    expect(button).toBeInTheDocument()
    expect(button).toHaveClass('inline-flex')
  })

  it('renders with destructive variant', () => {
    render(<Button variant='destructive'>Delete</Button>)
    const button = screen.getByRole('button', { name: 'Delete' })
    expect(button).toHaveClass('bg-destructive')
  })

  it('renders with outline variant', () => {
    render(<Button variant='outline'>Cancel</Button>)
    const button = screen.getByRole('button', { name: 'Cancel' })
    expect(button).toHaveClass('border')
  })

  it('renders with secondary variant', () => {
    render(<Button variant='secondary'>Secondary</Button>)
    const button = screen.getByRole('button', { name: 'Secondary' })
    expect(button).toHaveClass('bg-secondary')
  })

  it('renders with ghost variant', () => {
    render(<Button variant='ghost'>Ghost</Button>)
    const button = screen.getByRole('button', { name: 'Ghost' })
    expect(button).toHaveClass('hover:bg-accent')
  })

  it('renders with link variant', () => {
    render(<Button variant='link'>Link</Button>)
    const button = screen.getByRole('button', { name: 'Link' })
    expect(button).toHaveClass('text-primary')
  })

  it('renders with different sizes', () => {
    const { rerender } = render(<Button size='sm'>Small</Button>)
    let button = screen.getByRole('button', { name: 'Small' })
    expect(button).toHaveClass('h-8')

    rerender(<Button size='lg'>Large</Button>)
    button = screen.getByRole('button', { name: 'Large' })
    expect(button).toHaveClass('h-10')

    rerender(<Button size='icon'>Icon</Button>)
    button = screen.getByRole('button', { name: 'Icon' })
    expect(button).toHaveClass('size-9')
  })

  it('renders as child when asChild is true', () => {
    render(
      <Button asChild>
        <span role='link'>Link Button</span>
      </Button>
    )
    const link = screen.getByRole('link', { name: 'Link Button' })
    expect(link).toBeInTheDocument()
  })

  it('applies custom className', () => {
    render(<Button className='custom-class'>Custom</Button>)
    const button = screen.getByRole('button', { name: 'Custom' })
    expect(button).toHaveClass('custom-class')
  })

  it('is disabled when disabled prop is true', () => {
    render(<Button disabled>Disabled</Button>)
    const button = screen.getByRole('button', { name: 'Disabled' })
    expect(button).toBeDisabled()
    expect(button).toHaveClass('disabled:opacity-50')
  })

  it('passes through other props', () => {
    render(<Button data-testid='custom-button'>Test</Button>)
    const button = screen.getByTestId('custom-button')
    expect(button).toBeInTheDocument()
  })
})
