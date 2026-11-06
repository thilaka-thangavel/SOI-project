import React, { useState, useEffect } from 'react';
import { format, parseISO } from 'date-fns';
import { MessageSquare, Plus, CheckCircle, Filter, RefreshCw } from 'lucide-react';
import {
  Card, LoadingState, ErrorState, SyntheticDisclaimer, PageHeader,
  Button, Select, Input, Textarea, Modal, StatCard, StatusBadge
} from '../components/ui';
import { getReports, getLocations, createReport } from '../services/api';
import type { CitizenReport, Location, IssueType, WaterDepth } from '../types';

const ISSUE_LABELS: Record<string, string> = {
  water_accumulation: 'Water Accumulation',
  drain_blockage: 'Drain Blockage',
  road_flooding: 'Road Flooding',
  overflowing_drain: 'Overflowing Drain',
  other: 'Other',
};

const DEPTH_LABELS: Record<string, string> = {
  no_standing_water: 'No Standing Water',
  shallow: 'Shallow',
  moderate: 'Moderate',
  severe: 'Severe',
  unknown: 'Unknown',
};

const DEPTH_COLORS: Record<string, string> = {
  no_standing_water: 'bg-green-100 text-green-800',
  shallow: 'bg-blue-100 text-blue-800',
  moderate: 'bg-amber-100 text-amber-800',
  severe: 'bg-red-100 text-red-800',
  unknown: 'bg-gray-100 text-gray-600',
};

