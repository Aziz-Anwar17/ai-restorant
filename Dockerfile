# AI Restorant — full processing image
# Next.js app + ffmpeg (libass) + whisper.cpp + yt-dlp in one container.

# ---------- Stage 1: build whisper.cpp ----------
FROM debian:bookworm-slim AS whisper
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential cmake git ca-certificates curl && rm -rf /var/lib/apt/lists/*
RUN git clone --depth 1 https://github.com/ggml-org/whisper.cpp /src \
    && cmake -S /src -B /src/build -DCMAKE_BUILD_TYPE=Release -DBUILD_SHARED_LIBS=OFF \
    && cmake --build /src/build -j"$(nproc)" --target whisper-cli
RUN curl -fL -o /ggml-small.bin \
    https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-small.bin

# ---------- Stage 2: build Next.js ----------
FROM node:22-bookworm-slim AS web
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
# NEXT_PUBLIC_* values are inlined into the client bundle at build time
ARG NEXT_PUBLIC_FIREBASE_API_KEY
ARG NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
ARG NEXT_PUBLIC_FIREBASE_PROJECT_ID
ARG NEXT_PUBLIC_FIREBASE_APP_ID
ENV NEXT_TELEMETRY_DISABLED=1 \
    NEXT_PUBLIC_FIREBASE_API_KEY=$NEXT_PUBLIC_FIREBASE_API_KEY \
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=$NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN \
    NEXT_PUBLIC_FIREBASE_PROJECT_ID=$NEXT_PUBLIC_FIREBASE_PROJECT_ID \
    NEXT_PUBLIC_FIREBASE_APP_ID=$NEXT_PUBLIC_FIREBASE_APP_ID
RUN npm run build

# ---------- Stage 3: runtime ----------
FROM node:22-bookworm-slim
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg python3 curl ca-certificates \
    && rm -rf /var/lib/apt/lists/* \
    && curl -fL -o /usr/local/bin/yt-dlp \
       https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp \
    && chmod +x /usr/local/bin/yt-dlp

COPY --from=whisper /src/build/bin/whisper-cli /usr/local/bin/whisper-cli
COPY --from=whisper /ggml-small.bin /models/ggml-small.bin

WORKDIR /app
COPY --from=web /app/.next ./.next
COPY --from=web /app/node_modules ./node_modules
COPY --from=web /app/package.json ./package.json
COPY --from=web /app/public ./public
COPY --from=web /app/next.config.mjs ./next.config.mjs

# Binary locations inside the container (override .env.local host paths)
ENV NODE_ENV=production \
    WHISPER_CPP_BIN=/usr/local/bin/whisper-cli \
    WHISPER_MODEL=/models/ggml-small.bin \
    FFMPEG_BIN=/usr/bin/ffmpeg \
    FFPROBE_BIN=/usr/bin/ffprobe \
    YTDLP_BIN=/usr/local/bin/yt-dlp \
    STORAGE_DIR=/data \
    PORT=3789

VOLUME /data
EXPOSE 3789
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s \
  CMD curl -fs http://localhost:3789/api/health || exit 1
CMD ["npm", "start"]
