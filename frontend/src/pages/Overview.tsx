import React, { useState, useEffect } from 'react';
import { format, parseISO } from 'date-fns';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, PieChart, Pie, Legend
} from 'recharts';
import {
  MapPin, AlertTriangle, Droplets, MessageSquare,
  ClipboardCheck, CloudRain, TrendingUp, Activity,
  RefreshCw, Bell
} from 'lucide-react';
import {
  StatCard, Card, RiskBadge, DrainageBadge, RainfallBadge,
  LoadingState, ErrorState, SyntheticDisclaimer, PageHeader, StatusBadge, Button
} from '../components/ui';
import { getDashboardSummary } from '../services/api';
import type { DashboardSummary, ActivityItem } from '../types';

const RISK_COLORS: Record<string, string> = {
  low: '#22c55e',
  moderate: '#f59e0b',
  high: '#f97316',
  critical: '#ef4444',
};

function ActivityFeed({ items }: { items: ActivityItem[] }) {
  const typeIcon = (type: string) => {
    if (type === 'report') return <MessageSquare className="w-4 h-4 text-blue-500" />;
    if (type === 'drainage_update') return <Droplets className="w-4 h-4 text-cyan-500" />;
    return <ClipboardCheck className="w-4 h-4 text-purple-500" />;
  };
  const severityDot = (sev?: string) => {
    const c: Record<string, string> = {
      critical: 'bg-red-500', high: 'bg-orange-500', moderate: 'bg-amber-500', low: 'bg-green-500'
    };
    return <span className={`w-2 h-2 rounded-full flex-shrink-0 mt-1 ${c[sev || 'low'] || 'bg-slate-300'}`} />;
  };

  if (!items.length) return <p className="text-sm text-slate-400 py-8 text-center">No recent activity</p>;

  return (
    <div className="space-y-3">
      {items.map((item, idx) => (
        <div key={idx} className="flex items-start gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors">
          <div className="flex-shrink-0 w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center mt-0.5">
            {typeIcon(item.type)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm font-medium text-slate-800 truncate">{item.title}</p>
              {severityDot(item.severity)}
            </div>
            <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{item.description}</p>
            {item.timestamp && (
              <p className="text-xs text-slate-400 mt-1">
                {format(parseISO(item.timestamp), 'MMM d, HH:mm')}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function OverviewPage() {
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      setError(null);
      const summary = await getDashboardSummary();
      setData(summary);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleRefresh = () => { setRefreshing(true); fetchData(); };

  if (loading) return <LoadingState message="Loading dashboard..." />;
  if (error) return <ErrorState error={error} onRetry={fetchData} />;
  if (!data) return null;

  const totalHighRisk = data.high_risk_count + data.critical_count;

  return (
    <div className="page-enter space-y-6">
      <PageHeader
        title="Overview Dashboard"
        subtitle="Real-time waterlogging risk monitoring for your city"
        actions={
          <Button
            variant="secondary"
            size="sm"
            icon={<RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />}
            onClick={handleRefresh}
            loading={refreshing}
          >
            Refresh
          </Button>
        }
      />

      <SyntheticDisclaimer />

      {/* Warning Banner for critical/high risk */}
      {data.high_risk_locations.some(l => l.risk_category === 'critical') && (
        <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl critical-pulse">
          <Bell className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-red-800">Critical Risk Alert</p>
            <p className="text-sm text-red-700 mt-0.5">
              {data.high_risk_locations.filter(l => l.risk_category === 'critical').length} location(s) are at CRITICAL waterlogging risk.
              Human inspection and review required before confirming flood conditions.
            </p>
          </div>
        </div>
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
        <StatCard
          label="Locations Monitored"
          value={data.locations_monitored}
          icon={<MapPin className="w-5 h-5" />}
          variant="blue"
        />
        <StatCard
          label="High Risk Locations"
          value={totalHighRisk}
          icon={<AlertTriangle className="w-5 h-5" />}
          variant="orange"
        />
        <StatCard
          label="Drainage Blockages"
          value={data.drainage_blockages}
          icon={<Droplets className="w-5 h-5" />}
          variant="red"
        />
        <StatCard
          label="Citizen Reports"
          value={data.citizen_reports_total}
          icon={<MessageSquare className="w-5 h-5" />}
          variant="purple"
        />
        <StatCard
          label="Inspections Pending"
          value={data.inspections_pending}
          icon={<ClipboardCheck className="w-5 h-5" />}
          variant="green"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Rainfall Chart */}
        <div className="xl:col-span-2">
          <Card title="Rainfall Overview (Last 7 Days)" subtitle="Average and peak rainfall across all monitored locations (synthetic data)">
            {data.rainfall_chart.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={data.rainfall_chart} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis
                    dataKey="timestamp"
                    tick={{ fontSize: 11, fill: '#94a3b8' }}
                    tickFormatter={(v) => {
                      try { return format(parseISO(v), 'MMM d'); } catch { return v; }
                    }}
                  />
                  <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} unit="mm" />
                  <Tooltip
                    formatter={(value: number, name: string) => [
                      `${value}mm`, name === 'max_amount' ? 'Peak' : 'Average'
                    ]}
                    labelFormatter={(label) => {
                      try { return format(parseISO(label), 'MMMM d, yyyy'); } catch { return label; }
                    }}
                  />
                  <Line type="monotone" dataKey="avg_amount" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} name="avg_amount" />
                  <Line type="monotone" dataKey="max_amount" stroke="#93c5fd" strokeWidth={1.5} strokeDasharray="4 4" dot={{ r: 3 }} name="max_amount" />
                  <Legend formatter={(v) => v === 'avg_amount' ? 'Avg Rainfall' : 'Peak Rainfall'} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-56 flex items-center justify-center text-slate-400 text-sm">No rainfall data available</div>
            )}
          </Card>
        </div>

        {/* Risk Distribution */}
        <Card title="Risk Distribution" subtitle="Locations by current risk category">
          {data.risk_distribution.some(r => r.count > 0) ? (
            <div className="space-y-3 mt-2">
              {data.risk_distribution.map((item) => (
                <div key={item.category} className="flex items-center gap-3">
                  <div className="flex items-center gap-2 w-24">
                    <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: RISK_COLORS[item.category] }} />
                    <span className="text-sm font-medium text-slate-600 capitalize">{item.category}</span>
                  </div>
                  <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${data.locations_monitored > 0 ? (item.count / data.locations_monitored) * 100 : 0}%`,
                        backgroundColor: RISK_COLORS[item.category]
                      }}
                    />
                  </div>
                  <span className="text-sm font-bold text-slate-800 w-6 text-right">{item.count}</span>
                </div>
              ))}
              <div className="mt-4">
                <ResponsiveContainer width="100%" height={140}>
                  <PieChart>
                    <Pie data={data.risk_distribution} dataKey="count" cx="50%" cy="50%" outerRadius={60} label={({ name, value }: { name: string; value: number }) => value > 0 ? `${value}` : ''}>
                      {data.risk_distribution.map((entry) => (
                        <Cell key={entry.category} fill={RISK_COLORS[entry.category]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v: number) => [v, 'Locations']} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          ) : (
            <div className="h-40 flex items-center justify-center text-slate-400 text-sm">No risk data available</div>
          )}
        </Card>
      </div>

      {/* High-Risk Locations Table */}
      <Card title="High-Risk Locations" subtitle="Locations with elevated waterlogging risk requiring attention" padding={false}>
        {data.high_risk_locations.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full data-table">
              <thead>
                <tr>
                  <th>Location</th>
                  <th>Rainfall</th>
                  <th>Drainage</th>
                  <th>Historical Risk</th>
                  <th>Risk Score</th>
                  <th>Category</th>
                  <th>Last Updated</th>
                </tr>
              </thead>
              <tbody>
                {data.high_risk_locations.map((loc) => (
                  <tr key={loc.id} className={loc.risk_category === 'critical' ? 'bg-red-50/50' : ''}>
                    <td>
                      <div>
                        <p className="font-medium text-slate-800">{loc.name}</p>
                        <p className="text-xs text-slate-400">{loc.area}</p>
                      </div>
                    </td>
                    <td><RainfallBadge intensity={loc.rainfall_intensity} /></td>
                    <td><DrainageBadge condition={loc.drainage_condition} /></td>
                    <td className="capitalize">{loc.historical_frequency.replace('_', ' ')}</td>
                    <td>
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${loc.risk_score}%`,
                              backgroundColor: RISK_COLORS[loc.risk_category]
                            }}
                          />
                        </div>
                        <span className="font-bold text-slate-800">{loc.risk_score.toFixed(0)}</span>
                      </div>
                    </td>
                    <td><RiskBadge category={loc.risk_category} /></td>
                    <td className="text-xs text-slate-400">
                      {loc.last_updated ? format(parseISO(loc.last_updated), 'MMM d, HH:mm') : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center text-slate-400 text-sm">
            No high-risk locations currently identified.
          </div>
        )}
      </Card>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Card
          title="Recent Activity"
          subtitle="Latest citizen reports, drainage updates and inspections"
          actions={<Activity className="w-4 h-4 text-slate-400" />}
        >
          <ActivityFeed items={data.recent_activity} />
        </Card>

        <Card title="Risk Trend Analysis" subtitle="Risk score distribution chart">
          {data.risk_distribution.some(r => r.count > 0) ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={data.risk_distribution} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="category" tick={{ fontSize: 12, fill: '#94a3b8' }} />
                <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} allowDecimals={false} />
                <Tooltip formatter={(v: number) => [v, 'Locations']} />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {data.risk_distribution.map((entry) => (
                    <Cell key={entry.category} fill={RISK_COLORS[entry.category]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-56 flex items-center justify-center text-slate-400 text-sm">No data</div>
          )}
        </Card>
      </div>

      {/* Disclaimer */}
      <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
        <p className="text-xs text-amber-800">
          <strong>⚠ Important:</strong> Risk scores shown are experimental estimates based on synthetic demonstration data.
          They are not official flood warnings and must not be used to dispatch emergency services.
          Human inspection is required to confirm actual conditions. Risk scoring uses a transparent weighted formula
          (Rainfall 35%, Drainage 25%, Historical 20%, Elevation 10%, Reports 10%).
        </p>
      </div>
    </div>
  );
}
