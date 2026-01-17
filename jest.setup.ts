import '@testing-library/jest-dom'

// Mock @t3-oss/env-nextjs to avoid ES module issues in Jest
jest.mock('@/shared/lib/env', () => ({
  env: {
    NEXT_PUBLIC_API_ENDPOINT: 'https://api.test.com',
    NEXT_PUBLIC_WS_ENDPOINT: 'ws://localhost:8080/ws',
    NODE_ENV: 'test',
  },
}))

// Mock next-auth to avoid ES module issues
jest.mock('next-auth', () => ({
  default: jest.fn(),
}))
jest.mock('next-auth/providers/credentials', () => ({
  default: jest.fn(),
}))
jest.mock('next-auth/react', () => ({
  signIn: jest.fn(),
  signOut: jest.fn(),
  useSession: jest.fn(),
}))

// Mock scrollIntoView for React Testing Library
Element.prototype.scrollIntoView = jest.fn()
