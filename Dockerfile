# Build stage - Using standard Node.js image for better TailwindCSS v4 compatibility
FROM node:20.17.0-slim AS builder
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
ENV NODE_OPTIONS="--max-old-space-size=8192"
ENV NEXT_CONFIG_IGNORE_CSS_LOAD_ERROR=true

# Install system dependencies for TailwindCSS v4 and LightningCSS
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Copy package files and install dependencies
COPY package*.json ./

# Install dependencies with specific flags for TailwindCSS v4 and LightningCSS
RUN npm --version && \
    node --version && \
    npm cache clean --force && \
    rm -rf node_modules && \
    npm ci --prefer-offline --no-audit --progress=false && \
    npm list tailwindcss && \
    npm list autoprefixer

# Copy project sources (includes optional environment file)
COPY . .
# Create .env if missing to prevent build failures
RUN if [ -f "$ENV_FILE" ]; then cp "$ENV_FILE" .env; else echo "No $ENV_FILE provided" && touch .env; fi

# Build the application with TailwindCSS v4 and LightningCSS support
ENV PATH=/app/node_modules/.bin:$PATH
ENV LIGHTNINGCSS_CACHE_DIR=/tmp/lightningcss-cache
ENV NEXT_PRIVATE_STANDALONE=true

# Create cache directory and build with optimizations
RUN mkdir -p /tmp/lightningcss-cache && \
    echo "Starting TailwindCSS v4 build..." && \
    NODE_OPTIONS="--max-old-space-size=8192 --no-warnings" \
    TAILWIND_DISABLE_TOUCH=true \
    NEXT_PRIVATE_ALLOW_STANDALONE=1 \
    npm run build:docker || \
    (echo "Build failed, trying with fallback options..." && \
     NODE_OPTIONS="--max-old-space-size=4096" \
     NEXT_PRIVATE_ALLOW_STANDALONE=1 \
     npm run build)

# Production stage
FROM node:20.17.0-slim AS runner
WORKDIR /app

# Build arguments
ARG BUILD_VERSION=unknown

# Labels for image metadata
LABEL maintainer="CRM Team"
LABEL version="${BUILD_VERSION}"
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