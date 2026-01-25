# Testing Quick Reference

> **Quick cheat sheet for daily testing tasks**

## Commands

```bash
npm run test              # Run all tests
npm run test:watch        # Watch mode
npm run test:coverage     # Coverage report
npm run test -- path.test.ts  # Run specific file
```

## Test Template

```typescript
import { render, screen } from '@testing-library/react'
import { Component } from './component'

describe('Component', () => {
  // Arrange
  const setup = (props = {}) => {
    return render(<Component {...props} />)
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('behavior', () => {
    it('does something', () => {
      // Arrange
      setup({ prop: 'value' })

      // Act
      const element = screen.getByRole('button')

      // Assert
      expect(element).toBeInTheDocument()
    })
  })
})
```

## Common Mocks

```typescript
// next-intl
jest.mock('next-intl', () => ({
  useTranslations: (key: string) => (str: string) => `${key}:${str}`,
}))

// next/image
jest.mock('next/image', () => ({
  default: (props: any) => <img {...props} />,
}))

// localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}
global.localStorage = localStorageMock

// fetch
global.fetch = jest.fn()
```

## Queries

```typescript
// By role (preferred)
screen.getByRole('button', { name: 'Submit' })
screen.getByRole('link', { name: 'Learn more' })

// By text
screen.getByText('Hello')
screen.getByLabelText('Email')

// By alt text
screen.getByAltText('Logo')

// By test id (use sparingly)
screen.getByTestId('custom-id')
```

## Assertions

```typescript
// Presence
expect(element).toBeInTheDocument()
expect(element).not.toBeInTheDocument()

// State
expect(button).toBeDisabled()
expect(input).toHaveFocus()
expect(checkbox).toBeChecked()

// Content
expect(text).toHaveTextContent('Hello')
expect(input).toHaveValue('test@example.com')
expect(link).toHaveAttribute('href', '/home')

// Classes
expect(element).toHaveClass('active')
expect(element).toHaveClass('bg-primary')

// Async
await waitFor(() => expect(element).toBeInTheDocument())
await findByText('Loading...')
```

## Testing Checklist

- [ ] Descriptive test name
- [ ] AAA pattern (Arrange, Act, Assert)
- [ ] Test behavior, not implementation
- [ ] One assertion per test
- [ ] Mock external dependencies
- [ ] Clean up in beforeEach
- [ ] Test edge cases

## What to Test

### Unit Tests
- Pure functions
- Component rendering
- User interactions
- State changes

### Integration Tests
- API calls
- Multi-component workflows
- State management
- Routing

## Don't Test

- Third-party libraries
- CSS classes
- Internal functions
- Trivial code

## Coverage Goals

| Layer | Target |
|-------|--------|
| Shared (UI) | 80-90% |
| Shared (Lib) | 90-100% |
| Entities | 70-80% |
| Features | 60-70% |
| Screens | 40-50% |

## Debugging

```typescript
screen.debug()           // Print entire DOM
screen.debug(element)    // Print specific element
pause()                  // Pause test (requires jest-puppeteer)
console.log(element)     // Log element
```

---

**See [TESTING_STRATEGY.md](./TESTING_STRATEGY.md) for complete guide**
