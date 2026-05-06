import { 
  collection, 
  addDoc, 
  query, 
  where, 
  onSnapshot, 
  orderBy, 
  serverTimestamp,
  updateDoc,
  doc,
  increment,
  getDoc,
  Timestamp,
  getDocs
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export interface Book {
  id: string;
  name: string;
  userId: string;
  createdAt: any;
  netBalance: number;
  totalCashIn: number;
  totalCashOut: number;
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
  timestamp: Timestamp;
  runningBalance: number;
}

export const createBook = async (userId: string, name: string) => {
  return await addDoc(collection(db, "books"), {
    userId,
    name,
    createdAt: serverTimestamp(),
    netBalance: 0,
    totalCashIn: 0,
    totalCashOut: 0
  });
};

export const subscribeToBooks = (userId: string, callback: (books: Book[]) => void) => {
  const q = query(collection(db, "books"), where("userId", "==", userId), orderBy("createdAt", "desc"));
  return onSnapshot(q, (snapshot) => {
    const books = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Book));
    callback(books);
  });
};

export const subscribeToTransactions = (bookId: string, filters: any, callback: (txs: Transaction[]) => void) => {
  let q = query(collection(db, `books/${bookId}/transactions`), orderBy("timestamp", "desc"));
  
  // Filtering logic would ideally be here, but for simpler Firestore rules and indices, 
  // we can also filter client-side for this mobile-first app version unless data is massive.
  return onSnapshot(q, (snapshot) => {
    const txs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transaction));
    callback(txs);
  });
};

export const addTransaction = async (userId: string, bookId: string, data: Omit<Transaction, 'id' | 'bookId' | 'userId' | 'timestamp' | 'runningBalance'>) => {
  const bookRef = doc(db, "books", bookId);
  const bookSnap = await getDoc(bookRef);
  
  if (!bookSnap.exists()) throw new Error("Book not found");
  
  const currentBalance = bookSnap.data().netBalance || 0;
  const newBalance = data.type === 'in' ? currentBalance + data.amount : currentBalance - data.amount;

  const txData = {
    ...data,
    userId,
    bookId,
    timestamp: Timestamp.now(),
    runningBalance: newBalance
  };

  const txRef = await addDoc(collection(db, `books/${bookId}/transactions`), txData);

  await updateDoc(bookRef, {
    netBalance: newBalance,
    totalCashIn: increment(data.type === 'in' ? data.amount : 0),
    totalCashOut: increment(data.type === 'out' ? data.amount : 0)
  });

  return txRef;
};