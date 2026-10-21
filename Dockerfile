# ==============================================================================
# Multi-stage Dockerfile for Issue Management React Frontend
# ==============================================================================

# Stage 1: Build the React application
FROM node:22-alpine AS builder
WORKDIR /app

# Copy dependency definitions and install cleanly
COPY package*.json ./
RUN npm ci

# Copy source code and build production distribution
COPY . .
RUN npm run build

# Stage 2: Serve static production assets with Nginx
FROM nginx:1.27-alpine
WORKDIR /usr/share/nginx/html

# Remove default nginx welcome page
RUN rm -rf ./*

# Copy built artifacts from builder stage
COPY --from=builder /app/dist ./

# Copy optimized production nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

# Healthcheck probe for frontend container
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost/healthz || exit 1

CMD ["nginx", "-g", "daemon off;"]
