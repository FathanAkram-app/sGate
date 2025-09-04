# Multi-stage build for sGate API
FROM node:20-alpine AS base

# Install system dependencies
RUN apk add --no-cache \
    postgresql-client \
    curl \
    tini

# Set working directory
WORKDIR /app

# Copy package files for dependency resolution
COPY package*.json ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/api/package.json ./apps/api/

# Development stage
FROM base AS development

# Install all dependencies (including dev dependencies)
RUN npm ci

# Copy source code
COPY packages/shared ./packages/shared
COPY apps/api ./apps/api

# Build shared package first
RUN cd packages/shared && npm run build

# Expose port
EXPOSE 4000

# Start in development mode
CMD ["npm", "--prefix", "apps/api", "run", "start:dev"]

# Production build stage
FROM base AS builder

# Install all dependencies (including dev dependencies for build)
RUN npm ci

# Copy source code
COPY packages/shared ./packages/shared
COPY apps/api ./apps/api

# Build shared package and API
RUN cd packages/shared && npm run build
RUN cd apps/api && npm run build

# Production stage
FROM base AS production

# Create app user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S sgate -u 1001 -G nodejs

# Install production dependencies only
RUN npm ci --only=production && npm cache clean --force

# Copy built application from builder stage
COPY --from=builder --chown=sgate:nodejs /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder --chown=sgate:nodejs /app/packages/shared/package.json ./packages/shared/
COPY --from=builder --chown=sgate:nodejs /app/apps/api/dist ./apps/api/dist
COPY --from=builder --chown=sgate:nodejs /app/apps/api/package.json ./apps/api/

# Create necessary directories
RUN mkdir -p logs tmp && \
    chown -R sgate:nodejs /app

# Switch to non-root user
USER sgate

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:4000/health || exit 1

# Set environment
ENV NODE_ENV=production

# Use tini as init system
ENTRYPOINT ["tini", "--"]

# Start the application
CMD ["node", "apps/api/dist/apps/api/src/main.js"]