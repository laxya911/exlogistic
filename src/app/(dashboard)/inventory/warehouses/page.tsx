'use client';
import { PageHeaderUpdater } from '@/components/layout/page-context';
import { Box } from 'lucide-react';
import { CrudManager } from '@/components/settings/CrudManager';

export default function WarehousesPage() {
  return (
    <>
      <PageHeaderUpdater title="Warehouses" subtitle="Inventory Locations" />
      
      <div className="space-y-8 pb-20">
        <div className="grid grid-cols-1 gap-8">
          
          <CrudManager 
            title="Warehouses"
            endpoint="/api/warehouses"
            icon={Box}
            fields={[
              { key: 'name', label: 'Warehouse Name', type: 'text' },
              { key: 'code', label: 'Warehouse Code', type: 'text' },
            ]}
          />

        </div>
      </div>
    </>
  );
}
