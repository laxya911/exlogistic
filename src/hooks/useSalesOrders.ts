import { useState, useEffect, useMemo } from 'react';
import { SalesOrder } from '@/types';
import { toast } from 'sonner';

export type SalesOrderSortField = 'orderNo' | 'date' | 'totalValue' | 'status' | 'expectedShipmentDate';
export type SortOrder = 'asc' | 'desc';

export interface SalesOrderFilterState {
  statuses: string[];
  customerIds: string[];
  incoterms: string[];
}

export function useSalesOrders() {
  const [orders, setOrders] = useState<SalesOrder[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<SalesOrderFilterState>({
    statuses: [],
    customerIds: [],
    incoterms: []
  });
  const [sortBy, setSortBy] = useState<SalesOrderSortField>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/sales-orders');
      if (!res.ok) throw new Error('Failed to sync sales order registry');
      const data = await res.json();
      setOrders(data);
    } catch (e: any) {
      toast.error(e.message || 'Failed to load sales orders');
    } finally {
      setLoading(false);
    }
  };

  const performAction = async (id: string, action: string, extra?: Record<string, any>) => {
    const res = await fetch(`/api/sales-orders/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, ...extra })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || `Action '${action}' failed`);
    return data;
  };

  const bookShipment = async (id: string) => {
    try {
      const data = await performAction(id, 'book_shipment');
      toast.success(`Shipment ${data.shipment?.shipmentNo} registered`);
      await fetchOrders();
      return data;
    } catch (e: any) { toast.error(e.message); return null; }
  };

  const confirmOrder = async (id: string) => {
    try {
      const data = await performAction(id, 'confirm');
      toast.success(`Order ${data.orderNo} confirmed`);
      await fetchOrders();
    } catch (e: any) { toast.error(e.message); }
  };

  const startProduction = async (id: string) => {
    try {
      const data = await performAction(id, 'start_production');
      toast.success(`Production started for ${data.orderNo}`);
      await fetchOrders();
    } catch (e: any) { toast.error(e.message); }
  };

  const markReady = async (id: string) => {
    try {
      const data = await performAction(id, 'mark_ready');
      toast.success(`${data.orderNo} marked ready for shipment`);
      await fetchOrders();
    } catch (e: any) { toast.error(e.message); }
  };

  const cancelOrder = async (id: string) => {
    try {
      const data = await performAction(id, 'cancel');
      toast.success(`Order ${data.orderNo} cancelled`);
      await fetchOrders();
    } catch (e: any) { toast.error(e.message); }
  };

  const duplicateOrder = async (id: string) => {
    try {
      const data = await performAction(id, 'duplicate');
      toast.success(`Duplicated as ${data.orderNo}`);
      await fetchOrders();
      return data;
    } catch (e: any) { toast.error(e.message); return null; }
  };

  const softDelete = async (id: string) => {
    const target = orders.find(o => o.id === id);
    if (!target) return;
    try {
      const res = await fetch(`/api/sales-orders/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
      toast.success(`Order ${target.orderNo} removed`, {
        action: { label: 'Undo', onClick: () => restoreOrder(id) },
        duration: 8000
      });
      await fetchOrders();
    } catch (e: any) { toast.error(e.message); }
  };

  const restoreOrder = async (id: string) => {
    try {
      await performAction(id, 'restore');
      toast.success('Order restored successfully');
      await fetchOrders();
    } catch (e: any) { toast.error('Restore failed'); }
  };

  const addNote = async (id: string, note: string) => {
    try {
      const data = await performAction(id, 'add_note', { note });
      toast.success('Field note logged to timeline');
      return data;
    } catch (e: any) { toast.error(e.message); return null; }
  };

  // Bulk operations
  const bulkDelete = async (ids: string[]) => {
    try {
      await Promise.all(ids.map(id => fetch(`/api/sales-orders/${id}`, { method: 'DELETE' })));
      toast.success(`Bulk removed ${ids.length} orders`);
      setSelectedIds([]);
      await fetchOrders();
    } catch { toast.error('Bulk delete failed'); }
  };

  const bulkArchive = async (ids: string[]) => {
    try {
      await Promise.all(ids.map(id => performAction(id, 'archive')));
      toast.success(`Bulk archived ${ids.length} orders`);
      setSelectedIds([]);
      await fetchOrders();
    } catch { toast.error('Bulk archive failed'); }
  };

  const bulkExportCSV = (ids: string[]) => {
    const targets = orders.filter(o => ids.includes(o.id));
    if (!targets.length) return;
    const headers = ['Order No', 'Customer ID', 'Date', 'Expected Shipment', 'Incoterm', 'Payment Terms', 'Container', 'Value', 'Status'];
    const rows = targets.map(o => [
      o.orderNo, o.customerId, o.date, o.expectedShipmentDate,
      o.incoterm || '', o.paymentTerms || '', o.containerType || '',
      o.totalValue, o.status
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SalesOrders_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast.success(`Exported ${targets.length} orders to CSV`);
  };

  // Computed filtered + sorted list
  const processedOrders = useMemo(() => {
    let result = [...orders];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(o =>
        o.orderNo.toLowerCase().includes(q) ||
        o.customerId.toLowerCase().includes(q)
      );
    }

    if (filters.statuses.length > 0) result = result.filter(o => filters.statuses.includes(o.status));
    if (filters.customerIds.length > 0) result = result.filter(o => filters.customerIds.includes(o.customerId));
    if (filters.incoterms.length > 0) result = result.filter(o => o.incoterm && filters.incoterms.includes(o.incoterm));

    result.sort((a, b) => {
      let cmp = 0;
      if (sortBy === 'orderNo') cmp = a.orderNo.localeCompare(b.orderNo);
      else if (sortBy === 'date') cmp = new Date(a.date).getTime() - new Date(b.date).getTime();
      else if (sortBy === 'totalValue') cmp = a.totalValue - b.totalValue;
      else if (sortBy === 'status') cmp = a.status.localeCompare(b.status);
      else if (sortBy === 'expectedShipmentDate') cmp = new Date(a.expectedShipmentDate).getTime() - new Date(b.expectedShipmentDate).getTime();
      return sortOrder === 'asc' ? cmp : -cmp;
    });

    return result;
  }, [orders, searchQuery, filters, sortBy, sortOrder]);

  const filterOptions = useMemo(() => ({
    statuses: Array.from(new Set(orders.map(o => o.status))),
    customerIds: Array.from(new Set(orders.map(o => o.customerId))),
    incoterms: Array.from(new Set(orders.map(o => o.incoterm).filter(Boolean))) as string[]
  }), [orders]);

  const toggleSelect = (id: string) =>
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const selectAll = (ids: string[]) =>
    setSelectedIds(prev => prev.length === ids.length ? [] : ids);

  return {
    orders: processedOrders,
    rawOrders: orders,
    loading,
    searchQuery, setSearchQuery,
    filters, setFilters,
    filterOptions,
    sortBy, setSortBy,
    sortOrder, setSortOrder,
    selectedIds, setSelectedIds,
    toggleSelect, selectAll,
    // Actions
    fetchOrders,
    bookShipment,
    confirmOrder,
    startProduction,
    markReady,
    cancelOrder,
    duplicateOrder,
    softDelete,
    restoreOrder,
    addNote,
    // Bulk
    bulkDelete,
    bulkArchive,
    bulkExportCSV
  };
}
