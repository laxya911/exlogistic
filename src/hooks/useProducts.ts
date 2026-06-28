import { useState, useEffect, useMemo } from 'react';
import { Product } from '@/types';
import { toast } from 'sonner';

export type ProductSortField = 'name' | 'sku' | 'price' | 'weight' | 'updatedDate';
export type SortOrder = 'asc' | 'desc';

export interface FilterState {
  categories: string[];
  brands: string[];
  statuses: string[];
  countries: string[];
  suppliers: string[];
  hsnCodes: string[];
}

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Search
  const [searchQuery, setSearchQuery] = useState('');
  const [searchField, setSearchField] = useState<'all' | 'sku' | 'hsn' | 'brand' | 'category'>('all');
  
  // Filtering
  const [filters, setFilters] = useState<FilterState>({
    categories: [],
    brands: [],
    statuses: [],
    countries: [],
    suppliers: [],
    hsnCodes: []
  });

  // Sorting
  const [sortBy, setSortBy] = useState<ProductSortField>('name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  // Multi-Selection
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
  // Undo soft-delete stack
  const [undoStack, setUndoStack] = useState<Product[]>([]);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/products');
      if (!res.ok) throw new Error('Failed to retrieve products');
      const data = await res.json();
      setProducts(data);
    } catch (e: any) {
      toast.error(e.message || 'Failed to sync product matrix');
    } finally {
      setLoading(false);
    }
  };

  const createProduct = async (productPayload: Partial<Product>) => {
    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productPayload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to register product');
      
      toast.success(`Product ${data.name} successfully registered`);
      await fetchProducts();
      return { success: true, data };
    } catch (e: any) {
      toast.error(e.message || 'Registration failed');
      return { success: false, error: e.message };
    }
  };

  const updateProduct = async (id: string, productPayload: Partial<Product>) => {
    try {
      const res = await fetch(`/api/products/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productPayload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update product');
      
      toast.success(`Product ${data.name} updated`);
      await fetchProducts();
      return { success: true, data };
    } catch (e: any) {
      toast.error(e.message || 'Update failed');
      return { success: false, error: e.message };
    }
  };

  const archiveProduct = async (id: string) => {
    try {
      const res = await fetch(`/api/products/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'ARCHIVE' })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Archive failed');
      
      toast.success(`Product ${data.name} archived`);
      await fetchProducts();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const restoreProduct = async (id: string) => {
    try {
      const res = await fetch(`/api/products/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'RESTORE' })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Restore failed');
      
      toast.success(`Product ${data.name} restored to active matrix`);
      await fetchProducts();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const duplicateProduct = async (id: string) => {
    try {
      const res = await fetch(`/api/products/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'DUPLICATE' })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Duplication failed');
      
      toast.success(`Duplicated to product: ${data.name}`);
      await fetchProducts();
      return data;
    } catch (e: any) {
      toast.error(e.message);
      return null;
    }
  };

  const softDeleteProduct = async (id: string) => {
    try {
      const target = products.find(p => p.id === id);
      if (!target) return;

      const res = await fetch(`/api/products/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Soft delete failed');
      
      // Store in undo stack
      setUndoStack(prev => [...prev, target]);
      
      toast.success(`Product ${target.name} soft-deleted`, {
        action: {
          label: 'Undo Delete',
          onClick: () => undoDelete(target.id)
        },
        duration: 8000
      });
      await fetchProducts();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const undoDelete = async (targetId: string) => {
    try {
      const res = await fetch(`/api/products/${targetId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'RESTORE' })
      });
      if (!res.ok) throw new Error('Failed to restore');
      
      toast.success('Product restored successfully');
      setUndoStack(prev => prev.filter(p => p.id !== targetId));
      await fetchProducts();
    } catch (e: any) {
      toast.error('Restore failed');
    }
  };

  // Bulk Operations
  const bulkArchive = async (ids: string[]) => {
    try {
      await Promise.all(ids.map(id => 
        fetch(`/api/products/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'ARCHIVE' })
        })
      ));
      toast.success(`Bulk archived ${ids.length} products`);
      setSelectedIds([]);
      await fetchProducts();
    } catch (e) {
      toast.error('Bulk archive operation failed');
    }
  };

  const bulkDelete = async (ids: string[]) => {
    try {
      await Promise.all(ids.map(id => fetch(`/api/products/${id}`, { method: 'DELETE' })));
      toast.success(`Bulk soft-deleted ${ids.length} products`);
      setSelectedIds([]);
      await fetchProducts();
    } catch (e) {
      toast.error('Bulk delete operation failed');
    }
  };

  const bulkRestore = async (ids: string[]) => {
    try {
      await Promise.all(ids.map(id => 
        fetch(`/api/products/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'RESTORE' })
        })
      ));
      toast.success(`Bulk restored ${ids.length} products`);
      setSelectedIds([]);
      await fetchProducts();
    } catch (e) {
      toast.error('Bulk restore operation failed');
    }
  };

  const bulkStatusUpdate = async (ids: string[], newStatus: Product['entityStatus']) => {
    try {
      await Promise.all(ids.map(id => 
        fetch(`/api/products/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'STATUS_UPDATE', status: newStatus })
        })
      ));
      toast.success(`Updated status to ${newStatus} for ${ids.length} products`);
      setSelectedIds([]);
      await fetchProducts();
    } catch (e) {
      toast.error('Bulk status update failed');
    }
  };

  const bulkExportCSV = (ids: string[]) => {
    const targets = products.filter(p => ids.includes(p.id));
    if (targets.length === 0) return;

    const headers = ['SKU', 'Name', 'Category', 'Brand', 'Country of Origin', 'HS Code', 'UOM', 'Purchase Price', 'Selling Price', 'MOQ', 'Gross Weight', 'CBM'];
    const rows = targets.map(p => [
      p.sku,
      `"${p.name.replace(/"/g, '""')}"`,
      p.category,
      p.brand,
      p.countryOfOrigin,
      p.hsnCode,
      p.uom,
      p.purchasePrice,
      p.sellingPrice,
      p.moq,
      p.grossWeight,
      p.cbm
    ]);

    const csvContent = [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Products_Export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`Exported ${targets.length} products to CSV`);
  };

  // Compute processed products list (Search, Filter, Sort)
  const processedProducts = useMemo(() => {
    let result = [...products];

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(p => {
        if (searchField === 'sku') return p.sku.toLowerCase().includes(q);
        if (searchField === 'hsn') return p.hsnCode.toLowerCase().includes(q);
        if (searchField === 'brand') return p.brand.toLowerCase().includes(q);
        if (searchField === 'category') return p.category.toLowerCase().includes(q);
        // Default All fields
        return (
          p.name.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q) ||
          p.hsnCode.toLowerCase().includes(q) ||
          p.brand.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q)
        );
      });
    }

    // Filter rules
    if (filters.categories.length > 0) {
      result = result.filter(p => filters.categories.includes(p.category));
    }
    if (filters.brands.length > 0) {
      result = result.filter(p => filters.brands.includes(p.brand));
    }
    if (filters.statuses.length > 0) {
      result = result.filter(p => filters.statuses.includes(p.entityStatus));
    }
    if (filters.countries.length > 0) {
      result = result.filter(p => filters.countries.includes(p.countryOfOrigin));
    }
    if (filters.suppliers.length > 0) {
      result = result.filter(p => filters.suppliers.includes(p.supplierId));
    }
    if (filters.hsnCodes.length > 0) {
      result = result.filter(p => filters.hsnCodes.includes(p.hsnCode));
    }

    // Sorting rule
    result.sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'name') comparison = a.name.localeCompare(b.name);
      else if (sortBy === 'sku') comparison = a.sku.localeCompare(b.sku);
      else if (sortBy === 'price') comparison = a.sellingPrice - b.sellingPrice;
      else if (sortBy === 'weight') comparison = a.grossWeight - b.grossWeight;
      else if (sortBy === 'updatedDate') comparison = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();

      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [products, searchQuery, searchField, filters, sortBy, sortOrder]);

  // Options for filtering selects (extracted dynamically from current products)
  const filterOptions = useMemo(() => {
    const categories = Array.from(new Set(products.map(p => p.category)));
    const brands = Array.from(new Set(products.map(p => p.brand)));
    const countries = Array.from(new Set(products.map(p => p.countryOfOrigin)));
    const suppliers = Array.from(new Set(products.map(p => p.supplierId)));
    const hsnCodes = Array.from(new Set(products.map(p => p.hsnCode)));
    
    return { categories, brands, countries, suppliers, hsnCodes };
  }, [products]);

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const selectAll = (ids: string[]) => {
    setSelectedIds(prev => 
      prev.length === ids.length ? [] : ids
    );
  };

  return {
    products: processedProducts,
    rawProducts: products,
    loading,
    searchQuery,
    setSearchQuery,
    searchField,
    setSearchField,
    filters,
    setFilters,
    filterOptions,
    sortBy,
    setSortBy,
    sortOrder,
    setSortOrder,
    selectedIds,
    setSelectedIds,
    toggleSelect,
    selectAll,
    
    // CRUD & operations
    createProduct,
    updateProduct,
    archiveProduct,
    restoreProduct,
    duplicateProduct,
    softDeleteProduct,
    
    // Bulk
    bulkArchive,
    bulkDelete,
    bulkRestore,
    bulkStatusUpdate,
    bulkExportCSV
  };
}
