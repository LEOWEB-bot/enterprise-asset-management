# ==============================================================================
# Enterprise Asset Management (EAM) - Production Multi-Stage Dockerfile
# Stage 1: Build & Compile TypeScript/Vite Assets
# Stage 2: Production Lightweight Node.js Runtime (Unified Backend API + Static Web)
# ==============================================================================

# --- STAGE 1: Build Stage ---
FROM node:22-alpine AS builder

WORKDIR /app

# Install dependencies first for optimal Docker layer caching
COPY package*.json ./
RUN npm install

# Copy entire source code
COPY . .

# Compile TypeScript and generate production bundle in /app/dist
RUN npm run build

# --- STAGE 2: Production Runtime Stage ---
FROM node:22-alpine AS runner

WORKDIR /app

# Set production environment variables
ENV NODE_ENV=production
ENV VITE_BACKEND_PORT=3001

# Install only production dependencies
COPY package*.json ./
RUN npm install --omit=dev

# Copy compiled static assets and server codebase from builder stage
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server ./server
COPY --from=builder /app/data ./data
COPY --from=builder /app/types ./types
COPY --from=builder /app/utils ./utils
COPY --from=builder /app/tsconfig.json ./tsconfig.json

# Expose backend API & web port
EXPOSE 3001

# Persistent storage volume for database and backup files
VOLUME ["/app/data"]

# Healthcheck to verify server response
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -q -O /dev/null http://127.0.0.1:3001/api/status || exit 1

# Start the unified enterprise server
CMD ["npm", "run", "start"]
