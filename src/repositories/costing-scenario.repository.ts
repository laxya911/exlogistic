import { prisma } from './prisma.client';
import { Prisma } from '@generated/client';

export class CostingScenarioRepository {
  static async findAll() {
    return prisma.costingScenario.findMany({
      orderBy: { createdAt: 'desc' }
    });
  }

  static async findById(id: string) {
    return prisma.costingScenario.findUnique({
      where: { id }
    });
  }

  static async create(data: Prisma.CostingScenarioCreateInput) {
    return prisma.costingScenario.create({ data });
  }

  static async update(id: string, data: Prisma.CostingScenarioUpdateInput) {
    return prisma.costingScenario.update({
      where: { id },
      data,
    });
  }

  static async delete(id: string) {
    return prisma.costingScenario.delete({
      where: { id },
    });
  }
}
