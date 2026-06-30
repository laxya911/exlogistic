import { NextResponse } from 'next/server';
import { 
  salesOrderRepository, 
  shipmentRepository, 
  costingScenarioRepository,
  purchaseOrderRepository
} from '@/repositories/repository';

export async function GET() {
  try {
    const [sales, shipments, costings, purchases] = await Promise.all([
      salesOrderRepository.getAll(),
      shipmentRepository.getAll(),
      costingScenarioRepository.getAll(),
      purchaseOrderRepository.getAll()
    ]);

    const activeSales = sales.filter(s => s.entityStatus !== 'DELETED');
    const activeShipments = shipments.filter(s => s.entityStatus !== 'DELETED');
    const activeCostings = costings.filter(s => s.entityStatus !== 'DELETED');
    const activePurchases = purchases.filter(p => p.entityStatus !== 'DELETED');

    // 1. Sales Metrics
    const totalRevenue = activeSales.reduce((sum, order) => sum + order.totalValue, 0);
    const avgOrderValue = activeSales.length ? totalRevenue / activeSales.length : 0;
    
    // Time-series: last 6 months revenue
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const now = new Date();
    const last6Months = Array.from({ length: 6 }).map((_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
      return { month: d.getMonth(), year: d.getFullYear(), name: monthNames[d.getMonth()] };
    });

    const salesOverTime = last6Months.map(m => {
      const monthSales = activeSales.filter(s => {
        const d = new Date(s.createdAt);
        return d.getMonth() === m.month && d.getFullYear() === m.year;
      });
      return {
        name: m.name,
        revenue: monthSales.reduce((sum, order) => sum + order.totalValue, 0),
        orders: monthSales.length
      };
    });

    // 2. Logistics Metrics
    const shipmentStatuses = activeShipments.reduce((acc, shp) => {
      acc[shp.status] = (acc[shp.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const shipmentsByDestination = activeShipments.reduce((acc, shp) => {
      const dest = shp.destinationPortId.substring(0, 2); // Country Code
      acc[dest] = (acc[dest] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const topDestinations = Object.entries(shipmentsByDestination)
      .map(([name, value]) => ({ name, value }))
      .sort((a: any, b: any) => (b.value as number) - (a.value as number))
      .slice(0, 5);

    // 3. Yields / Profitability (from Costing Engine)
    const avgMargin = activeCostings.length 
      ? activeCostings.reduce((sum, c) => sum + (c.result?.grossMarginPct || 0), 0) / activeCostings.length 
      : 0;

    const topScenarios = [...activeCostings]
      .sort((a, b) => (b.result?.totalGrossProfit || 0) - (a.result?.totalGrossProfit || 0))
      .slice(0, 5)
      .map(c => ({
        name: c.scenarioName.substring(0, 20),
        profit: c.result?.totalGrossProfit || 0,
        margin: c.result?.grossMarginPct || 0
      }));

    // 4. Matrix Data (Recent High-Value Activity)
    const matrixData = activeSales
      .sort((a, b) => b.totalValue - a.totalValue)
      .slice(0, 10)
      .map(s => ({
        id: s.id,
        date: s.createdAt,
        entity: s.customerId,
        type: 'Sales Order',
        value: s.totalValue,
        status: s.status
      }));

    // 5. Exposure (Unpaid / Draft)
    const outstandingPOValue = activePurchases
      .filter(p => p.status !== ('COMPLETED' as any) && p.status !== 'CANCELLED')
      .reduce((sum, p) => sum + p.totalValue, 0);

    return NextResponse.json({
      summary: {
        totalRevenue,
        avgOrderValue,
        avgMargin,
        totalShipments: activeShipments.length,
        outstandingPOValue
      },
      charts: {
        salesOverTime,
        shipmentStatuses: Object.entries(shipmentStatuses).map(([name, value]) => ({ name, value })),
        topDestinations,
        topScenarios
      },
      matrix: matrixData
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
