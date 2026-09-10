# Production Dockerfile for Backend
FROM node:20-alpine AS builder
RUN apk add --no-cache openssl python3 py3-pip

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/

RUN npm install

COPY . .

RUN npm run build

FROM node:20-alpine AS runner
RUN apk add --no-cache openssl python3 py3-pip ffmpeg && \
    (apk add --no-cache yt-dlp || pip install --no-cache-dir --break-system-packages yt-dlp || true)

WORKDIR /app

ENV NODE_ENV=production

COPY package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/bin ./bin

EXPOSE 5000

CMD ["sh", "-c", "npx prisma db push && node dist/index.js"]
