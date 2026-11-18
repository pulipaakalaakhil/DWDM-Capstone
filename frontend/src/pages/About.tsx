import React from 'react';
import { Info, Target, Cpu, Database, CheckCircle, Code2, Layers, BookOpen } from 'lucide-react';

export default function About() {
  const techStack = [
    { category: 'Frontend', items: ['React 18', 'TypeScript', 'Vite', 'Tailwind CSS', 'Framer Motion', 'Lucide React'] },
    { category: '3D Visualization & Maps', items: ['Three.js', 'React Three Fiber', '@react-three/drei', 'Leaflet', 'React Leaflet'] },
    { category: 'Analytics & Charts', items: ['Recharts', 'Plotly Architecture', 'OLAP Cube Engine'] },
    { category: 'Backend & APIs', items: ['Python 3.13', 'FastAPI', 'RESTful API', 'WebSockets Stream', 'Uvicorn'] },
    { category: 'Data & Warehousing', items: ['Pandas', 'NumPy', 'SciPy', 'SQLite / PostgreSQL', 'Star / Snowflake Schema'] },
    { category: 'Machine Learning & Mining', items: ['Scikit-learn', 'Random Forest', 'Decision Trees', 'K-Means Clustering', 'DBSCAN'] },
  ];

  const objectives = [
    'Analyze multi-year historical Bangalore road traffic sensor and observation datasets.',
    'Identify recurring traffic congestion patterns across peak hours, weekdays, weekends, and weather events.',
    'Detect spatial and intensity-based traffic hotspots using density clustering (DBSCAN) and centroid segmentation (K-Means).',
    'Forecast future traffic volume and classify upcoming congestion levels using supervised ensemble models.',
    'Design, implement, and visualize multi-dimensional OLAP data cube with Roll-Up, Drill-Down, Slice, Dice, and Pivot operations.',
    'Model database schemas across 3rd Normal Form (3NF), Dimensional Star Schema, and Normalized Snowflake Schema.',
    'Provide an interactive, responsive command-center dashboard for municipal smart city transportation intelligence.'
  ];

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h2 className="text-xl font-bold text-slate-100">Traffic Pattern Analysis & Congestion Prediction</h2>
        <p className="text-xs text-sky-400 mt-1">Smart City Data Warehousing & Data Mining Capstone Platform</p>
      </div>

      <div className="bg-[#14243A] border border-[#1E3A5F] rounded-xl p-6">
        <h3 className="text-sm font-semibold text-slate-200 mb-2 flex items-center gap-2">
          <BookOpen size={16} className="text-sky-400" />
          Project Overview
        </h3>
        <p className="text-xs text-slate-300 leading-relaxed">
          Rapid urbanization and escalating vehicular density in Bengaluru (Bangalore) have resulted in severe bottleneck choke-points, prolonged transit delays, and elevated environmental emissions. This web platform integrates modern data warehousing (DW) architectures, online analytical processing (OLAP), and data mining (DM) pipelines to derive actionable urban mobility insights. By correlating historical vehicular volume, velocity indices, capacity utilization, incident counts, and weather variations, the system serves municipal planners and commuters with predictive intelligence and real-time situational awareness.
        </p>
      </div>

      {/* Objectives */}
      <div className="bg-[#14243A] border border-[#1E3A5F] rounded-xl p-6">
        <h3 className="text-sm font-semibold text-slate-200 mb-4 flex items-center gap-2">
          <Target size={16} className="text-emerald-400" />
          Key Research & Engineering Objectives
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {objectives.map((obj, i) => (
            <div key={i} className="flex items-start gap-2.5 text-xs text-slate-300 bg-[#07111F] p-3 rounded-lg border border-[#1E3A5F]/50">
              <CheckCircle size={14} className="text-sky-400 flex-shrink-0 mt-0.5" />
              <span>{obj}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Tech Stack */}
      <div className="bg-[#14243A] border border-[#1E3A5F] rounded-xl p-6">
        <h3 className="text-sm font-semibold text-slate-200 mb-4 flex items-center gap-2">
          <Code2 size={16} className="text-cyan-400" />
          Technology Stack Architecture
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {techStack.map((stack, i) => (
            <div key={i} className="bg-[#07111F] border border-[#1E3A5F] p-4 rounded-xl">
              <h4 className="text-xs font-semibold text-sky-400 mb-2.5">{stack.category}</h4>
              <div className="flex flex-wrap gap-1.5">
                {stack.items.map((item, j) => (
                  <span key={j} className="text-[11px] bg-[#14243A] text-slate-300 px-2 py-0.5 rounded border border-[#1E3A5F]">
                    {item}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Methodology and Pipeline */}
      <div className="bg-[#14243A] border border-[#1E3A5F] rounded-xl p-6">
        <h3 className="text-sm font-semibold text-slate-200 mb-3 flex items-center gap-2">
          <Layers size={16} className="text-purple-400" />
          Data Engineering & Mining Methodology
        </h3>
        <div className="space-y-3 text-xs text-slate-300">
          <div className="p-3 bg-[#07111F] rounded-lg border border-[#1E3A5F]">
            <strong className="text-slate-100">1. Data Ingestion & Cleansing:</strong> Automated parsing of spatio-temporal road records, IQR-driven outlier clipping for travel velocities, and missing-value imputation.
          </div>
          <div className="p-3 bg-[#07111F] rounded-lg border border-[#1E3A5F]">
            <strong className="text-slate-100">2. Dimensional Modeling & OLAP Cube:</strong> Extraction of hierarchical time, location, and condition dimensions powering sub-second Roll-up, Drill-down, and Slicing operations.
          </div>
          <div className="p-3 bg-[#07111F] rounded-lg border border-[#1E3A5F]">
            <strong className="text-slate-100">3. Pattern Discovery & Hotspot Clustering:</strong> Unsupervised K-Means and DBSCAN grouping to partition intersections by vulnerability score.
          </div>
          <div className="p-3 bg-[#07111F] rounded-lg border border-[#1E3A5F]">
            <strong className="text-slate-100">4. Supervised Forecasting:</strong> Decision Trees, Random Forests, and Gradient Boosting ensembles evaluated using Accuracy, F1-Score, MAE, and RMSE metrics.
          </div>
        </div>
      </div>
    </div>
  );
}
