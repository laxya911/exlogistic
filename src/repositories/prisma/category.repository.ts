import { prisma } from '../prisma.client';
import { Category } from '@/types';

export class PrismaCategoryRepository {
  
  private mapToFrontend(c: any): Category {
    return {
      id: c.id,
      name: c.name,
      slug: c.slug,
      parentId: c.parentId,
      path: c.path,
      level: c.level,
      createdAt: c.createdAt.toISOString(),
      updatedAt: c.updatedAt.toISOString(),
      entityStatus: c.deletedAt ? 'DELETED' : 'ACTIVE',
    };
  }

  async getAll(): Promise<Category[]> {
    const categories = await prisma.category.findMany({
      orderBy: [{ level: 'asc' }, { name: 'asc' }]
    });
    return categories.map(this.mapToFrontend);
  }

  async getById(id: string): Promise<Category | null> {
    const c = await prisma.category.findUnique({
      where: { id }
    });
    return c ? this.mapToFrontend(c) : null;
  }

  async create(data: Partial<Category>): Promise<Category> {
    const cat = await prisma.category.create({
      data: {
        name: data.name!,
        slug: data.slug || data.name!.toLowerCase().replace(/[^a-z0-9]/g, '-'),
        parentId: data.parentId,
        level: data.level || 0,
      }
    });
    return this.mapToFrontend(cat);
  }
}

export const prismaCategoryRepository = new PrismaCategoryRepository();
