import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ message: 'Migration endpoint disabled.' }, { status: 404 });
}
