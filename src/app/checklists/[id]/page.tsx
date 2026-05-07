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
  excludeItemFromMonth,
  restoreItemForMonth,
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
  History,
  AlertTriangle,
  RotateCcw,
  EyeOff
} from "lucide-react";
import { Sidebar } from "@/components/Sidebar";
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
  const [showHidden, setShowHidden] = useState(false);
  
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

  const filteredItems = useMemo(() => {
    if (!checklist) return [];
    const monthKey = months[currentSlide].key;
    return checklist.items.filter(item => {
      const isStillValid = !item.validUntil || item.validUntil >= monthKey;
      const isNotExcluded = !item.excludedMonths?.includes(monthKey);
      return isStillValid && isNotExcluded;
    });
  }, [checklist, currentSlide, months]);

  const excludedItems = useMemo(() => {
    if (!checklist) return [];
    const monthKey = months[currentSlide].key;
    return checklist.items.filter(item => {
      const isStillValid = !item.validUntil || item.validUntil >= monthKey;
      const isExcluded = item.excludedMonths?.includes(monthKey);
      return isStillValid && isExcluded;
    });
  }, [checklist, currentSlide, months]);

  const stats = useMemo(() => {
    if (!checklist) return { total: 0, paid: 0, pending: 0 };
    return filteredItems.reduce((acc, item) => {
      acc.total += item.amount;
      const isPaid = item.payments?.[currentMonthKey]?.isPaid || false;
      if (isPaid) acc.paid += item.amount;
      else acc.pending += item.amount;
      return acc;
    }, { total: 0, paid: 0, pending: 0 });
  }, [filteredItems, currentMonthKey]);

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

  const handleMonthlyDelete = async (itemId: string, itemName: string) => {
    if (confirm(`Padam "${itemName}" untuk bulan ${months[currentSlide].label} sahaja? Jika sudah dibayar, baki dalam Buku Akaun akan dipulihkan.`)) {
      try {
        await excludeItemFromMonth(id, itemId, currentMonthKey);
        toast({ title: "Dipadam (Bulan Ini)", description: `Item disembunyikan untuk bulan ${months[currentSlide].label}.` });
      } catch (e: any) {
        toast({ variant: "destructive", title: "Ralat", description: e.message });
      }
    }
  };

  const handleRestore = async (itemId: string) => {
    try {
      await restoreItemForMonth(id, itemId, currentMonthKey);
      toast({ title: "Dipulihkan", description: "Item kini muncul semula dalam senarai bulan ini." });
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
    <div className="min-h-svh bg-background flex flex-col md:flex-row">
      <Sidebar />

      <main className="flex-1 p-6 md:p-10 pb-32 md:pb-10 max-w-7xl mx-auto w-full">
        <header className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-2xl font-black truncate">{checklist.name}</h1>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => {
              if (confirm("Padam keseluruhan checklist ini? Rekod lama dalam Buku Akaun akan tetap kekal.")) {
                deleteChecklist(id);
                router.push("/checklists");
              }
            }} 
            className="rounded-full text-rose-500 hover:bg-rose-50"
          >
            <Trash2 className="w-5 h-5" />
          </Button>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Month & Stats */}
          <div className="space-y-6">
            <div className="flex items-center justify-between bg-primary/5 p-4 rounded-[2rem] border border-primary/10">
              <Button variant="ghost" size="icon" onClick={() => api?.scrollPrev()} disabled={currentSlide === 0} className="rounded-full">
                <ChevronLeft className="w-6 h-6" />
              </Button>
              <div className="text-center">
                <h2 className="text-lg font-black text-primary">{months[currentSlide].label}</h2>
                <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Pilih Bulan</p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => api?.scrollNext()} disabled={currentSlide === months.length - 1} className="rounded-full">
                <ChevronRight className="w-6 h-6" />
              </Button>
            </div>

            <Card className="bg-primary text-white border-none shadow-2xl rounded-[2.5rem] p-8">
              <div className="flex flex-col items-center text-center mb-8">
                <span className="text-[10px] font-bold uppercase tracking-widest opacity-70 mb-1">Komitmen: {months[currentSlide].label}</span>
                <span className="text-4xl font-black">RM{stats.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/10 rounded-2xl p-4 flex flex-col items-center">
                  <span className="text-[9px] font-bold uppercase opacity-60 mb-1">Selesai</span>
                  <span className="text-lg font-black text-emerald-300">RM{stats.paid.toLocaleString()}</span>
                </div>
                <div className="bg-white/10 rounded-2xl p-4 flex flex-col items-center">
                  <span className="text-[9px] font-bold uppercase opacity-60 mb-1">Tunggakan</span>
                  <span className="text-lg font-black text-rose-300">RM{stats.pending.toLocaleString()}</span>
                </div>
              </div>
            </Card>

            <form onSubmit={handleAddItem} className="space-y-4 bg-muted/30 p-6 rounded-[2.5rem] border border-muted">
              <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-2">Tambah Komitmen</h3>
              <div className="space-y-3">
                <div className="space-y-1">
                  <Label className="text-[10px] font-bold ml-1 text-muted-foreground uppercase tracking-widest">Nama Item</Label>
                  <Input 
                    placeholder="Contoh: Bil Elektrik"
                    value={newItemName}
                    onChange={(e) => setNewItemName(e.target.value)}
                    className="h-12 rounded-xl border-none shadow-sm"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] font-bold ml-1 text-muted-foreground uppercase tracking-widest">Harga (RM)</Label>
                  <Input 
                    type="number"
                    placeholder="0.00" 
                    value={newItemAmount}
                    onChange={(e) => setNewItemAmount(e.target.value)}
                    className="h-12 rounded-xl border-none shadow-sm"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] font-bold ml-1 text-muted-foreground uppercase tracking-widest">Aktif Sehingga (Pilihan)</Label>
                  <Input 
                    type="month"
                    value={newItemValidUntil}
                    onChange={(e) => setNewItemValidUntil(e.target.value)}
                    className="h-12 rounded-xl border-none shadow-sm"
                  />
                </div>
                <Button type="submit" className="w-full h-12 rounded-xl font-bold flex gap-2 shadow-lg shadow-primary/20">
                  <Plus className="w-4 h-4" /> Tambah Item
                </Button>
              </div>
            </form>
          </div>

          {/* Right Column: Items List */}
          <div className="lg:col-span-2 space-y-6">
            <Carousel setApi={setApi} className="w-full">
              <CarouselContent>
                {months.map((month) => (
                  <CarouselItem key={month.key}>
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <h2 className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                          <ReceiptText className="w-4 h-4 text-primary" />
                          Senarai Komitmen {month.label}
                        </h2>
                        <span className="text-[10px] font-bold bg-muted px-3 py-1 rounded-full">{filteredItems.length} Item</span>
                      </div>

                      <div className="grid grid-cols-1 gap-4 min-h-[400px]">
                        {filteredItems.length === 0 ? (
                          <div className="flex flex-col items-center justify-center py-20 opacity-30 bg-muted/20 rounded-[3rem] border-2 border-dashed">
                            <Calendar className="w-12 h-12 mb-4" />
                            <p className="font-bold">Tiada komitmen untuk bulan ini.</p>
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
                              onDelete={() => handleMonthlyDelete(item.id, item.name)}
                            />
                          ))
                        )}
                      </div>

                      {excludedItems.length > 0 && (
                        <div className="mt-8 space-y-4 border-t pt-8 border-dashed">
                           <Button 
                             variant="ghost" 
                             className="w-full text-xs font-bold uppercase tracking-widest text-muted-foreground hover:bg-muted/50 rounded-2xl h-12"
                             onClick={() => setShowHidden(!showHidden)}
                           >
                             {showHidden ? 'Sembunyikan' : 'Lihat'} {excludedItems.length} Item Dipadam Bulan Ini
                           </Button>
                           
                           {showHidden && (
                             <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 opacity-60">
                                {excludedItems.map(item => (
                                  <div key={item.id} className="flex items-center justify-between p-4 bg-muted/30 rounded-2xl">
                                    <span className="text-sm font-medium line-through truncate mr-2">{item.name}</span>
                                    <Button variant="outline" size="sm" onClick={() => handleRestore(item.id)} className="h-8 px-3 text-[10px] font-bold flex gap-1 rounded-lg">
                                      <RotateCcw className="w-3 h-3" /> Pulihkan
                                    </Button>
                                  </div>
                                ))}
                             </div>
                           )}
                        </div>
                      )}
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
            </Carousel>
          </div>
        </div>
      </main>

      <Dialog open={!!editingItem} onOpenChange={(open) => !open && setEditingItem(null)}>
        <DialogContent className="rounded-3xl max-w-[90vw] sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Maklumat Item</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nama Komitmen</Label>
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

function ItemRow({ 
  item, 
  userUid, 
  checklistId, 
  monthKey, 
  onEdit, 
  onDelete 
}: { 
  item: ChecklistItem, 
  userUid: string, 
  checklistId: string, 
  monthKey: string, 
  onEdit: () => void,
  onDelete: () => void
}) {
  const isPaid = item.payments?.[monthKey]?.isPaid || false;
  const transactionId = item.payments?.[monthKey]?.transactionId;

  const historyStats = useMemo(() => {
    const paidMonths = Object.values(item.payments || {}).filter(p => p.isPaid);
    const count = paidMonths.length;
    const total = count * item.amount;
    return { count, total };
  }, [item.payments, item.amount]);

  return (
    <div className={`flex items-center gap-4 p-5 rounded-[2rem] border-none shadow-sm transition-all group ${isPaid ? 'bg-muted/50' : 'bg-card hover:shadow-md'}`}>
      <Checkbox 
        checked={isPaid} 
        onCheckedChange={() => toggleChecklistItem(userUid, checklistId, item.id, monthKey)}
        className="w-7 h-7 rounded-xl border-2"
      />
      <div className="flex-1 min-w-0">
        <p className={`font-black text-base truncate ${isPaid ? 'line-through text-muted-foreground' : ''}`}>{item.name}</p>
        <div className="flex flex-col gap-1.5 mt-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-black text-primary">RM{item.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            {transactionId && (
              <span className="flex items-center gap-1 bg-emerald-100 text-emerald-600 px-2 py-0.5 rounded-full text-[10px] font-black">
                <CheckCircle2 className="w-3 h-3" /> DIREKOD
              </span>
            )}
          </div>
          {historyStats.count > 0 && (
            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground bg-primary/5 w-fit px-3 py-1 rounded-xl border border-primary/10">
              <History className="w-3 h-3 text-primary/50" />
              <span>Sudah dibayar <b className="text-foreground">{historyStats.count} kali</b> (Jumlah: RM{historyStats.total.toLocaleString()})</span>
            </div>
          )}
        </div>
      </div>
      <div className="flex items-center gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
        <Button variant="ghost" size="icon" onClick={onEdit} className="rounded-full h-10 w-10 text-muted-foreground hover:text-primary">
          <Edit2 className="w-5 h-5" />
        </Button>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={onDelete}
          className="rounded-full h-10 w-10 text-muted-foreground hover:text-rose-500 hover:bg-rose-50"
          title="Sembunyikan bulan ini"
        >
          <EyeOff className="w-5 h-5" />
        </Button>
      </div>
    </div>
  );
}
