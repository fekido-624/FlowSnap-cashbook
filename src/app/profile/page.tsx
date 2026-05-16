"use client";

import { useAuth } from "@/lib/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ArrowLeft, User, LogOut, Mail, ShieldCheck, BookOpen, ListChecks, LayoutDashboard, Download, Upload, DatabaseBackup } from "lucide-react";
import { Sidebar } from "@/components/Sidebar";
import { exportUserData, importUserData, BackupPayload } from "@/lib/services/db";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export default function ProfilePage() {
  const { user, loading, logout, changePassword } = useAuth();
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordMessage, setPasswordMessage] = useState("");
  const [isExporting, setIsExporting] = useState(false);
  const [backupError, setBackupError] = useState("");
  const [backupMessage, setBackupMessage] = useState("");
  const [pendingImport, setPendingImport] = useState<BackupPayload | null>(null);
  const [importMode, setImportMode] = useState<"merge" | "replace">("merge");
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  const handleExport = async () => {
    if (!user) return;
    setBackupError("");
    setBackupMessage("");
    setIsExporting(true);
    try {
      const data = await exportUserData(user.uid);
      const enriched = { ...data, exportedBy: user.email || undefined };
      const blob = new Blob([JSON.stringify(enriched, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const date = new Date().toISOString().split("T")[0];
      const safeEmail = (user.email || "user").replace(/[^a-zA-Z0-9]/g, "_");
      a.download = `flowsnap-backup-${safeEmail}-${date}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setBackupMessage(`Backup berjaya: ${data.books.length} buku, ${data.transactions.length} transaksi, ${data.checklists.length} checklist.`);
    } catch (err) {
      setBackupError(err instanceof Error ? err.message : "Ralat semasa export data.");
    } finally {
      setIsExporting(false);
    }
  };

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setBackupError("");
    setBackupMessage("");
    const file = e.target.files?.[0];
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (!file) return;

    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      if (parsed.schemaVersion !== 1 || !Array.isArray(parsed.books) || !Array.isArray(parsed.transactions) || !Array.isArray(parsed.checklists)) {
        throw new Error("Fail backup tidak sah atau versi tidak disokong.");
      }
      setPendingImport(parsed as BackupPayload);
      setImportMode("merge");
    } catch (err) {
      setBackupError(err instanceof Error ? err.message : "Gagal membaca fail backup.");
    }
  };

  const cancelImport = () => {
    if (isImporting) return;
    setPendingImport(null);
    setImportMode("merge");
  };

  const confirmImport = async () => {
    if (!user || !pendingImport) return;
    setBackupError("");
    setBackupMessage("");
    setIsImporting(true);
    try {
      const result = await importUserData(user.uid, pendingImport, importMode);
      setBackupMessage(`Restore berjaya (${importMode === "replace" ? "Ganti" : "Gabung"}): ${result.booksImported} buku, ${result.transactionsImported} transaksi, ${result.checklistsImported} checklist.`);
      setPendingImport(null);
    } catch (err) {
      setBackupError(err instanceof Error ? err.message : "Ralat semasa import data.");
    } finally {
      setIsImporting(false);
    }
  };

  if (loading || !user) return null;

  return (
    <div className="min-h-svh bg-background flex flex-col md:flex-row">
      <Sidebar />

      <main className="flex-1 p-6 md:p-10 pb-32 md:pb-10 max-w-7xl mx-auto w-full">
        {/* Mobile Header */}
        <header className="flex md:hidden items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-2xl font-black">Profil Pengguna</h1>
        </header>

        <div className="max-w-3xl mx-auto space-y-10">
          {/* Profile Header Section */}
          <div className="flex flex-col items-center md:items-start md:flex-row gap-6 md:gap-10">
            <div className="w-32 h-32 bg-primary/10 rounded-[3rem] flex items-center justify-center border-4 border-white shadow-2xl shrink-0">
              <User className="w-16 h-16 text-primary" />
            </div>
            <div className="text-center md:text-left flex flex-col justify-center">
              <h2 className="text-4xl font-black tracking-tight mb-2">{user.email?.split('@')[0]}</h2>
              <div className="flex flex-wrap justify-center md:justify-start gap-2">
                <span className="px-3 py-1 bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest rounded-full">
                  User Mode
                </span>
                <span className="px-3 py-1 bg-muted text-muted-foreground text-[10px] font-black uppercase tracking-widest rounded-full">
                  v1.0.0-PRO
                </span>
              </div>
            </div>
          </div>

          {/* Main Content Card */}
          <Card className="border-none shadow-sm rounded-[3rem] bg-card overflow-hidden">
            <CardContent className="p-8 md:p-12 space-y-10">
              {/* Information Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
                <div className="flex items-center gap-5">
                  <div className="bg-primary/5 p-5 rounded-[1.5rem] shrink-0">
                    <Mail className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest mb-1">Emel Utama</span>
                    <span className="font-bold text-lg truncate">{user.email}</span>
                  </div>
                </div>

                <div className="flex items-center gap-5">
                  <div className="bg-emerald-50 p-5 rounded-[1.5rem] shrink-0">
                    <ShieldCheck className="w-6 h-6 text-emerald-600" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest mb-1">Status Keselamatan</span>
                    <span className="font-bold text-lg text-emerald-600">InsyaAllah</span>
                  </div>
                </div>
              </div>

              {/* Password Update Section */}
              <div className="space-y-6 pt-10 border-t border-dashed">
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm uppercase tracking-widest text-muted-foreground">Kemaskini Kata Laluan</p>
                      <p className="text-sm text-muted-foreground">Pengguna dan admin boleh menukar kata laluan mereka di sini.</p>
                    </div>
                  </div>

                  <div className="grid gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="current-password">Kata Laluan Semasa</Label>
                      <Input
                        id="current-password"
                        type="password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        className="rounded-xl h-12"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="new-password">Kata Laluan Baru</Label>
                      <Input
                        id="new-password"
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="rounded-xl h-12"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirm-password">Sahkan Kata Laluan Baru</Label>
                      <Input
                        id="confirm-password"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="rounded-xl h-12"
                      />
                    </div>
                  </div>

                  {passwordError && <p className="text-sm text-destructive">{passwordError}</p>}
                  {passwordMessage && <p className="text-sm text-emerald-600">{passwordMessage}</p>}

                  <Button
                    variant="secondary"
                    className="w-full h-14 rounded-2xl font-bold"
                    onClick={async () => {
                      setPasswordError("");
                      setPasswordMessage("");

                      if (!currentPassword) {
                        setPasswordError('Sila masukkan kata laluan semasa.');
                        return;
                      }
                      if (newPassword.length < 6) {
                        setPasswordError('Kata laluan baru mesti sekurang-kurangnya 6 aksara.');
                        return;
                      }
                      if (newPassword !== confirmPassword) {
                        setPasswordError('Kata laluan baru dan pengesahan tidak sepadan.');
                        return;
                      }

                      try {
                        await changePassword(currentPassword, newPassword);
                        setPasswordMessage('Kata laluan berjaya dikemaskini.');
                        setCurrentPassword('');
                        setNewPassword('');
                        setConfirmPassword('');
                      } catch (error) {
                        setPasswordError(error instanceof Error ? error.message : 'Ralat semasa mengemaskini kata laluan.');
                      }
                    }}
                  >
                    Kemaskini Kata Laluan
                  </Button>
                </div>
              </div>

              {/* Backup & Restore Section */}
              <div className="space-y-6 pt-10 border-t border-dashed">
                <div className="flex items-center gap-3">
                  <div className="bg-primary/5 p-3 rounded-2xl">
                    <DatabaseBackup className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm uppercase tracking-widest text-muted-foreground">Backup &amp; Pemulihan</p>
                    <p className="text-sm text-muted-foreground">Eksport data ke fail JSON, atau pulihkan dari backup terdahulu.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button
                    variant="outline"
                    className="h-14 rounded-2xl font-bold border-2 flex gap-2"
                    onClick={handleExport}
                    disabled={isExporting}
                  >
                    <Download className="w-5 h-5" />
                    {isExporting ? "Mengeksport..." : "Export Backup"}
                  </Button>
                  <Button
                    variant="outline"
                    className="h-14 rounded-2xl font-bold border-2 flex gap-2"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isImporting}
                  >
                    <Upload className="w-5 h-5" />
                    Import Backup
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="application/json,.json"
                    className="hidden"
                    onChange={handleFileSelected}
                  />
                </div>

                {backupError && <p className="text-sm text-destructive">{backupError}</p>}
                {backupMessage && <p className="text-sm text-emerald-600">{backupMessage}</p>}

                <p className="text-xs text-muted-foreground">
                  Fail backup mengandungi Buku, Transaksi, dan Checklist anda. Simpan di tempat selamat &mdash; sesiapa yang ada fail ini boleh mengimportnya ke akaun lain.
                </p>
              </div>

              {/* Action Buttons Section */}
              <div className="pt-10 border-t border-dashed flex flex-col md:flex-row gap-4">
                <Button 
                  variant="outline" 
                  className="flex-1 h-14 rounded-2xl font-bold text-base border-2 hover:bg-muted transition-all flex gap-2"
                  onClick={() => router.push('/books')}
                >
                  <LayoutDashboard className="w-5 h-5" /> Dashboard Utama
                </Button>
                <Button 
                  variant="destructive" 
                  className="flex-1 h-14 rounded-2xl font-bold text-base flex gap-2 shadow-xl shadow-destructive/10"
                  onClick={logout}
                >
                  <LogOut className="w-5 h-5" /> Log Keluar
                </Button>
              </div>
            </CardContent>
          </Card>

          <footer className="text-center text-[11px] text-muted-foreground font-bold uppercase tracking-[0.3em] opacity-40">
            FlowSnap System Engine • Pengurusan Kewangan Peribadi
          </footer>
        </div>

        <Dialog open={pendingImport !== null} onOpenChange={(open) => !open && cancelImport()}>
          <DialogContent className="rounded-3xl max-w-[90vw] sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Sahkan Import Backup</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {pendingImport && (
                <div className="rounded-2xl border border-muted p-4 text-sm space-y-1">
                  <p className="text-xs uppercase tracking-widest text-muted-foreground">Kandungan Fail</p>
                  <p><strong>{pendingImport.books.length}</strong> buku &middot; <strong>{pendingImport.transactions.length}</strong> transaksi &middot; <strong>{pendingImport.checklists.length}</strong> checklist</p>
                  {pendingImport.exportedBy && (
                    <p className="text-xs text-muted-foreground pt-1">Dari: {pendingImport.exportedBy}</p>
                  )}
                  {pendingImport.exportedAt && (
                    <p className="text-xs text-muted-foreground">Tarikh: {new Date(pendingImport.exportedAt).toLocaleString()}</p>
                  )}
                </div>
              )}

              <div className="space-y-3">
                <Label>Mod Import</Label>
                <RadioGroup value={importMode} onValueChange={(value) => setImportMode(value as "merge" | "replace")} className="space-y-2">
                  <label className="flex items-start gap-3 rounded-2xl border border-muted p-4 cursor-pointer">
                    <RadioGroupItem value="merge" id="mode-merge" className="mt-0.5" />
                    <div className="space-y-1">
                      <p className="text-sm font-semibold">Gabung (Merge)</p>
                      <p className="text-xs text-muted-foreground">Tambah data dari backup ke data sedia ada. Data semasa kekal &mdash; mungkin ada duplikat.</p>
                    </div>
                  </label>
                  <label className="flex items-start gap-3 rounded-2xl border border-destructive/30 bg-destructive/5 p-4 cursor-pointer">
                    <RadioGroupItem value="replace" id="mode-replace" className="mt-0.5" />
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-destructive">Ganti (Replace)</p>
                      <p className="text-xs text-muted-foreground">Padam SEMUA data semasa dahulu, kemudian restore dari backup. Tindakan ini tidak boleh dibatalkan.</p>
                    </div>
                  </label>
                </RadioGroup>
              </div>
            </div>
            <DialogFooter className="pt-4 flex flex-col gap-3">
              <Button
                variant={importMode === "replace" ? "destructive" : "default"}
                className="w-full"
                onClick={confirmImport}
                disabled={isImporting}
              >
                {isImporting ? "Mengimport..." : importMode === "replace" ? "Padam & Restore" : "Gabung Data"}
              </Button>
              <Button variant="ghost" className="w-full" onClick={cancelImport} disabled={isImporting}>
                Batal
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>

      {/* Mobile Footer Nav */}
      <div className="md:hidden fixed bottom-6 left-6 right-6 max-w-md mx-auto z-50">
        <nav className="bg-white/80 backdrop-blur-xl border border-white shadow-2xl rounded-full p-2 flex justify-around items-center">
          <Link href="/books" className="p-3 rounded-full hover:bg-muted text-muted-foreground transition-colors">
            <BookOpen className="w-6 h-6" />
          </Link>
          <Link href="/checklists" className="p-3 rounded-full hover:bg-muted text-muted-foreground transition-colors">
            <ListChecks className="w-6 h-6" />
          </Link>
          <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-white shadow-lg shadow-primary/30">
            <User className="w-6 h-6" />
          </div>
        </nav>
      </div>
    </div>
  );
}
