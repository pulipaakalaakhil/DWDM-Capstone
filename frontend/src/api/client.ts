import axios from 'axios';

const API_BASE = (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:8000';

export const api = axios.create({
  baseURL: API_BASE,
  timeout: 60000,
  headers: { 'Content-Type': 'application/json' }
});

export const datasetApi = {
  getSummary: () => api.get('/api/dataset/summary'),
  getPreview: (page = 1, pageSize = 50, search?: string, area?: string, congestion?: string) =>
    api.get('/api/dataset/preview', { params: { page, page_size: pageSize, search, area, congestion } }),
  getColumns: () => api.get('/api/dataset/columns'),
  getStatistics: () => api.get('/api/dataset/statistics'),
  getFilters: () => api.get('/api/dataset/filters'),
  upload: (file: File) => {
    const form = new FormData();
    form.append('file', file);
    return api.post('/api/dataset/upload', form, { headers: { 'Content-Type': 'multipart/form-data' } });
  }
};

export const analyticsApi = {
  getTraffic: (params?: Record<string, string>) => api.get('/api/analytics/traffic', { params }),
  getCongestion: () => api.get('/api/analytics/congestion'),
  getHeatmap: () => api.get('/api/analytics/heatmap'),
  getLocations: () => api.get('/api/analytics/locations'),
};

export const preprocessingApi = {
  getStatus: () => api.get('/api/preprocessing/status'),
  run: (options: Record<string, unknown>) => api.post('/api/preprocessing/run', options),
  getOutliers: () => api.get('/api/preprocessing/outliers'),
};

export const miningApi = {
  runClustering: (params: Record<string, unknown>) => api.post('/api/mining/clustering', params),
  runDecisionTree: (params: Record<string, unknown>) => api.post('/api/mining/decision-tree', params),
  runRandomForest: (params: Record<string, unknown>) => api.post('/api/mining/random-forest', params),
};

export const predictionApi = {
  train: (params: Record<string, unknown>) => api.post('/api/prediction/train', params),
  forecast: (params: Record<string, unknown>) => api.post('/api/prediction/forecast', params),
  evaluate: () => api.post('/api/prediction/evaluate'),
};

export const hotspotsApi = {
  getHotspots: () => api.get('/api/hotspots/'),
  getMapData: () => api.get('/api/hotspots/map'),
};

export const olapApi = {
  rollup: (fromLevel: string, measure: string) =>
    api.get('/api/olap/rollup', { params: { from_level: fromLevel, measure } }),
  drilldown: (area?: string, road?: string, measure?: string) =>
    api.get('/api/olap/drilldown', { params: { area, road, measure } }),
  slice: (dimension: string, value: string, measure?: string) =>
    api.get('/api/olap/slice', { params: { dimension, value, measure } }),
  dice: (params: Record<string, unknown>) => api.get('/api/olap/dice', { params }),
  pivot: (rowDim: string, colDim: string, measure: string, agg: string) =>
    api.get('/api/olap/pivot', { params: { row_dim: rowDim, col_dim: colDim, measure, agg } }),
  getCubeData: () => api.get('/api/olap/cube-data'),
};

export const schemaApi = {
  getNormalized: () => api.get('/api/schema/normalized'),
  getStar: () => api.get('/api/schema/star'),
  getSnowflake: () => api.get('/api/schema/snowflake'),
};

export const reportsApi = {
  generate: (reportType: string, area?: string) =>
    api.get('/api/reports/generate', { params: { report_type: reportType, area: area && area !== 'all' ? area : undefined } }),
  exportCsv: () => api.get('/api/reports/export/csv'),
};

export const authApi = {
  register: (data: { username: string; email: string; full_name: string; password: string; department?: string; role?: string; two_factor_enabled?: boolean }) =>
    api.post('/api/auth/register', data),
  login: (data: { username_or_email: string; password: string }) =>
    api.post('/api/auth/login', data),
  verify2FA: (data: { temp_token: string; code: string }) =>
    api.post('/api/auth/verify-2fa', data),
  resend2FA: (temp_token: string) =>
    api.post('/api/auth/resend-2fa', { temp_token }),
  getMe: () => api.get('/api/auth/me'),
};

// Auto-attach authorization token if present
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('traffic_admin_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
