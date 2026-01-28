# Backend Dockerfile for Cloud Run / Container Deployment
FROM node:18-bullseye-slim AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies (include dev for build)
RUN npm ci

# Copy source code
COPY . .

# Build app
RUN npm run build

# Production image
FROM node:18-bullseye-slim

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install production dependencies only
RUN npm ci --omit=dev

# Install OpenSSL for Prisma engine compatibility
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

# Copy build output
COPY --from=builder /app/dist ./dist

# Generate Prisma Client
RUN npx prisma generate

# Expose port (Cloud Run uses 8080)
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8080/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start application
CMD ["npm", "run", "start:prod"]
