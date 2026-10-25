import React, { useState, useEffect, useMemo } from 'react';
import { FileSpreadsheet, Building2, Search } from 'lucide-react';
import { InvoiceHutang2026Record } from '../types/invoiceHutang';
import { INITIAL_KODE_REKENING } from '../data/databaseKodeRekeningData';
import { idbGet } from '../utils/indexedDbStorage';
import { deduplicateInvoiceRecords } from '../utils/invoiceDeduplicator';
import * as XLSX from 'xlsx';

const MONTHS = [
  'JANUARI', 'FEBRUARI', 'MARET', 'APRIL', 'MEI', 'JUNI',
  'JULI', 'AGUSTUS', 'SEPTEMBER', 'OKTOBER', 'NOVEMBER', 'DESEMBER'
];

interface RekapPembelianPerbulanViewProps {
  type: 'pembelian' | 'pembayaran';
  user?: any;
}

export const RekapPembelianPerbulanView: React.FC<RekapPembelianPerbulanViewProps> = ({ type, user }) => {
  const [invoices, setInvoices] = useState<InvoiceHutang2026Record[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      const data = await idbGet<InvoiceHutang2026Record[]>('rsud_invoice_hutang_2026');
      if (data && Array.isArray(data)) {
        setInvoices(deduplicateInvoiceRecords(data, 2026));
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
      <div className="bg-gradient-to-r from-teal-50 via-emerald-50/70 to-cyan-50 dark:from-teal-950 dark:via-[#061914] dark:to-emerald-950 p-6 rounded-2xl shadow-md border border-teal-200 dark:border-teal-900/60 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-100 dark:bg-teal-500/20 text-teal-800 dark:text-teal-300 text-xs font-semibold mb-2 border border-teal-300 dark:border-teal-500/30 font-mono">
            <Building2 className="w-4 h-4 text-teal-600 dark:text-teal-400" />
            <span className="uppercase tracking-wider">RSUD JATISARI · AUDIT PEMBUKUAN BLUD</span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white uppercase">
            REKAP {type.toUpperCase()} INVOICE PERBULAN
          </h2>
          <p className="text-xs text-slate-600 dark:text-teal-200/80 mt-1">
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
              className="w-full pl-9 pr-4 py-2 bg-emerald-50/40 dark:bg-[#12181f] border border-emerald-200 dark:border-zinc-800 rounded-lg text-sm text-slate-900 dark:text-zinc-100 placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          {Boolean(user) && (
            <button 
              onClick={handleExportExcel}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg text-sm font-semibold shadow-xs transition"
            >
              <FileSpreadsheet className="w-4 h-4" /> Export Excel
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-[#0d1216] rounded-xl shadow-xs border border-slate-200 dark:border-emerald-950/80 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs whitespace-nowrap">
            <thead className="bg-[#e6f4ea] dark:bg-[#12181f] text-[#13422d] dark:text-[#a6ecc8] font-bold border-b border-[#a8dbc0] dark:border-[#2b5a45]">
              <tr>
                <th className="px-3 py-3 border-r border-[#c2e5d2] dark:border-[#2b5a45] text-center w-12 text-[#13422d]/70 dark:text-[#a6ecc8]/70 font-mono">NO</th>
                <th className="px-4 py-3 border-r border-[#c2e5d2] dark:border-[#2b5a45]">KODE REKENING</th>
                <th className="px-4 py-3 border-r border-[#c2e5d2] dark:border-[#2b5a45]">URAIAN</th>
                <th className="px-4 py-3 border-r border-[#c2e5d2] dark:border-[#2b5a45] text-right bg-[#d8eedf] dark:bg-[#142d22]">2025</th>
                {MONTHS.map(m => (
                  <th key={m} className="px-4 py-3 border-r border-[#c2e5d2] dark:border-[#2b5a45] text-right">{m}</th>
                ))}
                <th className="px-4 py-3 text-right bg-emerald-800 text-white font-extrabold">TOTAL</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/60">
              {filteredData.map((row, idx) => {
                const isEven = idx % 2 === 0;
                let rowBgClass = isEven
                  ? "bg-white dark:bg-[#0d1216] hover:bg-emerald-50/30 dark:hover:bg-emerald-950/20 transition group"
                  : "bg-slate-50/70 dark:bg-[#12181f]/80 hover:bg-emerald-50/30 dark:hover:bg-emerald-950/20 transition group";
                if (row.uraian.includes('USG')) {
                  rowBgClass = "bg-amber-50/60 hover:bg-amber-100/60 text-amber-950 dark:bg-amber-950/20 dark:text-amber-200";
                } else if (row.uraian.includes('Alat Tulis Kantor')) {
                  rowBgClass = "bg-emerald-50/40 hover:bg-emerald-100/50 text-emerald-950 dark:bg-teal-950/20 dark:text-teal-200";
                }

                return (
                <tr key={idx} className={rowBgClass}>
                  <td className="px-3 py-2.5 text-center border-r border-slate-200/60 dark:border-zinc-800/60 text-slate-400 font-mono text-[11px]">{row.no}</td>
                  <td className="px-4 py-2.5 font-mono text-xs font-semibold border-r border-slate-200/60 dark:border-zinc-800/60 text-slate-700 dark:text-zinc-300">{row.kodeRekening}</td>
                  <td className="px-4 py-2.5 font-medium border-r border-slate-200/60 dark:border-zinc-800/60 text-slate-900 dark:text-zinc-100">{row.uraian}</td>
                  <td className="px-4 py-2.5 text-right font-mono border-r border-slate-200/60 dark:border-zinc-800/60 text-slate-600 dark:text-zinc-400 bg-slate-50/40 dark:bg-transparent">
                    <div className="flex justify-between items-center w-full">
                      <span className="text-[10px] text-slate-400">Rp</span>
                      <span>{row.total2025 > 0 ? formatRupiah(row.total2025) : '-'}</span>
                    </div>
                  </td>
                  {MONTHS.map(m => {
                    const val = row[m as keyof typeof row] as number;
                    return (
                      <td key={m} className={`px-4 py-2.5 text-right font-mono border-r border-slate-200/60 dark:border-zinc-800/60 ${val > 0 ? 'text-slate-900 dark:text-zinc-100 font-medium' : 'text-slate-400 dark:text-zinc-500'}`}>
                        {val > 0 ? formatRupiah(val) : '0'}
                      </td>
                    );
                  })}
                  <td className="px-4 py-2.5 text-right font-mono font-bold border-l-2 border-emerald-500/30 text-emerald-900 dark:text-emerald-300 bg-emerald-50/30 dark:bg-emerald-950/20">
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
            <tfoot className="bg-[#f0f9f3] dark:bg-[#12181f] font-bold text-slate-900 dark:text-white border-t-2 border-[#a8dbc0] dark:border-[#2b5a45] text-xs">
              <tr>
                <td colSpan={3} className="px-4 py-3.5 text-center uppercase tracking-wide border-r border-[#c2e5d2] dark:border-[#2b5a45]">
                  TOTAL ({filteredData.length} POS REKENING TERFILTER)
                </td>
                <td className="px-4 py-3.5 text-right font-mono border-r border-[#c2e5d2] dark:border-[#2b5a45] text-slate-700 dark:text-zinc-300">
                  <div className="flex justify-between items-center w-full">
                    <span className="text-[10px] text-slate-400">Rp</span>
                    <span>{grandTotals.total2025 > 0 ? formatRupiah(grandTotals.total2025) : '-'}</span>
                  </div>
                </td>
                {MONTHS.map(m => (
                  <td key={m} className="px-4 py-3.5 text-right font-mono border-r border-[#c2e5d2] dark:border-[#2b5a45] text-slate-800 dark:text-zinc-200">
                    {grandTotals[m] > 0 ? formatRupiah(grandTotals[m]) : '0'}
                  </td>
                ))}
                <td className="px-4 py-3.5 text-right font-mono text-sm font-black text-emerald-800 dark:text-emerald-300 bg-emerald-50/60 dark:bg-emerald-950/40">
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
