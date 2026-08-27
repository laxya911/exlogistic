import { useState, useEffect, useMemo } from 'react';
import { Customer } from '@/types';
import { toast } from 'sonner';

export type CustomerSortField = 'name' | 'creditLimit' | 'status' | 'country' | 'updatedDate';
export type SortOrder = 'asc' | 'desc';

export interface CustomerFilterState {
  countries: string[];
  segments: string[];
  statuses: string[];
}

export function useCustomers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

  // Search
  const [searchQuery, setSearchQuery] = useState('');
  const [searchField, setSearchField] = useState<'all' | 'name' | 'email' | 'country' | 'segment'>('all');

  // Filters
  const [filters, setFilters] = useState<CustomerFilterState>({
    countries: [],
    segments: [],
    statuses: []
  });

  // Sorting
  const [sortBy, setSortBy] = useState<CustomerSortField>('name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  // Selection
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Undo stack
  const [undoStack, setUndoStack] = useState<Customer[]>([]);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 15;

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/customers');
      if (!res.ok) throw new Error('Failed to retrieve client matrix');
      const data = await res.json();
      setCustomers(data);
    } catch (e: any) {
      toast.error(e.message || 'Failed to sync client matrix');
    } finally {
      setLoading(false);
    }
  };

  const createCustomer = async (payload: Partial<Customer>) => {
    try {
      const res = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to onboard client');

      toast.success(`Client ${data.name} onboarded successfully`);
      await fetchCustomers();
      return { success: true, data };
    } catch (e: any) {
      toast.error(e.message || 'Onboarding failed');
      return { success: false, error: e.message };
    }
  };

  const updateCustomer = async (id: string, payload: Partial<Customer>) => {
    try {
      const res = await fetch(`/api/customers/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update client');

      toast.success(`Client ${data.name} profile updated`);
      setCustomers(prev => prev.map(c => c.id === id ? data : c));
      fetchCustomers();
      return { success: true, data };
    } catch (e: any) {
      toast.error(e.message || 'Update failed');
      return { success: false, error: e.message };
    }
  };

  const archiveCustomer = async (id: string) => {
    try {
      const res = await fetch(`/api/customers/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'ARCHIVE' })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Archive failed');

      toast.success(`Client ${data.name} account archived`);
      setCustomers(prev => prev.map(c => c.id === id ? data : c));
      fetchCustomers();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const restoreCustomer = async (id: string) => {
    try {
      const res = await fetch(`/api/customers/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'RESTORE' })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Restore failed');

      toast.success(`Client ${data.name} account restored`);
      setCustomers(prev => prev.map(c => c.id === id ? data : c));
      fetchCustomers();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const duplicateCustomer = async (id: string) => {
    try {
      const res = await fetch(`/api/customers/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'DUPLICATE' })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Duplication failed');

      toast.success(`Duplicated client profile: ${data.name}`);
      await fetchCustomers();
      return data;
    } catch (e: any) {
      toast.error(e.message);
      return null;
    }
  };

  const softDeleteCustomer = async (id: string) => {
    try {
      const target = customers.find(c => c.id === id);
      if (!target) return;

      const res = await fetch(`/api/customers/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Soft delete failed');

      setUndoStack(prev => [...prev, target]);

      toast.success(`Client ${target.name} soft-deleted`, {
        action: {
          label: 'Undo Delete',
          onClick: () => undoDelete(target.id)
        },
        duration: 8000
      });
      await fetchCustomers();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const undoDelete = async (targetId: string) => {
    try {
      const res = await fetch(`/api/customers/${targetId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'RESTORE' })
      });
      if (!res.ok) throw new Error('Failed to restore');

      toast.success('Customer restored successfully');
      setUndoStack(prev => prev.filter(c => c.id !== targetId));
      await fetchCustomers();
    } catch (e: any) {
      toast.error('Restore failed');
    }
  };

  // Bulk Operations
  const bulkArchive = async (ids: string[]) => {
    try {
      await Promise.all(ids.map(id => 
        fetch(`/api/customers/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'ARCHIVE' })
        })
      ));
      toast.success(`Bulk archived ${ids.length} customers`);
      setSelectedIds([]);
      await fetchCustomers();
    } catch (e) {
      toast.error('Bulk archive operation failed');
    }
  };

  const bulkDelete = async (ids: string[]) => {
    try {
      await Promise.all(ids.map(id => fetch(`/api/customers/${id}`, { method: 'DELETE' })));
      toast.success(`Bulk soft-deleted ${ids.length} customers`);
      setSelectedIds([]);
      await fetchCustomers();
    } catch (e) {
      toast.error('Bulk delete operation failed');
    }
  };

  const bulkRestore = async (ids: string[]) => {
    try {
      await Promise.all(ids.map(id => 
        fetch(`/api/customers/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'RESTORE' })
        })
      ));
      toast.success(`Bulk restored ${ids.length} customers`);
      setSelectedIds([]);
      await fetchCustomers();
    } catch (e) {
      toast.error('Bulk restore operation failed');
    }
  };

  const bulkStatusUpdate = async (ids: string[], newStatus: Customer['entityStatus']) => {
    try {
      await Promise.all(ids.map(id => 
        fetch(`/api/customers/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'STATUS_UPDATE', status: newStatus })
        })
      ));
      toast.success(`Updated status to ${newStatus} for ${ids.length} customers`);
      setSelectedIds([]);
      await fetchCustomers();
    } catch (e) {
      toast.error('Bulk status update failed');
    }
  };

  const bulkExportCSV = (ids: string[]) => {
    const targets = customers.filter(c => ids.includes(c.id));
    if (targets.length === 0) return;

    const headers = ['ID', 'Name', 'Email', 'Phone', 'Country', 'Credit Limit', 'Payment Terms', 'Segment', 'Tax ID', 'Website'];
    const rows = targets.map(c => [
      c.id,
      `"${c.name.replace(/"/g, '""')}"`,
      c.email,
      c.phone,
      c.country,
      c.creditLimit,
      c.paymentTerms,
      c.segment,
      c.taxId || '',
      c.website || ''
    ]);

    const csvContent = [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Customers_Export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`Exported ${targets.length} customers to CSV`);
  };

  // Filter, Search, and Sort Processed List
  const processedCustomers = useMemo(() => {
    let result = [...customers];

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(c => {
        if (searchField === 'name') return c.name.toLowerCase().includes(q);
        if (searchField === 'email') return c.email.toLowerCase().includes(q);
        if (searchField === 'country') return c.country.toLowerCase().includes(q);
        if (searchField === 'segment') return c.segment.toLowerCase().includes(q);
        // Default All
        return (
          c.name.toLowerCase().includes(q) ||
          c.email.toLowerCase().includes(q) ||
          c.country.toLowerCase().includes(q) ||
          c.segment.toLowerCase().includes(q)
        );
      });
    }

    // Filter rules
    if (filters.countries.length > 0) {
      result = result.filter(c => filters.countries.includes(c.country));
    }
    if (filters.segments.length > 0) {
      result = result.filter(c => filters.segments.includes(c.segment));
    }
    if (filters.statuses.length > 0) {
      result = result.filter(c => filters.statuses.includes(c.entityStatus));
    }

    // Sorting rule
    result.sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'name') comparison = a.name.localeCompare(b.name);
      else if (sortBy === 'creditLimit') comparison = a.creditLimit - b.creditLimit;
      else if (sortBy === 'status') comparison = a.entityStatus.localeCompare(b.entityStatus);
      else if (sortBy === 'country') comparison = a.country.localeCompare(b.country);
      else if (sortBy === 'updatedDate') comparison = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();

      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [customers, searchQuery, searchField, filters, sortBy, sortOrder]);

  // Reset to page 1 on filter/search change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, searchField, filters, sortBy, sortOrder]);

  const paginatedCustomers = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return processedCustomers.slice(start, start + pageSize);
  }, [processedCustomers, currentPage]);

  const totalPages = Math.ceil(processedCustomers.length / pageSize);

  const filterOptions = useMemo(() => {
    const countries = Array.from(new Set(customers.map(c => c.country)));
    const segments = Array.from(new Set(customers.map(c => c.segment)));
    
    return { countries, segments };
  }, [customers]);

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
    customers: paginatedCustomers,
    allProcessedCustomers: processedCustomers,
    rawCustomers: customers,
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
    createCustomer,
    updateCustomer,
    archiveCustomer,
    restoreCustomer,
    duplicateCustomer,
    softDeleteCustomer,

    // Bulk
    bulkArchive,
    bulkDelete,
    bulkRestore,
    bulkStatusUpdate,
    bulkExportCSV
  };
}
