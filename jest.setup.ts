import '@testing-library/jest-dom'

// Mock @t3-oss/env-nextjs to avoid ES module issues in Jest
jest.mock('@/shared/lib/env', () => ({
  env: {
    NEXT_PUBLIC_API_ENDPOINT: 'https://api.test.com',
    NODE_ENV: 'test',
  },
}))
