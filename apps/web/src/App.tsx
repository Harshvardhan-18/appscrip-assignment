import React, { useState } from 'react';
import { PlatformProvider, usePlatformStore } from './store/PlatformContext.js';
import { ConnectionBanner } from './components/ConnectionBanner.js';
import { Header } from './components/Header.js';
import { OverviewPage } from './pages/OverviewPage.js';
import { DevicesPage } from './pages/DevicesPage.js';
import { LiveEventsPage } from './pages/LiveEventsPage.js';
import { IncidentsPage } from './pages/IncidentsPage.js';
import { RulesPage } from './pages/RulesPage.js';
import { OpsPage } from './pages/OpsPage.js';
import { ExplainModal } from './components/ExplainModal.js';

function DashboardLayout() {
  const { state, refetchState } = usePlatformStore();
  const { connection, stats, incidents } = state;

  const [activeTab, setActiveTab] = useState<string>('overview');
  const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>(null);
  const [selectedExplainEventId, setSelectedExplainEventId] = useState<string | null>(null);
  const [selectedDeviceFilter, setSelectedDeviceFilter] = useState<string | null>(null);

  const openIncidentsCount = Object.values(incidents).filter(
    (i) => i.status === 'open' || i.status === 'acknowledged'
  ).length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-teal-500 selection:text-white">
      {/* Persistent Connection Banner */}
      <ConnectionBanner connection={connection} onManualReconnect={refetchState} />

      {/* Global Header */}
      <Header
        stats={stats}
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
          // If leaving incidents, close drawer
          if (tab !== 'incidents') {
            setSelectedIncidentId(null);
          }
        }}
        openIncidentsCount={openIncidentsCount}
      />

      {/* Main Page Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'overview' && (
          <OverviewPage
            onNavigateTab={(tab) => setActiveTab(tab)}
            onSelectIncident={(id) => {
              setSelectedIncidentId(id);
              setActiveTab('incidents');
            }}
          />
        )}

        {activeTab === 'devices' && (
          <DevicesPage
            onFilterDeviceEvents={(deviceId) => {
              setSelectedDeviceFilter(deviceId);
              setActiveTab('events');
            }}
          />
        )}

        {activeTab === 'events' && (
          <LiveEventsPage
            initialDeviceFilter={selectedDeviceFilter}
            onClearInitialDeviceFilter={() => setSelectedDeviceFilter(null)}
            onExplainEvent={(evId) => setSelectedExplainEventId(evId)}
          />
        )}

        {activeTab === 'incidents' && (
          <IncidentsPage
            selectedIncidentId={selectedIncidentId}
            onSelectIncident={setSelectedIncidentId}
            onExplainEvent={(evId) => setSelectedExplainEventId(evId)}
          />
        )}

        {activeTab === 'rules' && <RulesPage />}

        {activeTab === 'ops' && <OpsPage />}
      </main>

      {/* Explainability Inspector Modal */}
      {selectedExplainEventId && (
        <ExplainModal
          eventId={selectedExplainEventId}
          onClose={() => setSelectedExplainEventId(null)}
        />
      )}
    </div>
  );
}

export function App() {
  return (
    <PlatformProvider>
      <DashboardLayout />
    </PlatformProvider>
  );
}

export default App;
