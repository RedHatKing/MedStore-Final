
import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { Product, Party } from '../../types';
import { inventoryService } from '../../services/inventoryService';

interface InventoryContextType {
  products: Product[];
  parties: Party[];
  loading: boolean;
  error: string | null;
  initialLoadDone: boolean;
  fetchInitialData: (force?: boolean) => Promise<void>;
  loadMoreProducts: () => Promise<void>;
  hasMore: boolean;
  updateProductInState: (product: Product) => void;
  removeProductFromState: (id: string) => void;
}

const InventoryContext = createContext<InventoryContextType | undefined>(undefined);

const CACHE_KEY_PRODUCTS = 'medstore_products_cache';
const CACHE_KEY_PARTIES = 'medstore_parties_cache';

export const InventoryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Initialize from Dexie for local-first persistence
  const [products, setProducts] = useState<Product[]>([]);
  const [parties, setParties] = useState<Party[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [initialLoadDone, setInitialLoadDone] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  
  const isFetchingRef = useRef(false);
  const pageRef = useRef(0);
  const PAGE_SIZE = 50;

  const fetchInitialData = useCallback(async (force = false) => {
    if (isFetchingRef.current && !force) return;
    
    try {
      isFetchingRef.current = true;
      setLoading(true);
      setError(null);
      
      console.log('InventoryContext: Fetching local data from Dexie...');
      
      const [pData, partyData] = await Promise.all([
        inventoryService.getProductsLight(0, PAGE_SIZE - 1),
        inventoryService.getParties()
      ]);
      
      setProducts(pData);
      setParties(partyData);
      setInitialLoadDone(true);
      setHasMore(pData.length === PAGE_SIZE);
      pageRef.current = 1;
      
      console.log('InventoryContext: Local data loaded successfully');
    } catch (error) {
      console.error('InventoryContext: Error fetching local data:', error);
      setError('Failed to load local database.');
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  }, []);

  const loadMoreProducts = useCallback(async () => {
    if (isFetchingRef.current || !hasMore) return;
    
    try {
      isFetchingRef.current = true;
      const from = pageRef.current * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;
      
      const newProducts = await inventoryService.getProductsLight(from, to);
      
      if (newProducts.length > 0) {
        setProducts(prev => {
          const existingIds = new Set(prev.map((p: Product) => p.id));
          const uniqueNew = newProducts.filter((p: Product) => !existingIds.has(p.id));
          return [...prev, ...uniqueNew];
        });
        pageRef.current += 1;
      }
      
      setHasMore(newProducts.length === PAGE_SIZE);
    } catch (error) {
      console.error('InventoryContext: Error loading more products:', error);
    } finally {
      isFetchingRef.current = false;
    }
  }, [hasMore]);

  const updateProductInState = useCallback((product: Product) => {
    setProducts(prev => {
      const index = prev.findIndex(p => p.id === product.id);
      if (index !== -1) {
        const newProducts = [...prev];
        newProducts[index] = product;
        return newProducts;
      } else {
        return [product, ...prev];
      }
    });
  }, []);

  const removeProductFromState = useCallback((id: string) => {
    setProducts(prev => prev.filter(p => p.id !== id));
  }, []);

  // Initial load
  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  return (
    <InventoryContext.Provider value={{
      products,
      parties,
      loading,
      initialLoadDone,
      fetchInitialData,
      error,
      loadMoreProducts,
      hasMore,
      updateProductInState,
      removeProductFromState
    }}>
      {children}
    </InventoryContext.Provider>
  );
};

export const useInventory = () => {
  const context = useContext(InventoryContext);
  if (context === undefined) {
    throw new Error('useInventory must be used within an InventoryProvider');
  }
  return context;
};
