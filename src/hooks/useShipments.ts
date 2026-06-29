import { useState, useEffect, useMemo } from 'react';
import { Shipment } from '@/types';
import { toast } from 'sonner';

export type ShipmentSortField = 'shipmentNo' | 'etd' | 'eta' | 'status' | 'totalFreightCost';
export type SortOrder = 'asc' | 'desc';

export interface ShipmentFilterState {
  statuses: string[];
  shippingLines: string[];
  containerTypes: string[];
}

export function useShipments() {
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<ShipmentFilterState>({ statuses: [], shippingLines: [], containerTypes: [] });
  const [sortBy, setSortBy] = useState<ShipmentSortField>('etd');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 15;

  useEffect(() => { fetchShipments(); }, []);

  const fetchShipments = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/shipments');
      if (!res.ok) throw new Error('Failed to sync logistics hub');
      setShipments(await res.json());
    } catch (e: any) {
      toast.error(e.message || 'Failed to load shipments');
    } finally {
      setLoading(false);
    }
  };

  const callAction = async (id: string, action: string, extra?: Record<string, any>) => {
    const res = await fetch(`/api/shipments/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, ...extra })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || `Action '${action}' failed`);
    return data;
  };

  const advance = async (id: string) => {
    try {
      const d = await callAction(id, 'advance');
      toast.success(`${d.shipmentNo} → ${d.status.replace('_', ' ')}`);
      await fetchShipments();
    } catch (e: any) { toast.error(e.message); }
  };

  const cancelShipment = async (id: string) => {
    try {
      const d = await callAction(id, 'cancel');
      toast.success(`${d.shipmentNo} cancelled`);
      await fetchShipments();
    } catch (e: any) { toast.error(e.message); }
  };

  const addNote = async (id: string, note: string) => {
    try {
      const d = await callAction(id, 'add_note', { note });
      toast.success('Note logged to shipment timeline');
      return d;
    } catch (e: any) { toast.error(e.message); return null; }
  };

  const softDelete = async (id: string) => {
    const target = shipments.find(s => s.id === id);
    if (!target) return;
    try {
      const res = await fetch(`/api/shipments/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
      toast.success(`${target.shipmentNo} removed`, {
        action: { label: 'Undo', onClick: () => restoreShipment(id) },
        duration: 8000
      });
      await fetchShipments();
    } catch (e: any) { toast.error(e.message); }
  };

  const restoreShipment = async (id: string) => {
    try { await callAction(id, 'restore'); toast.success('Shipment restored'); await fetchShipments(); }
    catch { toast.error('Restore failed'); }
  };

  const bulkDelete = async (ids: string[]) => {
    try {
      await Promise.all(ids.map(id => fetch(`/api/shipments/${id}`, { method: 'DELETE' })));
      toast.success(`Bulk removed ${ids.length} shipments`);
      setSelectedIds([]); await fetchShipments();
    } catch { toast.error('Bulk delete failed'); }
  };

  const bulkArchive = async (ids: string[]) => {
    try {
      await Promise.all(ids.map(id => callAction(id, 'archive')));
      toast.success(`Archived ${ids.length} shipments`);
      setSelectedIds([]); await fetchShipments();
    } catch { toast.error('Bulk archive failed'); }
  };

  const bulkExportCSV = (ids: string[]) => {
    const targets = shipments.filter(s => ids.includes(s.id));
    if (!targets.length) return;
    const headers = ['Shipment No', 'Origin', 'Destination', 'ETD', 'ETA', 'Vessel', 'Container', 'Status', 'Freight Cost'];
    const rows = targets.map(s => [
      s.shipmentNo, s.originPortId, s.destinationPortId, s.etd, s.eta,
      s.vesselName || '', s.containerType, s.status, s.totalFreightCost || 0
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Shipments_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    toast.success(`Exported ${targets.length} shipments`);
  };

  const processedShipments = useMemo(() => {
    let result = [...shipments];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(s =>
        s.shipmentNo.toLowerCase().includes(q) ||
        (s.mbl || '').toLowerCase().includes(q) ||
        (s.vesselName || '').toLowerCase().includes(q) ||
        s.originPortId.toLowerCase().includes(q) ||
        s.destinationPortId.toLowerCase().includes(q)
      );
    }
    if (filters.statuses.length > 0) result = result.filter(s => filters.statuses.includes(s.status));
    if (filters.shippingLines.length > 0) result = result.filter(s => filters.shippingLines.includes(s.shippingLineId));
    if (filters.containerTypes.length > 0) result = result.filter(s => filters.containerTypes.includes(s.containerType));

    result.sort((a, b) => {
      let cmp = 0;
      if (sortBy === 'shipmentNo') cmp = a.shipmentNo.localeCompare(b.shipmentNo);
      else if (sortBy === 'etd') cmp = new Date(a.etd).getTime() - new Date(b.etd).getTime();
      else if (sortBy === 'eta') cmp = new Date(a.eta).getTime() - new Date(b.eta).getTime();
      else if (sortBy === 'status') cmp = a.status.localeCompare(b.status);
      else if (sortBy === 'totalFreightCost') cmp = (a.totalFreightCost || 0) - (b.totalFreightCost || 0);
      return sortOrder === 'asc' ? cmp : -cmp;
    });
    return result;
  }, [shipments, searchQuery, filters, sortBy, sortOrder]);

  // Reset to page 1 on filter/search change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filters, sortBy, sortOrder]);

  const paginatedShipments = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return processedShipments.slice(start, start + pageSize);
  }, [processedShipments, currentPage]);

  const totalPages = Math.ceil(processedShipments.length / pageSize);

  const filterOptions = useMemo(() => ({
    statuses: Array.from(new Set(shipments.map(s => s.status))),
    shippingLines: Array.from(new Set(shipments.map(s => s.shippingLineId))),
    containerTypes: Array.from(new Set(shipments.map(s => s.containerType)))
  }), [shipments]);

  // KPI stats computed from raw data
  const kpis = useMemo(() => {
    const active = shipments.filter(s => s.entityStatus === 'ACTIVE');
    return {
      inTransit: active.filter(s => ['TRANSIT', 'ON_VESSEL'].includes(s.status)).length,
      pendingBooking: active.filter(s => s.status === 'BOOKING').length,
      arrived: active.filter(s => ['ARRIVED', 'DELIVERED'].includes(s.status)).length,
      completed: active.filter(s => s.status === 'COMPLETED').length,
      totalFreight: active.reduce((sum, s) => sum + (s.totalFreightCost || 0), 0)
    };
  }, [shipments]);

  const toggleSelect = (id: string) =>
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  const selectAll = (ids: string[]) =>
    setSelectedIds(prev => prev.length === ids.length ? [] : ids);

  return {
    shipments: paginatedShipments,
    allProcessedShipments: processedShipments,
    rawShipments: shipments,
    loading,
    currentPage,
    setCurrentPage,
    pageSize,
    totalPages,
    kpis,
    searchQuery, setSearchQuery,
    filters, setFilters, filterOptions,
    sortBy, setSortBy, sortOrder, setSortOrder,
    selectedIds, setSelectedIds, toggleSelect, selectAll,
    fetchShipments,
    advance, cancelShipment, addNote, softDelete, restoreShipment,
    bulkDelete, bulkArchive, bulkExportCSV
  };
}
