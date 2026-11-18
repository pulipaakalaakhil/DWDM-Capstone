// API & Domain Types for the Traffic Intelligence Platform

export interface DatasetSummary {
  total_records: number;
  total_vehicles: number;
  avg_speed: number;
  avg_volume: number;
  congestion_index: number;
  peak_hour: number | null;
  missing_values: number;
  duplicate_records: number;
  areas: number | string[];
  roads: number | string[];
  [key: string]: any;
}

export interface Column {
  name: string;
  dtype: string;
  non_null?: number;
  non_null_count?: number;
  unique?: number;
  unique_values?: number;
  missing?: number;
  missing_pct?: number;
  null_count?: number;
  null_percent?: number;
  sample?: unknown[];
  sample_values?: unknown[];
}

export interface TrafficRecord {
  Date?: string;
  Time?: string;
  'Area Name'?: string;
  'Road/Intersection Name'?: string;
  'Traffic Volume'?: number;
  'Average Speed (km/h)'?: number;
  'Travel Time Index'?: number;
  'Congestion Level'?: string;
  'Road Capacity Utilization (%)'?: number;
  'Incident Reports'?: number;
  'Environmental Score'?: number;
  'Weather Conditions'?: string;
  Latitude?: number;
  Longitude?: number;
  [key: string]: any;
}

export interface TimeSeriesPoint {
  period: string;
  traffic_volume: number;
  avg_speed: number;
  [key: string]: any;
}

export interface AreaDataPoint {
  area: string;
  traffic_volume: number;
  avg_speed: number;
  capacity_utilization?: number;
  [key: string]: any;
}

export interface WeekdayWeekendPoint {
  hour: number;
  weekday: number;
  weekend: number;
  [key: string]: any;
}

export interface AnalyticsData {
  time_series: TimeSeriesPoint[];
  congestion_distribution: Record<string, number>;
  area_data: AreaDataPoint[];
  weekday_weekend: WeekdayWeekendPoint[];
  weather_data: { weather: string; traffic_volume: number; avg_speed: number }[];
  total_records: number;
  [key: string]: any;
}

export interface HotspotData {
  rank: number;
  area: string;
  road: string;
  avg_traffic: number;
  avg_speed: number;
  congestion_index: number;
  congestion_score: number;
  capacity_utilization: number;
  incident_count: number;
  lat: number;
  lng: number;
  severity: 'Severe' | 'High' | 'Moderate' | string;
}

export interface OlapCellData {
  x: number;
  y: number;
  z: number;
  hour: number;
  hour_label: string;
  area: string;
  congestion: string;
  traffic_volume: number;
  avg_speed: number;
  count: number;
}

export interface OlapCubeData {
  cells: OlapCellData[];
  x_labels: string[];
  y_labels: string[];
  z_labels: string[];
  x_dim: string;
  y_dim: string;
  z_dim: string;
}

export interface PredictionResult {
  success: boolean;
  model: string;
  target: string;
  accuracy?: number;
  f1_score?: number;
  precision?: number;
  recall?: number;
  mae?: number;
  rmse?: number;
  r2_score?: number;
  confusion_matrix?: number[][];
  classes?: string[];
  feature_importance?: { feature: string; importance: number }[];
  actual_vs_predicted?: { actual: number; predicted: number }[];
  train_size?: number;
  test_size?: number;
}

export interface ClusterResult {
  success: boolean;
  algorithm: string;
  n_clusters?: number;
  n_clusters_found?: number;
  n_noise?: number;
  clusters: {
    cluster_id: number;
    count: number;
    avg_traffic: number;
    avg_speed: number;
    dominant_congestion?: string;
    top_areas: string[];
    label?: string;
    center?: Record<string, number>;
  }[];
  elbow_data?: { k: number; inertia: number }[];
  scatter_data: { x: number; y: number; cluster: number; area: string }[];
  features_used: string[];
}

export interface SchemaTable {
  name: string;
  columns: {
    name: string;
    type: string;
    pk?: boolean;
    fk?: string;
    nullable?: boolean;
    measure?: boolean;
    default?: string;
  }[];
  primary_key?: string;
  foreign_keys?: string[];
  description?: string;
}

export interface SchemaData {
  tables?: SchemaTable[];
  fact_table?: SchemaTable;
  dimensions?: SchemaTable[];
  relationships?: { from: string; to: string; type: string; fk: string }[];
  dimension_hierarchy?: any[];
}

export type CongestionLevel = 'Free Flow' | 'Low' | 'Moderate' | 'High' | 'Severe';

export interface FilterState {
  area: string | null;
  congestion: string | null;
  startDate: string | null;
  endDate: string | null;
  granularity: 'hourly' | 'daily' | 'monthly';
}

export interface AlertData {
  type: string;
  timestamp: string;
  area: string;
  severity: string;
  message: string;
  traffic_volume?: number;
  avg_speed?: number;
}

export interface PreprocessingStatus {
  total_records: number;
  missing_values: number;
  missing_by_column: Record<string, number>;
  duplicate_records: number;
  outliers_by_column: Record<string, number>;
  numeric_columns: string[];
  categorical_columns: string[];
}
