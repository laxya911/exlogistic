import { NextResponse } from 'next/server';
import { prisma } from '@/repositories/prisma.client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { auditLogger } from '@/lib/audit';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const entityType = searchParams.get('entityType');
    const entityId = searchParams.get('entityId');

    if (!entityType || !entityId) {
      return NextResponse.json({ error: 'Missing entityType or entityId' }, { status: 400 });
    }

    const logs = await prisma.auditLog.findMany({
      where: {
        entityType,
        entityId,
      },
      include: {
        user: {
          select: { name: true, email: true, image: true },
        },
      },
      orderBy: { timestamp: 'desc' },
    });

    return NextResponse.json(logs);
  } catch (error) {
    console.error('Error fetching timeline:', error);
    return NextResponse.json({ error: 'Failed to fetch timeline' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    const { entityType, entityId, note } = data;

    if (!entityType || !entityId || !note) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });

    await auditLogger.logAction({
      entityType,
      entityId,
      action: 'NOTE_ADDED',
      newValues: { text: note },
      userId: user?.id,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error adding timeline note:', error);
    return NextResponse.json({ error: 'Failed to add note' }, { status: 500 });
  }
}
