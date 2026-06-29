import { NextResponse } from 'next/server';
import { queueProvider } from '@/lib/queue/memory-provider';
import { PdfGeneratorHandler } from '@/lib/queue/handlers/pdf-generator';

// Bootstrap the worker (typically done in a separate worker process)
queueProvider.register('PDF_GENERATE', new PdfGeneratorHandler());
queueProvider.startProcessing();

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Simulate enqueueing a PDF generation job
    const job = await queueProvider.enqueue('PDF_GENERATE', {
      documentType: body.documentType || 'QUOTATION',
      entityId: body.entityId || '12345',
    }, { delay: 1000 }); // Optional 1s delay

    return NextResponse.json({ 
      success: true, 
      message: 'Job enqueued successfully',
      jobId: job.id,
      jobStatus: job.status
    });
  } catch (error) {
    console.error('Failed to enqueue job:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
