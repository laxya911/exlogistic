import { useState, useEffect, useMemo } from 'react';
import { Forwarder } from '@/types';
import { toast } from 'sonner';

export type ForwarderSortField = 'name' | 'rating' | 'country' | 'updatedDate';
export type SortOrder = 'asc' | 'desc';

export interface ForwarderFilterState {
  countries: string[];
  ports: string[];
  statuses: string[];
}

export function useForwarders() {
  const [forwarders, setForwarders] = useState<Forwarder[]>([]);
  const [loading, setLoading] = useState(true);

  // Search
  const [searchQuery, setSearchQuery] = useState('');
  const [searchField, setSearchField] = useState<'all' | 'name' | 'email' | 'country'>('all');

  // Filters
  const [filters, setFilters] = useState<ForwarderFilterState>({
    countries: [],
    ports: [],
    statuses: []
  });

  // Sorting
  const [sortBy, setSortBy] = useState<ForwarderSortField>('name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  // Selection
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

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
      if (!res.ok) throw new Error(data.error || 'Failed to onboard agency');

      toast.success(`Agency ${data.name} onboarded successfully`);
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
      if (!res.ok) throw new Error(data.error || 'Failed to update agency');

      toast.success(`Agency ${data.name} profile updated`);
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

      toast.success(`Agency ${data.name} account archived`);
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

      toast.success(`Agency ${data.name} account restored`);
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

      toast.success(`Duplicated agency profile: ${data.name}`);
      await fetchForwarders();
      return data;
    } catch (e: any) {
      toast.error(e.message);
      return null;
    }
  };

  const softDeleteForwarder = async (id: string) => {
    try {
      const target = forwarders.find(f => f.id === id);
      if (!target) return;

      const res = await fetch(`/api/forwarders/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Soft delete failed');

      setUndoStack(prev => [...prev, target]);

      toast.success(`Agency ${target.name} soft-deleted`, {
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

      toast.success('Agency restored successfully');
      setUndoStack(prev => prev.filter(f => f.id !== targetId));
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
    const targets = forwarders.filter(f => ids.includes(f.id));
    if (targets.length === 0) return;

    const headers = ['ID', 'Name', 'Email', 'Phone', 'Country', 'Rating', 'Preferred Ports', 'Tax ID', 'Website'];
    const rows = targets.map(f => [
      f.id,
      `"${f.name.replace(/"/g, '""')}"`,
      f.email,
      f.phone,
      f.country,
      f.rating,
      `"${f.preferredPorts.join(', ')}"`,
      f.taxId || '',
      f.website || ''
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
      result = result.filter(f => {
        if (searchField === 'name') return f.name.toLowerCase().includes(q);
        if (searchField === 'email') return f.email.toLowerCase().includes(q);
        if (searchField === 'country') return f.country.toLowerCase().includes(q);
        // Default All
        return (
          f.name.toLowerCase().includes(q) ||
          f.email.toLowerCase().includes(q) ||
          f.country.toLowerCase().includes(q)
        );
      });
    }

    // Filter rules
    if (filters.countries.length > 0) {
      result = result.filter(f => filters.countries.includes(f.country));
    }
    if (filters.ports.length > 0) {
      result = result.filter(f => f.preferredPorts.some(p => filters.ports.includes(p)));
    }
    if (filters.statuses.length > 0) {
      result = result.filter(f => filters.statuses.includes(f.entityStatus));
    }

    // Sorting rule
    result.sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'name') comparison = a.name.localeCompare(b.name);
      else if (sortBy === 'rating') comparison = b.rating - a.rating; // default high to low
      else if (sortBy === 'country') comparison = a.country.localeCompare(b.country);
      else if (sortBy === 'updatedDate') comparison = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();

      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [forwarders, searchQuery, searchField, filters, sortBy, sortOrder]);

  const filterOptions = useMemo(() => {
    const countries = Array.from(new Set(forwarders.map(f => f.country)));
    const ports = Array.from(new Set(forwarders.flatMap(f => f.preferredPorts)));

    return { countries, ports };
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
    forwarders: processedForwarders,
    rawForwarders: forwarders,
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
