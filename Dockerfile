# Multi-stage build for PWA React TypeScript
# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Copy only package files first for better layer caching
COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Verify build succeeded
RUN test -d dist || (echo "Build failed - dist directory not found" && exit 1)

# Stage 2: Production image
FROM nginx:alpine

# Security: Run as non-root user
RUN addgroup -S appuser && adduser -S appuser -G appuser

# Remove default nginx config
RUN rm -f /etc/nginx/conf.d/default.conf

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built app from builder
COPY --from=builder --chown=appuser:appuser /app/dist /usr/share/nginx/html

# Copy service worker and other PWA assets
RUN chown -R appuser:appuser /usr/share/nginx/html

# Security: Set proper permissions
RUN chmod -R 755 /usr/share/nginx/html

# Switch to non-root user
USER appuser

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost/ || exit 1

# Expose port
EXPOSE 8080

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
