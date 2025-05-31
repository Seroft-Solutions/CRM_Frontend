# Build stage
FROM node:20.17.0-alpine AS builder
WORKDIR /app

ARG ENV_FILE
COPY ${ENV_FILE} .env
COPY package*.json ./

RUN npm --version && \
    node --version && \
    npm cache clean --force && \
    npm ci --legacy-peer-deps --verbose || (cat /root/.npm/_logs/*-debug.log && exit 1)

COPY . .
RUN npm run build

# Production stage
FROM node:20.17.0-alpine AS runner
WORKDIR /app

COPY --from=builder /app/.env ./
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
ENV PORT=3000 HOSTNAME="0.0.0.0"
CMD ["node", "server.js"]