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
      <div className="bg-white dark:bg-[#0f172a] p-5 rounded-xl shadow-xs border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-semibold text-blue-600 dark:text-blue-400 mb-1 font-mono">
            <Building2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span className="uppercase tracking-wider">RSUD JATISARI · AUDIT PEMBUKUAN BLUD</span>
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight uppercase">
            REKAP {type.toUpperCase()} INVOICE PERBULAN
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Agregasi transaksi bulanan terverifikasi dari sumber pembukuan Invoice Hutang RSUD Jatisari TA 2026.
          </p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari rekening / uraian..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button 
            onClick={handleExportExcel}
            className="flex items-center gap-2 px-4 py-2 bg-blue-700 hover:bg-blue-600 text-white rounded-lg text-sm font-semibold shadow-xs transition"
          >
            <FileSpreadsheet className="w-4 h-4" /> Export Excel
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-[#0f172a] rounded-xl shadow-xs border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs whitespace-nowrap">
            <thead className="bg-slate-800 text-slate-100 font-bold border-b border-slate-700">
              <tr>
                <th className="px-3 py-3 border-r border-slate-700 text-center w-12 text-slate-400 font-mono">NO</th>
                <th className="px-4 py-3 border-r border-slate-700">KODE REKENING</th>
                <th className="px-4 py-3 border-r border-slate-700">URAIAN</th>
                <th className="px-4 py-3 border-r border-slate-700 text-right bg-slate-900">2025</th>
                {MONTHS.map(m => (
                  <th key={m} className="px-4 py-3 border-r border-slate-700 text-right">{m}</th>
                ))}
                <th className="px-4 py-3 text-right bg-blue-950 text-blue-200 font-extrabold">TOTAL</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
              {filteredData.map((row, idx) => {
                let rowBgClass = "hover:bg-blue-50/20 dark:hover:bg-slate-800/40 transition group";
                if (row.uraian.includes('USG')) {
                  rowBgClass = "bg-amber-50/60 hover:bg-amber-100/60 text-amber-950 dark:bg-amber-950/20 dark:text-amber-200";
                } else if (row.uraian.includes('Alat Tulis Kantor')) {
                  rowBgClass = "bg-sky-50/60 hover:bg-sky-100/60 text-sky-950 dark:bg-sky-950/20 dark:text-sky-200";
                }

                return (
                <tr key={idx} className={rowBgClass}>
                  <td className="px-3 py-2.5 text-center border-r border-slate-200/60 dark:border-zinc-800/50 text-slate-400 font-mono text-[11px]">{row.no}</td>
                  <td className="px-4 py-2.5 font-mono text-xs font-semibold border-r border-slate-200/60 dark:border-zinc-800/50 text-slate-700 dark:text-slate-300">{row.kodeRekening}</td>
                  <td className="px-4 py-2.5 font-medium border-r border-slate-200/60 dark:border-zinc-800/50 text-slate-900 dark:text-slate-100">{row.uraian}</td>
                  <td className="px-4 py-2.5 text-right font-mono border-r border-slate-200/60 dark:border-zinc-800/50 text-slate-600 dark:text-slate-400 bg-slate-50/40 dark:bg-slate-900/30">
                    <div className="flex justify-between items-center w-full">
                      <span className="text-[10px] text-slate-400">Rp</span>
                      <span>{row.total2025 > 0 ? formatRupiah(row.total2025) : '-'}</span>
                    </div>
                  </td>
                  {MONTHS.map(m => {
                    const val = row[m as keyof typeof row] as number;
                    return (
                      <td key={m} className={`px-4 py-2.5 text-right font-mono border-r border-slate-200/60 dark:border-zinc-800/50 ${val > 0 ? 'text-slate-900 dark:text-slate-100 font-medium' : 'text-slate-400 dark:text-slate-600'}`}>
                        {val > 0 ? formatRupiah(val) : '0'}
                      </td>
                    );
                  })}
                  <td className="px-4 py-2.5 text-right font-mono font-bold border-l-2 border-blue-500/30 text-blue-800 dark:text-blue-300 bg-blue-50/20 dark:bg-blue-950/20">
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
            <tfoot className="bg-slate-900 font-bold text-white border-t-2 border-slate-700">
              <tr>
                <td colSpan={3} className="px-4 py-3 text-right text-slate-300">TOTAL KESELURUHAN:</td>
                <td className="px-4 py-3 text-right font-mono bg-slate-950">
                  <div className="flex justify-between items-center w-full">
                    <span className="text-[10px] text-slate-400">Rp</span>
                    <span>{grandTotals.total2025 > 0 ? formatRupiah(grandTotals.total2025) : '-'}</span>
                  </div>
                </td>
                {MONTHS.map(m => (
                  <td key={m} className="px-4 py-3 text-right font-mono border-l border-slate-700">
                    {grandTotals[m] > 0 ? formatRupiah(grandTotals[m]) : '0'}
                  </td>
                ))}
                <td className="px-4 py-3 text-right font-mono text-base font-extrabold text-blue-300 bg-blue-950 border-l border-slate-700">
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
