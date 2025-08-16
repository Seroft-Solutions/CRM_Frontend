# Build stage
FROM node:20.17.0-alpine AS builder
WORKDIR /app

# Build arguments
ARG ENV_FILE=.env.production
ARG BUILD_VERSION=unknown
ARG NODE_ENV=production
ARG NEXT_TELEMETRY_DISABLED=1

# Environment variables to optimize build
ENV NODE_ENV=${NODE_ENV}
ENV NEXT_TELEMETRY_DISABLED=${NEXT_TELEMETRY_DISABLED}
ENV CI=true
ENV NODE_OPTIONS="--max-old-space-size=4096"
ENV NEXT_CONFIG_IGNORE_CSS_LOAD_ERROR=true

# Copy environment file and package files
COPY ${ENV_FILE} .env
COPY package*.json ./

# Install dependencies with retry mechanism for reliability
RUN npm --version && \
    node --version && \
    npm cache clean --force && \
    npm install --include=dev

# Copy source files
COPY src ./src
COPY public ./public
COPY *.config.* ./
COPY *.json ./
COPY *.md ./
COPY components.json ./

# Build the application with TailwindCSS v4 support
ENV PATH=/app/node_modules/.bin:$PATH
RUN NEXT_PRIVATE_ALLOW_STANDALONE=1 npm run build

# Production stage
FROM node:20.17.0-alpine AS runner
WORKDIR /app

# Build arguments
ARG BUILD_VERSION=unknown

# Labels for image metadata
LABEL maintainer="CRM Team"
LABEL version="1.3.1"
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