import React, { useEffect, useState, useRef } from 'react';
import { schemaApi } from '../api/client';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { Star, Key, BarChart2, Link2, Database, Info } from 'lucide-react';

// ─── colour palette per dimension ───────────────────────────────────────────
const DIM_COLORS = [
  { border: '#38BDF8', bg: '#0C2233', text: '#38BDF8', glow: 'rgba(56,189,248,0.25)' },   // sky
  { border: '#22D3EE', bg: '#0C2230', text: '#22D3EE', glow: 'rgba(34,211,238,0.25)' },   // cyan
  { border: '#A78BFA', bg: '#1A1030', text: '#A78BFA', glow: 'rgba(167,139,250,0.25)' },  // violet
  { border: '#34D399', bg: '#0C2520', text: '#34D399', glow: 'rgba(52,211,153,0.25)' },   // emerald
  { border: '#FB923C', bg: '#231408', text: '#FB923C', glow: 'rgba(251,146,60,0.25)' },   // orange
  { border: '#F472B6', bg: '#2A0A1A', text: '#F472B6', glow: 'rgba(244,114,182,0.25)' },  // pink
];

const FACT_COLOR = { border: '#FBBF24', bg: '#1C1400', text: '#FCD34D', glow: 'rgba(251,191,36,0.35)' };

