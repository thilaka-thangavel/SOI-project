import React, { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { Menu, X } from 'lucide-react';

// Pages
import OverviewPage from './pages/Overview';
import RiskMapPage from './pages/RiskMap';
import RainfallPage from './pages/RainfallMonitoring';
import DrainagePage from './pages/DrainageMonitoring';
import CitizenReportsPage from './pages/CitizenReports';
import RiskAnalysisPage from './pages/RiskAnalysis';
import InspectionCenterPage from './pages/InspectionCenter';
import AnalyticsPage from './pages/Analytics';
import DataSourcesPage from './pages/DataSources';
import PoCExperimentPage from './pages/PoCExperiment';

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <BrowserRouter>
      <div className="flex min-h-screen bg-slate-50">
        {/* Sidebar */}
        <Sidebar collapsed={!sidebarOpen} />

        {/* Main content */}
        <div
          className="flex-1 flex flex-col min-h-screen transition-all duration-300"
          style={{ marginLeft: sidebarOpen ? '260px' : '64px' }}
        >
          {/* Top header bar */}
          <header className="sticky top-0 z-30 h-14 bg-white border-b border-slate-200 flex items-center px-6 gap-4 shadow-sm">
            <button
              onClick={() => setSidebarOpen(v => !v)}
              className="text-slate-400 hover:text-slate-700 transition-colors p-1 rounded"
              aria-label="Toggle sidebar"
            >
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <div className="flex items-center gap-2 ml-auto">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-xs text-slate-500 font-medium">Backend Connected</span>
              </div>
              <div className="h-4 w-px bg-slate-200 mx-2" />
              <span className="text-xs text-purple-600 bg-purple-50 px-2 py-1 rounded-full font-medium border border-purple-200">
                Synthetic Demo Data
              </span>
              <div className="h-4 w-px bg-slate-200 mx-2" />
              <span className="text-xs text-amber-700 bg-amber-50 px-2 py-1 rounded-full font-medium border border-amber-200">
                ⚠ Experimental — Not Official Forecasts
              </span>
            </div>
          </header>

          {/* Page content */}
          <main className="flex-1 p-6 overflow-auto">
            <Routes>
              <Route path="/" element={<OverviewPage />} />
              <Route path="/risk-map" element={<RiskMapPage />} />
              <Route path="/rainfall" element={<RainfallPage />} />
              <Route path="/drainage" element={<DrainagePage />} />
              <Route path="/reports" element={<CitizenReportsPage />} />
              <Route path="/risk-analysis" element={<RiskAnalysisPage />} />
              <Route path="/inspections" element={<InspectionCenterPage />} />
              <Route path="/analytics" element={<AnalyticsPage />} />
              <Route path="/data-sources" element={<DataSourcesPage />} />
              <Route path="/poc-experiment" element={<PoCExperimentPage />} />
            </Routes>
          </main>

          {/* Footer */}
          <footer className="px-6 py-3 border-t border-slate-200 bg-white">
            <p className="text-xs text-slate-400">
              DrainWatch AI v1.0 — Experimental Waterlogging Early Warning System.
              All data is synthetic. Risk scores are not official flood forecasts.
              Human inspection required to confirm any flood conditions.
            </p>
          </footer>
        </div>
      </div>
    </BrowserRouter>
  );
}
