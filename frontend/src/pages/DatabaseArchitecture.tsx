import React, { useEffect, useState } from 'react';
import { Database, Key, Link } from 'lucide-react';
import { schemaApi } from '../api/client';
import LoadingSpinner from '../components/ui/LoadingSpinner';

function TableCard({ table, accent = '#38BDF8' }: { table: any; accent?: string }) {
  const [expanded, setExpanded] = useState(false);
  const sqlDef = `CREATE TABLE ${table.name} (\n${(table.columns || []).map((c: any) =>
    `  ${c.name} ${c.type}${c.pk ? ' PRIMARY KEY' : ''}${!c.nullable && !c.pk ? ' NOT NULL' : ''}${c.default ? ` DEFAULT ${c.default}` : ''}`
  ).join(',\n')}\n);`;

  return (
    <div className="bg-[#14243A] border border-[#1E3A5F] rounded-xl overflow-hidden hover:border-sky-400/30 transition-colors">
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-[#1E3A5F] cursor-pointer" onClick={() => setExpanded(!expanded)} style={{ borderTopColor: accent }}>
        <div className="flex items-center gap-2">
          <Database size={14} style={{ color: accent }} />
          <span className="text-sm font-semibold text-slate-200 font-mono">{table.name}</span>
          {table.description && <span className="text-[10px] text-slate-600 hidden md:block">— {table.description}</span>}
        </div>
        <span className="text-[10px] text-slate-500">{table.columns?.length} cols</span>
      </div>
      <div className="p-2 space-y-0.5">
        {(table.columns || []).slice(0, expanded ? 999 : 6).map((col: any, i: number) => (
          <div key={i} className="flex items-center gap-2 px-1 py-0.5 rounded hover:bg-[#07111F] transition-colors group">
            <div className="flex-shrink-0 w-4">
              {col.pk && <Key size={10} className="text-yellow-400" />}
              {col.fk && !col.pk && <Link size={10} className="text-sky-400" />}
            </div>
            <span className={`text-xs font-mono flex-1 ${col.pk ? 'text-yellow-400 font-semibold' : col.fk ? 'text-sky-400' : 'text-slate-300'}`}>{col.name}</span>
            <span className="text-[10px] font-mono text-slate-500 bg-[#07111F] px-1.5 py-0.5 rounded">{col.type}</span>
            {col.fk && <span className="text-[9px] text-sky-600 hidden group-hover:block">→ {col.fk}</span>}
          </div>
        ))}
        {!expanded && (table.columns || []).length > 6 && (
          <button onClick={() => setExpanded(true)} className="text-[10px] text-sky-400 px-2 pt-1 hover:underline">+{table.columns.length - 6} more columns</button>
        )}
      </div>
      {expanded && (
        <div className="border-t border-[#1E3A5F] p-3">
          <div className="text-[10px] text-slate-500 mb-1">SQL Definition</div>
          <pre className="text-[10px] text-slate-400 font-mono bg-[#07111F] rounded p-2 overflow-x-auto whitespace-pre-wrap">{sqlDef}</pre>
        </div>
      )}
    </div>
  );
}

function StarSchemaLayout({ schema }: { schema: any }) {
  const fact = schema.fact_table;
  const dims = schema.dimensions || [];
  return (
    <div className="space-y-4">
      <div className="flex justify-center">
        <div className="w-full max-w-sm">
          <TableCard table={fact} accent="#FACC15" />
        </div>
      </div>
      <div className="text-center text-xs text-slate-500 flex items-center justify-center gap-2">
        <div className="h-px flex-1 bg-[#1E3A5F]" />
        Dimension Tables
        <div className="h-px flex-1 bg-[#1E3A5F]" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        {dims.map((dim: any, i: number) => <TableCard key={i} table={dim} accent="#38BDF8" />)}
      </div>
    </div>
  );
}

function NormalizedLayout({ schema }: { schema: any }) {
  const tables = schema.tables || [];
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
      {tables.map((t: any, i: number) => <TableCard key={i} table={t} />)}
    </div>
  );
}

