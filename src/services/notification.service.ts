import { notificationRepository } from '@/repositories/repository';
import { Notification, NotificationType } from '@/types';
import { queueProvider } from '@/lib/queue/memory-provider';

export class NotificationService {
  async getUnread(): Promise<Notification[]> {
    const all = await notificationRepository.getAll();
    return all.filter(n => !n.isRead).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async markAsRead(id: string): Promise<boolean> {
    const notif = await notificationRepository.getById(id);
    if (!notif) return false;
    await notificationRepository.update(id, { isRead: true });
    return true;
  }

  async markAllAsRead(): Promise<void> {
    const all = await notificationRepository.getAll();
    for (const notif of all) {
      if (!notif.isRead) {
        await notificationRepository.update(notif.id, { isRead: true });
      }
    }
  }

  /**
   * Enqueues a notification to be processed by the background worker.
   */
  async send(type: NotificationType, title: string, message: string, actionUrl?: string, userId?: string) {
    // 1. Create the in-app notification immediately
    await notificationRepository.create({
      type,
      title,
      message,
      isRead: false,
      actionUrl,
      userId
    });

    // 2. Enqueue the background job to handle external channels (Email)
    await queueProvider.enqueue('SEND_NOTIFICATION', {
      type,
      title,
      message,
      userId
    });
  }
}

export const notificationService = new NotificationService();
