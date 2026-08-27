import { NextResponse } from 'next/server';
import { notificationService } from '@/services/notification.service';

export async function GET() {
  try {
    const unread = await notificationService.getUnread();
    return NextResponse.json({ notifications: unread, unreadCount: unread.length });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { type, title, message, actionUrl, userId } = body;
    
    await notificationService.send(type, title, message, actionUrl, userId);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Mark all as read
export async function PUT(request: Request) {
  try {
    await notificationService.markAllAsRead();
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
