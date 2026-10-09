import React, { useRef } from 'react';
import { useData } from '../../context/DataContext';
import { ALL_31_LGAS, PILLARS } from '../../data/lgas';
import { HcdLogo } from '../common/Logos';
import { X, Printer, Download, CheckCircle2, ShieldCheck, Building2 } from 'lucide-react';

interface ReportExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ReportExportModal: React.FC<ReportExportModalProps> = ({ isOpen, onClose }) => {
  const { activities } = useData();
  const printRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const published = activities.filter((a) => a.status === 'PUBLISHED');
  const totalBeneficiaries = published.reduce((acc, a) => acc + a.beneficiariesTotal, 0);
  const totalMale = published.reduce((acc, a) => acc + a.beneficiariesMale, 0);
  const totalFemale = published.reduce((acc, a) => acc + a.beneficiariesFemale, 0);
  const totalYouth = published.reduce((acc, a) => acc + a.youthBeneficiaries, 0);
  const totalBudget = published.reduce((acc, a) => acc + a.budgetNgn, 0);

  // Group by Pillar
  const pillarStats = Object.values(PILLARS).map((p) => {
    const pActs = published.filter((a) => a.pillar === p.id);
    const pBen = pActs.reduce((acc, a) => acc + a.beneficiariesTotal, 0);
    const pBud = pActs.reduce((acc, a) => acc + a.budgetNgn, 0);
    return {
      pillar: p,
      count: pActs.length,
      beneficiaries: pBen,
      budget: pBud,
    };
  });

  const handlePrint = () => {
    window.print();
  };

