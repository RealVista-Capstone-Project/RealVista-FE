FROM node:22.17-alpine AS base

# Install dependencies
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

# Build the application
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npm run build

# Backup .env before removing (if it exists) for runtime use
RUN if [ -f .env ]; then cp .env .env.backup && rm .env; fi

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

# Copy .env backup if it exists
RUN --mount=type=bind,from=builder,source=/app/.env.backup,target=/tmp/.env.backup \
    if [ -f /tmp/.env.backup ]; then \
      cp /tmp/.env.backup /app/.env && \
      chown nextjs:nodejs /app/.env; \
    fi

# Leverage standalone output
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
