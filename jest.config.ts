import type { Config } from 'jest'
import nextJest from 'next/jest.js'

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files in your test environment
  dir: './',
})

// Add any custom config to be passed to Jest
const config: Config = {
  coverageProvider: 'v8',
  testEnvironment: 'jsdom',
  // Add more setup options before each test is run
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  moduleNameMapper: {
    // Handle module aliases for FSD architecture
    '^@/app/(.*)$': '<rootDir>/src/app/$1',
    '^@/shared/(.*)$': '<rootDir>/src/shared/$1',
    '^@/entities/(.*)$': '<rootDir>/src/entities/$1',
    '^@/features/(.*)$': '<rootDir>/src/features/$1',
    '^@/widgets/(.*)$': '<rootDir>/src/widgets/$1',
    '^@/screens/(.*)$': '<rootDir>/src/screens/$1',
  },
  transformIgnorePatterns: [
    'node_modules/(?!(@t3-oss/env-nextjs|@tanstack|@radix-ui)/)',
  ],
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.{js,jsx,ts,tsx}',
    '!src/**/__tests__/**',
  ],
}

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
export default createJestConfig(config)
