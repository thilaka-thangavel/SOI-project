import axios from 'axios';
import type {
  Location, RainfallRecord, DrainageRecord, CitizenReport,
  RiskAssessment, Inspection, DataSource, DashboardSummary, Analytics
} from '../types';

// /api works in both modes:
//   Development: Vite proxies /api → http://localhost:5000
//   Production:  Flask serves frontend + API from http://localhost:5000
const API_BASE = '/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.error || error.message || 'An unexpected error occurred';
    return Promise.reject(new Error(message));
  }
);

// Health
export const checkHealth = () => api.get('/health').then(r => r.data);

// Locations
export const getLocations = (): Promise<Location[]> =>
  api.get('/locations').then(r => r.data.locations || r.data);

export const getLocation = (id: number): Promise<Location & {
  rainfall_records: RainfallRecord[];
  drainage_records: DrainageRecord[];
  risk_assessments: RiskAssessment[];
  citizen_reports: CitizenReport[];
  inspections: Inspection[];
}> => api.get(`/locations/${id}`).then(r => r.data);

// Rainfall
export const getRainfall = (params?: {
  location_id?: number;
  limit?: number;
  days?: number;
}): Promise<RainfallRecord[]> =>
  api.get('/rainfall', { params }).then(r => r.data.records || r.data);

export const createRainfall = (data: Partial<RainfallRecord>): Promise<RainfallRecord> =>
  api.post('/rainfall', data).then(r => r.data);

// Drainage
export const getDrainage = (params?: { location_id?: number }): Promise<DrainageRecord[]> =>
  api.get('/drainage', { params }).then(r => r.data.records || r.data);

export const createDrainage = (data: Partial<DrainageRecord>): Promise<DrainageRecord> =>
  api.post('/drainage', data).then(r => r.data);

export const updateDrainage = (id: number, data: Partial<DrainageRecord>): Promise<DrainageRecord> =>
  api.put(`/drainage/${id}`, data).then(r => r.data);

// Citizen Reports
export const getReports = (params?: {
  location_id?: number;
  status?: string;
  verified?: boolean;
}): Promise<CitizenReport[]> =>
  api.get('/reports', { params }).then(r => r.data.reports || r.data);

export const createReport = (data: Partial<CitizenReport>): Promise<CitizenReport> =>
  api.post('/reports', data).then(r => r.data);

export const getIssues = (): Promise<CitizenReport[]> =>
  api.get('/issues').then(r => r.data.issues || r.data);

// Risk Assessments
export const getRiskAssessments = (): Promise<RiskAssessment[]> =>
  api.get('/risk-assessments').then(r => r.data.assessments || r.data);

export const calculateRisk = (locationId?: number): Promise<RiskAssessment | RiskAssessment[]> =>
  api.post('/risk-assessments/calculate', { location_id: locationId }).then(r => r.data);

// Inspections
export const getInspections = (params?: { location_id?: number; status?: string }): Promise<Inspection[]> =>
  api.get('/inspections', { params }).then(r => r.data.inspections || r.data);

export const createInspection = (data: Partial<Inspection>): Promise<Inspection> =>
  api.post('/inspections', data).then(r => r.data);

export const updateInspection = (id: number, data: Partial<Inspection>): Promise<Inspection> =>
  api.put(`/inspections/${id}`, data).then(r => r.data);

// Dashboard
export const getDashboardSummary = (): Promise<DashboardSummary> =>
  api.get('/dashboard/summary').then(r => r.data);

// Analytics
export const getAnalytics = (): Promise<Analytics> =>
  api.get('/analytics').then(r => r.data);

// Data Sources
export const getDataSources = (): Promise<DataSource[]> =>
  api.get('/data-sources').then(r => r.data.sources || r.data);

// Database Reset
export const resetDatabase = (): Promise<{ message: string }> =>
  api.post('/database/reset').then(r => r.data);

export default api;
