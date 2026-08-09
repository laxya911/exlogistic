import { prisma } from './prisma.client';
import { Forwarder, Prisma } from '@generated/client';

export class ForwarderRepository {
  static async findAll() {
    return prisma.forwarder.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { shipments: true } }
      }
    });
  }

  static async findById(id: string) {
    return prisma.forwarder.findUnique({
      where: { id },
      include: {
        shipments: {
          take: 10,
          orderBy: { createdAt: 'desc' }
        }
      }
    });
  }

  static async create(data: Prisma.ForwarderCreateInput) {
    return prisma.forwarder.create({ data });
  }

  static async update(id: string, data: Prisma.ForwarderUpdateInput) {
    const { shipments, _count, ...updateData } = data as any;
    return prisma.forwarder.update({ where: { id }, data: updateData });
  }

  static async delete(id: string) {
    return prisma.forwarder.delete({
      where: { id },
    });
  }
}
