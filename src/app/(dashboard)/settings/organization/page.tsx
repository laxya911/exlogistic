'use client';
import { useState, useEffect } from 'react';
import { PageHeaderUpdater } from '@/components/layout/page-context';
import { Building2, Users, Briefcase } from 'lucide-react';
import { CrudManager } from '@/components/settings/CrudManager';

export default function OrganizationSettingsPage() {
  const [departments, setDepartments] = useState<{label: string, value: string}[]>([]);

  useEffect(() => {
    fetch('/api/departments')
      .then(res => res.json())
      .then(data => setDepartments(data.map((d: any) => ({ label: d.name, value: d.id }))))
      .catch(console.error);
  }, []);

  return (
    <>
      <PageHeaderUpdater title="Organization" subtitle="Departments, Teams, and Positions" />
      
      <div className="space-y-8 pb-20">
        <div className="grid grid-cols-1 gap-8">
          
          <CrudManager 
            title="Departments"
            endpoint="/api/departments"
            icon={Building2}
            fields={[
              { key: 'name', label: 'Department Name', type: 'text' },
              { key: 'description', label: 'Description', type: 'text' },
            ]}
          />

          <CrudManager 
            title="Teams"
            endpoint="/api/teams"
            icon={Users}
            fields={[
              { key: 'name', label: 'Team Name', type: 'text' },
              { key: 'departmentId', label: 'Department', type: 'select', options: departments },
              { key: 'description', label: 'Description', type: 'text' },
            ]}
          />

          <CrudManager 
            title="Positions"
            endpoint="/api/positions"
            icon={Briefcase}
            fields={[
              { key: 'title', label: 'Job Title', type: 'text' },
              { key: 'description', label: 'Description', type: 'text' },
            ]}
          />

        </div>
      </div>
    </>
  );
}
