"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/contexts/auth-context";
import { 
  subscribeToChecklist, 
  addChecklistItem, 
  updateChecklistItem,
  toggleChecklistItem, 
  deleteChecklistItem, 
  deleteChecklist,
  Checklist,
  ChecklistItem
} from "@/lib/services/db";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ArrowLeft, Plus, Trash2, Wallet, ReceiptText, CheckCircle2, Loader2, Edit2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function ChecklistDetailPage() {
  const { id } = useParams() as { id: string };
  const { user, loading } = useAuth();
  const [checklist, setChecklist] = useState<Checklist | null>(null);
  const [newItemName, setNewItemName] = useState("");
  const [newItemAmount, setNewItemAmount] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [editingItem, setEditingItem] = useState<ChecklistItem | null>(null);
  const [editName, setEditName] = useState("");
  const [editAmount, setEditAmount] = useState("");
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [user, loading, router]);

  useEffect(() => {
    if (id) {
      const unsub = subscribeToChecklist(id, setChecklist);
      return () => unsub();
    }
  }, [id]);

  const stats = useMemo(() => {
    if (!checklist) return { total: 0, paid: 0, pending: 0 };
    return checklist.items.reduce((acc, item) => {
      acc.total += item.amount;
      if (item.isPaid) acc.paid += item.amount;
      else acc.pending += item.amount;
      return acc;
    }, { total: 0, paid: 0, pending: 0 });
  }, [checklist]);

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim() || !newItemAmount) return;
    try {
      await addChecklistItem(id, newItemName.trim(), parseFloat(newItemAmount));
      setNewItemName("");
      setNewItemAmount("");
      toast({ title: "Item Ditambah", description: "Item baru telah ditambah ke dalam senarai." });
    } catch (e: any) {
      toast({ variant: "destructive", title: "Ralat", description: e.message });
    }
  };

  const handleEditItem = (item: ChecklistItem) => {
    setEditingItem(item);
    setEditName(item.name);
    setEditAmount(item.amount.toString());
  };

  const handleUpdateItem = async () => {
    if (!user || !editingItem || !editName.trim() || !editAmount) return;
    try {
      await updateChecklistItem(user.uid, id, editingItem.id, editName.trim(), parseFloat(editAmount));
      setEditingItem(null);
      toast({ title: "Item Dikemas Kini", description: "Maklumat item telah disimpan." });
    } catch (e: any) {
      toast({ variant: "destructive", title: "Ralat", description: e.message });
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    try {
      await deleteChecklistItem(id, itemId);
      toast({ title: "Item Dipadam", description: "Item telah berjaya dibuang." });
    } catch (e: any) {
      toast({ variant: "destructive", title: "Ralat", description: e.message });
    }
  };

  const handleDeleteChecklist = async () => {
    if (!confirm("Padam keseluruhan checklist ini? Transaksi berkaitan (jika ada) juga akan dipadam.")) return;
    setIsDeleting(true);
    try {
      await deleteChecklist(id);
      toast({ title: "Checklist Dipadam", description: "Keseluruhan senarai telah dibuang." });
      router.push("/checklists");
    } catch (e: any) {
      toast({ variant: "destructive", title: "Ralat", description: e.message });
      setIsDeleting(false);
    }
  };

  if (!checklist) return (
    <div className="flex flex-col items-center justify-center h-svh gap-2">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
      <p className="text-muted-foreground text-sm">Memuatkan senarai...</p>
    </div>
  );

  return (
    <div className="max-w-md mx-auto min-h-svh bg-background pb-32">
      <header className="p-6 pb-2 flex items-center justify-between sticky top-0 bg-background/80 backdrop-blur-lg z-10">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-bold truncate">{checklist.name}</h1>
        </div>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={handleDeleteChecklist} 
          disabled={isDeleting}
          className="rounded-full text-rose-500 hover:bg-rose-50"
        >
          {isDeleting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Trash2 className="w-5 h-5" />}
        </Button>
      </header>

      <div className="px-6 space-y-6">
        {/* Stats Summary */}
        <Card className="bg-primary text-white border-none shadow-xl rounded-[2.5rem] p-6">
          <div className="flex flex-col items-center text-center mb-6">
            <span className="text-[10px] font-bold uppercase tracking-widest opacity-70 mb-1">Jumlah Perlu Dibayar</span>
            <span className="text-4xl font-black">RM{stats.total.toLocaleString()}</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white/10 rounded-2xl p-3 flex flex-col items-center">
              <span className="text-[8px] font-bold uppercase opacity-60">Sudah Bayar</span>
              <span className="font-bold text-emerald-300">RM{stats.paid.toLocaleString()}</span>
            </div>
            <div className="bg-white/10 rounded-2xl p-3 flex flex-col items-center">
              <span className="text-[8px] font-bold uppercase opacity-60">Belum Bayar</span>
              <span className="font-bold text-rose-300">RM{stats.pending.toLocaleString()}</span>
            </div>
          </div>
        </Card>

        {/* Add Item Form */}
        <form onSubmit={handleAddItem} className="space-y-3 bg-muted/30 p-4 rounded-[2rem] border border-muted">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-[10px] font-bold ml-1 text-muted-foreground uppercase tracking-widest">Nama Barang</Label>
              <Input 
                placeholder="Beras, Telur..." 
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                className="h-10 rounded-xl border-none shadow-sm"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] font-bold ml-1 text-muted-foreground uppercase tracking-widest">Harga (RM)</Label>
              <Input 
                type="number"
                placeholder="0.00" 
                value={newItemAmount}
                onChange={(e) => setNewItemAmount(e.target.value)}
                className="h-10 rounded-xl border-none shadow-sm"
              />
            </div>
          </div>
          <Button type="submit" className="w-full h-10 rounded-xl font-bold flex gap-2">
            <Plus className="w-4 h-4" /> Tambah Item
          </Button>
        </form>

        {/* Checklist Items */}
        <div className="space-y-3">
          <h2 className="text-sm font-bold flex items-center gap-2 text-muted-foreground">
            <ReceiptText className="w-4 h-4 text-primary" />
            BARANG BELANJA
          </h2>
          
          {checklist.items.length === 0 ? (
            <div className="text-center py-10 opacity-30 text-xs italic">
              Senarai kosong. Tambah barang pertama anda di atas.
            </div>
          ) : (
            <div className="space-y-2">
              {checklist.items.map((item) => (
                <div 
                  key={item.id} 
                  className={`flex items-center gap-4 p-4 rounded-2xl border-none shadow-sm transition-all ${item.isPaid ? 'bg-muted/50 opacity-60' : 'bg-card'}`}
                >
                  <Checkbox 
                    checked={item.isPaid} 
                    onCheckedChange={() => toggleChecklistItem(user!.uid, id, item.id)}
                    className="w-6 h-6 rounded-lg border-2"
                  />
                  <div className="flex-1 min-w-0">
                    <p className={`font-bold text-sm ${item.isPaid ? 'line-through' : ''}`}>{item.name}</p>
                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                      <span className="font-black text-primary">RM{item.amount.toLocaleString()}</span>
                      {item.transactionId && (
                        <span className="flex items-center gap-0.5 bg-emerald-100 text-emerald-600 px-1.5 py-0.5 rounded-full font-bold">
                          <CheckCircle2 className="w-2.5 h-2.5" /> Direkod
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => handleEditItem(item)}
                      className="rounded-full text-muted-foreground hover:text-primary"
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => handleDeleteItem(item.id)}
                      className="rounded-full text-muted-foreground hover:text-rose-500"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {checklist.bookId && (
          <div className="bg-primary/5 p-4 rounded-2xl border border-primary/10 flex items-center gap-3">
            <div className="bg-primary/10 p-2 rounded-xl">
              <Wallet className="w-4 h-4 text-primary" />
            </div>
            <p className="text-[10px] font-medium text-primary leading-tight">
              Akaun terpaut: <br/>
              <span className="font-black uppercase">Mod Automatik Aktif</span>
            </p>
          </div>
        )}
      </div>

      <Dialog open={!!editingItem} onOpenChange={(open) => !open && setEditingItem(null)}>
        <DialogContent className="rounded-3xl max-w-[90vw] sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Item</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nama Barang</Label>
              <Input 
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="rounded-xl h-12"
              />
            </div>
            <div className="space-y-2">
              <Label>Harga (RM)</Label>
              <Input 
                type="number"
                value={editAmount}
                onChange={(e) => setEditAmount(e.target.value)}
                className="rounded-xl h-12"
              />
            </div>
          </div>
          <DialogFooter>
            <Button className="w-full h-12 rounded-xl font-bold" onClick={handleUpdateItem}>
              Simpan Perubahan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
