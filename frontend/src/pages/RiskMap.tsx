import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import { format, parseISO } from 'date-fns';
import { AlertTriangle, MapPin, CloudRain, Droplets, Filter, RefreshCw, Info } from 'lucide-react';
import {
  RiskBadge, DrainageBadge, RainfallBadge, Card, LoadingState,
  ErrorState, SyntheticDisclaimer, PageHeader, Button, Select, RiskScoreRing
} from '../components/ui';
import { getLocations, getRiskAssessments } from '../services/api';
import type { Location, RiskAssessment, RiskCategory } from '../types';

const RISK_COLORS: Record<string, string> = {
  low: '#22c55e',
  moderate: '#f59e0b',
  high: '#f97316',
  critical: '#ef4444',
};

function MapCenterUpdater({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
}

interface LocationWithRisk extends Location {
  latest_risk?: RiskAssessment;
}

export default function RiskMapPage() {
  const [locations, setLocations] = useState<LocationWithRisk[]>([]);
  const [assessments, setAssessments] = useState<RiskAssessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<LocationWithRisk | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number]>([12.97, 77.59]);
  const [filters, setFilters] = useState({
    riskLevel: 'all',
    area: 'all',
    drainageCondition: 'all',
  });

  const fetchData = async () => {
    try {
      setError(null);
      const [locs, risks] = await Promise.all([getLocations(), getRiskAssessments()]);
      const riskMap = new Map(risks.map(r => [r.location_id, r]));
      const locsWithRisk = locs.map(l => ({ ...l, latest_risk: riskMap.get(l.id) }));
      setLocations(locsWithRisk);
      setAssessments(risks);
      if (locsWithRisk.length > 0) {
        const avgLat = locsWithRisk.reduce((s, l) => s + l.latitude, 0) / locsWithRisk.length;
        const avgLon = locsWithRisk.reduce((s, l) => s + l.longitude, 0) / locsWithRisk.length;
        setMapCenter([avgLat, avgLon]);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load map data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const areas = ['all', ...new Set(locations.map(l => l.area))];

  const filteredLocations = locations.filter(loc => {
    if (filters.riskLevel !== 'all' && loc.latest_risk?.risk_category !== filters.riskLevel) return false;
    if (filters.area !== 'all' && loc.area !== filters.area) return false;
    return true;
  });

  const highRiskList = locations
    .filter(l => l.latest_risk && ['high', 'critical'].includes(l.latest_risk.risk_category))
    .sort((a, b) => (b.latest_risk?.risk_score || 0) - (a.latest_risk?.risk_score || 0));

  if (loading) return <LoadingState message="Loading risk map..." />;
  if (error) return <ErrorState error={error} onRetry={fetchData} />;

  return (
    <div className="page-enter space-y-4">
      <PageHeader
        title="Risk Map"
        subtitle="Interactive waterlogging risk map — all locations are synthetic demonstration data"
        actions={
          <Button variant="secondary" size="sm" icon={<RefreshCw className="w-4 h-4" />} onClick={() => { setLoading(true); fetchData(); }}>
            Refresh
          </Button>
        }
      />

      <SyntheticDisclaimer />

      {/* Filters */}
      <Card padding={false}>
        <div className="flex flex-wrap items-center gap-4 px-5 py-3">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <span className="text-sm font-medium text-slate-600">Filters:</span>
          </div>
          <Select
            options={[
              { value: 'all', label: 'All Risk Levels' },
              { value: 'low', label: 'Low' },
              { value: 'moderate', label: 'Moderate' },
              { value: 'high', label: 'High' },
              { value: 'critical', label: 'Critical' },
            ]}
            value={filters.riskLevel}
            onChange={e => setFilters(f => ({ ...f, riskLevel: e.target.value }))}
          />
          <Select
            options={areas.map(a => ({ value: a, label: a === 'all' ? 'All Areas' : a }))}
            value={filters.area}
            onChange={e => setFilters(f => ({ ...f, area: e.target.value }))}
          />
          <span className="text-xs text-slate-400 ml-auto">{filteredLocations.length} locations shown</span>
        </div>
      </Card>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-4">
        {/* Map */}
        <div className="xl:col-span-3">
          <div className="h-[580px] rounded-xl overflow-hidden border border-slate-200 shadow-card">
            <MapContainer center={mapCenter} zoom={12} style={{ height: '100%', width: '100%' }}>
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              />
              <MapCenterUpdater center={mapCenter} />
              {filteredLocations.map((loc) => {
                const cat = (loc.latest_risk?.risk_category || 'low') as RiskCategory;
                const color = RISK_COLORS[cat];
                const radius = cat === 'critical' ? 16 : cat === 'high' ? 13 : cat === 'moderate' ? 10 : 8;
                return (
                  <CircleMarker
                    key={loc.id}
                    center={[loc.latitude, loc.longitude]}
                    radius={radius}
                    fillColor={color}
                    color={color}
                    weight={2}
                    opacity={0.9}
                    fillOpacity={0.6}
                    eventHandlers={{
                      click: () => setSelectedLocation(loc),
                    }}
                  >
                    <Popup>
                      <div className="font-sans min-w-[200px]">
                        <p className="font-bold text-slate-800">{loc.name}</p>
                        <p className="text-xs text-slate-500">{loc.area}</p>
                        {loc.latest_risk && (
                          <div className="mt-2 space-y-1">
                            <p className="text-sm">Risk Score: <strong>{loc.latest_risk.risk_score.toFixed(0)}</strong></p>
                            <p className="text-sm capitalize">Category: <strong>{loc.latest_risk.risk_category}</strong></p>
                            {loc.latest_risk.warning_triggered && (
                              <p className="text-xs text-red-600 mt-1">⚠ Warning triggered</p>
                            )}
                          </div>
                        )}
                        <p className="text-xs text-purple-600 mt-2">📍 Synthetic demo location</p>
                      </div>
                    </Popup>
                  </CircleMarker>
                );
              })}
            </MapContainer>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap items-center gap-6 mt-3 px-2">
            {Object.entries(RISK_COLORS).map(([cat, color]) => (
              <div key={cat} className="flex items-center gap-2">
                <span className="w-4 h-4 rounded-full" style={{ backgroundColor: color, opacity: 0.8 }} />
                <span className="text-xs text-slate-600 capitalize">{cat}</span>
              </div>
            ))}
            <span className="text-xs text-slate-400 ml-auto">Larger circles = higher risk</span>
          </div>
        </div>

        {/* Sidebar: High Risk List + Selected Location Details */}
        <div className="space-y-4 overflow-y-auto max-h-[640px]">
          {selectedLocation && (
            <Card title="Location Details" padding={false}>
              <div className="p-4 space-y-3">
                <div>
                  <p className="font-semibold text-slate-800">{selectedLocation.name}</p>
                  <p className="text-xs text-slate-500">{selectedLocation.area}</p>
                  <span className="synthetic-badge mt-1">Synthetic Demo</span>
                </div>
                {selectedLocation.latest_risk ? (
                  <>
                    <div className="flex items-center gap-3">
                      <RiskScoreRing score={selectedLocation.latest_risk.risk_score} category={selectedLocation.latest_risk.risk_category} size="sm" />
                      <div>
                        <RiskBadge category={selectedLocation.latest_risk.risk_category} />
                        <p className="text-xs text-slate-500 mt-1">Trend: {selectedLocation.latest_risk.risk_trend}</p>
                      </div>
                    </div>
                    <div className="text-xs text-slate-600 bg-slate-50 rounded-lg p-3 leading-relaxed">
                      {selectedLocation.latest_risk.explanation}
                    </div>
                    {selectedLocation.latest_risk.warning_triggered && (
                      <div className="flex items-start gap-2 p-2 bg-red-50 border border-red-200 rounded-lg">
                        <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                        <p className="text-xs text-red-700">{selectedLocation.latest_risk.warning_message}</p>
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-sm text-slate-400">No risk assessment available</p>
                )}
                <div className="text-xs space-y-1">
                  <p>Low-lying: <strong>{selectedLocation.is_low_lying ? 'Yes' : 'No'}</strong></p>
                  <p>Drainage capacity: <strong className="capitalize">{selectedLocation.drainage_capacity}</strong></p>
                  <p>Historical frequency: <strong className="capitalize">{selectedLocation.historical_waterlogging_frequency?.replace('_', ' ')}</strong></p>
                </div>
              </div>
            </Card>
          )}

          <Card title="High-Risk Locations" subtitle="Locations needing attention" padding={false}>
            {highRiskList.length === 0 ? (
              <p className="text-sm text-slate-400 p-4 text-center">No high-risk locations</p>
            ) : (
              <div className="divide-y divide-slate-100">
                {highRiskList.map((loc) => (
                  <button
                    key={loc.id}
                    className="w-full text-left px-4 py-3 hover:bg-slate-50 transition-colors"
                    onClick={() => {
                      setSelectedLocation(loc);
                      setMapCenter([loc.latitude, loc.longitude]);
                    }}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-800 truncate">{loc.name}</p>
                        <p className="text-xs text-slate-400">{loc.area}</p>
                      </div>
                      {loc.latest_risk && (
                        <RiskBadge category={loc.latest_risk.risk_category} score={loc.latest_risk.risk_score} />
                      )}
                    </div>
                    {loc.latest_risk?.warning_triggered && (
                      <p className="text-xs text-red-600 mt-1">⚠ Warning triggered</p>
                    )}
                  </button>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
