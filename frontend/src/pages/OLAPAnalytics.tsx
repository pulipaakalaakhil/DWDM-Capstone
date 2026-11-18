import React, { useState } from 'react';
import { Play, BarChart3 } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { olapApi } from '../api/client';
import LoadingSpinner from '../components/ui/LoadingSpinner';

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#0D1B2E] border border-[#1E3A5F] rounded-lg p-2 text-xs shadow-xl">
      <div className="text-slate-400 mb-1">{label}</div>
      {payload.map((p: any, i: number) => <div key={i} className="text-slate-300">{p.name}: <span className="text-white font-medium">{typeof p.value === 'number' ? p.value.toLocaleString() : p.value}</span></div>)}
    </div>
  );
};

const measures = ['Traffic Volume', 'Average Speed (km/h)', 'Road Capacity Utilization (%)'];
const rowDims = ['Area Name', 'Weather Conditions', 'Congestion Level'];
const colDims = ['Congestion Level', 'Weather Conditions'];

export default function OLAPAnalytics() {
  const [activeOp, setActiveOp] = useState<'rollup' | 'drilldown' | 'slice' | 'dice' | 'pivot'>('rollup');
  const [measure, setMeasure] = useState(measures[0]);
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [params, setParams] = useState({ rollupLevel: 'hourly', area: '', sliceDim: 'hour', sliceVal: '8', hourStart: 7, hourEnd: 20, rowDim: rowDims[0], colDim: colDims[0] });

  const run = async () => {
    setLoading(true);
    setResult(null);
    try {
      let res;
      if (activeOp === 'rollup') res = await olapApi.rollup(params.rollupLevel, measure);
      else if (activeOp === 'drilldown') res = await olapApi.drilldown(params.area || undefined, undefined, measure);
      else if (activeOp === 'slice') res = await olapApi.slice(params.sliceDim, params.sliceVal, measure);
      else if (activeOp === 'dice') res = await olapApi.dice({ area: params.area || undefined, hour_start: params.hourStart, hour_end: params.hourEnd, measure });
      else res = await olapApi.pivot(params.rowDim, params.colDim, measure, 'mean');
      if (res?.data?.success) setResult(res.data);
    } catch {}
    setLoading(false);
  };

  const data = result?.data || [];
  const pivotCols = result?.columns || [];

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-bold text-slate-100">OLAP Analytics Workspace</h2>
        <p className="text-xs text-slate-500 mt-0.5">Multidimensional analysis using Roll-Up, Drill-Down, Slice, Dice, and Pivot operations</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Controls */}
        <div className="bg-[#14243A] border border-[#1E3A5F] rounded-xl p-4 space-y-4">
          <h3 className="text-sm font-semibold text-slate-200">Operation</h3>
          <div className="space-y-1">
            {[['rollup','📊 Roll-Up'], ['drilldown','🔍 Drill-Down'], ['slice','✂️ Slice'], ['dice','🎲 Dice'], ['pivot','🔄 Pivot']].map(([op, label]) => (
              <button key={op} onClick={() => { setActiveOp(op as any); setResult(null); }}
                className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-colors ${activeOp === op ? 'bg-sky-500/20 text-sky-400' : 'text-slate-400 hover:bg-[#1E3A5F] hover:text-slate-200'}`}>
                {label}
              </button>
            ))}
          </div>

          <div className="border-t border-[#1E3A5F] pt-3 space-y-3">
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Measure</label>
              <select value={measure} onChange={e => setMeasure(e.target.value)} className="w-full bg-[#07111F] border border-[#1E3A5F] text-xs text-slate-300 rounded-lg px-2 py-1.5 outline-none">
                {measures.map(m => <option key={m}>{m}</option>)}
              </select>
            </div>

            {activeOp === 'rollup' && (
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Level</label>
                <select value={params.rollupLevel} onChange={e => setParams(p => ({ ...p, rollupLevel: e.target.value }))} className="w-full bg-[#07111F] border border-[#1E3A5F] text-xs text-slate-300 rounded-lg px-2 py-1.5 outline-none">
                  <option value="hourly">Hourly</option>
                  <option value="daily">Daily</option>
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </div>
            )}

            {(activeOp === 'drilldown' || activeOp === 'dice') && (
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Area</label>
                <input value={params.area} onChange={e => setParams(p => ({ ...p, area: e.target.value }))} placeholder="e.g. Koramangala" className="w-full bg-[#07111F] border border-[#1E3A5F] text-xs text-slate-300 rounded-lg px-2 py-1.5 outline-none" />
              </div>
            )}

            {activeOp === 'slice' && <>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Dimension</label>
                <select value={params.sliceDim} onChange={e => setParams(p => ({ ...p, sliceDim: e.target.value }))} className="w-full bg-[#07111F] border border-[#1E3A5F] text-xs text-slate-300 rounded-lg px-2 py-1.5 outline-none">
                  <option value="hour">Hour</option>
                  <option value="day">Day</option>
                  <option value="month">Month</option>
                  <option value="congestion">Congestion</option>
                  <option value="area">Area</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Value</label>
                <input value={params.sliceVal} onChange={e => setParams(p => ({ ...p, sliceVal: e.target.value }))} placeholder="e.g. 8" className="w-full bg-[#07111F] border border-[#1E3A5F] text-xs text-slate-300 rounded-lg px-2 py-1.5 outline-none" />
              </div>
            </>}

            {activeOp === 'dice' && (
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Hour From</label>
                  <input type="number" value={params.hourStart} onChange={e => setParams(p => ({ ...p, hourStart: +e.target.value }))} className="w-full bg-[#07111F] border border-[#1E3A5F] text-xs text-slate-300 rounded-lg px-2 py-1.5 outline-none" />
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Hour To</label>
                  <input type="number" value={params.hourEnd} onChange={e => setParams(p => ({ ...p, hourEnd: +e.target.value }))} className="w-full bg-[#07111F] border border-[#1E3A5F] text-xs text-slate-300 rounded-lg px-2 py-1.5 outline-none" />
                </div>
              </div>
            )}

            {activeOp === 'pivot' && <>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Row Dimension</label>
                <select value={params.rowDim} onChange={e => setParams(p => ({ ...p, rowDim: e.target.value }))} className="w-full bg-[#07111F] border border-[#1E3A5F] text-xs text-slate-300 rounded-lg px-2 py-1.5 outline-none">
                  {rowDims.map(d => <option key={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Column Dimension</label>
                <select value={params.colDim} onChange={e => setParams(p => ({ ...p, colDim: e.target.value }))} className="w-full bg-[#07111F] border border-[#1E3A5F] text-xs text-slate-300 rounded-lg px-2 py-1.5 outline-none">
                  {colDims.map(d => <option key={d}>{d}</option>)}
                </select>
              </div>
            </>}

            <button onClick={run} disabled={loading} className="w-full flex items-center justify-center gap-2 bg-sky-500/15 hover:bg-sky-500/25 border border-sky-500/40 text-sky-400 text-sm font-medium px-4 py-2.5 rounded-lg transition-colors disabled:opacity-50">
              <Play size={14} /> {loading ? 'Running...' : 'Execute'}
            </button>
          </div>
        </div>

        {/* Results */}
        <div className="lg:col-span-3 space-y-4">
          {loading ? <LoadingSpinner fullPage text={`Running ${activeOp}...`} /> : !result ? (
            <div className="bg-[#14243A] border border-[#1E3A5F] rounded-xl flex items-center justify-center h-64">
              <div className="text-center text-slate-600">
                <BarChart3 size={36} className="mx-auto mb-2" />
                <p className="text-sm">Select operation, set parameters, and click Execute</p>
              </div>
            </div>
          ) : (
            <>
              <div className="bg-[#14243A] border border-[#1E3A5F] rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-slate-200">
                    <span className="text-sky-400">{result.operation}</span> — {result.measure || measure}
                  </h3>
                  {result.records !== undefined && <span className="text-xs text-slate-500">{result.records?.toLocaleString()} records</span>}
                  {result.records_in_slice !== undefined && <span className="text-xs text-slate-500">{result.records_in_slice?.toLocaleString()} records in slice</span>}
                </div>

                {activeOp === 'pivot' ? (
                  <div className="overflow-x-auto">
                    <table className="text-xs data-table w-full">
                      <thead><tr>
                        <th className="text-slate-400 text-left font-medium">{result.row_dimension}</th>
                        {pivotCols.map((c: string) => <th key={c} className="text-slate-400 font-medium text-right">{c}</th>)}
                      </tr></thead>
                      <tbody>
                        {data.map((row: any, i: number) => (
                          <tr key={i}>
                            <td className="text-slate-300 font-medium">{row.dimension}</td>
                            {pivotCols.map((c: string) => <td key={c} className="text-right text-sky-400">{Math.round(row[c] || 0).toLocaleString()}</td>)}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1E3A5F" />
                        <XAxis dataKey={data[0]?.period !== undefined ? 'period' : data[0]?.area !== undefined ? 'area' : data[0]?.label !== undefined ? 'label' : 'hour'} tick={{ fill: '#64748B', fontSize: 10 }} angle={-20} textAnchor="end" interval={0} />
                        <YAxis tick={{ fill: '#64748B', fontSize: 10 }} />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="avg" name="Average" fill="#38BDF8" radius={[3, 3, 0, 0]} />
                        {data[0]?.sum !== undefined && <Bar dataKey="count" name="Record Count" fill="#22D3EE" radius={[3, 3, 0, 0]} />}
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>

              {/* Table view */}
              <div className="bg-[#14243A] border border-[#1E3A5F] rounded-xl overflow-hidden">
                <div className="p-3 border-b border-[#1E3A5F]"><h3 className="text-xs font-semibold text-slate-300">Tabular Results</h3></div>
                <div className="overflow-x-auto max-h-64 overflow-y-auto">
                  <table className="w-full text-xs data-table">
                    <thead className="sticky top-0 bg-[#0D1B2E]">
                      <tr>{data[0] && Object.keys(data[0]).map(k => <th key={k} className="text-left text-slate-400 font-medium whitespace-nowrap">{k}</th>)}</tr>
                    </thead>
                    <tbody>
                      {data.map((row: any, i: number) => (
                        <tr key={i}>
                          {Object.values(row).map((v: any, j: number) => (
                            <td key={j} className="text-slate-300 whitespace-nowrap">{typeof v === 'number' ? v.toLocaleString() : String(v)}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
