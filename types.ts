export interface Party {
  id: string;
  name: string;
  address: string;
  contact: string;
  createdAt: number;
  synced: number;
  deleted: number;
}

export interface Product {
  id: string;
  manufacturingName: string; 
  invoiceDate: string; // YYYY-MM-DD
  productName: string;
  partyId: string;
  batchNo: string;
  expiryDate?: string; // YYYY-MM-DD (Optional)
  purchaseRate?: number;
  imageBase64?: string | null;
  createdAt: number;
  synced: number;
  deleted: number;
}

export interface BackupData {
  version: number;
  timestamp: string;
  parties: Party[];
  products: Product[];
}

// Helper for formatted dates
export const formatDate = (dateStr?: string): string => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
};