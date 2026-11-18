import React, { useEffect, useState } from 'react';
import { schemaApi } from '../api/client';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import {
  Snowflake, ArrowRight, Layers, Key, Database, Star,
  Link2, CheckCircle2, Info, ChevronRight, Share2, Sparkles
} from 'lucide-react';

interface LevelNode {
  level: number;
  table: string;
  key: string;
  columns: string[];
  fk_to?: string;
}

interface Branch {
  root: string;
  hierarchy: LevelNode[];
}

const BRANCH_THEMES = [
  {
    name: 'Date Dimension Branch',
    color: '#38BDF8',
    borderColor: 'border-sky-500/40',
    bgColor: 'bg-sky-500/10',
    badgeColor: 'bg-sky-500/20 text-sky-300 border-sky-500/40',
    glow: 'rgba(56, 189, 248, 0.25)',
    factFk: 'date_id'
  },
  {
    name: 'Location Dimension Branch',
    color: '#34D399',
    borderColor: 'border-emerald-500/40',
    bgColor: 'bg-emerald-500/10',
    badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    glow: 'rgba(52, 211, 153, 0.25)',
    factFk: 'location_id'
  },
  {
    name: 'Road Dimension Branch',
    color: '#A78BFA',
    borderColor: 'border-purple-500/40',
    bgColor: 'bg-purple-500/10',
    badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
    glow: 'rgba(167, 139, 250, 0.25)',
    factFk: 'road_id'
  }
];

