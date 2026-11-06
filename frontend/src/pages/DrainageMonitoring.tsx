import React, { useState, useEffect } from 'react';
import { format, parseISO } from 'date-fns';
import { Droplets, RefreshCw, Edit2, Plus, CheckCircle, XCircle } from 'lucide-react';
import {
  Card, DrainageBadge, LoadingState, ErrorState, SyntheticDisclaimer,
  PageHeader, Button, Select, Modal, Input, Textarea, StatCard, StatusBadge
} from '../components/ui';
import { getDrainage, getLocations, updateDrainage, createDrainage } from '../services/api';
import type { DrainageRecord, Location, DrainageCondition } from '../types';

export default function DrainagePage() {
  const [records, setRecords] = useState<DrainageRecord[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editRecord, setEditRecord] = useState<DrainageRecord | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [filterCondition, setFilterCondition] = useState('all');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [editForm, setEditForm] = useState({
    condition: '',
    maintenance_status: '',
    supporting_report: '',
    updated_by: 'Municipal Officer',
  });

  const [addForm, setAddForm] = useState({
    location_id: '',
    drain_type: 'stormwater',
    condition: 'unknown',
    maintenance_status: 'good',
    supporting_report: '',
    updated_by: 'Municipal Officer',
  });

  const fetchData = async () => {
    try {
      setError(null);
      const [locs, recs] = await Promise.all([getLocations(), getDrainage()]);
      setLocations(locs);
      setRecords(recs);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load drainage data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const filteredRecords = filterCondition === 'all'
    ? records
    : records.filter(r => r.condition === filterCondition);

  const stats = {
    total: records.length,
    blocked: records.filter(r => r.condition === 'blocked').length,
    partiallyBlocked: records.filter(r => r.condition === 'partially_blocked').length,
    needsInspection: records.filter(r => r.condition === 'unknown' || r.maintenance_status === 'critical').length,
    recentlyInspected: records.filter(r => {
      if (!r.last_inspection_date) return false;
      const diff = Date.now() - new Date(r.last_inspection_date).getTime();
      return diff < 7 * 24 * 60 * 60 * 1000;
    }).length,
  };

  const openEdit = (record: DrainageRecord) => {
    setEditRecord(record);
    setEditForm({
      condition: record.condition,
      maintenance_status: record.maintenance_status,
      supporting_report: record.supporting_report || '',
      updated_by: record.updated_by || 'Municipal Officer',
    });
    setFormError(null);
  };

  const handleUpdate = async () => {
    if (!editRecord) return;
    try {
      setSubmitting(true);
      setFormError(null);
      await updateDrainage(editRecord.id, {
        condition: editForm.condition as DrainageCondition,
        maintenance_status: editForm.maintenance_status,
        supporting_report: editForm.supporting_report,
        updated_by: editForm.updated_by,
        blockage_status: editForm.condition === 'blocked',
        last_inspection_date: new Date().toISOString(),
      });
      setSuccessMsg('Drainage condition updated successfully.');
      setEditRecord(null);
      await fetchData();
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Update failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAdd = async () => {
    if (!addForm.location_id) {
      setFormError('Please select a location.');
      return;
    }
    try {
      setSubmitting(true);
      setFormError(null);
      await createDrainage({
        location_id: parseInt(addForm.location_id),
        drain_type: addForm.drain_type,
        condition: addForm.condition as DrainageCondition,
        maintenance_status: addForm.maintenance_status,
        supporting_report: addForm.supporting_report,
        updated_by: addForm.updated_by,
        blockage_status: addForm.condition === 'blocked',
        last_inspection_date: new Date().toISOString(),
      });
      setShowAddModal(false);
      setSuccessMsg('Drainage record added.');
      await fetchData();
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Failed to add');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingState message="Loading drainage data..." />;
  if (error) return <ErrorState error={error} onRetry={fetchData} />;

  return (
    <div className="page-enter space-y-6">
      <PageHeader
        title="Drainage Monitoring"
        subtitle="Stormwater drain conditions — all data is synthetic. No physical sensors installed."
        actions={
          <div className="flex gap-3">
            <Button variant="secondary" size="sm" icon={<RefreshCw className="w-4 h-4" />} onClick={() => { setLoading(true); fetchData(); }}>Refresh</Button>
            <Button size="sm" icon={<Plus className="w-4 h-4" />} onClick={() => { setShowAddModal(true); setFormError(null); }}>Add Drain Record</Button>
          </div>
        }
      />

      <SyntheticDisclaimer />

      {successMsg && (
        <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-xl text-sm text-green-800">
          <CheckCircle className="w-4 h-4" /> {successMsg}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total Drains Monitored" value={stats.total} icon={<Droplets className="w-5 h-5" />} variant="blue" />
        <StatCard label="Blocked Drains" value={stats.blocked} icon={<XCircle className="w-5 h-5" />} variant="red" />
        <StatCard label="Needs Inspection" value={stats.needsInspection} icon={<Droplets className="w-5 h-5" />} variant="orange" />
        <StatCard label="Recently Inspected" value={stats.recentlyInspected} icon={<CheckCircle className="w-5 h-5" />} variant="green" />
      </div>

      {/* Filter */}
      <div className="flex items-center gap-4 p-4 bg-white rounded-xl border border-slate-200">
        <Select
          label="Filter by Condition"
          options={[
            { value: 'all', label: 'All Conditions' },
            { value: 'clear', label: 'Clear' },
            { value: 'partially_blocked', label: 'Partially Blocked' },
            { value: 'blocked', label: 'Blocked' },
            { value: 'unknown', label: 'Unknown' },
          ]}
          value={filterCondition}
          onChange={e => setFilterCondition(e.target.value)}
        />
        <span className="text-xs text-slate-400">{filteredRecords.length} records</span>
      </div>

      {/* Drainage Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredRecords.map(record => {
          const loc = locations.find(l => l.id === record.location_id);
          return (
            <div
              key={record.id}
              className={`bg-white rounded-xl border p-5 card-hover ${
                record.condition === 'blocked' ? 'border-red-200 bg-red-50/30' :
                record.condition === 'partially_blocked' ? 'border-amber-200 bg-amber-50/30' :
                'border-slate-200'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-semibold text-slate-800">{loc?.name || `Location #${record.location_id}`}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{loc?.area} · {record.drain_type}</p>
                </div>
                <DrainageBadge condition={record.condition} />
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Maintenance:</span>
                  <span className={`font-medium capitalize ${
                    record.maintenance_status === 'critical' ? 'text-red-600' :
                    record.maintenance_status === 'needs_attention' ? 'text-amber-600' :
                    'text-green-600'
                  }`}>{record.maintenance_status?.replace('_', ' ')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Last Inspected:</span>
                  <span className="font-medium text-slate-700">
                    {record.last_inspection_date
                      ? format(parseISO(record.last_inspection_date), 'MMM d, yyyy')
                      : 'Never'}
                  </span>
                </div>
                {record.updated_by && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Updated by:</span>
                    <span className="font-medium text-slate-700">{record.updated_by}</span>
                  </div>
                )}
                {record.supporting_report && (
                  <p className="text-slate-500 mt-2 italic line-clamp-2">{record.supporting_report}</p>
                )}
              </div>

              {record.is_synthetic && (
                <div className="mt-3">
                  <span className="synthetic-badge">Synthetic</span>
                </div>
              )}

              <Button
                variant="secondary"
                size="sm"
                className="w-full mt-4"
                icon={<Edit2 className="w-3.5 h-3.5" />}
                onClick={() => openEdit(record)}
              >
                Update Condition
              </Button>
            </div>
          );
        })}
      </div>

      {filteredRecords.length === 0 && (
        <div className="text-center py-12 text-slate-400">No drainage records match the selected filter.</div>
      )}

      {/* Disclaimer */}
      <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600">
        <strong>Note:</strong> This system does not include physical sensors. Drainage conditions are based on synthetic records
        and user-entered reports. Municipal officers must conduct field inspections to confirm actual drainage status.
      </div>

      {/* Edit Modal */}
      <Modal
        open={!!editRecord}
        onClose={() => setEditRecord(null)}
        title="Update Drainage Condition"
        footer={
          <div className="flex gap-3 justify-end">
            <Button variant="secondary" onClick={() => setEditRecord(null)}>Cancel</Button>
            <Button onClick={handleUpdate} loading={submitting}>Save Update</Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-800">
            This update will be recorded with a timestamp and officer name. Physical flooding must be confirmed by field inspection.
          </div>
          {formError && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">{formError}</div>}
          <Select
            label="Drainage Condition *"
            options={[
              { value: 'clear', label: 'Clear — drainage functioning normally' },
              { value: 'partially_blocked', label: 'Partially Blocked — reduced flow' },
              { value: 'blocked', label: 'Blocked — drainage not functioning' },
              { value: 'unknown', label: 'Unknown — not yet inspected' },
            ]}
            value={editForm.condition}
            onChange={e => setEditForm(f => ({ ...f, condition: e.target.value }))}
          />
          <Select
            label="Maintenance Status"
            options={[
              { value: 'good', label: 'Good' },
              { value: 'needs_attention', label: 'Needs Attention' },
              { value: 'critical', label: 'Critical' },
            ]}
            value={editForm.maintenance_status}
            onChange={e => setEditForm(f => ({ ...f, maintenance_status: e.target.value }))}
          />
          <Textarea
            label="Inspection Notes / Supporting Report"
            rows={3}
            value={editForm.supporting_report}
            onChange={e => setEditForm(f => ({ ...f, supporting_report: e.target.value }))}
            placeholder="Describe what was observed during inspection..."
          />
          <Input
            label="Updated By (Officer Name)"
            value={editForm.updated_by}
            onChange={e => setEditForm(f => ({ ...f, updated_by: e.target.value }))}
          />
        </div>
      </Modal>

      {/* Add Modal */}
      <Modal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add Drainage Record"
        footer={
          <div className="flex gap-3 justify-end">
            <Button variant="secondary" onClick={() => setShowAddModal(false)}>Cancel</Button>
            <Button onClick={handleAdd} loading={submitting}>Add Record</Button>
          </div>
        }
      >
        <div className="space-y-4">
          {formError && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">{formError}</div>}
          <Select
            label="Location *"
            options={[{ value: '', label: 'Select location...' }, ...locations.map(l => ({ value: String(l.id), label: l.name }))]}
            value={addForm.location_id}
            onChange={e => setAddForm(f => ({ ...f, location_id: e.target.value }))}
          />
          <Select
            label="Drain Type"
            options={[
              { value: 'stormwater', label: 'Stormwater' },
              { value: 'roadside', label: 'Roadside' },
              { value: 'culvert', label: 'Culvert' },
              { value: 'underground', label: 'Underground' },
            ]}
            value={addForm.drain_type}
            onChange={e => setAddForm(f => ({ ...f, drain_type: e.target.value }))}
          />
          <Select
            label="Condition"
            options={[
              { value: 'clear', label: 'Clear' },
              { value: 'partially_blocked', label: 'Partially Blocked' },
              { value: 'blocked', label: 'Blocked' },
              { value: 'unknown', label: 'Unknown' },
            ]}
            value={addForm.condition}
            onChange={e => setAddForm(f => ({ ...f, condition: e.target.value }))}
          />
          <Textarea
            label="Notes"
            rows={3}
            value={addForm.supporting_report}
            onChange={e => setAddForm(f => ({ ...f, supporting_report: e.target.value }))}
          />
        </div>
      </Modal>
    </div>
  );
}
