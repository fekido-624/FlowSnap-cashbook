"use client";

import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
    if (bookId) {
      const unsub = subscribeToBook(bookId, (data) => setBook(data));
      return () => unsub();
    }
  }, [bookId]);

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="bottom" className="rounded-t-[2.5rem] p-8 border-none">
        <SheetHeader>
          <SheetTitle className="text-2xl font-black text-center mb-6">Filter Transactions</SheetTitle>
        </SheetHeader>
        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <Label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Payment Method</Label>
            <Select value={filter.method} onValueChange={(v) => setFilter({ ...filter, method: v })}>
              <SelectTrigger className="h-12 rounded-xl">
                <SelectValue placeholder="All Methods" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="All">All Methods</SelectItem>
                <SelectItem value="Cash">Cash</SelectItem>
                <SelectItem value="Online">Online</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Category</Label>
            <Select value={filter.category} onValueChange={(v) => setFilter({ ...filter, category: v })}>
              <SelectTrigger className="h-12 rounded-xl">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="All">All Categories</SelectItem>
                {book?.customCategories.map((cat) => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <SheetFooter className="mt-8 flex flex-row gap-4">
          <Button variant="outline" className="flex-1 h-12 rounded-xl font-bold" onClick={() => {
            const reset = { method: 'All', category: 'All', dateRange: null };
            setFilter(reset);
            onApply(reset);
            onClose();
          }}>Reset</Button>
          <Button className="flex-1 h-12 rounded-xl font-bold" onClick={() => {
            onApply(filter);
            onClose();
          }}>Apply Filters</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
