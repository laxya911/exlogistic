import { NextResponse } from 'next/server';
import { 
  salesOrderRepository, 
  shipmentRepository, 
  productRepository, 
  customerRepository 
} from '@/repositories/repository';

/**
 * We use Next.js built-in Route Segment Config (revalidate) instead of a custom LRU Cache because:
 * 1. It integrates natively with Vercel's Edge Cache / CDN layer.
 * 2. It does not consume Node.js process memory (a custom LRU map would bloat RAM over time).
 * 3. It supports tag-based invalidation out of the box for future use.
 */
export const revalidate = 60; // Cache this route for 60 seconds

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const entity = searchParams.get('entity');
    
    let rawData: any[] = [];
    
    switch(entity) {
      case 'sales':
        rawData = await salesOrderRepository.getAll();
        break;
      case 'shipments':
        rawData = await shipmentRepository.getAll();
        break;
      case 'products':
        rawData = await productRepository.getAll();
        break;
      case 'customers':
        rawData = await customerRepository.getAll();
        break;
      default:
        return NextResponse.json({ error: 'Invalid entity type' }, { status: 400 });
    }
    
    // We send raw data to the client, the client-side ReportEngine handles the filtering, sorting, grouping
    return NextResponse.json({ data: rawData });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
