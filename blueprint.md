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
- **Authentication**: Firebase Auth (Hybrid Cloud Model)

## 3. Strategi Multi-User & Hybrid Auth
Sistem ini direka untuk menyokong sekumpulan kecil pengguna (Small Circle) dengan kawalan data yang selamat dan kos efektif.

### A. Identiti (Firebase Auth)
- Menguruskan Login, Signup, dan Sesi.
- **Kelebihan**: Keselamatan tahap industri tanpa perlu menguruskan pangkalan data kata laluan secara manual.
- **Keperluan**: Memerlukan internet untuk proses pengesahan (NAS mesti online).

### B. Penyimpanan Data (Prisma + SQLite di TrueNAS)
- Semua data kewangan disimpan secara lokal di dalam server sendiri.
- **Isolasi Data**: Setiap jadual (`Book`, `Transaction`, `Checklist`) mempunyai kolum `userId` (ID unik dari Firebase).
- **Logik Query**: Setiap capaian data akan ditapis secara automatik: `db.transaction.findMany({ where: { userId: currentUserId } })`.

## 4. Kamus Teknikal (Rujukan Pembangunan)

### A. Database (Peti Simpanan Data)
1. **SQLite**: 
   - Ringan, disimpan sebagai satu fail `.db` dalam folder projek.
   - Sangat mudah untuk TrueNAS: Cuma perlu mount fail tersebut ke Docker Volume.
   - Sesuai untuk kegunaan "Small Circle".
2. **PostgreSQL**:
   - Database server berasingan (Postgres Docker).
   - Boleh dinaiktaraf dari SQLite menggunakan Prisma Migration jika perlu di masa depan.

### B. Prisma (The Smart Bridge / ORM)
Bertindak sebagai "penterjemah" antara kod TypeScript dan database. 
- Memudahkan pertukaran antara SQLite dan PostgreSQL tanpa rombakan kod besar.
- Menjamin *Type-Safety* semasa pembangunan.

## 5. Strategi Deployment ke TrueNAS Scale
- Jalankan aplikasi sebagai **Docker Container**.
- Gunakan **Persistent Volume** untuk fail `database.db` supaya data tidak hilang apabila container di-restart.
- Set `DATABASE_URL` dan `FIREBASE_CONFIG` dalam environment variables.
