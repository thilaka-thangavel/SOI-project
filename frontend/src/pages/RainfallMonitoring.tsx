import React, { useState, useEffect } from 'react';
import { format, parseISO, subDays } from 'date-fns';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, Legend
} from 'recharts';
import { CloudRain, RefreshCw, Plus, Filter } from 'lucide-react';
import {
  Card, RainfallBadge, LoadingState, ErrorState, SyntheticDisclaimer,
  PageHeader, Button, Select, Modal, Input, StatCard
} from '../components/ui';
import { getRainfall, getLocations, createRainfall } from '../services/api';
import type { RainfallRecord, Location } from '../types';

const INTENSITY_COLORS: Record<string, string> = {
  low: '#93c5fd',
  moderate: '#3b82f6',
  heavy: '#1d4ed8',
  very_heavy: '#1e3a8a',
};

const INTENSITY_LABELS: Record<string, string> = {
  low: 'Low (≤10mm)',
  moderate: 'Moderate (10–25mm)',
  heavy: 'Heavy (25–50mm)',
  very_heavy: 'Very Heavy (>50mm)',
};

export default function RainfallPage() {
  const [records, setRecords] = useState<RainfallRecord[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<string>('all');
  const [days, setDays] = useState<number>(7);
  const [showAddModal, setShowAddModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    location_id: '',
    amount_mm: '',
    intensity: 'low',
    source_type: 'manual_entry',
  });
  const [formError, setFormError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setError(null);
      const [locs, recs] = await Promise.all([
        getLocations(),
        getRainfall({ days })
      ]);
      setLocations(locs);
      setRecords(recs);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load rainfall data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [days]);

  const filteredRecords = selectedLocation === 'all'
    ? records
    : records.filter(r => r.location_id === parseInt(selectedLocation));

  // Group by date for chart
  const chartData = (() => {
    const groups: Record<string, number[]> = {};
    filteredRecords.forEach(r => {
      const date = format(parseISO(r.timestamp), 'MM/dd');
      if (!groups[date]) groups[date] = [];
      groups[date].push(r.amount_mm);
    });
    return Object.entries(groups)
      .map(([date, amts]) => ({
        date,
        avg: +(amts.reduce((a, b) => a + b, 0) / amts.length).toFixed(1),
        max: +Math.max(...amts).toFixed(1),
        readings: amts.length,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  })();

  // Intensity distribution
  const intensityCount = filteredRecords.reduce((acc, r) => {
    acc[r.intensity] = (acc[r.intensity] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const intensityChartData = Object.entries(intensityCount).map(([k, v]) => ({
    name: k,
    count: v,
    label: INTENSITY_LABELS[k] || k,
  }));

  // Summary stats
  const totalMm = filteredRecords.reduce((s, r) => s + r.amount_mm, 0);
  const maxMm = filteredRecords.length ? Math.max(...filteredRecords.map(r => r.amount_mm)) : 0;
  const heavyCount = filteredRecords.filter(r => ['heavy', 'very_heavy'].includes(r.intensity)).length;

  const handleSubmit = async () => {
    if (!formData.location_id || !formData.amount_mm) {
      setFormError('Location and amount are required.');
      return;
    }
    const amount = parseFloat(formData.amount_mm);
    if (isNaN(amount) || amount < 0) {
      setFormError('Amount must be a positive number.');
      return;
    }
    try {
      setSubmitting(true);
      setFormError(null);
      await createRainfall({
        location_id: parseInt(formData.location_id),
        amount_mm: amount,
        intensity: formData.intensity as RainfallRecord['intensity'],
        source_type: formData.source_type,
        timestamp: new Date().toISOString(),
      });
      setShowAddModal(false);
      setFormData({ location_id: '', amount_mm: '', intensity: 'low', source_type: 'manual_entry' });
      fetchData();
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Failed to submit');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingState message="Loading rainfall data..." />;
  if (error) return <ErrorState error={error} onRetry={fetchData} />;

  return (
    <div className="page-enter space-y-6">
      <PageHeader
        title="Rainfall Monitoring"
        subtitle="Synthetic demonstration data — not connected to live weather APIs"
        actions={
          <div className="flex items-center gap-3">
            <Button variant="secondary" size="sm" icon={<RefreshCw className="w-4 h-4" />} onClick={() => { setLoading(true); fetchData(); }}>
              Refresh
            </Button>
            <Button size="sm" icon={<Plus className="w-4 h-4" />} onClick={() => setShowAddModal(true)}>
              Add Record
            </Button>
          </div>
        }
      />

      <SyntheticDisclaimer />

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4 p-4 bg-white rounded-xl border border-slate-200">
        <Filter className="w-4 h-4 text-slate-400" />
        <Select
          label="Location"
          options={[
            { value: 'all', label: 'All Locations' },
            ...locations.map(l => ({ value: String(l.id), label: l.name }))
          ]}
          value={selectedLocation}
          onChange={e => setSelectedLocation(e.target.value)}
        />
        <Select
          label="Time Period"
          options={[
            { value: '1', label: 'Last 24 Hours' },
            { value: '3', label: 'Last 3 Days' },
            { value: '7', label: 'Last 7 Days' },
            { value: '14', label: 'Last 14 Days' },
          ]}
          value={String(days)}
          onChange={e => setDays(parseInt(e.target.value))}
        />
        <span className="text-xs text-slate-400">{filteredRecords.length} records</span>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total Records" value={filteredRecords.length} icon={<CloudRain className="w-5 h-5" />} variant="blue" />
        <StatCard label="Total Rainfall" value={`${totalMm.toFixed(0)}mm`} icon={<CloudRain className="w-5 h-5" />} variant="blue" />
        <StatCard label="Peak Rainfall" value={`${maxMm.toFixed(0)}mm`} icon={<CloudRain className="w-5 h-5" />} variant="orange" />
        <StatCard label="Heavy Events" value={heavyCount} icon={<CloudRain className="w-5 h-5" />} variant="red" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2">
          <Card title="Rainfall Over Time" subtitle="Average and peak rainfall by day">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} unit="mm" />
                  <Tooltip formatter={(v: number, name: string) => [`${v}mm`, name === 'avg' ? 'Average' : 'Peak']} />
                  <Legend formatter={v => v === 'avg' ? 'Average' : 'Peak'} />
                  <Line type="monotone" dataKey="avg" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} />
                  <Line type="monotone" dataKey="max" stroke="#f97316" strokeWidth={1.5} strokeDasharray="4 4" dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-60 flex items-center justify-center text-slate-400 text-sm">No data for selected filters</div>
            )}
          </Card>
        </div>
        <Card title="Intensity Distribution" subtitle="Readings by category">
          {intensityChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={intensityChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip formatter={(v: number) => [v, 'Readings']} labelFormatter={l => INTENSITY_LABELS[l] || l} />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {intensityChartData.map((entry) => (
                    <Cell key={entry.name} fill={INTENSITY_COLORS[entry.name] || '#94a3b8'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-60 flex items-center justify-center text-slate-400 text-sm">No data</div>
          )}
        </Card>
      </div>

      {/* Data Table */}
      <Card title="Rainfall Records" subtitle="Detailed view of all rainfall observations" padding={false}>
        <div className="overflow-x-auto">
          <table className="w-full data-table">
            <thead>
              <tr>
                <th>Location</th>
                <th>Timestamp</th>
                <th>Amount (mm)</th>
                <th>Intensity</th>
                <th>Source</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.length > 0 ? filteredRecords.slice(0, 50).map(record => (
                <tr key={record.id}>
                  <td>
                    <div>
                      <p className="font-medium">{record.location_name || `Location #${record.location_id}`}</p>
                      {record.is_synthetic && <span className="synthetic-badge text-xs">Synthetic</span>}
                    </div>
                  </td>
                  <td className="text-xs">{format(parseISO(record.timestamp), 'MMM d, yyyy HH:mm')}</td>
                  <td>
                    <span className="font-bold text-blue-700">{record.amount_mm.toFixed(1)}</span>
                    <span className="text-xs text-slate-400 ml-1">mm</span>
                  </td>
                  <td><RainfallBadge intensity={record.intensity} /></td>
                  <td className="text-xs text-slate-500 capitalize">{record.source_type.replace('_', ' ')}</td>
                  <td>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${record.data_status === 'verified' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                      {record.data_status}
                    </span>
                  </td>
                </tr>
              )) : (
                <tr><td colSpan={6} className="text-center text-slate-400 py-8">No records found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Intensity Guide */}
      <Card title="Rainfall Intensity Reference" subtitle="Classification guide used in risk scoring">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { intensity: 'low', range: '0–10 mm', desc: 'Light rain, minimal waterlogging risk', color: 'bg-blue-50 border-blue-200' },
            { intensity: 'moderate', range: '10–25 mm', desc: 'Moderate rain, monitor drainage', color: 'bg-blue-100 border-blue-300' },
            { intensity: 'heavy', range: '25–50 mm', desc: 'Heavy rain, elevated risk', color: 'bg-blue-200 border-blue-400' },
            { intensity: 'very_heavy', range: '>50 mm', desc: 'Very heavy, critical risk possible', color: 'bg-blue-800 border-blue-900' },
          ].map(item => (
            <div key={item.intensity} className={`rounded-xl p-4 border ${item.color}`}>
              <RainfallBadge intensity={item.intensity} />
              <p className="font-bold text-slate-700 mt-2">{item.range}</p>
              <p className="text-xs text-slate-500 mt-1">{item.desc}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* Add Rainfall Modal */}
      <Modal open={showAddModal} onClose={() => setShowAddModal(false)} title="Add Rainfall Record"
        footer={
          <div className="flex gap-3 justify-end">
            <Button variant="secondary" onClick={() => setShowAddModal(false)}>Cancel</Button>
            <Button onClick={handleSubmit} loading={submitting}>Submit Record</Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
            This record will be marked as manually entered and is not live weather data.
          </div>
          {formError && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">{formError}</div>}
          <Select
            label="Location *"
            options={[
              { value: '', label: 'Select location...' },
              ...locations.map(l => ({ value: String(l.id), label: l.name }))
            ]}
            value={formData.location_id}
            onChange={e => setFormData(f => ({ ...f, location_id: e.target.value }))}
          />
          <Input
            label="Rainfall Amount (mm) *"
            type="number"
            min="0"
            step="0.1"
            value={formData.amount_mm}
            onChange={e => setFormData(f => ({ ...f, amount_mm: e.target.value }))}
            placeholder="e.g. 25.5"
          />
          <Select
            label="Intensity Category"
            options={[
              { value: 'low', label: 'Low (≤10mm)' },
              { value: 'moderate', label: 'Moderate (10–25mm)' },
              { value: 'heavy', label: 'Heavy (25–50mm)' },
              { value: 'very_heavy', label: 'Very Heavy (>50mm)' },
            ]}
            value={formData.intensity}
            onChange={e => setFormData(f => ({ ...f, intensity: e.target.value }))}
          />
        </div>
      </Modal>
    </div>
  );
}
