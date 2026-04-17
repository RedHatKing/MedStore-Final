
import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { inventoryService } from '../services/inventoryService';
import { Product, Party, formatDate } from '../types';
import { Search, Trash2, Edit, RefreshCw, Package, Calendar, User } from '../components/Icons';
import { Card, Button } from '../components/UI';
import { useNavigate } from 'react-router-dom';
import { useInventory } from '../src/context/InventoryContext';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { 
    products, 
    parties, 
    loading, 
    error,
    initialLoadDone, 
    fetchInitialData, 
    loadMoreProducts, 
    hasMore,
    updateProductInState,
    removeProductFromState
  } = useInventory();

  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [productToDelete, setProductToDelete] = useState<string | null>(null);
  const observer = useRef<IntersectionObserver | null>(null);

  const lastProductElementRef = useCallback((node: HTMLDivElement) => {
    if (loading || searchTerm.length > 0) return; // Disable infinite scroll during search
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        console.log('Dashboard: Loading more products...');
        loadMoreProducts();
      }
    });
    if (node) observer.current.observe(node);
  }, [loading, hasMore, loadMoreProducts, searchTerm]);

  // Server-side search logic with debounce
  useEffect(() => {
    if (searchTerm.trim().length === 0) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      setIsSearching(true);
      try {
        console.log(`Dashboard: Searching for "${searchTerm}"...`);
        const results = await inventoryService.searchProducts(searchTerm);
        setSearchResults(results);
      } catch (error) {
        console.error('Dashboard: Search failed:', error);
      } finally {
        setIsSearching(false);
      }
    }, 500); // 500ms debounce

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  useEffect(() => {
    // Priority: high - trigger fetch as soon as possible if not done
    if (!initialLoadDone) {
      fetchInitialData();
    }
  }, [initialLoadDone, fetchInitialData]);

  const partyMap = useMemo(() => {
    const map: Record<string, string> = {};
    parties.forEach(p => map[p.id] = p.name);
    return map;
  }, [parties]);

  const confirmDelete = async () => {
    if (productToDelete) {
      try {
        await inventoryService.deleteProduct(productToDelete);
        setProductToDelete(null);
      } catch (error) {
        alert('Failed to delete product. Please try again.');
      }
    }
  };

  const displayProducts = searchTerm.trim().length > 0 ? searchResults : products;

  const handleManualRefresh = () => {
    console.log('Dashboard: Manual refresh triggered');
    fetchInitialData(true);
  };

  return (
    <div className="space-y-4 h-full flex flex-col pt-2">
      <div className="relative shrink-0 z-10 flex gap-2">
        <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className={`h-5 w-5 ${isSearching ? 'text-primary animate-pulse' : 'text-gray-400'}`} />
            </div>
            <input
            type="text"
            className="block w-full pl-10 pr-3 py-3 border border-gray-300 dark:border-gray-600 rounded-xl leading-5 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary sm:text-sm shadow-sm"
            placeholder="Search all products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            />
        </div>
        <button 
            onClick={handleManualRefresh}
            className={`p-3 rounded-xl bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-primary ${loading ? 'animate-spin' : ''}`}
            title="Refresh Data"
        >
            <RefreshCw className="w-5 h-5" />
        </button>
      </div>

      {error && products.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4 text-center px-6">
          <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-full">
            <RefreshCw className="w-8 h-8 text-red-500" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Database Error</h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm max-w-xs">
              {error}
            </p>
          </div>
        </div>
      ) : (loading && products.length === 0) || (isSearching && searchResults.length === 0) ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <RefreshCw className="w-8 h-8 text-primary animate-spin" />
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              {isSearching ? 'Searching database...' : 'Loading local inventory...'}
            </p>
          </div>
      ) : displayProducts.length === 0 ? (
        <div className="text-center py-10 text-gray-400 bg-white dark:bg-gray-800 rounded-xl border border-dashed border-gray-300 dark:border-gray-700">
          <p>{searchTerm ? `No matches found for "${searchTerm}"` : 'Inventory is empty.'}</p>
        </div>
      ) : (
        <div className="grid gap-4 pb-20">
          {displayProducts.map((product, index) => {
             const isExpiring = product.expiryDate && new Date(product.expiryDate) <= new Date(new Date().setDate(new Date().getDate() + 30));
             const isLastElement = index === displayProducts.length - 1;
             
             return (
            <Card 
              key={product.id} 
              ref={isLastElement ? lastProductElementRef : null}
              className={`flex gap-4 relative overflow-hidden ${isExpiring ? 'border-red-300 dark:border-red-800 ring-1 ring-red-100 dark:ring-red-900/20' : ''}`}
            >
              <div className="w-20 h-20 flex-shrink-0 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-600 flex flex-col items-center justify-center text-gray-300 dark:text-gray-500">
                <Package className="w-8 h-8" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white truncate">{product.productName}</h3>
                  <div className="flex gap-2">
                     <button onClick={() => navigate(`/products?edit=${product.id}`)} className="text-blue-500 hover:text-blue-600 p-1">
                        <Edit className="w-4 h-4" />
                     </button>
                    <button onClick={() => setProductToDelete(product.id)} className="text-red-500 hover:text-red-600 p-1">
                        <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-300 truncate">
                  <User className="w-3 h-3 shrink-0" />
                  <span className="truncate">{partyMap[product.partyId] || 'No Party'}</span>
                </div>
                
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500 dark:text-gray-400">
                   <span className="bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">Batch: {product.batchNo}</span>
                   {product.purchaseRate !== undefined && (
                       <span className="bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 px-2 py-0.5 rounded font-medium">
                         Rate: Rs. {product.purchaseRate}
                       </span>
                   )}
                   {product.expiryDate ? (
                       <span className={`px-2 py-0.5 rounded flex items-center gap-1 ${isExpiring ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 font-bold' : 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300'}`}>
                         <Calendar className="w-3 h-3" />
                         Exp: {formatDate(product.expiryDate)}
                       </span>
                   ) : (
                       <span className="bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded text-gray-600 dark:text-gray-400">No Exp</span>
                   )}
                </div>
              </div>
            </Card>
          )})}
          
          {loading && initialLoadDone && (
            <div className="flex justify-center py-4">
              <RefreshCw className="w-6 h-6 text-primary animate-spin" />
            </div>
          )}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {productToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-sm w-full p-6 border border-gray-100 dark:border-gray-700 transform transition-all scale-100">
            <div className="flex items-center gap-3 mb-4 text-red-600 dark:text-red-500">
                <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-full">
                    <Trash2 className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Delete Product?</h3>
            </div>
            <p className="text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
              Are you sure you want to delete this product? This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <Button variant="secondary" onClick={() => setProductToDelete(null)}>Cancel</Button>
              <Button variant="danger" onClick={confirmDelete}>Yes, Delete</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
