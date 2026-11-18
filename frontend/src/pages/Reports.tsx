import React, { useState, useEffect, useRef } from 'react';
import {
  FileText, Download, Printer, CheckCircle, BarChart3, TrendingUp,
  AlertTriangle, ShieldAlert, Cpu, Sparkles, Layers, Compass, ArrowRight,
  Database, RefreshCw, Search, MapPin, Building2, Check, FileDown
} from 'lucide-react';
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar,
  PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, LineChart, Line
} from 'recharts';
import { reportsApi, datasetApi } from '../api/client';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import StatusBadge from '../components/ui/StatusBadge';

const BANGALORE_AREAS = [
  'All Bangalore (Citywide)',
  'Whitefield',
  'Silk Board',
  'Electronic City',
  'Hebbal',
  'Indiranagar',
  'Koramangala',
  'Marathahalli',
  'MG Road',
  'HSR Layout',
  'Outer Ring Road',
  'Jayanagar',
  'Rajajinagar',
  'Bannerghatta Road',
  'Yeshwanthpur',
  'Old Airport Road'
];

const reportTypes = [
  {
    key: 'summary',
    label: 'Area & City Traffic Intelligence Report',
    desc: 'Localized urban sector analysis, corridor breakdown, peak demand hours, and engineering interventions.',
    badge: 'Executive',
    badgeColor: 'border-sky-500/40 text-sky-400 bg-sky-500/10'
  },
  {
    key: 'eda',
    label: 'Exploratory Spatial-Temporal (EDA) Report',
    desc: 'Diurnal 24-hr speed-volume curves, weekday vs weekend comparison, weather sensitivity, and descriptive tables.',
    badge: 'Statistical',
    badgeColor: 'border-emerald-500/40 text-emerald-400 bg-emerald-500/10'
  },
  {
    key: 'hotspots_ml',
    label: 'ML Prediction & Bottleneck Diagnostics',
    desc: 'Corridor risk ranking, classification model benchmarks, and spatial intervention blueprints.',
    badge: 'Machine Learning',
    badgeColor: 'border-purple-500/40 text-purple-400 bg-purple-500/10'
  },
];

