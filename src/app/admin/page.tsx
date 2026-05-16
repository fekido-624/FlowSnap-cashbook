"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/contexts/auth-context";
import { Sidebar } from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle2, Lock, Unlock, ShieldCheck, Edit3, Trash2 } from "lucide-react";
import { deleteUserData } from "@/lib/services/db";

interface UserAccount {
  uid: string;
  email: string;
  password: string;
  role: "admin" | "user";
  status: "pending" | "active" | "frozen";
}

const ACCOUNTS_KEY = "flowsnap_accounts";
const USER_KEY = "flowsnap_user";
const DEFAULT_ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL || "admin@flowsnap.local";
const DEFAULT_ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || "admin123";

const loadAccounts = (): UserAccount[] => {
  if (typeof window === "undefined") return [];
  try {
    const value = localStorage.getItem(ACCOUNTS_KEY) || "[]";
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      return [
        {
          uid: "admin_default",
          email: DEFAULT_ADMIN_EMAIL.toLowerCase(),
          password: DEFAULT_ADMIN_PASSWORD,
          role: "admin",
          status: "active"
        }
      ];
    }
    return parsed as UserAccount[];
  } catch {
    return [
      {
        uid: "admin_default",
          email: DEFAULT_ADMIN_EMAIL.toLowerCase(),
          password: DEFAULT_ADMIN_PASSWORD,
          role: "admin",
          status: "active"
      }
    ];
  }
};

const saveAccounts = (accounts: UserAccount[]) => {
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
};

const badgeColor = (status: UserAccount["status"]) => {
  if (status === "pending") return "bg-yellow-100 text-yellow-800";
  if (status === "active") return "bg-emerald-100 text-emerald-800";
  return "bg-rose-100 text-rose-800";
};

const normalizeAccounts = (accounts: UserAccount[]): UserAccount[] => {
  return accounts.map((account) => ({
    ...account,
    status: account.status || 'pending',
  }));
};