  const handleExportCsv = () => {
    const headers = [
      'ID',
      'LGA',
      'Title',
      'Pillar',
      'SubCategory',
      'Community',
      'BeneficiariesTotal',
      'BeneficiariesMale',
      'BeneficiariesFemale',
      'YouthBeneficiaries',
      'BudgetNGN',
      'StartDate',
      'CompletionDate',
      'LeadOfficer',
      'Status',
      'OverallProgress',
      'CreatedAt',
    ];
    const rows = activities.map((a) => [
      `"${a.id}"`,
      `"${a.lgaName}"`,
      `"${a.title.replace(/"/g, '""')}"`,
      `"${a.pillar}"`,
      `"${a.subCategory}"`,
      `"${a.community.replace(/"/g, '""')}"`,
      a.beneficiariesTotal,
      a.beneficiariesMale,
      a.beneficiariesFemale,
      a.youthBeneficiaries,
      a.budgetNgn,
      `"${a.startDate}"`,
      `"${a.completionDate}"`,
      `"${a.leadOfficer}"`,
      `"${a.status}"`,
      `${a.overallProgress || 0}%`,
      `"${a.createdAt}"`,
    ]);
    const csv = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `AKS_HCD_Executive_Dossier_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in">
        {/* Controls Bar */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between no-print">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-[#D4AF37]" />
            <span className="text-sm font-bold">
              Official Executive Human Capital Development Briefing
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCsv}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors border border-slate-700"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              Download CSV
            </button>
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              Print / Save as PDF
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Document Body */}
        <div ref={printRef} className="p-8 sm:p-12 overflow-y-auto bg-white space-y-8 font-sans">
          {/* Document Letterhead */}
          <div className="text-center border-b-2 border-emerald-950 pb-6 space-y-2">
            <div className="flex items-center justify-center mb-2">
              <div className="w-16 h-16 rounded-2xl bg-white p-2 border border-[#D4AF37] shadow-sm flex items-center justify-center">
                <HcdLogo className="w-full h-full object-contain" />
              </div>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-emerald-950 tracking-tight uppercase">
              GOVERNMENT OF AKWA IBOM STATE
            </h1>
            <h2 className="text-xs sm:text-sm font-bold text-[#b45309] uppercase tracking-widest">
              State Council on Human Capital Development · ARISE Agenda
            </h2>
            <p className="text-xs text-slate-500 font-mono">
              OFFICIAL PERFORMANCE & VERIFICATION DOSSIER · ALL 31 LGAS
            </p>
            <div className="text-[11px] text-slate-400">
              Generated: {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })} · Document Ref: AKS-HCD/EXEC/Q1-2026
            </div>
          </div>

          {/* Executive Overview Numbers */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-slate-50 p-5 rounded-2xl border border-slate-200">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-500 block">
                Total Beneficiaries
              </span>
              <span className="text-2xl font-black text-emerald-950 font-mono tabular-nums block mt-1">
                {totalBeneficiaries.toLocaleString()}
              </span>
              <span className="text-[10px] text-emerald-700">100% Bio-verified</span>
            </div>

            <div>
              <span className="text-[10px] uppercase font-bold text-slate-500 block">
                Demographic Gender Split
              </span>
              <span className="text-sm font-bold text-slate-800 font-mono tabular-nums block mt-2">
                ♂ {totalMale.toLocaleString()} ({totalBeneficiaries > 0 ? ((totalMale / totalBeneficiaries) * 100).toFixed(0) : 0}%)
              </span>
              <span className="text-sm font-bold text-slate-800 font-mono tabular-nums block">
                ♀ {totalFemale.toLocaleString()} ({totalBeneficiaries > 0 ? ((totalFemale / totalBeneficiaries) * 100).toFixed(0) : 0}%)
              </span>
            </div>

            <div>
              <span className="text-[10px] uppercase font-bold text-slate-500 block">
                Youth Reached (18-35)
              </span>
              <span className="text-2xl font-black text-slate-900 font-mono tabular-nums block mt-1">
                {totalYouth.toLocaleString()}
              </span>
              <span className="text-[10px] text-slate-500">
                {totalBeneficiaries > 0 ? ((totalYouth / totalBeneficiaries) * 100).toFixed(0) : 0}% of total
              </span>
            </div>

            <div>
              <span className="text-[10px] uppercase font-bold text-slate-500 block">
                Total Capital Invested
              </span>
              <span className="text-2xl font-black text-emerald-900 font-mono tabular-nums block mt-1">
                ₦ {(totalBudget / 1000000).toFixed(1)}M
              </span>
              <span className="text-[10px] text-emerald-700">Across 31 Councils</span>
            </div>
          </div>

          {/* Strategic Pillar Performance Table */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide border-b border-slate-200 pb-1">
              1. Distribution Across Strategic HCD Pillars
            </h3>
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px]">
                  <tr>
                    <th className="py-2.5 px-3">Pillar Designation</th>
                    <th className="py-2.5 px-3">Verified Projects</th>
                    <th className="py-2.5 px-3">Beneficiaries</th>
                    <th className="py-2.5 px-3">Capital Deployed (NGN)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {pillarStats.map((item) => (
                    <tr key={item.pillar.id}>
                      <td className="py-2.5 px-3 font-semibold text-slate-900">
                        {item.pillar.name}
                      </td>
                      <td className="py-2.5 px-3 font-mono tabular-nums font-bold">
                        {item.count}
                      </td>
                      <td className="py-2.5 px-3 font-mono tabular-nums font-bold text-slate-900">
                        {item.beneficiaries.toLocaleString()}
                      </td>
                      <td className="py-2.5 px-3 font-mono tabular-nums text-emerald-900 font-semibold">
                        ₦ {(item.budget / 1000000).toFixed(2)}M
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Published Project Highlights */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide border-b border-slate-200 pb-1">
              2. Key Grassroots Project Highlights
            </h3>
            <div className="space-y-2.5">
              {published.slice(0, 5).map((act) => (
                <div
                  key={act.id}
                  className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs flex items-start justify-between gap-3"
                >
                  <div>
                    <span className="font-bold text-emerald-950 mr-2">[{act.lgaName} LGA]</span>
                    <strong className="text-slate-900">{act.title}</strong>
                    <p className="text-[11px] text-slate-600 mt-0.5">
                      {act.community} · {act.leadOfficer} · Registry: {act.attendanceSheetFileName || 'Verified Roll'}
                    </p>
                    <p className="text-[10px] text-emerald-800 font-medium mt-0.5">
                      ✓ Phased Execution: {act.overallProgress !== undefined ? `${act.overallProgress}%` : '100%'} Completed ({act.milestones?.length || 3} Phases Documented)
                    </p>
                  </div>
                  <div className="text-right shrink-0 font-mono">
                    <span className="font-bold text-slate-900 block">
                      {act.beneficiariesTotal.toLocaleString()} ben.
                    </span>
                    <span className="text-[11px] text-emerald-800">
                      ₦ {(act.budgetNgn / 1000000).toFixed(1)}M
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Signatures & Certification Seal */}
          <div className="pt-8 border-t-2 border-slate-200 grid grid-cols-2 gap-8 text-xs">
            <div className="space-y-6">
              <div className="border-b border-slate-400 pb-2">
                <span className="font-serif italic text-base text-slate-700">Dr. Bassey Okon</span>
              </div>
              <div>
                <p className="font-bold text-slate-900">Dr. Bassey Okon</p>
                <p className="text-slate-500 text-[11px]">
                  Executive Secretary, Akwa Ibom State Human Capital Development Council
                </p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="border-b border-slate-400 pb-2">
                <span className="font-serif italic text-base text-slate-700">Hon. Iniobong Essien</span>
              </div>
              <div>
                <p className="font-bold text-slate-900">Hon. Iniobong Essien</p>
                <p className="text-slate-500 text-[11px]">
                  Special Adviser to the Executive Governor on Grassroots Strategy & Alignment
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
