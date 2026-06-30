import { 
  quotationRepository, 
  salesOrderRepository, 
  purchaseOrderRepository, 
  shipmentRepository,
  taskRepository,
  calendarEventRepository,
  auditLogRepository
} from '@/repositories/repository';
import { SalesOrder, Shipment, Quotation, PurchaseOrder } from '@/types';

export type Timeframe = 'MONTH' | 'QUARTER' | 'YEAR' | 'CUSTOM';

export class DashboardService {
  private isInTimeframe(dateStr: string, timeframe: Timeframe, customStart?: string, customEnd?: string): boolean {
    const date = new Date(dateStr);
    const now = new Date();
    
    if (timeframe === 'MONTH') {
      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    }
    if (timeframe === 'QUARTER') {
      const q1 = Math.floor(date.getMonth() / 3);
      const q2 = Math.floor(now.getMonth() / 3);
      return q1 === q2 && date.getFullYear() === now.getFullYear();
    }
    if (timeframe === 'YEAR') {
      return date.getFullYear() === now.getFullYear();
    }
    if (timeframe === 'CUSTOM' && customStart && customEnd) {
      const start = new Date(customStart);
      const end = new Date(customEnd);
      return date >= start && date <= end;
    }
    return true;
  }

  async getDashboardData(timeframe: Timeframe = 'MONTH', customStart?: string, customEnd?: string) {
    const allQuotations = await quotationRepository.getAll();
    const allSalesOrders = await salesOrderRepository.getAll();
    const allPurchaseOrders = await purchaseOrderRepository.getAll();
    const allShipments = await shipmentRepository.getAll();
    const allTasks = await taskRepository.getAll();
    const allLogs = await auditLogRepository.getAll();

    // Filter by timeframe based on creation date or logical date (e.g., SO date)
    const quotations = allQuotations.filter(q => this.isInTimeframe(q.createdAt, timeframe, customStart, customEnd));
    const salesOrders = allSalesOrders.filter(so => this.isInTimeframe(so.date, timeframe, customStart, customEnd));
    const purchaseOrders = allPurchaseOrders.filter(po => this.isInTimeframe(po.date, timeframe, customStart, customEnd));
    const shipments = allShipments.filter(s => this.isInTimeframe(s.createdAt, timeframe, customStart, customEnd));
    const tasks = allTasks.filter(t => this.isInTimeframe(t.createdAt, timeframe, customStart, customEnd));

    const stats = {
      openQuotations: quotations.filter(q => q.status === 'SENT' || q.status === 'DRAFT').length,
      pendingApprovals: quotations.filter(q => q.status === 'SENT').length,
      salesOrders: salesOrders.length,
      purchaseOrders: purchaseOrders.length,
      shipmentsInProgress: shipments.filter(s => s.status !== 'COMPLETED').length,
      tasksPending: tasks.filter(t => !t.isCompleted).length,
      revenue: salesOrders.reduce((acc, so) => acc + so.totalValue, 0),
      profit: salesOrders.reduce((acc, so) => acc + (so.totalValue * 0.2), 0), // Mock 20% margin
      margin: 20,
      containers: shipments.length,
    };

    // Calculate dynamic monthly revenue based on filtered SOs
    const monthlyDataMap = new Map<string, { revenue: number, profit: number }>();
    salesOrders.forEach(so => {
      const d = new Date(so.date);
      const month = d.toLocaleString('default', { month: 'short' });
      const current = monthlyDataMap.get(month) || { revenue: 0, profit: 0 };
      monthlyDataMap.set(month, {
        revenue: current.revenue + so.totalValue,
        profit: current.profit + (so.totalValue * 0.2)
      });
    });

    const monthlyData = Array.from(monthlyDataMap.entries()).map(([month, data]) => ({
      month,
      revenue: data.revenue,
      profit: data.profit
    }));

    if (monthlyData.length === 0) {
      // Fallback if no data in timeframe
      monthlyData.push({ month: new Date().toLocaleString('default', { month: 'short' }), revenue: 0, profit: 0 });
    }

    const shipmentStatus = [
      { name: 'Booking', value: shipments.filter(s => s.status === 'BOOKING').length },
      { name: 'Transit', value: shipments.filter(s => s.status === 'TRANSIT').length },
      { name: 'Delivered', value: shipments.filter(s => s.status === 'DELIVERED').length },
      { name: 'Stuffing', value: shipments.filter(s => s.status === 'STUFFING').length },
    ];

    const pipeline = {
      sales: salesOrders.map(so => ({ id: so.id, no: so.orderNo, value: so.totalValue, status: so.status })),
      purchases: purchaseOrders.map(po => ({ id: po.id, no: po.poNo, value: po.totalValue, status: po.status })),
    };

    return {
      stats,
      recentQuotations: quotations.slice(0, 5),
      recentShipments: shipments.slice(0, 5),
      pendingTasks: tasks.filter(t => !t.isCompleted).slice(0, 5),
      auditLogs: allLogs.slice(0, 5), // Keep all logs to show recent system activity regardless of TF
      pipeline,
      charts: {
        revenueTrend: monthlyData,
        shipmentStatus: shipmentStatus.some(s => s.value > 0) ? shipmentStatus : [{ name: 'No Data', value: 1 }],
      }
    };
  }
}

export const dashboardService = new DashboardService();
