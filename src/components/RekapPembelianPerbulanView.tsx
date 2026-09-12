import React, { useState, useEffect, useMemo } from 'react';
import { FileSpreadsheet, Building2, Search } from 'lucide-react';
import { InvoiceHutang2026Record } from '../types/invoiceHutang';
import { INITIAL_KODE_REKENING } from '../data/databaseKodeRekeningData';
import { idbGet } from '../utils/indexedDbStorage';
import * as XLSX from 'xlsx';

const MONTHS = [
  'JANUARI', 'FEBRUARI', 'MARET', 'APRIL', 'MEI', 'JUNI',
  'JULI', 'AGUSTUS', 'SEPTEMBER', 'OKTOBER', 'NOVEMBER', 'DESEMBER'
];

interface RekapPembelianPerbulanViewProps {
  type: 'pembelian' | 'pembayaran';
}

export const RekapPembelianPerbulanView: React.FC<RekapPembelianPerbulanViewProps> = ({ type }) => {
  const [invoices, setInvoices] = useState<InvoiceHutang2026Record[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      const data = await idbGet<InvoiceHutang2026Record[]>('rsud_invoice_hutang_2026');
      if (data) {
        setInvoices(data);
      }
    };
    fetchData();
  }, []);

  const aggregatedData = useMemo(() => {
    return INITIAL_KODE_REKENING.map((kr, index) => {
      // Find invoices for this kodeRekening & uraian
      // Matching can be fuzzy or exact. Since Uraian in invoice is sometimes in subBelanja, 
      // let's match by kodeRekening if available, or fallback to text matching
      const relatedInvoices = invoices.filter(inv => {
        const invSub = (inv.subBelanja || '').toLowerCase().trim();
        const invUraian = (inv.uraian || '').toLowerCase().trim();
        const krUraian = kr.uraian.toLowerCase().trim();
        const combined = `${invUraian} ${invSub}`;
        
        // Match by exact text first
        if (invSub === krUraian || invUraian === krUraian) return true;
        
        // If there's a Kode Rekening match, and it's somewhat related
        if (inv.kodeRekening && inv.kodeRekening === kr.kodeRekening) {
            // For shared kode rekening like 5.1.02.01.01.0012, ensure the keyword matches
            if (kr.kodeRekening === '5.1.02.01.01.0012' || kr.kodeRekening === '5.1.02.01.01.0016') {
               // Must have keyword overlap. Just a simple check:
               const keyword = krUraian.split('(')[1]?.replace(')','').trim() || krUraian;
               if (combined.includes(keyword)) return true;
               if (krUraian.includes('radiologi') && combined.includes('radiologi')) return true;
               if (krUraian.includes('usg') && combined.includes('usg')) return true;
               if (krUraian.includes('farmasi') && combined.includes('farmasi')) return true;
               if (krUraian.includes('apd') && combined.includes('apd')) return true;
               if (krUraian.includes('dialisis') && combined.includes('dialisis')) return true;
            } else {
               return true; // Not a heavily shared KR, assume match
            }
        }
        
        // Fallback robust keyword checks
        if (krUraian.includes('farmasi') && combined.includes('farmasi')) return true;
        if (krUraian.includes('tabung gas') && combined.includes('gas')) return true;
        
        return false;
      });

      const monthlyTotals: Record<string, number> = {};
      let total2025 = 0; // Not explicitly populated from 2026 data, but we can set to 0.

      MONTHS.forEach(m => monthlyTotals[m] = 0);

      relatedInvoices.forEach(inv => {
        // Normalize month based on type
        let month = '';
        
        if (type === 'pembelian') {
          month = (inv.bulanInvoice || '').toUpperCase();
        } else {
          // For pembayaran, try to use bulanSpd first
          if (inv.bulanSpd) {
            month = inv.bulanSpd.toUpperCase();
          } else if (inv.tglBayar || inv.tglSpdBukuKas) {
            // Extract month from tglBayar if possible (assuming YYYY-MM-DD or DD/MM/YYYY)
            const dateStr = inv.tglBayar || inv.tglSpdBukuKas || '';
            const match = dateStr.match(/-(0[1-9]|1[0-2])-/); // e.g., 2026-03-12
            const matchSlash = dateStr.match(/\/(0[1-9]|1[0-2])\//); // e.g., 12/03/2026
            
            let mStr = '';
            if (match) mStr = match[1];
            else if (matchSlash) mStr = matchSlash[1];
            else {
              // Try to parse using Date
              const d = new Date(dateStr);
              if (!isNaN(d.getTime())) {
                const m = d.getMonth();
                month = MONTHS[m];
              }
            }

            if (mStr) {
               const idx = parseInt(mStr, 10) - 1;
               if (idx >= 0 && idx < 12) month = MONTHS[idx];
            }
          }
          
          // Fallback if not found, you could leave it empty or map it to something
        }
        
        let val = 0;
        if (type === 'pembelian') {
          val = inv.totalInvoiceFix || inv.jumlahInvoice || 0;
        } else {
          val = inv.pembayaran || 0;
        }

        if (MONTHS.includes(month)) {
          monthlyTotals[month] += val;
        }
      });

      return {
        no: index + 1,
        kodeRekening: kr.kodeRekening,
        uraian: kr.uraian,
        total2025,
        ...monthlyTotals,
        totalTahunIni: MONTHS.reduce((acc, m) => acc + monthlyTotals[m], 0)
      };
    });
  }, [invoices, type]);

  const filteredData = aggregatedData.filter(row => 
    row.kodeRekening.toLowerCase().includes(searchQuery.toLowerCase()) ||
    row.uraian.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatRupiah = (amount: number) => {
    if (amount === 0) return '0';
    return new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 }).format(amount);
  };

  const handleExportExcel = () => {
    const wsData = filteredData.map(row => {
      const rowData: any = {
        'NO': row.no,
        'KODE REKENING': row.kodeRekening,
        'URAIAN': row.uraian,
        '2025': row.total2025,
      };
      MONTHS.forEach(m => rowData[m] = row[m as keyof typeof row]);
      rowData['TOTAL TAHUN INI'] = row.totalTahunIni;
      return rowData;
    });

    const ws = XLSX.utils.json_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Rekap');
    XLSX.writeFile(wb, `Rekap_${type}_Perbulan.xlsx`);
  };

  // Calculating Totals for footer
  const grandTotals: Record<string, number> = { total2025: 0, totalTahunIni: 0 };
  MONTHS.forEach(m => grandTotals[m] = 0);

  filteredData.forEach(row => {
    grandTotals.total2025 += row.total2025;
    grandTotals.totalTahunIni += row.totalTahunIni;
    MONTHS.forEach(m => {
      grandTotals[m] += (row[m as keyof typeof row] as number);
    });
  });

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl shadow-sm border border-slate-200 dark:border-zinc-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 text-xs font-semibold mb-2">
            <Building2 className="w-3.5 h-3.5" /> REKAP {type.toUpperCase()}
          </div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-zinc-100 uppercase">
            REKAP {type.toUpperCase()} INVOICE PERBULAN
          </h2>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
            Menampilkan data agregat per bulan otomatis dari sumber data INVOICE HUTANG 2026.
          </p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari rekening / uraian..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-zinc-800/50 border border-slate-200 dark:border-zinc-700 rounded-xl text-sm"
            />
          </div>
          <button 
            onClick={handleExportExcel}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-semibold transition"
          >
            <FileSpreadsheet className="w-4 h-4" /> Export
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-slate-200 dark:border-zinc-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-[#e7d8f4] dark:bg-[#2c1d3b] text-[#3b1d5c] dark:text-[#d3bdf0] font-bold border-b-2 border-[#b895d6] dark:border-[#52337a]">
              <tr>
                <th className="px-3 py-3 border-r border-[#d4bcf0] dark:border-[#40275c] text-center w-12">NO</th>
                <th className="px-4 py-3 border-r border-[#d4bcf0] dark:border-[#40275c]">KODE REKENING</th>
                <th className="px-4 py-3 border-r border-[#d4bcf0] dark:border-[#40275c]">URAIAN</th>
                <th className="px-4 py-3 border-r border-[#d4bcf0] dark:border-[#40275c] text-right">2025</th>
                {MONTHS.map(m => (
                  <th key={m} className="px-4 py-3 border-r border-[#d4bcf0] dark:border-[#40275c] text-right">{m}</th>
                ))}
                <th className="px-4 py-3 text-right">TOTAL</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/50">
              {filteredData.map((row, idx) => {
                let rowBgClass = "hover:bg-slate-50/50 dark:hover:bg-zinc-800/20 transition group";
                if (row.uraian.includes('USG')) {
                  rowBgClass = "bg-yellow-300 hover:bg-yellow-400 text-black dark:text-black";
                } else if (row.uraian.includes('Alat Tulis Kantor')) {
                  rowBgClass = "bg-[#a855f7] hover:bg-[#9333ea] text-white dark:text-white";
                }

                return (
                <tr key={idx} className={rowBgClass}>
                  <td className="px-3 py-2.5 text-center border-r border-slate-200/60 dark:border-zinc-800/50">{row.no}</td>
                  <td className="px-4 py-2.5 font-mono text-xs border-r border-slate-200/60 dark:border-zinc-800/50">{row.kodeRekening}</td>
                  <td className="px-4 py-2.5 font-medium border-r border-slate-200/60 dark:border-zinc-800/50">{row.uraian}</td>
                  <td className="px-4 py-2.5 text-right font-mono border-r border-slate-200/60 dark:border-zinc-800/50 opacity-90">
                    <div className="flex justify-between items-center w-full">
                      <span className="text-[10px]">Rp</span>
                      <span>{row.total2025 > 0 ? formatRupiah(row.total2025) : '-'}</span>
                    </div>
                  </td>
                  {MONTHS.map(m => {
                    const val = row[m as keyof typeof row] as number;
                    return (
                      <td key={m} className="px-4 py-2.5 text-right font-mono border-r border-slate-200/60 dark:border-zinc-800/50">
                        {val > 0 ? formatRupiah(val) : '0'}
                      </td>
                    );
                  })}
                  <td className="px-4 py-2.5 text-right font-mono font-bold border-l-2 border-slate-200 dark:border-zinc-700">
                    {formatRupiah(row.totalTahunIni)}
                  </td>
                </tr>
                );
              })}
              {filteredData.length === 0 && (
                <tr>
                  <td colSpan={MONTHS.length + 5} className="px-4 py-8 text-center text-slate-500">
                    Tidak ada data yang cocok dengan pencarian.
                  </td>
                </tr>
              )}
            </tbody>
            <tfoot className="bg-[#f0e6f7] dark:bg-[#20152b] font-bold text-[#3b1d5c] dark:text-[#d3bdf0] border-t-2 border-[#b895d6] dark:border-[#52337a]">
              <tr>
                <td colSpan={3} className="px-4 py-3 text-right">TOTAL KESELURUHAN:</td>
                <td className="px-4 py-3 text-right font-mono">
                  <div className="flex justify-between items-center w-full">
                    <span className="text-[10px] opacity-70">Rp</span>
                    <span>{grandTotals.total2025 > 0 ? formatRupiah(grandTotals.total2025) : '-'}</span>
                  </div>
                </td>
                {MONTHS.map(m => (
                  <td key={m} className="px-4 py-3 text-right font-mono border-l border-[#d4bcf0]/50 dark:border-[#40275c]/50">
                    {grandTotals[m] > 0 ? formatRupiah(grandTotals[m]) : '0'}
                  </td>
                ))}
                <td className="px-4 py-3 text-right font-mono text-lg border-l border-[#b895d6] dark:border-[#52337a]">
                  {formatRupiah(grandTotals.totalTahunIni)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};