export default function SnowflakeSchema() {
  const [schema, setSchema] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [activeBranchIndex, setActiveBranchIndex] = useState<number | null>(null);

  useEffect(() => {
    schemaApi.getSnowflake().then(res => {
      if (res.data.success) setSchema(res.data.schema);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner fullPage text="Resolving Snowflake dimensional hierarchy & connections..." />;

  const branches: Branch[] = schema?.dimension_hierarchy || [];
  const fact = schema?.fact_table;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Snowflake size={22} className="text-sky-400" />
            Connected Snowflake Schema Architecture
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-3xl leading-relaxed">
            Normalized dimensional model eliminating redundancy by decomposing dimension tables into normalized hierarchical branches.
            The central <strong className="text-amber-400">Fact_Traffic</strong> table directly links to root dimensions via foreign keys, cascading across multi-level lookup hierarchies.
          </p>
        </div>
        <div className="flex items-center gap-2 bg-[#0D1B2E] border border-[#1E3A5F] px-3 py-1.5 rounded-xl text-xs font-mono">
          <span className="flex items-center gap-1.5 text-amber-400">
            <Key size={12} /> Primary Key
          </span>
          <span className="text-slate-600">|</span>
          <span className="flex items-center gap-1.5 text-sky-400">
            <Link2 size={12} /> Foreign Key Connection
          </span>
        </div>
      </div>

      {/* Connectivity Architecture View */}
      <div className="bg-[#0D1B2E] border border-[#1E3A5F] rounded-2xl p-6 shadow-2xl space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-[#1E3A5F] flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Share2 size={16} className="text-sky-400" />
            <h3 className="text-sm font-bold text-slate-100">Dimensional Lineage & Foreign Key Network</h3>
          </div>
          <span className="text-[11px] text-slate-400 font-mono">
            Click any table to trace its hierarchical foreign-key lineage to Fact_Traffic
          </span>
        </div>

        {/* Central Hub & Branches Layout */}
        <div className="space-y-6">
          {branches.map((branch, bi) => {
            const theme = BRANCH_THEMES[bi % BRANCH_THEMES.length];
            const isBranchActive = activeBranchIndex === null || activeBranchIndex === bi;

            return (
              <div
                key={bi}
                className={`bg-[#07111F] border rounded-2xl p-5 transition-all duration-300 relative overflow-hidden ${
                  isBranchActive ? theme.borderColor : 'border-[#1E3A5F]/40 opacity-70'
                }`}
                style={{
                  boxShadow: isBranchActive ? `0 0 25px ${theme.glow}` : 'none'
                }}
              >
                {/* Branch Header Badge */}
                <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs" style={{ background: theme.bgColor, color: theme.color }}>
                      B{bi + 1}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-100">{theme.name}</h4>
                      <p className="text-[10px] text-slate-400 font-mono">
                        Normalization Path: Fact_Traffic &rarr; {branch.hierarchy.map(h => h.table).join(' &rarr; ')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-mono px-2.5 py-0.5 rounded-full border ${theme.badgeColor}`}>
                      Join Key: <strong className="underline">{theme.factFk}</strong>
                    </span>
                    <button
                      onClick={() => setActiveBranchIndex(activeBranchIndex === bi ? null : bi)}
                      className="text-[11px] text-slate-400 hover:text-sky-400 transition-colors font-mono cursor-pointer"
                    >
                      {activeBranchIndex === bi ? 'Show All' : 'Focus Branch'}
                    </button>
                  </div>
                </div>

                {/* VISUAL HIERARCHY CHAIN WITH VISIBLE CONNECTORS */}
                <div className="flex items-center gap-0 overflow-x-auto pb-4 pt-2 scrollbar-thin">
                  {/* Step 0: Fact Table Node */}
                  <div className="flex-shrink-0 min-w-[210px] bg-[#14243A] border-2 border-amber-400/80 rounded-xl p-3.5 shadow-lg relative group">
                    <div className="flex items-center justify-between mb-1.5 pb-1 border-b border-amber-400/30">
                      <div className="flex items-center gap-1.5">
                        <Star size={13} className="text-amber-400 fill-amber-400/20" />
                        <span className="text-xs font-bold text-amber-300 font-mono">{fact?.name || 'Fact_Traffic'}</span>
                      </div>
                      <span className="text-[9px] bg-amber-500/20 text-amber-300 px-1.5 py-0.2 rounded font-mono font-semibold">FACT</span>
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono mb-2">Foreign Key Anchor:</div>
                    <div className="bg-[#0D1B2E] p-1.5 rounded border border-amber-400/40 text-[11px] font-mono text-amber-300 flex items-center justify-between">
                      <span className="flex items-center gap-1"><Link2 size={11} className="text-sky-400" /> {theme.factFk}</span>
                      <span className="text-[9px] text-slate-500">INTEGER</span>
                    </div>
                    <div className="mt-2 text-[9px] text-slate-500 font-mono flex items-center justify-between">
                      <span>Grain: Sensor Record</span>
                      <span className="text-amber-400">Central Hub</span>
                    </div>
                  </div>

                  {/* Connector Line: Fact Table to Root Dimension */}
                  <div className="flex-shrink-0 flex flex-col items-center justify-center px-2 relative min-w-[100px]">
                    <div className="w-full flex items-center">
                      <div className="h-0.5 w-full" style={{ background: `linear-gradient(90deg, #FBBF24, ${theme.color})` }} />
                      <div className="w-2.5 h-2.5 rotate-45 border-t-2 border-r-2 -ml-1.5" style={{ borderColor: theme.color }} />
                    </div>
                    <div className="bg-[#0D1B2E] border px-2 py-0.5 rounded text-[9px] font-mono mt-1 text-center whitespace-nowrap shadow" style={{ borderColor: theme.color + '55', color: theme.color }}>
                      1 : N Join
                    </div>
                    <span className="text-[8px] text-slate-500 font-mono mt-0.5">on {theme.factFk}</span>
                  </div>

                  {/* Sequential Dimension Hierarchy Nodes */}
                  {branch.hierarchy.map((lvl, li) => {
                    const isSelected = selectedTable === lvl.table;
                    const isLeaf = li === branch.hierarchy.length - 1;

                    return (
                      <React.Fragment key={li}>
                        {/* Table Card Node */}
                        <div
                          onClick={() => setSelectedTable(isSelected ? null : lvl.table)}
                          className={`flex-shrink-0 min-w-[210px] rounded-xl p-3.5 border transition-all cursor-pointer relative shadow-lg ${
                            isSelected
                              ? 'bg-[#16273D] border-2 shadow-2xl scale-[1.02]'
                              : 'bg-[#0D1B2E] hover:border-slate-400'
                          }`}
                          style={{
                            borderColor: isSelected ? theme.color : theme.color + '60'
                          }}
                        >
                          <div className="flex items-center justify-between mb-1.5 pb-1 border-b border-[#1E3A5F]">
                            <div className="flex items-center gap-1.5">
                              <Database size={13} style={{ color: theme.color }} />
                              <span className="text-xs font-bold font-mono text-slate-200">{lvl.table}</span>
                            </div>
                            <span className="text-[9px] px-1.5 py-0.2 rounded font-mono font-semibold" style={{ background: theme.bgColor, color: theme.color }}>
                              L{lvl.level} {isLeaf ? '(LEAF)' : ''}
                            </span>
                          </div>

                          <div className="text-[10px] font-mono text-amber-400 flex items-center gap-1 mb-2">
                            <Key size={10} />
                            <span>PK: {lvl.key}</span>
                          </div>

                          <div className="space-y-1 border-t border-[#1E3A5F]/40 pt-2 text-[10px] font-mono text-slate-300">
                            {(lvl.columns || []).map((col: string) => {
                              const isFk = col.endsWith('_id') && col !== lvl.key;
                              return (
                                <div key={col} className="flex items-center justify-between">
                                  <span className={`flex items-center gap-1 ${isFk ? 'text-sky-300 font-semibold' : 'text-slate-300'}`}>
                                    {isFk ? <Link2 size={9} className="text-sky-400" /> : <span className="w-2.5">&bull;</span>}
                                    {col}
                                  </span>
                                  {isFk && <span className="text-[8px] bg-sky-500/10 text-sky-400 px-1 rounded">FK</span>}
                                </div>
                              );
                            })}
                          </div>

                          <div className="mt-2.5 pt-1.5 border-t border-[#1E3A5F]/40 flex items-center justify-between text-[9px] text-slate-500 font-mono">
                            <span>Normalized</span>
                            <span style={{ color: theme.color }}>{lvl.columns?.length} attributes</span>
                          </div>
                        </div>

                        {/* Connector Line to Next Level (if not leaf) */}
                        {!isLeaf && (
                          <div className="flex-shrink-0 flex flex-col items-center justify-center px-2 relative min-w-[100px]">
                            <div className="w-full flex items-center">
                              <div className="h-0.5 w-full" style={{ background: theme.color }} />
                              <div className="w-2.5 h-2.5 rotate-45 border-t-2 border-r-2 -ml-1.5" style={{ borderColor: theme.color }} />
                            </div>
                            <div className="bg-[#0D1B2E] border px-2 py-0.5 rounded text-[9px] font-mono mt-1 text-center whitespace-nowrap shadow" style={{ borderColor: theme.color + '55', color: theme.color }}>
                              FK Link
                            </div>
                            <span className="text-[8px] text-slate-500 font-mono mt-0.5">
                              L{lvl.level} &rarr; L{lvl.level + 1}
                            </span>
                          </div>
                        )}
                      </React.Fragment>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected Table Inspector Details */}
      {selectedTable && (
        <div className="bg-[#14243A] border border-sky-400/50 rounded-2xl p-5 shadow-2xl space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-[#1E3A5F]">
            <div className="flex items-center gap-2">
              <Sparkles size={16} className="text-sky-400" />
              <h3 className="text-sm font-bold text-slate-100 font-mono">Table Inspector: {selectedTable}</h3>
            </div>
            <button onClick={() => setSelectedTable(null)} className="text-xs text-slate-400 hover:text-slate-200 cursor-pointer">
              Close Inspector &times;
            </button>
          </div>
          <p className="text-xs text-slate-300">
            In snowflake normalization, <strong className="text-sky-300 font-mono">{selectedTable}</strong> removes functional dependencies and update anomalies by isolating repeated categorical attributes into a higher-level dimension entity.
          </p>
        </div>
      )}

      {/* Comprehensive Snowflake Connectivity & Foreign Key Matrix */}
      <div className="bg-[#14243A] border border-[#1E3A5F] rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-[#1E3A5F] flex items-center justify-between flex-wrap gap-2">
          <div>
            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <Link2 size={16} className="text-sky-400" />
              Complete Snowflake Foreign Key Join Matrix
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Exact join relationships defining how queries roll up from the Central Fact table to Leaf dimensions
            </p>
          </div>
          <span className="text-xs font-mono bg-[#0D1B2E] px-2.5 py-1 rounded-lg border border-[#1E3A5F] text-slate-300">
            Total Relationships: 10 Joins
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs data-table">
            <thead className="bg-[#0D1B2E]">
              <tr>
                <th className="text-left text-slate-400 font-medium">Source Table</th>
                <th className="text-center text-slate-400 font-medium">Relationship</th>
                <th className="text-left text-slate-400 font-medium">Target Table</th>
                <th className="text-left text-slate-400 font-medium">Join Key (FK &rarr; PK)</th>
                <th className="text-left text-slate-400 font-medium">Branch Domain</th>
                <th className="text-left text-slate-400 font-medium">OLAP Operation Supported</th>
              </tr>
            </thead>
            <tbody>
              {/* Row 1: Fact to Date */}
              <tr className="hover:bg-[#16273D]">
                <td className="text-amber-400 font-mono font-bold">Fact_Traffic</td>
                <td className="text-center font-mono text-sky-400 font-bold">Many-to-One (N:1)</td>
                <td className="text-slate-200 font-mono font-bold">Dim_Date</td>
                <td className="text-sky-300 font-mono">Fact_Traffic.date_id &rarr; Dim_Date.date_id</td>
                <td className="text-sky-400">Temporal (Date)</td>
                <td className="text-slate-400 font-mono">Daily Roll-Up</td>
              </tr>
              {/* Row 2: Date to Month */}
              <tr className="hover:bg-[#16273D]">
                <td className="text-slate-200 font-mono">Dim_Date</td>
                <td className="text-center font-mono text-sky-400">Many-to-One (N:1)</td>
                <td className="text-slate-200 font-mono">Dim_Month</td>
                <td className="text-sky-300 font-mono">Dim_Date.month_id &rarr; Dim_Month.month_id</td>
                <td className="text-sky-400">Temporal (Date)</td>
                <td className="text-slate-400 font-mono">Monthly Roll-Up</td>
              </tr>
              {/* Row 3: Month to Quarter */}
              <tr className="hover:bg-[#16273D]">
                <td className="text-slate-200 font-mono">Dim_Month</td>
                <td className="text-center font-mono text-sky-400">Many-to-One (N:1)</td>
                <td className="text-slate-200 font-mono">Dim_Quarter</td>
                <td className="text-sky-300 font-mono">Dim_Month.quarter_id &rarr; Dim_Quarter.quarter_id</td>
                <td className="text-sky-400">Temporal (Date)</td>
                <td className="text-slate-400 font-mono">Quarterly Roll-Up</td>
              </tr>
              {/* Row 4: Quarter to Year */}
              <tr className="hover:bg-[#16273D]">
                <td className="text-slate-200 font-mono">Dim_Quarter</td>
                <td className="text-center font-mono text-sky-400">Many-to-One (N:1)</td>
                <td className="text-slate-200 font-mono">Dim_Year</td>
                <td className="text-sky-300 font-mono">Dim_Quarter.year_id &rarr; Dim_Year.year_id</td>
                <td className="text-sky-400">Temporal (Date)</td>
                <td className="text-slate-400 font-mono">Annual Multi-Year Roll-Up</td>
              </tr>
              {/* Row 5: Fact to Location */}
              <tr className="hover:bg-[#16273D]">
                <td className="text-amber-400 font-mono font-bold">Fact_Traffic</td>
                <td className="text-center font-mono text-emerald-400 font-bold">Many-to-One (N:1)</td>
                <td className="text-slate-200 font-mono font-bold">Dim_Location</td>
                <td className="text-emerald-300 font-mono">Fact_Traffic.location_id &rarr; Dim_Location.location_id</td>
                <td className="text-emerald-400">Spatial (GIS)</td>
                <td className="text-slate-400 font-mono">Intersection-Level Drill-Down</td>
              </tr>
              {/* Row 6: Location to Area */}
              <tr className="hover:bg-[#16273D]">
                <td className="text-slate-200 font-mono">Dim_Location</td>
                <td className="text-center font-mono text-emerald-400">Many-to-One (N:1)</td>
                <td className="text-slate-200 font-mono">Dim_Area</td>
                <td className="text-emerald-300 font-mono">Dim_Location.area_id &rarr; Dim_Area.area_id</td>
                <td className="text-emerald-400">Spatial (GIS)</td>
                <td className="text-slate-400 font-mono">Area Roll-Up (e.g. Whitefield)</td>
              </tr>
              {/* Row 7: Area to Zone */}
              <tr className="hover:bg-[#16273D]">
                <td className="text-slate-200 font-mono">Dim_Area</td>
                <td className="text-center font-mono text-emerald-400">Many-to-One (N:1)</td>
                <td className="text-slate-200 font-mono">Dim_Zone</td>
                <td className="text-emerald-300 font-mono">Dim_Area.zone_id &rarr; Dim_Zone.zone_id</td>
                <td className="text-emerald-400">Spatial (GIS)</td>
                <td className="text-slate-400 font-mono">Metropolitan Zone Aggregation</td>
              </tr>
              {/* Row 8: Zone to City */}
              <tr className="hover:bg-[#16273D]">
                <td className="text-slate-200 font-mono">Dim_Zone</td>
                <td className="text-center font-mono text-emerald-400">Many-to-One (N:1)</td>
                <td className="text-slate-200 font-mono">Dim_City</td>
                <td className="text-emerald-300 font-mono">Dim_Zone.city_id &rarr; Dim_City.city_id</td>
                <td className="text-emerald-400">Spatial (GIS)</td>
                <td className="text-slate-400 font-mono">Citywide Bangalore Roll-Up</td>
              </tr>
              {/* Row 9: Fact to Road */}
              <tr className="hover:bg-[#16273D]">
                <td className="text-amber-400 font-mono font-bold">Fact_Traffic</td>
                <td className="text-center font-mono text-purple-400 font-bold">Many-to-One (N:1)</td>
                <td className="text-slate-200 font-mono font-bold">Dim_Road</td>
                <td className="text-purple-300 font-mono">Fact_Traffic.road_id &rarr; Dim_Road.road_id</td>
                <td className="text-purple-400">Infrastructure</td>
                <td className="text-slate-400 font-mono">Road Capacity Slicing</td>
              </tr>
              {/* Row 10: Road to Road_Type */}
              <tr className="hover:bg-[#16273D]">
                <td className="text-slate-200 font-mono">Dim_Road</td>
                <td className="text-center font-mono text-purple-400">Many-to-One (N:1)</td>
                <td className="text-slate-200 font-mono">Dim_Road_Type</td>
                <td className="text-purple-300 font-mono">Dim_Road.road_type_id &rarr; Dim_Road_Type.road_type_id</td>
                <td className="text-purple-400">Infrastructure</td>
                <td className="text-slate-400 font-mono">Highway vs Arterial Roll-Up</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
