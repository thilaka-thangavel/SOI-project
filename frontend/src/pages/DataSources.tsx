import React, { useState, useEffect } from 'react';
import { format, parseISO } from 'date-fns';
import { Database, RefreshCw, RotateCcw, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import {
  Card, LoadingState, ErrorState, PageHeader, Button, Modal, StatCard
} from '../components/ui';
import { getDataSources, resetDatabase } from '../services/api';
import type { DataSource } from '../types';

export default function DataSourcesPage() {
  const [sources, setSources] = useState<DataSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [resetMsg, setResetMsg] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setError(null);
      const data = await getDataSources();
      setSources(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load data sources');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleReset = async () => {
    try {
      setResetting(true);
      const result = await resetDatabase();
      setShowResetModal(false);
      setResetMsg(result.message || 'Database reset successfully.');
      await fetchData();
      setTimeout(() => setResetMsg(null), 5000);
    } catch (err: unknown) {
      setResetMsg(`Error: ${err instanceof Error ? err.message : 'Reset failed'}`);
    } finally {
      setResetting(false);
    }
  };

  if (loading) return <LoadingState message="Loading data sources..." />;
  if (error) return <ErrorState error={error} onRetry={fetchData} />;

  const activeSources = sources.filter(s => s.is_active).length;

  return (
    <div className="page-enter space-y-6">
      <PageHeader
        title="Data Sources"
        subtitle="Overview of data inputs, system status and database management"
        actions={
          <div className="flex gap-3">
            <Button variant="secondary" size="sm" icon={<RefreshCw className="w-4 h-4" />} onClick={() => { setLoading(true); fetchData(); }}>Refresh</Button>
            <Button variant="danger" size="sm" icon={<RotateCcw className="w-4 h-4" />} onClick={() => setShowResetModal(true)}>Reset DB</Button>
          </div>
        }
      />

      {resetMsg && (
        <div className={`p-3 rounded-xl border text-sm ${
          resetMsg.startsWith('Error') ? 'bg-red-50 border-red-200 text-red-800' : 'bg-green-50 border-green-200 text-green-800'
        }`}>
          {resetMsg}
        </div>
      )}

      {/* Status Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Data Sources" value={sources.length} icon={<Database className="w-5 h-5" />} variant="blue" />
        <StatCard label="Active Sources" value={activeSources} icon={<CheckCircle className="w-5 h-5" />} variant="green" />
        <StatCard label="Inactive" value={sources.length - activeSources} icon={<XCircle className="w-5 h-5" />} variant="orange" />
        <StatCard label="Data Type" value="Synthetic" icon={<Database className="w-5 h-5" />} variant="purple" />
      </div>

      {/* Responsible AI Notice */}
      <div className="p-5 bg-amber-50 border border-amber-200 rounded-xl space-y-3">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-bold text-amber-800">Data Transparency & Responsible AI Notice</h3>
            <div className="mt-2 space-y-2 text-sm text-amber-900">
              <p>• <strong>All data is synthetic.</strong> It is generated for demonstration purposes and does not represent real infrastructure, incidents, or weather data.</p>
              <p>• <strong>Risk scores are experimental.</strong> They use a transparent weighted formula and are not official flood forecasts or emergency warnings.</p>
              <p>• <strong>No live weather API</strong> is connected. Rainfall data is simulated.</p>
              <p>• <strong>No physical sensors.</strong> Drainage conditions come from synthetic records and user-entered reports.</p>
              <p>• <strong>Human verification required.</strong> Predicted risk must not be used to dispatch emergency services without officer confirmation.</p>
              <p>• <strong>No personal data collected.</strong> Citizen reports do not include personally identifiable information.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Data Sources Table */}
      <Card title="Registered Data Sources" subtitle="Input streams configured in the system" padding={false}>
        <div className="overflow-x-auto">
          <table className="w-full data-table">
            <thead>
              <tr>
                <th>Source Name</th>
                <th>Type</th>
                <th>Status</th>
                <th>Format</th>
                <th>Last Updated</th>
                <th>Description</th>
              </tr>
            </thead>
            <tbody>
              {sources.length > 0 ? sources.map(source => (
                <tr key={source.id}>
                  <td>
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${source.is_active ? 'bg-green-500' : 'bg-slate-300'}`} />
                      <span className="font-medium">{source.name}</span>
                    </div>
                  </td>
                  <td>
                    <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-xs capitalize">
                      {source.source_type.replace('_', ' ')}
                    </span>
                  </td>
                  <td>
                    {source.is_active
                      ? <span className="flex items-center gap-1 text-green-700 text-xs font-medium"><CheckCircle className="w-3.5 h-3.5" />Active</span>
                      : <span className="flex items-center gap-1 text-slate-400 text-xs"><XCircle className="w-3.5 h-3.5" />Inactive</span>
                    }
                  </td>
                  <td className="text-xs text-slate-500">{source.data_format}</td>
                  <td className="text-xs text-slate-400">
                    {source.last_updated ? format(parseISO(source.last_updated), 'MMM d, yyyy') : '—'}
                  </td>
                  <td className="text-xs text-slate-600 max-w-xs">{source.description}</td>
                </tr>
              )) : (
                <tr><td colSpan={6} className="text-center py-8 text-slate-400">No data sources registered</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* API Endpoints Documentation */}
      <Card title="Available API Endpoints" subtitle="Backend REST API reference">
        <div className="space-y-2">
          {[
            { method: 'GET', path: '/api/health', desc: 'System health check' },
            { method: 'GET', path: '/api/locations', desc: 'List all monitored locations with latest risk' },
            { method: 'GET', path: '/api/locations/<id>', desc: 'Location details with full history' },
            { method: 'GET', path: '/api/rainfall', desc: 'Rainfall records (supports ?location_id, ?days filters)' },
            { method: 'POST', path: '/api/rainfall', desc: 'Add a rainfall record' },
            { method: 'GET', path: '/api/drainage', desc: 'All drainage records' },
            { method: 'POST', path: '/api/drainage', desc: 'Add a drainage record' },
            { method: 'PUT', path: '/api/drainage/<id>', desc: 'Update drainage condition' },
            { method: 'GET', path: '/api/reports', desc: 'Citizen reports (supports filters)' },
            { method: 'POST', path: '/api/reports', desc: 'Submit a new citizen report' },
            { method: 'GET', path: '/api/risk-assessments', desc: 'Latest risk assessment per location' },
            { method: 'POST', path: '/api/risk-assessments/calculate', desc: 'Recalculate risk score' },
            { method: 'GET', path: '/api/inspections', desc: 'Inspection records' },
            { method: 'POST', path: '/api/inspections', desc: 'Create inspection task' },
            { method: 'PUT', path: '/api/inspections/<id>', desc: 'Update inspection findings' },
            { method: 'GET', path: '/api/dashboard/summary', desc: 'Dashboard summary KPIs' },
            { method: 'GET', path: '/api/analytics', desc: 'Analytics aggregated data' },
            { method: 'GET', path: '/api/data-sources', desc: 'Registered data sources' },
            { method: 'POST', path: '/api/database/reset', desc: 'Reset and re-seed database' },
          ].map(ep => (
            <div key={ep.path} className="flex items-start gap-3 py-2 border-b border-slate-100 last:border-0">
              <span className={`text-xs font-bold px-2 py-0.5 rounded flex-shrink-0 ${
                ep.method === 'GET' ? 'bg-green-100 text-green-700' :
                ep.method === 'POST' ? 'bg-blue-100 text-blue-700' :
                'bg-amber-100 text-amber-700'
              }`}>{ep.method}</span>
              <code className="text-xs font-mono text-slate-600 flex-shrink-0">{ep.path}</code>
              <span className="text-xs text-slate-500">{ep.desc}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* Risk Formula */}
      <Card title="Risk Scoring Formula" subtitle="Transparent weighted scoring algorithm">
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            Risk Score = (Rainfall × 0.35) + (Drainage × 0.25) + (Historical × 0.20) + (Elevation × 0.10) + (Reports × 0.10)
          </p>
          <div className="overflow-x-auto">
            <table className="w-full data-table text-xs">
              <thead>
                <tr>
                  <th>Factor</th>
                  <th>Weight</th>
                  <th>Score = 0</th>
                  <th>Score = 50</th>
                  <th>Score = 100</th>
                </tr>
              </thead>
              <tbody>
                <tr><td>Rainfall Intensity</td><td>35%</td><td>Low (≤10mm)</td><td>Moderate (≤25mm)</td><td>Very Heavy (&gt;50mm)</td></tr>
                <tr><td>Drainage Blockage</td><td>25%</td><td>Clear</td><td>Partially Blocked</td><td>Blocked</td></tr>
                <tr><td>Historical Frequency</td><td>20%</td><td>Rare</td><td>Occasional</td><td>Very Frequent</td></tr>
                <tr><td>Low-lying Elevation</td><td>10%</td><td>Not low-lying</td><td>—</td><td>Low-lying area</td></tr>
                <tr><td>Citizen Reports (7d)</td><td>10%</td><td>No reports</td><td>1–2 reports</td><td>4+ reports</td></tr>
              </tbody>
            </table>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            {[
              { range: '0–24', label: 'Low', color: 'bg-green-50 border-green-200 text-green-800' },
              { range: '25–49', label: 'Moderate', color: 'bg-amber-50 border-amber-200 text-amber-800' },
              { range: '50–74', label: 'High', color: 'bg-orange-50 border-orange-200 text-orange-800' },
              { range: '75–100', label: 'Critical', color: 'bg-red-50 border-red-200 text-red-800' },
            ].map(cat => (
              <div key={cat.label} className={`p-3 rounded-lg border ${cat.color}`}>
                <p className="font-bold">{cat.range}</p>
                <p className="capitalize font-medium">{cat.label}</p>
                <p className="text-xs opacity-75 mt-0.5">Experimental only</p>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Reset Confirmation Modal */}
      <Modal
        open={showResetModal}
        onClose={() => setShowResetModal(false)}
        title="Reset Database"
        footer={
          <div className="flex gap-3 justify-end">
            <Button variant="secondary" onClick={() => setShowResetModal(false)}>Cancel</Button>
            <Button variant="danger" onClick={handleReset} loading={resetting} icon={<RotateCcw className="w-4 h-4" />}>
              Confirm Reset
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
            <p className="font-semibold text-red-800">Warning: This will delete all data</p>
            <p className="text-sm text-red-700 mt-1">
              All records (locations, rainfall, drainage, reports, assessments, inspections) will be permanently deleted
              and replaced with fresh synthetic demonstration data.
            </p>
          </div>
          <p className="text-sm text-slate-600">
            Use this to restore the application to its default demonstration state.
            This action cannot be undone.
          </p>
        </div>
      </Modal>
    </div>
  );
}
