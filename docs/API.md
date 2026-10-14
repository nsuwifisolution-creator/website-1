# 📡 Indotel API Documentation

**Base URL:** `http://localhost/api` (via Nginx) atau `http://localhost:3000/api` (direct)

**Version:** 1.0.0

---

## 🔐 Authentication

API menggunakan **JWT (JSON Web Token)** untuk autentikasi. Setelah login, sertakan token di header:

```http
Authorization: Bearer <your_token_here>
