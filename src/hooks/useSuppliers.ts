import { useState, useEffect, useMemo } from 'react';
import { Supplier } from '@/types';
import { toast } from 'sonner';

export type SupplierSortField = 'name' | 'performanceRating' | 'averageLeadTime' | 'updatedDate';
export type SortOrder = 'asc' | 'desc';

export interface SupplierFilterState {
  countries: string[];
  certifications: string[];
  statuses: string[];
}

export function useSuppliers() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);

  // Search
  const [searchQuery, setSearchQuery] = useState('');
  const [searchField, setSearchField] = useState<'all' | 'name' | 'email' | 'country' | 'certification'>('all');

  // Filters
  const [filters, setFilters] = useState<SupplierFilterState>({
    countries: [],
    certifications: [],
    statuses: []
  });

  // Sorting
  const [sortBy, setSortBy] = useState<SupplierSortField>('name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  // Selection
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 15;

  // Undo stack
  const [undoStack, setUndoStack] = useState<Supplier[]>([]);

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/suppliers');
      if (!res.ok) throw new Error('Failed to retrieve supplier matrix');
      const data = await res.json();
      setSuppliers(data);
    } catch (e: any) {
      toast.error(e.message || 'Failed to sync supplier matrix');
    } finally {
      setLoading(false);
    }
  };

  const createSupplier = async (payload: Partial<Supplier>) => {
    try {
      const res = await fetch('/api/suppliers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to onboard supplier');

      toast.success(`Vendor ${data.name} onboarded successfully`);
      await fetchSuppliers();
      return { success: true, data };
    } catch (e: any) {
      toast.error(e.message || 'Onboarding failed');
      return { success: false, error: e.message };
    }
  };

  const updateSupplier = async (id: string, payload: Partial<Supplier>) => {
    try {
      const res = await fetch(`/api/suppliers/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update vendor');

      toast.success(`Vendor ${data.name} profile updated`);
      setSuppliers(prev => prev.map(s => s.id === id ? data : s));
      fetchSuppliers();
      return { success: true, data };
    } catch (e: any) {
      toast.error(e.message || 'Update failed');
      return { success: false, error: e.message };
    }
  };

  const archiveSupplier = async (id: string) => {
    try {
      const res = await fetch(`/api/suppliers/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'ARCHIVE' })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Archive failed');

      toast.success(`Vendor ${data.name} account archived`);
      setSuppliers(prev => prev.map(s => s.id === id ? data : s));
      fetchSuppliers();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const restoreSupplier = async (id: string) => {
    try {
      const res = await fetch(`/api/suppliers/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'RESTORE' })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Restore failed');

      toast.success(`Vendor ${data.name} account restored`);
      setSuppliers(prev => prev.map(s => s.id === id ? data : s));
      fetchSuppliers();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const duplicateSupplier = async (id: string) => {
    try {
      const res = await fetch(`/api/suppliers/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'DUPLICATE' })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Duplication failed');

      toast.success(`Duplicated vendor profile: ${data.name}`);
      await fetchSuppliers();
      return data;
    } catch (e: any) {
      toast.error(e.message);
      return null;
    }
  };

  const softDeleteSupplier = async (id: string) => {
    try {
      const target = suppliers.find(s => s.id === id);
      if (!target) return;

      const res = await fetch(`/api/suppliers/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Soft delete failed');

      setUndoStack(prev => [...prev, target]);

      toast.success(`Vendor ${target.name} soft-deleted`, {
        action: {
          label: 'Undo Delete',
          onClick: () => undoDelete(target.id)
        },
        duration: 8000
      });
      await fetchSuppliers();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const undoDelete = async (targetId: string) => {
    try {
      const res = await fetch(`/api/suppliers/${targetId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'RESTORE' })
      });
      if (!res.ok) throw new Error('Failed to restore');

      toast.success('Vendor restored successfully');
      setUndoStack(prev => prev.filter(s => s.id !== targetId));
      await fetchSuppliers();
    } catch (e: any) {
      toast.error('Restore failed');
    }
  };

  // Bulk Operations
  const bulkArchive = async (ids: string[]) => {
    try {
      await Promise.all(ids.map(id => 
        fetch(`/api/suppliers/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'ARCHIVE' })
        })
      ));
      toast.success(`Bulk archived ${ids.length} suppliers`);
      setSelectedIds([]);
      await fetchSuppliers();
    } catch (e) {
      toast.error('Bulk archive operation failed');
    }
  };

  const bulkDelete = async (ids: string[]) => {
    try {
      await Promise.all(ids.map(id => fetch(`/api/suppliers/${id}`, { method: 'DELETE' })));
      toast.success(`Bulk soft-deleted ${ids.length} suppliers`);
      setSelectedIds([]);
      await fetchSuppliers();
    } catch (e) {
      toast.error('Bulk delete operation failed');
    }
  };

  const bulkRestore = async (ids: string[]) => {
    try {
      await Promise.all(ids.map(id => 
        fetch(`/api/suppliers/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'RESTORE' })
        })
      ));
      toast.success(`Bulk restored ${ids.length} suppliers`);
      setSelectedIds([]);
      await fetchSuppliers();
    } catch (e) {
      toast.error('Bulk restore operation failed');
    }
  };

  const bulkStatusUpdate = async (ids: string[], newStatus: Supplier['entityStatus']) => {
    try {
      await Promise.all(ids.map(id => 
        fetch(`/api/suppliers/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'STATUS_UPDATE', status: newStatus })
        })
      ));
      toast.success(`Updated status to ${newStatus} for ${ids.length} suppliers`);
      setSelectedIds([]);
      await fetchSuppliers();
    } catch (e) {
      toast.error('Bulk status update failed');
    }
  };

  const bulkExportCSV = (ids: string[]) => {
    const targets = suppliers.filter(s => ids.includes(s.id));
    if (targets.length === 0) return;

    const headers = ['ID', 'Name', 'Email', 'Phone', 'Country', 'Performance Rating', 'Lead Time (Days)', 'Certifications', 'Payment Terms', 'Tax ID', 'Website'];
    const rows = targets.map(s => [
      s.id,
      `"${s.name.replace(/"/g, '""')}"`,
      s.email,
      s.phone,
      s.country,
      s.performanceRating,
      s.averageLeadTime,
      `"${s.certifications.join(', ')}"`,
      s.paymentTerms,
      s.taxId || '',
      s.website || ''
    ]);

    const csvContent = [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Suppliers_Export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`Exported ${targets.length} suppliers to CSV`);
  };

  // Filter, Search, and Sort Processed List
  const processedSuppliers = useMemo(() => {
    let result = [...suppliers];

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(s => {
        if (searchField === 'name') return s.name.toLowerCase().includes(q);
        if (searchField === 'email') return s.email.toLowerCase().includes(q);
        if (searchField === 'country') return s.country.toLowerCase().includes(q);
        if (searchField === 'certification') return s.certifications.some(c => c.toLowerCase().includes(q));
        // Default All
        return (
          s.name.toLowerCase().includes(q) ||
          s.email.toLowerCase().includes(q) ||
          s.country.toLowerCase().includes(q) ||
          s.certifications.some(c => c.toLowerCase().includes(q))
        );
      });
    }

    // Filter rules
    if (filters.countries.length > 0) {
      result = result.filter(s => filters.countries.includes(s.country));
    }
    if (filters.certifications.length > 0) {
      result = result.filter(s => s.certifications.some(c => filters.certifications.includes(c)));
    }
    if (filters.statuses.length > 0) {
      result = result.filter(s => filters.statuses.includes(s.entityStatus));
    }

    // Sorting rule
    result.sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'name') comparison = a.name.localeCompare(b.name);
      else if (sortBy === 'performanceRating') comparison = b.performanceRating - a.performanceRating; // default high to low
      else if (sortBy === 'averageLeadTime') comparison = a.averageLeadTime - b.averageLeadTime;
      else if (sortBy === 'updatedDate') comparison = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();

      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [suppliers, searchQuery, searchField, filters, sortBy, sortOrder]);

  // Reset to page 1 on filter/search change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, searchField, filters, sortBy, sortOrder]);

  const paginatedSuppliers = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return processedSuppliers.slice(start, start + pageSize);
  }, [processedSuppliers, currentPage]);

  const totalPages = Math.ceil(processedSuppliers.length / pageSize);

  const filterOptions = useMemo(() => {
    const countries = Array.from(new Set(suppliers.map(s => s.country)));
    const certifications = Array.from(new Set(suppliers.flatMap(s => s.certifications)));

    return { countries, certifications };
  }, [suppliers]);

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
    suppliers: paginatedSuppliers,
    allProcessedSuppliers: processedSuppliers,
    rawSuppliers: suppliers,
    loading,
    currentPage,
    setCurrentPage,
    totalPages,
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
    createSupplier,
    updateSupplier,
    archiveSupplier,
    restoreSupplier,
    duplicateSupplier,
    softDeleteSupplier,

    // Bulk
    bulkArchive,
    bulkDelete,
    bulkRestore,
    bulkStatusUpdate,
    bulkExportCSV
  };
}
