# Testing Strategy & Guidelines

> **Version:** 1.0
> **Last Updated:** 2025-12-30
> **Framework:** Next.js 15 + React 19 + Jest + React Testing Library

## Table of Contents

1. [Testing Philosophy](#testing-philosophy)
2. [Testing Stack](#testing-stack)
3. [Testing Pyramid](#testing-pyramid)
4. [FSD Testing Strategy](#fsd-testing-strategy)
5. [Writing Good Tests](#writing-good-tests)
6. [Test Coverage Goals](#test-coverage-goals)
7. [Testing Checklist](#testing-checklist)
8. [Common Patterns](#common-patterns)
9. [Troubleshooting](#troubleshooting)

---

## Testing Philosophy

### Core Principles

1. **Tests give confidence, not perfection**
   - Tests are a safety net for refactoring
   - They document expected behavior
   - They enable fearless code changes

2. **Test behavior, not implementation**
   - Test what users see and do
   - Avoid testing internal functions
   - Don't test CSS classes or HTML structure directly

3. **Quality over quantity**
   - 70-80% coverage is the sweet spot
   - Focus on critical paths and business logic
   - One well-written test > 10 brittle tests

4. **Test early, test often**
   - Write tests alongside code (TDD when beneficial)
   - Run tests in watch mode during development
   - Fix broken tests immediately

### What We Test

✅ **DO Test:**
- User interactions (clicks, form submissions, navigation)
- Business logic (validation, data transformation)
- Edge cases (empty data, null values, error states)
- API integration (requests, responses, error handling)
- State management (store actions, selectors)
- Component rendering with different props

❌ **DON'T Test:**
- Third-party libraries (React, Next.js, Radix UI)
- Implementation details (internal functions, exact HTML)
- Trivial code (simple getters, pass-through props)
- Styles and CSS classes directly

---

## Testing Stack

### Dependencies

```json
{
  "jest": "^29.7.0",
  "jest-environment-jsdom": "^29.7.0",
  "@testing-library/react": "^16.3.1",
  "@testing-library/dom": "^10.4.1",
  "@testing-library/jest-dom": "^6.9.1",
  "@types/jest": "^30.0.0",
  "ts-node": "^10.9.2"
}
```

### Configuration Files

- **`jest.config.ts`** - Main Jest configuration with FSD path aliases
- **`jest.setup.ts`** - Global test setup, mocks for environment variables

### Test Scripts

```bash
# Run all tests once
npm run test

# Run tests in watch mode (re-run on changes)
npm run test:watch

# Run tests with coverage report
npm run test:coverage

# Run specific test file
npm run test -- path/to/test.test.ts

# Run tests matching pattern
npm run test -- --testNamePattern="should redirect"
```

---

## Testing Pyramid

```
           ▲
          / \        E2E Tests (5%)
         /---\       - Critical user paths
        /-----\      - Slow, expensive
       /-------\
      /---------\    Integration Tests (20%)
     /-----------\   - API calls, state management
    /-------------\  - Component interactions
   /---------------\
  /-----------------\
 /-------------------\ Unit Tests (75%)
/---------------------\- Fast, focused
```

### Distribution for Frontend

- **75% Unit Tests** - Components, utilities, hooks, store
- **20% Integration Tests** - API calls, component integration, state
- **5% E2E Tests** - Critical user journeys (Playwright/Cypress)

---

## FSD Testing Strategy

### Layer-by-Layer Guidelines

#### **Shared Layer** (75% Unit Tests)

**Priority: HIGH** - These components are reused across the entire app.

```
src/shared/
├── ui/              # UI components
├── lib/             # Utilities, HTTP client
├── config/          # Configuration
├── constants/       # Constants
└── segments/        # i18n segments
```

**Testing Focus:**
- **UI Components**: Props → Output, user interactions, accessibility
- **Libraries**: Pure functions, HTTP client, error handling
- **Config/Constants**: Route definitions, message constants

**Test File Location:**
```
src/shared/ui/button/button.tsx    → src/shared/ui/button/button.test.tsx
src/shared/lib/utils/cn.ts         → src/shared/lib/utils/cn.test.ts
```

**Examples:**

```typescript
// Button Component Test
describe('Button', () => {
  it('renders with default styles', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByRole('button')).toHaveClass('bg-primary')
  })

  it('is disabled when disabled prop is true', () => {
    render(<Button disabled>Click</Button>)
    expect(screen.getByRole('button')).toBeDisabled()
  })

  it('handles click events', () => {
    const handleClick = jest.fn()
    render(<Button onClick={handleClick}>Click</Button>)
    screen.getByRole('button').click()
    expect(handleClick).toHaveBeenCalledTimes(1)
  })
})

// Utility Function Test
describe('cn', () => {
  it('merges Tailwind classes', () => {
    expect(cn('px-4 py-2')).toBe('px-4 py-2')
  })

  it('resolves conflicting classes', () => {
    expect(cn('px-4', 'px-2')).toBe('px-2')
  })

  it('handles conditional classes', () => {
    expect(cn('base', true && 'active', false && 'inactive'))
      .toBe('base active')
  })
})

// HTTP Client Test
describe('HTTP Client', () => {
  it('includes Authorization header when token exists', async () => {
    localStorageMock.getItem.mockReturnValueOnce('token')
    mockFetch.mockResolvedValueOnce({ ok: true, status: 200, json: jest.fn().mockResolvedValueOnce({}) })

    await http.get('/protected')

    expect(global.fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer token'
        })
      })
    )
  })

  it('throws EntityError for 422 status', async () => {
    const mockJson = jest.fn().mockResolvedValueOnce({
      message: 'Validation failed',
      errors: [{ field: 'email', message: 'Invalid email' }]
    })
    mockFetch.mockResolvedValueOnce({ ok: false, status: 422, json: mockJson })

    await expect(http.post('/users', {})).rejects.toThrow(EntityError)
  })
})
```

---

#### **Entities Layer** (50% Unit, 50% Integration)

**Priority: MEDIUM** - Business logic and domain models.

```
src/entities/
└── user/
    ├── model/       # Store, types, business logic
    └── ui/          # Entity-specific components
```

**Testing Focus:**
- **Store**: Actions, selectors, state persistence
- **Types**: Runtime validation (if using zod/io-ts)
- **UI**: Entity-specific components

**Examples:**

```typescript
// Zustand Store Test
describe('useAuthStore', () => {
  beforeEach(() => {
    useAuthStore.getState().clearAuth()
  })

  it('initializes with null user and token', () => {
    const { result } = renderHook(() => useAuthStore())
    expect(result.current.user).toBeNull()
    expect(result.current.token).toBeNull()
  })

  it('sets auth user and token', () => {
    const { result } = renderHook(() => useAuthStore())

    act(() => {
      result.current.setAuth({ id: '123', name: 'John' }, 'token')
    })

    expect(result.current.user).toEqual({ id: '123', name: 'John' })
    expect(result.current.token).toBe('token')
  })

  it('persists state across hook instances', () => {
    const { result: result1 } = renderHook(() => useAuthStore())
    const { result: result2 } = renderHook(() => useAuthStore())

    act(() => {
      result1.current.setAuth({ id: '123', name: 'John' }, 'token')
    })

    expect(result2.current.user).toEqual({ id: '123', name: 'John' })
  })
})
```

---

#### **Features Layer** (60% Integration Tests)

**Priority: MEDIUM** - Feature-specific components and logic.

```
src/features/
└── home/
    ├── ui/          # Feature components
    ├── model/       # Feature state/logic
    └── i18n/        # Feature translations
```

**Testing Focus:**
- **Components**: Feature interactions, integration with stores
- **User workflows**: Multi-step interactions
- **i18n**: Translation keys (if complex)

**Examples:**

```typescript
// Feature Component Test
describe('HomeHero', () => {
  it('renders the Next.js logo', () => {
    render(<HomeHero />)
    expect(screen.getByAltText('Next.js logo')).toBeInTheDocument()
  })

  it('renders the title button with translation', () => {
    render(<HomeHero />)
    expect(screen.getByRole('button', { name: 'HomePage:title' }))
      .toBeInTheDocument()
  })

  it('opens external links in new tab', () => {
    render(<HomeHero />)
    const links = screen.getAllByRole('link')
    links.forEach(link => {
      expect(link).toHaveAttribute('target', '_blank')
      expect(link).toHaveAttribute('rel', 'noopener noreferrer')
    })
  })
})
```

---

#### **Screens Layer** (40% Integration Tests)

**Priority: LOW** - Page composition, mostly integration of features.

```
src/screens/
└── home/
    └── ui/
        └── home-page.tsx
```

**Testing Focus:**
- **Page structure**: Main sections are rendered
- **Layout**: Responsive behavior
- **Navigation**: Page-level navigation

**Note:** If a screen is just composing features, minimal testing is needed.

---

#### **Middleware** (Integration Tests)

**Priority: HIGH** - Critical for routing and auth.

```
src/middleware.ts
```

**Testing Focus:**
- **Redirect logic**: Route protection, redirects
- **Header manipulation**: Auth headers, cookies
- **Request modification**: Locale handling, A/B testing

**Example:**

```typescript
// Middleware Test
describe('middleware', () => {
  it('redirects to /home when accessing protected route', () => {
    const request = new NextRequest(new URL('http://localhost:3000/about'))
    const response = middleware(request)

    expect(response.status).toBe(307)
    expect(response.headers.get('location')).toContain('/home')
  })

  it('preserves query parameters during redirect', () => {
    const request = new NextRequest(
      new URL('http://localhost:3000/about?foo=bar')
    )
    const response = middleware(request)

    expect(response.headers.get('location')).toContain('foo=bar')
  })
})
```

---

## Writing Good Tests

### The AAA Pattern

Every test should follow **Arrange, Act, Assert**:

```typescript
it('does something meaningful', () => {
  // Arrange - Set up the test
  const props = { title: 'Hello', disabled: false }

  // Act - Execute the code
  render(<Button {...props} />)

  // Assert - Verify the result
  expect(screen.getByRole('button')).toHaveTextContent('Hello')
})
```

### Descriptive Test Names

```typescript
// ❌ Bad - Vague
it('works', () => {})

// ✅ Good - Specific and descriptive
it('redirects unauthenticated users to login page', () => {})

// ✅ Good - Describes the scenario
it('shows error message when email is invalid', () => {})
```

### One Assertion Per Test

```typescript
// ❌ Bad - Testing multiple things
it('handles form submission', () => {
  render(<Form />)
  // ... 20 lines of testing multiple scenarios
})

// ✅ Good - Focused tests
it('disables submit button while submitting', () => {})
it('shows validation errors for invalid email', () => {})
it('calls onSubmit with form data on valid submit', () => {})
```

### Test Edge Cases

```typescript
describe('fetchUser', () => {
  it('returns user data on success', () => {})
  it('handles network timeout', () => {})
  it('handles 404 not found', () => {})
  it('handles 500 server error', () => {})
  it('handles malformed response', () => {})
  it('handles empty user list', () => {})
  it('caches response for identical requests', () => {})
})
```

### Test Behavior, Not Implementation

```typescript
// ❌ Bad - Tests implementation
it('has the correct CSS class', () => {
  expect(button).toHaveClass('bg-blue-500')
})

it('calls useState hook', () => {
  // Can't really test this, and shouldn't
})

// ✅ Good - Tests behavior
it('is disabled when loading', () => {
  render(<Button loading />)
  expect(screen.getByRole('button')).toBeDisabled()
})

it('shows loading spinner during form submission', () => {
  render(<Form />)
  fireEvent.click(screen.getByText('Submit'))
  expect(screen.getByRole('status', { hidden: true })).toBeInTheDocument()
})
```

---

## Test Coverage Goals

### Overall Targets

| Layer | Target Coverage | Priority |
|-------|----------------|----------|
| Shared (UI) | 80-90% | HIGH |
| Shared (Lib) | 90-100% | HIGH |
| Entities | 70-80% | MEDIUM |
| Features | 60-70% | MEDIUM |
| Screens | 40-50% | LOW |
| Middleware | 80-90% | HIGH |

### Critical Paths

100% coverage required for:
- Authentication/authorization
- Payment processing
- Data validation
- Error handling
- API client logic

### Current Coverage Status

```
✅ Tested:
- src/shared/ui/button/button.tsx
- src/shared/ui/avatar.tsx
- src/shared/lib/utils/cn.ts
- src/shared/lib/utils/jwt.ts
- src/shared/lib/utils/handle-error.ts
- src/shared/lib/http/http.ts

❌ Needs Tests:
- src/middleware.ts
- src/shared/lib/utils/path.ts
- src/entities/user/model/store.ts (when implemented)
- src/shared/ui/card/card.tsx
- src/shared/ui/input/input.tsx
- src/shared/ui/form/form.tsx
- src/features/home/ui/*.tsx
- src/screens/home/ui/home-page.tsx
```

---

## Testing Checklist

### Before Writing Tests

- [ ] Identify what behavior needs testing
- [ ] Determine if it's a unit or integration test
- [ ] List edge cases to cover
- [ ] Plan test structure (describe blocks)

### Writing Tests

- [ ] Use descriptive test names
- [ ] Follow AAA pattern (Arrange, Act, Assert)
- [ ] Test behavior, not implementation
- [ ] One assertion per test (mostly)
- [ ] Mock external dependencies
- [ ] Clean up after each test

### After Writing Tests

- [ ] Run tests locally: `npm run test`
- [ ] Check coverage: `npm run test:coverage`
- [ ] Tests should be fast (< 5 seconds for entire suite)
- [ ] Tests should be deterministic (always pass/fail)
- [ ] Test names should be self-documenting

### Continuous Testing

- [ ] Run tests in watch mode during development
- [ ] Fix broken tests immediately
- [ ] Update tests when refactoring
- [ ] Add tests for bugs before fixing them

---

## Common Patterns

### Mocking External Dependencies

**next-intl:**
```typescript
jest.mock('next-intl', () => ({
  useTranslations: (key: string) => (str: string) => `${key}:${str}`,
}))
```

**next/image:**
```typescript
jest.mock('next/image', () => ({
  default: ({ alt, ...props }: any) => <img alt={alt} {...props} />,
}))
```

**localStorage:**
```typescript
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
})
```

**fetch:**
```typescript
global.fetch = jest.fn()

// In tests
(global.fetch as jest.Mock).mockResolvedValueOnce({
  ok: true,
  status: 200,
  json: jest.fn().mockResolvedValueOnce({ data: 'test' }),
})
```

### Testing Async Code

```typescript
// Using async/await
it('fetches user data', async () => {
  mockFetch.mockResolvedValueOnce({
    ok: true,
    status: 200,
    json: jest.fn().mockResolvedValueOnce({ id: 1, name: 'John' })
  })

  const user = await fetchUser(1)
  expect(user).toEqual({ id: 1, name: 'John' })
})

// Using promises
it('throws error on 404', () => {
  mockFetch.mockResolvedValueOnce({
    ok: false,
    status: 404,
    json: jest.fn().mockResolvedValueOnce({ message: 'Not found' })
  })

  return expect(fetchUser(999)).rejects.toThrow(HttpError)
})
```

### Testing User Interactions

```typescript
it('handles button click', () => {
  const handleClick = jest.fn()
  render(<Button onClick={handleClick}>Click me</Button>)

  fireEvent.click(screen.getByRole('button'))

  expect(handleClick).toHaveBeenCalledTimes(1)
})

it('handles form submission', async () => {
  const handleSubmit = jest.fn()
  render(<Form onSubmit={handleSubmit} />)

  fireEvent.change(screen.getByLabelText('Email'), {
    target: { value: 'test@example.com' }
  })
  fireEvent.click(screen.getByRole('button', { name: 'Submit' }))

  await waitFor(() => {
    expect(handleSubmit).toHaveBeenCalledWith({
      email: 'test@example.com'
    })
  })
})
```

### Testing Component Variants

```typescript
describe('Button Variants', () => {
  it('renders destructive variant', () => {
    render(<Button variant="destructive">Delete</Button>)
    expect(screen.getByRole('button')).toHaveClass('bg-destructive')
  })

  it('renders outline variant', () => {
    render(<Button variant="outline">Cancel</Button>)
    expect(screen.getByRole('button')).toHaveClass('border')
  })

  it('renders ghost variant', () => {
    render(<Button variant="ghost">Ghost</Button>)
    expect(screen.getByRole('button')).toHaveClass('hover:bg-accent')
  })
})
```

---

## Troubleshooting

### Common Issues

#### 1. "vi is not defined"

**Problem:** Using vitest syntax (`vi`) instead of Jest

**Solution:**
```typescript
// ❌ Wrong
vi.mock('@/shared/lib/env', () => ({ ... }))

// ✅ Correct
jest.mock('@/shared/lib/env', () => ({ ... }))
```

#### 2. Tests Can't Find Modules

**Problem:** Path aliases not resolved

**Solution:** Check `jest.config.ts` has correct `moduleNameMapper`:
```typescript
moduleNameMapper: {
  '^@/shared/(.*)$': '<rootDir>/src/shared/$1',
  '^@/entities/(.*)$': '<rootDir>/src/entities/$1',
  // ... etc
}
```

#### 3. Mock Not Working

**Problem:** Mock not applied correctly

**Solution:** Mock before imports:
```typescript
// ✅ Correct order
jest.mock('./module', () => ({ ... }))
import { something } from './module'

// ❌ Wrong order
import { something } from './module'
jest.mock('./module', () => ({ ... }))
```

#### 4. Test Timeout

**Problem:** Async test timing out

**Solution:** Increase timeout or use `waitFor`:
```typescript
it('loads data slowly', async () => {
  render(<Component />)

  await waitFor(
    () => expect(screen.getByText('Loaded')).toBeInTheDocument(),
    { timeout: 5000 }
  )
})
```

#### 5. "Cannot find module" for env variables

**Problem:** @t3-oss/env-nextjs ES module issues

**Solution:** Already mocked in `jest.setup.ts`:
```typescript
jest.mock('@/shared/lib/env', () => ({
  env: {
    NEXT_PUBLIC_API_ENDPOINT: 'https://api.test.com',
    NODE_ENV: 'test',
  },
}))
```

### Debugging Tips

```typescript
// 1. Use screen.debug() to see rendered output
it('debugs output', () => {
  render(<Component />)
  screen.debug() // Prints entire DOM
})

// 2. Log query results
it('finds elements', () => {
  render(<Component />)
  console.log(screen.getByRole('button').innerHTML)
})

// 3. Pause test execution
it('pauses for inspection', () => {
  render(<Component />)
  screen.debug()
  pause() // Requires jest-puppeteer or similar
})

// 4. Run single test
npm run test -- --testNamePattern="specific test name"

// 5. Run tests for single file
npm run test -- path/to/test.test.ts
```

---

## Action Items

### Immediate (Week 1)

- [ ] Add tests for `src/shared/lib/utils/path.ts`
- [ ] Add tests for `src/middleware.ts`
- [ ] Add tests for `src/shared/ui/card/card.tsx`
- [ ] Add tests for `src/shared/ui/input/input.tsx`

### Short Term (Month 1)

- [ ] Add tests for all shared UI components
- [ ] Add tests for `src/entities/user/model/store.ts`
- [ ] Add tests for feature components
- [ ] Achieve 70%+ coverage on `src/shared/`

### Ongoing

- [ ] Write tests for new features alongside code
- [ ] Update tests when refactoring
- [ ] Review test coverage monthly
- [ ] Keep test suite under 10 seconds runtime

---

## Resources

### Internal Documentation

- **Jest Config:** `jest.config.ts`
- **Jest Setup:** `jest.setup.ts`
- **Existing Tests:** `src/**/*.test.ts`, `src/**/*.test.tsx`

### External Resources

- [Jest Documentation](https://jestjs.io/)
- [React Testing Library](https://testing-library.com/react)
- [Next.js Testing Guide](https://nextjs.org/docs/app/testing/jest)
- [Testing Playground](https://testing-playground.com/)
- [Common Testing Mistakes](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)

### Quick Reference

```bash
# Run all tests
npm run test

# Watch mode
npm run test:watch

# Coverage
npm run test:coverage

# Update snapshots
npm run test -- -u

# Run tests matching pattern
npm run test -- --testNamePattern="pattern"
```

---

**Remember:** Tests are a tool, not a goal. Write tests that give you confidence and help you ship better code faster. 🚀
