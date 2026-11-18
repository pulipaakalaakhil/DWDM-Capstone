import React, { useEffect, useState, useRef } from 'react';
import { Canvas, useFrame, ThreeEvent } from '@react-three/fiber';
import { OrbitControls, Text, Html } from '@react-three/drei';
import * as THREE from 'three';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { olapApi } from '../api/client';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { Box, RotateCcw, ZoomIn, ZoomOut, Layers } from 'lucide-react';

const CONGESTION_COLORS = ['#22C55E', '#84CC16', '#FACC15', '#F97316', '#EF4444'];
const HOUR_LABELS = ['00h', '06h', '08h', '12h', '18h', '20h', '22h'];

interface CubeCell {
  x: number; y: number; z: number;
  hour: number; hour_label: string;
  area: string; congestion: string;
  traffic_volume: number; avg_speed: number; count: number;
}

interface CubeCellMeshProps {
  cell: CubeCell;
  xIdx: number; yIdx: number; zIdx: number;
  onSelect: (cell: CubeCell) => void;
  selected: boolean;
}

function CubeCellMesh({ cell, xIdx, yIdx, zIdx, onSelect, selected }: CubeCellMeshProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  const maxVol = 3000;
  const heightScale = Math.max(0.15, cell.traffic_volume / maxVol * 1.5);
  const color = CONGESTION_COLORS[cell.z] || '#22D3EE';

  useFrame(() => {
    if (meshRef.current) {
      const targetScale = hovered || selected ? 1.12 : 1;
      meshRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.12);
    }
  });

  const posX = (xIdx - 3) * 1.3;
  const posY = heightScale / 2 - 0.5;
  const posZ = (yIdx - 2) * 1.4;

  return (
    <group position={[posX, posY, posZ]}>
      <mesh
        ref={meshRef}
        onClick={() => onSelect(cell)}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
        castShadow
      >
        <boxGeometry args={[0.9, heightScale, 0.9]} />
        <meshStandardMaterial
          color={color}
          transparent
          opacity={selected ? 1 : hovered ? 0.9 : 0.75}
          emissive={color}
          emissiveIntensity={selected ? 0.5 : hovered ? 0.3 : 0.1}
          wireframe={false}
        />
      </mesh>
      {selected && (
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[0.95, heightScale + 0.05, 0.95]} />
          <meshStandardMaterial color="#38BDF8" wireframe transparent opacity={0.4} />
        </mesh>
      )}
      {(hovered || selected) && (
        <Html position={[0, heightScale / 2 + 0.4, 0]} center distanceFactor={8}>
          <div className="bg-[#0D1B2E] border border-[#1E3A5F] rounded-lg p-2 text-xs whitespace-nowrap shadow-xl pointer-events-none">
            <div className="text-sky-400 font-semibold">{cell.area}</div>
            <div className="text-slate-400">{cell.hour_label}</div>
            <div className="text-slate-300">Vol: <span className="text-white font-medium">{Math.round(cell.traffic_volume)}</span></div>
            <div className="text-slate-300">Speed: <span className="text-cyan-400">{cell.avg_speed} km/h</span></div>
            <div className="text-slate-300">Congestion: <span style={{ color: CONGESTION_COLORS[cell.z] }}>{cell.congestion}</span></div>
          </div>
        </Html>
      )}
    </group>
  );
}

function AxisLabels({ xLabels, yLabels }: { xLabels: string[]; yLabels: string[] }) {
  return (
    <>
      {xLabels.map((label, i) => (
        <Text key={`x-${i}`} position={[(i - 3) * 1.3, -1.2, (yLabels.length / 2) * 1.4]}
          fontSize={0.22} color="#64748B" anchorX="center" anchorY="top">
          {label}
        </Text>
      ))}
      {yLabels.map((label, i) => (
        <Text key={`y-${i}`} position={[-xLabels.length * 0.7, -1.2, (i - 2) * 1.4]}
          fontSize={0.2} color="#64748B" anchorX="right" anchorY="middle">
          {label.slice(0, 10)}
        </Text>
      ))}
      <Text position={[0, -1.8, yLabels.length * 0.9]} fontSize={0.25} color="#38BDF8" anchorX="center">Time →</Text>
      <Text position={[-xLabels.length * 0.85, -1.8, 0]} fontSize={0.25} color="#22D3EE" anchorX="right">Location →</Text>
    </>
  );
}

