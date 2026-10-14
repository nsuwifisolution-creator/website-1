# 🚀 Indotel Deployment Guide

Panduan lengkap untuk deploy aplikasi Indotel (Node.js API + Laravel + SQLite) ke production.

**Versi:** 1.0.0  
**Last Updated:** 14 Oktober 2025

---

## 📑 Table of Contents

1. [Prasyarat](#-prasyarat)
2. [Arsitektur](#️-arsitektur)
3. [Quick Start (Development)](#-quick-start-development)
4. [Production Deployment](#-production-deployment)
5. [HTTPS dengan Let's Encrypt](#-https-dengan-lets-encrypt)
6. [Monitoring](#-monitoring)
7. [Backup & Restore](#-backup--restore)
8. [Update & Maintenance](#-update--maintenance)
9. [Performance Tuning](#-performance-tuning)
10. [Troubleshooting](#-troubleshooting)
11. [Security Checklist](#-security-checklist)

---

## 📋 Prasyarat

### Software Requirements

| Software | Minimum Version | Cek Command |
|----------|-----------------|-------------|
| Docker | 24.0+ | `docker --version` |
| Docker Compose | 2.20+ | `docker compose version` |
| Git | 2.40+ | `git --version` |
| OpenSSL | 3.0+ | `openssl version` |

### System Requirements

**Minimum (untuk 100-500 pelanggan):**
- CPU: 2 vCPU
- RAM: 4 GB
- Disk: 20 GB SSD
- Bandwidth: 10 Mbps

**Recommended (untuk 500-5000 pelanggan):**
- CPU: 4 vCPU
- RAM: 8 GB
- Disk: 50 GB SSD
- Bandwidth: 100 Mbps

### OS Support

- ✅ Ubuntu 22.04 / 24.04 LTS
- ✅ Debian 11 / 12
- ✅ CentOS 8+ / Rocky Linux 9
- ✅ macOS (untuk development)
- ⚠️  Windows (via WSL2)

---

## 🏗️ Arsitektur

### Diagram Sistem
