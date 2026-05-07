# BluePrint Projek: FlowSnap (BukuAkaun)

## 1. Ringkasan Projek
FlowSnap (BukuAkaun) adalah aplikasi pengurusan aliran tunai (cash flow) mudah alih yang direka dengan estetika moden. Ia membolehkan pengguna menguruskan pelbagai "Buku Akaun" dan "Checklist Bayaran" bulanan dengan penyelarasan automatik.

## 2. Tech Stack Utama
- **Framework**: Next.js 15 (App Router)
- **Bahasa**: TypeScript
- **Styling**: Tailwind CSS + Shadcn UI
- **Ikon**: Lucide React
- **Persistence (Fasa Pembangunan)**: LocalStorage
- **Persistence (Fasa Produksi/NAS)**: Prisma + SQLite

## 3. Strategi Multi-User & Hybrid Auth
Sistem ini direka untuk menyokong sekumpulan kecil pengguna (Small Circle) dengan kawalan data yang selamat.

### A. Identiti (Firebase Auth)
- Digunakan untuk Login/Signup dan pengurusan sesi.
- **Kelebihan**: Keselamatan terjamin tanpa perlu menguruskan pangkalan data kata laluan secara manual.
- **Keperluan**: Memerlukan internet untuk proses pengesahan identiti.

### B. Penyimpanan Data (Prisma + SQLite di TrueNAS)
- Semua data kewangan disimpan secara lokal di dalam server anda.
- **Isolasi Data**: Setiap meja (`Book`, `Transaction`, `Checklist`) mempunyai kolum `userId` (ID dari Firebase).
- **Logik Query**: `db.transaction.findMany({ where: { userId: currentUserId } })` memastikan user hanya melihat data milik mereka sendiri.

## 4. Kamus Teknikal (Rujukan Self-Hosting)

### A. Database (Peti Simpanan Data)
1. **SQLite (Pilihan Utama NAS)**:
   - Simpan data dalam satu fail `.db`.
   - Sangat mudah untuk TrueNAS: Cuma simpan fail dalam dataset yang anda mount ke Docker.
   - Ideal untuk kegunaan "Small Circle" (1-20 pengguna).
2. **PostgreSQL (Pilihan Korporat)**:
   - Berjalan sebagai database server berasingan.
   - Sesuai jika aplikasi berkembang kepada ribuan pengguna.

### B. Prisma (The Smart Bridge / ORM)
Bertindak sebagai "penterjemah" antara kod TypeScript dan database.
- Jika mahu pindah dari SQLite ke PostgreSQL, hanya perlu tukar `provider` dalam fail `schema.prisma`.

## 5. Logik Sistem Utama
- **Hubungan Checklist & Buku**: Apabila item ditanda bayar, `transactionId` akan dicipta dalam database SQLite untuk rujukan silang.
- **Monthly Override**: Menggunakan `excludedMonths` untuk fleksibiliti paparan bulanan.

## 6. Strategi Deployment ke TrueNAS Scale
- Jalankan aplikasi sebagai **Docker Container**.
- Gunakan **Persistent Volume** untuk fail `database.db` supaya data tidak hilang apabila container di-restart.
- Set `DATABASE_URL` dalam environment variables mengikut laluan fail tersebut.
