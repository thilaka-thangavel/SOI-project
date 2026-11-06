import React, { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, AreaChart, Area, Legend
} from 'recharts';
import { BarChart3, RefreshCw } from 'lucide-react';
import {
  Card, LoadingState, ErrorState, SyntheticDisclaimer, PageHeader, Button, StatCard
} from '../components/ui';
import { getAnalytics } from '../services/api';
import type { Analytics } from '../types';

const RISK_COLORS: Record<string, string> = {
  low: '#22c55e', moderate: '#f59e0b', high: '#f97316', critical: '#ef4444',
};

const DRAIN_COLORS: Record<string, string> = {
  clear: '#22c55e', partially_blocked: '#f59e0b', blocked: '#ef4444', unknown: '#94a3b8',
};

export default function AnalyticsPage() {
  const [data, setData] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setError(null);
      const analytics = await getAnalytics();
      setData(analytics);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  if (loading) return <LoadingState message="Loading analytics..." />;
  if (error) return <ErrorState error={error} onRetry={fetchData} />;
  if (!data) return null;

  const completionPct = Math.round(data.inspection_completion_rate * 100);
  const totalReports = data.verified_vs_unverified.verified + data.verified_vs_unverified.unverified;

  return (
    <div className="page-enter space-y-6">
      <PageHeader
        title="Analytics"
        subtitle="Data-driven insights from synthetic demonstration dataset"
        actions={
          <Button variant="secondary" size="sm" icon={<RefreshCw className="w-4 h-4" />} onClick={() => { setLoading(true); fetchData(); }}>
            Refresh
          </Button>
        }
      />

      <SyntheticDisclaimer />

      {/* Summary Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="Inspection Completion"
          value={`${completionPct}%`}
          icon={<BarChart3 className="w-5 h-5" />}
          variant={completionPct >= 70 ? 'green' : completionPct >= 40 ? 'orange' : 'red'}
        />
        <StatCard
          label="Verified Reports"
          value={data.verified_vs_unverified.verified}
          icon={<BarChart3 className="w-5 h-5" />}
          variant="green"
        />
        <StatCard
          label="Unverified Reports"
          value={data.verified_vs_unverified.unverified}
          icon={<BarChart3 className="w-5 h-5" />}
          variant="orange"
        />
        <StatCard
          label="Total Reports"
          value={totalReports}
          icon={<BarChart3 className="w-5 h-5" />}
          variant="blue"
        />
      </div>

      {/* Rainfall vs Incidents */}
      <Card
        title="Rainfall vs Waterlogging Incidents"
        subtitle="Correlation between daily rainfall and reported incidents (synthetic data)"
      >
        {data.rainfall_vs_incidents.length > 0 ? (
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={data.rainfall_vs_incidents} margin={{ top: 5, right: 30, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} />
              <YAxis yAxisId="left" tick={{ fontSize: 11, fill: '#94a3b8' }} unit="mm" />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: '#94a3b8' }} />
              <Tooltip
                formatter={(value: number, name: string) => [
                  name === 'rainfall_mm' ? `${value}mm` : value,
                  name === 'rainfall_mm' ? 'Avg Rainfall' : 'Incident Reports'
                ]}
              />
              <Legend formatter={v => v === 'rainfall_mm' ? 'Avg Rainfall (mm)' : 'Incident Reports'} />
              <Area yAxisId="left" type="monotone" dataKey="rainfall_mm" stroke="#3b82f6" fill="#dbeafe" strokeWidth={2} />
              <Area yAxisId="right" type="monotone" dataKey="incident_count" stroke="#f97316" fill="#ffedd5" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-64 flex items-center justify-center text-slate-400 text-sm">
            Insufficient data to display chart
          </div>
        )}
      </Card>

      {/* Row 2: Reports by Area + Drainage Blockage */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Card title="Waterlogging Reports by Area" subtitle="Distribution of citizen reports across city zones">
          {data.reports_by_area.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={data.reports_by_area} layout="vertical" margin={{ left: 80, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: '#94a3b8' }} allowDecimals={false} />
                <YAxis type="category" dataKey="area" tick={{ fontSize: 11, fill: '#64748b' }} width={80} />
                <Tooltip formatter={(v: number) => [v, 'Reports']} />
                <Bar dataKey="count" fill="#6366f1" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-60 flex items-center justify-center text-slate-400 text-sm">No report data</div>
          )}
        </Card>

        <Card title="Drainage Condition Distribution" subtitle="Frequency of each drainage condition recorded">
          {data.drainage_blockage_frequency.length > 0 ? (
            <div className="flex flex-col gap-6">
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie
                    data={data.drainage_blockage_frequency}
                    dataKey="count"
                    nameKey="condition"
                    cx="50%"
                    cy="50%"
                    outerRadius={70}
                    label={({ name, percent }: { name: string; percent: number }) =>
                      percent > 0.05 ? `${name} ${(percent * 100).toFixed(0)}%` : ''
                    }
                    labelLine={false}
                  >
                    {data.drainage_blockage_frequency.map((entry) => (
                      <Cell key={entry.condition} fill={DRAIN_COLORS[entry.condition] || '#94a3b8'} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: number) => [v, 'Drains']} />
                </PieChart>
              </ResponsiveContainer>
              <div className="grid grid-cols-2 gap-2">
                {data.drainage_blockage_frequency.map(item => (
                  <div key={item.condition} className="flex items-center gap-2 text-xs">
                    <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: DRAIN_COLORS[item.condition] || '#94a3b8' }} />
                    <span className="capitalize text-slate-600">{item.condition.replace('_', ' ')}</span>
                    <span className="font-bold text-slate-800 ml-auto">{item.count}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-60 flex items-center justify-center text-slate-400 text-sm">No drainage data</div>
          )}
        </Card>
      </div>

      {/* Risk Over Time */}
      <Card
        title="Risk Distribution Over Time"
        subtitle="How risk categories have evolved across monitored locations"
      >
        {data.risk_over_time.length > 0 ? (
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={data.risk_over_time} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} allowDecimals={false} />
              <Tooltip />
              <Legend />
              <Area type="monotone" dataKey="critical" stackId="1" stroke={RISK_COLORS.critical} fill={RISK_COLORS.critical} fillOpacity={0.7} />
              <Area type="monotone" dataKey="high" stackId="1" stroke={RISK_COLORS.high} fill={RISK_COLORS.high} fillOpacity={0.7} />
              <Area type="monotone" dataKey="moderate" stackId="1" stroke={RISK_COLORS.moderate} fill={RISK_COLORS.moderate} fillOpacity={0.7} />
              <Area type="monotone" dataKey="low" stackId="1" stroke={RISK_COLORS.low} fill={RISK_COLORS.low} fillOpacity={0.7} />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-64 flex items-center justify-center text-slate-400 text-sm">
            Insufficient historical risk data
          </div>
        )}
      </Card>

      {/* Verified vs Unverified + Inspection Rate */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Card title="Verified vs Unverified Reports" subtitle="Verification status of all submitted reports">
          <div className="flex items-center gap-8">
            <div className="relative w-32 h-32">
              <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                <circle cx="50" cy="50" r="40" fill="none" stroke="#dcfce7" strokeWidth="12" />
                <circle
                  cx="50" cy="50" r="40"
                  fill="none"
                  stroke="#22c55e"
                  strokeWidth="12"
                  strokeDasharray={`${totalReports > 0 ? (data.verified_vs_unverified.verified / totalReports) * 251 : 0} 251`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold text-slate-800">
                  {totalReports > 0 ? Math.round((data.verified_vs_unverified.verified / totalReports) * 100) : 0}%
                </span>
                <span className="text-xs text-slate-500">verified</span>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <span className="w-4 h-4 rounded-full bg-green-500 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-slate-800">{data.verified_vs_unverified.verified}</p>
                  <p className="text-xs text-slate-500">Verified by officer</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="w-4 h-4 rounded-full bg-amber-400 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-slate-800">{data.verified_vs_unverified.unverified}</p>
                  <p className="text-xs text-slate-500">Unverified / pending</p>
                </div>
              </div>
            </div>
          </div>
        </Card>

        <Card title="Inspection Completion Rate" subtitle="Percentage of created inspections completed">
          <div className="flex items-center gap-8">
            <div className="relative w-32 h-32">
              <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                <circle cx="50" cy="50" r="40" fill="none" stroke="#e0f2fe" strokeWidth="12" />
                <circle
                  cx="50" cy="50" r="40"
                  fill="none"
                  stroke={completionPct >= 70 ? '#22c55e' : completionPct >= 40 ? '#f59e0b' : '#ef4444'}
                  strokeWidth="12"
                  strokeDasharray={`${(completionPct / 100) * 251} 251`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold text-slate-800">{completionPct}%</span>
                <span className="text-xs text-slate-500">complete</span>
              </div>
            </div>
            <div>
              <p className="text-sm text-slate-600">
                {completionPct >= 70
                  ? 'Good inspection completion rate.'
                  : completionPct >= 40
                  ? 'Moderate completion — pending inspections need attention.'
                  : 'Low completion rate — review pending inspections.'}
              </p>
            </div>
          </div>
        </Card>
      </div>

      <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-500">
        All analytics are calculated from the backend database using synthetic demonstration data.
        Results will update when new reports, drainage updates or inspections are recorded.
      </div>
    </div>
  );
}
