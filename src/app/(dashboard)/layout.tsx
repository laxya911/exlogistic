import React from 'react';
import { MasterPage } from '@/components/layout/master-page';
import { PageProvider } from '@/components/layout/page-context';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <PageProvider>
      <MasterPage>
        {children}
      </MasterPage>
    </PageProvider>
  );
}
