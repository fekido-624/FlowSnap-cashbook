# BluePrint Projek: FlowSnap (BukuAkaun)

## 1. Ringkasan Projek
FlowSnap (BukuAkaun) adalah aplikasi pengurusan aliran tunai (cash flow) mudah alih yang direka dengan estetika moden. Ia membolehkan pengguna menguruskan pelbagai "Buku Akaun" dan "Checklist Bayaran" bulanan dengan penyelarasan automatik.

## 2. Tech Stack
- **Framework**: Next.js 15 (App Router)
- **Bahasa**: TypeScript
- **Styling**: Tailwind CSS + Shadcn UI
- **Ikon**: Lucide React
- **Persistence**: 
  - Fasa 1: LocalStorage (Semasa - Prototaip Pantas)
  - Fasa 2: Firebase Firestore (Cadangan Utama untuk Real-time & Multi-user dalam Firebase Studio)
  - Fasa 3: **Prisma + SQLite/PostgreSQL** (Pilihan Akhir untuk Self-host di TrueNAS Scale)

## 3. Seni Bina Data (Data Models)

### A. Book (Buku Akaun)
- `id`: string
- `name`: string
- `userId`: string
- `netBalance`: number
- `totalCashIn`: number
- `totalCashOut`: number
- `customCategories`: string[]

### B. Transaction (Transaksi)
- `id`: string
- `bookId`: string
- `type`: 'in' | 'out'
- `amount`: number
- `method`: 'Cash' | 'Online'
- `category`: string
- `description`: string
- `runningBalance`: number

### C. Checklist (Senarai Bayaran)
- `id`: string
- `name`: string
- `bookId`: string
- `items`: ChecklistItem[]

## 4. Logik Sistem Utama

### A. Hubungan Checklist & Buku Akaun (Decoupled History)
Apabila item di-*tick*:
1. Transaksi 'out' dicipta dalam Buku Akaun.
2. `transactionId` disimpan dalam checklist item.

### B. Pengurusan Bulanan (Monthly Override)
- Menggunakan `excludedMonths: string[]` (format YYYY-MM) untuk menyembunyikan item pada bulan tertentu tanpa memadamnya secara kekal.

## 5. Strategi Responsive UI
- Penggunaan sidebar tetap pada desktop dan bottom nav pada mobile.
- Grid sistem dinamik (1 kolum mobile, 3 kolum desktop).

## 6. Database Roadmap & Keputusan (Self-Hosting)
- **Fasa Prototaip**: Menggunakan **Firebase Firestore**. Ini membolehkan pembangunan pantas fungsi real-time dan multi-user di dalam persekitaran Firebase Studio.
- **Fasa Self-Host (TrueNAS Scale)**:
  - **Pilihan A (Mudah)**: **Prisma + SQLite**. Sesuai jika anda tidak mahu install database server. Data disimpan dalam satu fail `.db` di dalam NAS.
  - **Pilihan B (Pro)**: **Prisma + PostgreSQL**. Anda perlu jalankan Docker Container PostgreSQL di TrueNAS. Lebih stabil untuk akses serentak yang tinggi.
- **Strategi Migrasi**: Kod disusun secara 'service-based' (dalam `src/lib/services/db.ts`). Apabila anda sedia untuk berpindah ke NAS, anda hanya perlu menulis semula fungsi dalam fail tersebut untuk menggunakan Prisma Client. UI tidak perlu diubah.
