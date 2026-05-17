import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import { subscribeToBook, Book } from "@/lib/services/db";


interface FilterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  currentFilter: any;
  onApply: (filter: any) => void;
  bookId: string;
}

export function FilterDrawer({ isOpen, onClose, currentFilter, onApply, bookId }: FilterDrawerProps) {
  const [filter, setFilter] = useState(currentFilter);
  const [book, setBook] = useState<Book | null>(null);

  useEffect(() => {
    if (bookId && isOpen) {
      const unsub = subscribeToBook(bookId, (data) => setBook(data));
      return () => unsub();
    }
  }, [bookId, isOpen]);

  useEffect(() => {
    if (isOpen) {
      setFilter(currentFilter);
    }
  }, [isOpen, currentFilter]);

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="bottom" className="rounded-t-[2.5rem] p-8 border-none">
        <SheetHeader>
          <SheetTitle className="text-2xl font-black text-center mb-6">Tapis Transaksi</SheetTitle>
        </SheetHeader>

        <div className="space-y-6 py-4">

          {/* Date Range Filter */}
          <div className="space-y-2">
            <Label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Julat Tarikh</Label>
            <div className="flex items-center gap-3">
              <div className="flex-1 space-y-1">
                <span className="text-[10px] text-muted-foreground font-semibold">Dari</span>
                <Input
                  type="date"
                  className="h-12 rounded-xl"
                  value={filter.dateFrom || ''}
                  onChange={(e) => setFilter({ ...filter, dateFrom: e.target.value })}
                />
              </div>
              <div className="flex-1 space-y-1">
                <span className="text-[10px] text-muted-foreground font-semibold">Hingga</span>
                <Input
                  type="date"
                  className="h-12 rounded-xl"
                  value={filter.dateTo || ''}
                  onChange={(e) => setFilter({ ...filter, dateTo: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* Transaction Type Filter */}
          <div className="space-y-2">
            <Label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Jenis Transaksi</Label>
            <Select value={filter.type || 'All'} onValueChange={(v) => setFilter({ ...filter, type: v })}>
              <SelectTrigger className="h-12 rounded-xl">
                <SelectValue placeholder="Semua Jenis" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="All">Semua Jenis</SelectItem>
                <SelectItem value="in">
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" /> Masuk
                  </span>
                </SelectItem>
                <SelectItem value="out">
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-rose-500" /> Keluar
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Payment Method Filter */}
          <div className="space-y-2">
            <Label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Kaedah Pembayaran</Label>
            <Select value={filter.method} onValueChange={(v) => setFilter({ ...filter, method: v })}>
              <SelectTrigger className="h-12 rounded-xl">
                <SelectValue placeholder="Semua Kaedah" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="All">Semua Kaedah</SelectItem>
                <SelectItem value="Cash">Tunai</SelectItem>
                <SelectItem value="Online">Online</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Category Filter */}
          <div className="space-y-2">
            <Label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Kategori</Label>
            <details className="relative">
              <summary className="w-full h-12 rounded-xl border bg-background px-4 text-sm flex items-center justify-between cursor-pointer list-none">
                <span className={filter.categories?.length > 0 ? 'text-foreground font-bold' : 'text-muted-foreground'}>
                  {filter.categories?.length > 0 ? `${filter.categories.length} dipilih` : 'Semua Kategori'}
                </span>
                <span className="text-muted-foreground">▼</span>
              </summary>
              <div className="mt-1 border rounded-xl bg-background shadow-lg p-2 flex flex-col gap-1">
                {book?.customCategories?.map((cat) => {
                  const selected = (filter.categories || []).includes(cat);
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => {
                        const current = filter.categories || [];
                        const updated = selected
                          ? current.filter((c: string) => c !== cat)
                          : [...current, cat];
                        setFilter({ ...filter, categories: updated });
                      }}
                      className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all text-left ${selected ? 'bg-primary/10 text-primary' : 'hover:bg-muted'
                        }`}
                    >
                      <span className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 ${selected ? 'bg-primary border-primary' : 'border-muted-foreground'
                        }`}>
                        {selected && <span className="text-white text-[10px]">✓</span>}
                      </span>
                      {cat}
                    </button>
                  );
                })}
              </div>
            </details>
          </div>
        </div>

        <SheetFooter className="mt-8 flex flex-row gap-4">
          <Button variant="outline" className="flex-1 h-12 rounded-xl font-bold" onClick={() => {
            const reset = { method: 'All', category: 'All', categories: [], type: 'All', dateFrom: '', dateTo: '' };
            setFilter(reset);
            onApply(reset);
            onClose();
          }}>Set Semula</Button>
          <Button className="flex-1 h-12 rounded-xl font-bold" onClick={() => {
            onApply(filter);
            onClose();
          }}>Guna Tapisan</Button>
        </SheetFooter>

      </SheetContent>
    </Sheet>
  );
}