FROM oven/bun:1.2.18-alpine AS base

FROM base AS deps
WORKDIR /app
COPY package.json bun.lock turbo.json ./
COPY apps/web/package.json ./apps/web/
RUN bun install --frozen-lockfile

FROM deps AS migrator
COPY . .
WORKDIR /app/apps/web
CMD ["bun", "run", "db:migrate"]

FROM base AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/web/node_modules ./apps/web/node_modules

COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
ENV TURBO_TELEMETRY_DISABLED=1

ARG DATABASE_URL
ARG BETTER_AUTH_SECRET
ARG NEXT_PUBLIC_SITE_URL
ARG NEXT_PUBLIC_MARBLE_API_URL
ARG NEXT_PUBLIC_DATABUDDY_CLIENT_ID
ARG UPSTASH_REDIS_REST_URL
ARG UPSTASH_REDIS_REST_TOKEN
ARG MARBLE_WORKSPACE_KEY
ARG FREESOUND_CLIENT_ID
ARG FREESOUND_API_KEY

ENV DATABASE_URL=${DATABASE_URL}
ENV BETTER_AUTH_SECRET=${BETTER_AUTH_SECRET}
ENV NEXT_PUBLIC_SITE_URL=${NEXT_PUBLIC_SITE_URL}
ENV NEXT_PUBLIC_MARBLE_API_URL=${NEXT_PUBLIC_MARBLE_API_URL}
ENV NEXT_PUBLIC_DATABUDDY_CLIENT_ID=${NEXT_PUBLIC_DATABUDDY_CLIENT_ID}
ENV UPSTASH_REDIS_REST_URL=${UPSTASH_REDIS_REST_URL}
ENV UPSTASH_REDIS_REST_TOKEN=${UPSTASH_REDIS_REST_TOKEN}
ENV MARBLE_WORKSPACE_KEY=${MARBLE_WORKSPACE_KEY}
ENV FREESOUND_CLIENT_ID=${FREESOUND_CLIENT_ID}
ENV FREESOUND_API_KEY=${FREESOUND_API_KEY}

WORKDIR /app/apps/web
RUN bun run build

FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

COPY --from=builder --chown=nextjs:nodejs /app/apps/web/public ./apps/web/public
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static

RUN chown nextjs:nodejs apps

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["bun", "apps/web/server.js"]
