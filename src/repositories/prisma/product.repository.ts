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
      categories: p.categories || [],
      
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
      unitsPerCarton: p.unitsPerCarton ?? 1,
      containerLoadingCapacity: p.containerLoadingCapacity ?? 800,
      shelfLife: p.shelfLife || '12 Months',
      storageConditions: p.storageConditions || 'Standard',
      japanImportNotes: p.japanImportNotes || '',
      
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

  
  async create(data: any): Promise<Product> {
    // 1. Process attributes & values if provided
    const attributeMapping: Record<string, string> = {}; // key: "Color:Red", value: attributeValueId

    if (data.attributes && data.attributes.length > 0) {
      for (const attr of data.attributes) {
        // Upsert Attribute
        const dbAttr = await prisma.attribute.upsert({
          where: { name: attr.name },
          update: {},
          create: { name: attr.name }
        });

        // Upsert Attribute Values
        for (const val of attr.values) {
          const dbVal = await prisma.attributeValue.findFirst({
            where: { attributeId: dbAttr.id, value: val }
          });
          
          if (dbVal) {
            attributeMapping[`${attr.name}:${val}`] = dbVal.id;
          } else {
            const newVal = await prisma.attributeValue.create({
              data: { attributeId: dbAttr.id, value: val }
            });
            attributeMapping[`${attr.name}:${val}`] = newVal.id;
          }
        }
      }
    }

    // 2. Prepare variants payload
    const variantsPayload = data.variants?.length ? data.variants.map((v: any, index: number) => {
      // Connect VariantAttributes
      const varAttrs = [];
      if (v.attributeValues) {
        // attributeValues looks like: { "Color": "Red", "Size": "1KG" }
        for (const [attrName, attrVal] of Object.entries(v.attributeValues)) {
          const valId = attributeMapping[`${attrName}:${attrVal}`];
          if (valId) {
            varAttrs.push({ attributeValue: { connect: { id: valId } } });
          }
        }
      }

      return {
        sku: v.sku || `${data.sku}-${index}`,
        title: v.title || 'Default',
        isDefault: index === 0,
        purchasePrice: Number(v.purchasePrice) || 0,
        sellingPrice: Number(v.sellingPrice) || 0,
        currency: v.currency || 'USD',
        grossWeight: Number(v.weight) || data.grossWeight || 0,
        netWeight: Number(v.netWeight) || data.netWeight || 0,
        volumeCBM: Number(v.cbm) || data.cbm || 0,
        packagingType: v.packageType || data.packageType || 'PP Woven Bag',
        images: v.images && v.images.length ? {
          create: v.images.map((imgStr: string, i: number) => ({ url: typeof imgStr === 'string' ? imgStr : (imgStr as any).url, isPrimary: i === 0 }))
        } : (v.imageUrl ? { create: [{ url: v.imageUrl, isPrimary: true }] } : undefined),
        attributes: { create: varAttrs }
      };
    }) : [{
      sku: data.sku!,
      title: 'Default',
      isDefault: true,
      purchasePrice: Number(data.purchasePrice) || 0,
      sellingPrice: Number(data.sellingPrice) || 0,
      currency: data.currency || 'USD',
      grossWeight: data.grossWeight || 0,
      netWeight: data.netWeight || 0,
      volumeCBM: data.cbm || 0,
      packagingType: data.packageType || 'PP Woven Bag',
      images: data.images?.length ? {
        create: data.images.map((url: string, i: number) => ({ url, isPrimary: i === 0 }))
      } : undefined
    }];

    // 3. Create Product
    const product = await prisma.product.create({
      data: {
        name: data.name!,
        slug: data.sku?.toLowerCase() || `prod-${Date.now()}`,
        shortDescription: data.description,
        hsnCode: data.hsnCode,
        countryOfOrigin: data.countryOfOrigin,
        unitsPerCarton: data.unitsPerCarton ? Number(data.unitsPerCarton) : undefined,
        containerLoadingCapacity: data.containerLoadingCapacity ? Number(data.containerLoadingCapacity) : undefined,
        shelfLife: data.shelfLife,
        storageConditions: data.storageConditions,
        japanImportNotes: data.japanImportNotes,
        
        brand: data.brandId ? { connect: { id: data.brandId } } : undefined,
        
        categories: data.categoryIds?.length > 0 ? {
          create: data.categoryIds.map((id: string) => ({
            category: { connect: { id } }
          }))
        } : undefined,

        suppliers: data.supplierId ? {
          create: [{ supplier: { connect: { id: data.supplierId } } }]
        } : undefined,

        certifications: data.certifications?.length > 0 ? {
          create: data.certifications.map((name: string) => ({ name }))
        } : undefined,

        variants: {
          create: variantsPayload
        }
      },
      include: {
        brand: true,
        categories: { include: { category: true } },
        variants: { include: { images: true, attributes: { include: { attributeValue: { include: { attribute: true } } } } } },
        suppliers: true,
      }
    });

    return this.mapToFrontend(product);
  }


  
  
  async update(id: string, data: any): Promise<Product> {
    // 1. Process attributes & values if provided
    const attributeMapping: Record<string, string> = {};
    if (data.attributes && data.attributes.length > 0) {
      for (const attr of data.attributes) {
        const dbAttr = await prisma.attribute.upsert({
          where: { name: attr.name }, update: {}, create: { name: attr.name }
        });
        for (const val of attr.values) {
          const dbVal = await prisma.attributeValue.findFirst({ where: { attributeId: dbAttr.id, value: val } });
          if (dbVal) { attributeMapping[`${attr.name}:${val}`] = dbVal.id; }
          else {
            const newVal = await prisma.attributeValue.create({ data: { attributeId: dbAttr.id, value: val } });
            attributeMapping[`${attr.name}:${val}`] = newVal.id;
          }
        }
      }
    }

    const updatePayload: any = {
      name: data.name,
      shortDescription: data.description,
      hsnCode: data.hsnCode,
      countryOfOrigin: data.countryOfOrigin,
      unitsPerCarton: data.unitsPerCarton ? Number(data.unitsPerCarton) : undefined,
      containerLoadingCapacity: data.containerLoadingCapacity ? Number(data.containerLoadingCapacity) : undefined,
      shelfLife: data.shelfLife,
      storageConditions: data.storageConditions,
      japanImportNotes: data.japanImportNotes,
      entityStatus: data.entityStatus,
    };

    if (data.brandId) updatePayload.brand = { connect: { id: data.brandId } };
    
    if (data.supplierId) {
      updatePayload.suppliers = {
        deleteMany: {},
        create: [{ supplier: { connect: { id: data.supplierId } } }]
      };
    }
    
    if (data.categoryIds !== undefined) {
      updatePayload.categories = {
        deleteMany: {},
        create: data.categoryIds.map((id: string) => ({
          category: { connect: { id } }
        }))
      };
    }
    
    if (data.certifications !== undefined) {
      updatePayload.certifications = {
        deleteMany: {},
        create: data.certifications.map((name: string) => ({ name }))
      };
    }
    // We will do a transaction to handle the complex variant upsert logic manually 
    // to avoid foreign key violations on deletion.
    return await prisma.$transaction(async (tx) => {
      // 1. Update Product Parent
      const p = await tx.product.update({
        where: { id },
        data: updatePayload
      });

      // 2. Handle variants
      if (data.variants && Array.isArray(data.variants)) {
        const payloadSkus = new Set(data.variants.map((v: any) => v.sku));
        const existingVariants = await tx.productVariant.findMany({ where: { productId: id } });
        
        // Deactivate variants not in payload (Soft Delete)
        for (const ev of existingVariants) {
          if (!payloadSkus.has(ev.sku)) {
            await tx.productVariant.update({
              where: { id: ev.id },
              data: { status: 'INACTIVE' }
            });
          }
        }

        // Upsert variants from payload
        for (const [index, v] of data.variants.entries()) {
          const sku = v.sku || `${data.sku}-${index}`;
          const varAttrs = [];
          if (v.attributeValues) {
            for (const [attrName, attrVal] of Object.entries(v.attributeValues)) {
              const valId = attributeMapping[`${attrName}:${attrVal}`];
              if (valId) varAttrs.push({ attributeValue: { connect: { id: valId } } });
            }
          }

          const variantData = {
            title: v.title || 'Default',
            isDefault: index === 0,
            purchasePrice: Number(v.purchasePrice) || 0,
            sellingPrice: Number(v.sellingPrice) || 0,
            currency: v.currency || 'USD',
            grossWeight: Number(v.weight) || data.grossWeight || 0,
            netWeight: Number(v.netWeight) || data.netWeight || 0,
            volumeCBM: Number(v.cbm) || data.cbm || 0,
            packagingType: v.packageType || data.packageType || 'PP Woven Bag',
            status: 'ACTIVE' as const
          };

          const existingVar = existingVariants.find(ev => ev.sku === sku);
          if (existingVar) {
            await tx.productVariant.update({
              where: { id: existingVar.id },
              data: {
                ...variantData,
                images: v.images && v.images.length ? {
                  deleteMany: {},
                  create: v.images.map((imgStr: string, i: number) => ({ url: typeof imgStr === 'string' ? imgStr : (imgStr as any).url, isPrimary: i === 0 }))
                } : (v.imageUrl ? { deleteMany: {}, create: [{ url: v.imageUrl, isPrimary: true }] } : undefined),
                attributes: {
                  deleteMany: {},
                  create: varAttrs
                }
              }
            });
          } else {
            await tx.productVariant.create({
              data: {
                productId: id,
                sku,
                ...variantData,
                images: v.images && v.images.length ? {
                  create: v.images.map((imgStr: string, i: number) => ({ url: typeof imgStr === 'string' ? imgStr : (imgStr as any).url, isPrimary: i === 0 }))
                } : (v.imageUrl ? { create: [{ url: v.imageUrl, isPrimary: true }] } : undefined),
                attributes: {
                  create: varAttrs
                }
              }
            });
          }
        }
      }

      // 3. Re-fetch full product tree
      const finalProduct = await tx.product.findUniqueOrThrow({
        where: { id },
        include: {
          brand: true,
          categories: { include: { category: true } },
          variants: { 
            where: { status: { not: 'INACTIVE' } },
            include: { images: true, attributes: { include: { attributeValue: { include: { attribute: true } } } } } 
          },
          suppliers: true,
        }
      });

      return this.mapToFrontend(finalProduct);
    });
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
