import React, { useState, useRef, useEffect } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Activity, Map, TrendingUp, Database, Settings2,
  Cpu, Brain, Flame, Box, Server, GitBranch, Star, Snowflake,
  BarChart3, PieChart, FileText, Info, SlidersHorizontal,
  ChevronLeft, ChevronRight, Bell, Search, CheckCircle2,
  AlertTriangle, ShieldAlert, ArrowRight, ExternalLink,
  User, Check, X, ShieldCheck
} from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { useAuth } from '../contexts/AuthContext';

const navItems = [
  { path: '/', label: 'Overview Dashboard', icon: LayoutDashboard, category: 'Monitoring' },
  { path: '/live', label: 'Live Traffic', icon: Activity, category: 'Monitoring' },
  { path: '/map-3d', label: '3D Traffic Map', icon: Map, category: 'GIS & Visual' },
  { path: '/patterns', label: 'Pattern Analysis', icon: TrendingUp, category: 'Analytics' },
  { path: '/db-architecture', label: 'DB Architecture', icon: Server, category: 'Data Warehouse' },
  { path: '/normalized-schema', label: 'Normalized Schema', icon: GitBranch, category: 'Data Warehouse' },
  { path: '/star-schema', label: 'Star Schema', icon: Star, category: 'Data Warehouse' },
  { path: '/snowflake-schema', label: 'Snowflake Schema', icon: Snowflake, category: 'Data Warehouse' },
  { path: '/olap-cube', label: '3D OLAP Cube', icon: Box, category: 'Data Warehouse' },
  { path: '/olap-analytics', label: 'OLAP Analytics', icon: BarChart3, category: 'Data Warehouse' },
  { path: '/exploration', label: 'Data Exploration', icon: Database, category: 'Data Management' },
  { path: '/preprocessing', label: 'Data Preprocessing', icon: Settings2, category: 'Data Management' },
  { path: '/mining', label: 'Data Mining', icon: Cpu, category: 'Machine Learning' },
  { path: '/ml-prediction', label: 'ML Prediction', icon: Brain, category: 'Machine Learning' },
  { path: '/hotspots', label: 'Hotspot Detection', icon: Flame, category: 'Analytics' },
  { path: '/bi-analytics', label: 'BI Analytics', icon: PieChart, category: 'Analytics' },
  { path: '/reports', label: 'Reports & Export', icon: FileText, category: 'Reporting' },
  { path: '/about', label: 'About Project', icon: Info, category: 'System' },
  { path: '/settings', label: 'Settings', icon: SlidersHorizontal, category: 'System' },
];

