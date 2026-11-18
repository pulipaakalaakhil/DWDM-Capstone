import React, { useState } from 'react';
import { Play, Cpu } from 'lucide-react';
import { ScatterChart, Scatter, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend } from 'recharts';
import { miningApi } from '../api/client';
import LoadingSpinner from '../components/ui/LoadingSpinner';

const CLUSTER_COLORS = ['#38BDF8','#22C55E','#FACC15','#F97316','#EF4444','#A855F7','#EC4899','#22D3EE'];

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#0D1B2E] border border-[#1E3A5F] rounded-lg p-2 text-xs">
      {payload.map((p: any, i: number) => <div key={i} className="text-slate-300">{p.name}: <span className="text-white font-medium">{typeof p.value === 'number' ? p.value.toLocaleString() : p.value}</span></div>)}
    </div>
  );
};

export default function DataMining() {
  const [tab, setTab] = useState<'kmeans' | 'dbscan' | 'dtree' | 'rf'>('kmeans');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [params, setParams] = useState({ n_clusters: 5, eps: 0.5, min_samples: 10, max_depth: 8, n_estimators: 100 });

  const run = async () => {
    setLoading(true);
    setResult(null);
    try {
      let res;
      if (tab === 'kmeans') res = await miningApi.runClustering({ algorithm: 'kmeans', n_clusters: params.n_clusters });
      else if (tab === 'dbscan') res = await miningApi.runClustering({ algorithm: 'dbscan', eps: params.eps, min_samples: params.min_samples });
      else if (tab === 'dtree') res = await miningApi.runDecisionTree({ max_depth: params.max_depth });
      else res = await miningApi.runRandomForest({ n_estimators: params.n_estimators });
      if (res.data.success) setResult(res.data);
    } catch (e: any) { console.error(e); }
    setLoading(false);
  };

  const tabs = [['kmeans','K-Means'], ['dbscan','DBSCAN'], ['dtree','Decision Tree'], ['rf','Random Forest']];

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-bold text-slate-100">Data Mining Algorithms</h2>
        <p className="text-xs text-slate-500 mt-0.5">Apply clustering, classification and pattern discovery to traffic data</p>
      </div>

      <div className="flex gap-1 bg-[#14243A] border border-[#1E3A5F] rounded-xl p-1 w-fit flex-wrap">
        {tabs.map(([key, label]) => (
          <button key={key} onClick={() => { setTab(key as any); setResult(null); }}
            className={`px-4 py-1.5 text-xs font-medium rounded-lg transition-colors ${tab === key ? 'bg-sky-500/20 text-sky-400' : 'text-slate-400 hover:text-slate-200'}`}>
            {label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Params */}
        <div className="bg-[#14243A] border border-[#1E3A5F] rounded-xl p-4 space-y-4">
          <h3 className="text-sm font-semibold text-slate-200">Parameters</h3>
          {tab === 'kmeans' && (
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Clusters (k): {params.n_clusters}</label>
              <input type="range" min={2} max={10} value={params.n_clusters} onChange={e => setParams(p => ({ ...p, n_clusters: +e.target.value }))} className="w-full accent-sky-400" />
            </div>
          )}
          {tab === 'dbscan' && <>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Epsilon (ε): {params.eps}</label>
              <input type="range" min={0.1} max={2} step={0.1} value={params.eps} onChange={e => setParams(p => ({ ...p, eps: +e.target.value }))} className="w-full accent-sky-400" />
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Min Samples: {params.min_samples}</label>
              <input type="range" min={3} max={30} value={params.min_samples} onChange={e => setParams(p => ({ ...p, min_samples: +e.target.value }))} className="w-full accent-sky-400" />
            </div>
          </>}
          {tab === 'dtree' && (
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Max Depth: {params.max_depth}</label>
              <input type="range" min={2} max={20} value={params.max_depth} onChange={e => setParams(p => ({ ...p, max_depth: +e.target.value }))} className="w-full accent-sky-400" />
            </div>
          )}
          {tab === 'rf' && (
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Estimators: {params.n_estimators}</label>
              <input type="range" min={10} max={200} step={10} value={params.n_estimators} onChange={e => setParams(p => ({ ...p, n_estimators: +e.target.value }))} className="w-full accent-sky-400" />
            </div>
          )}
          <button onClick={run} disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-sky-500/15 hover:bg-sky-500/25 border border-sky-500/40 text-sky-400 text-sm font-medium px-4 py-2.5 rounded-lg transition-colors disabled:opacity-50">
            <Play size={14} /> {loading ? 'Running...' : 'Run Algorithm'}
          </button>

          {result && (
            <div className="space-y-2 pt-2 border-t border-[#1E3A5F]">
              <div className="text-xs text-slate-400">Results</div>
              {result.accuracy !== undefined && <div className="flex justify-between text-xs"><span className="text-slate-500">Accuracy</span><span className="text-green-400 font-bold">{(result.accuracy * 100).toFixed(2)}%</span></div>}
              {result.f1_score !== undefined && <div className="flex justify-between text-xs"><span className="text-slate-500">F1 Score</span><span className="text-sky-400 font-bold">{(result.f1_score * 100).toFixed(2)}%</span></div>}
              {result.n_clusters !== undefined && <div className="flex justify-between text-xs"><span className="text-slate-500">Clusters</span><span className="text-sky-400 font-bold">{result.n_clusters}</span></div>}
              {result.n_clusters_found !== undefined && <div className="flex justify-between text-xs"><span className="text-slate-500">Found Clusters</span><span className="text-sky-400 font-bold">{result.n_clusters_found}</span></div>}
              {result.n_noise !== undefined && <div className="flex justify-between text-xs"><span className="text-slate-500">Noise Points</span><span className="text-yellow-400 font-bold">{result.n_noise}</span></div>}
            </div>
          )}
        </div>

        {/* Results */}
        <div className="lg:col-span-3 space-y-4">
          {loading ? <LoadingSpinner fullPage text="Running algorithm..." /> : !result ? (
            <div className="bg-[#14243A] border border-[#1E3A5F] rounded-xl flex items-center justify-center h-64">
              <div className="text-center text-slate-600">
                <Cpu size={36} className="mx-auto mb-2" />
                <p className="text-sm">Configure parameters and click Run</p>
              </div>
            </div>
          ) : (
            <>
              {/* Scatter Plot */}
              {result.scatter_data && (
                <div className="bg-[#14243A] border border-[#1E3A5F] rounded-xl p-4">
                  <h3 className="text-sm font-semibold text-slate-200 mb-3">Cluster Visualization — Traffic Volume vs Average Speed</h3>
                  <div className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <ScatterChart margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1E3A5F" />
                        <XAxis dataKey="x" name="Traffic Volume" tick={{ fill: '#64748B', fontSize: 10 }} />
                        <YAxis dataKey="y" name="Avg Speed" tick={{ fill: '#64748B', fontSize: 10 }} />
                        <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3' }} />
                        {Array.from(new Set(result.scatter_data.map((d: any) => d.cluster))).map((cl: any) => (
                          <Scatter key={cl} name={cl === -1 ? 'Noise' : `Cluster ${cl}`}
                            data={result.scatter_data.filter((d: any) => d.cluster === cl)}
                            fill={cl === -1 ? '#475569' : CLUSTER_COLORS[cl % CLUSTER_COLORS.length]} opacity={0.7} />
                        ))}
                      </ScatterChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* Cluster Cards */}
              {result.clusters && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {result.clusters.slice(0, 6).map((c: any) => (
                    <div key={c.cluster_id} className="bg-[#14243A] border border-[#1E3A5F] rounded-xl p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-3 h-3 rounded-full" style={{ background: c.cluster_id === -1 ? '#475569' : CLUSTER_COLORS[c.cluster_id % CLUSTER_COLORS.length] }} />
                        <span className="text-xs font-semibold text-slate-200">{c.label || `Cluster ${c.cluster_id}`}</span>
                      </div>
                      <div className="text-xs text-slate-400 space-y-1">
                        <div className="flex justify-between"><span>Count:</span><span className="text-slate-200 font-medium">{c.count?.toLocaleString()}</span></div>
                        <div className="flex justify-between"><span>Avg Volume:</span><span className="text-sky-400">{Math.round(c.avg_traffic)}</span></div>
                        <div className="flex justify-between"><span>Avg Speed:</span><span className="text-cyan-400">{c.avg_speed} km/h</span></div>
                        {c.dominant_congestion && <div className="flex justify-between"><span>Congestion:</span><span className="text-yellow-400">{c.dominant_congestion}</span></div>}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Feature Importance */}
              {result.feature_importance && (
                <div className="bg-[#14243A] border border-[#1E3A5F] rounded-xl p-4">
                  <h3 className="text-sm font-semibold text-slate-200 mb-3">Feature Importance</h3>
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={result.feature_importance} layout="vertical" margin={{ top: 0, right: 10, left: 80, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1E3A5F" horizontal={false} />
                        <XAxis type="number" tick={{ fill: '#64748B', fontSize: 10 }} domain={[0, 1]} />
                        <YAxis type="category" dataKey="feature" tick={{ fill: '#94A3B8', fontSize: 10 }} width={80} />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="importance" name="Importance" fill="#38BDF8" radius={[0, 3, 3, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* Confusion Matrix */}
              {result.confusion_matrix && (
                <div className="bg-[#14243A] border border-[#1E3A5F] rounded-xl p-4">
                  <h3 className="text-sm font-semibold text-slate-200 mb-3">Confusion Matrix</h3>
                  <div className="overflow-x-auto">
                    <table className="text-xs mx-auto">
                      <thead><tr><th className="text-slate-500 p-1"></th>{(result.classes || result.confusion_matrix[0].map((_: any, i: number) => i)).map((c: any, i: number) => <th key={i} className="text-slate-400 px-2 py-1 font-medium">{typeof c === 'string' ? c.slice(0,8) : `C${c}`}</th>)}</tr></thead>
                      <tbody>
                        {result.confusion_matrix.map((row: number[], ri: number) => (
                          <tr key={ri}>
                            <td className="text-slate-400 pr-2 font-medium">{(result.classes || [])[ri] || `C${ri}`}</td>
                            {row.map((val, ci) => (
                              <td key={ci} className={`px-3 py-1.5 text-center rounded font-medium ${ri === ci ? 'bg-sky-500/20 text-sky-400' : 'bg-[#0D1B2E] text-slate-400'}`}>{val}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Elbow Curve for K-Means */}
              {result.elbow_data && (
                <div className="bg-[#14243A] border border-[#1E3A5F] rounded-xl p-4">
                  <h3 className="text-sm font-semibold text-slate-200 mb-3">Elbow Method — Optimal k</h3>
                  <div className="h-44">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={result.elbow_data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1E3A5F" />
                        <XAxis dataKey="k" tick={{ fill: '#64748B', fontSize: 10 }} label={{ value: 'k (clusters)', position: 'insideBottom', offset: -5, fill: '#64748B', fontSize: 10 }} />
                        <YAxis tick={{ fill: '#64748B', fontSize: 10 }} />
                        <Tooltip content={<CustomTooltip />} />
                        <Line type="monotone" dataKey="inertia" stroke="#38BDF8" strokeWidth={2} dot={{ fill: '#38BDF8', r: 4 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
