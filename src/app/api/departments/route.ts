import { NextResponse } from 'next/server';
import { departmentRepository } from '@/repositories/prisma/department.repository';

export async function GET() {
  try {
    const departments = await departmentRepository.findAll();
    return NextResponse.json(departments);
  } catch (error) {
    console.error('Error fetching departments:', error);
    return NextResponse.json({ error: 'Failed to fetch departments' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const newDept = await departmentRepository.create(data);
    return NextResponse.json(newDept, { status: 201 });
  } catch (error) {
    console.error('Error creating department:', error);
    return NextResponse.json({ error: 'Failed to create department' }, { status: 500 });
  }
}
