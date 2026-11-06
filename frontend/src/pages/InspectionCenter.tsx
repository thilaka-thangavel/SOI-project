import React, { useState, useEffect } from 'react';
import { format, parseISO } from 'date-fns';
import { ClipboardCheck, Plus, CheckCircle, RefreshCw, Filter, Edit2 } from 'lucide-react';
import {
  Card, RiskBadge, LoadingState, ErrorState, SyntheticDisclaimer, PageHeader,
  Button, Select, Input, Textarea, Modal, StatCard, StatusBadge
} from '../components/ui';
import { getInspections, getLocations, createInspection, updateInspection, getRiskAssessments } from '../services/api';
import type { Inspection, Location, RiskAssessment, InspectionStatus, InspectionPriority } from '../types';

const PRIORITY_COLORS: Record<string, string> = {
  low: 'bg-green-100 text-green-700 border border-green-200',
  medium: 'bg-blue-100 text-blue-700 border border-blue-200',
  high: 'bg-orange-100 text-orange-700 border border-orange-200',
  critical: 'bg-red-100 text-red-700 border border-red-200',
};

export default function InspectionCenterPage() {
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [assessments, setAssessments] = useState<RiskAssessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editInspection, setEditInspection] = useState<Inspection | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const defaultCreateForm = {
    location_id: '', title: '', priority: 'medium', assigned_to: 'Field Inspector',
    scheduled_date: '', notes: '',
  };
  const [createForm, setCreateForm] = useState(defaultCreateForm);

  const [updateForm, setUpdateForm] = useState({
    status: '', findings: '', drain_condition_found: '',
    flooding_confirmed: false, issue_verified: false,
    alert_incorrect: false, notes: '',
  });

  const fetchData = async () => {
    try {
      setError(null);
      const [locs, insp, risks] = await Promise.all([getLocations(), getInspections(), getRiskAssessments()]);
      setLocations(locs);
      setInspections(insp);
      setAssessments(risks);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load inspection data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const filtered = inspections.filter(i => {
    if (filterStatus !== 'all' && i.status !== filterStatus) return false;
    if (filterPriority !== 'all' && i.priority !== filterPriority) return false;
    return true;
  });

  const stats = {
    total: inspections.length,
    pending: inspections.filter(i => i.status === 'pending').length,
    inProgress: inspections.filter(i => i.status === 'in_progress').length,
    completed: inspections.filter(i => i.status === 'completed').length,
    critical: inspections.filter(i => i.priority === 'critical').length,
  };

  const handleCreate = async () => {
    if (!createForm.location_id || !createForm.title) {
      setFormError('Location and title are required.'); return;
    }
    try {
      setSubmitting(true); setFormError(null);
      const locId = parseInt(createForm.location_id);
      const ra = assessments.find(a => a.location_id === locId);
      await createInspection({
        location_id: locId,
        risk_assessment_id: ra?.id,
        title: createForm.title,
        priority: createForm.priority as InspectionPriority,
        assigned_to: createForm.assigned_to,
        scheduled_date: createForm.scheduled_date || undefined,
        notes: createForm.notes,
        status: 'pending',
        created_by: 'Municipal Officer',
      });
      setShowCreateModal(false);
      setCreateForm(defaultCreateForm);
      setSuccessMsg('Inspection task created.'); 
      await fetchData();
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: unknown) { setFormError(err instanceof Error ? err.message : 'Failed to create'); }
    finally { setSubmitting(false); }
  };

  const openUpdate = (insp: Inspection) => {
    setEditInspection(insp);
    setUpdateForm({
      status: insp.status,
      findings: insp.findings || '',
      drain_condition_found: insp.drain_condition_found || '',
      flooding_confirmed: insp.flooding_confirmed,
      issue_verified: insp.issue_verified ?? false,
      alert_incorrect: insp.alert_incorrect,
      notes: insp.notes || '',
    });
    setFormError(null);
  };

  const handleUpdate = async () => {
    if (!editInspection) return;
    try {
      setSubmitting(true); setFormError(null);
      const completed = updateForm.status === 'completed' ? new Date().toISOString() : undefined;
      await updateInspection(editInspection.id, {
        status: updateForm.status as InspectionStatus,
        findings: updateForm.findings,
        drain_condition_found: updateForm.drain_condition_found as any,
        flooding_confirmed: updateForm.flooding_confirmed,
        issue_verified: updateForm.issue_verified,
        alert_incorrect: updateForm.alert_incorrect,
        notes: updateForm.notes,
        ...(completed ? { completed_date: completed } : {}),
      });
      setEditInspection(null);
      setSuccessMsg('Inspection updated.'); await fetchData();
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: unknown) { setFormError(err instanceof Error ? err.message : 'Update failed'); }
    finally { setSubmitting(false); }
  };

  if (loading) return <LoadingState message="Loading inspections..." />;
  if (error) return <ErrorState error={error} onRetry={fetchData} />;

  return (
    <div className="page-enter space-y-6">
      <PageHeader
        title="Inspection Center"
        subtitle="Human review and field inspection workflow — flooding must be confirmed by human inspection, not risk score alone"
        actions={
          <div className="flex gap-3">
            <Button variant="secondary" size="sm" icon={<RefreshCw className="w-4 h-4" />} onClick={() => { setLoading(true); fetchData(); }}>Refresh</Button>
            <Button size="sm" icon={<Plus className="w-4 h-4" />} onClick={() => { setShowCreateModal(true); setFormError(null); }}>Create Inspection</Button>
          </div>
        }
      />

      <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl text-sm text-blue-800">
        <strong>Important:</strong> The system never automatically marks a location as flooded.
        Field inspections by qualified officers are required to confirm actual flood conditions.
        Risk scores are estimated predictions only.
      </div>

      {successMsg && (
        <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-xl text-sm text-green-800">
          <CheckCircle className="w-4 h-4" /> {successMsg}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <StatCard label="Total Inspections" value={stats.total} icon={<ClipboardCheck className="w-5 h-5" />} variant="blue" />
        <StatCard label="Pending" value={stats.pending} icon={<ClipboardCheck className="w-5 h-5" />} variant="orange" />
        <StatCard label="In Progress" value={stats.inProgress} icon={<ClipboardCheck className="w-5 h-5" />} variant="purple" />
        <StatCard label="Completed" value={stats.completed} icon={<CheckCircle className="w-5 h-5" />} variant="green" />
        <StatCard label="Critical Priority" value={stats.critical} icon={<ClipboardCheck className="w-5 h-5" />} variant="red" />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4 p-4 bg-white rounded-xl border border-slate-200">
        <Filter className="w-4 h-4 text-slate-400" />
        <Select label="Status" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          options={[{ value: 'all', label: 'All Statuses' }, { value: 'pending', label: 'Pending' }, { value: 'in_progress', label: 'In Progress' }, { value: 'completed', label: 'Completed' }, { value: 'cancelled', label: 'Cancelled' }]}
        />
        <Select label="Priority" value={filterPriority} onChange={e => setFilterPriority(e.target.value)}
          options={[{ value: 'all', label: 'All Priorities' }, { value: 'critical', label: 'Critical' }, { value: 'high', label: 'High' }, { value: 'medium', label: 'Medium' }, { value: 'low', label: 'Low' }]}
        />
        <span className="text-xs text-slate-400">{filtered.length} inspections</span>
      </div>

      {/* Inspections Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.length === 0 ? (
          <div className="col-span-full text-center py-12 text-slate-400">
            <ClipboardCheck className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p>No inspections match the selected filters.</p>
          </div>
        ) : filtered.map(insp => {
          const loc = locations.find(l => l.id === insp.location_id);
          const ra = assessments.find(a => a.location_id === insp.location_id);
          return (
            <div key={insp.id} className={`bg-white rounded-xl border p-5 card-hover ${
              insp.priority === 'critical' ? 'border-red-200' :
              insp.priority === 'high' ? 'border-orange-200' : 'border-slate-200'
            }`}>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-semibold text-slate-800">{insp.title}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{loc?.name || `Location #${insp.location_id}`}</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <StatusBadge status={insp.status} />
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${PRIORITY_COLORS[insp.priority]}`}>
                    {insp.priority}
                  </span>
                </div>
              </div>

              {ra && (
                <div className="mb-3 p-2 bg-slate-50 rounded-lg flex items-center gap-2">
                  <RiskBadge category={ra.risk_category} score={ra.risk_score} />
                  <span className="text-xs text-slate-500">predicted risk</span>
                  {ra.warning_triggered && <span className="text-xs text-red-600">⚠ warning</span>}
                </div>
              )}

              <div className="space-y-1.5 text-xs mb-3">
                {insp.assigned_to && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Assigned to:</span>
                    <span className="font-medium">{insp.assigned_to}</span>
                  </div>
                )}
                {insp.scheduled_date && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Scheduled:</span>
                    <span className="font-medium">{format(parseISO(insp.scheduled_date), 'MMM d, yyyy')}</span>
                  </div>
                )}
                {insp.flooding_confirmed && (
                  <div className="flex items-center gap-1 text-red-600 font-medium">
                    <span className="w-2 h-2 rounded-full bg-red-600" />
                    Flooding confirmed by officer
                  </div>
                )}
                {insp.findings && (
                  <p className="text-slate-500 italic line-clamp-2">{insp.findings}</p>
                )}
              </div>

              <Button
                variant="secondary"
                size="sm"
                className="w-full"
                icon={<Edit2 className="w-3.5 h-3.5" />}
                onClick={() => openUpdate(insp)}
              >
                Update Inspection
              </Button>
            </div>
          );
        })}
      </div>

      {/* Create Modal */}
      <Modal open={showCreateModal} onClose={() => setShowCreateModal(false)} title="Create Inspection Task"
        footer={<div className="flex gap-3 justify-end"><Button variant="secondary" onClick={() => setShowCreateModal(false)}>Cancel</Button><Button onClick={handleCreate} loading={submitting}>Create Task</Button></div>}
      >
        <div className="space-y-4">
          {formError && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">{formError}</div>}
          <Select label="Location *" value={createForm.location_id} onChange={e => setCreateForm(f => ({ ...f, location_id: e.target.value }))}
            options={[{ value: '', label: 'Select location...' }, ...locations.map(l => ({ value: String(l.id), label: l.name }))]}
          />
          <Input label="Inspection Title *" value={createForm.title} onChange={e => setCreateForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Drainage blockage inspection" />
          <Select label="Priority" value={createForm.priority} onChange={e => setCreateForm(f => ({ ...f, priority: e.target.value }))}
            options={[{ value: 'low', label: 'Low' }, { value: 'medium', label: 'Medium' }, { value: 'high', label: 'High' }, { value: 'critical', label: 'Critical' }]}
          />
          <Input label="Assigned To" value={createForm.assigned_to} onChange={e => setCreateForm(f => ({ ...f, assigned_to: e.target.value }))} />
          <Input label="Scheduled Date" type="datetime-local" value={createForm.scheduled_date} onChange={e => setCreateForm(f => ({ ...f, scheduled_date: e.target.value }))} />
          <Textarea label="Notes" rows={3} value={createForm.notes} onChange={e => setCreateForm(f => ({ ...f, notes: e.target.value }))} placeholder="Additional context for the inspector..." />
        </div>
      </Modal>

      {/* Update Modal */}
      <Modal open={!!editInspection} onClose={() => setEditInspection(null)} title="Update Inspection Record" size="lg"
        footer={<div className="flex gap-3 justify-end"><Button variant="secondary" onClick={() => setEditInspection(null)}>Cancel</Button><Button onClick={handleUpdate} loading={submitting}>Save</Button></div>}
      >
        <div className="space-y-4">
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
            <strong>Responsibility:</strong> Marking "Flooding Confirmed" is a human decision that updates official records.
            Only check this after physically confirming flood conditions on-site.
          </div>
          {formError && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">{formError}</div>}
          <Select label="Status" value={updateForm.status} onChange={e => setUpdateForm(f => ({ ...f, status: e.target.value }))}
            options={[{ value: 'pending', label: 'Pending' }, { value: 'in_progress', label: 'In Progress' }, { value: 'completed', label: 'Completed' }, { value: 'cancelled', label: 'Cancelled' }]}
          />
          <Textarea label="Inspection Findings" rows={4} value={updateForm.findings} onChange={e => setUpdateForm(f => ({ ...f, findings: e.target.value }))} placeholder="Describe actual conditions found..." />
          <Select label="Drain Condition Found" value={updateForm.drain_condition_found} onChange={e => setUpdateForm(f => ({ ...f, drain_condition_found: e.target.value }))}
            options={[{ value: '', label: 'Not inspected' }, { value: 'clear', label: 'Clear' }, { value: 'partially_blocked', label: 'Partially Blocked' }, { value: 'blocked', label: 'Blocked' }, { value: 'unknown', label: 'Unknown' }]}
          />
          <div className="space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={updateForm.flooding_confirmed} onChange={e => setUpdateForm(f => ({ ...f, flooding_confirmed: e.target.checked }))} className="w-4 h-4 rounded" />
              <div>
                <span className="text-sm font-semibold text-red-700">Flooding Confirmed</span>
                <p className="text-xs text-slate-500">Only check after physical confirmation on-site. Cannot be set by risk score alone.</p>
              </div>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={updateForm.issue_verified} onChange={e => setUpdateForm(f => ({ ...f, issue_verified: e.target.checked }))} className="w-4 h-4 rounded" />
              <span className="text-sm font-medium text-slate-700">Issue Verified by Officer</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={updateForm.alert_incorrect} onChange={e => setUpdateForm(f => ({ ...f, alert_incorrect: e.target.checked }))} className="w-4 h-4 rounded" />
              <div>
                <span className="text-sm font-medium text-slate-700">Risk Alert Was Incorrect</span>
                <p className="text-xs text-slate-500">Mark if inspection found the predicted risk to be unwarranted</p>
              </div>
            </label>
          </div>
          <Textarea label="Review Notes" rows={3} value={updateForm.notes} onChange={e => setUpdateForm(f => ({ ...f, notes: e.target.value }))} placeholder="Additional notes..." />
        </div>
      </Modal>
    </div>
  );
}
