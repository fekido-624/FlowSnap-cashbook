# BukuAkaun - Pengurusan Aliran Tunai Bijak

Aplikasi pengurusan aliran tunai (cash flow) yang moden, ringan, dan fokus kepada peranti mudah alih dengan sokongan penuh untuk paparan Web (Desktop). Dibina dengan Next.js 15, Tailwind CSS, dan Shadcn UI.

## Ciri-Ciri Utama
- **Dashboard Global**: Gambaran keseluruhan baki, pendapatan, dan perbelanjaan dari semua buku.
- **Buku Akaun**: Urus berbilang buku akaun untuk tujuan berbeza (Bisnes, Rumah, Personal).
- **Checklist Bayaran**: Pantau komitmen bulanan dengan sistem "Monthly Override".
- **Responsive UI**: Pengalaman pengguna yang lancar pada Mobile (Bottom Nav) dan Desktop (Sidebar).
- **Multi-User Ready**: Direka untuk menyokong pengasingan data antara pengguna.

## Arahan Push ke Git (Pertama Kali)

Ikuti langkah ini untuk menghantar projek ke GitHub/GitLab:

1. **Cipta Repo Baru**: Cipta satu repository kosong di akaun GitHub/GitLab anda.
2. **Setup Git Lokal**:
   ```bash
   git init
   git add .
   git commit -m "Initial commit: BukuAkaun Responsive System with Hybrid Auth Plan"
   ```
3. **Sambungkan & Push**:
   *(Ganti `<url-repo-anda>` dengan link dari GitHub/GitLab anda)*
   ```bash
   git branch -M main
   git remote add origin <url-repo-anda>
   git push -u origin main
   ```

## Nota Pembangunan
Aplikasi ini sedang menggunakan `LocalStorage` untuk penyimpanan data dalam fasa prototaip. Pelan seterusnya adalah migrasi ke **Prisma + SQLite** dengan **Firebase Auth** untuk deployment ke NAS (TrueNAS Scale). Lihat `blueprint.md` untuk perincian teknikal.
