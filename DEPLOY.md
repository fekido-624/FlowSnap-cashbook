# FlowSnap — Deployment Guide untuk TrueNAS Scale

Panduan deploy app guna **Docker Compose** atas TrueNAS Scale (Electric Eel / Fangtooth +). Build atas NAS, expose ke reverse proxy untuk HTTPS.

## Prasyarat

- TrueNAS Scale **24.10 (Electric Eel)** atau lebih tinggi
  - Check: TrueNAS UI → top-right profile icon → **About** / **System Info**
  - Versi lama (Dragonfish / Cobia) guna Kubernetes, panduan ni tak applicable
- Reverse proxy dah running (Nginx Proxy Manager / Caddy / Traefik) untuk HTTPS
- Domain / sub-domain dah point ke IP NAS (cth: `flowsnap.mynas.com`)
- SSH access ke NAS (atau access dataset via SMB/NFS)

## 1. Siapkan dataset untuk data

Dalam TrueNAS UI:

1. **Datasets** → pilih pool kau (cth `tank`) → **Add Dataset**
2. Nama: `apps/flowsnap` (atau ikut convention kau)
3. Properties default OK. Pastikan **Snapshots** enable kalau nak backup automatic.
4. Note full path — biasanya `/mnt/tank/apps/flowsnap`

Buat sub-folder `data` untuk SQLite file:

```bash
mkdir -p /mnt/tank/apps/flowsnap/data
chown -R 1001:1001 /mnt/tank/apps/flowsnap/data
```

(UID 1001 = user `nextjs` dalam container.)

## 2. Upload code ke NAS

**Option A: git clone (kalau dah push ke GitHub)**

```bash
cd /mnt/tank/apps/flowsnap
git clone https://github.com/yourname/FlowSnap-cashbook.git app
cd app
```

**Option B: SCP / rsync dari local**

```bash
# Dari PC kau
rsync -avz --exclude node_modules --exclude .next \
  ./FlowSnap-cashbook/ user@nas.local:/mnt/tank/apps/flowsnap/app/
```

## 3. Setup .env

Atas NAS, dalam folder app:

```bash
cd /mnt/tank/apps/flowsnap/app
cp .env.production.example .env
nano .env
```

Tukar `ADMIN_PASSWORD` ke sesuatu yang kuat. Ni admin account pertama untuk app.

## 4. Update docker-compose.yml — bind mount

Edit `docker-compose.yml`, tukar named volume kepada bind mount ke dataset:

```yaml
volumes:
  flowsnap-data:
    driver: local
    driver_opts:
      type: none
      o: bind
      device: /mnt/tank/apps/flowsnap/data
```

(Uncomment bahagian bawah file yang dah ada template.)

## 5. Build & Run

Dalam TrueNAS, ada 2 cara:

### Cara A: Via TrueNAS Apps UI (Recommended)

1. **Apps** → **Discover Apps** → klik **Custom App** (atas right)
2. Application name: `flowsnap-cashbook`
3. Compose YAML: copy-paste isi `docker-compose.yml` (yang dah edit volume tu)
4. **Install**

TrueNAS akan auto-build image atas NAS dan run.

### Cara B: SSH + docker compose

```bash
cd /mnt/tank/apps/flowsnap/app
docker compose up -d --build
```

Check logs:

```bash
docker compose logs -f flowsnap
```

Container akan run `prisma db push` automatic untuk create tables masa first start.

## 6. Setup Reverse Proxy

Tambah host baru dalam reverse proxy kau (cth Nginx Proxy Manager):

- **Domain**: `flowsnap.mynas.com`
- **Forward Hostname/IP**: `<IP_NAS>` (atau `flowsnap-cashbook` kalau proxy dalam same docker network)
- **Forward Port**: `9002`
- **Block Common Exploits**: ✅
- **Websockets Support**: ✅ (untuk Next.js dev HMR — optional di prod)
- **SSL**: request Let's Encrypt cert untuk domain tu

## 7. First Login

1. Buka `https://flowsnap.mynas.com`
2. Login dengan admin credentials dari `.env`
3. Masuk **Profil** → tukar password admin dengan yang baru
4. User baru akan signup → status pending → admin approve di **Pengurusan Pengguna**

---

## Update / Redeploy

```bash
cd /mnt/tank/apps/flowsnap/app
git pull   # atau rsync update
docker compose up -d --build
```

`prisma db push` akan sync schema kalau ada perubahan, tanpa hilang data sedia ada.

## Backup

**Cara 1: TrueNAS Snapshot (recommended)**
- Setup periodic snapshot atas dataset `apps/flowsnap/data` — automatic & efficient.

**Cara 2: User-level (dalam app)**
- Setiap user boleh export backup mereka sendiri via **Profil → Export Backup**.

**Cara 3: Copy file SQLite**
```bash
cp /mnt/tank/apps/flowsnap/data/flowsnap.db /backup/location/flowsnap-$(date +%Y%m%d).db
```

## Troubleshooting

**Container restart loop**
```bash
docker compose logs flowsnap
```
Common: `EACCES` pada `/app/data` → permission salah, run `chown -R 1001:1001 /mnt/tank/apps/flowsnap/data`.

**Prisma error pasal binary**
Image guna `linux-musl-openssl-3.0.x` binary (Alpine). Kalau ada error pasal binary, pastikan `prisma/schema.prisma` ada `binaryTargets = ["native", "linux-musl-openssl-3.0.x"]`.

**Port 9002 conflict**
Tukar host port dalam compose: `- "9100:9002"` — sekarang accessible via port 9100 atas host.

**Reset semua data (start fresh)**
```bash
docker compose down
rm -rf /mnt/tank/apps/flowsnap/data/*
docker compose up -d --build
```

---

## Security checklist sebelum buka ke public

⚠️ Reminder: app ni masih ada beberapa security gap (lihat `memory/project_flowsnap_security_gaps.md`):

1. **Password disimpan plaintext dalam localStorage** browser. Jangan share device dengan orang lain.
2. **API `/api/db` tiada auth check** — sesiapa boleh hantar request guna `userId` orang lain. Kalau expose ke public, fix dulu (tambah session token verification).
3. **Polling 1 saat per subscription** — battery drain atas mobile. Consider migrate ke SWR / SSE bila scale.

Untuk small circle / LAN je, risiko rendah. Untuk expose ke public, **fix #2 dulu**.