function GridFloor({ xSize, zSize }: { xSize: number; zSize: number }) {
  return (
    <gridHelper args={[xSize * 1.3, xSize, '#1E3A5F', '#0D1B2E']} position={[0, -1.1, 0]} />
  );
}

export default function OLAPCube() {
  const [cubeData, setCubeData] = useState<any>(null);
  const [selectedCell, setSelectedCell] = useState<CubeCell | null>(null);
  const [loading, setLoading] = useState(true);
  const [operation, setOperation] = useState<string>('');
  const [opResult, setOpResult] = useState<any>(null);
  const [opLoading, setOpLoading] = useState(false);
  const [rollupLevel, setRollupLevel] = useState('hourly');
  const [sliceDim, setSliceDim] = useState('hour');
  const [sliceVal, setSliceVal] = useState('8');
  const [diceArea, setDiceArea] = useState('');
  const [diceHourStart, setDiceHourStart] = useState('7');
  const [diceHourEnd, setDiceHourEnd] = useState('20');
  const [pivotRow, setPivotRow] = useState('Area Name');
  const [pivotCol, setPivotCol] = useState('Congestion Level');
  const [measure, setMeasure] = useState('Traffic Volume');

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await olapApi.getCubeData();
        if (res.data.success) setCubeData(res.data);
      } catch {}
      setLoading(false);
    };
    fetch();
  }, []);

  const runOp = async (op: string) => {
    setOperation(op);
    setOpLoading(true);
    setOpResult(null);
    try {
      let res;
      if (op === 'rollup') res = await olapApi.rollup(rollupLevel, measure);
      else if (op === 'drilldown') res = await olapApi.drilldown(diceArea || undefined, undefined, measure);
      else if (op === 'slice') res = await olapApi.slice(sliceDim, sliceVal, measure);
      else if (op === 'dice') res = await olapApi.dice({ area: diceArea || undefined, hour_start: +diceHourStart, hour_end: +diceHourEnd, measure });
      else if (op === 'pivot') res = await olapApi.pivot(pivotRow, pivotCol, measure, 'mean');
      if (res?.data?.success) setOpResult(res.data);
    } catch {}
    setOpLoading(false);
  };

  const cells = cubeData?.cells || [];
  const xLabels = cubeData?.x_labels || HOUR_LABELS;
  const yLabels = cubeData?.y_labels || [];

  const uniqueX = [...new Set(cells.map((c: CubeCell) => c.x))].sort();
  const uniqueY = [...new Set(cells.map((c: CubeCell) => c.area))];

  const opData = opResult?.data || [];
  const chartKey = opResult?.operation === 'Pivot' ? null : (opData[0] ? Object.keys(opData[0]).filter(k => k !== 'dimension' && k !== 'period' && k !== 'area' && k !== 'hour' && k !== 'label')[0] : 'avg');

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-bold text-slate-100">Interactive 3D OLAP Cube</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          X: Time (Hour) · Y: Location (Area) · Z/Color: Congestion Level · Height: Traffic Volume
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-4">
        {/* OLAP Controls */}
        <div className="bg-[#14243A] border border-[#1E3A5F] rounded-xl p-4 space-y-4">
          <h3 className="text-sm font-semibold text-slate-200">OLAP Operations</h3>

          <div>
            <label className="text-xs text-slate-400 mb-1 block">Measure</label>
            <select value={measure} onChange={e => setMeasure(e.target.value)} className="w-full bg-[#07111F] border border-[#1E3A5F] text-xs text-slate-300 rounded-lg px-2 py-1.5 outline-none">
              {['Traffic Volume', 'Average Speed (km/h)', 'Road Capacity Utilization (%)'].map(m => <option key={m}>{m}</option>)}
            </select>
          </div>

          {/* Roll-Up */}
          <div className="border border-[#1E3A5F] rounded-lg p-2.5 space-y-2">
            <div className="text-xs text-sky-400 font-semibold">📊 Roll-Up</div>
            <select value={rollupLevel} onChange={e => setRollupLevel(e.target.value)} className="w-full bg-[#07111F] border border-[#1E3A5F] text-xs text-slate-300 rounded px-2 py-1.5 outline-none">
              <option value="hourly">Hourly → Daily</option>
              <option value="daily">Daily → Monthly</option>
              <option value="monthly">Monthly → Yearly</option>
            </select>
            <button onClick={() => runOp('rollup')} className="w-full text-xs bg-sky-500/15 hover:bg-sky-500/25 border border-sky-500/30 text-sky-400 py-1.5 rounded-lg transition-colors">Run Roll-Up</button>
          </div>

          {/* Drill-Down */}
          <div className="border border-[#1E3A5F] rounded-lg p-2.5 space-y-2">
            <div className="text-xs text-cyan-400 font-semibold">🔍 Drill-Down</div>
            <input value={diceArea} onChange={e => setDiceArea(e.target.value)} placeholder="Area (optional)" className="w-full bg-[#07111F] border border-[#1E3A5F] text-xs text-slate-300 rounded px-2 py-1.5 outline-none" />
            <button onClick={() => runOp('drilldown')} className="w-full text-xs bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/30 text-cyan-400 py-1.5 rounded-lg transition-colors">Run Drill-Down</button>
          </div>

          {/* Slice */}
          <div className="border border-[#1E3A5F] rounded-lg p-2.5 space-y-2">
            <div className="text-xs text-green-400 font-semibold">✂️ Slice</div>
            <select value={sliceDim} onChange={e => setSliceDim(e.target.value)} className="w-full bg-[#07111F] border border-[#1E3A5F] text-xs text-slate-300 rounded px-2 py-1.5 outline-none">
              <option value="hour">Hour</option>
              <option value="day">Day of Week</option>
              <option value="month">Month</option>
              <option value="congestion">Congestion</option>
            </select>
            <input value={sliceVal} onChange={e => setSliceVal(e.target.value)} placeholder="Value (e.g. 8)" className="w-full bg-[#07111F] border border-[#1E3A5F] text-xs text-slate-300 rounded px-2 py-1.5 outline-none" />
            <button onClick={() => runOp('slice')} className="w-full text-xs bg-green-500/15 hover:bg-green-500/25 border border-green-500/30 text-green-400 py-1.5 rounded-lg transition-colors">Run Slice</button>
          </div>

          {/* Dice */}
          <div className="border border-[#1E3A5F] rounded-lg p-2.5 space-y-2">
            <div className="text-xs text-yellow-400 font-semibold">🎲 Dice</div>
            <div className="flex gap-1">
              <input value={diceHourStart} onChange={e => setDiceHourStart(e.target.value)} placeholder="Hr start" className="w-1/2 bg-[#07111F] border border-[#1E3A5F] text-xs text-slate-300 rounded px-2 py-1.5 outline-none" />
              <input value={diceHourEnd} onChange={e => setDiceHourEnd(e.target.value)} placeholder="Hr end" className="w-1/2 bg-[#07111F] border border-[#1E3A5F] text-xs text-slate-300 rounded px-2 py-1.5 outline-none" />
            </div>
            <button onClick={() => runOp('dice')} className="w-full text-xs bg-yellow-500/15 hover:bg-yellow-500/25 border border-yellow-500/30 text-yellow-400 py-1.5 rounded-lg transition-colors">Run Dice</button>
          </div>

          {/* Pivot */}
          <div className="border border-[#1E3A5F] rounded-lg p-2.5 space-y-2">
            <div className="text-xs text-purple-400 font-semibold">🔄 Pivot</div>
            <select value={pivotRow} onChange={e => setPivotRow(e.target.value)} className="w-full bg-[#07111F] border border-[#1E3A5F] text-xs text-slate-300 rounded px-2 py-1.5 outline-none">
              {['Area Name', 'Weather Conditions', 'Congestion Level'].map(r => <option key={r}>{r}</option>)}
            </select>
            <select value={pivotCol} onChange={e => setPivotCol(e.target.value)} className="w-full bg-[#07111F] border border-[#1E3A5F] text-xs text-slate-300 rounded px-2 py-1.5 outline-none">
              {['Congestion Level', 'Weather Conditions'].map(c => <option key={c}>{c}</option>)}
            </select>
            <button onClick={() => runOp('pivot')} className="w-full text-xs bg-purple-500/15 hover:bg-purple-500/25 border border-purple-500/30 text-purple-400 py-1.5 rounded-lg transition-colors">Run Pivot</button>
          </div>
        </div>

        {/* 3D Cube + Results */}
        <div className="xl:col-span-3 space-y-4">
          {/* 3D Canvas */}
          <div className="bg-[#0D1B2E] border border-[#1E3A5F] rounded-xl overflow-hidden" style={{ height: 420 }}>
            {loading ? (
              <div className="flex items-center justify-center h-full"><LoadingSpinner text="Loading 3D cube..." /></div>
            ) : (
              <Canvas camera={{ position: [8, 6, 10], fov: 50 }} shadows>
                <color attach="background" args={['#07111F']} />
                <ambientLight intensity={0.6} />
                <directionalLight position={[10, 10, 5]} intensity={0.8} castShadow />
                <pointLight position={[-5, 8, -5]} intensity={0.4} color="#38BDF8" />
                <pointLight position={[5, -2, 5]} intensity={0.2} color="#22D3EE" />
                <OrbitControls enablePan enableZoom enableRotate autoRotate={false} />
                <GridFloor xSize={uniqueX.length} zSize={uniqueY.length} />
                <AxisLabels xLabels={xLabels} yLabels={yLabels} />
                {cells.map((cell: CubeCell, i: number) => {
                  const xIdx = uniqueX.indexOf(cell.x);
                  const yIdx = uniqueY.indexOf(cell.area);
                  const zIdx = cell.z;
                  return (
                    <CubeCellMesh key={i} cell={cell} xIdx={xIdx} yIdx={yIdx} zIdx={zIdx}
                      onSelect={setSelectedCell}
                      selected={selectedCell?.area === cell.area && selectedCell?.hour === cell.hour}
                    />
                  );
                })}
              </Canvas>
            )}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 flex-wrap px-1">
            {['Free Flow', 'Low', 'Moderate', 'High', 'Severe'].map((l, i) => (
              <div key={l} className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-sm" style={{ background: CONGESTION_COLORS[i] }} />
                <span className="text-xs text-slate-400">{l}</span>
              </div>
            ))}
            <span className="text-xs text-slate-600 ml-auto">Drag to rotate • Scroll to zoom</span>
          </div>

          {/* Selected Cell Details */}
          {selectedCell && (
            <div className="bg-[#14243A] border border-sky-400/30 rounded-xl p-4">
              <h3 className="text-sm font-semibold text-sky-400 mb-3">Selected Cell Details</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { l: 'Time', v: selectedCell.hour_label },
                  { l: 'Area', v: selectedCell.area },
                  { l: 'Congestion', v: selectedCell.congestion },
                  { l: 'Records', v: selectedCell.count },
                  { l: 'Avg Traffic', v: Math.round(selectedCell.traffic_volume).toLocaleString() },
                  { l: 'Avg Speed', v: `${selectedCell.avg_speed} km/h` },
                ].map(({ l, v }) => (
                  <div key={l} className="bg-[#07111F] rounded-lg p-2.5">
                    <div className="text-[10px] text-slate-500 mb-0.5">{l}</div>
                    <div className="text-sm font-semibold text-slate-200">{v}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Operation Results */}
          {opLoading && <LoadingSpinner fullPage text={`Running ${operation}...`} />}
          {opResult && !opLoading && (
            <div className="bg-[#14243A] border border-[#1E3A5F] rounded-xl p-4">
              <h3 className="text-sm font-semibold text-slate-200 mb-1">
                <span className="text-sky-400">{opResult.operation}</span> Results
                <span className="text-slate-500 text-xs ml-2">— {opResult.measure || measure}</span>
              </h3>
              {opResult.records_in_slice !== undefined && <p className="text-xs text-slate-500 mb-3">Records in slice: {opResult.records_in_slice?.toLocaleString()}</p>}

              {opResult.operation === 'Pivot' ? (
                <div className="overflow-x-auto">
                  <table className="text-xs data-table w-full">
                    <thead><tr>
                      <th className="text-slate-400 text-left font-medium">{opResult.row_dimension}</th>
                      {(opResult.columns || []).map((c: string) => <th key={c} className="text-slate-400 font-medium text-right">{c}</th>)}
                    </tr></thead>
                    <tbody>
                      {(opResult.data || []).map((row: any, i: number) => (
                        <tr key={i}>
                          <td className="text-slate-300 font-medium">{row.dimension}</td>
                          {(opResult.columns || []).map((c: string) => <td key={c} className="text-right text-sky-400">{Math.round(row[c] || 0).toLocaleString()}</td>)}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="h-52">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={opData} margin={{ top: 5, right: 10, left: -20, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1E3A5F" />
                      <XAxis dataKey={opData[0]?.period !== undefined ? 'period' : opData[0]?.area !== undefined ? 'area' : 'label'} tick={{ fill: '#64748B', fontSize: 10 }} angle={-20} textAnchor="end" interval={0} />
                      <YAxis tick={{ fill: '#64748B', fontSize: 10 }} />
                      <Tooltip contentStyle={{ background: '#0D1B2E', border: '1px solid #1E3A5F', borderRadius: 8, fontSize: 11 }} />
                      <Bar dataKey="avg" name="Average" fill="#38BDF8" radius={[3, 3, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
