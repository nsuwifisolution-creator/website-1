# 🚀 Indotel - Internet Service Provider Platform

Platform lengkap untuk perusahaan layanan internet (ISP) dengan:
- 🌐 Website utama (Laravel)
- 🔧 REST API (Node.js + Express)
- 📊 Admin Panel (Filament)
- 🐳 Docker deployment
- 💾 SQLite Database

## 📁 Struktur
- `indotel-api/` — Node.js REST API
- `indotel-web/` — Laravel website + Filament admin
- `public-html/` — Static HTML demo
- `nginx/` — Reverse proxy config
- `docs/` — Dokumentasi

## 🚀 Quick Start

```bash
# Clone repo
git clone <your-repo-url>
cd indotel

# Copy env files
cp .env.example .env
cp indotel-api/.env.example indotel-api/.env
cp indotel-web/.env.example indotel-web/.env

# Edit .env sesuai kebutuhan

# Jalankan dengan Docker
docker-compose up -d --build

# Seed database
docker-compose exec api npm run seed
