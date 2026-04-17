import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { inventoryService } from '../services/inventoryService';
import { addRecord } from '../services/offlineDB';
import { Product, Party } from '../types';
import { Button, Input, SearchableSelect, Card } from '../components/UI';
import { Camera, Trash2, Upload, Download, RefreshCw } from '../components/Icons';
import { useInventory } from '../src/context/InventoryContext';

const Products: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const editId = searchParams.get('edit');

  const { products: allProducts, parties: partiesList, loading, initialLoadDone, fetchInitialData } = useInventory();
  const [loadingProduct, setLoadingProduct] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const [preview, setPreview] = useState<string | null>(null);
  
  // Store all products for efficient auto-fill lookup without re-rendering
  const allProductsRef = useRef<Product[]>([]);
  
  useEffect(() => {
    if (!initialLoadDone) {
      fetchInitialData();
    }
  }, [initialLoadDone, fetchInitialData]);

  useEffect(() => {
    allProductsRef.current = allProducts;
  }, [allProducts]);

  const productNameOptions = useMemo(() => {
    const uniqueNames = Array.from(new Set(allProducts.map(p => p.productName)))
      .filter(Boolean)
      .sort();
    return uniqueNames.map(name => ({ value: name, label: name }));
  }, [allProducts]);

  const manufacturingNameOptions = useMemo(() => {
    const uniqueManuf = Array.from(new Set(allProducts.map(p => p.manufacturingName)))
      .filter(Boolean)
      .sort();
    return uniqueManuf.map(name => ({ value: name, label: name }));
  }, [allProducts]);

  // Refs for field navigation
  const partyRef = useRef<HTMLInputElement>(null);
  const productRef = useRef<HTMLInputElement>(null);
  const invoiceRef = useRef<HTMLInputElement>(null);
  const manufRef = useRef<HTMLInputElement>(null);
  const rateRef = useRef<HTMLInputElement>(null);
  const batchRef = useRef<HTMLInputElement>(null);
  const expiryRef = useRef<HTMLInputElement>(null);
  const submitBtnRef = useRef<HTMLButtonElement>(null);

  const [recentImage, setRecentImage] = useState<string | null>(() => {
    try {
      return sessionStorage.getItem('medstore_recent_image');
    } catch (e) {
      return null;
    }
  });
  
  const [formData, setFormData] = useState({
    id: undefined as string | undefined,
    manufacturingName: '',
    invoiceDate: new Date().toISOString().split('T')[0],
    productName: '',
    partyId: '',
    batchNo: '',
    expiryDate: '',
    purchaseRate: '',
    imageBase64: '' as string | null,
    createdAt: undefined as number | undefined
  });

  useEffect(() => {
    const loadInit = async () => {
      if (editId) {
        setLoadingProduct(true);
        try {
            // Fetch FULL product data directly from local DB to get the image_base64
            const p = await inventoryService.getProductById(editId);
            if (p) {
                setFormData({
                    id: p.id,
                    manufacturingName: p.manufacturingName || '',
                    invoiceDate: p.invoiceDate,
                    productName: p.productName,
                    partyId: p.partyId,
                    batchNo: p.batchNo,
                    expiryDate: p.expiryDate || '',
                    purchaseRate: p.purchaseRate ? p.purchaseRate.toString() : '',
                    imageBase64: p.imageBase64 || null,
                    createdAt: p.createdAt
                });
                setPreview(p.imageBase64 || null);
            }
        } catch (e) {
            console.warn("Error loading product details:", e);
        } finally {
            setLoadingProduct(false);
        }
      }
    };
    
    // We only need to wait for editId, we don't strictly need allProducts to be loaded
    // but we might want to wait for initialLoadDone if we want to ensure parties are there
    if (editId) {
        loadInit();
    }
  }, [editId]);

  const handleKeyDown = (e: React.KeyboardEvent, nextRef: React.RefObject<HTMLElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (nextRef.current) {
        const element = nextRef.current;
        element.focus();
        // Give time for mobile keyboard to deploy and layout to adjust
        setTimeout(() => {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 100);
      }
    }
  };

  const handleProductNameChange = (val: string) => {
    setFormData(prev => {
        const match = allProductsRef.current.find(
            p => p.productName.toLowerCase() === val.trim().toLowerCase()
        );

        return {
            ...prev,
            productName: val,
            manufacturingName: match?.manufacturingName || prev.manufacturingName
        };
    });
  };

  const compressImage = (base64: string): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = base64;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 800;
        const MAX_HEIGHT = 800;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.7)); // Compress to 70% quality JPEG
      };
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result as string;
        const compressed = await compressImage(base64);
        setFormData(prev => ({ ...prev, imageBase64: compressed }));
        setPreview(compressed);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUseRecentImage = () => {
    if (recentImage) {
      setFormData(prev => ({ ...prev, imageBase64: recentImage }));
      setPreview(recentImage);
    }
  };

  const handleDownloadImage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!preview) return;
    
    const link = document.createElement('a');
    link.href = preview;
    const safeName = (formData.productName || 'image').replace(/[^a-z0-9]/gi, '_').toLowerCase();
    link.download = `product-${safeName}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.partyId) return alert('Please select a Party');
    if (!formData.productName) return alert('Product Name is required');

    setIsSaving(true);
    const product: Product = {
      id: formData.id || crypto.randomUUID(),
      createdAt: formData.createdAt || Date.now(),
      productName: formData.productName,
      manufacturingName: formData.manufacturingName,
      invoiceDate: formData.invoiceDate,
      partyId: formData.partyId,
      batchNo: formData.batchNo,
      expiryDate: formData.expiryDate ? formData.expiryDate : undefined,
      purchaseRate: formData.purchaseRate ? parseFloat(formData.purchaseRate) : undefined,
      imageBase64: formData.imageBase64,
      synced: 1,
      deleted: 0
    };

    try {
        // Ensure we use snake_case for the DB fields as expected by addRecord
        const dbProduct = {
          id: product.id,
          product_name: product.productName,
          manufacturing_name: product.manufacturingName,
          invoice_date: product.invoiceDate,
          batch_no: product.batchNo,
          expiry_date: product.expiryDate,
          purchase_rate: product.purchaseRate,
          image_base64: product.imageBase64,
          party_id: product.partyId,
          created_at: new Date(product.createdAt).toISOString()
        };

        await addRecord('products', dbProduct);
        console.log("Product saved successfully:", dbProduct);
        
        // Refresh context state
        await fetchInitialData(true);
        
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 2000);
        
        if (formData.imageBase64) {
            setRecentImage(formData.imageBase64);
            try {
                sessionStorage.setItem('medstore_recent_image', formData.imageBase64);
            } catch (err) {
                console.warn('Image too large for session storage, kept in memory.');
            }
        }

        if (editId) {
            navigate('/');
        } else {
            setFormData(prev => ({
                ...prev,
                productName: '',
                manufacturingName: '', 
                batchNo: '',
                expiryDate: '',
                purchaseRate: '',
                imageBase64: null,
                id: undefined,
                createdAt: undefined
            }));
            setPreview(null);
            
            setTimeout(() => {
                productRef.current?.focus();
                productRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 100);
        }
    } catch (err: any) {
        alert("Error saving: " + (err.message || "Unknown error"));
    } finally {
        setIsSaving(false);
    }
  };

  const clearImage = (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setFormData(prev => ({...prev, imageBase64: null}));
      setPreview(null);
  };

  if (loadingProduct) {
      return (
          <div className="flex flex-col items-center justify-center h-[70vh] gap-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-primary"></div>
              <p className="text-gray-600 dark:text-gray-300 font-medium text-lg">Fetching details... please wait</p>
          </div>
      );
  }

  return (
    <div className="w-full px-1 pb-32">
      <Card className="border-t-4 border-t-primary shadow-xl overflow-visible dark:bg-gray-800 dark:border-t-primary dark:border-gray-700">
        <div className="p-1 mb-6 relative">
           <h2 className="text-2xl font-extrabold text-gray-800 dark:text-white border-b border-gray-100 dark:border-gray-700 pb-4">
               {editId ? 'Edit Product' : 'Add Inventory'}
           </h2>
           
           {showSuccess && (
             <div className="absolute top-0 right-0 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg animate-in fade-in slide-in-from-top-4 duration-300 flex items-center gap-2 z-50">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                <span className="font-bold">Saved!</span>
             </div>
           )}
        </div>
        
        <form onSubmit={handleSubmit} className="flex flex-col gap-8">
          
          <div className="flex flex-col gap-8">
             <div onKeyDown={(e) => handleKeyDown(e, productRef)}>
                <SearchableSelect 
                    inputRef={partyRef}
                    label="Party Name" 
                    value={formData.partyId}
                    options={partiesList.map(p => ({ value: p.id, label: p.name }))}
                    onChange={(val) => setFormData(prev => ({...prev, partyId: val}))}
                    placeholder="Search Party..."
                />
             </div>

             <div onKeyDown={(e) => handleKeyDown(e, invoiceRef)}>
                 <SearchableSelect 
                    inputRef={productRef}
                    label="Product Name" 
                    value={formData.productName}
                    options={productNameOptions}
                    onChange={handleProductNameChange}
                    placeholder="Add product name"
                    className="font-bold text-lg"
                 />
             </div>

             <Input 
                ref={invoiceRef}
                label="Invoice Date" 
                type="date"
                value={formData.invoiceDate}
                onChange={e => setFormData({...formData, invoiceDate: e.target.value})}
                onKeyDown={(e) => handleKeyDown(e, manufRef)}
             />

             <div onKeyDown={(e) => handleKeyDown(e, rateRef)}>
                <SearchableSelect 
                    inputRef={manufRef}
                    label="Manufacturing Name" 
                    value={formData.manufacturingName}
                    options={manufacturingNameOptions}
                    onChange={(val) => setFormData(prev => ({...prev, manufacturingName: val}))}
                    placeholder="Add manufacturing name"
                />
             </div>

             <Input 
                ref={rateRef}
                label="Purchase Rate" 
                type="number"
                step="0.01"
                value={formData.purchaseRate}
                onChange={e => setFormData({...formData, purchaseRate: e.target.value})}
                placeholder="0.00"
                onKeyDown={(e) => handleKeyDown(e, batchRef)}
             />

             <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                 <Input 
                    ref={batchRef}
                    label="Batch Number" 
                    value={formData.batchNo}
                    onChange={e => setFormData({...formData, batchNo: e.target.value})}
                    placeholder="Batch-001"
                    onKeyDown={(e) => handleKeyDown(e, expiryRef)}
                 />
                 <Input 
                    ref={expiryRef}
                    label="Expiry Date" 
                    type="date"
                    value={formData.expiryDate}
                    onChange={e => setFormData({...formData, expiryDate: e.target.value})}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            e.preventDefault();
                            if (submitBtnRef.current) {
                                const element = submitBtnRef.current;
                                element.focus();
                                setTimeout(() => {
                                  element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                }, 100);
                            }
                        }
                    }}
                 />
             </div>
          </div>

          <div className="w-full pt-4 border-t border-gray-100 dark:border-gray-700 mt-2">
             <div className="flex items-center justify-between mb-3">
                 <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Product Photo (Optional)
                 </label>
                 
                 {recentImage && !preview && (
                    <button 
                        type="button" 
                        onClick={handleUseRecentImage}
                        className="text-xs flex items-center gap-1 text-primary hover:text-teal-700 dark:text-teal-400 font-semibold bg-teal-50 dark:bg-teal-900/30 px-3 py-2 rounded-lg border border-teal-100 dark:border-teal-800 transition-colors animate-in fade-in active:scale-95"
                    >
                        <Upload className="w-4 h-4" /> Use Recent Image
                    </button>
                 )}
             </div>
             <div className="w-full h-52 bg-gray-50 dark:bg-gray-900 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl flex flex-col items-center justify-center relative overflow-hidden hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors group">
                {preview ? (
                    <>
                        <img src={preview} alt="Preview" className="w-full h-full object-contain p-2" referrerPolicy="no-referrer" />
                        <div className="absolute top-3 right-3 flex flex-col gap-2 z-20">
                            <button 
                                type="button"
                                onClick={handleDownloadImage}
                                className="bg-white dark:bg-gray-700 p-2.5 rounded-full shadow-lg text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors pointer-events-auto"
                                title="Download Image"
                            >
                                <Download className="w-6 h-6"/>
                            </button>
                            
                            <button 
                               type="button"
                               onClick={clearImage}
                               className="bg-white dark:bg-gray-700 p-2.5 rounded-full shadow-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors pointer-events-auto"
                               title="Remove Image"
                            >
                                <Trash2 className="w-6 h-6"/>
                            </button>
                        </div>
                    </>
                ) : (
                    <div className="text-gray-400 flex flex-col items-center">
                        <div className="p-4 bg-white dark:bg-gray-800 rounded-full shadow-sm mb-3 group-hover:scale-110 transition-transform">
                           <Camera className="w-8 h-8 text-primary" />
                        </div>
                        <span className="text-base font-medium text-gray-500 dark:text-gray-400">
                            Tap to capture
                        </span>
                    </div>
                )}
                <input 
                    type="file" 
                    accept="image/*" 
                    capture="environment"
                    onChange={handleFileChange}
                    className="absolute inset-0 opacity-0 cursor-pointer z-10"
                />
             </div>
          </div>

          <div className="pt-6 pb-4">
             <Button 
                ref={submitBtnRef}
                type="submit" 
                disabled={isSaving}
                className="w-full py-4 text-xl font-bold shadow-lg active:scale-[0.98] transition-transform rounded-xl flex items-center justify-center gap-2"
             >
                {isSaving ? (
                  <>
                    <RefreshCw className="w-6 h-6 animate-spin" />
                    Saving...
                  </>
                ) : (
                  editId ? 'Update Product' : 'Save to Inventory'
                )}
             </Button>
             
             {editId && (
                 <Button type="button" variant="secondary" className="w-full mt-4 py-3" onClick={() => navigate('/')}>
                    Cancel Edit
                 </Button>
             )}
          </div>
        </form>
      </Card>
    </div>
  );
};

export default Products;
