'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  BarChart3, Download, Filter, Save, FileSpreadsheet, FileText, Printer,
  Plus, X, ChevronDown, Check, Settings2, FolderOpen
} from 'lucide-react';
import { PageHeaderUpdater } from '@/components/layout/page-context';
import { ReportEngine, ReportConfig, FilterCondition, FilterOperator } from '@/lib/reporting/engine';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';

const ENTITIES = [
  { id: 'sales', label: 'Sales Orders' },
  { id: 'shipments', label: 'Shipments' },
  { id: 'products', label: 'Products Master' },
  { id: 'customers', label: 'Customer DB' },
];

const OPERATORS: { id: FilterOperator; label: string }[] = [
  { id: 'equals', label: 'Equals' },
  { id: 'contains', label: 'Contains' },
  { id: 'gt', label: 'Greater Than' },
  { id: 'lt', label: 'Less Than' },
];

export default function AdvancedReportBuilder() {
  const [entity, setEntity] = useState('sales');
  const [rawData, setRawData] = useState<any[]>([]);
  const [processedData, setProcessedData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [allColumns, setAllColumns] = useState<string[]>([]);
  
  // Configuration State
  const [config, setConfig] = useState<ReportConfig>({
    columns: [],
    filters: [],
    sortBy: '',
    sortDir: 'asc',
    groupBy: ''
  });

  const [savedConfigs, setSavedConfigs] = useState<{name: string, entity: string, config: ReportConfig}[]>([]);
  const [showSavedList, setShowSavedList] = useState(false);
  const savedListRef = useRef<HTMLDivElement>(null);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 50;
  
  const paginatedData = processedData.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const totalPages = Math.ceil(processedData.length / pageSize);

  // Load saved configs from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('matrix_reports');
    if (saved) {
      try {
        setSavedConfigs(JSON.parse(saved));
      } catch (e) {}
    }
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (savedListRef.current && !savedListRef.current.contains(e.target as Node)) {
        setShowSavedList(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch raw data when entity changes
  useEffect(() => {
    setConfig({ columns: [], filters: [], sortBy: '', sortDir: 'asc', groupBy: '' }); // Reset config on entity change
    setCurrentPage(1); // Reset pagination
    fetchRawData();
  }, [entity]);

  // Process data whenever config or raw data changes
  useEffect(() => {
    setCurrentPage(1); // Reset pagination on new filter
    if (rawData.length > 0) {
      const processed = ReportEngine.process(rawData, config);
      setProcessedData(processed);
    } else {
      setProcessedData([]);
    }
  }, [rawData, config]);

  const fetchRawData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/reports/dynamic?entity=${entity}`);
      const json = await res.json();
      const data = json.data || [];
      setRawData(data);
      
      if (data.length > 0) {
        // Extract all unique keys from the first few objects to build column list
        const keys = Array.from(new Set(data.slice(0, 5).flatMap((obj: any) => Object.keys(obj))));
        const cleanedKeys = keys.filter((k: any) => k !== 'id' && typeof data[0][k] !== 'object') as string[];
        setAllColumns(cleanedKeys);
        
        // Auto-select first 5 columns if no columns selected
        if (!config.columns || config.columns.length === 0) {
          setConfig(prev => ({ ...prev, columns: cleanedKeys.slice(0, 5) }));
        }
      } else {
        setAllColumns([]);
      }
    } catch (e: any) {
      toast.error('Failed to load entity data');
    } finally {
      setLoading(false);
    }
  };

  const addFilter = () => {
    if (allColumns.length === 0) return;
    setConfig(prev => ({
      ...prev,
      filters: [...(prev.filters || []), { field: allColumns[0], operator: 'contains', value: '' }]
    }));
  };

  const updateFilter = (index: number, field: keyof FilterCondition, value: any) => {
    setConfig(prev => {
      const newFilters = [...(prev.filters || [])];
      newFilters[index] = { ...newFilters[index], [field]: value };
      return { ...prev, filters: newFilters };
    });
  };

  const removeFilter = (index: number) => {
    setConfig(prev => {
      const newFilters = [...(prev.filters || [])];
      newFilters.splice(index, 1);
      return { ...prev, filters: newFilters };
    });
  };

  const toggleColumn = (col: string) => {
    setConfig(prev => {
      const cols = prev.columns || [];
      if (cols.includes(col)) return { ...prev, columns: cols.filter(c => c !== col) };
      return { ...prev, columns: [...cols, col] };
    });
  };

  const saveConfiguration = () => {
    const name = prompt('Enter a name for this report configuration:');
    if (!name) return;
    
    // TODO: Future - Save this configuration to the database so it syncs across devices
    const newConfig = { name, entity, config };
    const updated = [...savedConfigs, newConfig];
    setSavedConfigs(updated);
    localStorage.setItem('matrix_reports', JSON.stringify(updated));
    toast.success('Report configuration saved locally');
  };

  const loadConfiguration = (cfg: {name: string, entity: string, config: ReportConfig}) => {
    setEntity(cfg.entity);
    setConfig(cfg.config);
    setShowSavedList(false);
    toast.success(`Loaded "${cfg.name}"`);
  };

  // -- EXPORTS --
  
  // CSV Export using dynamic xlsx import
  const exportCSV = async () => {
    if (processedData.length === 0) return toast.error('No data to export');
    toast.info('Preparing CSV...');
    const XLSX = await import('xlsx');
    const ws = XLSX.utils.json_to_sheet(getExportData());
    const csv = XLSX.utils.sheet_to_csv(ws);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${entity}_report_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    toast.success('CSV downloaded');
  };

  // Excel Export using dynamic xlsx import
  const exportExcel = async () => {
    if (processedData.length === 0) return toast.error('No data to export');
    toast.info('Generating Excel workbook...');
    const XLSX = await import('xlsx');
    const ws = XLSX.utils.json_to_sheet(getExportData());
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Report');
    XLSX.writeFile(wb, `${entity}_report_${new Date().toISOString().split('T')[0]}.xlsx`);
    toast.success('Excel downloaded');
  };

  // PDF Export using dynamic jspdf and jspdf-autotable imports
  const exportPDF = async () => {
    if (processedData.length === 0) return toast.error('No data to export');
    toast.info('Generating PDF...');
    
    // Dynamically load jspdf and autotable
    const jsPDFModule = await import('jspdf');
    const autoTableModule = await import('jspdf-autotable');
    const jsPDF = jsPDFModule.default;
    const autoTable = autoTableModule.default;
    
    const doc = new jsPDF('landscape');
    const cols = config.columns || allColumns;
    
    const dataRows = processedData.map(row => {
      if (row._isGroupHeader) {
        // Create a fake row that spans all columns
        const groupRow = new Array(cols.length).fill('');
        groupRow[0] = `Group: ${row._groupKey} (${row._groupCount} items)`;
        return groupRow;
      }
      return cols.map(col => String(row[col] ?? ''));
    });

    // Global explicitly defined Hex Colors
    const primaryColor: [number, number, number] = [15, 23, 42]; // slate-900
    const headerColor: [number, number, number] = [59, 130, 246]; // blue-500

    doc.setFontSize(16);
    doc.text(`Matrix Report: ${entity.toUpperCase()}`, 14, 15);
    doc.setFontSize(10);
    doc.text(`Generated on ${new Date().toLocaleDateString()}`, 14, 22);

    autoTable(doc, {
      head: [cols.map(c => c.toUpperCase())],
      body: dataRows,
      startY: 28,
      theme: 'grid',
      styles: { fontSize: 8, cellPadding: 3 },
      headStyles: { fillColor: headerColor, textColor: [255, 255, 255], fontStyle: 'bold' },
      bodyStyles: { textColor: [50, 50, 50] },
      alternateRowStyles: { fillColor: [245, 247, 250] },
      didParseCell: (data: any) => {
        // Style group headers differently
        if (data.row.raw && data.row.raw[0] && String(data.row.raw[0]).startsWith('Group:')) {
          data.cell.styles.fillColor = [220, 230, 250];
          data.cell.styles.textColor = primaryColor;
          data.cell.styles.fontStyle = 'bold';
        }
      }
    });

    doc.save(`${entity}_report.pdf`);
  };

  const getExportData = () => {
    return processedData.map(row => {
      if (row._isGroupHeader) {
        return { Group: `${row._groupKey} (${row._groupCount} items)` };
      }
      return row;
    });
  };

  return (
    <>
      <PageHeaderUpdater title="Dynamic Report Builder" subtitle="Universal Reporting Engine" />
      <div className="flex flex-col xl:flex-row gap-6 pb-20 h-full">
        
        {/* Left Sidebar - Configuration */}
        <div className="w-full xl:w-80 flex flex-col gap-6 shrink-0">
          <div className="glass rounded-2xl border border-white/5 p-5">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xs font-mono font-bold uppercase tracking-widest text-white flex items-center gap-2">
                <Settings2 size={14} className="text-blue-400" />
                Parameters
              </h3>
              <div className="relative" ref={savedListRef}>
                <button 
                  onClick={() => setShowSavedList(!showSavedList)}
                  className="p-1.5 bg-white/5 hover:bg-white/10 rounded-lg transition-colors text-white/70 hover:text-white"
                  title="Load Saved Config"
                >
                  <FolderOpen size={14} />
                </button>
                
                {/* Saved Configs Dropdown */}
                <AnimatePresence>
                  {showSavedList && (
                    <motion.div 
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 5 }}
                      className="absolute top-full right-0 mt-2 w-64 bg-[#0a0a0a] border border-white/10 rounded-xl shadow-2xl z-50 p-2 overflow-hidden"
                    >
                      <div className="text-[9px] font-mono text-white/50 uppercase tracking-widest px-2 py-1 mb-1 border-b border-white/5">Saved Reports</div>
                      {savedConfigs.length === 0 ? (
                        <div className="px-2 py-4 text-xs text-white/40 text-center">No saved reports</div>
                      ) : (
                        savedConfigs.map((cfg, i) => (
                          <button 
                            key={i} 
                            onClick={() => loadConfiguration(cfg)}
                            className="w-full text-left px-3 py-2 rounded-lg text-sm text-white/80 hover:text-white hover:bg-white/5 transition-colors"
                          >
                            {cfg.name} <span className="text-[9px] text-blue-400 font-mono ml-2">({cfg.entity})</span>
                          </button>
                        ))
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Entity Selection */}
            <div className="mb-6">
              <label className="text-[10px] font-mono text-white/50 uppercase tracking-widest block mb-2">Data Source</label>
              <div className="relative">
                <select 
                  value={entity}
                  onChange={(e) => setEntity(e.target.value)}
                  className="w-full appearance-none bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500/50"
                >
                  {ENTITIES.map(e => <option key={e.id} value={e.id} className="bg-[#080808]">{e.label}</option>)}
                </select>
                <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/50 pointer-events-none" />
              </div>
            </div>

            {/* Column Selection */}
            <div className="mb-6">
              <label className="text-[10px] font-mono text-white/50 uppercase tracking-widest block mb-2 flex justify-between">
                <span>Display Columns</span>
                <span className="text-blue-400">{config.columns?.length || 0} selected</span>
              </label>
              <div className="max-h-40 overflow-y-auto custom-scrollbar space-y-1 bg-white/5 rounded-xl border border-white/5 p-2">
                {allColumns.map(col => (
                  <label key={col} className="flex items-center gap-2 p-1.5 hover:bg-white/5 rounded-lg cursor-pointer group" onClick={(e) => { e.preventDefault(); toggleColumn(col); }}>
                    <div className={cn(
                      "w-4 h-4 rounded border flex items-center justify-center transition-colors shrink-0",
                      config.columns?.includes(col) ? "bg-blue-500 border-blue-500" : "border-white/20 group-hover:border-white/40"
                    )}>
                      {config.columns?.includes(col) && <Check size={10} className="text-white" />}
                    </div>
                    <span className="text-xs text-white/80 group-hover:text-white truncate">{col}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Grouping & Sorting */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <label className="text-[10px] font-mono text-white/50 uppercase tracking-widest block mb-2">Group By</label>
                <select 
                  value={config.groupBy || ''}
                  onChange={(e) => setConfig({...config, groupBy: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-2 py-2 text-xs text-white focus:outline-none focus:border-blue-500/50"
                >
                  <option value="" className="bg-[#080808]">None</option>
                  {allColumns.map(col => <option key={col} value={col} className="bg-[#080808]">{col}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-mono text-white/50 uppercase tracking-widest block mb-2">Sort By</label>
                <select 
                  value={config.sortBy || ''}
                  onChange={(e) => setConfig({...config, sortBy: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-2 py-2 text-xs text-white focus:outline-none focus:border-blue-500/50"
                >
                  <option value="" className="bg-[#080808]">Default</option>
                  {allColumns.map(col => <option key={col} value={col} className="bg-[#080808]">{col}</option>)}
                </select>
              </div>
            </div>

            {/* Filters */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <label className="text-[10px] font-mono text-white/50 uppercase tracking-widest block">Data Filters</label>
                <button onClick={addFilter} className="text-[10px] font-mono text-blue-400 uppercase tracking-widest hover:text-blue-300 flex items-center gap-1">
                  <Plus size={10} /> Add
                </button>
              </div>
              <div className="space-y-2">
                {(!config.filters || config.filters.length === 0) && (
                  <div className="text-xs text-white/30 italic text-center py-2 bg-white/5 rounded-lg border border-white/5 border-dashed">No filters applied</div>
                )}
                {config.filters?.map((filter, idx) => (
                  <div key={idx} className="p-2 bg-white/5 rounded-lg border border-white/10 space-y-2 relative">
                    <button onClick={() => removeFilter(idx)} className="absolute top-2 right-2 text-white/30 hover:text-red-400"><X size={12} /></button>
                    <select 
                      value={filter.field} 
                      onChange={(e) => updateFilter(idx, 'field', e.target.value)}
                      className="w-[calc(100%-20px)] bg-transparent text-xs text-white border-b border-white/10 pb-1 focus:outline-none focus:border-blue-500"
                    >
                      {allColumns.map(col => <option key={col} value={col} className="bg-[#080808]">{col}</option>)}
                    </select>
                    <div className="flex gap-2">
                      <select 
                        value={filter.operator} 
                        onChange={(e) => updateFilter(idx, 'operator', e.target.value as FilterOperator)}
                        className="w-1/2 bg-white/5 text-[10px] text-white/80 border border-white/10 rounded px-1 py-1 focus:outline-none"
                      >
                        {OPERATORS.map(op => <option key={op.id} value={op.id} className="bg-[#080808]">{op.label}</option>)}
                      </select>
                      <input 
                        type="text" 
                        value={filter.value} 
                        onChange={(e) => updateFilter(idx, 'value', e.target.value)}
                        placeholder="Value..."
                        className="w-1/2 bg-white/5 text-xs text-white border border-white/10 rounded px-2 py-1 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <button 
              onClick={saveConfiguration}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-mono font-bold uppercase tracking-widest rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              <Save size={14} /> Save Report Config
            </button>
          </div>
        </div>

        {/* Right Side - Data Table & Exports */}
        <div className="flex-1 flex flex-col min-w-0 glass rounded-2xl border border-white/5 overflow-hidden">
          {/* Toolbar */}
          <div className="p-4 border-b border-white/5 flex flex-wrap items-center justify-between gap-4 bg-white/5">
            <div className="flex items-center gap-2">
              <BarChart3 size={16} className="text-blue-400" />
              <span className="text-sm font-medium">{processedData.length} Records</span>
              {config.groupBy && <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 text-[10px] font-mono uppercase ml-2">Grouped by {config.groupBy}</span>}
            </div>
            <div className="flex items-center gap-2">
              <button onClick={exportCSV} className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/10 rounded-lg text-[10px] font-mono uppercase tracking-widest transition-colors">
                <FileSpreadsheet size={12} /> CSV
              </button>
              <button onClick={exportExcel} className="flex items-center gap-2 px-3 py-1.5 bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/10 rounded-lg text-[10px] font-mono uppercase tracking-widest transition-colors">
                <FileSpreadsheet size={12} /> XLSX
              </button>
              <button onClick={exportPDF} className="flex items-center gap-2 px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/10 rounded-lg text-[10px] font-mono uppercase tracking-widest transition-colors">
                <FileText size={12} /> PDF
              </button>
            </div>
          </div>

          {/* Table Container */}
          <div className="flex-1 overflow-auto custom-scrollbar p-0">
            {processedData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-white/30 text-sm font-mono uppercase tracking-widest">
                No data matches filters
              </div>
            ) : (
              <table className="w-full text-left border-collapse min-w-max">
                <thead className="bg-[#0a0a0a] sticky top-0 z-10 shadow-md">
                  <tr>
                    {config.columns?.map(col => (
                      <th key={col} className="px-4 py-3 text-[10px] font-mono text-white/50 uppercase tracking-widest border-b border-white/5 whitespace-nowrap">
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {paginatedData.map((row, i) => (
                    row._isGroupHeader ? (
                      <tr key={`group-${i}`} className="bg-blue-500/5">
                        <td colSpan={config.columns?.length || 1} className="px-4 py-3 text-xs font-mono font-bold text-blue-400 uppercase tracking-widest border-l-2 border-blue-500">
                          Group: {row._groupKey} <span className="text-white/30 ml-2">({row._groupCount} items)</span>
                        </td>
                      </tr>
                    ) : (
                      <tr key={`row-${i}`} className="hover:bg-white/5 transition-colors">
                        {config.columns?.map(col => (
                          <td key={`${i}-${col}`} className="px-4 py-3 text-xs text-white/80 whitespace-nowrap">
                            {String(row[col] ?? '')}
                          </td>
                        ))}
                      </tr>
                    )
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Pagination Footer */}
          {processedData.length > 0 && (
            <div className="p-3 border-t border-white/5 bg-white/5 flex items-center justify-between">
              <span className="text-[10px] font-mono text-white/50 uppercase tracking-widest">
                Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, processedData.length)} of {processedData.length}
              </span>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 bg-white/5 rounded hover:bg-white/10 disabled:opacity-50 text-xs font-mono"
                >
                  Prev
                </button>
                <span className="text-xs font-mono text-white/70">Page {currentPage} of {totalPages}</span>
                <button 
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 bg-white/5 rounded hover:bg-white/10 disabled:opacity-50 text-xs font-mono"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
