import React, { useEffect, useState } from 'react';
import { Database, Search, Download, ChevronLeft, ChevronRight, BarChart2, AlertCircle } from 'lucide-react';
import { datasetApi } from '../api/client';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import StatusBadge from '../components/ui/StatusBadge';
import { useApp } from '../contexts/AppContext';

export default function DataExploration() {
  const { summary, filterOptions } = useApp();
  const [tab, setTab] = useState<'preview' | 'columns' | 'stats'>('preview');
  const [rows, setRows] = useState<any[]>([]);
  const [columns, setColumns] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [areaFilter, setAreaFilter] = useState('');
  const [congestionFilter, setCongestionFilter] = useState('');
  const PAGE_SIZE = 50;

  const fetchPreview = async () => {
    setLoading(true);
    try {
      const res = await datasetApi.getPreview(page, PAGE_SIZE, search || undefined, areaFilter || undefined, congestionFilter || undefined);
      if (res.data.success) {
        setRows(res.data.data || []);
        setTotal(res.data.total || 0);
        setTotalPages(res.data.total_pages || 1);
      }
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const fetchColumns = async () => {
    setLoading(true);
    try {
      const res = await datasetApi.getColumns();
      if (res.data.success) setColumns(res.data.columns || []);
    } catch {}
    setLoading(false);
  };

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await datasetApi.getStatistics();
      if (res.data.success) setStats(res.data.statistics || {});
    } catch {}
    setLoading(false);
  };

  useEffect(() => { if (tab === 'preview') fetchPreview(); }, [tab, page, areaFilter, congestionFilter]);
  useEffect(() => { if (tab === 'columns') fetchColumns(); }, [tab]);
  useEffect(() => { if (tab === 'stats') fetchStats(); }, [tab]);

  const colNames = rows.length > 0 ? Object.keys(rows[0]).filter(k => k !== 'datetime').slice(0, 12) : [];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-100">Data Exploration</h2>
          <p className="text-xs text-slate-500 mt-0.5">Browse, search, and analyze the Bangalore traffic dataset</p>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total Records', value: summary?.total_records?.toLocaleString() || '—', color: 'text-sky-400' },
          { label: 'Columns', value: summary ? '18' : '—', color: 'text-cyan-400' },
          { label: 'Missing Values', value: summary?.missing_values?.toLocaleString() || '0', color: 'text-yellow-400' },
          { label: 'Duplicate Records', value: summary?.duplicate_records?.toLocaleString() || '0', color: 'text-red-400' },
        ].map(card => (
          <div key={card.label} className="bg-[#14243A] border border-[#1E3A5F] rounded-xl p-4">
            <div className={`text-xl font-bold mb-1 ${card.color}`}>{card.value}</div>
            <div className="text-xs text-slate-500">{card.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-[#14243A] border border-[#1E3A5F] rounded-xl p-1 w-fit">
        {[['preview', 'Data Preview'], ['columns', 'Column Info'], ['stats', 'Statistics']].map(([key, label]) => (
          <button key={key} onClick={() => setTab(key as any)}
            className={`px-4 py-1.5 text-xs font-medium rounded-lg transition-colors ${tab === key ? 'bg-sky-500/20 text-sky-400' : 'text-slate-400 hover:text-slate-200'}`}>
            {label}
          </button>
        ))}
      </div>

      {/* Preview Tab */}
      {tab === 'preview' && (
        <div className="bg-[#14243A] border border-[#1E3A5F] rounded-xl overflow-hidden">
          <div className="p-4 border-b border-[#1E3A5F] flex items-center gap-3 flex-wrap">
            <div className="flex items-center bg-[#07111F] border border-[#1E3A5F] rounded-lg px-3 py-1.5 gap-2 flex-1 min-w-48">
              <Search size={13} className="text-slate-500" />
              <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} onKeyDown={e => e.key === 'Enter' && fetchPreview()} type="text" placeholder="Search all columns..." className="bg-transparent text-xs text-slate-300 placeholder-slate-600 outline-none flex-1" />
            </div>
            <select value={areaFilter} onChange={e => { setAreaFilter(e.target.value); setPage(1); }} className="bg-[#07111F] border border-[#1E3A5F] text-xs text-slate-300 rounded-lg px-2.5 py-1.5 outline-none">
              <option value="">All Areas</option>
              {filterOptions.areas.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
            <select value={congestionFilter} onChange={e => { setCongestionFilter(e.target.value); setPage(1); }} className="bg-[#07111F] border border-[#1E3A5F] text-xs text-slate-300 rounded-lg px-2.5 py-1.5 outline-none">
              <option value="">All Congestion</option>
              {filterOptions.congestion_levels.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <span className="text-xs text-slate-500">{total.toLocaleString()} records</span>
          </div>

          {loading ? <LoadingSpinner fullPage /> : (
            <div className="overflow-x-auto max-h-[480px] overflow-y-auto">
              <table className="w-full text-xs data-table min-w-max">
                <thead className="sticky top-0 bg-[#0D1B2E] z-10">
                  <tr>{colNames.map(c => <th key={c} className="text-left text-slate-400 font-medium whitespace-nowrap">{c}</th>)}</tr>
                </thead>
                <tbody>
                  {rows.map((row, i) => (
                    <tr key={i}>
                      {colNames.map(c => (
                        <td key={c} className="whitespace-nowrap text-slate-300">
                          {c === 'Congestion Level' ? <StatusBadge level={String(row[c] || '')} /> : String(row[c] ?? '—').slice(0, 30)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          <div className="flex items-center justify-between p-4 border-t border-[#1E3A5F]">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="flex items-center gap-1 px-3 py-1.5 bg-[#1E3A5F] rounded-lg text-xs text-slate-300 disabled:opacity-40 hover:bg-[#2D5A8A] transition-colors">
              <ChevronLeft size={13} /> Prev
            </button>
            <span className="text-xs text-slate-500">Page {page} of {totalPages}</span>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="flex items-center gap-1 px-3 py-1.5 bg-[#1E3A5F] rounded-lg text-xs text-slate-300 disabled:opacity-40 hover:bg-[#2D5A8A] transition-colors">
              Next <ChevronRight size={13} />
            </button>
          </div>
        </div>
      )}

      {/* Columns Tab */}
      {tab === 'columns' && (
        <div className="bg-[#14243A] border border-[#1E3A5F] rounded-xl overflow-hidden">
          {loading ? <LoadingSpinner fullPage /> : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs data-table">
                <thead><tr>
                  <th className="text-left text-slate-400 font-medium">Column Name</th>
                  <th className="text-left text-slate-400 font-medium">Data Type</th>
                  <th className="text-right text-slate-400 font-medium">Non-Null</th>
                  <th className="text-right text-slate-400 font-medium">Unique</th>
                  <th className="text-right text-slate-400 font-medium">Missing</th>
                  <th className="text-right text-slate-400 font-medium">Missing %</th>
                  <th className="text-left text-slate-400 font-medium">Sample Values</th>
                </tr></thead>
                <tbody>
                  {columns.map((col: any, i: number) => (
                    <tr key={i}>
                      <td className="text-sky-400 font-medium font-mono">{col.name}</td>
                      <td><span className="bg-sky-500/10 text-sky-400 px-2 py-0.5 rounded text-[10px] font-mono">{col.dtype}</span></td>
                      <td className="text-right text-slate-300">{col.non_null?.toLocaleString()}</td>
                      <td className="text-right text-slate-300">{col.unique?.toLocaleString()}</td>
                      <td className="text-right text-yellow-400">{col.missing}</td>
                      <td className="text-right text-slate-400">{col.missing_pct?.toFixed(2)}%</td>
                      <td className="text-slate-500 max-w-48 truncate">{(col.sample || []).slice(0, 3).join(', ')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Statistics Tab */}
      {tab === 'stats' && (
        <div className="bg-[#14243A] border border-[#1E3A5F] rounded-xl overflow-hidden">
          {loading ? <LoadingSpinner fullPage /> : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs data-table">
                <thead><tr>
                  <th className="text-left text-slate-400 font-medium">Column</th>
                  <th className="text-right text-slate-400 font-medium">Count</th>
                  <th className="text-right text-slate-400 font-medium">Mean</th>
                  <th className="text-right text-slate-400 font-medium">Std</th>
                  <th className="text-right text-slate-400 font-medium">Min</th>
                  <th className="text-right text-slate-400 font-medium">Q25</th>
                  <th className="text-right text-slate-400 font-medium">Median</th>
                  <th className="text-right text-slate-400 font-medium">Q75</th>
                  <th className="text-right text-slate-400 font-medium">Max</th>
                </tr></thead>
                <tbody>
                  {Object.entries(stats).map(([col, s]: any) => (
                    <tr key={col}>
                      <td className="text-sky-400 font-medium font-mono">{col}</td>
                      <td className="text-right text-slate-300">{s.count?.toLocaleString()}</td>
                      <td className="text-right text-slate-300">{s.mean}</td>
                      <td className="text-right text-slate-400">{s.std}</td>
                      <td className="text-right text-slate-400">{s.min}</td>
                      <td className="text-right text-slate-400">{s.q25}</td>
                      <td className="text-right font-medium text-slate-200">{s.median}</td>
                      <td className="text-right text-slate-400">{s.q75}</td>
                      <td className="text-right text-slate-400">{s.max}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
