# ==============================================================================
# Enterprise Asset Management (EAM) - Production Multi-Stage Dockerfile
# Stage 1: Build & Compile TypeScript/Vite Assets
# Stage 2: Production Nginx Lightweight Web Server (< 25MB Image Size)
# ==============================================================================

# --- STAGE 1: Build Stage ---
FROM node:20-alpine AS builder

WORKDIR /app

# Set environment
ENV NODE_ENV=production

# Install dependencies first for better Docker layer caching
COPY package.json ./
RUN npm install

# Copy source files
COPY . .

# Compile TypeScript and build production bundle
RUN npm run build

# --- STAGE 2: Production Runtime Stage ---
FROM nginx:alpine AS runner

# Remove default Nginx website
RUN rm -rf /usr/share/nginx/html/*

# Copy production static assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose HTTP port
EXPOSE 80

# Healthcheck to verify container status
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget -q -O /dev/null http://127.0.0.1:80/ || exit 1

# Run Nginx in foreground
CMD ["nginx", "-g", "daemon off;"]
