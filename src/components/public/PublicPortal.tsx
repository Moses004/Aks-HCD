import React, { useState, useMemo } from 'react';
import { HCDActivity } from '../../types';
import { ALL_31_LGAS, PILLARS, getLgaById } from '../../data/lgas';
import { AkwaIbomStateMap } from '../map/AkwaIbomStateMap';
import { AriseLogo } from '../common/Logos';
import {
  Search,
  Filter,
  GraduationCap,
  HeartPulse,
  Wrench,
  Sprout,
  Users,
  MapPin,
  CheckCircle2,
  FileCheck2,
  Download,
  Eye,
  ExternalLink,
  Building2,
  ArrowRight,
  TrendingUp,
  Award,
  Calendar,
  Sparkles,
  Flag,
} from 'lucide-react';

interface PublicPortalProps {
  activities: HCDActivity[];
  onViewActivity: (activity: HCDActivity) => void;
  onOpenReportExport: () => void;
  onNavigateToLga: (lgaId: string) => void;
}

export const PublicPortal: React.FC<PublicPortalProps> = ({
  activities,
  onViewActivity,
  onOpenReportExport,
  onNavigateToLga,
}) => {
  const [selectedLgaId, setSelectedLgaId] = useState<string | null>(null);
  const [selectedPillar, setSelectedPillar] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [districtFilter, setDistrictFilter] = useState<string>('all');

  // Only published activities are displayed on the public transparency portal
  const publishedActivities = useMemo(() => {
    return activities.filter((a) => a.status === 'PUBLISHED');
  }, [activities]);

  // Aggregate Key Counters
  const totalBeneficiaries = useMemo(() => {
    return publishedActivities.reduce((acc, a) => acc + a.beneficiariesTotal, 0);
  }, [publishedActivities]);

  const totalBudget = useMemo(() => {
    return publishedActivities.reduce((acc, a) => acc + a.budgetNgn, 0);
  }, [publishedActivities]);

  const activeLgasCount = useMemo(() => {
    const set = new Set(publishedActivities.map((a) => a.lgaId));
    return set.size;
  }, [publishedActivities]);

  // Filtered Activities
  const filteredActivities = useMemo(() => {
    return publishedActivities.filter((a) => {
      const matchLga = !selectedLgaId || a.lgaId.toLowerCase() === selectedLgaId.toLowerCase();
      const matchPillar = selectedPillar === 'all' || a.pillar === selectedPillar;
      const matchSearch =
        !searchQuery ||
        a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.lgaName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.community.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.subCategory.toLowerCase().includes(searchQuery.toLowerCase());

      const lgaObj = getLgaById(a.lgaId);
      const matchDistrict =
        districtFilter === 'all' ||
        (districtFilter === 'uyo' && lgaObj?.senatorialDistrict.includes('North-East')) ||
        (districtFilter === 'ikot-ekpene' && lgaObj?.senatorialDistrict.includes('North-West')) ||
        (districtFilter === 'eket' && lgaObj?.senatorialDistrict.includes('South'));

      return matchLga && matchPillar && matchSearch && matchDistrict;
    });
  }, [publishedActivities, selectedLgaId, selectedPillar, searchQuery, districtFilter]);

  const selectedLgaObj = selectedLgaId ? getLgaById(selectedLgaId) : null;

  return (
    <div className="space-y-10 pb-16">
      {/* 1. HERO LEADERSHIP SPOTLIGHT & ARISE AGENDA BANNER (Inspired by reference screenshot) */}
      <section className="bg-gradient-to-b from-emerald-950 via-[#0B4619] to-emerald-900 text-white pt-8 pb-14 px-4 sm:px-6 lg:px-8 border-b-4 border-[#D4AF37] relative overflow-hidden">
        {/* Subtle patterned backdrop */}
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="hero-pattern" width="60" height="60" patternUnits="userSpaceOnUse">
                <circle cx="30" cy="30" r="1.5" fill="#D4AF37" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#hero-pattern)" />
          </svg>
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left Headline & Strategic Mandate (7 cols) */}
            <div className="lg:col-span-8 space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-[#D4AF37]/50 text-[#D4AF37] text-xs font-semibold backdrop-blur-xs">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Akwa Ibom State Human Capital Development Blueprint · ARISE Agenda</span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight text-balance">
                Unified Human Capacity Tracking Across All 31 LGAs
              </h1>

              <p className="text-sm sm:text-base text-emerald-100/90 leading-relaxed max-w-2xl text-balance">
                Measuring real-time grassroots investments in Education, Healthcare, Vocational Tech Skills, and Agricultural Empowerment. Isolated municipal workflows unified into an open state impact repository.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <a
                  href="#map-section"
                  className="px-5 py-3 rounded-xl bg-[#D4AF37] hover:bg-amber-400 text-emerald-950 font-bold text-xs sm:text-sm shadow-md transition-all active:scale-95 flex items-center gap-2"
                >
                  <MapPin className="w-4 h-4" />
                  Explore 31-LGA Interactive Map
                </a>

                <button
                  onClick={onOpenReportExport}
                  className="px-4 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs sm:text-sm border border-white/20 transition-colors flex items-center gap-2"
                >
                  <Download className="w-4 h-4 text-emerald-300" />
                  Official Executive Briefing
                </button>
              </div>
            </div>

            {/* Right AKS | ARISE Placeholder Card (Single Prominent ARISE Logo Seal) */}
            <div className="lg:col-span-4">
              <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-6 sm:p-7 shadow-xl text-center space-y-4">
                {/* Official ARISE Agenda Logo - Expanded Prominent Rounded Seal */}
                <div className="flex flex-col items-center justify-center py-2">
                  <div className="w-32 h-32 sm:w-40 sm:h-40 md:w-44 md:h-44 aspect-square rounded-full bg-white p-4 sm:p-5 shadow-2xl border-4 border-[#D4AF37] ring-4 ring-white/25 flex items-center justify-center hover:scale-105 transition-transform duration-300 overflow-hidden shrink-0">
                    <AriseLogo className="w-full h-full object-contain" />
                  </div>
                </div>

                <div className="space-y-1">
                  <h3 className="text-lg sm:text-xl font-black text-white tracking-wide">
                    ARISE AGENDA
                  </h3>
                  <p className="text-xs text-[#D4AF37] font-semibold tracking-wide">
                    Government of Akwa Ibom State
                  </p>
                  <p className="text-[11px] text-emerald-100/90 italic mt-2 leading-relaxed text-balance">
                    "Anchored on the ARISE Agenda and the Human Capital Development Framework, powering grassroots empowerment across all 31 Local Government Areas."
                  </p>
                </div>

                <div className="pt-2 border-t border-white/10 flex items-center justify-center gap-2 text-[10px] text-emerald-200">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#D4AF37]" />
                  <span>Official ARISE Agenda Emblem · Rounded Seal Format</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. LIVE STATE KPI STATS BANNER */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-10 relative z-20">
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200/90 p-5 sm:p-6 grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 divide-y sm:divide-y-0 sm:divide-x divide-slate-100">
          <div className="space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
              Verified Beneficiaries
            </span>
            <div className="text-2xl sm:text-3xl font-black text-emerald-950 font-mono tabular-nums">
              {totalBeneficiaries.toLocaleString()}
            </div>
            <div className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Biometrically Documented
            </div>
          </div>

          <div className="space-y-1 pt-3 sm:pt-0 sm:pl-6">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
              Published Grassroots Projects
            </span>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 font-mono tabular-nums">
              {publishedActivities.length}
            </div>
            <div className="text-[11px] text-slate-500 font-medium">
              Cabinet Approved & Audited
            </div>
          </div>

          <div className="space-y-1 pt-3 sm:pt-0 sm:pl-6">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
              31 Local Governments
            </span>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 font-mono tabular-nums">
              31 / 31
            </div>
            <div className="text-[11px] text-emerald-700 font-medium">
              {activeLgasCount} Councils With Active Records
            </div>
          </div>

          <div className="space-y-1 pt-3 sm:pt-0 sm:pl-6">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
              Capacity Capital Deployed
            </span>
            <div className="text-2xl sm:text-3xl font-black text-emerald-900 font-mono tabular-nums">
              ₦ {(totalBudget / 1000000).toFixed(1)}M
            </div>
            <div className="text-[11px] text-slate-500 font-medium">
              Direct Beneficiary Subventions
            </div>
          </div>
        </div>
      </section>

      {/* 3. THE 4 PRIMARY DEVELOPMENT PILLARS (Interactive filter cards) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 border-b border-slate-200 pb-3">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Primary Human Capital Pillars
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              Grassroots activities categorically binding to the Akwa Ibom State HCD Blueprint
            </p>
          </div>
          <button
            onClick={() => setSelectedPillar('all')}
            className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-colors ${
              selectedPillar === 'all'
                ? 'bg-emerald-950 text-white'
                : 'text-slate-600 hover:text-slate-900 bg-slate-100'
            }`}
          >
            Show All Pillars
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Object.values(PILLARS).map((pillar) => {
            const isSelected = selectedPillar === pillar.id;
            const pActs = publishedActivities.filter((a) => a.pillar === pillar.id);
            const pBen = pActs.reduce((acc, a) => acc + a.beneficiariesTotal, 0);

            return (
              <div
                key={pillar.id}
                onClick={() => setSelectedPillar(isSelected ? 'all' : pillar.id)}
                className={`p-5 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between ${
                  isSelected
                    ? 'border-emerald-700 bg-emerald-50/70 shadow-md ring-2 ring-emerald-700/20'
                    : 'border-slate-200/90 bg-white hover:border-slate-300 hover:shadow-sm'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white shadow-xs"
                      style={{ backgroundColor: pillar.color }}
                    >
                      {pillar.id === 'education' && <GraduationCap className="w-5 h-5" />}
                      {pillar.id === 'health' && <HeartPulse className="w-5 h-5" />}
                      {pillar.id === 'vocational' && <Wrench className="w-5 h-5" />}
                      {pillar.id === 'agriculture' && <Sprout className="w-5 h-5" />}
                    </div>
                    <span className="text-xs font-bold text-slate-500 font-mono tabular-nums">
                      {pActs.length} {pActs.length === 1 ? 'project' : 'projects'}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-slate-900">{pillar.name}</h3>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      {pillar.tagline}
                    </p>
                  </div>
                </div>

                <div className="pt-4 mt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-500">Beneficiaries</span>
                  <strong className="text-slate-900 font-mono tabular-nums font-bold">
                    {pBen.toLocaleString()}
                  </strong>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 4. GEOSPATIAL 31-LGA INTERACTIVE MAP SECTION */}
      <section id="map-section" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 border-b border-slate-200 pb-3">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              31 Local Government Areas Vector Map
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              Select or hover any LGA polygon to query verified grassroots metrics and isolate territory data
            </p>
          </div>

          {selectedLgaId && (
            <button
              onClick={() => setSelectedLgaId(null)}
              className="text-xs font-semibold text-emerald-800 hover:underline"
            >
              Reset to All 31 LGAs
            </button>
          )}
        </div>

        <AkwaIbomStateMap
          activities={activities}
          selectedLgaId={selectedLgaId}
          onSelectLga={(id) => setSelectedLgaId(id)}
        />
      </section>

      {/* 5. VERIFIED ACTIVITIES SEARCH & REGISTRY EXPLORER */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              Verified Project Dossiers
              {selectedLgaObj && (
                <span className="text-xs font-bold text-emerald-900 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                  {selectedLgaObj.name} LGA
                </span>
              )}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              Grassroots activities verified with photo proofs, attendance rolls, and State Cabinet approvals
            </p>
          </div>

          {/* Search & District Filter Controls */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-[240px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search community, title, or skill..."
                className="w-full text-xs pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700"
              />
            </div>

            <select
              value={districtFilter}
              onChange={(e) => setDistrictFilter(e.target.value)}
              className="text-xs p-2.5 rounded-xl border border-slate-300 bg-white font-medium text-slate-700"
            >
              <option value="all">All Senatorial Districts</option>
              <option value="uyo">Uyo District (North-East)</option>
              <option value="ikot-ekpene">Ikot Ekpene District (North-West)</option>
              <option value="eket">Eket District (South)</option>
            </select>
          </div>
        </div>

        {/* Projects Cards Grid */}
        {filteredActivities.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
            <Building2 className="w-10 h-10 text-slate-300 mx-auto" />
            <h4 className="text-base font-bold text-slate-800">
              No matching verified activities found
            </h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Try adjusting your search criteria, clearing the LGA map filter, or switching pillars.
            </p>
            <button
              onClick={() => {
                setSelectedLgaId(null);
                setSelectedPillar('all');
                setSearchQuery('');
                setDistrictFilter('all');
              }}
              className="px-4 py-2 bg-emerald-800 text-white rounded-lg text-xs font-bold transition-colors"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredActivities.map((activity) => {
              const pillar = PILLARS[activity.pillar];

              return (
                <div
                  key={activity.id}
                  className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden flex flex-col justify-between hover:shadow-md hover:border-slate-300 transition-all group"
                >
                  <div>
                    {/* Visual Media Header */}
                    {activity.mediaAssets.length > 0 ? (
                      <div className="relative h-48 w-full bg-slate-100 overflow-hidden">
                        <img
                          src={activity.mediaAssets[0].url}
                          alt={activity.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
                        <div className="absolute top-3 left-3">
                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-white bg-emerald-900/90 px-2.5 py-1 rounded-md shadow-xs">
                            {activity.lgaName} LGA
                          </span>
                        </div>
                        <div className="absolute bottom-2.5 left-3 right-3 text-white flex items-center justify-between text-xs">
                          <span className="font-semibold truncate max-w-[200px]">
                            {activity.community}
                          </span>
                          <span className="text-[10px] bg-white/20 backdrop-blur-xs px-2 py-0.5 rounded text-emerald-100 font-medium">
                            ✓ Verified Geotag
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-800">{activity.lgaName} LGA</span>
                        <span className="text-[11px] text-slate-500">{activity.community}</span>
                      </div>
                    )}

                    {/* Card Content */}
                    <div className="p-5 space-y-3">
                      {/* Unboxed Metadata (Zero-pill discipline) */}
                      <div className="flex items-center gap-1.5 text-xs text-slate-500">
                        <span>{pillar?.name}</span>
                        <span aria-hidden="true">·</span>
                        <span>{activity.subCategory}</span>
                      </div>

                      <h3 className="text-sm sm:text-base font-bold text-slate-900 line-clamp-2 leading-snug group-hover:text-emerald-900 transition-colors">
                        {activity.title}
                      </h3>

                      {/* Quantitative Demographic Splits */}
                      <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-100">
                        <div className="bg-slate-50 p-2 rounded-lg">
                          <span className="text-[10px] text-slate-500 block">Total Beneficiaries</span>
                          <strong className="text-sm font-black text-slate-900 font-mono tabular-nums">
                            {activity.beneficiariesTotal.toLocaleString()}
                          </strong>
                          <span className="text-[10px] text-slate-500 block">
                            ♂ {activity.beneficiariesMale} · ♀ {activity.beneficiariesFemale}
                          </span>
                        </div>

                        <div className="bg-slate-50 p-2 rounded-lg">
                          <span className="text-[10px] text-slate-500 block">Invested Capital</span>
                          <strong className="text-sm font-black text-emerald-950 font-mono tabular-nums">
                            ₦ {(activity.budgetNgn / 1000000).toFixed(1)}M
                          </strong>
                          <span className="text-[10px] text-slate-500 block truncate">
                            Desk: {activity.leadOfficer}
                          </span>
                        </div>
                      </div>

                      {/* Milestone Phased Progress Bar */}
                      <div className="pt-2 border-t border-slate-100 space-y-1">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-slate-500 font-medium flex items-center gap-1">
                            <Flag className="w-3 h-3 text-emerald-700" />
                            Milestones (
                            {activity.milestones?.length || 3} Phases)
                          </span>
                          <span className="font-bold text-emerald-900 font-mono">
                            {activity.overallProgress !== undefined
                              ? `${activity.overallProgress}%`
                              : activity.status === 'PUBLISHED'
                              ? '100%'
                              : '65%'}
                          </span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                          <div
                            className="bg-emerald-700 h-1.5 rounded-full transition-all"
                            style={{
                              width: `${
                                activity.overallProgress !== undefined
                                  ? activity.overallProgress
                                  : activity.status === 'PUBLISHED'
                                  ? 100
                                  : 65
                              }%`,
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Card Footer Actions */}
                  <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs">
                    <button
                      onClick={() => onViewActivity(activity)}
                      className="font-bold text-emerald-800 hover:text-emerald-950 flex items-center gap-1 transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      Inspect Dossier & Proof
                    </button>

                    <button
                      onClick={() => onNavigateToLga(activity.lgaId)}
                      className="text-slate-500 hover:text-slate-800 flex items-center gap-1 transition-colors"
                    >
                      <span>LGA Desk</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* 6. CITIZEN TRANSPARENCY & ASSURANCE BANNER */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-emerald-950 text-white rounded-2xl p-6 sm:p-8 border border-[#D4AF37]/30 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-md">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-[#D4AF37] uppercase tracking-wider">
              <CheckCircle2 className="w-4 h-4" />
              Civil Society & Independent Auditing
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Open Public Reporting & Verification Standards
            </h3>
            <p className="text-xs sm:text-sm text-emerald-200/80 max-w-xl leading-relaxed">
              Every data point published on this portal requires signed biometric registers, photographic GPS assets within state boundaries, and State Super-Admin verification.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={onOpenReportExport}
              className="px-5 py-2.5 bg-[#D4AF37] hover:bg-amber-400 text-emerald-950 rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95"
            >
              Export Public Transparency Brief
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
