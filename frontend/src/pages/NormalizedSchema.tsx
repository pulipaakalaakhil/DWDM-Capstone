import React, { useEffect, useState } from 'react';
import { schemaApi } from '../api/client';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { Database, Key, Link, ShieldCheck, CheckCircle2 } from 'lucide-react';

export default function NormalizedSchema() {
  const [schema, setSchema] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    schemaApi.getNormalized().then(res => {
      if (res.data.success) setSchema(res.data.schema);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-slate-100">Normalized Relational Schema (3NF)</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Third Normal Form schema eliminating data redundancies and update anomalies across traffic entities.
        </p>
      </div>

      {/* 3NF Properties banner */}
      <div className="bg-[#14243A] border border-[#1E3A5F] rounded-xl p-4 grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="flex items-start gap-2.5 text-xs">
          <CheckCircle2 size={16} className="text-emerald-400 mt-0.5 flex-shrink-0" />
          <div>
            <strong className="text-slate-200">1NF Guaranteed:</strong>
            <p className="text-slate-400 text-[11px]">All column attributes are atomic with non-repeating groups.</p>
          </div>
        </div>
        <div className="flex items-start gap-2.5 text-xs">
          <CheckCircle2 size={16} className="text-emerald-400 mt-0.5 flex-shrink-0" />
          <div>
            <strong className="text-slate-200">2NF Compliant:</strong>
            <p className="text-slate-400 text-[11px]">No partial functional dependencies on composite candidate keys.</p>
          </div>
        </div>
        <div className="flex items-start gap-2.5 text-xs">
          <CheckCircle2 size={16} className="text-emerald-400 mt-0.5 flex-shrink-0" />
          <div>
            <strong className="text-slate-200">3NF Validated:</strong>
            <p className="text-slate-400 text-[11px]">Zero transitive dependencies; non-prime attributes depend only on PK.</p>
          </div>
        </div>
      </div>

      {loading ? (
        <LoadingSpinner fullPage text="Loading relational 3NF schema tables..." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {(schema?.tables || []).map((table: any, idx: number) => (
            <div key={idx} className="bg-[#14243A] border border-[#1E3A5F] rounded-xl overflow-hidden hover:border-sky-400/40 transition-colors">
              <div className="px-4 py-3 border-b border-[#1E3A5F] bg-[#0D1B2E] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Database size={15} className="text-sky-400" />
                  <span className="text-xs font-bold text-slate-100 font-mono">{table.name}</span>
                </div>
                <span className="text-[10px] text-slate-500 font-mono">{table.columns?.length} attributes</span>
              </div>
              <div className="p-3 space-y-1">
                {table.columns.map((c: any, i: number) => (
                  <div key={i} className="flex items-center justify-between text-xs py-1 border-b border-[#1E3A5F]/30 last:border-0">
                    <div className="flex items-center gap-1.5 font-mono">
                      {c.pk ? (
                        <span title="Primary Key"><Key size={11} className="text-amber-400" /></span>
                      ) : c.fk ? (
                        <span title="Foreign Key"><Link size={11} className="text-sky-400" /></span>
                      ) : (
                        <div className="w-3" />
                      )}
                      <span className={c.pk ? 'text-amber-400 font-semibold' : c.fk ? 'text-sky-300' : 'text-slate-300'}>
                        {c.name}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono bg-[#07111F] px-1.5 py-0.5 rounded border border-[#1E3A5F]">
                      {c.type}
                    </span>
                  </div>
                ))}
              </div>
              {table.description && (
                <div className="px-3 py-2 bg-[#07111F]/50 border-t border-[#1E3A5F]/50 text-[11px] text-slate-400">
                  {table.description}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