function SnowflakeLayout({ schema }: { schema: any }) {
  const fact = schema.fact_table;
  const hierarchies = schema.dimension_hierarchy || [];
  return (
    <div className="space-y-4">
      <div className="flex justify-center">
        <div className="w-full max-w-sm">
          <TableCard table={fact} accent="#FACC15" />
        </div>
      </div>
      {hierarchies.map((hier: any, hi: number) => (
        <div key={hi} className="bg-[#0D1B2E] border border-[#1E3A5F] rounded-xl p-4">
          <h4 className="text-xs font-semibold text-sky-400 mb-3">{hier.root} Hierarchy</h4>
          <div className="flex items-start gap-2 overflow-x-auto pb-2">
            {hier.hierarchy.map((level: any, li: number) => (
              <React.Fragment key={li}>
                <div className="bg-[#14243A] border border-[#1E3A5F] rounded-lg p-2.5 min-w-32 flex-shrink-0">
                  <div className="text-xs font-semibold text-slate-200 font-mono mb-1">{level.table}</div>
                  <div className="text-[10px] text-slate-500">Level {level.level}</div>
                  <div className="mt-1 space-y-0.5">
                    {(level.columns || []).map((c: string) => <div key={c} className="text-[10px] text-slate-400 font-mono">{c}</div>)}
                  </div>
                </div>
                {li < hier.hierarchy.length - 1 && <div className="text-slate-600 mt-4 text-sm flex-shrink-0">→</div>}
              </React.Fragment>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function DatabaseArchitecture() {
  const [tab, setTab] = useState<'normalized' | 'star' | 'snowflake'>('normalized');
  const [schemas, setSchemas] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);

  const fetchSchema = async (type: string) => {
    if (schemas[type]) return;
    setLoading(true);
    try {
      const res = type === 'normalized' ? await schemaApi.getNormalized()
        : type === 'star' ? await schemaApi.getStar()
          : await schemaApi.getSnowflake();
      if (res.data.success) setSchemas(prev => ({ ...prev, [type]: res.data.schema }));
    } catch {}
    setLoading(false);
  };

  useEffect(() => { fetchSchema(tab); }, [tab]);

  const schema = schemas[tab];

  const descriptions: Record<string, string> = {
    normalized: '3NF relational schema eliminating redundancy — entities linked by foreign keys',
    star: 'Data warehouse star schema — Fact_Traffic table at center surrounded by dimension tables',
    snowflake: 'Extended star schema — dimension tables normalized into hierarchical sub-tables',
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-bold text-slate-100">Database Architecture</h2>
        <p className="text-xs text-slate-500 mt-0.5">{descriptions[tab]}</p>
      </div>

      <div className="flex gap-1 bg-[#14243A] border border-[#1E3A5F] rounded-xl p-1 w-fit">
        {[['normalized','Normalized (3NF)'], ['star','Star Schema'], ['snowflake','Snowflake Schema']].map(([k, l]) => (
          <button key={k} onClick={() => setTab(k as any)}
            className={`px-4 py-1.5 text-xs font-medium rounded-lg transition-colors ${tab === k ? 'bg-sky-500/20 text-sky-400' : 'text-slate-400 hover:text-slate-200'}`}>{l}
          </button>
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs">
        <div className="flex items-center gap-1.5"><Key size={12} className="text-yellow-400" /><span className="text-slate-400">Primary Key</span></div>
        <div className="flex items-center gap-1.5"><Link size={12} className="text-sky-400" /><span className="text-slate-400">Foreign Key</span></div>
        <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded border border-yellow-400/30 bg-yellow-400/10" /><span className="text-slate-400">Fact Table</span></div>
        <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded border border-sky-400/30 bg-sky-400/10" /><span className="text-slate-400">Dimension / Entity</span></div>
      </div>

      {loading ? <LoadingSpinner fullPage text="Loading schema..." /> : !schema ? (
        <LoadingSpinner fullPage />
      ) : (
        <>
          {tab === 'normalized' && <NormalizedLayout schema={schema} />}
          {tab === 'star' && <StarSchemaLayout schema={schema} />}
          {tab === 'snowflake' && <SnowflakeLayout schema={schema} />}
        </>
      )}
    </div>
  );
}
