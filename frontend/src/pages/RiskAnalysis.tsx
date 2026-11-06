import React, { useState, useEffect } from 'react';
import { format, parseISO } from 'date-fns';
import { AlertTriangle, RefreshCw, TrendingUp, TrendingDown, Minus, Calculator } from 'lucide-react';
import {
  Card, RiskBadge, DrainageBadge, RainfallBadge, LoadingState, ErrorState,
  SyntheticDisclaimer, PageHeader, Button, Select, FactorBar, RiskScoreRing,
  ConfidenceBar, WarningBanner
} from '../components/ui';
import { getRiskAssessments, getLocations, calculateRisk } from '../services/api';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { RiskAssessment, Location } from '../types';

const RISK_COLORS: Record<string, string> = {
  low: '#22c55e', moderate: '#f59e0b', high: '#f97316', critical: '#ef4444',
};

function TrendIcon({ trend }: { trend: string }) {
  if (trend === 'increasing') return <TrendingUp className="w-4 h-4 text-red-500" />;
  if (trend === 'decreasing') return <TrendingDown className="w-4 h-4 text-green-500" />;
  return <Minus className="w-4 h-4 text-slate-400" />;
}

export default function RiskAnalysisPage() {
  const [assessments, setAssessments] = useState<RiskAssessment[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedLocationId, setSelectedLocationId] = useState<number | null>(null);
  const [calculating, setCalculating] = useState(false);
  const [calcSuccess, setCalcSuccess] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setError(null);
      const [locs, risks] = await Promise.all([getLocations(), getRiskAssessments()]);
      setLocations(locs);
      setAssessments(risks);
      if (!selectedLocationId && risks.length > 0) {
        const critical = risks.find(r => r.risk_category === 'critical');
        setSelectedLocationId(critical?.location_id || risks[0].location_id);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load risk data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const selectedAssessment = assessments.find(a => a.location_id === selectedLocationId);
  const selectedLocation = locations.find(l => l.id === selectedLocationId);

  const handleCalculate = async () => {
    if (!selectedLocationId) return;
    try {
      setCalculating(true);
      await calculateRisk(selectedLocationId);
      setCalcSuccess('Risk recalculated successfully.');
      await fetchData();
      setTimeout(() => setCalcSuccess(null), 3000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Calculation failed');
    } finally {
      setCalculating(false);
    }
  };

  const handleCalculateAll = async () => {
    try {
      setCalculating(true);
      await calculateRisk(undefined);
      setCalcSuccess('Risk recalculated for all locations.');
      await fetchData();
      setTimeout(() => setCalcSuccess(null), 3000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Calculation failed');
    } finally {
      setCalculating(false);
    }
  };

  if (loading) return <LoadingState message="Loading risk assessments..." />;
  if (error) return <ErrorState error={error} onRetry={fetchData} />;

  // Get missing_data as array
  const missingData: string[] = (() => {
    if (!selectedAssessment?.missing_data) return [];
    if (typeof selectedAssessment.missing_data === 'string') {
      try { return JSON.parse(selectedAssessment.missing_data); } catch { return []; }
    }
    return selectedAssessment.missing_data as string[];
  })();

  return (
    <div className="page-enter space-y-6">
      <PageHeader
        title="Risk Analysis"
        subtitle="Detailed waterlogging risk assessment with factor breakdown and evidence"
        actions={
          <div className="flex gap-3">
            <Button variant="secondary" size="sm" icon={<RefreshCw className="w-4 h-4" />} onClick={() => { setLoading(true); fetchData(); }}>Refresh</Button>
            <Button variant="secondary" size="sm" icon={<Calculator className={`w-4 h-4 ${calculating ? 'animate-spin' : ''}`} />} onClick={handleCalculateAll} loading={calculating}>
              Recalc All
            </Button>
          </div>
        }
      />

      <SyntheticDisclaimer />

      {calcSuccess && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-xl text-sm text-green-800">{calcSuccess}</div>
      )}

      {/* Location Selector */}
      <div className="flex items-center gap-4 p-4 bg-white rounded-xl border border-slate-200">
        <AlertTriangle className="w-4 h-4 text-amber-500" />
        <Select
          label="Select Location"
          options={assessments.map(a => ({
            value: String(a.location_id),
            label: `${a.location_name || `Location #${a.location_id}`} — ${a.risk_category.toUpperCase()} (${a.risk_score.toFixed(0)})`
          }))}
          value={String(selectedLocationId || '')}
          onChange={e => setSelectedLocationId(parseInt(e.target.value))}
        />
        <Button
          size="sm"
          icon={<Calculator className="w-4 h-4" />}
          onClick={handleCalculate}
          loading={calculating}
          className="flex-shrink-0"
        >
          Recalculate
        </Button>
      </div>

      {selectedAssessment && selectedLocation && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Main Assessment Panel */}
          <div className="xl:col-span-2 space-y-6">
            {/* Risk Summary */}
            <Card title="Risk Summary" subtitle={`Assessment for ${selectedLocation.name}`}>
              <div className="flex items-start gap-6">
                <div className="flex flex-col items-center gap-2">
                  <RiskScoreRing score={selectedAssessment.risk_score} category={selectedAssessment.risk_category} size="lg" />
                  <RiskBadge category={selectedAssessment.risk_category} />
                </div>
                <div className="flex-1 space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-slate-50 rounded-lg">
                      <p className="text-xs text-slate-500">Previous Score</p>
                      <p className="text-xl font-bold text-slate-800">
                        {selectedAssessment.previous_risk_score != null ? selectedAssessment.previous_risk_score.toFixed(0) : '—'}
                      </p>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-lg">
                      <p className="text-xs text-slate-500">Risk Trend</p>
                      <div className="flex items-center gap-2 mt-1">
                        <TrendIcon trend={selectedAssessment.risk_trend} />
                        <span className="text-sm font-semibold capitalize text-slate-800">
                          {selectedAssessment.risk_trend}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Confidence Level</p>
                    <ConfidenceBar confidence={selectedAssessment.confidence} />
                  </div>
                  <p className="text-xs text-slate-400">
                    Last assessed: {selectedAssessment.assessed_at ? format(parseISO(selectedAssessment.assessed_at), 'MMM d, yyyy HH:mm') : '—'}
                  </p>
                </div>
              </div>

              {selectedAssessment.warning_triggered && (
                <div className="mt-4">
                  <WarningBanner message={selectedAssessment.warning_message || 'Warning triggered at this location.'} />
                </div>
              )}
            </Card>

            {/* Factor Breakdown */}
            <Card
              title="Contributing Factors"
              subtitle="Individual score contributions to total risk (experimental scoring, not official forecast)"
            >
              <div className="space-y-5">
                <FactorBar
                  label="Rainfall Intensity"
                  score={selectedAssessment.rainfall_score}
                  weight={selectedAssessment.rainfall_weight}
                  contribution={selectedAssessment.rainfall_score * selectedAssessment.rainfall_weight}
                />
                <FactorBar
                  label="Drainage Blockage"
                  score={selectedAssessment.drainage_score}
                  weight={selectedAssessment.drainage_weight}
                  contribution={selectedAssessment.drainage_score * selectedAssessment.drainage_weight}
                />
                <FactorBar
                  label="Historical Waterlogging Frequency"
                  score={selectedAssessment.historical_score}
                  weight={selectedAssessment.historical_weight}
                  contribution={selectedAssessment.historical_score * selectedAssessment.historical_weight}
                />
                <FactorBar
                  label="Low-Lying Elevation"
                  score={selectedAssessment.elevation_score}
                  weight={selectedAssessment.elevation_weight}
                  contribution={selectedAssessment.elevation_score * selectedAssessment.elevation_weight}
                />
                <FactorBar
                  label="Recent Citizen Reports"
                  score={selectedAssessment.reports_score}
                  weight={selectedAssessment.reports_weight}
                  contribution={selectedAssessment.reports_score * selectedAssessment.reports_weight}
                />
                <div className="pt-3 border-t border-slate-100">
                  <div className="flex justify-between text-sm font-semibold">
                    <span>Total Risk Score</span>
                    <span style={{ color: RISK_COLORS[selectedAssessment.risk_category] }}>
                      {selectedAssessment.risk_score.toFixed(1)} / 100
                    </span>
                  </div>
                </div>
              </div>
            </Card>

            {/* Risk Explanation */}
            <Card title="Risk Explanation" subtitle="Transparent reasoning behind this assessment">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                <p className="text-sm text-blue-900 leading-relaxed">{selectedAssessment.explanation}</p>
              </div>
              <p className="text-xs text-slate-400 mt-3">
                ⚠ This is an experimental risk estimate based on synthetic demonstration data.
                It is not an official flood warning. Human inspection is required to confirm actual conditions.
              </p>
            </Card>

            {/* Missing Data */}
            {missingData.length > 0 && (
              <Card title="Missing Information" subtitle="Data gaps affecting assessment confidence">
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-2">
                  <p className="text-sm font-semibold text-amber-800">
                    {missingData.length} data field(s) missing — confidence reduced to {Math.round(selectedAssessment.confidence * 100)}%
                  </p>
                  <ul className="space-y-1">
                    {missingData.map(field => (
                      <li key={field} className="text-sm text-amber-700 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-amber-500 flex-shrink-0" />
                        {field.replace('_', ' ')} data is unavailable
                      </li>
                    ))}
                  </ul>
                  <p className="text-xs text-amber-600 mt-2">
                    Missing data is not treated as a safe condition. Uncertainty is explicitly reflected in the lower confidence score.
                  </p>
                </div>
              </Card>
            )}
          </div>

          {/* Sidebar: All Locations Summary */}
          <div className="space-y-4">
            <Card title="All Locations" subtitle="Click to view assessment" padding={false}>
              <div className="divide-y divide-slate-100">
                {assessments
                  .sort((a, b) => b.risk_score - a.risk_score)
                  .map(assessment => (
                    <button
                      key={assessment.location_id}
                      className={`w-full text-left px-4 py-3 hover:bg-slate-50 transition-colors ${
                        assessment.location_id === selectedLocationId ? 'bg-blue-50 border-l-2 border-blue-500' : ''
                      }`}
                      onClick={() => setSelectedLocationId(assessment.location_id)}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-slate-800 truncate">
                            {assessment.location_name || `Location #${assessment.location_id}`}
                          </p>
                          <p className="text-xs text-slate-400">{assessment.location_area}</p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <TrendIcon trend={assessment.risk_trend} />
                          <RiskBadge category={assessment.risk_category} score={assessment.risk_score} />
                        </div>
                      </div>
                      {assessment.warning_triggered && (
                        <p className="text-xs text-red-600 mt-1">⚠ Warning</p>
                      )}
                    </button>
                  ))
                }
              </div>
            </Card>

            {/* Location Properties */}
            <Card title="Location Properties" subtitle={selectedLocation.name}>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Area:</span>
                  <span className="font-medium">{selectedLocation.area}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Type:</span>
                  <span className="font-medium capitalize">{selectedLocation.location_type?.replace('_', ' ')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Low-lying:</span>
                  <span className={`font-medium ${selectedLocation.is_low_lying ? 'text-red-600' : 'text-green-600'}`}>
                    {selectedLocation.is_low_lying ? 'Yes' : 'No'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Drainage capacity:</span>
                  <span className="font-medium capitalize">{selectedLocation.drainage_capacity}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Historical freq:</span>
                  <span className="font-medium capitalize">{selectedLocation.historical_waterlogging_frequency?.replace('_', ' ')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Coordinates:</span>
                  <span className="font-mono text-xs">{selectedLocation.latitude.toFixed(4)}, {selectedLocation.longitude.toFixed(4)}</span>
                </div>
                {selectedLocation.is_synthetic && (
                  <div className="pt-2"><span className="synthetic-badge">Synthetic Location</span></div>
                )}
              </div>
            </Card>
          </div>
        </div>
      )}

      {!selectedAssessment && (
        <div className="text-center py-12 text-slate-400">
          <AlertTriangle className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>No risk assessment available. Select a location or calculate risk.</p>
          <Button className="mt-4" onClick={handleCalculateAll} loading={calculating} icon={<Calculator className="w-4 h-4" />}>
            Calculate All Risks
          </Button>
        </div>
      )}
    </div>
  );
}
