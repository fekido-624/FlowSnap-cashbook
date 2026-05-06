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
3. **Penting**: Jika item checklist dipadam, rekod dalam Buku Akaun **TIDAK** dipadam secara automatik untuk menjaga integriti sejarah kewangan.

### B. Pengurusan Bulanan (Monthly Override)
- Menggunakan `excludedMonths: string[]` (format YYYY-MM).
- Jika item dipadam pada bulan tertentu, ia masuk ke senarai pengecualian. 
- Jika item sudah bertanda 'paid' pada bulan tersebut, memadam item akan mencetuskan fungsi `deleteTransaction` untuk memulihkan baki buku akaun.

## 5. Strategi Responsive UI (Masa Hadapan)

Untuk menukar aplikasi ini kepada paparan Web (Desktop) yang lebih luas, kita tidak perlu mencipta fail `page.tsx` yang baru. Sebaliknya, kita gunakan teknik **Single Codebase Responsive**:

### A. Perubahan Layout (Container)
Tukar `max-w-md` (had saiz mobile) kepada `max-w-7xl` pada skrin besar menggunakan Tailwind:
```tsx
// Contoh:
<div className="max-w-md md:max-w-7xl mx-auto px-4">
```

### B. Grid & Column
Gunakan sistem grid untuk paparan bersebelahan pada desktop:
```tsx
// Mobile: 1 kolum, Desktop: 3 kolum
<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
  <div className="md:col-span-2">Main Content</div>
  <div className="hidden md:block">Sidebar Analytics</div>
</div>
```

### C. Navigasi
Gunakan `md:hidden` pada *Bottom Nav* dan `hidden md:flex` pada *Sidebar* tetap.

## 6. Polisi Pemadaman
1. **Padam Buku**: Putuskan pautan checklist secara automatik.
2. **Padam Item Checklist**: Transaksi sejarah kekal dalam Buku Akaun (kecuali jika dipadam menggunakan fungsi Monthly Override).
