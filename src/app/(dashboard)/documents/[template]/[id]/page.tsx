import { notFound } from 'next/navigation';
import { documentService } from '@/services/document.service';
import { QuotationTemplate } from '@/components/documents/QuotationTemplate';
import { DocumentActionBar } from '@/components/documents/DocumentActionBar';

export default async function DocumentViewerPage({
  params
}: {
  params: Promise<{ template: string; id: string }>
}) {
  const { template, id } = await params;
  
  let documentData = null;

  switch (template.toLowerCase()) {
    case 'quotation':
      documentData = await documentService.getQuotationDocument(id);
      break;
    case 'sales-order':
      documentData = await documentService.getSalesOrderDocument(id);
      break;
    default:
      notFound();
  }

  if (!documentData) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-zinc-950 py-12 print:bg-white print:p-0">
      {/* We use QuotationTemplate for both Quotations and SOs right now as they share identical tabular layouts for ERPs */}
      <QuotationTemplate data={documentData} />
      
      <DocumentActionBar documentId={documentData.documentNo} />
    </div>
  );
}