// ─── helpers ─────────────────────────────────────────────────────────────────
function polarToXY(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

interface Col { name: string; type: string; pk?: boolean; measure?: boolean; fk?: string }
interface Dim  { name: string; columns: Col[] }

// ─── Dimension card rendered at fixed (cx,cy) in SVG foreign-object ──────────
function DimCard({ dim, color, cx, cy, cardW, cardH, selected, onClick }:
  { dim: Dim; color: typeof DIM_COLORS[0]; cx: number; cy: number;
    cardW: number; cardH: number; selected: boolean; onClick: () => void }) {
  return (
    <foreignObject
      x={cx - cardW / 2} y={cy - cardH / 2}
      width={cardW} height={cardH}
      style={{ overflow: 'visible' }}
    >
      <div
        onClick={onClick}
        style={{
          border: `1.5px solid ${selected ? color.border : color.border + '80'}`,
          background: color.bg,
          boxShadow: selected ? `0 0 20px ${color.glow}, 0 0 40px ${color.glow}` : `0 0 8px ${color.glow}`,
          borderRadius: 10,
          width: cardW,
          minHeight: cardH,
          cursor: 'pointer',
          transition: 'box-shadow 0.25s',
          fontFamily: 'monospace',
          fontSize: 11,
        }}
      >
        {/* header */}
        <div style={{
          background: color.border + '22',
          borderBottom: `1px solid ${color.border}44`,
          padding: '5px 10px',
          display: 'flex', alignItems: 'center', gap: 6,
          borderRadius: '8px 8px 0 0',
        }}>
          <Database size={12} color={color.text} />
          <span style={{ color: color.text, fontWeight: 700, fontSize: 11 }}>{dim.name}</span>
          <span style={{ marginLeft: 'auto', color: '#475569', fontSize: 10 }}>{dim.columns.length} cols</span>
        </div>
        {/* columns */}
        <div style={{ padding: '4px 8px' }}>
          {dim.columns.map((col, i) => (
            <div key={i} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '2.5px 0',
              borderBottom: i < dim.columns.length - 1 ? '1px solid #1E3A5F44' : 'none',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                {col.pk
                  ? <Key size={10} color="#FBBF24" />
                  : <div style={{ width: 10, height: 10 }} />}
                <span style={{ color: col.pk ? '#FBBF24' : '#CBD5E1', fontSize: 11 }}>{col.name}</span>
              </div>
              <span style={{ color: '#475569', fontSize: 10 }}>{col.type}</span>
            </div>
          ))}
        </div>
      </div>
    </foreignObject>
  );
}

// ─── Fact card in center ──────────────────────────────────────────────────────
function FactCard({ fact, cx, cy, cardW, cardH }:
  { fact: any; cx: number; cy: number; cardW: number; cardH: number }) {
  return (
    <foreignObject
      x={cx - cardW / 2} y={cy - cardH / 2}
      width={cardW} height={cardH + 20}
      style={{ overflow: 'visible' }}
    >
      <div style={{
        border: `2px solid ${FACT_COLOR.border}`,
        background: FACT_COLOR.bg,
        boxShadow: `0 0 30px ${FACT_COLOR.glow}, 0 0 60px ${FACT_COLOR.glow}`,
        borderRadius: 12,
        width: cardW,
        fontFamily: 'monospace',
        fontSize: 11,
      }}>
        {/* header */}
        <div style={{
          background: FACT_COLOR.border + '33',
          borderBottom: `1px solid ${FACT_COLOR.border}55`,
          padding: '7px 12px',
          display: 'flex', alignItems: 'center', gap: 6,
          borderRadius: '10px 10px 0 0',
        }}>
          <Star size={14} color={FACT_COLOR.text} fill={FACT_COLOR.text + '33'} />
          <span style={{ color: FACT_COLOR.text, fontWeight: 700, fontSize: 12 }}>{fact?.name || 'Fact_Traffic'}</span>
          <span style={{
            marginLeft: 'auto',
            background: FACT_COLOR.border + '33',
            color: FACT_COLOR.text,
            fontSize: 9, padding: '2px 7px', borderRadius: 20, fontWeight: 600,
          }}>CENTRAL FACT</span>
        </div>
        {/* columns */}
        <div style={{ padding: '5px 10px' }}>
          {(fact?.columns || []).map((col: Col, i: number) => (
            <div key={i} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '2.5px 0',
              borderBottom: i < (fact?.columns?.length - 1) ? '1px solid #2A3F5F' : 'none',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                {col.pk
                  ? <Key size={10} color="#FBBF24" />
                  : col.measure
                    ? <BarChart2 size={10} color="#34D399" />
                    : <Link2 size={10} color="#38BDF8" />}
                <span style={{
                  color: col.pk ? '#FCD34D' : col.measure ? '#34D399' : '#38BDF8',
                  fontSize: 11,
                }}>{col.name}</span>
              </div>
              <span style={{ color: '#475569', fontSize: 10 }}>{col.type}</span>
            </div>
          ))}
        </div>
      </div>
    </foreignObject>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function StarSchema() {
  const [schema, setSchema] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDim, setSelectedDim] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 900, h: 820 });

  useEffect(() => {
    schemaApi.getStar().then(res => {
      if (res.data.success) setSchema(res.data.schema);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  // responsive width
  useEffect(() => {
    const obs = new ResizeObserver(entries => {
      const w = entries[0].contentRect.width;
      setSize({ w: Math.max(w, 700), h: Math.max(w * 0.88, 620) });
    });
    if (containerRef.current) obs.observe(containerRef.current);
    return () => obs.disconnect();
  }, []);

  if (loading) return <LoadingSpinner fullPage text="Constructing Star Schema architecture..." />;

  const dims: Dim[] = schema?.dimensions || [];
  const fact = schema?.fact_table;
  const n = dims.length;

  // layout constants
  const cx = size.w / 2;
  const cy = size.h / 2;
  const orbitR = Math.min(size.w, size.h) * 0.36;   // radius to dim card centers
  const factW = 240;
  const dimW  = 190;
  const dimH  = 30 + (dims[0]?.columns?.length ?? 6) * 22;

  // angle for each dim (evenly spaced around 360°)
  const angles = dims.map((_, i) => (360 / n) * i);
  const dimPositions = angles.map(a => polarToXY(cx, cy, orbitR, a));

  // connector endpoint: edge of fact card toward dim
  function factEdge(px: number, py: number) {
    const dx = px - cx; const dy = py - cy;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const halfW = factW / 2 + 4; const halfH = 120;
    const scaleX = Math.abs(dx) > 0 ? halfW / Math.abs(dx) : 1e9;
    const scaleY = Math.abs(dy) > 0 ? halfH / Math.abs(dy) : 1e9;
    const s = Math.min(scaleX, scaleY, 1);
    return { x: cx + dx * s, y: cy + dy * s };
  }

  // connector endpoint: edge of dim card toward center
  function dimEdge(px: number, py: number, cardW: number, cardH: number) {
    const dx = cx - px; const dy = cy - py;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const halfW = cardW / 2 + 2; const halfH = cardH / 2 + 2;
    const scaleX = Math.abs(dx) > 0 ? halfW / Math.abs(dx) : 1e9;
    const scaleY = Math.abs(dy) > 0 ? halfH / Math.abs(dy) : 1e9;
    const s = Math.min(scaleX, scaleY, 1);
    return { x: px + dx * s, y: py + dy * s };
  }

  return (
    <div className="space-y-4">
      {/* header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <Star size={18} className="text-amber-400 fill-amber-400/20" />
            Dimensional Star Schema Architecture
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Central <span className="text-amber-400 font-semibold">Fact_Traffic</span> table surrounded by{' '}
            <span className="text-sky-400 font-semibold">{n} de-normalized dimension tables</span>.
            Click any dimension card to highlight its connection.
          </p>
        </div>
        <div className="flex flex-col gap-1 text-[11px] bg-[#0D1B2E] border border-[#1E3A5F] rounded-lg px-3 py-2 shrink-0">
          <div className="flex items-center gap-2"><Key size={10} className="text-amber-400" /><span className="text-slate-400">Primary Key</span></div>
          <div className="flex items-center gap-2"><BarChart2 size={10} className="text-emerald-400" /><span className="text-slate-400">Measure</span></div>
          <div className="flex items-center gap-2"><Link2 size={10} className="text-sky-400" /><span className="text-slate-400">Foreign Key</span></div>
        </div>
      </div>

      {/* star diagram */}
      <div
        ref={containerRef}
        className="w-full bg-[#07111F] rounded-2xl border border-[#1E3A5F] overflow-hidden relative"
        style={{ minHeight: 620 }}
      >
        <svg width={size.w} height={size.h} style={{ display: 'block' }}>
          <defs>
            {/* animated dash for connectors */}
            <marker id="arrow-fact" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
              <path d="M0,0 L6,3 L0,6 Z" fill="#FBBF2488" />
            </marker>
            {dims.map((_, i) => (
              <marker key={i} id={`arrow-dim-${i}`} markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
                <path d="M0,0 L6,3 L0,6 Z" fill={DIM_COLORS[i % DIM_COLORS.length].border + '99'} />
              </marker>
            ))}
            <radialGradient id="bgGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%"   stopColor="#FBBF24" stopOpacity="0.04" />
              <stop offset="100%" stopColor="#07111F" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="orbitGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%"   stopColor="#38BDF8" stopOpacity="0.03" />
              <stop offset="100%" stopColor="transparent" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* background ambient glow */}
          <ellipse cx={cx} cy={cy} rx={orbitR * 1.5} ry={orbitR * 1.3} fill="url(#bgGlow)" />

          {/* orbit ring */}
          <circle cx={cx} cy={cy} r={orbitR} stroke="#1E3A5F" strokeWidth={1} fill="none" strokeDasharray="4 6" opacity={0.6} />

          {/* connector lines */}
          {dimPositions.map((dp, i) => {
            const fe = factEdge(dp.x, dp.y);
            const de = dimEdge(dp.x, dp.y, dimW, dimH);
            const color = DIM_COLORS[i % DIM_COLORS.length];
            const isSelected = selectedDim === i;
            return (
              <g key={i}>
                {/* glow duplicate */}
                <line
                  x1={fe.x} y1={fe.y} x2={de.x} y2={de.y}
                  stroke={color.border}
                  strokeWidth={isSelected ? 5 : 2}
                  strokeOpacity={isSelected ? 0.25 : 0.08}
                />
                {/* main line */}
                <line
                  x1={fe.x} y1={fe.y} x2={de.x} y2={de.y}
                  stroke={color.border}
                  strokeWidth={isSelected ? 2.5 : 1.5}
                  strokeOpacity={isSelected ? 0.95 : 0.45}
                  strokeDasharray={isSelected ? 'none' : '5 4'}
                  markerEnd={`url(#arrow-dim-${i})`}
                  style={{ transition: 'stroke-opacity 0.25s, stroke-width 0.25s' }}
                />
                {/* FK label on line */}
                <text
                  x={(fe.x + de.x) / 2}
                  y={(fe.y + de.y) / 2 - 5}
                  textAnchor="middle"
                  fill={color.border}
                  fontSize={9}
                  opacity={isSelected ? 0.9 : 0.4}
                  fontFamily="monospace"
                >
                  {fact?.columns?.find((c: Col) => c.fk?.startsWith(dims[i]?.name))?.name || 'FK'}
                </text>
              </g>
            );
          })}

          {/* fact table (center) */}
          <FactCard fact={fact} cx={cx} cy={cy} cardW={factW} cardH={200} />

          {/* dimension tables */}
          {dims.map((dim, i) => {
            const dp = dimPositions[i];
            const color = DIM_COLORS[i % DIM_COLORS.length];
            const h = 30 + dim.columns.length * 22;
            return (
              <DimCard
                key={i}
                dim={dim}
                color={color}
                cx={dp.x} cy={dp.y}
                cardW={dimW} cardH={h}
                selected={selectedDim === i}
                onClick={() => setSelectedDim(selectedDim === i ? null : i)}
              />
            );
          })}

          {/* center star dot */}
          <circle cx={cx} cy={cy - 125} r={4} fill="#FBBF24" opacity={0.5} />
        </svg>
      </div>

      {/* selected dim detail panel */}
      {selectedDim !== null && (
        <div
          className="rounded-xl border p-4 transition-all duration-300"
          style={{
            borderColor: DIM_COLORS[selectedDim % DIM_COLORS.length].border + '60',
            background: DIM_COLORS[selectedDim % DIM_COLORS.length].bg,
            boxShadow: `0 0 20px ${DIM_COLORS[selectedDim % DIM_COLORS.length].glow}`,
          }}
        >
          <div className="flex items-center gap-2 mb-3">
            <Info size={14} style={{ color: DIM_COLORS[selectedDim % DIM_COLORS.length].text }} />
            <span className="font-bold text-sm font-mono" style={{ color: DIM_COLORS[selectedDim % DIM_COLORS.length].text }}>
              {dims[selectedDim]?.name}
            </span>
            <span className="text-xs text-slate-500 ml-2">— Dimension Detail</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
            {dims[selectedDim]?.columns.map((col: Col, i: number) => (
              <div key={i} className="bg-[#07111F] rounded-lg px-3 py-2 border border-[#1E3A5F]">
                <div className="flex items-center gap-1.5 mb-0.5">
                  {col.pk ? <Key size={10} className="text-amber-400" /> : <div className="w-2.5" />}
                  <span className={`text-xs font-mono font-medium ${col.pk ? 'text-amber-400' : 'text-slate-200'}`}>{col.name}</span>
                </div>
                <span className="text-[10px] text-slate-500 font-mono">{col.type}</span>
              </div>
            ))}
          </div>
          <div className="mt-3 text-[11px] text-slate-500 flex items-center gap-2">
            <span>Linked to <span className="text-amber-400">Fact_Traffic</span> via</span>
            <code className="bg-[#07111F] border border-[#1E3A5F] px-2 py-0.5 rounded text-sky-400 text-[11px]">
              {fact?.columns?.find((c: Col) => c.fk?.startsWith(dims[selectedDim]?.name))?.name || '—'}
            </code>
            <span className="ml-auto cursor-pointer text-slate-600 hover:text-slate-400" onClick={() => setSelectedDim(null)}>✕ close</span>
          </div>
        </div>
      )}

      {/* summary footer */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Fact Table', value: '1', sub: 'Fact_Traffic', color: '#FBBF24' },
          { label: 'Dimension Tables', value: String(n), sub: 'De-normalized', color: '#38BDF8' },
          { label: 'Fact Measures', value: String(fact?.columns?.filter((c: Col) => c.measure).length || 7), sub: 'Numeric KPIs', color: '#34D399' },
          { label: 'FK Relations', value: String(n), sub: '1:N joins', color: '#A78BFA' },
        ].map((stat, i) => (
          <div key={i} className="bg-[#14243A] border border-[#1E3A5F] rounded-xl px-4 py-3 flex items-center gap-3">
            <span className="text-2xl font-bold font-mono" style={{ color: stat.color }}>{stat.value}</span>
            <div>
              <div className="text-xs font-semibold text-slate-300">{stat.label}</div>
              <div className="text-[10px] text-slate-500">{stat.sub}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
