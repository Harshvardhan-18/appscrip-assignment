import React, { useState, useEffect } from 'react';
import { PlatformProvider, usePlatformStore } from './store/PlatformContext.js';
import { ThemeProvider } from './store/ThemeContext.js';
import { ToastProvider } from './components/Toast.js';
import { Sidebar } from './components/Sidebar.js';
import { ConnectionBanner } from './components/ConnectionBanner.js';
import { CommandPalette } from './components/CommandPalette.js';
import { OverviewPage } from './pages/OverviewPage.js';
import { DevicesPage } from './pages/DevicesPage.js';
import { LiveEventsPage } from './pages/LiveEventsPage.js';
import { IncidentsPage } from './pages/IncidentsPage.js';
import { RulesPage } from './pages/RulesPage.js';
import { OpsPage } from './pages/OpsPage.js';
import { ExplainModal } from './components/ExplainModal.js';

function DashboardLayout() {
  const { state, refetchState } = usePlatformStore();
  const { connection, incidents } = state;

  const [activeTab, setActiveTab] = useState<string>('overview');
  const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>(null);
  const [selectedExplainEventId, setSelectedExplainEventId] = useState<string | null>(null);
  const [selectedDeviceFilter, setSelectedDeviceFilter] = useState<string | null>(null);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState<boolean>(false);

  const openIncidentsCount = Object.values(incidents).filter(
    (i) => i.status === 'open' || i.status === 'acknowledged'
  ).length;

  // Global Cmd/Ctrl+K shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="min-h-screen bg-[var(--canvas)] text-[var(--ink)] flex flex-col md:flex-row font-sans">
      {/* Slim Left Sidebar (Collapses on mobile) */}
      <Sidebar
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
          if (tab !== 'incidents') {
            setSelectedIncidentId(null);
          }
        }}
        openIncidentsCount={openIncidentsCount}
        connection={connection}
        onReconnect={refetchState}
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 pb-16 md:pb-0">
        {/* Connection Alert Banner (Only expands when reconnecting or offline) */}
        <ConnectionBanner connection={connection} onManualReconnect={refetchState} />

        <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
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
      </div>

      {/* Explain Inspector Modal */}
      {selectedExplainEventId && (
        <ExplainModal
          eventId={selectedExplainEventId}
          onClose={() => setSelectedExplainEventId(null)}
        />
      )}

      {/* Command Palette */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onNavigateTab={(tab) => {
          setActiveTab(tab);
          if (tab !== 'incidents') setSelectedIncidentId(null);
        }}
        onSelectIncident={(id) => {
          setSelectedIncidentId(id);
          setActiveTab('incidents');
        }}
        onFilterDevice={(devId) => {
          setSelectedDeviceFilter(devId);
          setActiveTab('events');
        }}
      />
    </div>
  );
}

export function App() {
  return (
    <ThemeProvider>
      <PlatformProvider>
        <ToastProvider>
          <DashboardLayout />
        </ToastProvider>
      </PlatformProvider>
    </ThemeProvider>
  );
}

export default App;
