import { createEnv } from '@t3-oss/env-nextjs'
import { z } from 'zod'

export const env = createEnv({
  client: {
    NEXT_PUBLIC_URL: z.string().optional(),
    NEXT_PUBLIC_API_ENDPOINT: z.string().optional()
  },
  shared: {
    NODE_ENV: z.enum(['test', 'development', 'production']).optional()
  },
  // You need to destructure all the keys manually
  runtimeEnv: {
    NODE_ENV: process.env.NODE_ENV,
    NEXT_PUBLIC_URL: process.env.NEXT_PUBLIC_URL,
    NEXT_PUBLIC_API_ENDPOINT: process.env.NEXT_PUBLIC_API_ENDPOINT
  }
})
