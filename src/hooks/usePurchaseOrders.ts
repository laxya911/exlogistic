import { useState, useEffect, useMemo } from 'react';
import { PurchaseOrder } from '@/types';
import { toast } from 'sonner';

export type POSortField = 'poNo' | 'date' | 'totalValue' | 'status' | 'expectedDeliveryDate';
export type SortOrder = 'asc' | 'desc';

export interface POFilterState {
  statuses: string[];
  supplierIds: string[];
}

export function usePurchaseOrders() {
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<POFilterState>({ statuses: [], supplierIds: [] });
  const [sortBy, setSortBy] = useState<POSortField>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 15;

  useEffect(() => { fetchOrders(); }, []);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/purchase-orders');
      if (!res.ok) throw new Error('Failed to sync procurement ledger');
      setOrders(await res.json());
    } catch (e: any) {
      toast.error(e.message || 'Failed to load purchase orders');
    } finally {
      setLoading(false);
    }
  };

  const callAction = async (id: string, action: string, extra?: Record<string, any>) => {
    const res = await fetch(`/api/purchase-orders/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, ...extra })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || `Action '${action}' failed`);
    return data;
  };

  const issuePO = async (id: string) => {
    try { const d = await callAction(id, 'issue'); toast.success(`${d.poNo} issued to supplier`); await fetchOrders(); }
    catch (e: any) { toast.error(e.message); }
  };

  const acknowledgePO = async (id: string) => {
    try { const d = await callAction(id, 'acknowledge'); toast.success(`${d.poNo} acknowledged by supplier`); await fetchOrders(); }
    catch (e: any) { toast.error(e.message); }
  };

  const startProduction = async (id: string) => {
    try { const d = await callAction(id, 'start_production'); toast.success(`Production started for ${d.poNo}`); await fetchOrders(); }
    catch (e: any) { toast.error(e.message); }
  };

  const dispatchPO = async (id: string) => {
    try { const d = await callAction(id, 'dispatch'); toast.success(`${d.poNo} marked dispatched`); await fetchOrders(); }
    catch (e: any) { toast.error(e.message); }
  };

  const receivePO = async (id: string) => {
    try { const d = await callAction(id, 'receive'); toast.success(`${d.poNo} goods received & GRN issued`); await fetchOrders(); }
    catch (e: any) { toast.error(e.message); }
  };

  const cancelPO = async (id: string) => {
    try { const d = await callAction(id, 'cancel'); toast.success(`${d.poNo} cancelled`); await fetchOrders(); }
    catch (e: any) { toast.error(e.message); }
  };

  const duplicatePO = async (id: string) => {
    try { const d = await callAction(id, 'duplicate'); toast.success(`Duplicated as ${d.poNo}`); await fetchOrders(); return d; }
    catch (e: any) { toast.error(e.message); return null; }
  };

  const softDelete = async (id: string) => {
    const target = orders.find(o => o.id === id);
    if (!target) return;
    try {
      const res = await fetch(`/api/purchase-orders/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
      toast.success(`${target.poNo} removed`, {
        action: { label: 'Undo', onClick: () => restorePO(id) },
        duration: 8000
      });
      await fetchOrders();
    } catch (e: any) { toast.error(e.message); }
  };

  const restorePO = async (id: string) => {
    try { await callAction(id, 'restore'); toast.success('PO restored'); await fetchOrders(); }
    catch { toast.error('Restore failed'); }
  };

  const addNote = async (id: string, note: string) => {
    try { const d = await callAction(id, 'add_note', { note }); toast.success('Note logged'); return d; }
    catch (e: any) { toast.error(e.message); return null; }
  };

  const bulkDelete = async (ids: string[]) => {
    try {
      await Promise.all(ids.map(id => fetch(`/api/purchase-orders/${id}`, { method: 'DELETE' })));
      toast.success(`Bulk removed ${ids.length} POs`);
      setSelectedIds([]); await fetchOrders();
    } catch { toast.error('Bulk delete failed'); }
  };

  const bulkArchive = async (ids: string[]) => {
    try {
      await Promise.all(ids.map(id => callAction(id, 'archive')));
      toast.success(`Archived ${ids.length} POs`);
      setSelectedIds([]); await fetchOrders();
    } catch { toast.error('Bulk archive failed'); }
  };

  const bulkExportCSV = (ids: string[]) => {
    const targets = orders.filter(o => ids.includes(o.id));
    if (!targets.length) return;
    const headers = ['PO No', 'Supplier ID', 'Date', 'Expected Delivery', 'Payment Terms', 'Delivery Terms', 'Value', 'Currency', 'Status'];
    const rows = targets.map(o => [
      o.poNo, o.supplierId, o.date, o.expectedDeliveryDate,
      o.paymentTerms || '', o.deliveryTerms || '',
      o.totalValue, o.currency || 'INR', o.status
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `PurchaseOrders_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast.success(`Exported ${targets.length} POs`);
  };

  const processedOrders = useMemo(() => {
    let result = [...orders];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(o => o.poNo.toLowerCase().includes(q) || o.supplierId.toLowerCase().includes(q));
    }
    if (filters.statuses.length > 0) result = result.filter(o => filters.statuses.includes(o.status));
    if (filters.supplierIds.length > 0) result = result.filter(o => filters.supplierIds.includes(o.supplierId));

    result.sort((a, b) => {
      let cmp = 0;
      if (sortBy === 'poNo') cmp = a.poNo.localeCompare(b.poNo);
      else if (sortBy === 'date') cmp = new Date(a.date).getTime() - new Date(b.date).getTime();
      else if (sortBy === 'totalValue') cmp = a.totalValue - b.totalValue;
      else if (sortBy === 'status') cmp = a.status.localeCompare(b.status);
      else if (sortBy === 'expectedDeliveryDate') cmp = new Date(a.expectedDeliveryDate).getTime() - new Date(b.expectedDeliveryDate).getTime();
      return sortOrder === 'asc' ? cmp : -cmp;
    });
    return result;
  }, [orders, searchQuery, filters, sortBy, sortOrder]);

  // Reset to page 1 on filter/search change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filters, sortBy, sortOrder]);

  const paginatedOrders = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return processedOrders.slice(start, start + pageSize);
  }, [processedOrders, currentPage]);

  const totalPages = Math.ceil(processedOrders.length / pageSize);

  const filterOptions = useMemo(() => ({
    statuses: Array.from(new Set(orders.map(o => o.status))),
    supplierIds: Array.from(new Set(orders.map(o => o.supplierId)))
  }), [orders]);

  const toggleSelect = (id: string) =>
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const selectAll = (ids: string[]) =>
    setSelectedIds(prev => prev.length === ids.length ? [] : ids);

  return {
    orders: paginatedOrders,
    allProcessedOrders: processedOrders,
    rawOrders: orders,
    loading,
    currentPage,
    setCurrentPage,
    totalPages,
    pageSize,
    searchQuery, setSearchQuery,
    filters, setFilters, filterOptions,
    sortBy, setSortBy, sortOrder, setSortOrder,
    selectedIds, setSelectedIds, toggleSelect, selectAll,
    fetchOrders,
    issuePO, acknowledgePO, startProduction, dispatchPO, receivePO, cancelPO,
    duplicatePO, softDelete, restorePO, addNote,
    bulkDelete, bulkArchive, bulkExportCSV
  };
}
