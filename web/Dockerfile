# Multi-stage build for sGate Web Dashboard
FROM node:20-alpine AS base

# Install system dependencies
RUN apk add --no-cache \
    libc6-compat \
    curl \
    tini

# Set working directory
WORKDIR /app

# Copy package files for dependency resolution
COPY package*.json ./
COPY packages/shared/package.json ./packages/shared/
COPY web/package.json ./web/

# Development stage
FROM base AS development

# Install all dependencies (including dev dependencies)
RUN npm ci

# Copy source code
COPY packages/shared ./packages/shared
COPY web ./web

# Build shared package first
RUN cd packages/shared && npm run build

# Expose port
EXPOSE 3000

# Start in development mode
WORKDIR /app/web
CMD ["npm", "run", "dev"]

# Production build stage
FROM base AS builder

# Install all dependencies (including dev dependencies for build)
RUN npm ci

# Copy source code
COPY packages/shared ./packages/shared
COPY web ./web

# Build shared package and web app
RUN cd packages/shared && npm run build
RUN cd web && npm run build

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
COPY --from=builder --chown=sgate:nodejs /app/web/.next/standalone ./web/
COPY --from=builder --chown=sgate:nodejs /app/web/.next/static ./web/.next/static
COPY --from=builder --chown=sgate:nodejs /app/web/public ./web/public
COPY --from=builder --chown=sgate:nodejs /app/web/package.json ./web/

# Set correct permissions
RUN chown -R sgate:nodejs /app

# Switch to non-root user
USER sgate

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:3000 || exit 1

# Set environment
ENV NODE_ENV=production
ENV PORT=3000

# Use tini as init system
ENTRYPOINT ["tini", "--"]

# Start the application
CMD ["node", "web/server.js"]