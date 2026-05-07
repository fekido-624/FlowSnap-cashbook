# BukuAkaun - Pengurusan Aliran Tunai Bijak

Aplikasi pengurusan aliran tunai (cash flow) yang moden, ringan, dan fokus kepada peranti mudah alih dengan sokongan penuh untuk paparan Web (Desktop). Dibina dengan Next.js 15, Tailwind CSS, dan Shadcn UI.

## Ciri-Ciri Utama
- **Dashboard Global**: Gambaran keseluruhan baki, pendapatan, dan perbelanjaan dari semua buku.
- **Buku Akaun**: Urus berbilang buku akaun untuk tujuan berbeza (Bisnes, Rumah, Personal).
- **Checklist Bayaran**: Pantau komitmen bulanan dengan sistem "Monthly Override".
- **Responsive UI**: Pengalaman pengguna yang lancar pada Mobile (Bottom Nav) dan Desktop (Sidebar).
- **Multi-User Ready**: Direka untuk menyokong pengasingan data antara pengguna menggunakan Firebase Auth.

## Arahan Push ke Git (Panduan Langkah Demi Langkah)

Ikuti langkah ini untuk menghantar projek ke GitHub/GitLab anda:

1. **Setup Git Lokal** (Hanya buat sekali sahaja):
   ```bash
   git init
   ```
2. **Tambah Fail ke "Kotak"**:
   ```bash
   git add .
   ```
3. **Kunci "Kotak" dengan Nota**:
   ```bash
   git commit -m "Update: Sistem Responsif, Dashboard, dan Navigasi baru"
   ```
4. **Sambungkan & Hantar (Push)**:
   *(Ganti `<url-repo-anda>` dengan link repository kosong dari GitHub/GitLab anda)*
   ```bash
   git branch -M main
   git remote add origin <url-repo-anda>
   git push -u origin main
   ```

## Nota Pembangunan
Aplikasi ini sedang menggunakan `LocalStorage` untuk penyimpanan data dalam fasa prototaip. Pelan seterusnya adalah migrasi ke **Prisma + SQLite** dengan **Firebase Auth** untuk deployment ke NAS (TrueNAS Scale). Lihat `blueprint.md` untuk perincian teknikal.
