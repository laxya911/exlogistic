import { useState, useEffect, useMemo } from 'react';
import { Quotation } from '@/types';
import { toast } from 'sonner';

export type QuotationSortField = 'quotationNo' | 'totalValue' | 'date' | 'marginPercentage' | 'status';
export type SortOrder = 'asc' | 'desc';

export interface QuotationFilterState {
  customerIds: string[];
  statuses: string[];
  incoterms: string[];
}

export function useQuotations() {
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [loading, setLoading] = useState(true);

  // Search
  const [searchQuery, setSearchQuery] = useState('');

  // Filters
  const [filters, setFilters] = useState<QuotationFilterState>({
    customerIds: [],
    statuses: [],
    incoterms: []
  });

  // Sorting
  const [sortBy, setSortBy] = useState<QuotationSortField>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  // Selection
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 15;

  // Undo stack
  const [undoStack, setUndoStack] = useState<Quotation[]>([]);

  useEffect(() => {
    fetchQuotations();
  }, []);

  const fetchQuotations = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/quotations');
      if (!res.ok) throw new Error('Failed to retrieve quotations');
      const data = await res.json();
      setQuotations(data);
    } catch (e: any) {
      toast.error(e.message || 'Failed to sync commercial proposals');
    } finally {
      setLoading(false);
    }
  };

  const createQuotation = async (payload: Partial<Quotation>) => {
    try {
      const res = await fetch('/api/quotations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to onboard quotation');

      toast.success(`Proposal ${data.quotationNo} created`);
      await fetchQuotations();
      return { success: true, data };
    } catch (e: any) {
      toast.error(e.message || 'Creation failed');
      return { success: false, error: e.message };
    }
  };

  const updateQuotation = async (id: string, payload: Partial<Quotation>) => {
    try {
      const res = await fetch(`/api/quotations/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to edit quotation');

      toast.success(`Proposal ${data.quotationNo} details updated`);
      await fetchQuotations();
      return { success: true, data };
    } catch (e: any) {
      toast.error(e.message || 'Update failed');
      return { success: false, error: e.message };
    }
  };

  const approveQuotation = async (id: string) => {
    try {
      const res = await fetch(`/api/quotations/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'approve' })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Approval failed');

      toast.success(`Proposal approved! Confirmed Sales Order: ${data.salesOrder?.orderNo}`);
      await fetchQuotations();
      return data;
    } catch (e: any) {
      toast.error(e.message);
      return null;
    }
  };

  const rejectQuotation = async (id: string) => {
    try {
      const res = await fetch(`/api/quotations/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reject' })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Rejection failed');

      toast.success(`Proposal ${data.quotationNo} rejected`);
      await fetchQuotations();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const sendQuotation = async (id: string) => {
    try {
      const res = await fetch(`/api/quotations/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'send' })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Sending failed');

      toast.success(`Proposal ${data.quotationNo} sent to client`);
      await fetchQuotations();
      return data;
    } catch (e: any) {
      toast.error(e.message);
      return null;
    }
  };

  const reviseQuotation = async (id: string) => {
    try {
      const res = await fetch(`/api/quotations/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'revise' })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Revision failed');

      toast.success(`Generated revised version draft: ${data.quotationNo} (v${data.version}.0)`);
      await fetchQuotations();
      return data;
    } catch (e: any) {
      toast.error(e.message);
      return null;
    }
  };

  const duplicateQuotation = async (id: string) => {
    try {
      const res = await fetch(`/api/quotations/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'duplicate' })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Duplication failed');

      toast.success(`Duplicated proposal: ${data.quotationNo}`);
      await fetchQuotations();
      return data;
    } catch (e: any) {
      toast.error(e.message);
      return null;
    }
  };

  const softDeleteQuotation = async (id: string) => {
    try {
      const target = quotations.find(q => q.id === id);
      if (!target) return;

      const res = await fetch(`/api/quotations/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Soft delete failed');

      setUndoStack(prev => [...prev, target]);

      toast.success(`Proposal ${target.quotationNo} soft-deleted`, {
        action: {
          label: 'Undo',
          onClick: () => undoDelete(target.id)
        },
        duration: 8000
      });
      await fetchQuotations();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const undoDelete = async (targetId: string) => {
    try {
      const res = await fetch(`/api/quotations/${targetId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'restore' })
      });
      if (!res.ok) throw new Error('Failed to restore');

      toast.success('Proposal restored successfully');
      setUndoStack(prev => prev.filter(q => q.id !== targetId));
      await fetchQuotations();
    } catch (e: any) {
      toast.error('Restore failed');
    }
  };

  // Bulk Operations
  const bulkArchive = async (ids: string[]) => {
    try {
      await Promise.all(ids.map(id => 
        fetch(`/api/quotations/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'archive' })
        })
      ));
      toast.success(`Bulk archived ${ids.length} proposals`);
      setSelectedIds([]);
      await fetchQuotations();
    } catch (e) {
      toast.error('Bulk archive operation failed');
    }
  };

  const bulkDelete = async (ids: string[]) => {
    try {
      await Promise.all(ids.map(id => fetch(`/api/quotations/${id}`, { method: 'DELETE' })));
      toast.success(`Bulk soft-deleted ${ids.length} proposals`);
      setSelectedIds([]);
      await fetchQuotations();
    } catch (e) {
      toast.error('Bulk delete operation failed');
    }
  };

  const bulkRestore = async (ids: string[]) => {
    try {
      await Promise.all(ids.map(id => 
        fetch(`/api/quotations/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'restore' })
        })
      ));
      toast.success(`Bulk restored ${ids.length} proposals`);
      setSelectedIds([]);
      await fetchQuotations();
    } catch (e) {
      toast.error('Bulk restore operation failed');
    }
  };

  const bulkExportCSV = (ids: string[]) => {
    const targets = quotations.filter(q => ids.includes(q.id));
    if (targets.length === 0) return;

    const headers = ['ID', 'Reference No', 'Customer ID', 'Date', 'Validity Date', 'Currency', 'Exchange Rate', 'Incoterm', 'Payment Terms', 'Container Type', 'Total Value', 'Margin %', 'Status', 'Version'];
    const rows = targets.map(q => [
      q.id,
      q.quotationNo,
      q.customerId,
      q.date,
      q.validityDate,
      q.currency,
      q.exchangeRate,
      q.incoterm,
      q.paymentTerms,
      q.containerType,
      q.totalValue,
      q.marginPercentage,
      q.status,
      q.version
    ]);

    const csvContent = [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Quotations_Export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`Exported ${targets.length} proposals to CSV`);
  };

  // Filter, Search, and Sort Processed List
  const processedQuotations = useMemo(() => {
    let result = [...quotations];

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(quote => 
        quote.quotationNo.toLowerCase().includes(q) ||
        quote.customerId.toLowerCase().includes(q)
      );
    }

    // Filter rules
    if (filters.customerIds.length > 0) {
      result = result.filter(q => filters.customerIds.includes(q.customerId));
    }
    if (filters.statuses.length > 0) {
      result = result.filter(q => filters.statuses.includes(q.status));
    }
    if (filters.incoterms.length > 0) {
      result = result.filter(q => filters.incoterms.includes(q.incoterm));
    }

    // Sorting rule
    result.sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'quotationNo') comparison = a.quotationNo.localeCompare(b.quotationNo);
      else if (sortBy === 'totalValue') comparison = b.totalValue - a.totalValue; // default high to low
      else if (sortBy === 'date') comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
      else if (sortBy === 'marginPercentage') comparison = b.marginPercentage - a.marginPercentage;
      else if (sortBy === 'status') comparison = a.status.localeCompare(b.status);

      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [quotations, searchQuery, filters, sortBy, sortOrder]);

  // Reset to page 1 on filter/search change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filters, sortBy, sortOrder]);

  const paginatedQuotations = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return processedQuotations.slice(start, start + pageSize);
  }, [processedQuotations, currentPage, pageSize]);

  const totalPages = Math.ceil(processedQuotations.length / pageSize);

  const filterOptions = useMemo(() => {
    const customerIds = Array.from(new Set(quotations.map(q => q.customerId).filter(Boolean)));
    const statuses = Array.from(new Set(quotations.map(q => q.status).filter(Boolean)));
    const incoterms = Array.from(new Set(quotations.map(q => q.incoterm).filter(Boolean)));

    return { customerIds, statuses, incoterms };
  }, [quotations]);

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
    quotations: paginatedQuotations,
    allProcessedQuotations: processedQuotations,
    rawQuotations: quotations,
    loading,
    currentPage,
    setCurrentPage,
    totalPages,
    searchQuery,
    setSearchQuery,
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
    createQuotation,
    updateQuotation,
    approveQuotation,
    rejectQuotation,
    sendQuotation,
    reviseQuotation,
    duplicateQuotation,
    softDeleteQuotation,

    // Bulk
    bulkArchive,
    bulkDelete,
    bulkRestore,
    bulkExportCSV
  };
}
