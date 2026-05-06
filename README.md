# BukuAkaun - Pengurusan Aliran Tunai Bijak

Aplikasi pengurusan aliran tunai (cash flow) yang moden, ringan, dan fokus kepada peranti mudah alih. Dibina dengan Next.js 15, Tailwind CSS, dan Shadcn UI.

## Ciri-Ciri Utama
- **Buku Akaun**: Urus berbilang buku akaun untuk tujuan berbeza.
- **Checklist Bayaran**: Pantau komitmen bulanan dengan sistem "Monthly Override" (Padam/Pulih mengikut bulan).
- **Analisis**: Lihat pecahan perbelanjaan mengikut kategori secara automatik.
- **Keselamatan Data**: Rekod sejarah kewangan kekal walaupun checklist dipadam.

## Arahan Push ke Git (Terminal)

Jika anda ingin menghantar projek ini ke GitHub/GitLab:

1. **Cipta Repo Baru**: Cipta satu repository kosong di akaun Git anda.
2. **Inisialisasi & Commit**:
   ```bash
   git init
   git add .
   git commit -m "Initial commit: BukuAkaun System"
   ```
3. **Hubungkan & Push**:
   (Ganti URL di bawah dengan URL repo yang anda cipta)
   ```bash
   git remote add origin https://github.com/username/nama-repo.git
   git branch -M main
   git push -u origin main
   ```

## Nota Pembangunan
Aplikasi ini menggunakan `LocalStorage` untuk penyimpanan data dalam fasa prototaip ini bagi memastikan kelajuan dan akses tanpa internet yang optimum. Untuk rujukan teknikal mendalam, lihat fail `blueprint.md`.