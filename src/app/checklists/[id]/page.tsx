
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
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { 
  Carousel, 
  CarouselContent, 
  CarouselItem, 
  type CarouselApi 
} from "@/components/ui/carousel";
import { 
  ArrowLeft, 
  Plus, 
  Trash2, 
  ReceiptText, 
  CheckCircle2, 
  Loader2, 
  Edit2, 
  Calendar,
  ChevronLeft,
  ChevronRight,
  History
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format, addMonths, startOfMonth } from "date-fns";

export default function ChecklistDetailPage() {
  const { id } = useParams() as { id: string };
  const { user, loading } = useAuth();
  const [checklist, setChecklist] = useState<Checklist | null>(null);
  const [newItemName, setNewItemName] = useState("");
  const [newItemAmount, setNewItemAmount] = useState("");
  const [newItemValidUntil, setNewItemValidUntil] = useState("");
  const [editingItem, setEditingItem] = useState<ChecklistItem | null>(null);
  const [editName, setEditName] = useState("");
  const [editAmount, setEditAmount] = useState("");
  const [api, setApi] = useState<CarouselApi>();
  const [currentSlide, setCurrentSlide] = useState(0);
  
  const router = useRouter();
  const { toast } = useToast();

  const months = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => {
      const d = addMonths(startOfMonth(new Date()), i);
      return {
        label: format(d, "MMMM yyyy"),
        key: format(d, "yyyy-MM"),
        date: d
      };
    });
  }, []);

  const currentMonthKey = months[currentSlide].key;

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [user, loading, router]);

  useEffect(() => {
    if (id) {
      const unsub = subscribeToChecklist(id, setChecklist);
      return () => unsub();
    }
  }, [id]);

  useEffect(() => {
    if (!api) return;
    api.on("select", () => {
      setCurrentSlide(api.selectedScrollSnap());
    });
  }, [api]);

  const stats = useMemo(() => {
    if (!checklist) return { total: 0, paid: 0, pending: 0 };
    const monthKey = months[currentSlide].key;
    
    const validItems = checklist.items.filter(item => {
      if (!item.validUntil) return true;
      return item.validUntil >= monthKey;
    });

    return validItems.reduce((acc, item) => {
      acc.total += item.amount;
      const isPaid = item.payments?.[monthKey]?.isPaid || false;
      if (isPaid) acc.paid += item.amount;
      else acc.pending += item.amount;
      return acc;
    }, { total: 0, paid: 0, pending: 0 });
  }, [checklist, currentSlide, months]);

  const filteredItems = useMemo(() => {
    if (!checklist) return [];
    const monthKey = months[currentSlide].key;
    return checklist.items.filter(item => {
      if (!item.validUntil) return true;
      return item.validUntil >= monthKey;
    });
  }, [checklist, currentSlide, months]);

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim() || !newItemAmount) return;
    try {
      await addChecklistItem(id, newItemName.trim(), parseFloat(newItemAmount), newItemValidUntil || undefined);
      setNewItemName("");
      setNewItemAmount("");
      setNewItemValidUntil("");
      toast({ title: "Item Ditambah", description: "Item baru telah ditambah ke dalam senarai." });
    } catch (e: any) {
      toast({ variant: "destructive", title: "Ralat", description: e.message });
    }
  };

  const handleUpdateItem = async () => {
    if (!user || !editingItem || !editName.trim() || !editAmount) return;
    try {
      await updateChecklistItem(user.uid, id, editingItem.id, editName.trim(), parseFloat(editAmount), currentMonthKey);
      setEditingItem(null);
      toast({ title: "Item Dikemas Kini", description: "Maklumat item telah disimpan." });
    } catch (e: any) {
      toast({ variant: "destructive", title: "Ralat", description: e.message });
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
          onClick={() => {
            if (confirm("Padam keseluruhan checklist ini?")) {
              deleteChecklist(id);
              router.push("/checklists");
            }
          }} 
          className="rounded-full text-rose-500 hover:bg-rose-50"
        >
          <Trash2 className="w-5 h-5" />
        </Button>
      </header>

      <div className="px-6 space-y-6">
        <div className="flex items-center justify-between bg-primary/5 p-4 rounded-3xl">
          <Button variant="ghost" size="icon" onClick={() => api?.scrollPrev()} disabled={currentSlide === 0}>
            <ChevronLeft className="w-6 h-6" />
          </Button>
          <div className="text-center">
            <h2 className="text-lg font-black text-primary">{months[currentSlide].label}</h2>
            <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Swipe untuk tukar bulan</p>
          </div>
          <Button variant="ghost" size="icon" onClick={() => api?.scrollNext()} disabled={currentSlide === months.length - 1}>
            <ChevronRight className="w-6 h-6" />
          </Button>
        </div>

        <Card className="bg-primary text-white border-none shadow-xl rounded-[2.5rem] p-6">
          <div className="flex flex-col items-center text-center mb-6">
            <span className="text-[10px] font-bold uppercase tracking-widest opacity-70 mb-1">Status Bayaran: {months[currentSlide].label}</span>
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

        <Carousel setApi={setApi} className="w-full">
          <CarouselContent>
            {months.map((month) => (
              <CarouselItem key={month.key}>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                      <ReceiptText className="w-4 h-4 text-primary" />
                      SENARAI KOMITMEN
                    </h2>
                    <span className="text-[10px] font-bold bg-muted px-2 py-0.5 rounded-full">{filteredItems.length} ITEM</span>
                  </div>

                  <div className="space-y-3 min-h-[200px]">
                    {filteredItems.length === 0 ? (
                      <div className="text-center py-10 opacity-30 text-xs italic bg-muted/20 rounded-2xl">
                        Tiada komitmen untuk bulan ini.
                      </div>
                    ) : (
                      filteredItems.map((item) => (
                        <ItemRow 
                          key={item.id} 
                          item={item} 
                          userUid={user!.uid} 
                          checklistId={id} 
                          monthKey={month.key}
                          onEdit={() => {
                            setEditingItem(item);
                            setEditName(item.name);
                            setEditAmount(item.amount.toString());
                          }}
                        />
                      ))
                    )}
                  </div>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>

        <form onSubmit={handleAddItem} className="space-y-3 bg-muted/30 p-4 rounded-[2rem] border border-muted mt-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-[10px] font-bold ml-1 text-muted-foreground uppercase tracking-widest">Nama Item</Label>
              <Input 
                placeholder="Bil Api, Sewa..."
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
          <div className="space-y-1">
            <Label className="text-[10px] font-bold ml-1 text-muted-foreground uppercase tracking-widest">Aktif Sehingga (Pilihan)</Label>
            <Input 
              type="month"
              value={newItemValidUntil}
              onChange={(e) => setNewItemValidUntil(e.target.value)}
              className="h-10 rounded-xl border-none shadow-sm"
            />
          </div>
          <Button type="submit" className="w-full h-10 rounded-xl font-bold flex gap-2">
            <Plus className="w-4 h-4" /> Tambah Item Jadual
          </Button>
        </form>
      </div>

      <Dialog open={!!editingItem} onOpenChange={(open) => !open && setEditingItem(null)}>
        <DialogContent className="rounded-3xl max-w-[90vw] sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Maklumat Item</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nama</Label>
              <Input value={editName} onChange={(e) => setEditName(e.target.value)} className="rounded-xl h-12" />
            </div>
            <div className="space-y-2">
              <Label>Harga (RM)</Label>
              <Input type="number" value={editAmount} onChange={(e) => setEditAmount(e.target.value)} className="rounded-xl h-12" />
            </div>
          </div>
          <DialogFooter>
            <Button className="w-full h-12 rounded-xl font-bold" onClick={handleUpdateItem}>Simpan Perubahan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ItemRow({ item, userUid, checklistId, monthKey, onEdit }: { item: ChecklistItem, userUid: string, checklistId: string, monthKey: string, onEdit: () => void }) {
  const isPaid = item.payments?.[monthKey]?.isPaid || false;
  const transactionId = item.payments?.[monthKey]?.transactionId;

  // Kira sejarah bayaran terkumpul
  const historyStats = useMemo(() => {
    const paidMonths = Object.values(item.payments || {}).filter(p => p.isPaid);
    const count = paidMonths.length;
    const total = count * item.amount;
    return { count, total };
  }, [item.payments, item.amount]);

  return (
    <div className={`flex items-center gap-4 p-4 rounded-2xl border-none shadow-sm transition-all ${isPaid ? 'bg-muted/50' : 'bg-card'}`}>
      <Checkbox 
        checked={isPaid} 
        onCheckedChange={() => toggleChecklistItem(userUid, checklistId, item.id, monthKey)}
        className="w-6 h-6 rounded-lg border-2"
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <p className={`font-bold text-sm truncate ${isPaid ? 'line-through text-muted-foreground' : ''}`}>{item.name}</p>
        </div>
        
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 text-[10px]">
            <span className="font-black text-primary">RM{item.amount.toLocaleString()}</span>
            {transactionId && (
              <span className="flex items-center gap-0.5 bg-emerald-100 text-emerald-600 px-1.5 py-0.5 rounded-full font-bold">
                <CheckCircle2 className="w-2.5 h-2.5" /> Direkod
              </span>
            )}
          </div>
          
          {historyStats.count > 0 && (
            <div className="flex items-center gap-1 text-[9px] text-muted-foreground bg-primary/5 w-fit px-2 py-0.5 rounded-lg border border-primary/5">
              <History className="w-2.5 h-2.5 text-primary/50" />
              <span>Terkumpul: <b className="text-foreground">RM{historyStats.total.toLocaleString()}</b> ({historyStats.count} bln)</span>
            </div>
          )}
        </div>
      </div>
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon" onClick={onEdit} className="rounded-full h-8 w-8 text-muted-foreground">
          <Edit2 className="w-4 h-4" />
        </Button>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => {
            if (confirm(`Padam item "${item.name}"? Sejarah bayaran juga akan dipadam.`)) {
              deleteChecklistItem(checklistId, item.id);
            }
          }}
          className="rounded-full h-8 w-8 text-muted-foreground hover:text-rose-500"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
