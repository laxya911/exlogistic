import { prisma } from '@/repositories/prisma.client';
import { PageHeaderUpdater } from '@/components/layout/page-context';
import { Play, CheckCircle, XCircle } from 'lucide-react';
import { seedStandardWorkflow } from './actions';

export default async function WorkflowsPage() {
  const rules = await prisma.workflowRule.findMany({
    orderBy: { createdAt: 'desc' }
  });

  return (
    <>
      <PageHeaderUpdater title="Workflow Automation"  />
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <p className="text-muted-foreground/60">Configure automated business rules and triggers.</p>
          <form action={seedStandardWorkflow}>
            <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-xl text-sm font-medium transition-colors cursor-pointer">
              + Seed Demo Rule
            </button>
          </form>
        </div>

        <div className="glass p-6 rounded-[2rem] border border-border">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-[10px] font-mono text-muted-foreground/40 uppercase tracking-wider border-b border-border">
                <th className="pb-4 font-medium">Rule Name</th>
                <th className="pb-4 font-medium">Trigger</th>
                <th className="pb-4 font-medium">Action</th>
                <th className="pb-4 font-medium">Status</th>
                <th className="pb-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {rules.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-white/30">
                    No workflow rules configured yet.
                  </td>
                </tr>
              ) : (
                rules.map((rule) => (
                  <tr key={rule.id} className="border-b border-border hover:bg-muted transition-colors">
                    <td className="py-4 font-medium">{rule.name}</td>
                    <td className="py-4">
                      <span className="px-2 py-1 bg-muted rounded-md text-xs font-mono">
                        {rule.triggerEntity}
                      </span>
                    </td>
                    <td className="py-4">
                      <span className="flex items-center gap-2 text-emerald-400">
                        <Play size={14} /> {rule.action}
                      </span>
                    </td>
                    <td className="py-4">
                      {rule.isActive ? (
                        <span className="flex items-center gap-1 text-emerald-500 text-xs">
                          <CheckCircle size={14} /> Active
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-red-400 text-xs">
                          <XCircle size={14} /> Disabled
                        </span>
                      )}
                    </td>
                    <td className="py-4 text-right">
                      <button className="text-blue-400 hover:text-blue-300 text-xs font-mono">EDIT</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
