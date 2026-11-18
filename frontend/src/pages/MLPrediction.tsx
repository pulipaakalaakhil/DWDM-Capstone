import React, { useState } from 'react';
import { Play, Brain, TrendingUp } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine } from 'recharts';
import { predictionApi } from '../api/client';
import LoadingSpinner from '../components/ui/LoadingSpinner';

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#0D1B2E] border border-[#1E3A5F] rounded-lg p-2 text-xs shadow-xl">
      <div className="text-slate-400 mb-1">{label}</div>
      {payload.map((p: any, i: number) => (
        <div key={i} className="text-slate-300">{p.name}: <span className="font-bold" style={{ color: p.color }}>{typeof p.value === 'number' ? p.value.toLocaleString() : p.value}</span></div>
      ))}
    </div>
  );
};

export default function MLPrediction() {
  const [model, setModel] = useState('random_forest');
  const [target, setTarget] = useState('classification');
  const [result, setResult] = useState<any>(null);
  const [comparison, setComparison] = useState<any[]>([]);
  const [forecast, setForecast] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [evalLoading, setEvalLoading] = useState(false);
  const [forecastArea, setForecastArea] = useState('');
  const [horizon, setHorizon] = useState('1h');

  const train = async () => {
    setLoading(true);
    setResult(null);
    try {
      const res = await predictionApi.train({ model, target });
      if (res.data.success) setResult(res.data);
    } catch (e: any) { console.error(e); }
    setLoading(false);
  };

  const evaluate = async () => {
    setEvalLoading(true);
    try {
      const res = await predictionApi.evaluate();
      if (res.data.success) setComparison(res.data.comparison || []);
    } catch {}
    setEvalLoading(false);
  };

  const runForecast = async () => {
    setLoading(true);
    try {
      const res = await predictionApi.forecast({ area: forecastArea || undefined, horizon });
      if (res.data.success) setForecast(res.data.forecast || []);
    } catch {}
    setLoading(false);
  };

  const modelOptions = [
    { value: 'logistic_regression', label: 'Logistic Regression' },
    { value: 'decision_tree', label: 'Decision Tree' },
    { value: 'random_forest', label: 'Random Forest' },
    { value: 'gradient_boosting', label: 'Gradient Boosting' },
  ];

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-bold text-slate-100">ML Congestion Prediction</h2>
        <p className="text-xs text-slate-500 mt-0.5">Train and evaluate machine learning models on traffic data</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Config */}
        <div className="bg-[#14243A] border border-[#1E3A5F] rounded-xl p-4 space-y-4">
          <h3 className="text-sm font-semibold text-slate-200">Training Config</h3>

          <div>
            <label className="text-xs text-slate-400 mb-1.5 block">Algorithm</label>
            <select value={model} onChange={e => setModel(e.target.value)} className="w-full bg-[#07111F] border border-[#1E3A5F] text-xs text-slate-300 rounded-lg px-3 py-2 outline-none">
              {modelOptions.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
            </select>
          </div>

          <div>
            <label className="text-xs text-slate-400 mb-1.5 block">Target</label>
            <div className="space-y-1.5">
              {[['classification', 'Congestion Level (Class.)'], ['regression', 'Traffic Volume (Reg.)']].map(([v, l]) => (
                <label key={v} className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" value={v} checked={target === v} onChange={() => setTarget(v)} className="accent-sky-400" />
                  <span className="text-xs text-slate-300">{l}</span>
                </label>
              ))}
            </div>
          </div>

          <button onClick={train} disabled={loading} className="w-full flex items-center justify-center gap-2 bg-sky-500/15 hover:bg-sky-500/25 border border-sky-500/40 text-sky-400 text-sm font-medium px-4 py-2.5 rounded-lg transition-colors disabled:opacity-50">
            <Play size={14} /> {loading ? 'Training...' : 'Train Model'}
          </button>

          {result && (
            <div className="space-y-2 pt-2 border-t border-[#1E3A5F]">
              <div className="text-xs text-slate-400 font-medium">Metrics</div>
              {result.accuracy !== undefined && <MetricRow label="Accuracy" value={`${(result.accuracy * 100).toFixed(2)}%`} color="text-green-400" />}
              {result.f1_score !== undefined && <MetricRow label="F1 Score" value={`${(result.f1_score * 100).toFixed(2)}%`} color="text-sky-400" />}
              {result.precision !== undefined && <MetricRow label="Precision" value={`${(result.precision * 100).toFixed(2)}%`} color="text-cyan-400" />}
              {result.recall !== undefined && <MetricRow label="Recall" value={`${(result.recall * 100).toFixed(2)}%`} color="text-purple-400" />}
              {result.mae !== undefined && <MetricRow label="MAE" value={result.mae?.toFixed(1)} color="text-yellow-400" />}
              {result.rmse !== undefined && <MetricRow label="RMSE" value={result.rmse?.toFixed(1)} color="text-orange-400" />}
              {result.r2_score !== undefined && <MetricRow label="R²" value={result.r2_score?.toFixed(4)} color="text-green-400" />}
              <div className="text-[10px] text-slate-600">Train: {result.train_size} / Test: {result.test_size}</div>
            </div>
          )}
        </div>

        {/* Results */}
        <div className="lg:col-span-3 space-y-4">
          {loading ? <LoadingSpinner fullPage text="Training model..." /> : !result ? (
            <div className="bg-[#14243A] border border-[#1E3A5F] rounded-xl flex items-center justify-center h-64">
              <div className="text-center text-slate-600">
                <Brain size={36} className="mx-auto mb-2" />
                <p className="text-sm">Select algorithm and click Train</p>
              </div>
            </div>
          ) : (
            <>
              {result.actual_vs_predicted && (
                <div className="bg-[#14243A] border border-[#1E3A5F] rounded-xl p-4">
                  <h3 className="text-sm font-semibold text-slate-200 mb-3">Actual vs Predicted</h3>
                  <div className="h-52">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={result.actual_vs_predicted.slice(0, 100)} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1E3A5F" />
                        <XAxis tick={{ fill: '#64748B', fontSize: 10 }} />
                        <YAxis tick={{ fill: '#64748B', fontSize: 10 }} />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend wrapperStyle={{ fontSize: 11 }} />
                        <Line type="monotone" dataKey="actual" stroke="#22C55E" strokeWidth={1.5} dot={false} name="Actual" />
                        <Line type="monotone" dataKey="predicted" stroke="#38BDF8" strokeWidth={1.5} dot={false} strokeDasharray="4 2" name="Predicted" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {result.feature_importance && (
                <div className="bg-[#14243A] border border-[#1E3A5F] rounded-xl p-4">
                  <h3 className="text-sm font-semibold text-slate-200 mb-3">Feature Importance</h3>
                  <div className="h-44">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={result.feature_importance.slice(0, 8)} layout="vertical" margin={{ top: 0, right: 10, left: 100, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1E3A5F" horizontal={false} />
                        <XAxis type="number" tick={{ fill: '#64748B', fontSize: 10 }} domain={[0, 1]} />
                        <YAxis type="category" dataKey="feature" tick={{ fill: '#94A3B8', fontSize: 10 }} width={100} />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="importance" fill="#38BDF8" radius={[0, 3, 3, 0]} name="Importance" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {result.confusion_matrix && (
                <div className="bg-[#14243A] border border-[#1E3A5F] rounded-xl p-4">
                  <h3 className="text-sm font-semibold text-slate-200 mb-3">Confusion Matrix</h3>
                  <div className="overflow-x-auto">
                    <table className="text-xs mx-auto border-collapse">
                      <thead>
                        <tr>
                          <th className="text-slate-500 p-1 text-left">Actual ↓ / Pred →</th>
                          {(result.classes || []).map((c: string, i: number) => <th key={i} className="text-slate-400 px-2 py-1 text-center">{c}</th>)}
                        </tr>
                      </thead>
                      <tbody>
                        {result.confusion_matrix.map((row: number[], ri: number) => (
                          <tr key={ri}>
                            <td className="text-slate-400 pr-3 py-1 text-right font-medium">{(result.classes || [])[ri]}</td>
                            {row.map((val, ci) => (
                              <td key={ci} className={`px-3 py-1.5 text-center rounded font-medium mx-0.5 ${ri === ci ? 'bg-sky-500/25 text-sky-400' : val > 0 ? 'bg-red-500/10 text-red-400' : 'bg-[#0D1B2E] text-slate-600'}`}>{val}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Model Comparison */}
      <div className="bg-[#14243A] border border-[#1E3A5F] rounded-xl p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-slate-200">Model Comparison</h3>
          <button onClick={evaluate} disabled={evalLoading} className="flex items-center gap-1.5 text-xs text-sky-400 border border-sky-400/30 bg-sky-500/10 px-3 py-1.5 rounded-lg hover:bg-sky-500/20 transition-colors">
            <TrendingUp size={13} /> {evalLoading ? 'Evaluating...' : 'Compare All Models'}
          </button>
        </div>
        {comparison.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {comparison.map((m, i) => (
              <div key={i} className={`rounded-xl p-3 border ${i === 0 ? 'border-sky-500/40 bg-sky-500/10' : 'border-[#1E3A5F] bg-[#0D1B2E]'}`}>
                <div className="text-xs font-semibold text-slate-200 mb-2">{m.model}</div>
                <div className="text-xl font-bold text-sky-400">{(m.accuracy * 100).toFixed(1)}%</div>
                <div className="text-[10px] text-slate-500 mt-0.5">Accuracy</div>
                <div className="text-sm font-medium text-cyan-400 mt-1">{(m.f1_score * 100).toFixed(1)}%</div>
                <div className="text-[10px] text-slate-500">F1 Score</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Forecast */}
      <div className="bg-[#14243A] border border-[#1E3A5F] rounded-xl p-4">
        <h3 className="text-sm font-semibold text-slate-200 mb-3">Traffic Volume Forecast</h3>
        <div className="flex items-center gap-3 mb-4 flex-wrap">
          <input value={forecastArea} onChange={e => setForecastArea(e.target.value)} placeholder="Area (optional)" className="bg-[#07111F] border border-[#1E3A5F] text-xs text-slate-300 rounded-lg px-3 py-1.5 outline-none w-40" />
          <select value={horizon} onChange={e => setHorizon(e.target.value)} className="bg-[#07111F] border border-[#1E3A5F] text-xs text-slate-300 rounded-lg px-3 py-1.5 outline-none">
            <option value="15m">Next 15 min</option>
            <option value="30m">Next 30 min</option>
            <option value="1h">Next 1 hour</option>
            <option value="3h">Next 3 hours</option>
          </select>
          <button onClick={runForecast} disabled={loading} className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/30 text-cyan-400 text-xs rounded-lg transition-colors">
            <Play size={12} /> Forecast
          </button>
        </div>
        {forecast.length > 0 && (
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={forecast} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E3A5F" />
                <XAxis dataKey="hour_label" tick={{ fill: '#64748B', fontSize: 10 }} interval={3} />
                <YAxis tick={{ fill: '#64748B', fontSize: 10 }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Line type="monotone" dataKey="actual" stroke="#22C55E" strokeWidth={1.5} dot={false} name="Historical Avg" />
                <Line type="monotone" dataKey="predicted" stroke="#38BDF8" strokeWidth={2} dot={false} strokeDasharray="5 3" name="Forecast" />
                <Line type="monotone" dataKey="confidence_upper" stroke="#38BDF8" strokeWidth={0.5} strokeDasharray="2 4" dot={false} name="Upper CI" opacity={0.5} />
                <Line type="monotone" dataKey="confidence_lower" stroke="#38BDF8" strokeWidth={0.5} strokeDasharray="2 4" dot={false} name="Lower CI" opacity={0.5} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}

function MetricRow({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="flex justify-between items-center text-xs">
      <span className="text-slate-500">{label}</span>
      <span className={`font-bold ${color}`}>{value}</span>
    </div>
  );
}
