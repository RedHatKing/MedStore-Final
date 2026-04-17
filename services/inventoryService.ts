import { addRecord, getRecords, db } from './offlineDB';
import { Party, Product } from '../types';

// --- Mapping Helpers ---
// These maintain compatibility between UI (camelCase) and Local DB (snake_case)
const mapProductFromDB = (p: any): Product => ({
  id: p.id,
  productName: p.product_name || '',
  manufacturingName: p.manufacturing_name || '',
  invoiceDate: p.invoice_date || '',
  batchNo: p.batch_no || '',
  expiryDate: p.expiry_date || undefined,
  purchaseRate: p.purchase_rate ? Number(p.purchase_rate) : undefined,
  imageBase64: p.image_base64 || null,
  partyId: p.party_id || '',
  createdAt: typeof p.created_at === 'string' ? new Date(p.created_at).getTime() : p.created_at,
  synced: 1,
  deleted: 0
});

const mapProductToDB = (p: Product) => ({
  id: p.id,
  product_name: p.productName || 'Unnamed Product',
  manufacturing_name: p.manufacturingName || null,
  invoice_date: p.invoiceDate || new Date().toISOString().split('T')[0],
  batch_no: p.batchNo || null,
  expiry_date: p.expiryDate || null,
  purchase_rate: p.purchaseRate || null,
  image_base64: p.imageBase64 || null,
  party_id: p.partyId && p.partyId.length > 0 ? p.partyId : null,
  created_at: new Date(p.createdAt || Date.now()).toISOString()
});

const mapPartyFromDB = (p: any): Party => ({
  id: p.id,
  name: p.name || '',
  address: p.address || '',
  contact: p.contact || '',
  createdAt: typeof p.created_at === 'string' ? new Date(p.created_at).getTime() : p.created_at,
  synced: 1,
  deleted: 0
});

const mapPartyToDB = (p: Party) => ({
  id: p.id,
  name: p.name || 'Unnamed Party',
  address: p.address || null,
  contact: p.contact || null,
  created_at: new Date(p.createdAt || Date.now()).toISOString()
});

/**
 * inventoryService (Local-First via Dexie.js)
 * Function names preserved to ensure zero breakage in UI components.
 */
export const inventoryService = {
  // --- Parties ---
  async getParties(): Promise<Party[]> {
    const data = await getRecords('parties');
    // Sort by name locally
    return data
      .map(mapPartyFromDB)
      .sort((a: Party, b: Party) => a.name.localeCompare(b.name));
  },

  async saveParty(party: Party): Promise<void> {
    await addRecord('parties', mapPartyToDB(party));
  },

  async deleteParty(id: string): Promise<void> {
    await db.table('parties').delete(id);
  },

  async getPartyById(id: string): Promise<Party | null> {
    const data = await db.table('parties').get(id);
    if (!data) return null;
    return mapPartyFromDB(data);
  },

  // --- Products ---
  async getProducts(from = 0, to = 49): Promise<Product[]> {
    const limit = to - from + 1;
    const data = await db.table('products')
      .orderBy('created_at')
      .reverse()
      .offset(from)
      .limit(limit)
      .toArray();
    return data.map(mapProductFromDB);
  },

  async getProductsLight(from = 0, to = 49): Promise<Product[]> {
    // In local DB, we fetch full records as it's fast enough, 
    // but we could optimize by selecting specific fields if needed.
    return this.getProducts(from, to);
  },

  async searchProducts(searchTerm: string): Promise<Product[]> {
    const term = searchTerm.toLowerCase();
    const data = await db.table('products')
      .filter((p: any) => p.product_name.toLowerCase().includes(term))
      .toArray();
    
    return data
      .map(mapProductFromDB)
      .sort((a: Product, b: Product) => b.createdAt - a.createdAt);
  },

  async getProductById(id: string): Promise<Product | null> {
    const data = await db.table('products').get(id);
    if (!data) return null;
    return mapProductFromDB(data);
  },

  async saveProduct(p: Product): Promise<void> {
    await addRecord('products', mapProductToDB(p));
  },

  async deleteProduct(id: string): Promise<void> {
    await db.table('products').delete(id);
  },

  // --- Realtime (Simulated for Offline) ---
  subscribeToChanges(onProductChange: (payload: any) => void, onPartyChange: (payload: any) => void) {
    console.log('Realtime subscriptions disabled in offline mode.');
    // Return a no-op unsubscribe function
    return () => {};
  }
};
