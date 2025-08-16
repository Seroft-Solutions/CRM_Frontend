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

# Copy package files and install dependencies
COPY package*.json ./

# Install dependencies with retry mechanism for reliability
RUN npm --version &&     node --version &&     npm cache clean --force &&     npm ci

# Copy project sources (includes optional environment file)
COPY . .
# Create .env if missing to prevent build failures
RUN if [ -f "$ENV_FILE" ]; then cp "$ENV_FILE" .env; else echo "No $ENV_FILE provided" && touch .env; fi

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
