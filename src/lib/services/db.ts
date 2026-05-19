// Prisma-backed database service layer.
export interface Book {
  id: string;
  name: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  netBalance: number;
  totalCashIn: number;
  totalCashOut: number;
  customCategories: string[];
}

export interface Transaction {
  id: string;
  bookId: string;
  userId: string;
  type: 'in' | 'out';
  amount: number;
  method: 'Cash' | 'Online';
  category: string;
  description?: string;
  timestamp: string;
  runningBalance: number;
}

export interface MonthlyPayment {
  isPaid: boolean;
  transactionId?: string;
  amountOverride?: number;
}

export interface ChecklistItem {
  id: string;
  name: string;
  amount: number;
  isFixed?: boolean;
  payments: { [monthKey: string]: MonthlyPayment };
  validFrom?: string; // <--- TAMBAH INI
  validUntil?: string;
  excludedMonths?: string[];
  amountFrom?: { [monthKey: string]: number };
}

export interface Checklist {
  id: string;
  userId: string;
  name: string;
  bookId?: string;
  items: ChecklistItem[];
  createdAt: string;
  updatedAt: string;
}

type ActionPayload = Record<string, any>;

const requestDb = async <T>(action: string, data: ActionPayload): Promise<T> => {
  const res = await fetch('/api/db', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, data })
  });

  const body = await res.json();
  if (!res.ok) {
    throw new Error(body.error || 'Ralat semasa berkomunikasi dengan pangkalan data');
  }

  return body as T;
};

export const requestDbWithoutPayload = async <T>(action: string): Promise<T> => requestDb<T>(action, {});

export const getLocalTransactions = (bookId: string): Transaction[] => {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(`flowsnap_txs_${bookId}`) || '[]');
  } catch {
    return [];
  }
};

export const createBook = async (userId: string, name: string) => {
  return requestDb<Book>('createBook', { userId, name });
};

export const deleteBook = async (bookId: string) => {
  return requestDb<{ success: boolean }>('deleteBook', { bookId });
};

export const addCategoryToBook = async (bookId: string, category: string) => {
  return requestDb<{ success: boolean }>('addCategoryToBook', { bookId, category });
};

export const deleteCategoryFromBook = async (bookId: string, category: string) => {
  return requestDb<{ success: boolean }>('deleteCategoryFromBook', { bookId, category });
};

export const subscribeToBooks = (userId: string, callback: (books: Book[]) => void) => {
  const update = async () => {
    const books = await requestDb<Book[]>('getBooksByUser', { userId });
    callback(books);
  };

  update();
  const interval = setInterval(update, 1000);
  return () => clearInterval(interval);
};

export const subscribeToBook = (bookId: string, callback: (book: Book | null) => void) => {
  const update = async () => {
    const book = await requestDb<Book | null>('getBookById', { id: bookId });
    callback(book);
  };

  update();
  const interval = setInterval(update, 1000);
  return () => clearInterval(interval);
};

export const getTransactionsByBook = async (bookId: string) => {
  return requestDb<Transaction[]>('getTransactionsByBook', { bookId });
};

export const addTransaction = async (userId: string, bookId: string, data: any) => {
  return requestDb<Transaction>('addTransaction', { userId, bookId, ...data });
};

export const updateTransaction = async (userId: string, bookId: string, txId: string, data: any) => {
  return requestDb<Transaction>('updateTransaction', { userId, bookId, txId, ...data });
};

export const deleteTransaction = async (bookId: string, txId: string) => {
  return requestDb<{ success: boolean }>('deleteTransaction', { bookId, txId });
};

export const subscribeToTransactions = (bookId: string, filters: any, callback: (txs: Transaction[]) => void) => {
  const update = async () => {
    const txs = await getTransactionsByBook(bookId);
    callback(txs);
  };

  update();
  const interval = setInterval(update, 1000);
  return () => clearInterval(interval);
};

export const createChecklist = async (userId: string, name: string, bookId?: string) => {
  return requestDb<Checklist>('createChecklist', { userId, name, bookId });
};

export const updateChecklist = async (id: string, name: string, bookId?: string) => {
  return requestDb<Checklist>('updateChecklist', { id, name, bookId });
};

export const deleteChecklist = async (id: string) => {
  return requestDb<{ success: boolean }>('deleteChecklist', { id });
};

export const subscribeToChecklists = (userId: string, callback: (data: Checklist[]) => void) => {
  const update = async () => {
    const data = await requestDb<Checklist[]>('getChecklistsByUser', { userId });
    callback(data);
  };

  update();
  const interval = setInterval(update, 1000);
  return () => clearInterval(interval);
};

export const subscribeToChecklist = (id: string, callback: (data: Checklist | null) => void) => {
  const update = async () => {
    const data = await requestDb<Checklist | null>('getChecklistById', { id });
    callback(data);
  };

  update();
  const interval = setInterval(update, 1000);
  return () => clearInterval(interval);
};

export const addChecklistItem = async (
  checklistId: string,
  name: string,
  amount: number,
  validUntil?: string,
  validFrom?: string // <--- TAMBAH PARAMETER INI
) => {
  // Pastikan validFrom dihantar ke backend
  return requestDb<Checklist>('addChecklistItem', { checklistId, name, amount, validUntil, validFrom });
};

export const updateChecklistItem = async (userId: string, checklistId: string, itemId: string, name: string, amount: number, monthKey?: string, editMonthOnly?: boolean, validUntil?: string) => {
  return requestDb<Checklist>('updateChecklistItem', { userId, checklistId, itemId, name, amount, monthKey, editMonthOnly, validUntil });
};

export const toggleChecklistItem = async (userId: string, checklistId: string, itemId: string, monthKey: string) => {
  return requestDb<Checklist>('toggleChecklistItem', { userId, checklistId, itemId, monthKey });
};

export const excludeItemFromMonth = async (checklistId: string, itemId: string, monthKey: string) => {
  return requestDb<Checklist>('excludeChecklistItem', { checklistId, itemId, monthKey });
};

export const restoreItemForMonth = async (checklistId: string, itemId: string, monthKey: string) => {
  return requestDb<Checklist>('restoreChecklistItem', { checklistId, itemId, monthKey });
};

export const deleteChecklistItem = async (checklistId: string, itemId: string) => {
  return requestDb<Checklist>('deleteChecklistItem', { checklistId, itemId });
};

export const deleteUserData = async (userId: string) => {
  return requestDb<{ success: boolean }>('deleteUserData', { userId });
};

export interface BackupPayload {
  schemaVersion: number;
  exportedAt: string;
  exportedBy?: string;
  books: any[];
  transactions: any[];
  checklists: any[];
}

export const exportUserData = async (userId: string) => {
  return requestDb<BackupPayload>('exportUserData', { userId });
};

export const importUserData = async (
  userId: string,
  payload: BackupPayload,
  mode: 'merge' | 'replace'
) => {
  return requestDb<{
    success: boolean;
    booksImported: number;
    transactionsImported: number;
    checklistsImported: number;
  }>('importUserData', { userId, payload, mode });
};
