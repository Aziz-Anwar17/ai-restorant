# Deploy AI Restorant ke VPS (full processing)

> ⚠️ **Sebelum deploy:** ganti semua `YOUR_DOMAIN.com` di `Caddyfile`,
> file ini, dan `scripts/deploy-vps.sh` dengan domain asli yang sudah Anda
> beli — Caddy akan gagal mengambil sertifikat TLS untuk placeholder.

Vercel hanya menyajikan UI — pemrosesan video (ffmpeg/whisper/yt-dlp) butuh
server sungguhan. Stack ini men-deploy **semuanya** dalam Docker: Next.js +
pipeline + Caddy (SSL otomatis).

## Kebutuhan VPS

- Ubuntu 22.04+/Debian 12, **minimal 4 GB RAM** (whisper + ffmpeg), 40 GB disk
- Contoh yang cukup: Hetzner CX32 (~€7/bln), Contabo VPS S, DO Basic 4GB
- Akses SSH root (atau user dengan docker)

## Langkah

1. **Siapkan secrets** (sekali):
   ```bash
   cp .env.production.example .env.production
   # isi ANTHROPIC_API_KEY, NEXT_PUBLIC_FIREBASE_*, YOUTUBE_*
   ```
   Nilai yang sekarang dipakai lokal ada di `.env.local`.

2. **Deploy** (idempotent — jalankan lagi untuk update):
   ```bash
   ./scripts/deploy-vps.sh root@IP_VPS_ANDA
   ```
   Script ini: pasang Docker → clone/pull repo → upload `.env.production` →
   `docker compose up -d --build` → tunggu `/api/health` hijau.

3. **Arahkan DNS** di Cloudflare (YOUR_DOMAIN.com):
   - `A @ → IP_VPS` (DNS only)
   - `A www → IP_VPS` (DNS only)
   - Hapus/timpa record yang menunjuk Vercel (76.76.21.21 / cname.vercel-dns.com)
   - Caddy otomatis menerbitkan sertifikat Let's Encrypt begitu DNS mengarah.

4. **Verifikasi**: `https://YOUR_DOMAIN.com/api/health` → `"ready": true`.

## Operasional

| Aksi | Perintah (di VPS, `/opt/ai-restorant`) |
|---|---|
| Update ke kode terbaru | jalankan ulang `deploy-vps.sh` dari Mac |
| Log aplikasi | `docker compose logs -f app` |
| Restart | `docker compose restart app` |
| Data (video/klip/DB) | volume `app-data` → `/data` di container |

## Arsitektur

```
Internet → Caddy (:80/:443, SSL otomatis) → app (Next.js :3789)
                                              ├─ ffmpeg + libass
                                              ├─ whisper.cpp (ggml-small)
                                              ├─ yt-dlp
                                              └─ SQLite + storage → volume /data
```

Catatan: image build whisper.cpp dari source (stage terpisah) dan mengunduh
model ggml-small (~466 MB) saat build — build pertama ±10 menit.
