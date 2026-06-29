import { prisma } from '../prisma.client';
import { Product } from '@/types';

export class PrismaProductRepository {
  
  // Mapper to transform Prisma nested product to legacy flat frontend Product
  private mapToFrontend(p: any): Product {
    const defaultVariant = p.variants?.find((v: any) => v.isDefault) || p.variants?.[0];
    const supplier = p.suppliers?.[0];

    return {
      id: p.id,
      slug: p.slug,
      name: p.name,
      shortDescription: p.shortDescription || '',
      description: p.shortDescription || '',
      hsnCode: p.hsnCode || '',
      countryOfOrigin: p.countryOfOrigin || '',
      isPublished: p.isPublished,
      isFeatured: p.isFeatured,
      entityStatus: p.status,
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),

      brandId: p.brand?.id,
      brandName: p.brand?.name || '',
      brand: p.brand?.name || '',
      
      category: p.categories?.[0]?.category?.name || 'Uncategorized',
      
      variants: p.variants || [],
      
      // Backward compatibility mapped from default variant
      sku: defaultVariant?.sku || '',
      purchasePrice: defaultVariant?.purchasePrice || 0,
      sellingPrice: defaultVariant?.sellingPrice || 0,
      currency: defaultVariant?.currency || 'USD',
      grossWeight: defaultVariant?.grossWeight || 0,
      netWeight: defaultVariant?.netWeight || 0,
      cbm: defaultVariant?.volumeCBM || 0,
      packageType: defaultVariant?.packagingType || '',
      uom: 'BAG', // Hardcoded fallback or could be added to variant
      
      // Mapped from supplier
      supplierId: supplier?.supplierId || '',
      moq: supplier?.moq || 0,
      leadTime: supplier?.leadTime || 0,
      unitsPerCarton: 1, // Add mapped defaults
      containerLoadingCapacity: 800,
      shelfLife: '12 Months',
      storageConditions: 'Standard',
      
      images: p.defaultImage ? [p.defaultImage] : (defaultVariant?.images?.map((i:any) => i.url) || []),
      documents: p.documents || [],
      certifications: p.certifications?.map((c: any) => c.name) || [],
      
      timeline: [],
      purchaseHistory: [],
      sellingHistory: [],
      inventorySummary: [],
      pricingHistory: []
    } as Product;
  }

  async getAll(): Promise<Product[]> {
    const products = await prisma.product.findMany({
      where: { status: { not: 'DELETED' } },
      include: {
        brand: true,
        categories: { include: { category: true } },
        variants: { include: { images: true } },
        suppliers: true,
        documents: true,
        certifications: true,
      },
      orderBy: { createdAt: 'desc' }
    });
    return products.map(this.mapToFrontend);
  }

  async getById(id: string): Promise<Product | null> {
    const p = await prisma.product.findUnique({
      where: { id },
      include: {
        brand: true,
        categories: { include: { category: true } },
        variants: { include: { images: true } },
        suppliers: true,
        documents: true,
        certifications: true,
      }
    });
    return p ? this.mapToFrontend(p) : null;
  }

  async create(data: Partial<Product>): Promise<Product> {
    // For creation, we assume the frontend sends a mix of flat data (for default variant) 
    // and parent data. We need to normalize it for Prisma.
    
    // In a real robust implementation, we would extract variant specific data
    const product = await prisma.product.create({
      data: {
        name: data.name!,
        slug: data.sku?.toLowerCase() || `prod-${Date.now()}`,
        shortDescription: data.description,
        hsnCode: data.hsnCode,
        countryOfOrigin: data.countryOfOrigin,
        
        // Ensure default variant is created
        variants: {
          create: {
            sku: data.sku!,
            title: 'Default',
            isDefault: true,
            purchasePrice: data.purchasePrice || 0,
            sellingPrice: data.sellingPrice || 0,
            currency: data.currency || 'USD',
            grossWeight: data.grossWeight,
            netWeight: data.netWeight,
            volumeCBM: data.cbm,
            packagingType: data.packageType,
          }
        }
      },
      include: {
        brand: true,
        categories: { include: { category: true } },
        variants: { include: { images: true } },
        suppliers: true,
      }
    });
    
    return this.mapToFrontend(product);
  }

  async update(id: string, data: Partial<Product>): Promise<Product | null> {
    // A simplified update that only updates parent fields for now
    // In production, we'd do a deep nested update or separate variant endpoints
    const product = await prisma.product.update({
      where: { id },
      data: {
        name: data.name,
        shortDescription: data.description,
        hsnCode: data.hsnCode,
        countryOfOrigin: data.countryOfOrigin,
        status: data.entityStatus as any,
      },
      include: {
        brand: true,
        categories: { include: { category: true } },
        variants: { include: { images: true } },
        suppliers: true,
      }
    });
    return this.mapToFrontend(product);
  }

  async delete(id: string): Promise<boolean> {
    await prisma.product.update({
      where: { id },
      data: { status: 'DELETED' }
    });
    return true;
  }
}

export const prismaProductRepository = new PrismaProductRepository();
