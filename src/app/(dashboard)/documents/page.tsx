'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { PageHeaderUpdater } from '@/components/layout/page-context';
import { 
  FileText, Download, Printer, Eye, Search, CheckCircle2, 
  Clock, FileCode, FileBox, FileCheck, FileType, XCircle,
  Archive, Trash2, Edit3, ShieldCheck, Ship, Box, Anchor,
  Filter, AlertCircle, FileSearch, ArrowRight
} from 'lucide-react';
import { toast } from 'sonner';
import { cn, formatCurrency, formatDate } from '@/lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { ERPDocument } from '@/types';

// ──────────────────────────────────────────
// Helper Icons for Document Types
// ──────────────────────────────────────────
const getDocIcon = (type: string) => {
  switch (type) {
    case 'Commercial Invoice': return <FileText size={18} className="text-blue-400" />;
    case 'Packing List': return <FileBox size={18} className="text-emerald-400" />;
    case 'Proforma Invoice': return <FileCode size={18} className="text-amber-400" />;
    case 'Bill of Lading': return <Ship size={18} className="text-indigo-400" />;
    case 'Certificate of Origin': return <FileType size={18} className="text-rose-400" />;
    case 'Phytosanitary Certificate': return <FileCheck size={18} className="text-green-500" />;
    case 'Quality Certificate': return <ShieldCheck size={18} className="text-cyan-400" />;
    case 'Insurance Certificate': return <AlertCircle size={18} className="text-violet-400" />;
    case 'Shipping Instruction': return <Anchor size={18} className="text-orange-400" />;
    case 'Purchase Order': return <Box size={18} className="text-fuchsia-400" />;
    default: return <FileText size={18} className="text-muted-foreground" />;
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'SIGNED': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
    case 'DRAFT': return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
    case 'ARCHIVED': return 'text-muted-foreground bg-muted border-border';
    default: return 'text-foreground/90 bg-accent border-border';
  }
};