export default function AdminPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [accounts, setAccounts] = useState<UserAccount[]>([]);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<UserAccount | null>(null);
  const [editEmail, setEditEmail] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [editError, setEditError] = useState("");
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState<UserAccount | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/login');
        return;
      }
      if (user.role !== 'admin') {
        router.push('/');
        return;
      }
      setAccounts(normalizeAccounts(loadAccounts()));
    }
  }, [loading, user, router]);

  const refreshAccounts = () => setAccounts(normalizeAccounts(loadAccounts()));

  const openEdit = (account: UserAccount) => {
    setEditingAccount(account);
    setEditEmail(account.email);
    setEditPassword("");
    setEditError("");
    setIsEditOpen(true);
  };

  const closeEdit = () => {
    setIsEditOpen(false);
    setEditingAccount(null);
    setEditPassword("");
    setEditError("");
  };

  const saveEditedAccount = () => {
    if (!editingAccount) return;
    const normalizedEmail = editEmail.trim().toLowerCase();
    if (!normalizedEmail) {
      setEditError('Email diperlukan.');
      return;
    }
    const emailTaken = accounts.some((account) => account.uid !== editingAccount.uid && account.email === normalizedEmail);
    if (emailTaken) {
      setEditError('Email sudah digunakan oleh pengguna lain.');
      return;
    }
    if (editPassword && editPassword.length < 6) {
      setEditError('Kata laluan mesti sekurang-kurangnya 6 aksara jika ditukar.');
      return;
    }

    const updated = accounts.map((account) => {
      if (account.uid !== editingAccount.uid) return account;
      return {
        ...account,
        email: normalizedEmail,
        password: editPassword ? editPassword : account.password
      };
    });

    saveAccounts(updated);
    setAccounts(updated);

    const currentUser = localStorage.getItem(USER_KEY);
    if (currentUser) {
      const parsed = JSON.parse(currentUser);
      if (parsed.uid === editingAccount.uid) {
        localStorage.setItem(USER_KEY, JSON.stringify({ ...parsed, email: normalizedEmail }));
      }
    }

    closeEdit();
  };

  const expectedDeleteText = deletingAccount ? `PADAM ${deletingAccount.email}` : "";
  const isDeleteConfirmed = deleteConfirmText.trim() === expectedDeleteText;

  const openDelete = (account: UserAccount) => {
    setDeletingAccount(account);
    setDeleteConfirmText("");
    setDeleteError("");
    setIsDeleteOpen(true);
  };

  const closeDelete = () => {
    if (isDeleting) return;
    setIsDeleteOpen(false);
    setDeletingAccount(null);
    setDeleteConfirmText("");
    setDeleteError("");
  };

  const confirmDelete = async () => {
    if (!deletingAccount) return;
    if (deletingAccount.role === 'admin') {
      setDeleteError('Akaun admin tidak boleh dipadam.');
      return;
    }
    if (user && deletingAccount.uid === user.uid) {
      setDeleteError('Anda tidak boleh memadam akaun sendiri.');
      return;
    }
    if (!isDeleteConfirmed) {
      setDeleteError(`Sila taip "${expectedDeleteText}" untuk sahkan.`);
      return;
    }

    setIsDeleting(true);
    try {
      await deleteUserData(deletingAccount.uid);
      const updated = accounts.filter((account) => account.uid !== deletingAccount.uid);
      saveAccounts(updated);
      setAccounts(updated);
      setIsDeleteOpen(false);
      setDeletingAccount(null);
      setDeleteConfirmText("");
    } catch (err: any) {
      setDeleteError(err?.message || 'Ralat semasa memadam pengguna.');
    } finally {
      setIsDeleting(false);
    }
  };

  const updateStatus = (uid: string, status: UserAccount['status']) => {
    const updated = accounts.map((account) =>
      account.uid === uid ? { ...account, status } : account
    );
    saveAccounts(updated);
    setAccounts(updated);
  };

  const pendingUsers = useMemo(() => accounts.filter((account) => account.status === 'pending'), [accounts]);
  const activeUsers = useMemo(() => accounts.filter((account) => account.status === 'active'), [accounts]);
  const frozenUsers = useMemo(() => accounts.filter((account) => account.status === 'frozen'), [accounts]);

  if (loading || !user || user.role !== 'admin') {
    return null;
  }

  return (
    <div className="min-h-svh bg-background flex flex-col md:flex-row">
      <Sidebar />

      <main className="flex-1 p-6 md:p-10 pb-32 md:pb-10 max-w-7xl mx-auto w-full">
        <div className="flex flex-col gap-6">
          <Card className="border-none shadow-xl rounded-[2rem] bg-card">
            <CardHeader className="p-8">
              <div className="flex items-center gap-3 mb-4">
                <ShieldCheck className="w-7 h-7 text-primary" />
                <div>
                  <CardTitle className="text-2xl font-black">Pengurusan Pengguna</CardTitle>
                  <p className="text-sm text-muted-foreground">Luluskan pendaftaran dan bekukan akaun pengguna di sini.</p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
                <div className="rounded-3xl border border-muted p-4">
                  <p className="text-sm uppercase tracking-widest text-muted-foreground">Menunggu kelulusan</p>
                  <p className="text-3xl font-black">{pendingUsers.length}</p>
                </div>
                <div className="rounded-3xl border border-muted p-4">
                  <p className="text-sm uppercase tracking-widest text-muted-foreground">Akaun aktif</p>
                  <p className="text-3xl font-black">{activeUsers.length}</p>
                </div>
                <div className="rounded-3xl border border-muted p-4">
                  <p className="text-sm uppercase tracking-widest text-muted-foreground">Akaun dibekukan</p>
                  <p className="text-3xl font-black">{frozenUsers.length}</p>
                </div>
              </div>
            </CardHeader>
          </Card>

          <Card className="border-none shadow-xl rounded-[2rem] bg-card">
            <CardHeader className="p-8">
              <CardTitle className="text-xl font-black">Senarai Pengguna</CardTitle>
            </CardHeader>
            <CardContent className="p-8">
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-muted/50 text-muted-foreground">
                      <th className="px-4 py-3 uppercase tracking-widest">Email</th>
                      <th className="px-4 py-3 uppercase tracking-widest">Peranan</th>
                      <th className="px-4 py-3 uppercase tracking-widest">Status</th>
                      <th className="px-4 py-3 uppercase tracking-widest">Tindakan</th>
                    </tr>
                  </thead>
                  <tbody>
                    {accounts.map((account) => (
                      <tr key={account.uid} className="border-b border-muted/10">
                        <td className="px-4 py-4 text-sm font-medium text-foreground">{account.email}</td>
                        <td className="px-4 py-4 uppercase text-xs tracking-widest text-muted-foreground">{account.role}</td>
                        <td className="px-4 py-4">
                          <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${badgeColor(account.status)}`}>
                            {account.status}
                          </span>
                        </td>
                        <td className="px-4 py-4 space-x-2">
                          <Button size="sm" variant="outline" onClick={() => openEdit(account)}>
                            <Edit3 className="w-4 h-4 mr-2" /> Edit
                          </Button>
                          {account.status === 'pending' && (
                            <Button size="sm" onClick={() => updateStatus(account.uid, 'active')}>
                              <CheckCircle2 className="w-4 h-4 mr-2" /> Lulus
                            </Button>
                          )}
                          {account.status === 'active' && account.role !== 'admin' && (
                            <Button size="sm" variant="destructive" onClick={() => updateStatus(account.uid, 'frozen')}>
                              <Lock className="w-4 h-4 mr-2" /> Bekukan
                            </Button>
                          )}
                          {account.status === 'frozen' && account.role !== 'admin' && (
                            <Button size="sm" onClick={() => updateStatus(account.uid, 'active')}>
                              <Unlock className="w-4 h-4 mr-2" /> Aktifkan
                            </Button>
                          )}
                          {account.role !== 'admin' && account.uid !== user.uid && (
                            <Button size="sm" variant="destructive" onClick={() => openDelete(account)}>
                              <Trash2 className="w-4 h-4 mr-2" /> Padam
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <Dialog open={isEditOpen} onOpenChange={(open) => !open && closeEdit()}>
            <DialogContent className="rounded-3xl max-w-[90vw] sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Sunting Pengguna</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-email">Email</Label>
                  <Input
                    id="edit-email"
                    type="email"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    className="rounded-xl h-12"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-password">Password baru</Label>
                  <Input
                    id="edit-password"
                    type="password"
                    value={editPassword}
                    onChange={(e) => setEditPassword(e.target.value)}
                    className="rounded-xl h-12"
                    placeholder="Tinggalkan kosong jika tidak mahu tukar"
                  />
                </div>
                {editError && (
                  <div className="text-sm text-destructive">{editError}</div>
                )}
              </div>
              <DialogFooter className="pt-4 flex flex-col gap-3">
                <Button className="w-full" onClick={saveEditedAccount}>
                  Simpan Perubahan
                </Button>
                <Button variant="ghost" className="w-full" onClick={closeEdit}>
                  Batal
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={isDeleteOpen} onOpenChange={(open) => !open && closeDelete()}>
            <DialogContent className="rounded-3xl max-w-[90vw] sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Padam Pengguna</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-4 space-y-2">
                  <p className="text-sm font-semibold text-destructive">Amaran: Tindakan ini kekal</p>
                  <p className="text-xs text-muted-foreground">
                    Akaun <strong className="text-foreground">{deletingAccount?.email}</strong> akan dipadam bersama semua Buku, Transaksi, dan Checklist miliknya. Data tidak boleh dipulihkan.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="delete-confirm">
                    Taip <code className="px-1.5 py-0.5 rounded bg-muted text-foreground text-xs font-mono">{expectedDeleteText}</code> untuk sahkan
                  </Label>
                  <Input
                    id="delete-confirm"
                    value={deleteConfirmText}
                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                    className="rounded-xl h-12 font-mono"
                    placeholder={expectedDeleteText}
                    autoComplete="off"
                  />
                </div>
                {deleteError && (
                  <div className="text-sm text-destructive">{deleteError}</div>
                )}
              </div>
              <DialogFooter className="pt-4 flex flex-col gap-3">
                <Button variant="destructive" className="w-full" onClick={confirmDelete} disabled={isDeleting || !isDeleteConfirmed}>
                  {isDeleting ? 'Memadam...' : 'Padam Pengguna'}
                </Button>
                <Button variant="ghost" className="w-full" onClick={closeDelete} disabled={isDeleting}>
                  Batal
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Card className="border-none shadow-xl rounded-[2rem] bg-card">
            <CardHeader className="p-8">
              <CardTitle className="text-base font-black">Nota Pentadbir</CardTitle>
            </CardHeader>
            <CardContent className="p-8 text-sm text-muted-foreground space-y-3">
              <p>Pengguna yang mendaftar akan berada dalam status <strong>pending</strong> sehingga anda meluluskan mereka.</p>
              <p>Akaun yang dibekukan tidak akan dibenarkan log masuk sehingga anda mengaktifkan semula.</p>
              <p>Akaun admin tidak boleh dibekukan atau dipadam melalui panel ini.</p>
              <p>Padam pengguna adalah kekal &mdash; akaun dan semua data (Buku, Transaksi, Checklist) miliknya akan dibuang sepenuhnya. Untuk block sementara, gunakan &quot;Bekukan&quot;.</p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
