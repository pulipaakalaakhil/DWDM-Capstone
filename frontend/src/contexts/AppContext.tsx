import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { DatasetSummary, FilterState, AlertData } from '../types';
import { datasetApi } from '../api/client';

interface AppContextType {
  summary: DatasetSummary | null;
  setSummary: (s: DatasetSummary | null) => void;
  filters: FilterState;
  setFilters: (f: Partial<FilterState>) => void;
  alerts: AlertData[];
  addAlert: (a: AlertData) => void;
  filterOptions: { areas: string[]; congestion_levels: string[]; weather: string[] };
  isLoading: boolean;
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (v: boolean) => void;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [summary, setSummary] = useState<DatasetSummary | null>(null);
  const [filters, setFiltersState] = useState<FilterState>({
    area: null, congestion: null, startDate: null, endDate: null, granularity: 'hourly'
  });
  const [alerts, setAlerts] = useState<AlertData[]>([]);
  const [filterOptions, setFilterOptions] = useState<{ areas: string[]; congestion_levels: string[]; weather: string[] }>({ areas: [], congestion_levels: [], weather: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const setFilters = (f: Partial<FilterState>) => setFiltersState(prev => ({ ...prev, ...f }));
  const addAlert = (a: AlertData) => setAlerts(prev => [a, ...prev.slice(0, 49)]);

  useEffect(() => {
    const load = async () => {
      try {
        const [summaryRes, filtersRes] = await Promise.all([
          datasetApi.getSummary(), datasetApi.getFilters()
        ]);
        if (summaryRes.data.success) setSummary(summaryRes.data.data);
        if (filtersRes.data.success) {
          setFilterOptions({
            areas: filtersRes.data.areas || [],
            congestion_levels: filtersRes.data.congestion_levels || [],
            weather: filtersRes.data.weather || []
          });
        }
      } catch (e) { console.error('Failed to load app data:', e); }
      finally { setIsLoading(false); }
    };
    load();
  }, []);

  return (
    <AppContext.Provider value={{ summary, setSummary, filters, setFilters, alerts, addAlert, filterOptions, isLoading, sidebarCollapsed, setSidebarCollapsed }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
}
