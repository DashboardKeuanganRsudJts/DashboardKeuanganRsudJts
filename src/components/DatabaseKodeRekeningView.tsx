import React, { useState, useMemo } from 'react';
import { Database, Search, Download } from 'lucide-react';
import { INITIAL_KODE_REKENING, DatabaseKodeRekeningRecord } from '../data/databaseKodeRekeningData';

interface DatabaseKodeRekeningViewProps {
  onShowToast?: (msg: string, type: 'success'|'error'|'info') => void;
}

export default function DatabaseKodeRekeningView({ onShowToast }: DatabaseKodeRekeningViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  
  const filteredData = useMemo(() => {
    if (!searchQuery) return INITIAL_KODE_REKENING;
    const q = searchQuery.toLowerCase();
    return INITIAL_KODE_REKENING.filter(item => 
      item.kodeRekening.toLowerCase().includes(q) || 
      item.uraian.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  const handleExportCSV = () => {
    let csvContent = "KODE REKENING;URAIAN\n";
    INITIAL_KODE_REKENING.forEach(item => {
      const kode = item.kodeRekening !== '-' ? item.kodeRekening : '';
      const uraian = item.uraian.includes(';') ? `"${item.uraian}"` : item.uraian;
      csvContent += `${kode};${uraian}\n`;
    });
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'database_kode_rekening.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    if (onShowToast) onShowToast('File CSV berhasil diunduh', 'success');
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Banner */}
      <div className="bg-gradient-to-r from-teal-900 via-emerald-900 to-slate-950 text-white rounded-2xl p-6 shadow-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border border-teal-700/50">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 text-xs font-semibold mb-2 border border-teal-400/30">
            <Database className="w-3.5 h-3.5 text-teal-300" /> DATABASE KODE REKENING
          </div>
          <h2 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
            DATABASE KODE REKENING & URAIAN
          </h2>
          <p className="text-emerald-100/80 text-xs mt-1 max-w-2xl leading-relaxed font-medium">
            Database ini menjadi patokan dan penghubung untuk semua data pada menu Hutang.
          </p>
        </div>
        
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-xl text-xs shadow-md transition transform active:scale-95 border border-slate-600"
            title="Download CSV"
          >
            <Download className="w-3.5 h-3.5" /> Export CSV
          </button>
        </div>
      </div>

      {/* 2. Search Bar */}
      <div className="bg-white dark:bg-[#12181f] p-4 rounded-2xl shadow-sm border border-slate-200 dark:border-zinc-800/80 flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="relative w-full md:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Cari Kode Rekening atau Uraian..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-700/50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/50 dark:text-white"
          />
        </div>
        <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
          Menampilkan {filteredData.length} dari {INITIAL_KODE_REKENING.length} Data
        </div>
      </div>

      {/* 3. Data Table */}
      <div className="bg-white dark:bg-[#12181f] border border-slate-200 dark:border-zinc-800/80 shadow-sm rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs whitespace-nowrap">
            <thead className="bg-slate-50 dark:bg-zinc-900/80 border-b border-slate-200 dark:border-zinc-800/80 text-slate-600 dark:text-slate-300">
              <tr>
                <th className="px-4 py-3 font-bold w-16 text-center">NO</th>
                <th className="px-4 py-3 font-bold w-48">KODE REKENING</th>
                <th className="px-4 py-3 font-bold">URAIAN</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/50">
              {filteredData.length > 0 ? (
                filteredData.map((item, index) => (
                  <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-zinc-900/30 transition">
                    <td className="px-4 py-3 text-center text-slate-400 dark:text-slate-500 font-mono">
                      {index + 1}
                    </td>
                    <td className="px-4 py-3 font-mono font-medium text-slate-700 dark:text-zinc-200">
                      {item.kodeRekening}
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-800 dark:text-zinc-100 whitespace-normal min-w-[300px]">
                      {item.uraian}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={3} className="px-4 py-12 text-center text-slate-500 dark:text-slate-400">
                    <Database className="w-8 h-8 mx-auto mb-3 opacity-20" />
                    <p>Data tidak ditemukan</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
