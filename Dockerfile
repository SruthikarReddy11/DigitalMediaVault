# Production Dockerfile for Backend on Hugging Face Spaces
FROM node:20-alpine AS builder
RUN apk add --no-cache openssl python3 py3-pip

WORKDIR /app

# Copy package manifests & prisma schema first for aggressive layer caching
COPY backend/package*.json ./
COPY backend/prisma ./prisma/

RUN npm install

# Copy entire backend source
COPY backend/ ./

RUN npm run build

# Runner stage
FROM node:20-alpine AS runner
RUN apk add --no-cache openssl python3 py3-pip ffmpeg && \
    (apk add --no-cache yt-dlp || pip install --no-cache-dir --break-system-packages yt-dlp || true)

# Create non-root user (UID 1000) required by Hugging Face Spaces
RUN adduser -D -u 1000 appuser

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=7860

COPY backend/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/bin ./bin

# Set file permissions for Hugging Face appuser
RUN chown -R appuser:appuser /app

USER appuser

EXPOSE 7860

CMD ["sh", "-c", "npx prisma db push && node dist/index.js"]