const DEFAULT_ALERTS = [
  {
    id: 1,
    type: 'severe',
    title: 'Severe Congestion Spike',
    area: 'Silk Board Junction - Hosur Rd',
    message: 'Average vehicle speed dropped below 11.4 km/h. Capacity utilization at 94%.',
    time: '2 mins ago',
    severity: 'Severe'
  },
  {
    id: 2,
    type: 'warning',
    title: 'High Inflow Surge',
    area: 'Koramangala 80ft Road',
    message: 'Traffic volume exceeded 1,840 veh/hr during evening peak cycle.',
    time: '7 mins ago',
    severity: 'High'
  },
  {
    id: 3,
    type: 'info',
    title: 'Sensor Stream Health',
    area: 'Bangalore Metropolitan Area',
    message: 'All 15 urban zones active. 15,000 observation records synchronized.',
    time: '12 mins ago',
    severity: 'Normal'
  }
];

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const { sidebarCollapsed, setSidebarCollapsed, summary, alerts } = useApp();
  const { user, logout, isAuthenticated } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const currentPage = navItems.find(n => n.path === location.pathname)?.label || 'Dashboard';

  // Dropdown states
  const [showDatasetModal, setShowDatasetModal] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [readAlertIds, setReadAlertIds] = useState<number[]>([]);

  const topNavRef = useRef<HTMLDivElement>(null);

  // Close menus on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (topNavRef.current && !topNavRef.current.contains(event.target as Node)) {
        setShowDatasetModal(false);
        setShowNotifications(false);
        setShowProfile(false);
        setShowSearchResults(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filtered search items
  const filteredNav = searchQuery.trim() === ''
    ? []
    : navItems.filter(item =>
        item.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.category.toLowerCase().includes(searchQuery.toLowerCase())
      );

  const activeAlertsList = alerts && alerts.length > 0
    ? alerts.map((a, idx) => ({
        id: idx + 10,
        type: a.severity?.toLowerCase() || 'warning',
        title: `${a.area} Alert`,
        area: a.area,
        message: a.message || 'Elevated congestion detected on road corridor.',
        time: a.timestamp ? new Date(a.timestamp).toLocaleTimeString() : 'Just now',
        severity: a.severity || 'High'
      }))
    : DEFAULT_ALERTS;

  const unreadCount = activeAlertsList.filter(a => !readAlertIds.includes(a.id)).length;

  return (
    <div className="flex h-screen overflow-hidden bg-[#07111F]">
      {/* Sidebar */}
      <motion.aside
        animate={{ width: sidebarCollapsed ? 60 : 248 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className="flex-shrink-0 bg-[#0D1B2E] border-r border-[#1E3A5F] flex flex-col overflow-hidden z-20"
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-3 border-b border-[#1E3A5F] h-16 flex-shrink-0">
          {!sidebarCollapsed && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-sky-400 to-cyan-500 flex items-center justify-center flex-shrink-0 shadow-lg shadow-sky-500/20">
                <Activity size={16} className="text-white" />
              </div>
              <div className="overflow-hidden">
                <div className="text-xs font-bold text-sky-400 leading-tight whitespace-nowrap">Traffic Intelligence</div>
                <div className="text-[10px] text-slate-500 leading-tight whitespace-nowrap">Bangalore Smart City</div>
              </div>
            </motion.div>
          )}
          {sidebarCollapsed && (
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-sky-400 to-cyan-500 flex items-center justify-center mx-auto shadow-lg shadow-sky-500/20">
              <Activity size={16} className="text-white" />
            </div>
          )}
          {!sidebarCollapsed && (
            <button
              onClick={() => setSidebarCollapsed(true)}
              className="p-1.5 rounded-lg hover:bg-[#1E3A5F] text-slate-500 hover:text-sky-400 transition-colors flex-shrink-0"
              title="Collapse sidebar"
            >
              <ChevronLeft size={15} />
            </button>
          )}
        </div>
        {sidebarCollapsed && (
          <button
            onClick={() => setSidebarCollapsed(false)}
            className="flex justify-center py-2 text-slate-500 hover:text-sky-400 transition-colors"
            title="Expand sidebar"
          >
            <ChevronRight size={15} />
          </button>
        )}

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-2 space-y-0.5 px-2">
          {navItems.map(({ path, label, icon: Icon }) => (
            <NavLink
              key={path}
              to={path}
              title={sidebarCollapsed ? label : undefined}
              className={({ isActive }) =>
                `flex items-center gap-3 px-2.5 py-2 rounded-lg text-xs font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-[#1A3352] text-sky-400 border border-sky-400/20 shadow-sm'
                    : 'text-slate-400 hover:bg-[#162030] hover:text-slate-200'
                }`
              }
            >
              <Icon size={15} className="flex-shrink-0" />
              {!sidebarCollapsed && <span className="truncate whitespace-nowrap">{label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        {!sidebarCollapsed && (
          <div className="p-3 border-t border-[#1E3A5F] bg-[#0A1626]/50">
            <div className="text-[10px] text-slate-500 flex items-center justify-between">
              <div>
                <div className="text-slate-400 font-medium mb-0.5">Dataset Status</div>
                <div className="text-slate-300 font-mono">{summary ? `${summary.total_records.toLocaleString()} records` : '15,000 records'}</div>
              </div>
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" title="Live Synced" />
            </div>
          </div>
        )}
      </motion.aside>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Top Bar */}
        <header ref={topNavRef} className="h-16 bg-[#0D1B2E] border-b border-[#1E3A5F] flex items-center px-4 gap-3 flex-shrink-0 relative z-30">
          <div className="flex-1 flex items-center gap-3 min-w-0">
            <h1 className="text-sm font-semibold text-slate-200 hidden sm:block truncate">{currentPage}</h1>

            {/* Global Search */}
            <div className="relative flex-1 max-w-xs">
              <div className="flex items-center bg-[#14243A] border border-[#1E3A5F] rounded-lg px-3 py-1.5 gap-2 focus-within:border-sky-400/50 transition-colors">
                <Search size={13} className="text-slate-500 flex-shrink-0" />
                <input
                  type="text"
                  placeholder="Quick search modules..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setShowSearchResults(true);
                  }}
                  onFocus={() => setShowSearchResults(true)}
                  className="bg-transparent text-xs text-slate-200 placeholder-slate-500 outline-none flex-1 w-full"
                />
                {searchQuery && (
                  <button onClick={() => { setSearchQuery(''); setShowSearchResults(false); }} className="text-slate-500 hover:text-slate-300">
                    <X size={12} />
                  </button>
                )}
              </div>

              {/* Search Results Dropdown */}
              <AnimatePresence>
                {showSearchResults && filteredNav.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    className="absolute left-0 right-0 mt-1.5 bg-[#0D1B2E] border border-[#1E3A5F] rounded-xl shadow-2xl p-2 z-50 max-h-72 overflow-y-auto"
                  >
                    <div className="text-[10px] uppercase font-mono tracking-wider text-slate-500 px-2 py-1">Quick Navigation</div>
                    {filteredNav.map(item => {
                      const Icon = item.icon;
                      return (
                        <button
                          key={item.path}
                          onClick={() => {
                            navigate(item.path);
                            setShowSearchResults(false);
                            setSearchQuery('');
                          }}
                          className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-[#16273D] text-left transition-colors group"
                        >
                          <div className="flex items-center gap-2.5">
                            <Icon size={14} className="text-sky-400 group-hover:scale-110 transition-transform" />
                            <span className="text-xs text-slate-200 font-medium">{item.label}</span>
                          </div>
                          <span className="text-[10px] text-slate-500 font-mono bg-[#14243A] px-1.5 py-0.5 rounded border border-[#1E3A5F]">
                            {item.category}
                          </span>
                        </button>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Action Center (Interactive) */}
          <div className="flex items-center gap-2.5 relative">
            {/* 1. Bangalore Dataset Badge (Interactive Popover) */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowDatasetModal(!showDatasetModal);
                  setShowNotifications(false);
                  setShowProfile(false);
                }}
                className={`flex items-center gap-2 bg-[#14243A] border rounded-lg px-3 py-1.5 transition-all cursor-pointer ${
                  showDatasetModal ? 'border-sky-400 bg-[#1A3352] shadow-md shadow-sky-500/10' : 'border-[#1E3A5F] hover:border-slate-500'
                }`}
                title="Click to view Bangalore Dataset details"
              >
                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                <span className="text-[11px] text-slate-200 font-medium">Bangalore Dataset</span>
              </button>

              {/* Dataset Popover Panel */}
              <AnimatePresence>
                {showDatasetModal && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 4 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 4 }}
                    className="absolute right-0 mt-2 w-80 bg-[#0D1B2E] border border-sky-400/40 rounded-xl shadow-2xl p-4 z-50 text-xs"
                  >
                    <div className="flex items-center justify-between pb-3 border-b border-[#1E3A5F]">
                      <div className="flex items-center gap-2">
                        <Database size={15} className="text-sky-400" />
                        <span className="font-bold text-slate-100">Dataset Overview</span>
                      </div>
                      <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-semibold">
                        ACTIVE • CONNECTED
                      </span>
                    </div>

                    <div className="py-3 space-y-2.5">
                      <div className="flex justify-between items-center text-[11px]">
                        <span className="text-slate-400">Source:</span>
                        <span className="text-slate-200 font-mono">IoT Smart City Sensors</span>
                      </div>
                      <div className="flex justify-between items-center text-[11px]">
                        <span className="text-slate-400">Total Records:</span>
                        <span className="text-amber-400 font-mono font-bold">
                          {summary?.total_records?.toLocaleString() || '15,000'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-[11px]">
                        <span className="text-slate-400">Monitored Areas:</span>
                        <span className="text-sky-300 font-mono">15 Urban Sectors</span>
                      </div>
                      <div className="flex justify-between items-center text-[11px]">
                        <span className="text-slate-400">Corridors / Junctions:</span>
                        <span className="text-cyan-300 font-mono">45 Major Roads</span>
                      </div>
                      <div className="flex justify-between items-center text-[11px]">
                        <span className="text-slate-400">Peak Congestion Hour:</span>
                        <span className="text-orange-400 font-mono font-bold">
                          {summary?.peak_hour !== undefined ? `${summary.peak_hour}:00 hrs` : '19:00 hrs'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-[11px]">
                        <span className="text-slate-400">Avg City Speed:</span>
                        <span className="text-emerald-400 font-mono">
                          {summary?.avg_speed || '43.15'} km/h
                        </span>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-[#1E3A5F] grid grid-cols-2 gap-2">
                      <button
                        onClick={() => {
                          navigate('/exploration');
                          setShowDatasetModal(false);
                        }}
                        className="flex items-center justify-center gap-1.5 py-1.5 px-2 bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 rounded-lg font-medium text-[11px] border border-sky-500/30 transition-colors"
                      >
                        Explore Data <ExternalLink size={11} />
                      </button>
                      <button
                        onClick={() => {
                          navigate('/preprocessing');
                          setShowDatasetModal(false);
                        }}
                        className="flex items-center justify-center gap-1.5 py-1.5 px-2 bg-[#14243A] hover:bg-[#1E3A5F] text-slate-300 rounded-lg font-medium text-[11px] border border-[#1E3A5F] transition-colors"
                      >
                        Pipeline <ArrowRight size={11} />
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* 2. Notification Bell (Interactive Dropdown) */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowNotifications(!showNotifications);
                  setShowDatasetModal(false);
                  setShowProfile(false);
                }}
                className={`relative p-2 rounded-lg transition-colors cursor-pointer ${
                  showNotifications ? 'bg-[#1E3A5F] text-sky-400' : 'hover:bg-[#1E3A5F] text-slate-400 hover:text-slate-200'
                }`}
                title="Active Traffic Intelligence Alerts"
              >
                <Bell size={17} />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 rounded-full text-[9px] font-bold text-white flex items-center justify-center ring-2 ring-[#0D1B2E]">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Popover Panel */}
              <AnimatePresence>
                {showNotifications && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 4 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 4 }}
                    className="absolute right-0 mt-2 w-88 bg-[#0D1B2E] border border-sky-400/40 rounded-xl shadow-2xl p-4 z-50 text-xs w-[340px]"
                  >
                    <div className="flex items-center justify-between pb-3 border-b border-[#1E3A5F]">
                      <div className="flex items-center gap-2">
                        <Bell size={15} className="text-sky-400" />
                        <span className="font-bold text-slate-100">Live Traffic Alerts</span>
                        <span className="text-[10px] bg-red-500/20 text-red-400 px-1.5 py-0.2 rounded font-mono font-bold">
                          {unreadCount} new
                        </span>
                      </div>
                      <button
                        onClick={() => setReadAlertIds(activeAlertsList.map(a => a.id))}
                        className="text-[10px] text-sky-400 hover:underline cursor-pointer"
                      >
                        Mark all read
                      </button>
                    </div>

                    <div className="py-2 space-y-2 max-h-72 overflow-y-auto">
                      {activeAlertsList.map(item => {
                        const isRead = readAlertIds.includes(item.id);
                        return (
                          <div
                            key={item.id}
                            className={`p-2.5 rounded-lg border transition-all ${
                              isRead
                                ? 'bg-[#07111F]/50 border-[#1E3A5F]/40 opacity-60'
                                : item.severity === 'Severe'
                                ? 'bg-red-500/10 border-red-500/30'
                                : item.severity === 'High'
                                ? 'bg-amber-500/10 border-amber-500/30'
                                : 'bg-[#14243A] border-[#1E3A5F]'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <div className="flex items-center gap-1.5">
                                {item.severity === 'Severe' ? (
                                  <ShieldAlert size={13} className="text-red-400" />
                                ) : item.severity === 'High' ? (
                                  <AlertTriangle size={13} className="text-amber-400" />
                                ) : (
                                  <CheckCircle2 size={13} className="text-emerald-400" />
                                )}
                                <span className="font-bold text-slate-200 text-[11px]">{item.title}</span>
                              </div>
                              <span className="text-[9px] text-slate-500 font-mono">{item.time}</span>
                            </div>
                            <p className="text-[11px] text-slate-300 leading-relaxed mb-1">{item.message}</p>
                            <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono">
                              <span>📍 {item.area}</span>
                              <span className={`font-semibold ${
                                item.severity === 'Severe' ? 'text-red-400' : item.severity === 'High' ? 'text-amber-400' : 'text-emerald-400'
                              }`}>{item.severity}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="pt-2.5 border-t border-[#1E3A5F] flex justify-between items-center text-[11px]">
                      <button
                        onClick={() => {
                          navigate('/live');
                          setShowNotifications(false);
                        }}
                        className="text-sky-400 hover:text-sky-300 font-medium flex items-center gap-1"
                      >
                        Open Live Monitoring Stream <ArrowRight size={11} />
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* 3. Profile Avatar "TI" (Interactive Dropdown) */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowProfile(!showProfile);
                  setShowDatasetModal(false);
                  setShowNotifications(false);
                }}
                className={`flex items-center gap-2 p-1 pl-2 pr-2.5 rounded-full bg-[#14243A] border border-[#1E3A5F] hover:border-sky-400/50 cursor-pointer transition-all shadow-md ${
                  showProfile ? 'ring-2 ring-sky-400 ring-offset-2 ring-offset-[#07111F]' : ''
                }`}
                title="Admin Security Profile"
              >
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-sky-400 to-cyan-500 flex items-center justify-center text-white text-[10px] font-bold">
                  {user?.full_name ? user.full_name.slice(0, 2).toUpperCase() : 'TI'}
                </div>
                <span className="text-[11px] font-medium text-slate-200 hidden md:inline truncate max-w-[110px]">
                  {user?.username || 'Admin'}
                </span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" title="Admin Authenticated" />
              </button>

              {/* Profile Popover Panel */}
              <AnimatePresence>
                {showProfile && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 4 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 4 }}
                    className="absolute right-0 mt-2 w-72 bg-[#0D1B2E] border border-sky-400/40 rounded-2xl shadow-2xl p-4 z-50 text-xs"
                  >
                    <div className="flex items-center gap-3 pb-3 border-b border-[#1E3A5F]">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-sky-400 to-cyan-500 flex items-center justify-center text-white font-bold text-sm shadow">
                        {user?.full_name ? user.full_name.slice(0, 2).toUpperCase() : 'TI'}
                      </div>
                      <div className="overflow-hidden">
                        <div className="font-bold text-slate-100 text-xs truncate">
                          {user?.full_name || 'Executive Traffic Controller'}
                        </div>
                        <div className="text-[10px] text-sky-400 truncate">
                          {user?.role || 'Chief Traffic Operations Director'}
                        </div>
                        <div className="text-[9px] text-slate-500 font-mono truncate">
                          {user?.department || 'BBMP Central Traffic Command Hub'}
                        </div>
                      </div>
                    </div>

                    {/* Admin Security Clearance Badge */}
                    <div className="my-2.5 p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between text-[11px]">
                      <div className="flex items-center gap-1.5 text-emerald-300 font-semibold font-mono">
                        <ShieldCheck size={13} className="text-emerald-400" />
                        <span>Security Clearance</span>
                      </div>
                      <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded font-mono font-bold">
                        ACTIVE &bull; ADMIN
                      </span>
                    </div>

                    <div className="py-1 space-y-1">
                      <button
                        onClick={() => {
                          navigate('/settings');
                          setShowProfile(false);
                        }}
                        className="w-full flex items-center gap-2.5 p-2 rounded-lg hover:bg-[#14243A] text-slate-300 hover:text-sky-400 transition-colors text-left"
                      >
                        <SlidersHorizontal size={14} />
                        <span>System Settings</span>
                      </button>
                      <button
                        onClick={() => {
                          navigate('/reports');
                          setShowProfile(false);
                        }}
                        className="w-full flex items-center gap-2.5 p-2 rounded-lg hover:bg-[#14243A] text-slate-300 hover:text-sky-400 transition-colors text-left"
                      >
                        <FileText size={14} />
                        <span>Generate Reports</span>
                      </button>
                      <button
                        onClick={() => {
                          navigate('/login');
                          setShowProfile(false);
                        }}
                        className="w-full flex items-center gap-2.5 p-2 rounded-lg hover:bg-[#14243A] text-slate-300 hover:text-sky-400 transition-colors text-left"
                      >
                        <User size={14} />
                        <span>Admin Login / Switch Account</span>
                      </button>
                    </div>

                    <div className="pt-2.5 border-t border-[#1E3A5F] flex items-center justify-between text-[10px] text-slate-500 font-mono">
                      <span>Console Active</span>
                      <button
                        onClick={() => {
                          logout();
                          navigate('/login');
                          setShowProfile(false);
                        }}
                        className="text-red-400 hover:text-red-300 font-bold hover:underline cursor-pointer"
                      >
                        Sign Out
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-auto">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="min-h-full p-4 md:p-6"
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  );
}
