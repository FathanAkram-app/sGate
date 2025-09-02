FROM node:18-alpine

# Install build dependencies and PostgreSQL client
RUN apk add --no-cache python3 make g++ postgresql-client

# Set working directory
WORKDIR /app

# Copy package files first for better caching
COPY package.json ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/api/package.json ./apps/api/
COPY web/package.json ./web/

# Install dependencies
RUN npm install

# Copy source code
COPY packages/ ./packages/
COPY apps/ ./apps/
COPY web/ ./web/

# Build shared package first
RUN cd packages/shared && npm run build

# Build API
RUN cd apps/api && npm run build

# Build web app
RUN cd web && npm run build

# Expose ports
EXPOSE 3000 4000

# Default command - can be overridden in docker-compose
CMD ["npm", "run", "start"]