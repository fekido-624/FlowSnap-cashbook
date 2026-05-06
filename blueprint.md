# BluePrint Projek: FlowSnap (BukuAkaun)

## 1. Ringkasan Projek
FlowSnap (BukuAkaun) adalah aplikasi pengurusan aliran tunai (cash flow) mudah alih yang direka dengan estetika moden. Ia membolehkan pengguna menguruskan pelbagai "Buku Akaun" dan "Checklist Bayaran" bulanan dengan penyelarasan automatik.

## 2. Tech Stack
- **Framework**: Next.js 15 (App Router)
- **Bahasa**: TypeScript
- **Styling**: Tailwind CSS + Shadcn UI
- **Ikon**: Lucide React
- **Persistence**: LocalStorage (Mock DB implementation dalam `src/lib/services/db.ts`)
- **State Management**: React Hooks (useState, useEffect, useMemo) & Context API (AuthContext)

## 3. Seni Bina Data (Data Models)

### A. Book (Buku Akaun)
- `id`: string
- `name`: string
- `userId`: string
- `netBalance`: number (Baki bersih)
- `totalCashIn`: number
- `totalCashOut`: number
- `customCategories`: string[] (Senarai kategori unik bagi setiap buku)

### B. Transaction (Transaksi)
- `id`: string
- `bookId`: string
- `type`: 'in' | 'out'
- `amount`: number
- `method`: 'Cash' | 'Online'
- `category`: string
- `description`: string (optional)
- `runningBalance`: number (Baki selepas transaksi ini direkod)

### C. Checklist (Senarai Bayaran)
- `id`: string
- `name`: string
- `bookId`: string (Pautan ke Buku Akaun untuk auto-deduction)
- `items`: ChecklistItem[]

### D. ChecklistItem
- `id`: string
- `name`: string
- `amount`: number
- `payments`: Map<monthKey, { isPaid: boolean, transactionId: string }>
- `validUntil`: string (Format YYYY-MM untuk tempoh aktif)
- `excludedMonths`: string[] (Senarai bulan di mana item ini disembunyikan/dibatalkan)

## 4. Logik Sistem Utama

### A. Hubungan Checklist & Buku Akaun
Apabila pengguna menanda (*tick*) item dalam Checklist yang telah dipautkan ke sebuah Buku Akaun:
1. Sistem secara automatik memanggil fungsi `addTransaction`.
2. Satu transaksi 'out' dicipta dalam Buku Akaun berkaitan.
3. `transactionId` disimpan dalam data item checklist untuk rujukan silang.
4. Jika item di-*untick*, transaksi asal akan dipadamkan secara automatik.

### B. Pengurusan Bulanan (Monthly Override)
- Sistem menggunakan `Carousel` untuk navigasi bulan ke bulan.
- **Pengecualian**: Jika item dipadam pada bulan tertentu, ID bulan tersebut (YYYY-MM) disimpan dalam `excludedMonths`. Item tidak akan dipadam dari pangkalan data, cuma tidak dipaparkan pada bulan tersebut.

### C. Pengiraan Analisis
- Tab Analisis mengira pecahan perbelanjaan secara dinamik menggunakan `useMemo`.
- Pengiraan menggunakan pembulatan 2 tempat perpuluhan untuk memastikan ketepatan jumlah (Sum of Categories == Total Expense).

## 5. Aliran Fail (File Structure)
- `src/lib/services/db.ts`: Pusat logik CRUD dan simulasi pangkalan data.
- `src/lib/contexts/auth-context.tsx`: Pengurusan sesi pengguna (Mock Auth).
- `src/app/books/[id]/page.tsx`: Halaman utama pengurusan transaksi dan analisis.
- `src/app/checklists/[id]/page.tsx`: Logik pengurusan komitmen bulanan dan swipe navigasi.
- `src/components/TransactionModal.tsx`: Borang kemasukan data yang dikongsi antara Buku dan Checklist.

## 6. Polisi Pemadaman
1. **Padam Buku**: Memutuskan pautan (*un-link*) semua checklist berkaitan dan menukar semua status item kepada *un-paid*.
2. **Padam Item Checklist**: Sejarah transaksi dalam Buku Akaun **kekal selamat** (decoupled) untuk mengelakkan kehilangan rekod kewangan lampau.
