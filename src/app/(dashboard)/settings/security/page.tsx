'use client';
import { PageHeaderUpdater } from '@/components/layout/page-context';
import { Shield, Key } from 'lucide-react';
import { CrudManager } from '@/components/settings/CrudManager';

export default function SecuritySettingsPage() {
  return (
    <>
      <PageHeaderUpdater title="Security & Roles" subtitle="Access Control and Roles" />
      
      <div className="space-y-8 pb-20">
        <div className="grid grid-cols-1 gap-8">
          
          <CrudManager 
            title="Roles"
            endpoint="/api/roles"
            icon={Shield}
            fields={[
              { key: 'name', label: 'Role Name', type: 'text' },
              { key: 'description', label: 'Description', type: 'text' },
            ]}
          />

          <CrudManager 
            title="Permissions"
            endpoint="/api/permissions"
            icon={Key}
            fields={[
              { key: 'action', label: 'Action (e.g. settings:manage)', type: 'text' },
              { key: 'resource', label: 'Resource', type: 'text' },
              { key: 'description', label: 'Description', type: 'text' },
            ]}
          />

        </div>
      </div>
    </>
  );
}
