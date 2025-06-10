# Build stage
FROM node:20.17.0-alpine AS builder
WORKDIR /app

# Copy package files first for better layer caching
COPY package*.json ./

# Install dependencies (remove cache clean and verbose for speed)
RUN npm ci --legacy-peer-deps --omit=dev

# Copy source code first
COPY . .

# Copy env file (after source to avoid conflicts)
ARG ENV_FILE
COPY ${ENV_FILE} .env

# Build the application
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