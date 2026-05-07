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
  - Fasa 2: Firebase Firestore (Cadangan Utama untuk Real-time & Multi-user)
  - Fasa 3: Prisma + PostgreSQL (Pilihan jika mahu self-host sepenuhnya di server peribadi/TrueNAS Scale)

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

### A. Perubahan Layout (Container)
Tukar `max-w-md` kepada `max-w-7xl` pada skrin besar menggunakan Tailwind:
```tsx
<div className="max-w-md md:max-w-7xl mx-auto px-4">
```

### B. Grid & Column
Gunakan sistem grid untuk paparan bersebelahan pada desktop:
- Mobile: 1 kolum
- Desktop: 2 atau 3 kolum menggunakan `grid-cols-1 md:grid-cols-3`.

### C. Navigasi
- Mobile: Bottom Nav (`md:hidden`)
- Desktop: Sidebar Tetap (`hidden md:flex`)

## 6. Database Roadmap & Keputusan
- **Keputusan**: Buat masa ini, aplikasi akan kekal menggunakan **Firebase Firestore** untuk fasa pembangunan dalam Firebase Studio.
- **Sebab**: Integrasi 'serverless', keupayaan real-time, dan alatan AI yang dioptimumkan untuk Firebase dalam persekitaran ini.
- **Masa Depan**: Kod disusun secara 'service-based' (dalam `src/lib/services/db.ts`) bagi memudahkan migrasi ke **Prisma/SQL** jika user mahu hoskan sendiri di server TrueNAS Scale pada masa hadapan.
