
import React, { useState, useMemo, useEffect } from 'react';
import { inventoryService } from '../services/inventoryService';
import { Product, formatDate, Party } from '../types';
import { Search, Edit, Trash2, RefreshCw } from '../components/Icons';
import { Card, Button } from '../components/UI';
import { useNavigate } from 'react-router-dom';
import { useInventory } from '../src/context/InventoryContext';

const ExpiredProducts: React.FC = () => {
  const navigate = useNavigate();
  const { products: allProducts, parties: allParties, loading, initialLoadDone, fetchInitialData } = useInventory();
  const [searchTerm, setSearchTerm] = useState('');
  
  // Delete Modal State
  const [productToDelete, setProductToDelete] = useState<string | null>(null);

  useEffect(() => {
    if (!initialLoadDone) {
      fetchInitialData();
    }
  }, [initialLoadDone, fetchInitialData]);

  const parties = useMemo(() => {
    const partyMap: Record<string, string> = {};
    allParties.forEach(p => partyMap[p.id] = p.name);
    return partyMap;
  }, [allParties]);

  const products = useMemo(() => {
    // Filter: Show ALL products that have an expiry date
    const expiredList = allProducts.filter(p => !!p.expiryDate);

    // Sort by expiry date (ascending - closest/oldest dates first)
    expiredList.sort((a, b) => {
        if (!a.expiryDate || !b.expiryDate) return 0;
        return new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime();
    });

    return expiredList;
  }, [allProducts]);

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

  const filteredProducts = products.filter(p => {
    const term = searchTerm.toLowerCase();
    return (
      p.productName.toLowerCase().includes(term) ||
      (p.manufacturingName || '').toLowerCase().includes(term) ||
      (parties[p.partyId] || '').toLowerCase().includes(term) ||
      p.batchNo.toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-4 pt-2 relative">
      {/* Search Bar */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-3 border border-gray-300 dark:border-gray-600 rounded-xl leading-5 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 sm:text-sm shadow-sm"
            placeholder="Search items with expiry dates..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button variant="secondary" onClick={() => fetchInitialData(true)} disabled={loading}>
          <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {/* Product List */}
      {loading && allProducts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <RefreshCw className="w-8 h-8 text-primary animate-spin" />
          <p className="text-gray-500 dark:text-gray-400 text-sm">Loading inventory...</p>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="text-center py-10 text-gray-400 bg-white dark:bg-gray-800 rounded-xl border border-dashed border-gray-300 dark:border-gray-700">
          <p>{searchTerm ? 'No products match your search.' : 'No products with expiry dates found.'}</p>
        </div>
      ) : (
        <div className="grid gap-3 pb-20">
          {filteredProducts.map((product) => {
            const today = new Date();
            // Reset time to midnight for accurate day comparison
            today.setHours(0,0,0,0);
            
            const expDate = new Date(product.expiryDate!);
            // Compare timestamps
            const isExpired = expDate < today;
            
            // Calculate days difference for display/logic if needed
            const diffTime = expDate.getTime() - today.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
            const isNearExpiry = diffDays <= 30 && diffDays >= 0;

            let statusColor = 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300';
            let borderColor = 'border-l-gray-300 dark:border-l-gray-600';

            if (isExpired) {
                statusColor = 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200';
                borderColor = 'border-l-red-600';
            } else if (isNearExpiry) {
                statusColor = 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
                borderColor = 'border-l-orange-400';
            } else {
                statusColor = 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
                borderColor = 'border-l-green-500';
            }

             return (
                <Card key={product.id} className={`flex gap-3 items-center relative overflow-hidden border-l-4 ${borderColor}`}>
                {/* Content (Clickable to Edit) */}
                <div 
                    className="flex-1 min-w-0 cursor-pointer" 
                    onClick={() => navigate(`/products?edit=${product.id}`)}
                >
                    <div className="flex justify-between items-start">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white truncate">{product.productName}</h3>
                    </div>

                    <p className="text-sm text-gray-600 dark:text-gray-300 truncate">
                      {parties[product.partyId] || 'No Party Assigned'}
                    </p>
                    
                    <div className="mt-2 flex flex-wrap gap-2 text-xs text-gray-500 dark:text-gray-400 items-center">
                        <span className="bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">Batch: {product.batchNo}</span>
                        {product.purchaseRate !== undefined && (
                            <span className="bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 px-2 py-0.5 rounded font-medium">
                                Rate: Rs. {product.purchaseRate}
                            </span>
                        )}
                        {product.expiryDate && (
                            <span className={`px-2 py-0.5 rounded font-bold flex items-center gap-1 ${statusColor}`}>
                                {isExpired ? 'EXPIRED' : isNearExpiry ? 'EXPIRING SOON' : 'VALID'} : {formatDate(product.expiryDate)}
                            </span>
                        )}
                    </div>
                </div>

                {/* Actions Column */}
                <div className="flex flex-col gap-2 shrink-0 border-l border-gray-100 dark:border-gray-700 pl-3">
                    <button 
                        onClick={() => navigate(`/products?edit=${product.id}`)}
                        className="p-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-full hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
                        title="Edit Product"
                    >
                        <Edit className="w-4 h-4" />
                    </button>
                    <button 
                        onClick={(e) => { e.stopPropagation(); setProductToDelete(product.id); }}
                        className="p-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-full hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
                        title="Delete Product"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
                </Card>
          )})}
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
              Are you sure you want to delete this product? This will remove it from your inventory permanently.
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

export default ExpiredProducts;
