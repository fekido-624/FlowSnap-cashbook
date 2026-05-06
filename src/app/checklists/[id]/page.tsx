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
  toggleChecklistItemFixed,
  resetChecklistMonthly,
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
  Wallet, 
  ReceiptText, 
  CheckCircle2, 
  Loader2, 
  Edit2, 
  CalendarClock, 
  ShoppingBag,
  RefreshCw,
  Pin
} from "lucide-react";
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
  const [api, setApi] = useState<CarouselApi>();
  const [currentSlide, setCurrentSlide] = useState(0);
  
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

  useEffect(() => {
    if (!api) return;
    api.on("select", () => {
      setCurrentSlide(api.selectedScrollSnap());
    });
  }, [api]);

  const stats = useMemo(() => {
    if (!checklist) return { total: 0, paid: 0, pending: 0 };
    return checklist.items.reduce((acc, item) => {
      acc.total += item.amount;
      if (item.isPaid) acc.paid += item.amount;
      else acc.pending += item.amount;
      return acc;
    }, { total: 0, paid: 0, pending: 0 });
  }, [checklist]);

  const activeItems = useMemo(() => checklist?.items.filter(i => !i.isFixed) || [], [checklist]);
  const fixedItems = useMemo(() => checklist?.items.filter(i => i.isFixed) || [], [checklist]);

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim() || !newItemAmount) return;
    try {
      // Tambah sebagai fixed jika berada di slide fixed
      await addChecklistItem(id, newItemName.trim(), parseFloat(newItemAmount), currentSlide === 1);
      setNewItemName("");
      setNewItemAmount("");
      toast({ title: "Item Ditambah", description: "Item baru telah ditambah ke dalam senarai." });
    } catch (e: any) {
      toast({ variant: "destructive", title: "Ralat", description: e.message });
    }
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

  const handleResetMonth = async () => {
    if (!confirm("Adakah anda mahu memulakan bulan baru? Ini akan memadam item sekali-sekala dan reset bayaran untuk item tetap.")) return;
    try {
      await resetChecklistMonthly(id);
      toast({ title: "Bulan Baru Bermula", description: "Senarai telah dibersihkan." });
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
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={handleResetMonth} className="rounded-full text-primary hover:bg-primary/5">
            <RefreshCw className="w-5 h-5" />
          </Button>
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
        </div>
      </header>

      <div className="px-6 space-y-6">
        {/* Stats Summary */}
        <Card className="bg-primary text-white border-none shadow-xl rounded-[2.5rem] p-6">
          <div className="flex flex-col items-center text-center mb-6">
            <span className="text-[10px] font-bold uppercase tracking-widest opacity-70 mb-1">Jumlah Keseluruhan</span>
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

        {/* Swipe Indicators */}
        <div className="flex gap-2 items-center justify-center">
           <button 
             onClick={() => api?.scrollTo(0)}
             className={`px-4 py-1.5 rounded-full text-[10px] font-black tracking-widest uppercase transition-all flex items-center gap-2 ${currentSlide === 0 ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'}`}
           >
             <ShoppingBag className="w-3 h-3" /> Senarai Semasa
           </button>
           <button 
             onClick={() => api?.scrollTo(1)}
             className={`px-4 py-1.5 rounded-full text-[10px] font-black tracking-widest uppercase transition-all flex items-center gap-2 ${currentSlide === 1 ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'}`}
           >
             <CalendarClock className="w-3 h-3" /> Komitmen Tetap
           </button>
        </div>

        {/* Carousel Content */}
        <Carousel setApi={setApi} className="w-full">
          <CarouselContent>
            {/* Slide 1: Senarai Semasa */}
            <CarouselItem>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                    <ReceiptText className="w-4 h-4 text-primary" />
                    KEPERLUAN SEMASA
                  </h2>
                  <span className="text-[10px] font-bold bg-muted px-2 py-0.5 rounded-full">{activeItems.length} ITEM</span>
                </div>

                <div className="space-y-2">
                  {activeItems.length === 0 ? (
                    <div className="text-center py-10 opacity-30 text-xs italic bg-muted/20 rounded-2xl">
                      Tiada item sekali-sekala. Swipe ke kanan untuk item tetap.
                    </div>
                  ) : (
                    activeItems.map((item) => (
                      <ItemRow 
                        key={item.id} 
                        item={item} 
                        userUid={user!.uid} 
                        checklistId={id} 
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

            {/* Slide 2: Item Tetap */}
            <CarouselItem>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xs font-black uppercase tracking-widest text-primary flex items-center gap-2">
                    <CalendarClock className="w-4 h-4" />
                    KOMITMEN BULANAN
                  </h2>
                  <span className="text-[10px] font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-full">{fixedItems.length} ITEM</span>
                </div>

                <div className="space-y-2">
                  {fixedItems.length === 0 ? (
                    <div className="text-center py-10 opacity-30 text-xs italic bg-muted/20 rounded-2xl">
                      Belum ada komitmen tetap bulanan (Bil, Sewa, dsb).
                    </div>
                  ) : (
                    fixedItems.map((item) => (
                      <ItemRow 
                        key={item.id} 
                        item={item} 
                        userUid={user!.uid} 
                        checklistId={id} 
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
          </CarouselContent>
        </Carousel>

        {/* Add Item Form (Sticky at bottom-ish) */}
        <form onSubmit={handleAddItem} className="space-y-3 bg-muted/30 p-4 rounded-[2rem] border border-muted mt-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-[10px] font-bold ml-1 text-muted-foreground uppercase tracking-widest">Nama Item</Label>
              <Input 
                placeholder={currentSlide === 0 ? "Beras, Telur..." : "Bil Air, Sewa..."}
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
            <Plus className="w-4 h-4" /> Tambah {currentSlide === 1 ? 'Komitmen' : 'Barang'}
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

function ItemRow({ item, userUid, checklistId, onEdit }: { item: ChecklistItem, userUid: string, checklistId: string, onEdit: () => void }) {
  const { toast } = useToast();
  
  return (
    <div className={`flex items-center gap-4 p-4 rounded-2xl border-none shadow-sm transition-all ${item.isPaid ? 'bg-muted/50 opacity-60' : 'bg-card'}`}>
      <Checkbox 
        checked={item.isPaid} 
        onCheckedChange={() => toggleChecklistItem(userUid, checklistId, item.id)}
        className="w-6 h-6 rounded-lg border-2"
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className={`font-bold text-sm truncate ${item.isPaid ? 'line-through' : ''}`}>{item.name}</p>
          {item.isFixed && <Pin className="w-3 h-3 text-primary shrink-0" />}
        </div>
        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
          <span className="font-black text-primary">RM{item.amount.toLocaleString()}</span>
          {item.transactionId && (
            <span className="flex items-center gap-0.5 bg-emerald-100 text-emerald-600 px-1.5 py-0.5 rounded-full font-bold">
              <CheckCircle2 className="w-2.5 h-2.5" /> Direkod
            </span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-1">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => toggleChecklistItemFixed(checklistId, item.id)}
          className={`rounded-full h-8 w-8 ${item.isFixed ? 'text-primary bg-primary/10' : 'text-muted-foreground'}`}
          title={item.isFixed ? "Item Tetap Bulanan" : "Tukar ke Tetap"}
        >
          <CalendarClock className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={onEdit} className="rounded-full h-8 w-8 text-muted-foreground">
          <Edit2 className="w-4 h-4" />
        </Button>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => deleteChecklistItem(checklistId, item.id)}
          className="rounded-full h-8 w-8 text-muted-foreground hover:text-rose-500"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
