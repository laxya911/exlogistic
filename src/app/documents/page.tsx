'use client';

import React, { useState } from 'react';
import { MasterPage } from '@/components/layout/master-page';
import { 
  FileText, 
  Download, 
  Printer, 
  Eye, 
  Search, 
  CheckCircle2, 
  Clock, 
  FileCode,
  FileBox,
  FileCheck,
  FileType,
  XCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'motion/react';

export default function DocumentCenterPage() {
  const [search, setSearch] = useState('');
  const [selectedDoc, setSelectedDoc] = useState<any>(null);

  const docTypes = [
    { name: 'Commercial Invoice', icon: FileText, count: 45, color: 'text-blue-400' },
    { name: 'Packing List', icon: FileBox, count: 42, color: 'text-emerald-400' },
    { name: 'Proforma Invoice', icon: FileCode, count: 28, color: 'text-amber-400' },
    { name: 'Shipping Instruction', icon: FileCheck, count: 15, color: 'text-violet-400' },
    { name: 'Certificate of Origin', icon: FileType, count: 12, color: 'text-rose-400' },
  ];

  const recentDocs = Array.from({ length: 10 }).map((_, i) => ({
    id: `DOC-${1000 + i}`,
    name: `${i % 2 === 0 ? 'Invoice' : 'Packing List'} #INV-2025-00${i + 1}`,
    type: i % 2 === 0 ? 'Commercial Invoice' : 'Packing List',
    date: new Date().toLocaleDateString(),
    size: '1.2 MB',
    status: 'SIGNED'
  }));

  return (
    <MasterPage 
      title="Document Repository" 
      subtitle="Digital Asset & Compliance Archive"
      searchValue={search}
      onSearchChange={setSearch}
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className={cn("space-y-12", selectedDoc ? "lg:col-span-7" : "lg:col-span-12")}>
          {/* Category Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
            {docTypes.map((type, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="glass p-6 rounded-2xl border border-white/5 hover:border-white/20 transition-all cursor-pointer group"
              >
                <div className={cn("w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center mb-4 transition-transform group-hover:scale-110", type.color)}>
                  <type.icon size={20} />
                </div>
                <p className="text-xs font-medium text-white/80 mb-1">{type.name}</p>
                <p className="text-[10px] font-mono text-white/20 uppercase tracking-widest">{type.count} Documents</p>
              </motion.div>
            ))}
          </div>

          {/* Recent Documents */}
          <div className="glass p-8 rounded-[2.5rem] border border-white/5">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-lg font-display font-medium">Recent Assets</h3>
            </div>

            <div className="space-y-2">
              {recentDocs.map((doc, i) => (
                <div 
                  key={i} 
                  className={cn(
                    "flex items-center justify-between p-4 rounded-xl hover:bg-white/[0.02] transition-colors group cursor-pointer",
                    selectedDoc?.id === doc.id && "bg-white/5 border border-white/10"
                  )}
                  onClick={() => setSelectedDoc(doc)}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded bg-white/5 flex items-center justify-center text-white/20 group-hover:text-blue-500 transition-colors">
                      <FileText size={14} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white/80">{doc.name}</p>
                      <p className="text-[10px] font-mono text-white/20 uppercase tracking-widest">{doc.type} • {doc.date}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-8">
                    <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[9px] font-mono font-bold uppercase tracking-widest border border-emerald-500/10">
                      {doc.status}
                    </span>
                    <button className="p-2 rounded hover:bg-white/5 text-white/40 hover:text-white transition-opacity opacity-0 group-hover:opacity-100">
                      <Download size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Document Preview */}
        <AnimatePresence>
          {selectedDoc && (
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="lg:col-span-5"
            >
              <div className="glass p-1 rounded-[2.5rem] border border-white/10 h-full min-h-[800px] flex flex-col">
                <div className="p-8 border-b border-white/5 flex justify-between items-center bg-white/[0.02] rounded-t-[2.4rem]">
                  <div>
                    <h3 className="font-display font-medium">{selectedDoc.name}</h3>
                    <p className="text-[10px] font-mono text-white/20 uppercase tracking-widest">PREVIEW MODE • READ ONLY</p>
                  </div>
                  <div className="flex gap-2">
                    <button className="p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors">
                      <Printer size={18} className="text-white/40" />
                    </button>
                    <button className="p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors" onClick={() => setSelectedDoc(null)}>
                      <XCircle size={18} className="text-white/40" />
                    </button>
                  </div>
                </div>

                <div className="flex-1 bg-white p-12 overflow-y-auto m-6 rounded-2xl shadow-inner">
                  {/* Mock Professional Document Layout */}
                  <div className="text-black font-sans space-y-12">
                    <div className="flex justify-between items-start">
                      <div>
                        <h1 className="text-3xl font-bold tracking-tighter mb-2">EXLOGIS</h1>
                        <p className="text-xs uppercase font-bold tracking-widest text-gray-400">Global ERP Matrix</p>
                      </div>
                      <div className="text-right">
                        <h2 className="text-xl font-bold uppercase mb-1">{selectedDoc.type}</h2>
                        <p className="text-xs text-gray-500">Ref: {selectedDoc.id}</p>
                        <p className="text-xs text-gray-500">Date: {selectedDoc.date}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-12 pt-8 border-t border-gray-100">
                      <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase mb-4">Shipper / Exporter</p>
                        <div className="text-sm font-medium">
                          ExLogis Industrial Solutions<br />
                          100 Matrix Tower, Global Hub<br />
                          Singapore 018989<br />
                          Tel: +65 6777 8888
                        </div>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase mb-4">Consignee / Buyer</p>
                        <div className="text-sm font-medium">
                          Global Trade Solutions Inc.<br />
                          450 Business Blvd, Suite 100<br />
                          Los Angeles, CA 90001, USA<br />
                          Tel: +1 555 0199
                        </div>
                      </div>
                    </div>

                    <table className="w-full text-left text-sm border-collapse">
                      <thead>
                        <tr className="border-y-2 border-black">
                          <th className="py-4 font-bold">DESCRIPTION</th>
                          <th className="py-4 font-bold text-center">QTY</th>
                          <th className="py-4 font-bold text-right">PRICE</th>
                          <th className="py-4 font-bold text-right">TOTAL</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {Array.from({ length: 4 }).map((_, i) => (
                          <tr key={i}>
                            <td className="py-6">
                              <p className="font-bold">Industrial Motor Control Sensor X{i+1}</p>
                              <p className="text-[10px] text-gray-400">HSN: 8481.1000 • Origin: Singapore</p>
                            </td>
                            <td className="py-6 text-center">150 PCS</td>
                            <td className="py-6 text-right">$45.00</td>
                            <td className="py-6 text-right">$6,750.00</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="border-t-2 border-black font-bold">
                          <td colSpan={3} className="py-6 text-right">TOTAL NET VALUE</td>
                          <td className="py-6 text-right">$27,000.00</td>
                        </tr>
                        <tr className="text-gray-400 italic">
                          <td colSpan={4} className="py-2 text-xs">Say: TWENTY-SEVEN THOUSAND US DOLLARS ONLY</td>
                        </tr>
                      </tfoot>
                    </table>

                    <div className="pt-12 border-t-2 border-gray-100">
                      <div className="grid grid-cols-2 gap-12">
                        <div>
                          <p className="text-[10px] font-bold text-gray-400 uppercase mb-2">Incoterms</p>
                          <p className="text-sm font-bold">FOB TOKYO PORT</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-gray-400 uppercase mb-2">Payment Terms</p>
                          <p className="text-sm font-bold">30 DAYS NET</p>
                        </div>
                      </div>
                    </div>

                    <div className="pt-24 text-center">
                      <div className="inline-block border-t border-black px-12 py-2">
                        <p className="text-[10px] font-bold uppercase">Authorized Signatory</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-6 bg-white/5 rounded-b-[2.4rem] border-t border-white/5 flex justify-center gap-4">
                  <button className="px-8 py-3 bg-blue-500 text-black rounded-xl text-[10px] font-mono font-bold uppercase tracking-widest hover:bg-blue-400 transition-all flex items-center gap-2">
                    <Download size={14} /> Download Secure PDF
                  </button>
                  <button className="px-8 py-3 bg-white/5 border border-white/10 rounded-xl text-[10px] font-mono font-bold uppercase tracking-widest hover:bg-white/10 transition-all">
                    Share Matrix Link
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </MasterPage>
  );
}

