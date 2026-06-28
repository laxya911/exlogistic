import { NextResponse } from 'next/server';
import { 
  quotationRepository, 
  salesOrderRepository, 
  purchaseOrderRepository, 
  shipmentRepository,
  taskRepository,
  calendarEventRepository
} from '@/repositories/repository';

export async function GET() {
  try {
    const [
      quotations,
      salesOrders,
      purchaseOrders,
      shipments,
      tasks,
      events
    ] = await Promise.all([
      quotationRepository.getAll(),
      salesOrderRepository.getAll(),
      purchaseOrderRepository.getAll(),
      shipmentRepository.getAll(),
      taskRepository.getAll(),
      calendarEventRepository.getAll()
    ]);

    const stats = {
      openQuotations: quotations.filter(q => q.status === 'SENT' || q.status === 'DRAFT').length,
      pendingApprovals: quotations.filter(q => q.status === 'SENT').length,
      salesOrders: salesOrders.length,
      purchaseOrders: purchaseOrders.length,
      shipmentsInProgress: shipments.filter(s => s.status !== 'COMPLETED').length,
      tasksPending: tasks.filter(t => !t.isCompleted).length,
      delayedShipments: 5, // Mock value
      upcomingETA: shipments.filter(s => new Date(s.eta) > new Date()).length,
      revenue: salesOrders.reduce((acc, so) => acc + so.totalValue, 0),
      profit: salesOrders.reduce((acc, so) => acc + (so.totalValue * 0.2), 0), // Mock 20% margin
      margin: 20,
      containers: shipments.length,
    };

    const monthlyData = [
      { month: 'Jan', revenue: 450000, profit: 90000 },
      { month: 'Feb', revenue: 520000, profit: 104000 },
      { month: 'Mar', revenue: 480000, profit: 96000 },
      { month: 'Apr', revenue: 610000, profit: 122000 },
      { month: 'May', revenue: 590000, profit: 118000 },
      { month: 'Jun', revenue: 720000, profit: 144000 },
    ];

    return NextResponse.json({
      stats,
      recentQuotations: quotations.slice(0, 5),
      recentShipments: shipments.slice(0, 5),
      pendingTasks: tasks.filter(t => !t.isCompleted).slice(0, 5),
      charts: {
        revenueTrend: monthlyData,
        shipmentStatus: [
          { name: 'Booking', value: shipments.filter(s => s.status === 'BOOKING').length },
          { name: 'Transit', value: shipments.filter(s => s.status === 'TRANSIT').length },
          { name: 'Delivered', value: shipments.filter(s => s.status === 'DELIVERED').length },
          { name: 'Stuffing', value: shipments.filter(s => s.status === 'STUFFING').length },
        ],
        countryDistribution: [
          { name: 'USA', value: 40 },
          { name: 'Germany', value: 25 },
          { name: 'UAE', value: 20 },
          { name: 'Singapore', value: 15 },
        ]
      }
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
