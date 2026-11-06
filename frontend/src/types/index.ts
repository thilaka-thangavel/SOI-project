// DrainWatch AI — TypeScript type definitions

export type RiskCategory = 'low' | 'moderate' | 'high' | 'critical';
export type RiskTrend = 'increasing' | 'decreasing' | 'stable';
export type DrainageCondition = 'clear' | 'partially_blocked' | 'blocked' | 'unknown';
export type RainfallIntensity = 'low' | 'moderate' | 'heavy' | 'very_heavy';
export type IssueType = 'water_accumulation' | 'drain_blockage' | 'road_flooding' | 'overflowing_drain' | 'other';
export type WaterDepth = 'no_standing_water' | 'shallow' | 'moderate' | 'severe' | 'unknown';
export type InspectionStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';
export type InspectionPriority = 'low' | 'medium' | 'high' | 'critical';
export type LocationType = 'residential_street' | 'road_intersection' | 'near_stormwater_drain' | 'commercial_street' | 'underpass';

export interface Location {
  id: number;
  name: string;
  area: string;
  latitude: number;
  longitude: number;
  is_low_lying: boolean;
  drainage_capacity: 'high' | 'medium' | 'low';
  historical_waterlogging_frequency: 'rare' | 'occasional' | 'frequent' | 'very_frequent';
  monitoring_status: string;
  location_type: LocationType;
  is_synthetic: boolean;
  created_at: string;
  latest_risk?: RiskAssessment;
}

export interface RainfallRecord {
  id: number;
  location_id: number;
  location_name?: string;
  timestamp: string;
  amount_mm: number;
  intensity: RainfallIntensity;
  source_type: string;
  data_status: string;
  is_synthetic: boolean;
  created_at: string;
}

export interface DrainageRecord {
  id: number;
  location_id: number;
  location_name?: string;
  drain_type: string;
  condition: DrainageCondition;
  blockage_status: boolean;
  last_inspection_date: string | null;
  maintenance_status: string;
  supporting_report: string | null;
  updated_by: string | null;
  is_synthetic: boolean;
  created_at: string;
  updated_at: string;
}

export interface CitizenReport {
  id: number;
  title: string;
  description: string;
  location_id: number | null;
  location_text: string;
  issue_type: IssueType;
  water_depth: WaterDepth;
  reported_at: string;
  latitude: number | null;
  longitude: number | null;
  photo_path: string | null;
  is_verified: boolean;
  verified_by: string | null;
  verified_at: string | null;
  status: 'pending' | 'under_review' | 'resolved' | 'dismissed';
  is_synthetic: boolean;
  created_at: string;
}

export interface HistoricalIncident {
  id: number;
  location_id: number;
  incident_date: string;
  severity: 'minor' | 'moderate' | 'severe';
  description: string;
  duration_hours: number | null;
  affected_area_sqm: number | null;
  source: string;
  is_synthetic: boolean;
  created_at: string;
}

export interface RiskAssessment {
  id: number;
  location_id: number;
  location_name?: string;
  location_area?: string;
  risk_score: number;
  risk_category: RiskCategory;
  rainfall_score: number;
  drainage_score: number;
  historical_score: number;
  elevation_score: number;
  reports_score: number;
  rainfall_weight: number;
  drainage_weight: number;
  historical_weight: number;
  elevation_weight: number;
  reports_weight: number;
  confidence: number;
  explanation: string;
  missing_data: string[];
  warning_triggered: boolean;
  warning_message: string | null;
  previous_risk_score: number | null;
  risk_trend: RiskTrend;
  assessed_at: string;
  created_at: string;
}

export interface Inspection {
  id: number;
  location_id: number;
  location_name?: string;
  risk_assessment_id: number | null;
  title: string;
  status: InspectionStatus;
  priority: InspectionPriority;
  assigned_to: string | null;
  scheduled_date: string | null;
  completed_date: string | null;
  findings: string | null;
  drain_condition_found: DrainageCondition | null;
  flooding_confirmed: boolean;
  issue_verified: boolean | null;
  alert_incorrect: boolean;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface DataSource {
  id: number;
  name: string;
  source_type: string;
  description: string;
  is_active: boolean;
  last_updated: string;
  data_format: string;
  notes: string | null;
  created_at: string;
}

// Dashboard summary
export interface DashboardSummary {
  locations_monitored: number;
  high_risk_count: number;
  critical_count: number;
  drainage_blockages: number;
  citizen_reports_total: number;
  inspections_pending: number;
  high_risk_locations: HighRiskTableRow[];
  rainfall_chart: RainfallChartPoint[];
  risk_distribution: RiskDistributionItem[];
  recent_activity: ActivityItem[];
}

export interface HighRiskTableRow {
  id: number;
  name: string;
  area: string;
  rainfall_intensity: string;
  drainage_condition: string;
  historical_frequency: string;
  risk_score: number;
  risk_category: RiskCategory;
  warning_triggered: boolean;
  warning_message: string | null;
  last_updated: string | null;
}

export interface RainfallChartPoint {
  timestamp: string;
  avg_amount: number;
  max_amount: number;
  location_count: number;
}

export interface RiskDistributionItem {
  category: RiskCategory;
  count: number;
}

export interface ActivityItem {
  type: 'report' | 'drainage_update' | 'inspection';
  title: string;
  description: string;
  timestamp: string | null;
  severity?: string;
}

// Analytics
export interface Analytics {
  rainfall_vs_incidents: RainfallVsIncidents[];
  reports_by_area: ReportsByArea[];
  drainage_blockage_frequency: DrainageBlockageFreq[];
  risk_over_time: RiskOverTime[];
  inspection_completion_rate: number;
  verified_vs_unverified: { verified: number; unverified: number };
}

export interface RainfallVsIncidents {
  date: string;
  rainfall_mm: number;
  incident_count: number;
}

export interface ReportsByArea {
  area: string;
  count: number;
}

export interface DrainageBlockageFreq {
  condition: string;
  count: number;
}

export interface RiskOverTime {
  date: string;
  low: number;
  moderate: number;
  high: number;
  critical: number;
}

// PoC Experiment
export interface ExperimentConfig {
  pass_threshold_time_seconds: number;
  pass_threshold_accuracy: number;
}

export interface ExperimentObservation {
  id: string;
  test_case_id: string;
  location: string;
  review_method: 'baseline' | 'combined_system';
  time_taken_seconds: number | null;
  risk_correctly_identified: boolean | null;
  incorrect_warning: boolean;
  reviewer_notes: string;
  created_at: string;
}

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}
