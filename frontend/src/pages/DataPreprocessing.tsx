import React, { useEffect, useState } from 'react';
import { Settings2, Play, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { preprocessingApi } from '../api/client';
import LoadingSpinner from '../components/ui/LoadingSpinner';

const steps = [
  'Missing Value Detection', 'Duplicate Removal', 'Outlier Detection',
  'Missing Value Imputation', 'Outlier Capping (IQR)', 'Feature Engineering',
  'Congestion Encoding', 'Data Validation'
];

export default function DataPreprocessing() {
  const [status, setStatus] = useState<any>(null);
  const [outliers, setOutliers] = useState<any>({});
  const [result, setResult] = useState<any>(null);
  const [running, setRunning] = useState(false);
  const [loading, setLoading] = useState(true);
  const [options, setOptions] = useState({ missing_strategy: 'median', handle_outliers: true, normalize: false });
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  useEffect(() => {
    const fetch = async () => {
      try {
        const [sRes, oRes] = await Promise.all([preprocessingApi.getStatus(), preprocessingApi.getOutliers()]);
        if (sRes.data.success !== false) setStatus(sRes.data);
        if (oRes.data.success) setOutliers(oRes.data.outliers || {});
      } catch {}
      setLoading(false);
    };
    fetch();
  }, []);

  const runPreprocessing = async () => {
    setRunning(true);
    setCompletedSteps([]);
    setResult(null);
    try {
      for (let i = 0; i < steps.length; i++) {
        await new Promise(r => setTimeout(r, 300));
        setCompletedSteps(prev => [...prev, i]);
      }
      const res = await preprocessingApi.run(options);
      if (res.data.success) setResult(res.data);
    } catch (e: any) {
      console.error(e);
    }
    setRunning(false);
  };

  const outlierChartData = Object.entries(outliers).map(([col, data]: any) => ({
    column: col.replace(' (%)', '%').replace('Average Speed (km/h)', 'Avg Speed').slice(0, 15),
    outliers: data.n_outliers,
    pct: data.pct
  }));

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-bold text-slate-100">Data Preprocessing Pipeline</h2>
        <p className="text-xs text-slate-500 mt-0.5">Clean, transform, and prepare the traffic dataset for analysis</p>
      </div>

      {loading ? <LoadingSpinner fullPage /> : (
        <>
          {/* Status Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-[#14243A] border border-[#1E3A5F] rounded-xl p-4">
              <div className="text-xl font-bold text-sky-400">{status?.total_records?.toLocaleString() || '—'}</div>
              <div className="text-xs text-slate-500 mt-1">Total Records</div>
            </div>
            <div className="bg-[#14243A] border border-yellow-500/20 rounded-xl p-4">
              <div className="text-xl font-bold text-yellow-400">{status?.missing_values || 0}</div>
              <div className="text-xs text-slate-500 mt-1">Missing Values</div>
            </div>
            <div className="bg-[#14243A] border border-orange-500/20 rounded-xl p-4">
              <div className="text-xl font-bold text-orange-400">{status?.duplicate_records || 0}</div>
              <div className="text-xs text-slate-500 mt-1">Duplicate Records</div>
            </div>
            <div className="bg-[#14243A] border border-[#1E3A5F] rounded-xl p-4">
              <div className="text-xl font-bold text-slate-300">{status?.numeric_columns?.length || 0}</div>
              <div className="text-xs text-slate-500 mt-1">Numeric Columns</div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Config Panel */}
            <div className="bg-[#14243A] border border-[#1E3A5F] rounded-xl p-4 space-y-4">
              <h3 className="text-sm font-semibold text-slate-200">Configuration</h3>
              <div>
                <label className="text-xs text-slate-400 mb-1.5 block">Missing Value Strategy</label>
                <select value={options.missing_strategy} onChange={e => setOptions(o => ({ ...o, missing_strategy: e.target.value }))}
                  className="w-full bg-[#07111F] border border-[#1E3A5F] text-xs text-slate-300 rounded-lg px-3 py-2 outline-none">
                  <option value="median">Median Imputation</option>
                  <option value="mean">Mean Imputation</option>
                  <option value="zero">Zero Fill</option>
                </select>
              </div>
              <div className="flex items-center justify-between">
                <label className="text-xs text-slate-400">Outlier Handling (IQR)</label>
                <button onClick={() => setOptions(o => ({ ...o, handle_outliers: !o.handle_outliers }))}
                  className={`w-10 h-5 rounded-full transition-colors ${options.handle_outliers ? 'bg-sky-500' : 'bg-slate-600'} relative`}>
                  <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${options.handle_outliers ? 'translate-x-5' : 'translate-x-0.5'}`} />
                </button>
              </div>
              <div className="flex items-center justify-between">
                <label className="text-xs text-slate-400">Min-Max Normalization</label>
                <button onClick={() => setOptions(o => ({ ...o, normalize: !o.normalize }))}
                  className={`w-10 h-5 rounded-full transition-colors ${options.normalize ? 'bg-sky-500' : 'bg-slate-600'} relative`}>
                  <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${options.normalize ? 'translate-x-5' : 'translate-x-0.5'}`} />
                </button>
              </div>
              <button onClick={runPreprocessing} disabled={running}
                className="w-full flex items-center justify-center gap-2 bg-sky-500/15 hover:bg-sky-500/25 border border-sky-500/40 text-sky-400 text-sm font-medium px-4 py-2.5 rounded-lg transition-colors disabled:opacity-50">
                <Play size={14} className={running ? 'animate-pulse' : ''} />
                {running ? 'Processing...' : 'Run Preprocessing'}
              </button>
            </div>

            {/* Pipeline Steps */}
            <div className="bg-[#14243A] border border-[#1E3A5F] rounded-xl p-4">
              <h3 className="text-sm font-semibold text-slate-200 mb-3">Pipeline Steps</h3>
              <div className="space-y-2">
                {steps.map((step, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="flex-shrink-0">
                      {completedSteps.includes(i)
                        ? <CheckCircle size={15} className="text-green-400" />
                        : running && completedSteps.length === i
                          ? <div className="w-4 h-4 rounded-full border-2 border-sky-400 border-t-transparent animate-spin" />
                          : <div className="w-4 h-4 rounded-full border-2 border-[#1E3A5F]" />
                      }
                    </div>
                    <span className={`text-xs ${completedSteps.includes(i) ? 'text-slate-300' : 'text-slate-500'}`}>{step}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Results Panel */}
            <div className="bg-[#14243A] border border-[#1E3A5F] rounded-xl p-4">
              <h3 className="text-sm font-semibold text-slate-200 mb-3">Results</h3>
              {result ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { l: 'Records Before', v: result.before?.records?.toLocaleString(), c: 'text-slate-300' },
                      { l: 'Records After', v: result.after?.records?.toLocaleString(), c: 'text-green-400' },
                      { l: 'Missing Before', v: result.before?.missing_values, c: 'text-yellow-400' },
                      { l: 'Missing After', v: result.after?.missing_values, c: 'text-green-400' },
                    ].map(({ l, v, c }) => (
                      <div key={l} className="bg-[#07111F] rounded-lg p-2">
                        <div className={`text-sm font-bold ${c}`}>{v}</div>
                        <div className="text-[10px] text-slate-500">{l}</div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-2">
                    <div className="text-xs text-slate-400 mb-1.5">Processing Log</div>
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                      {(result.log || []).map((log: string, i: number) => (
                        <div key={i} className="flex items-start gap-2 text-[10px] text-slate-400">
                          <CheckCircle size={10} className="text-green-400 mt-0.5 flex-shrink-0" />
                          {log}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-40 text-slate-600">
                  <Settings2 size={28} className="mb-2" />
                  <p className="text-xs">Run preprocessing to see results</p>
                </div>
              )}
            </div>
          </div>

          {/* Outlier Chart */}
          {outlierChartData.length > 0 && (
            <div className="bg-[#14243A] border border-[#1E3A5F] rounded-xl p-4">
              <h3 className="text-sm font-semibold text-slate-200 mb-4">Outlier Analysis per Column</h3>
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={outlierChartData} margin={{ top: 5, right: 10, left: -20, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1E3A5F" />
                    <XAxis dataKey="column" tick={{ fill: '#64748B', fontSize: 10 }} angle={-20} textAnchor="end" />
                    <YAxis tick={{ fill: '#64748B', fontSize: 10 }} />
                    <Tooltip contentStyle={{ background: '#0D1B2E', border: '1px solid #1E3A5F', borderRadius: 8, fontSize: 11 }} />
                    <Bar dataKey="outliers" name="Outlier Count" fill="#F97316" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
