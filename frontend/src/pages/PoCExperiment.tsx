import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { FlaskConical, Plus, Download, Settings, CheckCircle, XCircle, Clock } from 'lucide-react';
import {
  Card, LoadingState, PageHeader, Button, Select, Input, Textarea, Modal, StatCard
} from '../components/ui';
import { getLocations } from '../services/api';
import type { Location } from '../types';

interface ExperimentConfig {
  pass_threshold_time_seconds: number;
  pass_threshold_accuracy: number;
}

interface ExperimentObservation {
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

const STORAGE_KEY = 'drainwatch_poc_observations';
const CONFIG_KEY = 'drainwatch_poc_config';

const DEFAULT_CONFIG: ExperimentConfig = {
  pass_threshold_time_seconds: 120,
  pass_threshold_accuracy: 0.8,
};

function loadObservations(): ExperimentObservation[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveObservations(obs: ExperimentObservation[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(obs));
}

function loadConfig(): ExperimentConfig {
  try {
    const raw = localStorage.getItem(CONFIG_KEY);
    return raw ? JSON.parse(raw) : DEFAULT_CONFIG;
  } catch { return DEFAULT_CONFIG; }
}

export default function PoCExperimentPage() {
  const [observations, setObservations] = useState<ExperimentObservation[]>(loadObservations());
  const [config, setConfig] = useState<ExperimentConfig>(loadConfig());
  const [locations, setLocations] = useState<Location[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [form, setForm] = useState({
    test_case_id: '',
    location: '',
    review_method: 'baseline',
    time_taken_seconds: '',
    risk_correctly_identified: '',
    incorrect_warning: 'false',
    reviewer_notes: '',
  });

  const [configForm, setConfigForm] = useState({ ...config });

  useEffect(() => {
    getLocations().then(locs => setLocations(locs)).catch(() => {});
  }, []);

  const handleAdd = () => {
    if (!form.test_case_id.trim() || !form.location.trim()) {
      setFormError('Test Case ID and Location are required.'); return;
    }
    const obs: ExperimentObservation = {
      id: `obs-${Date.now()}`,
      test_case_id: form.test_case_id.trim(),
      location: form.location.trim(),
      review_method: form.review_method as 'baseline' | 'combined_system',
      time_taken_seconds: form.time_taken_seconds ? parseFloat(form.time_taken_seconds) : null,
      risk_correctly_identified: form.risk_correctly_identified === '' ? null : form.risk_correctly_identified === 'true',
      incorrect_warning: form.incorrect_warning === 'true',
      reviewer_notes: form.reviewer_notes.trim(),
      created_at: new Date().toISOString(),
    };
    const updated = [...observations, obs];
    setObservations(updated);
    saveObservations(updated);
    setShowAddModal(false);
    setForm({ test_case_id: '', location: '', review_method: 'baseline', time_taken_seconds: '', risk_correctly_identified: '', incorrect_warning: 'false', reviewer_notes: '' });
    setFormError(null);
  };

  const handleSaveConfig = () => {
    setConfig(configForm);
    localStorage.setItem(CONFIG_KEY, JSON.stringify(configForm));
    setShowConfigModal(false);
  };

  const handleDelete = (id: string) => {
    const updated = observations.filter(o => o.id !== id);
    setObservations(updated);
    saveObservations(updated);
  };

  const handleExport = () => {
    const csv = [
      'Test Case ID,Location,Method,Time (s),Risk Identified,Incorrect Warning,Notes,Recorded At',
      ...observations.map(o =>
        [
          o.test_case_id, o.location, o.review_method,
          o.time_taken_seconds ?? 'Not tested',
          o.risk_correctly_identified === null ? 'Not tested' : o.risk_correctly_identified ? 'Yes' : 'No',
          o.incorrect_warning ? 'Yes' : 'No',
          `"${o.reviewer_notes.replace(/"/g, '""')}"`,
          o.created_at
        ].join(',')
      )
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `drainwatch_poc_results_${format(new Date(), 'yyyyMMdd_HHmm')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Compute summary stats
  const baselineObs = observations.filter(o => o.review_method === 'baseline');
  const combinedObs = observations.filter(o => o.review_method === 'combined_system');

  const avgTime = (obs: ExperimentObservation[]) => {
    const timed = obs.filter(o => o.time_taken_seconds !== null);
    if (!timed.length) return null;
    return timed.reduce((s, o) => s + (o.time_taken_seconds || 0), 0) / timed.length;
  };

  const accuracy = (obs: ExperimentObservation[]) => {
    const tested = obs.filter(o => o.risk_correctly_identified !== null);
    if (!tested.length) return null;
    return tested.filter(o => o.risk_correctly_identified).length / tested.length;
  };

  const baselineAvgTime = avgTime(baselineObs);
  const combinedAvgTime = avgTime(combinedObs);
  const baselineAccuracy = accuracy(baselineObs);
  const combinedAccuracy = accuracy(combinedObs);

  const passBadge = (value: number | null, threshold: number, invert = false) => {
    if (value === null) return <span className="text-xs text-slate-400">Not tested</span>;
    const pass = invert ? value <= threshold : value >= threshold;
    return pass
      ? <span className="flex items-center gap-1 text-green-600 text-xs font-medium"><CheckCircle className="w-3.5 h-3.5" />Pass</span>
      : <span className="flex items-center gap-1 text-red-600 text-xs font-medium"><XCircle className="w-3.5 h-3.5" />Fail</span>;
  };

  return (
    <div className="page-enter space-y-6">
      <PageHeader
        title="PoC Experiment"
        subtitle="Proof-of-concept evaluation comparing baseline vs. DrainWatch AI combined system"
        actions={
          <div className="flex gap-3">
            <Button variant="secondary" size="sm" icon={<Settings className="w-4 h-4" />} onClick={() => { setConfigForm({ ...config }); setShowConfigModal(true); }}>
              Configure
            </Button>
            <Button variant="secondary" size="sm" icon={<Download className="w-4 h-4" />} onClick={handleExport} disabled={observations.length === 0}>
              Export CSV
            </Button>
            <Button size="sm" icon={<Plus className="w-4 h-4" />} onClick={() => { setShowAddModal(true); setFormError(null); }}>
              Add Observation
            </Button>
          </div>
        }
      />

      {/* Experiment Design */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card title="Baseline Method" subtitle="Control group">
          <div className="space-y-2 text-sm text-slate-600">
            <p>A reviewer examines rainfall data, drainage records and citizen reports <strong>separately</strong> from different sources, without the combined DrainWatch AI dashboard.</p>
            <ul className="space-y-1 mt-2 text-xs">
              <li>• Check rainfall spreadsheet / report</li>
              <li>• Check drainage condition log separately</li>
              <li>• Review citizen complaints from separate system</li>
              <li>• Manually determine if waterlogging risk exists</li>
            </ul>
          </div>
        </Card>
        <Card title="Combined System" subtitle="DrainWatch AI experimental condition">
          <div className="space-y-2 text-sm text-slate-600">
            <p>A reviewer uses the <strong>DrainWatch AI dashboard</strong> which fuses rainfall, drainage, historical data and citizen reports with an explainable risk score.</p>
            <ul className="space-y-1 mt-2 text-xs">
              <li>• Open the DrainWatch AI overview or risk analysis</li>
              <li>• Review the combined risk score and explanation</li>
              <li>• Examine supporting evidence in one interface</li>
              <li>• Determine if waterlogging risk warrants inspection</li>
            </ul>
          </div>
        </Card>
      </div>

      {/* Configuration Panel */}
      <Card title="Experiment Configuration" subtitle="Current pass thresholds">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
          <div className="p-3 bg-slate-50 rounded-lg">
            <p className="text-xs text-slate-500">Time Threshold</p>
            <p className="font-bold text-slate-800">{config.pass_threshold_time_seconds}s</p>
            <p className="text-xs text-slate-400">Max time to identify risk (pass if ≤)</p>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg">
            <p className="text-xs text-slate-500">Accuracy Threshold</p>
            <p className="font-bold text-slate-800">{(config.pass_threshold_accuracy * 100).toFixed(0)}%</p>
            <p className="text-xs text-slate-400">Minimum correct identifications</p>
          </div>
        </div>
      </Card>

      {/* Summary Comparison Table */}
      <Card title="Results Comparison" subtitle="Summary — showing 'Not tested' until observations are entered">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase">Metric</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase">Baseline</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase">DrainWatch AI</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase">Pass (DrainWatch)</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-slate-100">
                <td className="py-3 px-4 font-medium">Observations recorded</td>
                <td className="py-3 px-4">{baselineObs.length || <span className="text-slate-400">0</span>}</td>
                <td className="py-3 px-4">{combinedObs.length || <span className="text-slate-400">0</span>}</td>
                <td className="py-3 px-4">—</td>
              </tr>
              <tr className="border-b border-slate-100">
                <td className="py-3 px-4 font-medium">Avg. time to identify risk</td>
                <td className="py-3 px-4">
                  {baselineAvgTime !== null ? `${baselineAvgTime.toFixed(0)}s` : <span className="text-slate-400">Not tested</span>}
                </td>
                <td className="py-3 px-4">
                  {combinedAvgTime !== null ? `${combinedAvgTime.toFixed(0)}s` : <span className="text-slate-400">Not tested</span>}
                </td>
                <td className="py-3 px-4">{passBadge(combinedAvgTime, config.pass_threshold_time_seconds, true)}</td>
              </tr>
              <tr className="border-b border-slate-100">
                <td className="py-3 px-4 font-medium">Risk identification accuracy</td>
                <td className="py-3 px-4">
                  {baselineAccuracy !== null ? `${(baselineAccuracy * 100).toFixed(0)}%` : <span className="text-slate-400">Not tested</span>}
                </td>
                <td className="py-3 px-4">
                  {combinedAccuracy !== null ? `${(combinedAccuracy * 100).toFixed(0)}%` : <span className="text-slate-400">Not tested</span>}
                </td>
                <td className="py-3 px-4">{passBadge(combinedAccuracy, config.pass_threshold_accuracy)}</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-medium">Incorrect warnings</td>
                <td className="py-3 px-4">{baselineObs.filter(o => o.incorrect_warning).length || <span className="text-slate-400">0</span>}</td>
                <td className="py-3 px-4">{combinedObs.filter(o => o.incorrect_warning).length || <span className="text-slate-400">0</span>}</td>
                <td className="py-3 px-4">—</td>
              </tr>
            </tbody>
          </table>
        </div>
        {observations.length === 0 && (
          <div className="text-center py-6 text-slate-400 text-sm">
            <FlaskConical className="w-8 h-8 mx-auto mb-2 opacity-40" />
            No observations entered yet. Add observations to see results.
          </div>
        )}
      </Card>

      {/* Observations Table */}
      {observations.length > 0 && (
        <Card title="Individual Observations" subtitle={`${observations.length} observation(s) recorded`} padding={false}>
          <div className="overflow-x-auto">
            <table className="w-full data-table">
              <thead>
                <tr>
                  <th>Test Case</th>
                  <th>Location</th>
                  <th>Method</th>
                  <th>Time (s)</th>
                  <th>Risk Identified</th>
                  <th>Incorrect Warning</th>
                  <th>Notes</th>
                  <th>Recorded</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {observations.map(obs => (
                  <tr key={obs.id}>
                    <td className="font-mono text-xs">{obs.test_case_id}</td>
                    <td>{obs.location}</td>
                    <td>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        obs.review_method === 'combined_system'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-slate-100 text-slate-700'
                      }`}>
                        {obs.review_method === 'combined_system' ? 'DrainWatch AI' : 'Baseline'}
                      </span>
                    </td>
                    <td>
                      {obs.time_taken_seconds !== null
                        ? <span className="flex items-center gap-1"><Clock className="w-3 h-3 text-slate-400" />{obs.time_taken_seconds}s</span>
                        : <span className="text-slate-400">Not tested</span>}
                    </td>
                    <td>
                      {obs.risk_correctly_identified === null
                        ? <span className="text-slate-400 text-xs">Not tested</span>
                        : obs.risk_correctly_identified
                        ? <span className="text-green-700 flex items-center gap-1 text-xs"><CheckCircle className="w-3.5 h-3.5" />Yes</span>
                        : <span className="text-red-700 flex items-center gap-1 text-xs"><XCircle className="w-3.5 h-3.5" />No</span>}
                    </td>
                    <td>
                      {obs.incorrect_warning
                        ? <span className="text-red-600 text-xs font-medium">Yes</span>
                        : <span className="text-slate-400 text-xs">No</span>}
                    </td>
                    <td className="text-xs text-slate-500 max-w-xs truncate">{obs.reviewer_notes || '—'}</td>
                    <td className="text-xs text-slate-400">{format(new Date(obs.created_at), 'MMM d, HH:mm')}</td>
                    <td>
                      <button
                        onClick={() => handleDelete(obs.id)}
                        className="text-red-400 hover:text-red-600 text-xs"
                        title="Delete"
                      >
                        ×
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-500">
        <strong>Important:</strong> Experiment results are stored in your browser (localStorage) and are not sent to any server.
        They do not represent fabricated results — all entries require manual observer input.
        Export to CSV to preserve results before clearing browser data.
      </div>

      {/* Add Observation Modal */}
      <Modal open={showAddModal} onClose={() => setShowAddModal(false)} title="Add Experiment Observation" size="lg"
        footer={
          <div className="flex gap-3 justify-end">
            <Button variant="secondary" onClick={() => setShowAddModal(false)}>Cancel</Button>
            <Button onClick={handleAdd}>Save Observation</Button>
          </div>
        }
      >
        <div className="space-y-4">
          {formError && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">{formError}</div>}
          <Input
            label="Test Case ID *"
            value={form.test_case_id}
            onChange={e => setForm(f => ({ ...f, test_case_id: e.target.value }))}
            placeholder="e.g. TC-001, Scenario-A"
          />
          <Select
            label="Location"
            options={[
              { value: '', label: 'Type below if not in list...' },
              ...locations.map(l => ({ value: l.name, label: l.name }))
            ]}
            value={form.location}
            onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
          />
          <Input
            label="Location (override)"
            value={form.location}
            onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
            placeholder="e.g. Syn. Central Road"
          />
          <Select
            label="Review Method *"
            options={[
              { value: 'baseline', label: 'Baseline — separate data sources' },
              { value: 'combined_system', label: 'Combined System — DrainWatch AI' },
            ]}
            value={form.review_method}
            onChange={e => setForm(f => ({ ...f, review_method: e.target.value }))}
          />
          <Input
            label="Time Taken (seconds)"
            type="number"
            min="0"
            value={form.time_taken_seconds}
            onChange={e => setForm(f => ({ ...f, time_taken_seconds: e.target.value }))}
            placeholder="Leave blank if not measured"
          />
          <Select
            label="Risk Correctly Identified"
            options={[
              { value: '', label: 'Not tested / Not applicable' },
              { value: 'true', label: 'Yes — risk was correctly identified' },
              { value: 'false', label: 'No — risk was missed or misidentified' },
            ]}
            value={form.risk_correctly_identified}
            onChange={e => setForm(f => ({ ...f, risk_correctly_identified: e.target.value }))}
          />
          <Select
            label="Incorrect Warning Generated"
            options={[
              { value: 'false', label: 'No — warning was appropriate' },
              { value: 'true', label: 'Yes — warning was incorrect / false positive' },
            ]}
            value={form.incorrect_warning}
            onChange={e => setForm(f => ({ ...f, incorrect_warning: e.target.value }))}
          />
          <Textarea
            label="Reviewer Notes"
            rows={3}
            value={form.reviewer_notes}
            onChange={e => setForm(f => ({ ...f, reviewer_notes: e.target.value }))}
            placeholder="Describe any observations, difficulties or relevant context..."
          />
        </div>
      </Modal>

      {/* Config Modal */}
      <Modal open={showConfigModal} onClose={() => setShowConfigModal(false)} title="Configure Pass Thresholds"
        footer={
          <div className="flex gap-3 justify-end">
            <Button variant="secondary" onClick={() => setShowConfigModal(false)}>Cancel</Button>
            <Button onClick={handleSaveConfig}>Save Configuration</Button>
          </div>
        }
      >
        <div className="space-y-4">
          <Input
            label="Time Threshold (seconds) — pass if DrainWatch AI time ≤ this"
            type="number"
            min="1"
            value={String(configForm.pass_threshold_time_seconds)}
            onChange={e => setConfigForm(f => ({ ...f, pass_threshold_time_seconds: parseInt(e.target.value) || 120 }))}
          />
          <Input
            label="Accuracy Threshold (0–1) — pass if accuracy ≥ this"
            type="number"
            min="0"
            max="1"
            step="0.05"
            value={String(configForm.pass_threshold_accuracy)}
            onChange={e => setConfigForm(f => ({ ...f, pass_threshold_accuracy: parseFloat(e.target.value) || 0.8 }))}
          />
          <p className="text-xs text-slate-400">
            These thresholds define what counts as a "pass" for the DrainWatch AI system in the comparison.
            Configure before running the experiment.
          </p>
        </div>
      </Modal>
    </div>
  );
}
