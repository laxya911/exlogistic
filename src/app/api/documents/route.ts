import { NextResponse } from 'next/server';
import { documentRepository } from '@/repositories/repository';
import { numberingService } from '@/services/numbering.service';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const typeFilter = searchParams.get('type');
    const statusFilter = searchParams.get('status');
    const relTypeFilter = searchParams.get('relatedType');
    const relIdFilter = searchParams.get('relatedId');

    let docs = await documentRepository.getAll();
    docs = docs.filter(d => d.entityStatus !== 'DELETED');

    if (typeFilter) docs = docs.filter(d => d.type === typeFilter);
    if (statusFilter) docs = docs.filter(d => d.status === statusFilter);
    if (relTypeFilter) docs = docs.filter(d => (d as any).relatedType === relTypeFilter);
    if (relIdFilter) docs = docs.filter(d => (d as any).relatedId === relIdFilter);

    // Sort newest first
    docs = docs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return NextResponse.json(docs);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    if (!data.type) {
      return NextResponse.json({ error: 'Document type is required' }, { status: 400 });
    }
    const now = new Date().toISOString();

    // Check for existing documents to apply versioning
    if (data.relatedId && data.type) {
      const allDocs = await documentRepository.getAll();
      const existingDocs = allDocs.filter((d: any) => d.relatedId === data.relatedId && d.type === data.type);

      const activeDocs = existingDocs.filter((d: any) => d.status !== 'ARCHIVED' && d.entityStatus !== 'DELETED');
      
      if (activeDocs.length > 0) {
        // Mark existing active docs as archived
        for (const doc of activeDocs) {
          // Find if the document already has a vN tag, if not, it's v1
          const match = doc.name.match(/\[v(\d+)\]/);
          let oldVersion = 1;
          if (match) {
            oldVersion = parseInt(match[1]);
          } else {
            // Rename the old document to [v1] if it didn't have a tag
            await documentRepository.update(doc.id, { 
              status: 'ARCHIVED', 
              name: `[v1] ${doc.name.replace(/\[v\d+\]\s*/, '')}`
            });
            continue;
          }
          await documentRepository.update(doc.id, { status: 'ARCHIVED' });
        }

        // Determine new version number (max version + 1)
        let maxVersion = 1;
        for (const doc of existingDocs) {
          const match = doc.name.match(/\[v(\d+)\]/);
          if (match) {
            maxVersion = Math.max(maxVersion, parseInt(match[1]));
          }
        }
        
        // Ensure the new document name has the new version tag
        const baseName = data.name.replace(/\[v\d+\]\s*/, '');
        data.name = `[v${maxVersion + 1}] ${baseName}`;
      }
    }

    const item = await documentRepository.create({
      ...data,
      status: data.status || 'ACTIVE',
      entityStatus: 'ACTIVE',
      createdAt: now,
      updatedAt: now,
    });
    return NextResponse.json(item, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
