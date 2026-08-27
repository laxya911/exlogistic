import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ message: "Database setup API is disabled." }, { status: 404 });
}
