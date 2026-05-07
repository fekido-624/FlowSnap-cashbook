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

## 3. Kamus Teknikal (Untuk Rujukan Self-Hosting)

### A. Database (Peti Simpanan Data)
1. **SQLite (The "Lightweight" Choice)**:
   - Simpan data dalam satu fail `.db` sahaja.
   - Sangat mudah untuk TrueNAS: Cuma simpan fail dalam dataset yang anda mount ke Docker.
   - Sesuai untuk kegunaan peribadi atau 1-10 pengguna.
2. **PostgreSQL (The "Pro" Choice)**:
   - Berjalan sebagai database server (Docker container berasingan).
   - Perlukan port mapping (cth: 5432) dan username/password.
   - Sangat stabil untuk data besar dan akses berbilang pengguna yang tinggi.

### B. Prisma (The Smart Bridge / ORM)
Prisma bertindak sebagai "pemandu" antara kod Next.js dan database.
- **Penterjemah**: Ia menukar kod TypeScript anda kepada bahasa SQL secara automatik.
- **Migrasi Mudah**: Untuk pindah dari SQLite ke PostgreSQL, anda hanya perlu tukar `provider = "sqlite"` kepada `provider = "postgresql"` dalam fail `schema.prisma`.
- **Kod UI Selamat**: Kod paparan anda tidak akan berubah langsung walaupun anda tukar database di belakang tabir.

## 4. Seni Bina Data (Data Models)

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

## 5. Logik Sistem Utama

### A. Hubungan Checklist & Buku Akaun (Decoupled History)
Apabila item di-*tick*:
1. Transaksi 'out' dicipta dalam Buku Akaun.
2. `transactionId` disimpan dalam checklist item untuk rujukan silang.

### B. Pengurusan Bulanan (Monthly Override)
- Menggunakan `excludedMonths: string[]` (format YYYY-MM) untuk menyembunyikan item pada bulan tertentu tanpa memadamnya secara kekal dari pangkalan data.

## 6. Strategi Responsive UI
- Penggunaan sidebar tetap pada desktop dan bottom nav pada mobile.
- Grid sistem dinamik (1 kolum mobile, 3 kolum desktop).
- Penggunaan `line-clamp-2` pada tajuk kad untuk mengelakkan teks terpotong secara hodoh sambil mengekalkan keseragaman saiz kad.
