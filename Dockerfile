# Build stage
FROM node:20.17.0-alpine AS builder
WORKDIR /app

# Build arguments
ARG ENV_FILE=.env.production
ARG BUILD_VERSION=unknown

# Copy environment file and package files first for better layer caching
COPY ${ENV_FILE} .env
COPY package*.json ./

# Install dependencies with optimizations for CI/CD environments
RUN npm --version && \
    node --version && \
    npm config set strict-ssl false && \
    npm config set registry https://registry.npmjs.org/ && \
    npm config set fetch-retries 3 && \
    npm config set fetch-retry-mintimeout 10000 && \
    npm config set fetch-retry-maxtimeout 60000 && \
    npm cache clean --force && \
    npm ci --legacy-peer-deps --prefer-offline --no-audit --no-fund

COPY . .

# Build the application with TailwindCSS v4 support
ENV PATH=/app/node_modules/.bin:$PATH
ENV CI=true
ENV NODE_OPTIONS="--max-old-space-size=4096"
RUN NEXT_PRIVATE_ALLOW_STANDALONE=1 npm run build

# Production stage
FROM node:20.17.0-alpine AS runner
WORKDIR /app

# Build arguments
ARG BUILD_VERSION=unknown

# Labels for image metadata
LABEL maintainer="CRM Team"
LABEL version="1.2.1"
LABEL description="CRM Frontend Application"

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