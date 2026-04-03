# 🌳 Dulumina Family Tree

Visualisasikan warisan dan sejarah keluarga Anda dalam satu platform yang modern, interaktif, dan mudah digunakan.

[![Status](https://img.shields.io/badge/Status-Development-green?style=flat-square)](#)
[![Stack](https://img.shields.io/badge/Stack-React_|_Node.js_|_SQLite-blue?style=flat-square)](#)

---

## ✨ Fitur Utama

-   **🎯 Visualisasi Dinamis**: Tampilan silsilah keluarga yang interaktif dengan fitur zoom dan pan.
-   **👥 Manajemen Anggota**: Tambahkan detail lengkap mulai dari foto, tempat & tanggal lahir, hingga data wafat.
-   **☪️ Panel Mahrom**: Cek otomatis status mahrom antar anggota keluarga secara instan.
-   **🔐 Role-Based Access**: Sistem login dengan tingkatan akses (Admin, Editor, dan Viewer).
-   **📱 Mobile Friendly**: Antarmuka premium yang responsif untuk penggunaan di HP maupun Desktop.
-   **💾 Ekspor Data**: Fitur ekspor data keluarga ke format JSON atau gambar (SVG).

## 🚀 Teknologi

Dibangun dengan teknologi modern untuk performa dan kemudahan maintenance:

-   **Frontend**: React + Vite, CSS Modern (Glassmorphism), D3.js / Topola.
-   **Backend**: Node.js + Express.
-   **Database**: SQLite (better-sqlite3) — ringan & tanpa setup rumit.
-   **Auth**: JSON Web Token (JWT) & Bcrypt.

## 🛠️ Persiapan Cepat

```bash
# 1. Clone repositori
git clone https://github.com/dulumina/family-tree.git
cd family-tree

# 2. Setup Backend & Database
cd server
npm install
node src/db/migrate.js
npm run dev

# 3. Setup Frontend
cd ../client
npm install
npm run dev
```

Akses aplikasi di: `http://localhost:5173`

## 📁 Struktur Folder

-   `/client`: Source code frontend (React).
-   `/server`: Source code backend & API (Express).
-   `/server/data/family.db`: Database SQLite lokal.

---

Built with ❤️ for Family Heritage.