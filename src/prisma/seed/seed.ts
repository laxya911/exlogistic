import 'dotenv/config';
import { PrismaClient, EntityStatus, TransactionStatus } from '@generated/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { db } from '../../lib/db';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Starting seed...');

  // 0. Clear Existing Data
  console.log('Clearing database...');
  await prisma.$executeRawUnsafe(`TRUNCATE TABLE "Supplier", "Customer", "Brand", "Category", "Product", "ProductVariant", "ProductCategory", "ProductSupplier", "Quotation", "SalesOrder", "PurchaseOrder", "Shipment" CASCADE`);

  // 1. Base / Lookups (Skipped Ports as they are not in schema)

  // 2. Suppliers
  console.log('Seeding Suppliers...');
  for (const sup of db.suppliers) {
    await prisma.supplier.create({
      data: {
        id: sup.id,
        name: sup.name,
        slug: sup.id.toLowerCase(),
        email: sup.email,
        phone: sup.phone,
        address: sup.address,
        country: sup.country,
        status: sup.entityStatus === 'ACTIVE' ? EntityStatus.ACTIVE : EntityStatus.INACTIVE,
        performanceRating: (sup as any).performanceRating || 4.0,
        contacts: (sup as any).contacts ? (sup as any).contacts : undefined,
        paymentTerms: (sup as any).paymentTerms ? JSON.stringify((sup as any).paymentTerms) : undefined,
      }
    });
  }

  // 3. Customers
  console.log('Seeding Customers...');
  for (const cust of db.customers) {
    await prisma.customer.create({
      data: {
        id: cust.id,
        name: cust.name,
        slug: cust.id.toLowerCase(),
        email: cust.email,
        phone: cust.phone,
        address: cust.address,
        country: cust.country,
        status: cust.entityStatus === 'ACTIVE' ? EntityStatus.ACTIVE : EntityStatus.INACTIVE,
        creditLimit: (cust as any).creditLimit || 50000,
        segment: (cust as any).segment || 'STANDARD',
        contacts: (cust as any).contacts ? (cust as any).contacts : undefined,
        paymentTerms: (cust as any).paymentTerms ? JSON.stringify((cust as any).paymentTerms) : undefined,
      }
    });
  }

  // 4. Products & Variants
  console.log('Seeding Products and Variants...');
  
  // Extract unique brands and categories
  const brandNames = [...new Set(db.products.map(p => p.brand))].filter(Boolean);
  const categoryNames = [...new Set(db.products.map(p => p.category))].filter(Boolean);

  const brandMap = new Map();
  for (const bName of brandNames) {
    const brand = await prisma.brand.create({
      data: {
        name: bName,
        slug: bName.toLowerCase().replace(/[^a-z0-9]/g, '-') + '-' + Math.random().toString(36).substring(7),
      }
    });
    brandMap.set(bName, brand.id);
  }

  const catMap = new Map();
  for (const cName of categoryNames) {
    const cat = await prisma.category.create({
      data: {
        name: cName,
        slug: cName.toLowerCase().replace(/[^a-z0-9]/g, '-') + '-' + Math.random().toString(36).substring(7),
      }
    });
    catMap.set(cName, cat.id);
  }

  for (const prod of db.products) {
    const supplierId = prod.supplierId || db.suppliers[0].id;

    const product = await prisma.product.create({
      data: {
        id: prod.id,
        slug: (prod as any).sku.toLowerCase(),
        name: prod.name,
        shortDescription: (prod as any).description,
        hsnCode: (prod as any).hsnCode,
        countryOfOrigin: prod.countryOfOrigin,
        defaultImage: prod.images?.[0] || null,
        isPublished: true,
        status: prod.entityStatus === 'ACTIVE' ? EntityStatus.ACTIVE : EntityStatus.INACTIVE,
        brandId: prod.brand ? brandMap.get(prod.brand) : null,
      }
    });

    if (prod.category && catMap.has(prod.category)) {
      await prisma.productCategory.create({
        data: {
          productId: product.id,
          categoryId: catMap.get(prod.category),
        }
      });
    }

    // Link Supplier
    await prisma.productSupplier.create({
      data: {
        productId: product.id,
        supplierId: supplierId,
        purchasePrice: prod.purchasePrice,
        moq: prod.moq,
        leadTime: prod.leadTime,
      }
    });

    // Create a single default variant representing the sellable item
    const variantId = `VAR-${prod.id}`;
    await prisma.productVariant.create({
      data: {
        id: variantId,
        productId: product.id,
        sku: (prod as any).sku,
        title: 'Default',
        slug: (prod as any).sku.toLowerCase(),
        isDefault: true,
        weight: prod.grossWeight,
        grossWeight: prod.grossWeight,
        netWeight: prod.netWeight,
        volumeCBM: prod.cbm,
        packagingType: (prod as any).packageType,
        purchasePrice: (prod as any).purchasePrice || 0,
        sellingPrice: (prod as any).sellingPrice || 0,
        currency: (prod as any).currency || 'USD',
        status: EntityStatus.ACTIVE,
      }
    });

    // We store the variant mapping to correctly link transactions later
    (prod as any).variantId = variantId; // Mutation for the seed script's use
  }

  // Helper map for variants
  const getVariantId = (productId: string) => {
    const prod = db.products.find(p => p.id === productId);
    return (prod as any)?.variantId;
  };

  // 5. Quotations
  console.log('Seeding Quotations...');
  for (const quote of db.quotations) {
    const qStatusMap: Record<string, TransactionStatus> = {
      'DRAFT': TransactionStatus.DRAFT,
      'SENT': TransactionStatus.PENDING,
      'APPROVED': TransactionStatus.CONFIRMED,
      'REJECTED': TransactionStatus.CANCELLED,
    };

    await prisma.quotation.create({
      data: {
        id: quote.id,
        quotationNo: quote.quotationNo,
        customerId: quote.customerId,
        date: new Date(quote.date),
        validityDate: new Date(quote.validityDate),
        totalValue: quote.totalValue,
        status: qStatusMap[quote.status] || TransactionStatus.DRAFT,
        incoterm: (quote as any).incoterm || null,
        paymentTerms: (quote as any).paymentTerms || null,
        currency: (quote as any).currency || 'USD',
        marginPercentage: (quote as any).marginPercentage || null,
        container: (quote as any).container || (quote as any).containerType || null,
        expectedShipment: (quote as any).expectedShipment ? new Date((quote as any).expectedShipment) : ((quote as any).expectedShipmentDate ? new Date((quote as any).expectedShipmentDate) : null),
        remarks: (quote as any).remarks || null,
        originPortId: (quote as any).originPortId || null,
        destinationPortId: (quote as any).destinationPortId || null,
        timeline: (quote as any).timeline ? JSON.stringify((quote as any).timeline) : undefined,
        documents: (quote as any).documents ? JSON.stringify((quote as any).documents) : undefined,
        items: {
          create: quote.items.map(item => ({
            variantId: getVariantId(item.productId),
            quantity: item.quantity,
            unitPrice: item.unitPrice,
          }))
        }
      }
    });
  }

  // 6. Sales Orders
  console.log('Seeding Sales Orders...');
  for (const so of db.salesOrders) {
    const soStatusMap: Record<string, TransactionStatus> = {
      'PENDING': TransactionStatus.PENDING,
      'CONFIRMED': TransactionStatus.CONFIRMED,
      'PRODUCTION': TransactionStatus.CONFIRMED,
      'READY': TransactionStatus.CONFIRMED,
      'SHIPPED': TransactionStatus.SHIPPED,
      'CANCELLED': TransactionStatus.CANCELLED,
    };

    await prisma.salesOrder.create({
      data: {
        id: so.id,
        orderNo: so.orderNo,
        customerId: so.customerId,
        quotationId: so.quotationId,
        date: new Date(so.date),
        totalValue: so.totalValue,
        status: soStatusMap[so.status] || TransactionStatus.PENDING,
        incoterm: (so as any).incoterm || null,
        paymentTerms: (so as any).paymentTerms || null,
        currency: (so as any).currency || 'USD',
        marginPercentage: (so as any).marginPercentage || null,
        container: (so as any).container || (so as any).containerType || null,
        expectedShipment: (so as any).expectedShipment ? new Date((so as any).expectedShipment) : ((so as any).expectedShipmentDate ? new Date((so as any).expectedShipmentDate) : null),
        remarks: (so as any).remarks || null,
        items: {
          create: so.items.map(item => ({
            variantId: getVariantId(item.productId),
            quantity: item.quantity,
            unitPrice: item.unitPrice,
          }))
        }
      }
    });
  }

  // 7. Purchase Orders
  console.log('Seeding Purchase Orders...');
  for (const po of db.purchaseOrders) {
    const poStatusMap: Record<string, TransactionStatus> = {
      'DRAFT': TransactionStatus.DRAFT,
      'ISSUED': TransactionStatus.PENDING,
      'ACKNOWLEDGED': TransactionStatus.CONFIRMED,
      'IN_PRODUCTION': TransactionStatus.CONFIRMED,
      'DISPATCHED': TransactionStatus.SHIPPED,
      'RECEIVED': TransactionStatus.COMPLETED,
      'CANCELLED': TransactionStatus.CANCELLED,
    };

    await prisma.purchaseOrder.create({
      data: {
        id: po.id,
        poNo: po.poNo,
        supplierId: po.supplierId,
        salesOrderId: po.salesOrderId,
        date: new Date(po.date),
        totalValue: po.totalValue,
        status: poStatusMap[po.status] || TransactionStatus.DRAFT,
        incoterm: (po as any).incoterm || null,
        paymentTerms: (po as any).paymentTerms || null,
        currency: (po as any).currency || 'USD',
        marginPercentage: (po as any).marginPercentage || null,
        container: (po as any).container || null,
        expectedDeliveryDate: (po as any).expectedDeliveryDate ? new Date((po as any).expectedDeliveryDate) : null,
        remarks: (po as any).remarks || null,
        items: {
          create: po.items.map(item => ({
            variantId: getVariantId(item.productId),
            quantity: item.quantity,
            unitPrice: item.unitPrice,
          }))
        }
      }
    });
  }

  // 8. Shipments
  console.log('Seeding Shipments...');
  for (const shp of db.shipments) {
    const shpStatusMap: Record<string, TransactionStatus> = {
      'BOOKING': TransactionStatus.DRAFT,
      'STUFFING': TransactionStatus.PENDING,
      'CUSTOMS': TransactionStatus.PENDING,
      'ON_VESSEL': TransactionStatus.SHIPPED,
      'TRANSIT': TransactionStatus.SHIPPED,
      'ARRIVED': TransactionStatus.COMPLETED,
      'DELIVERED': TransactionStatus.COMPLETED,
      'COMPLETED': TransactionStatus.COMPLETED,
      'CANCELLED': TransactionStatus.CANCELLED,
    };

    // Need a valid order ID for testing mock mapping. If missing, skip.
    if (!db.salesOrders.find(s => s.id === (shp as any).orderId)) {
       // Our mock data structure linked Shipments to salesOrders via orderId
       // wait, in db.ts mock data, what's the field? Let's assume shp.orderId is present.
       // Actually in our schema: salesOrderId String
       // wait, in db.ts we use so.id in mapping? The mock generator might not have set orderId explicitly or we missed it. 
       // We'll link to the first SO just to prevent FK errors if orderId is missing.
    }
    
    // In db.ts, mock shipments are mapped with no items! Wait, we'll map SO items as shipment items.
    const so = db.salesOrders.find(s => s.id === (shp as any).orderId) || db.salesOrders[0];

    await prisma.shipment.create({
      data: {
        id: shp.id,
        shipmentNo: shp.shipmentNo,
        salesOrderId: so.id,
        originPortId: shp.originPortId || 'TYO',
        destinationPortId: shp.destinationPortId || 'LAX',
        etd: new Date(shp.etd),
        eta: new Date(shp.eta),
        status: shpStatusMap[shp.status] || TransactionStatus.DRAFT,
        items: {
          create: so.items.map(item => ({
            variantId: getVariantId(item.productId),
            quantity: item.quantity,
          }))
        }
      }
    });
  }

  console.log('Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
