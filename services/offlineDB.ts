import Dexie, { Table } from 'dexie';
import { Party, Product } from '../types';

/**
 * MedStoreOfflineDB Configuration
 * Local-First architecture using Dexie.js
 */
export class MedStoreDatabase extends Dexie {
  parties!: Table<any>;
  products!: Table<any>;

  constructor() {
    super('MedStoreOfflineDB');
    this.version(2).stores({
      parties: 'id, name, contact, created_at',
      products: 'id, product_name, batch_no, expiry_date, party_id, created_at'
    });
  }
}

export const db = new MedStoreDatabase();

/**
 * addRecord(tableName, data)
 * Saves a new entry or updates an existing one (upsert).
 * Ensures UUID strings are maintained for data portability across devices.
 */
export const addRecord = async (tableName: 'parties' | 'products', data: any) => {
  // Ensure the record has a UUID if it's a new entry
  if (!data.id) {
    data.id = crypto.randomUUID();
  }
  
  // Ensure created_at is set for new records
  if (!data.created_at) {
    data.created_at = new Date().toISOString();
  }

  try {
    const result = await db.table(tableName).put(data);
    console.log(`${tableName} saved successfully:`, data);
    return result;
  } catch (error) {
    console.error(`Error adding record to ${tableName}:`, error);
    throw error;
  }
};

/**
 * getRecords(tableName)
 * Fetches all records for the specified table.
 * Used for populating lists and tables in the UI.
 */
export const getRecords = async (tableName: 'parties' | 'products') => {
  try {
    return await db.table(tableName).toArray();
  } catch (error) {
    console.error(`Error fetching records from ${tableName}:`, error);
    throw error;
  }
};

/**
 * exportDatabase()
 * Returns the entire database content as a JSON object.
 * Critical for manual backups and cross-device syncing via JSON files.
 */
export const exportDatabase = async () => {
  try {
    const parties = await db.parties.toArray();
    const products = await db.products.toArray();
    
    return {
      appName: 'MedStore',
      exportDate: new Date().toISOString(),
      version: 1,
      data: {
        parties,
        products
      }
    };
  } catch (error) {
    console.error('Error exporting database:', error);
    throw error;
  }
};

/**
 * importDatabase(jsonData)
 * Clears current local storage and overwrites it with the provided JSON data.
 * Maintains UUID relationships (like party_id) during the process.
 */
export const importDatabase = async (jsonData: any) => {
  if (!jsonData || !jsonData.data) {
    throw new Error('Invalid database format provided for import.');
  }

  try {
    return await db.transaction('rw', db.parties, db.products, async () => {
      // Clear existing tables to prevent duplicate/stale data
      await db.parties.clear();
      await db.products.clear();

      // Bulk add imported data to maintain performance
      if (jsonData.data.parties && jsonData.data.parties.length > 0) {
        await db.parties.bulkAdd(jsonData.data.parties);
      }
      
      if (jsonData.data.products && jsonData.data.products.length > 0) {
        await db.products.bulkAdd(jsonData.data.products);
      }
      
      console.log('Database import successful.');
    });
  } catch (error) {
    console.error('Error importing database:', error);
    throw error;
  }
};