export default function CitizenReportsPage() {
  const [reports, setReports] = useState<CitizenReport[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterIssue, setFilterIssue] = useState('all');
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [selectedReport, setSelectedReport] = useState<CitizenReport | null>(null);

  const [form, setForm] = useState({
    title: '',
    description: '',
    location_id: '',
    location_text: '',
    issue_type: 'water_accumulation',
    water_depth: 'unknown',
    latitude: '',
    longitude: '',
    reported_at: new Date().toISOString().slice(0, 16),
  });

  const fetchData = async () => {
    try {
      setError(null);
      const [locs, reps] = await Promise.all([getLocations(), getReports()]);
      setLocations(locs);
      setReports(reps);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const filteredReports = reports.filter(r => {
    if (filterStatus !== 'all' && r.status !== filterStatus) return false;
    if (filterIssue !== 'all' && r.issue_type !== filterIssue) return false;
    return true;
  });

  const stats = {
    total: reports.length,
    pending: reports.filter(r => r.status === 'pending').length,
    verified: reports.filter(r => r.is_verified).length,
    severe: reports.filter(r => r.water_depth === 'severe').length,
  };

  const handleSubmit = async () => {
    if (!form.title.trim()) { setFormError('Report title is required.'); return; }
    if (!form.issue_type) { setFormError('Issue type is required.'); return; }
    if (!form.location_id && !form.location_text.trim()) {
      setFormError('Please select a known location or describe the location.'); return;
    }
    try {
      setSubmitting(true);
      setFormError(null);
      const payload: Partial<CitizenReport> = {
        title: form.title.trim(),
        description: form.description.trim(),
        issue_type: form.issue_type as IssueType,
        water_depth: form.water_depth as WaterDepth,
        location_text: form.location_text.trim(),
        reported_at: form.reported_at,
        is_synthetic: false,
      };
      if (form.location_id) payload.location_id = parseInt(form.location_id);
      if (form.latitude && form.longitude) {
        payload.latitude = parseFloat(form.latitude);
        payload.longitude = parseFloat(form.longitude);
      }
      await createReport(payload);
      setSubmitSuccess(true);
      setShowAddModal(false);
      setForm({
        title: '', description: '', location_id: '', location_text: '',
        issue_type: 'water_accumulation', water_depth: 'unknown',
        latitude: '', longitude: '', reported_at: new Date().toISOString().slice(0, 16),
      });
      await fetchData();
      setTimeout(() => setSubmitSuccess(false), 4000);
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Failed to submit report');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingState message="Loading citizen reports..." />;
  if (error) return <ErrorState error={error} onRetry={fetchData} />;

  return (
    <div className="page-enter space-y-6">
      <PageHeader
        title="Citizen Reports"
        subtitle="Waterlogging and drainage reports submitted by the public"
        actions={
          <div className="flex gap-3">
            <Button variant="secondary" size="sm" icon={<RefreshCw className="w-4 h-4" />} onClick={() => { setLoading(true); fetchData(); }}>Refresh</Button>
            <Button size="sm" icon={<Plus className="w-4 h-4" />} onClick={() => setShowAddModal(true)}>Submit Report</Button>
          </div>
        }
      />

      {submitSuccess && (
        <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-xl text-sm text-green-800">
          <CheckCircle className="w-4 h-4" />
          Report submitted successfully. Municipal officers will review it.
        </div>
      )}

      <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl text-sm text-blue-800">
        <strong>Privacy Notice:</strong> Reports do not collect personal identifying information.
        Verified reports are reviewed by municipal officers. Unverified reports are clearly marked and
        treated as unconfirmed observations.
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total Reports" value={stats.total} icon={<MessageSquare className="w-5 h-5" />} variant="blue" />
        <StatCard label="Pending Review" value={stats.pending} icon={<MessageSquare className="w-5 h-5" />} variant="orange" />
        <StatCard label="Verified Reports" value={stats.verified} icon={<CheckCircle className="w-5 h-5" />} variant="green" />
        <StatCard label="Severe Depth Reports" value={stats.severe} icon={<MessageSquare className="w-5 h-5" />} variant="red" />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4 p-4 bg-white rounded-xl border border-slate-200">
        <Filter className="w-4 h-4 text-slate-400" />
        <Select
          label="Status"
          options={[
            { value: 'all', label: 'All Statuses' },
            { value: 'pending', label: 'Pending' },
            { value: 'under_review', label: 'Under Review' },
            { value: 'resolved', label: 'Resolved' },
            { value: 'dismissed', label: 'Dismissed' },
          ]}
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
        />
        <Select
          label="Issue Type"
          options={[
            { value: 'all', label: 'All Types' },
            ...Object.entries(ISSUE_LABELS).map(([v, l]) => ({ value: v, label: l }))
          ]}
          value={filterIssue}
          onChange={e => setFilterIssue(e.target.value)}
        />
        <span className="text-xs text-slate-400">{filteredReports.length} reports</span>
      </div>

      {/* Reports List */}
      <div className="space-y-4">
        {filteredReports.length === 0 ? (
          <div className="text-center py-12 text-slate-400">No reports match the selected filters.</div>
        ) : filteredReports.map(report => {
          const loc = locations.find(l => l.id === report.location_id);
          return (
            <div
              key={report.id}
              className="bg-white rounded-xl border border-slate-200 p-5 card-hover cursor-pointer"
              onClick={() => setSelectedReport(report)}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-slate-800">{report.title}</h3>
                    {report.is_verified ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                        <CheckCircle className="w-3 h-3" /> Verified
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 text-amber-800 text-xs font-medium rounded-full border border-amber-200">
                        Unverified
                      </span>
                    )}
                    {report.is_synthetic && <span className="synthetic-badge">Synthetic</span>}
                  </div>
                  <p className="text-sm text-slate-500 mt-1">{loc?.name || report.location_text || 'Location not specified'}</p>
                  <p className="text-sm text-slate-600 mt-1 line-clamp-2">{report.description}</p>
                  <div className="flex items-center gap-3 mt-2 flex-wrap">
                    <span className="text-xs px-2 py-1 bg-slate-100 text-slate-600 rounded-full">
                      {ISSUE_LABELS[report.issue_type] || report.issue_type}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded-full ${DEPTH_COLORS[report.water_depth]}`}>
                      Depth: {DEPTH_LABELS[report.water_depth]}
                    </span>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <StatusBadge status={report.status} />
                  <p className="text-xs text-slate-400 mt-2">
                    {report.reported_at ? format(parseISO(report.reported_at), 'MMM d, HH:mm') : '—'}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Report Detail Modal */}
      {selectedReport && (
        <Modal open={!!selectedReport} onClose={() => setSelectedReport(null)} title="Report Details" size="lg">
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="flex-1">
                <h3 className="text-lg font-bold text-slate-800">{selectedReport.title}</h3>
                <p className="text-sm text-slate-500">
                  {locations.find(l => l.id === selectedReport.location_id)?.name || selectedReport.location_text}
                </p>
              </div>
              <StatusBadge status={selectedReport.status} />
            </div>
            {selectedReport.is_verified ? (
              <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <p className="text-sm text-green-800">Verified by {selectedReport.verified_by} on {selectedReport.verified_at ? format(parseISO(selectedReport.verified_at), 'MMM d, yyyy') : '—'}</p>
              </div>
            ) : (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-sm text-amber-800 font-medium">Unverified Report</p>
                <p className="text-xs text-amber-700 mt-0.5">This report has not been verified by a municipal officer and should be treated as an unconfirmed observation.</p>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><span className="text-slate-500">Issue Type:</span> <strong>{ISSUE_LABELS[selectedReport.issue_type]}</strong></div>
              <div><span className="text-slate-500">Water Depth:</span> <strong>{DEPTH_LABELS[selectedReport.water_depth]}</strong></div>
              <div><span className="text-slate-500">Reported At:</span> <strong>{selectedReport.reported_at ? format(parseISO(selectedReport.reported_at), 'MMM d, yyyy HH:mm') : '—'}</strong></div>
              {selectedReport.latitude && selectedReport.longitude && (
                <div><span className="text-slate-500">Coordinates:</span> <strong>{selectedReport.latitude.toFixed(4)}, {selectedReport.longitude.toFixed(4)}</strong></div>
              )}
            </div>
            {selectedReport.description && (
              <div>
                <p className="text-sm font-medium text-slate-600 mb-1">Description</p>
                <p className="text-sm text-slate-700 bg-slate-50 rounded-lg p-3">{selectedReport.description}</p>
              </div>
            )}
            {selectedReport.is_synthetic && (
              <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
                <span className="synthetic-badge">Synthetic Demo Data — not a real incident</span>
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Submit Report Modal */}
      <Modal
        open={showAddModal}
        onClose={() => { setShowAddModal(false); setFormError(null); }}
        title="Submit Waterlogging Report"
        size="lg"
        footer={
          <div className="flex gap-3 justify-end">
            <Button variant="secondary" onClick={() => setShowAddModal(false)}>Cancel</Button>
            <Button onClick={handleSubmit} loading={submitting}>Submit Report</Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-800">
            Reports help municipal teams identify waterlogging risks. No personal information is collected.
            Submitted reports will be reviewed by a municipal officer before marking as verified.
          </div>
          {formError && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">{formError}</div>}
          <Input label="Report Title *" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Standing water at main road junction" />
          <Textarea label="Description" rows={3} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Describe what you observed..." />
          <Select
            label="Issue Type *"
            options={Object.entries(ISSUE_LABELS).map(([v, l]) => ({ value: v, label: l }))}
            value={form.issue_type}
            onChange={e => setForm(f => ({ ...f, issue_type: e.target.value }))}
          />
          <Select
            label="Approximate Water Depth"
            options={Object.entries(DEPTH_LABELS).map(([v, l]) => ({ value: v, label: l }))}
            value={form.water_depth}
            onChange={e => setForm(f => ({ ...f, water_depth: e.target.value }))}
          />
          <Select
            label="Known Location (optional)"
            options={[{ value: '', label: 'Select if known...' }, ...locations.map(l => ({ value: String(l.id), label: l.name }))]}
            value={form.location_id}
            onChange={e => setForm(f => ({ ...f, location_id: e.target.value }))}
          />
          <Input
            label="Location Description (if not in list)"
            value={form.location_text}
            onChange={e => setForm(f => ({ ...f, location_text: e.target.value }))}
            placeholder="e.g. Near the bus stop on MG Road"
          />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Latitude (optional)" type="number" step="0.0001" value={form.latitude} onChange={e => setForm(f => ({ ...f, latitude: e.target.value }))} placeholder="e.g. 12.9716" />
            <Input label="Longitude (optional)" type="number" step="0.0001" value={form.longitude} onChange={e => setForm(f => ({ ...f, longitude: e.target.value }))} placeholder="e.g. 77.5946" />
          </div>
          <Input label="Date & Time" type="datetime-local" value={form.reported_at} onChange={e => setForm(f => ({ ...f, reported_at: e.target.value }))} />
        </div>
      </Modal>
    </div>
  );
}
