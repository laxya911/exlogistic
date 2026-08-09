import { useState, useEffect, useMemo } from 'react';
import { Forwarder } from '@/types';
import { toast } from 'sonner';

export type ForwarderSortField = 'name' | 'performanceRating' | 'averageLeadTime' | 'updatedDate';
export type SortOrder = 'asc' | 'desc';

export interface ForwarderFilterState {
  countries: string[];
  certifications: string[];
  statuses: string[];
}

export function useForwarders() {
  const [forwarders, setForwarders] = useState<Forwarder[]>([]);
  const [loading, setLoading] = useState(true);

  // Search
  const [searchQuery, setSearchQuery] = useState('');
  const [searchField, setSearchField] = useState<'all' | 'name' | 'email' | 'country' | 'certification'>('all');

  // Filters
  const [filters, setFilters] = useState<ForwarderFilterState>({
    countries: [],
    certifications: [],
    statuses: []
  });

  // Sorting
  const [sortBy, setSortBy] = useState<ForwarderSortField>('name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  // Selection
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 15;

  // Undo stack
  const [undoStack, setUndoStack] = useState<Forwarder[]>([]);

  useEffect(() => {
    fetchForwarders();
  }, []);

  const fetchForwarders = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/forwarders');
      if (!res.ok) throw new Error('Failed to retrieve forwarder matrix');
      const data = await res.json();
      setForwarders(data);
    } catch (e: any) {
      toast.error(e.message || 'Failed to sync forwarder matrix');
    } finally {
      setLoading(false);
    }
  };

  const createForwarder = async (payload: Partial<Forwarder>) => {
    try {
      const res = await fetch('/api/forwarders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to onboard forwarder');

      toast.success(`Vendor ${data.name} onboarded successfully`);
      await fetchForwarders();
      return { success: true, data };
    } catch (e: any) {
      toast.error(e.message || 'Onboarding failed');
      return { success: false, error: e.message };
    }
  };

  const updateForwarder = async (id: string, payload: Partial<Forwarder>) => {
    try {
      const res = await fetch(`/api/forwarders/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update vendor');

      toast.success(`Vendor ${data.name} profile updated`);
      await fetchForwarders();
      return { success: true, data };
    } catch (e: any) {
      toast.error(e.message || 'Update failed');
      return { success: false, error: e.message };
    }
  };

  const archiveForwarder = async (id: string) => {
    try {
      const res = await fetch(`/api/forwarders/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'ARCHIVE' })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Archive failed');

      toast.success(`Vendor ${data.name} account archived`);
      await fetchForwarders();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const restoreForwarder = async (id: string) => {
    try {
      const res = await fetch(`/api/forwarders/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'RESTORE' })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Restore failed');

      toast.success(`Vendor ${data.name} account restored`);
      await fetchForwarders();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const duplicateForwarder = async (id: string) => {
    try {
      const res = await fetch(`/api/forwarders/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'DUPLICATE' })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Duplication failed');

      toast.success(`Duplicated vendor profile: ${data.name}`);
      await fetchForwarders();
      return data;
    } catch (e: any) {
      toast.error(e.message);
      return null;
    }
  };

  const softDeleteForwarder = async (id: string) => {
    try {
      const target = forwarders.find(s => s.id === id);
      if (!target) return;

      const res = await fetch(`/api/forwarders/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Soft delete failed');

      setUndoStack(prev => [...prev, target]);

      toast.success(`Vendor ${target.name} soft-deleted`, {
        action: {
          label: 'Undo Delete',
          onClick: () => undoDelete(target.id)
        },
        duration: 8000
      });
      await fetchForwarders();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const undoDelete = async (targetId: string) => {
    try {
      const res = await fetch(`/api/forwarders/${targetId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'RESTORE' })
      });
      if (!res.ok) throw new Error('Failed to restore');

      toast.success('Vendor restored successfully');
      setUndoStack(prev => prev.filter(s => s.id !== targetId));
      await fetchForwarders();
    } catch (e: any) {
      toast.error('Restore failed');
    }
  };

  // Bulk Operations
  const bulkArchive = async (ids: string[]) => {
    try {
      await Promise.all(ids.map(id => 
        fetch(`/api/forwarders/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'ARCHIVE' })
        })
      ));
      toast.success(`Bulk archived ${ids.length} forwarders`);
      setSelectedIds([]);
      await fetchForwarders();
    } catch (e) {
      toast.error('Bulk archive operation failed');
    }
  };

  const bulkDelete = async (ids: string[]) => {
    try {
      await Promise.all(ids.map(id => fetch(`/api/forwarders/${id}`, { method: 'DELETE' })));
      toast.success(`Bulk soft-deleted ${ids.length} forwarders`);
      setSelectedIds([]);
      await fetchForwarders();
    } catch (e) {
      toast.error('Bulk delete operation failed');
    }
  };

  const bulkRestore = async (ids: string[]) => {
    try {
      await Promise.all(ids.map(id => 
        fetch(`/api/forwarders/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'RESTORE' })
        })
      ));
      toast.success(`Bulk restored ${ids.length} forwarders`);
      setSelectedIds([]);
      await fetchForwarders();
    } catch (e) {
      toast.error('Bulk restore operation failed');
    }
  };

  const bulkStatusUpdate = async (ids: string[], newStatus: Forwarder['entityStatus']) => {
    try {
      await Promise.all(ids.map(id => 
        fetch(`/api/forwarders/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'STATUS_UPDATE', status: newStatus })
        })
      ));
      toast.success(`Updated status to ${newStatus} for ${ids.length} forwarders`);
      setSelectedIds([]);
      await fetchForwarders();
    } catch (e) {
      toast.error('Bulk status update failed');
    }
  };

  const bulkExportCSV = (ids: string[]) => {
    const targets = forwarders.filter(s => ids.includes(s.id));
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
    link.setAttribute('download', `Forwarders_Export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`Exported ${targets.length} forwarders to CSV`);
  };

  // Filter, Search, and Sort Processed List
  const processedForwarders = useMemo(() => {
    let result = [...forwarders];

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
  }, [forwarders, searchQuery, searchField, filters, sortBy, sortOrder]);

  // Reset to page 1 on filter/search change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, searchField, filters, sortBy, sortOrder]);

  const paginatedForwarders = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return processedForwarders.slice(start, start + pageSize);
  }, [processedForwarders, currentPage]);

  const totalPages = Math.ceil(processedForwarders.length / pageSize);

  const filterOptions = useMemo(() => {
    const countries = Array.from(new Set(forwarders.map(s => s.country)));
    const certifications = Array.from(new Set(forwarders.flatMap(s => s.certifications)));

    return { countries, certifications };
  }, [forwarders]);

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
    forwarders: paginatedForwarders,
    allProcessedForwarders: processedForwarders,
    rawForwarders: forwarders,
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
    fetchForwarders,

    // CRUD & operations
    createForwarder,
    updateForwarder,
    archiveForwarder,
    restoreForwarder,
    duplicateForwarder,
    softDeleteForwarder,

    // Bulk
    bulkArchive,
    bulkDelete,
    bulkRestore,
    bulkStatusUpdate,
    bulkExportCSV
  };
}