function DocumentCenterContent() {
  const [docs, setDocs] = useState<ERPDocument[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Selection & Viewing
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Filters
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  
  // Active Action State
  const [isProcessing, setIsProcessing] = useState(false);

  const searchParams = useSearchParams();
  const docIdParam = searchParams.get('selectedId');

  useEffect(() => {
    if (docIdParam) {
      setSelectedDocId(docIdParam);
    }
  }, [docIdParam]);

  useEffect(() => {
    fetchDocs();
  }, []);

  const fetchDocs = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/documents');
      const data = await res.json();
      setDocs(data);
    } catch (e) {
      toast.error('Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  const selectedDoc = docs.find(d => d.id === selectedDocId);

  // Stats
  const docTypes = useMemo(() => {
    const counts = docs.reduce((acc, doc) => {
      acc[doc.type] = (acc[doc.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [docs]);

  const signedCount = docs.filter(d => d.status === 'SIGNED').length;
  const draftCount = docs.filter(d => d.status === 'DRAFT').length;

  // Filtering
  const filteredDocs = docs.filter(doc => {
    const matchSearch = doc.name.toLowerCase().includes(search.toLowerCase()) || 
                        doc.type.toLowerCase().includes(search.toLowerCase()) ||
                        doc.relatedId?.toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === 'ALL' || doc.type === typeFilter;
    const matchStatus = statusFilter === 'ALL' || doc.status === statusFilter;
    return matchSearch && matchType && matchStatus;
  });

  // Actions
  const handleAction = async (id: string, action: 'sign' | 'archive' | 'restore') => {
    try {
      setIsProcessing(true);
      const res = await fetch(`/api/documents/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      });
      if (!res.ok) throw new Error('Action failed');
      const updated = await res.json();
      setDocs(prev => prev.map(d => d.id === id ? updated : d));
      toast.success(`Document ${action}ed successfully`);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Move document to trash?')) return;
    try {
      setIsProcessing(true);
      const res = await fetch(`/api/documents/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
      setDocs(prev => prev.filter(d => d.id !== id));
      if (selectedDocId === id) setSelectedDocId(null);
      toast.success('Document deleted');
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = async () => {
    if (!selectedDoc) return;
    const originalStylesheets: { element: Element; parent: Node; nextSibling: Node | null }[] = [];
    const tempStyleElements: HTMLStyleElement[] = [];

    try {
      for (let i = 0; i < document.styleSheets.length; i++) {
        const sheet = document.styleSheets[i];
        const ownerNode = sheet.ownerNode as Element;
        if (ownerNode && (ownerNode.tagName === 'STYLE' || ownerNode.tagName === 'LINK')) {
          try {
            const rules = sheet.cssRules || sheet.rules;
            if (rules) {
              let hasProblematicColors = false;
              let cssText = '';
              for (let j = 0; j < rules.length; j++) {
                const ruleText = rules[j].cssText;
                cssText += ruleText + '\n';
                if (
                  ruleText.includes('oklch(') ||
                  ruleText.includes('lab(') ||
                  ruleText.includes('oklab(') ||
                  ruleText.includes('lch(')
                ) {
                  hasProblematicColors = true;
                }
              }

              if (hasProblematicColors) {
                originalStylesheets.push({
                  element: ownerNode,
                  parent: ownerNode.parentNode!,
                  nextSibling: ownerNode.nextSibling,
                });

                const cleanCss = cssText
                  .replace(/oklch\([^)]+\)/g, 'rgb(0,0,0)')
                  .replace(/lab\([^)]+\)/g, 'rgb(0,0,0)')
                  .replace(/oklab\([^)]+\)/g, 'rgb(0,0,0)')
                  .replace(/lch\([^)]+\)/g, 'rgb(0,0,0)');

                const tempStyle = document.createElement('style');
                tempStyle.textContent = cleanCss;
                tempStyleElements.push(tempStyle);
              }
            }
          } catch (e) {
            // Ignore cross-origin stylesheet errors
          }
        }
      }

      // Swap stylesheets in the DOM
      for (const { element } of originalStylesheets) {
        element.remove();
      }
      for (const tempStyle of tempStyleElements) {
        document.head.appendChild(tempStyle);
      }

      const html2pdf = (await import('html2pdf.js')).default;
      const element = document.getElementById('document-canvas');
      if (element) {
        const opt = {
          margin:       10,
          filename:     `${selectedDoc.name.replace(/\s+/g, '_')}.pdf`,
          image:        { type: 'jpeg' as 'jpeg', quality: 0.98 },
          html2canvas:  { scale: 2, useCORS: true },
          jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' as const },
          pagebreak:    { mode: 'css', avoid: '.break-inside-avoid' }
        };
        await html2pdf().set(opt).from(element).save();
      } else {
        toast.error('Document canvas element not found');
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to generate PDF download');
    } finally {
      // Always restore original stylesheets
      for (const tempStyle of tempStyleElements) {
        tempStyle.remove();
      }
      for (const { element, parent, nextSibling } of originalStylesheets) {
        parent.insertBefore(element, nextSibling);
      }
    }
  };

  const toggleSelection = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedIds(newSet);
  };

  const toggleAll = () => {
    if (selectedIds.size === filteredDocs.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(filteredDocs.map(d => d.id)));
  };

  return (
    <>
      <PageHeaderUpdater title="Document Vault" subtitle="Digital Trade Asset & Compliance Archive" />
      <div className="space-y-6">
        
        {/* Top KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="glass p-5 rounded-3xl border border-border">
            <div className="flex justify-between items-start mb-2">
              <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">Total Assets</p>
              <FileSearch size={14} className="text-blue-400" />
            </div>
            <p className="font-sans font-bold text-2xl text-foreground">{docs.length}</p>
          </div>
          <div className="glass p-5 rounded-3xl border border-emerald-500/20 bg-emerald-500/5">
            <div className="flex justify-between items-start mb-2">
              <p className="text-[10px] font-mono text-emerald-400/60 uppercase tracking-widest">Signed & Executed</p>
              <CheckCircle2 size={14} className="text-emerald-400" />
            </div>
            <p className="font-sans font-bold text-2xl text-emerald-400">{signedCount}</p>
          </div>
          <div className="glass p-5 rounded-3xl border border-amber-500/20 bg-amber-500/5">
            <div className="flex justify-between items-start mb-2">
              <p className="text-[10px] font-mono text-amber-400/60 uppercase tracking-widest">Pending Drafts</p>
              <Edit3 size={14} className="text-amber-400" />
            </div>
            <p className="font-sans font-bold text-2xl text-amber-400">{draftCount}</p>
          </div>
          <div className="glass p-5 rounded-3xl border border-border flex flex-col justify-center">
            <button className="flex items-center justify-center gap-2 w-full py-3 bg-blue-500 text-black text-[10px] font-mono font-bold uppercase tracking-widest rounded-xl hover:bg-blue-400 transition-colors border-none cursor-pointer">
              <FileText size={14} /> Upload Document
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-20rem)] min-h-137.5">
          
          {/* LEFT: Document List */}
          <div className={cn("glass rounded-4xl border border-border flex flex-col overflow-hidden transition-all duration-300", selectedDocId ? "lg:col-span-5" : "lg:col-span-12")}>
            {/* Filters */}
            <div className="p-6 border-b border-border bg-white/2 space-y-4">
              <div className="flex gap-4">
                <div className="relative flex-1">
                  <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input 
                    type="text" 
                    placeholder="Search documents, references..." 
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full bg-muted border border-border rounded-xl py-3 pl-10 pr-4 text-xs font-mono focus:outline-none focus:border-blue-500/50 text-foreground"
                  />
                </div>
                <select 
                  value={typeFilter} 
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="bg-muted border border-border rounded-xl px-4 py-3 text-xs font-mono text-foreground focus:outline-none focus:border-blue-500/50 cursor-pointer w-48"
                >
                  <option value="ALL" className="bg-background">All Types</option>
                  {docTypes.map(([type, count]) => (
                    <option key={type} value={type} className="bg-background">{type} ({count})</option>
                  ))}
                </select>
                <select 
                  value={statusFilter} 
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-muted border border-border rounded-xl px-4 py-3 text-xs font-mono text-foreground focus:outline-none focus:border-blue-500/50 cursor-pointer w-32"
                >
                  <option value="ALL" className="bg-background">All Status</option>
                  <option value="SIGNED" className="bg-background">Signed</option>
                  <option value="DRAFT" className="bg-background">Draft</option>
                  <option value="ARCHIVED" className="bg-background">Archived</option>
                </select>
              </div>
              
              {/* Bulk Actions Bar */}
              <AnimatePresence>
                {selectedIds.size > 0 && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="flex justify-between items-center py-2 px-4 bg-blue-500/10 border border-blue-500/20 rounded-xl overflow-hidden"
                  >
                    <span className="text-xs font-mono text-blue-400">{selectedIds.size} selected</span>
                    <div className="flex gap-2">
                      <button className="px-3 py-1.5 bg-blue-500 text-black text-[10px] font-mono font-bold uppercase rounded hover:bg-blue-400 cursor-pointer border-none flex items-center gap-1"><Download size={12}/> Download</button>
                      <button className="px-3 py-1.5 bg-accent text-foreground text-[10px] font-mono font-bold uppercase rounded hover:bg-white/20 cursor-pointer border-none flex items-center gap-1"><Archive size={12}/> Archive</button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
              <div className="flex items-center px-4 py-2 text-[9px] font-mono text-muted-foreground uppercase tracking-widest">
                <input 
                  type="checkbox" 
                  checked={selectedIds.size === filteredDocs.length && filteredDocs.length > 0}
                  onChange={toggleAll}
                  className="mr-4 accent-blue-500 cursor-pointer"
                />
                <span className="flex-1">Document Details</span>
                {!selectedDocId && <span className="w-24 text-right">Size</span>}
                <span className="w-24 text-right">Status</span>
              </div>
              
              {filteredDocs.map(doc => (
                <div 
                  key={doc.id}
                  onClick={(e) => {
                    if ((e.target as HTMLElement).tagName !== 'INPUT') {
                      setSelectedDocId(doc.id === selectedDocId ? null : doc.id);
                    }
                  }}
                  className={cn(
                    "flex items-center px-4 py-3 rounded-xl hover:bg-muted transition-colors cursor-pointer group border",
                    selectedDocId === doc.id ? "bg-muted border-border" : "border-transparent"
                  )}
                >
                  <input 
                    type="checkbox" 
                    checked={selectedIds.has(doc.id)}
                    onChange={() => toggleSelection(doc.id)}
                    className="mr-4 accent-blue-500 cursor-pointer"
                    onClick={(e) => e.stopPropagation()}
                  />
                  <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center mr-4 shrink-0">
                    {getDocIcon(doc.type)}
                  </div>
                  <div className="flex-1 min-w-0 pr-4">
                    <p className="text-sm font-bold text-foreground/90 truncate">{doc.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] font-mono text-muted-foreground uppercase truncate">{doc.type}</span>
                      <span className="text-muted-foreground text-[10px]">•</span>
                      <span className="text-[10px] font-mono text-blue-400/70 hover:text-blue-400 truncate">
                        {doc.relatedId}
                      </span>
                    </div>
                  </div>
                  
                  {!selectedDocId && (
                    <span className="w-24 text-right text-xs font-mono text-muted-foreground shrink-0">
                      {doc.size}
                    </span>
                  )}
                  
                  <div className="w-24 text-right shrink-0 flex justify-end">
                    <span className={cn("px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase tracking-widest border", getStatusColor(doc.status))}>
                      {doc.status}
                    </span>
                  </div>
                </div>
              ))}
              
              {filteredDocs.length === 0 && (
                <div className="py-20 text-center">
                  <FileSearch size={32} className="mx-auto text-white/10 mb-4" />
                  <p className="text-xs font-mono text-muted-foreground uppercase tracking-widest">No documents found</p>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT: Document Viewer */}
          <AnimatePresence>
            {selectedDoc && (
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="lg:col-span-7 h-full flex flex-col glass rounded-4xl border border-border overflow-hidden relative"
              >
                {/* Header Actions */}
                <div className="p-6 border-b border-border bg-white/2 flex justify-between items-start shrink-0">
                  <div>
                    <h3 className="font-display font-medium text-lg mb-1">{selectedDoc.name}</h3>
                    <div className="flex items-center gap-3 text-[10px] font-mono uppercase tracking-widest">
                      <span className="text-muted-foreground">{selectedDoc.type}</span>
                      <span className="text-muted-foreground">•</span>
                      <span className="text-muted-foreground">{formatDate(selectedDoc.createdAt)}</span>
                      <span className="text-muted-foreground">•</span>
                      <span className="text-blue-400">{selectedDoc.relatedId}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {selectedDoc.status === 'DRAFT' && (
                      <button onClick={() => handleAction(selectedDoc.id, 'sign')} disabled={isProcessing} className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 cursor-pointer border-none" title="Sign & Execute">
                        <CheckCircle2 size={16} />
                      </button>
                    )}
                    {selectedDoc.status === 'ARCHIVED' ? (
                      <button onClick={() => handleAction(selectedDoc.id, 'restore')} disabled={isProcessing} className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 cursor-pointer border-none" title="Restore">
                        <ArrowRight size={16} />
                      </button>
                    ) : (
                      <button onClick={() => handleAction(selectedDoc.id, 'archive')} disabled={isProcessing} className="p-2.5 rounded-xl bg-muted text-muted-foreground hover:text-foreground hover:bg-accent cursor-pointer border-none" title="Archive">
                        <Archive size={16} />
                      </button>
                    )}
                    <button onClick={handlePrint} className="p-2.5 rounded-xl bg-muted text-muted-foreground hover:text-foreground hover:bg-accent cursor-pointer border-none" title="Print">
                      <Printer size={16} />
                    </button>
                    <button onClick={() => handleDelete(selectedDoc.id)} disabled={isProcessing} className="p-2.5 rounded-xl bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 cursor-pointer border-none" title="Delete">
                      <Trash2 size={16} />
                    </button>
                    <button onClick={() => setSelectedDocId(null)} className="p-2.5 rounded-xl bg-muted text-muted-foreground hover:text-foreground hover:bg-accent cursor-pointer border-none ml-2">
                      <XCircle size={16} />
                    </button>
                  </div>
                </div>

                {/* PDF Viewer Mockup */}
                <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-muted custom-scrollbar">
                  <div id="document-canvas" className="bg-white min-h-full shadow-2xl p-8 md:p-12 font-serif text-black max-w-200 mx-auto relative">
                    
                    {/* Watermarks based on status */}
                    {selectedDoc.status === 'DRAFT' && (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0 overflow-hidden">
                        <div className="text-black/5 text-[150px] font-black -rotate-45 whitespace-nowrap select-none">DRAFT ONLY</div>
                      </div>
                    )}
                    {selectedDoc.status === 'ARCHIVED' && (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0 overflow-hidden">
                        <div className="text-red-900/5 text-[150px] font-black -rotate-45 whitespace-nowrap select-none">VOID / ARCHIVED</div>
                      </div>
                    )}

                    <div className="relative z-10 space-y-10">
                      {/* Standard Document Header */}
                      <div className="flex justify-between items-start border-b-2 border-black pb-6">
                        <div>
                          <h1 className="text-3xl font-black tracking-tighter mb-1 uppercase font-sans">EXLOGIS</h1>
                          <p className="text-[9px] uppercase font-bold tracking-widest text-gray-500 font-sans">Global Trade Management Matrix</p>
                        </div>
                        <div className="text-right">
                          <h2 className="text-2xl font-bold uppercase mb-2 font-sans">{selectedDoc.type}</h2>
                          <div className="text-xs space-y-1 font-sans">
                            <p><span className="text-gray-500 mr-2 w-16 inline-block">Doc Ref:</span> <span className="font-bold">{selectedDoc.name}</span></p>
                            <p><span className="text-gray-500 mr-2 w-16 inline-block">Date:</span> <span className="font-bold">{formatDate(selectedDoc.createdAt)}</span></p>
                            <p><span className="text-gray-500 mr-2 w-16 inline-block">Order Ref:</span> <span className="font-bold">{selectedDoc.relatedId}</span></p>
                          </div>
                        </div>
                      </div>

                      {/* Parties */}
                      <div className="grid grid-cols-2 gap-12 text-sm font-sans">
                        <div>
                          <p className="text-[10px] font-bold text-gray-500 uppercase mb-2">Shipper / Exporter</p>
                          <p className="font-bold">{selectedDoc.shipper}</p>
                          <p className="text-gray-600 mt-1">100 Matrix Tower, Global Hub<br/>Mumbai, MH 400001, India</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-gray-500 uppercase mb-2">Consignee</p>
                          <p className="font-bold">{selectedDoc.consignee}</p>
                          <p className="text-gray-600 mt-1 whitespace-pre-line">{(selectedDoc as any).consigneeAddress || 'Address on file'}</p>
                        </div>
                      </div>

                      {/* Terms (if applicable) */}
                      {(selectedDoc.incoterm || selectedDoc.paymentTerms) && (
                        <div className="grid grid-cols-3 gap-6 py-4 border-y border-gray-200 text-sm font-sans px-4" style={{ backgroundColor: '#f9fafb', color: '#000' }}>
                          {selectedDoc.incoterm && (
                            <div>
                              <p className="text-[9px] font-bold text-gray-500 uppercase">Incoterms</p>
                              <p className="font-bold">{selectedDoc.incoterm}</p>
                            </div>
                          )}
                          {selectedDoc.paymentTerms && (
                            <div>
                              <p className="text-[9px] font-bold text-gray-500 uppercase">Payment Terms</p>
                              <p className="font-bold">{selectedDoc.paymentTerms}</p>
                            </div>
                          )}
                          {selectedDoc.containerType && (
                            <div>
                              <p className="text-[9px] font-bold text-gray-500 uppercase">Equip / Mode</p>
                              <p className="font-bold">{selectedDoc.containerType}</p>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Items / Content Area */}
                      {selectedDoc.items && selectedDoc.items.length > 0 ? (
                        <div className="font-sans">
                          <table className="w-full text-left text-sm border-collapse">
                            <thead>
                              <tr className="border-b-2 border-black">
                                <th className="py-3 font-bold">No. & Description of Goods</th>
                                <th className="py-3 font-bold text-right">Qty</th>
                                <th className="py-3 font-bold text-right">Unit Price (Tax Excl.)</th>
                                <th className="py-3 font-bold text-right">Total Amount (Tax Excl.)</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                              {selectedDoc.items.map((it: any, i: number) => (
                                <tr key={i}>
                                  <td className="py-4 pr-4">
                                    <p className="font-bold">{it.description}</p>
                                    <p className="text-xs text-gray-500 mt-1">HSN: {it.hsn} | Origin: {it.origin}</p>
                                  </td>
                                  <td className="py-4 text-right whitespace-nowrap">{it.qty} {it.unit}</td>
                                  <td className="py-4 text-right whitespace-nowrap">{formatCurrency(Number(it.unitPrice) || 0, selectedDoc.currency)}</td>
                                  <td className="py-4 text-right font-bold whitespace-nowrap">{formatCurrency(Number(it.totalPrice) || (Number(it.qty) * Number(it.unitPrice)) || 0, selectedDoc.currency)}</td>
                                </tr>
                              ))}
                            </tbody>
                            <tfoot>
                              <tr className="border-t-2 border-black text-lg font-bold">
                                <td colSpan={3} className="py-4 text-right">TOTAL VALUE ({selectedDoc.currency})</td>
                                <td className="py-4 text-right">{formatCurrency(selectedDoc.items?.reduce((sum: number, it: any) => sum + (Number(it.totalPrice) || (Number(it.qty) * Number(it.unitPrice)) || 0), 0) || selectedDoc.totalValue || 0, selectedDoc.currency)}</td>
                              </tr>
                            </tfoot>
                          </table>
                        </div>
                      ) : (
                        <div className="min-h-75 border border-gray-200 p-8 flex items-center justify-center text-gray-400 text-sm font-sans uppercase tracking-widest text-center leading-relaxed" style={{ backgroundColor: '#f9fafb' }}>
                          [ STANDARD FORMAT FOR {selectedDoc.type.toUpperCase()} ]<br/><br/>
                          REFER TO ATTACHED SPECIFICATIONS<br/>
                          AND RELATED TRANSACTION {selectedDoc.relatedId}
                        </div>
                      )}

                      {/* Remarks */}
                      {selectedDoc.remarks && (
                        <div className="text-sm font-sans pt-4">
                          <p className="font-bold text-[10px] uppercase text-gray-500 mb-1">Remarks / Declarations</p>
                          <p>{selectedDoc.remarks}</p>
                        </div>
                      )}

                      {/* Signatures */}
                      <div className="pt-20 grid grid-cols-2 gap-12 font-sans break-inside-avoid">
                        <div className="text-center">
                          <div className="border-b border-black w-48 mx-auto mb-2 relative h-12">
                            {selectedDoc.status === 'SIGNED' && (
                              <div className="absolute bottom-1 left-0 right-0 text-blue-800 italic text-2xl font-serif opacity-80 transform -rotate-3">Authorized Signatory</div>
                            )}
                          </div>
                          <p className="text-[10px] font-bold uppercase">For Shipper / Exporter</p>
                        </div>
                        <div className="text-center">
                          <div className="border-b border-black w-48 mx-auto mb-2 h-12"></div>
                          <p className="text-[10px] font-bold uppercase">For Consignee / Buyer</p>
                        </div>
                      </div>

                    </div>
                  </div>
                </div>

                {/* Footer Action */}
                <div className="p-4 border-t border-border bg-muted shrink-0 flex justify-end gap-3">
                  <button className="px-6 py-2.5 bg-accent text-foreground rounded-xl text-xs font-mono font-bold uppercase hover:bg-white/20 transition-colors border-none cursor-pointer">
                    Share Link
                  </button>
                  <button onClick={handleDownloadPdf} className="px-6 py-2.5 bg-blue-500 text-black rounded-xl text-xs font-mono font-bold uppercase hover:bg-blue-400 transition-colors border-none cursor-pointer flex items-center gap-2">
                    <Download size={14} /> Download PDF
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </>
  );
}

export default function DocumentCenterPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center font-mono text-xs text-muted-foreground/50">Loading Document Vault...</div>}>
      <DocumentCenterContent />
    </Suspense>
  );
}