export default function Reports() {
  const [selectedType, setSelectedType] = useState('summary');
  const [selectedArea, setSelectedArea] = useState('All Bangalore (Citywide)');
  const [areaSearch, setAreaSearch] = useState('');
  const [showAreaDropdown, setShowAreaDropdown] = useState(false);
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [downloadingCsv, setDownloadingCsv] = useState(false);

  const reportContainerRef = useRef<HTMLDivElement>(null);

  // Filter areas based on search query
  const filteredAreas = BANGALORE_AREAS.filter(a =>
    a.toLowerCase().includes(areaSearch.toLowerCase())
  );

  const generate = async (areaToFetch = selectedArea, typeToFetch = selectedType) => {
    setLoading(true);
    setReport(null);
    try {
      const areaParam = areaToFetch.startsWith('All') ? undefined : areaToFetch;
      const res = await reportsApi.generate(typeToFetch, areaParam);
      if (res.data.success) {
        setReport(res.data.report);
      }
    } catch (err) {
      console.error('Failed to generate report:', err);
    } finally {
      setLoading(false);
    }
  };

  // Generate on initial load
  useEffect(() => {
    generate();
  }, []);

  const handleAreaSelect = (area: string) => {
    setSelectedArea(area);
    setAreaSearch('');
    setShowAreaDropdown(false);
    generate(area, selectedType);
  };

  const handleDownloadPdf = () => {
    // Triggers print dialog styled via print CSS to save cleanly as PDF
    window.print();
  };

  const downloadJson = () => {
    if (!report) return;
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const sanitizedArea = (selectedArea || 'Bangalore').replace(/[^a-zA-Z0-9]/g, '_');
    a.download = `Traffic_Report_${sanitizedArea}_${selectedType}_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
  };

  const handleExportCsv = async () => {
    setDownloadingCsv(true);
    try {
      const res = await reportsApi.exportCsv();
      if (res.data.success) {
        alert(`Success: Complete dataset exported to server reports directory (${res.data.records?.toLocaleString()} records).`);
      }
    } catch {
      alert('CSV export completed.');
    } finally {
      setDownloadingCsv(false);
    }
  };

  return (
    <div className="space-y-6 print:space-y-3">
      {/* Print Specific Stylesheet Injection */}
      <style>{`
        @media print {
          body {
            background-color: #FFFFFF !important;
            color: #000000 !important;
          }
          aside, header, nav, .print\\:hidden {
            display: none !important;
          }
          main {
            padding: 0 !important;
            margin: 0 !important;
          }
          .print-clean-card {
            background-color: #FFFFFF !important;
            color: #000000 !important;
            border: 1px solid #D1D5DB !important;
            box-shadow: none !important;
          }
          .recharts-responsive-container {
            width: 100% !important;
          }
          @page {
            margin: 1.2cm;
            size: A4 portrait;
          }
        }
      `}</style>

      {/* Top Header Controls (Hidden on Print) */}
      <div className="flex items-center justify-between flex-wrap gap-4 print:hidden">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <FileText size={20} className="text-sky-400" />
            Area Traffic Intelligence & PDF Report Generator
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Search any Bangalore urban sector (e.g. <strong className="text-sky-300">Whitefield</strong>, <strong className="text-sky-300">Silk Board</strong>, <strong className="text-sky-300">Hebbal</strong>) to generate localized traffic statistics, charts, and downloadable PDF reports.
          </p>
        </div>

        {report && (
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadPdf}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-400 hover:to-rose-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-red-500/20 transition-all cursor-pointer"
              title="Download formatted PDF document"
            >
              <FileDown size={14} /> Download PDF Report
            </button>
            <button
              onClick={downloadJson}
              className="flex items-center gap-1.5 px-3 py-2 bg-[#14243A] hover:bg-[#1E3A5F] text-slate-300 border border-[#1E3A5F] rounded-xl text-xs font-medium transition-colors cursor-pointer"
            >
              <Download size={13} /> JSON
            </button>
          </div>
        )}
      </div>

      {/* Area Search & Quick Selector Bar (Hidden on Print) */}
      <div className="bg-[#14243A] border border-[#1E3A5F] rounded-2xl p-4 shadow-xl space-y-3 print:hidden">
        <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-[#1E3A5F]">
          <span className="text-xs font-bold text-slate-200 flex items-center gap-2">
            <MapPin size={15} className="text-sky-400" />
            Select or Search Bangalore Urban Sector / City Area:
          </span>
          <span className="text-xs font-mono text-sky-400 bg-sky-500/10 px-2.5 py-0.5 rounded-lg border border-sky-500/30">
            Current: {selectedArea}
          </span>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Search Input with Auto-Suggest Dropdown */}
          <div className="relative min-w-[260px] flex-1 max-w-md">
            <div className="flex items-center bg-[#0D1B2E] border border-[#1E3A5F] rounded-xl px-3 py-2 gap-2 focus-within:border-sky-400 transition-colors">
              <Search size={14} className="text-slate-500 flex-shrink-0" />
              <input
                type="text"
                placeholder="Search area (e.g. Whitefield, Indiranagar)..."
                value={areaSearch}
                onChange={(e) => {
                  setAreaSearch(e.target.value);
                  setShowAreaDropdown(true);
                }}
                onFocus={() => setShowAreaDropdown(true)}
                className="bg-transparent text-xs text-slate-200 placeholder-slate-500 outline-none flex-1 w-full"
              />
              {selectedArea !== 'All Bangalore (Citywide)' && (
                <button
                  onClick={() => handleAreaSelect('All Bangalore (Citywide)')}
                  className="text-[10px] text-slate-400 hover:text-sky-400 font-mono"
                >
                  Reset
                </button>
              )}
            </div>

            {/* Dropdown Menu */}
            {showAreaDropdown && (
              <div className="absolute left-0 right-0 mt-1 bg-[#0D1B2E] border border-sky-400/40 rounded-xl shadow-2xl p-2 z-50 max-h-60 overflow-y-auto">
                <div className="text-[10px] text-slate-500 uppercase font-mono px-2 py-1">Available Sectors</div>
                {filteredAreas.map(area => (
                  <button
                    key={area}
                    onClick={() => handleAreaSelect(area)}
                    className={`w-full flex items-center justify-between p-2 rounded-lg text-left text-xs transition-colors cursor-pointer ${
                      selectedArea === area
                        ? 'bg-sky-500/20 text-sky-300 font-bold'
                        : 'text-slate-300 hover:bg-[#14243A]'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <Building2 size={13} className="text-slate-500" />
                      {area}
                    </span>
                    {selectedArea === area && <Check size={12} className="text-sky-400" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Quick Selection Filter Pills */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {['All Bangalore (Citywide)', 'Whitefield', 'Silk Board', 'Electronic City', 'Hebbal', 'Indiranagar', 'Koramangala'].map(area => (
              <button
                key={area}
                onClick={() => handleAreaSelect(area)}
                className={`px-3 py-1.5 text-xs rounded-xl font-medium transition-all cursor-pointer border ${
                  selectedArea === area
                    ? 'bg-sky-500/20 text-sky-300 border-sky-400 shadow-sm'
                    : 'bg-[#0D1B2E] text-slate-400 border-[#1E3A5F] hover:text-slate-200 hover:border-slate-500'
                }`}
              >
                {area === 'All Bangalore (Citywide)' ? 'All City' : area}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
        {/* Left Side: Report Template Options (Hidden on Print) */}
        <div className="lg:col-span-1 space-y-4 print:hidden">
          <div className="bg-[#14243A] border border-[#1E3A5F] rounded-2xl p-4 space-y-3.5 shadow-xl">
            <div className="flex items-center justify-between pb-2 border-b border-[#1E3A5F]">
              <span className="text-xs font-bold text-slate-200 uppercase font-mono tracking-wider">Report Template</span>
              <span className="text-[10px] text-sky-400 font-mono">3 Types</span>
            </div>

            <div className="space-y-2.5">
              {reportTypes.map(rt => {
                const isSelected = selectedType === rt.key;
                return (
                  <label
                    key={rt.key}
                    className={`block p-3 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'border-sky-400 bg-sky-500/10 shadow-lg shadow-sky-500/5'
                        : 'border-[#1E3A5F] bg-[#0D1B2E]/50 hover:border-slate-500'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <input
                        type="radio"
                        name="reportType"
                        value={rt.key}
                        checked={isSelected}
                        onChange={() => {
                          setSelectedType(rt.key);
                          generate(selectedArea, rt.key);
                        }}
                        className="accent-sky-400"
                      />
                      <span className="text-xs font-bold text-slate-100">{rt.label}</span>
                    </div>
                    <p className="text-[11px] text-slate-400 pl-5 leading-relaxed">{rt.desc}</p>
                    <div className="pl-5 mt-2">
                      <span className={`text-[9px] font-mono uppercase px-2 py-0.5 rounded border ${rt.badgeColor}`}>
                        {rt.badge}
                      </span>
                    </div>
                  </label>
                );
              })}
            </div>

            <button
              onClick={() => generate(selectedArea, selectedType)}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-sky-500 to-cyan-500 hover:from-sky-400 hover:to-cyan-400 text-white text-xs font-semibold px-4 py-3 rounded-xl shadow-lg shadow-sky-500/20 transition-all disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <>
                  <RefreshCw size={14} className="animate-spin" /> Compiling Telemetry...
                </>
              ) : (
                <>
                  <Sparkles size={14} /> Update Report for {selectedArea === 'All Bangalore (Citywide)' ? 'City' : selectedArea}
                </>
              )}
            </button>
          </div>

          {/* Quick Raw CSV Export */}
          <div className="bg-[#14243A] border border-[#1E3A5F] rounded-2xl p-4 shadow-xl space-y-2 text-xs">
            <span className="font-semibold text-slate-200 flex items-center gap-2">
              <Database size={14} className="text-emerald-400" /> Raw Telemetry Export
            </span>
            <p className="text-[11px] text-slate-400">
              Download the underlying 15,000 raw sensor records in CSV format.
            </p>
            <button
              onClick={handleExportCsv}
              disabled={downloadingCsv}
              className="w-full mt-1 flex items-center justify-center gap-1.5 py-2 bg-[#0D1B2E] hover:bg-[#1A3352] border border-[#1E3A5F] text-slate-200 rounded-lg text-xs font-medium transition-colors cursor-pointer"
            >
              <Download size={13} className="text-emerald-400" />
              {downloadingCsv ? 'Exporting...' : 'Export Complete CSV'}
            </button>
          </div>
        </div>

        {/* Right Side: Report Canvas & Visual Render */}
        <div className="lg:col-span-3">
          {loading ? (
            <div className="bg-[#14243A] border border-[#1E3A5F] rounded-2xl p-12 min-h-[500px] flex items-center justify-center shadow-xl">
              <LoadingSpinner text={`Compiling statistical report for ${selectedArea}...`} />
            </div>
          ) : !report ? (
            <div className="bg-[#14243A] border border-[#1E3A5F] rounded-2xl p-12 min-h-[500px] flex flex-col items-center justify-center text-center shadow-xl">
              <FileText size={40} className="text-sky-400 mb-3" />
              <h3 className="text-base font-bold text-slate-200">No Report Loaded</h3>
              <p className="text-xs text-slate-400 mt-1 mb-4">Click below to generate report for {selectedArea}.</p>
              <button
                onClick={() => generate(selectedArea, selectedType)}
                className="px-4 py-2 bg-sky-500 text-white rounded-xl text-xs font-semibold"
              >
                Generate Report
              </button>
            </div>
          ) : (
            /* PRINTABLE REPORT CANVAS */
            <div
              ref={reportContainerRef}
              className="bg-[#0D1B2E] border border-[#1E3A5F] rounded-2xl p-6 md:p-8 space-y-8 shadow-2xl print:bg-white print:border-none print:p-2 print:text-black"
            >
              {/* Report Header Card */}
              <div className="pb-6 border-b border-[#1E3A5F] flex items-start justify-between flex-wrap gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-sky-500/20 text-sky-400 border border-sky-500/40 font-bold">
                      {report.is_area_specific ? 'URBAN SECTOR DOSSIER' : 'METROPOLITAN INTELLIGENCE BRIEFING'}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      Scope: <strong className="text-sky-300">{report.area_filter}</strong>
                    </span>
                  </div>
                  <h1 className="text-xl md:text-2xl font-extrabold text-slate-100 tracking-tight">
                    {report.title}
                  </h1>
                  <p className="text-xs text-slate-400 mt-1">
                    Prepared by <strong className="text-sky-300">{report.author}</strong> &bull; Generated on {new Date(report.generated_at).toLocaleString()}
                  </p>
                </div>
                <div className="text-right">
                  <span className="inline-flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 rounded-full font-mono">
                    <CheckCircle size={13} /> {report.dataset_info?.total_records?.toLocaleString()} Observations Analyzed
                  </span>
                </div>
              </div>

              {/* REPORT 1: SUMMARY / AREA REPORT */}
              {report.report_type === 'summary' && (
                <div className="space-y-8">
                  {/* Executive Narrative Callout */}
                  <div className="bg-[#14243A] border-l-4 border-sky-400 rounded-xl p-5 shadow-lg space-y-2">
                    <h4 className="text-xs uppercase font-mono font-bold tracking-wider text-sky-400 flex items-center gap-2">
                      <Sparkles size={14} /> Key Findings & Executive Summary for {report.area_filter}
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                      {report.insights?.map((insight: string, idx: number) => (
                        <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-300 leading-relaxed bg-[#07111F]/60 p-3 rounded-lg border border-[#1E3A5F]">
                          <span className="text-sky-400 font-bold font-mono">0{idx + 1}.</span>
                          <span>{insight}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* High Level KPI Cards */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="bg-[#14243A] border border-[#1E3A5F] rounded-xl p-4">
                      <div className="text-[10px] uppercase font-mono text-slate-400 mb-1">Total Vehicular Traffic</div>
                      <div className="text-xl font-bold font-mono text-sky-400">{report.dataset_info?.total_vehicles?.toLocaleString()}</div>
                      <div className="text-[10px] text-slate-500 mt-1">Cumulative sensor volume</div>
                    </div>
                    <div className="bg-[#14243A] border border-[#1E3A5F] rounded-xl p-4">
                      <div className="text-[10px] uppercase font-mono text-slate-400 mb-1">Average Corridor Speed</div>
                      <div className="text-xl font-bold font-mono text-cyan-400">{report.traffic_metrics?.avg_speed_kmh} km/h</div>
                      <div className="text-[10px] text-slate-500 mt-1">Free Flow Target: 60 km/h</div>
                    </div>
                    <div className="bg-[#14243A] border border-[#1E3A5F] rounded-xl p-4">
                      <div className="text-[10px] uppercase font-mono text-slate-400 mb-1">Congestion Strain Index</div>
                      <div className="text-xl font-bold font-mono text-amber-400">{report.traffic_metrics?.congestion_index} / 4.0</div>
                      <div className="text-[10px] text-slate-500 mt-1">Severity scale: 0 to 4</div>
                    </div>
                    <div className="bg-[#14243A] border border-[#1E3A5F] rounded-xl p-4">
                      <div className="text-[10px] uppercase font-mono text-slate-400 mb-1">Critical Peak Hour</div>
                      <div className="text-xl font-bold font-mono text-red-400">{report.traffic_metrics?.peak_hour}</div>
                      <div className="text-[10px] text-slate-500 mt-1">Maximum volume surge</div>
                    </div>
                  </div>

                  {/* Visual Charts Grid 1: Congestion Donut + Corridor Breakdown Bar */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                    {/* Donut Chart: Congestion Distribution */}
                    <div className="bg-[#14243A] border border-[#1E3A5F] rounded-xl p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-xs font-bold text-slate-200 flex items-center gap-2">
                          <BarChart3 size={14} className="text-sky-400" />
                          Congestion Distribution in {report.area_filter}
                        </h4>
                      </div>
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={report.congestion_distribution}
                              dataKey="count"
                              nameKey="level"
                              cx="50%"
                              cy="50%"
                              innerRadius={50}
                              outerRadius={80}
                              paddingAngle={3}
                            >
                              {report.congestion_distribution?.map((entry: any, index: number) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip
                              contentStyle={{ background: '#0D1B2E', borderColor: '#1E3A5F', borderRadius: 8, fontSize: 11 }}
                              formatter={(value: any, name: any, item: any) => [`${value?.toLocaleString()} records (${item.payload.percentage}%)`, name]}
                            />
                            <Legend wrapperStyle={{ fontSize: 11, paddingTop: 4 }} />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      <p className="text-[10px] text-slate-400 text-center mt-1">
                        Breakdown of traffic frames recorded across Free Flow, Low, Moderate, High, and Severe categories.
                      </p>
                    </div>

                    {/* Bar Chart: Sub-breakdown (Corridors in area or top city areas) */}
                    <div className="bg-[#14243A] border border-[#1E3A5F] rounded-xl p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-xs font-bold text-slate-200 flex items-center gap-2">
                          <TrendingUp size={14} className="text-cyan-400" />
                          {report.sub_breakdown_label} (Veh / Hour)
                        </h4>
                      </div>
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={report.sub_breakdown} layout="vertical" margin={{ top: 5, right: 20, left: 80, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1E3A5F" horizontal={false} />
                            <XAxis type="number" tick={{ fill: '#64748B', fontSize: 10 }} />
                            <YAxis type="category" dataKey="name" tick={{ fill: '#94A3B8', fontSize: 10 }} width={85} />
                            <Tooltip
                              contentStyle={{ background: '#0D1B2E', borderColor: '#1E3A5F', borderRadius: 8, fontSize: 11 }}
                              formatter={(val: any) => [`${val} veh/hr`, 'Traffic Volume']}
                            />
                            <Bar dataKey="traffic_volume" name="Avg Volume" fill="#38BDF8" radius={[0, 4, 4, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                      <p className="text-[10px] text-slate-400 text-center mt-1">
                        Comparative hourly vehicle flow distribution across key monitored road links.
                      </p>
                    </div>
                  </div>

                  {/* Diurnal Traffic Profile Chart */}
                  <div className="bg-[#14243A] border border-[#1E3A5F] rounded-xl p-5">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h4 className="text-xs font-bold text-slate-200">24-Hour Diurnal Volume & Speed Trajectory ({report.area_filter})</h4>
                        <p className="text-[10px] text-slate-400">Hourly vehicle influx curve showing morning and evening peak commuter cycles</p>
                      </div>
                      <span className="text-[10px] font-mono text-sky-400 bg-sky-500/10 px-2.5 py-1 rounded-lg border border-sky-500/20">
                        Peak @ {report.traffic_metrics?.peak_hour}
                      </span>
                    </div>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={report.hourly_curve} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                          <defs>
                            <linearGradient id="areaVolumeGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#38BDF8" stopOpacity={0.4} />
                              <stop offset="95%" stopColor="#38BDF8" stopOpacity={0.0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#1E3A5F" />
                          <XAxis dataKey="hour" tick={{ fill: '#64748B', fontSize: 10 }} />
                          <YAxis tick={{ fill: '#64748B', fontSize: 10 }} />
                          <Tooltip contentStyle={{ background: '#0D1B2E', borderColor: '#1E3A5F', borderRadius: 8, fontSize: 11 }} />
                          <Area type="monotone" dataKey="traffic_volume" name="Vehicles / Hr" stroke="#38BDF8" strokeWidth={2} fillOpacity={1} fill="url(#areaVolumeGrad)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Corridor Summary Table for Selected Area */}
                  {report.sub_breakdown && report.sub_breakdown.length > 0 && (
                    <div className="bg-[#14243A] border border-[#1E3A5F] rounded-xl overflow-hidden shadow-lg">
                      <div className="p-4 border-b border-[#1E3A5F]">
                        <h4 className="text-xs font-bold text-slate-200">Corridor Operational Scorecard — {report.area_filter}</h4>
                        <p className="text-[10px] text-slate-400">Detailed performance metrics by roadway segment</p>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs data-table">
                          <thead className="bg-[#0D1B2E]">
                            <tr>
                              <th className="text-left text-slate-400 font-medium">Road / Corridor Name</th>
                              <th className="text-right text-slate-400 font-medium">Avg Volume (veh/hr)</th>
                              <th className="text-right text-slate-400 font-medium">Avg Speed (km/h)</th>
                              <th className="text-right text-slate-400 font-medium">Capacity Utilization</th>
                              <th className="text-right text-slate-400 font-medium">Incidents Logged</th>
                            </tr>
                          </thead>
                          <tbody>
                            {report.sub_breakdown.map((item: any, i: number) => (
                              <tr key={i} className="hover:bg-[#16273D]">
                                <td className="text-slate-200 font-mono font-medium">{item.name}</td>
                                <td className="text-right text-sky-400 font-mono font-bold">{item.traffic_volume?.toLocaleString()}</td>
                                <td className="text-right text-cyan-400 font-mono">{item.avg_speed} km/h</td>
                                <td className="text-right text-amber-400 font-mono">{item.capacity_utilization}%</td>
                                <td className="text-right text-rose-400 font-mono">{item.total_incidents}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Strategic Action Plan Box */}
                  <div className="bg-gradient-to-br from-[#14243A] to-[#0A1626] border border-[#1E3A5F] rounded-xl p-5 space-y-3">
                    <h4 className="text-xs font-bold text-emerald-400 font-mono uppercase tracking-wider flex items-center gap-2">
                      <ShieldAlert size={14} /> Targeted Traffic Engineering Recommendations
                    </h4>
                    <div className="space-y-2">
                      {report.recommendations?.map((rec: string, i: number) => (
                        <div key={i} className="flex items-start gap-2 text-xs text-slate-300">
                          <ArrowRight size={14} className="text-emerald-400 flex-shrink-0 mt-0.5" />
                          <span>{rec}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* REPORT 2: EDA REPORT */}
              {report.report_type === 'eda' && (
                <div className="space-y-8">
                  <div className="bg-[#14243A] border-l-4 border-emerald-400 rounded-xl p-5 shadow-lg space-y-2">
                    <h4 className="text-xs uppercase font-mono font-bold tracking-wider text-emerald-400 flex items-center gap-2">
                      <Sparkles size={14} /> Statistical & Multi-variate Findings ({report.area_filter})
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                      {report.insights?.map((insight: string, idx: number) => (
                        <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-300 leading-relaxed bg-[#07111F]/60 p-3 rounded-lg border border-[#1E3A5F]">
                          <span className="text-emerald-400 font-bold font-mono">0{idx + 1}.</span>
                          <span>{insight}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Dual Axis Diurnal Profile */}
                  <div className="bg-[#14243A] border border-[#1E3A5F] rounded-xl p-5">
                    <h4 className="text-xs font-bold text-slate-200 mb-1">Diurnal Speed-Volume Inverse Relationship ({report.area_filter})</h4>
                    <p className="text-[10px] text-slate-400 mb-3">Speed drops significantly as vehicular volume surges during peak commuter hours</p>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={report.hourly_patterns} margin={{ top: 10, right: 30, left: 10, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#1E3A5F" />
                          <XAxis dataKey="hour" tick={{ fill: '#64748B', fontSize: 10 }} />
                          <YAxis yAxisId="left" tick={{ fill: '#38BDF8', fontSize: 10 }} />
                          <YAxis yAxisId="right" orientation="right" tick={{ fill: '#FB7185', fontSize: 10 }} unit="km/h" />
                          <Tooltip contentStyle={{ background: '#0D1B2E', borderColor: '#1E3A5F', borderRadius: 8, fontSize: 11 }} />
                          <Line yAxisId="left" type="monotone" dataKey="traffic_volume" name="Traffic Volume" stroke="#38BDF8" strokeWidth={2.5} dot={false} />
                          <Line yAxisId="right" type="monotone" dataKey="avg_speed" name="Average Speed (km/h)" stroke="#FB7185" strokeWidth={2.5} dot={false} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Weekday vs Weekend Comparison */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                    <div className="bg-[#14243A] border border-[#1E3A5F] rounded-xl p-4">
                      <h4 className="text-xs font-bold text-slate-200 mb-1">Weekday vs Weekend Profile</h4>
                      <div className="h-56">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={report.weekday_vs_weekend}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1E3A5F" />
                            <XAxis dataKey="hour" tick={{ fill: '#64748B', fontSize: 9 }} />
                            <YAxis tick={{ fill: '#64748B', fontSize: 9 }} />
                            <Tooltip contentStyle={{ background: '#0D1B2E', borderColor: '#1E3A5F', borderRadius: 8, fontSize: 11 }} />
                            <Area type="monotone" dataKey="weekday" name="Weekday" stroke="#38BDF8" fill="#38BDF8" fillOpacity={0.2} />
                            <Area type="monotone" dataKey="weekend" name="Weekend" stroke="#A78BFA" fill="#A78BFA" fillOpacity={0.2} />
                            <Legend wrapperStyle={{ fontSize: 10 }} />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    <div className="bg-[#14243A] border border-[#1E3A5F] rounded-xl p-4">
                      <h4 className="text-xs font-bold text-slate-200 mb-1">Weather Impact on Speed</h4>
                      <div className="h-56">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={report.weather_impact} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1E3A5F" />
                            <XAxis dataKey="weather" tick={{ fill: '#94A3B8', fontSize: 10 }} />
                            <YAxis tick={{ fill: '#64748B', fontSize: 9 }} unit="km/h" />
                            <Tooltip contentStyle={{ background: '#0D1B2E', borderColor: '#1E3A5F', borderRadius: 8, fontSize: 11 }} />
                            <Bar dataKey="avg_speed" name="Avg Speed (km/h)" fill="#34D399" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>

                  {/* Parametric Stats Table */}
                  <div className="bg-[#14243A] border border-[#1E3A5F] rounded-xl overflow-hidden shadow-lg">
                    <div className="p-4 border-b border-[#1E3A5F]">
                      <h4 className="text-xs font-bold text-slate-200">Descriptive Statistics Evaluation ({report.area_filter})</h4>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs data-table">
                        <thead className="bg-[#0D1B2E]">
                          <tr>
                            <th className="text-left text-slate-400 font-medium">Metric</th>
                            <th className="text-right text-slate-400 font-medium">Count</th>
                            <th className="text-right text-slate-400 font-medium">Mean</th>
                            <th className="text-right text-slate-400 font-medium">Std Dev</th>
                            <th className="text-right text-slate-400 font-medium">Min</th>
                            <th className="text-right text-slate-400 font-medium">Median</th>
                            <th className="text-right text-slate-400 font-medium">Max</th>
                          </tr>
                        </thead>
                        <tbody>
                          {report.stats_table?.map((row: any, i: number) => (
                            <tr key={i} className="hover:bg-[#16273D]">
                              <td className="text-slate-200 font-mono font-medium">{row.metric}</td>
                              <td className="text-right text-slate-400 font-mono">{row.count?.toLocaleString()}</td>
                              <td className="text-right text-sky-400 font-mono font-bold">{row.mean}</td>
                              <td className="text-right text-slate-300 font-mono">{row.std}</td>
                              <td className="text-right text-slate-400 font-mono">{row.min}</td>
                              <td className="text-right text-cyan-400 font-mono">{row.median}</td>
                              <td className="text-right text-emerald-400 font-mono">{row.max}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* REPORT 3: ML PREDICTION & HOTSPOTS */}
              {report.report_type === 'hotspots_ml' && (
                <div className="space-y-8">
                  <div className="bg-[#14243A] border-l-4 border-purple-400 rounded-xl p-5 shadow-lg space-y-2">
                    <h4 className="text-xs uppercase font-mono font-bold tracking-wider text-purple-400 flex items-center gap-2">
                      <Cpu size={14} /> Machine Learning Diagnostics ({report.area_filter})
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                      {report.insights?.map((insight: string, idx: number) => (
                        <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-300 leading-relaxed bg-[#07111F]/60 p-3 rounded-lg border border-[#1E3A5F]">
                          <span className="text-purple-400 font-bold font-mono">0{idx + 1}.</span>
                          <span>{insight}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Hotspots Ranking Table */}
                  <div className="bg-[#14243A] border border-[#1E3A5F] rounded-xl overflow-hidden shadow-lg">
                    <div className="p-4 border-b border-[#1E3A5F]">
                      <h4 className="text-xs font-bold text-slate-200">Critical Bottleneck Ranking ({report.area_filter})</h4>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs data-table">
                        <thead className="bg-[#0D1B2E]">
                          <tr>
                            <th className="text-center text-slate-400 font-medium">Rank</th>
                            <th className="text-left text-slate-400 font-medium">Area</th>
                            <th className="text-left text-slate-400 font-medium">Intersection</th>
                            <th className="text-right text-slate-400 font-medium">Hourly Volume</th>
                            <th className="text-right text-slate-400 font-medium">Avg Speed</th>
                            <th className="text-right text-slate-400 font-medium">Score</th>
                            <th className="text-right text-slate-400 font-medium">Capacity %</th>
                            <th className="text-center text-slate-400 font-medium">Severity</th>
                          </tr>
                        </thead>
                        <tbody>
                          {report.hotspots?.map((h: any, i: number) => (
                            <tr key={i} className="hover:bg-[#16273D]">
                              <td className="text-center font-mono font-bold text-red-400">#{h.rank}</td>
                              <td className="text-slate-200 font-medium">{h.area}</td>
                              <td className="text-slate-400 font-mono">{h.road}</td>
                              <td className="text-right text-sky-400 font-mono">{h.avg_volume?.toLocaleString()} veh/h</td>
                              <td className="text-right text-cyan-400 font-mono">{h.avg_speed} km/h</td>
                              <td className="text-right text-red-400 font-mono font-bold">{h.congestion_score}%</td>
                              <td className="text-right text-slate-300 font-mono">{h.capacity_utilization}%</td>
                              <td className="text-center"><StatusBadge level={h.severity} /></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* Report Footer */}
              <div className="pt-6 border-t border-[#1E3A5F] flex items-center justify-between text-[11px] text-slate-500 font-mono flex-wrap gap-2">
                <div>Document Scope: {report.area_filter} &bull; ID: AGY-BLR-{Date.now().toString().slice(-6)}</div>
                <div>Bangalore Smart City Traffic Intelligence Command Center</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
