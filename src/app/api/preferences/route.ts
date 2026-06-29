import { NextResponse } from 'next/server';
import { preferenceRepository } from '@/repositories/prisma/preference.repository';
import { hasPermission } from '@/lib/rbac';

export async function GET() {
  try {
    const isAllowed = await hasPermission('settings:manage');
    if (!isAllowed) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const prefs = await preferenceRepository.get();
    return NextResponse.json(prefs);
  } catch (error) {
    console.error('Error fetching preferences:', error);
    return NextResponse.json({ error: 'Failed to fetch preferences' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const isAllowed = await hasPermission('settings:manage');
    if (!isAllowed) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const data = await request.json();
    const id = data.id;
    if (!id) return NextResponse.json({ error: 'Missing ID' }, { status: 400 });

    const updatedPrefs = await preferenceRepository.update(id, data);
    return NextResponse.json(updatedPrefs);
  } catch (error) {
    console.error('Error updating preferences:', error);
    return NextResponse.json({ error: 'Failed to update preferences' }, { status: 500 });
  }
}
