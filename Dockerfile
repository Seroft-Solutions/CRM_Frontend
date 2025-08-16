# Build stage
FROM node:20.17.0-alpine AS builder
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install ALL dependencies - no complexity, just install everything
RUN npm install

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage  
FROM node:20.17.0-alpine AS runner
WORKDIR /app

# Copy environment file
COPY .env.production .env

# Create user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy built application
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
ENV PORT=3000 HOSTNAME="0.0.0.0"
CMD ["node", "server.js"]