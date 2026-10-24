import React from 'react';
import { usePlatformStore } from '../store/PlatformContext.js';
import { Incident } from '../types.js';

interface OverviewPageProps {
  onNavigateTab: (tab: string) => void;
  onSelectIncident: (id: string) => void;
}

export const OverviewPage: React.FC<OverviewPageProps> = ({ onNavigateTab, onSelectIncident }) => {
  const { state } = usePlatformStore();
  const { stats, incidents, devices, liveEvents, connection } = state;

  const incidentsList = Object.values(incidents);
  const devicesList = Object.values(devices);
  const openIncidents = incidentsList.filter(
    (i) => i.status === 'open' || i.status === 'acknowledged'
  );

  return (
    <div className="space-y-6">
      {/* Top Header bar with status indicator */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center space-x-2">
            <span>Platform Overview</span>
            {connection.isStale && (
              <span className="text-[10px] font-mono font-semibold bg-amber-900/60 text-amber-300 border border-amber-700/60 px-2 py-0.5 rounded uppercase">
                Data Stale
              </span>
            )}
          </h2>
          <p className="text-xs text-slate-400 mt-1 font-mono">
            Durable operations engine backed by PostgreSQL 16 · Real-time SSE fan-out
          </p>
        </div>

        <div className="flex items-center space-x-3 text-xs font-mono">
          <div className="bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800 flex items-center space-x-2">
            <span className="text-slate-400">Throughput:</span>
            <span className="font-bold text-teal-400">{stats?.events_per_minute ?? 0} ev/min</span>
          </div>
          <button
            onClick={() => onNavigateTab('events')}
            className="px-3 py-1.5 rounded-lg bg-teal-600/20 hover:bg-teal-600/30 text-teal-300 border border-teal-500/30 font-medium transition"
          >
            Watch Stream &rarr;
          </button>
        </div>
      </div>

      {/* Core Stats Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Ingestion & Rate */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm hover:border-slate-700 transition">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-2">
            <span>EVENT INGESTION</span>
            <span className="text-teal-400 font-bold">POST /v1/events</span>
          </div>
          <div className="text-2xl font-bold font-mono text-white">
            {stats?.events_per_minute ?? 0}
            <span className="text-xs font-normal text-slate-400 ml-1">/ min</span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs font-mono text-slate-400">
            <span>Buffer Depth</span>
            <span className="font-semibold text-slate-200">
              {stats?.queue_depth_and_lag.depth ?? 0}
            </span>
          </div>
        </div>

        {/* Fleet Health */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm hover:border-slate-700 transition">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-2">
            <span>DEVICE FLEET</span>
            <span className="text-emerald-400 font-bold">
              {stats?.devices_by_status.online ??
                devicesList.filter((d) => d.status === 'online').length}{' '}
              ONLINE
            </span>
          </div>
          <div className="text-2xl font-bold font-mono text-white">
            {stats?.devices_by_status.total ?? devicesList.length}
            <span className="text-xs font-normal text-slate-400 ml-1">total devices</span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs font-mono">
            <span className="text-amber-400">{stats?.devices_by_status.stale ?? 0} Stale</span>
            <span className="text-rose-400">{stats?.devices_by_status.offline ?? 0} Offline</span>
          </div>
        </div>

        {/* Incidents by Severity */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm hover:border-slate-700 transition">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-2">
            <span>ACTIVE INCIDENTS</span>
            <span className="text-rose-400 font-bold">
              {stats?.open_incidents_by_severity.critical ?? 0} CRITICAL
            </span>
          </div>
          <div className="text-2xl font-bold font-mono text-white">
            {stats?.open_incidents_by_severity.total_open ?? openIncidents.length}
            <span className="text-xs font-normal text-slate-400 ml-1">unresolved</span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs font-mono text-slate-400">
            <span className="text-amber-400">
              {stats?.open_incidents_by_severity.warning ?? 0} Warning
            </span>
            <span className="text-sky-400">{stats?.open_incidents_by_severity.info ?? 0} Info</span>
          </div>
        </div>

        {/* Ops & Queue Lag */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm hover:border-slate-700 transition">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-2">
            <span>QUEUE LAG &amp; OUTBOX</span>
            <span className="text-sky-400 font-bold">
              {stats?.queue_depth_and_lag.lag_seconds ?? 0}s LAG
            </span>
          </div>
          <div className="text-2xl font-bold font-mono text-white">
            {stats?.queue_depth_and_lag.pending ?? 0}
            <span className="text-xs font-normal text-slate-400 ml-1">pending jobs</span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs font-mono text-slate-400">
            <span>Outbox Sent</span>
            <span className="font-semibold text-emerald-400">{stats?.outbox_state.sent ?? 0}</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Active Incidents & Real-Time Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Open Incidents */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm flex flex-col">
          <div className="px-5 py-3.5 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
            <div className="flex items-center space-x-2">
              <span className="text-base font-bold text-white">Open Incidents</span>
              <span className="px-2 py-0.5 rounded-full text-xs font-mono font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                {openIncidents.length}
              </span>
            </div>
            <button
              onClick={() => onNavigateTab('incidents')}
              className="text-xs text-teal-400 hover:text-teal-300 font-mono transition"
            >
              View All &rarr;
            </button>
          </div>

          <div className="p-4 divide-y divide-slate-800/60 overflow-y-auto max-h-[380px]">
            {openIncidents.length === 0 ? (
              <div className="py-12 text-center text-slate-500 text-sm font-mono">
                No active incidents. All systems operational.
              </div>
            ) : (
              openIncidents.slice(0, 5).map((inc: Incident) => (
                <div
                  key={inc.id}
                  onClick={() => onSelectIncident(inc.id)}
                  className="py-3 px-2 rounded-lg hover:bg-slate-800/50 cursor-pointer transition flex items-center justify-between"
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold font-mono uppercase ${
                          inc.severity === 'critical'
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                            : inc.severity === 'warning'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                              : 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                        }`}
                      >
                        {inc.severity}
                      </span>
                      <span className="font-semibold text-white text-sm">
                        {inc.rule_name || 'Rule Alert'}
                      </span>
                      {inc.occurrence_count > 1 && (
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                          x{inc.occurrence_count}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-400 font-mono">
                      Device:{' '}
                      <span className="text-slate-200">{inc.device_name || inc.device_id}</span>
                    </div>
                  </div>

                  <div className="text-right text-xs font-mono">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                        inc.status === 'open'
                          ? 'bg-rose-950 text-rose-300 border border-rose-800'
                          : 'bg-amber-950 text-amber-300 border border-amber-800'
                      }`}
                    >
                      {inc.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Real-time Stream Activity */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm flex flex-col">
          <div className="px-5 py-3.5 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
            <div className="flex items-center space-x-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-500"></span>
              </span>
              <span className="text-base font-bold text-white">Live Activity Stream</span>
            </div>
            <button
              onClick={() => onNavigateTab('events')}
              className="text-xs text-teal-400 hover:text-teal-300 font-mono transition"
            >
              Stream View &rarr;
            </button>
          </div>

          <div className="p-4 divide-y divide-slate-800/60 overflow-y-auto max-h-[380px] font-mono text-xs">
            {liveEvents.length === 0 ? (
              <div className="py-12 text-center text-slate-500">Waiting for incoming events...</div>
            ) : (
              liveEvents.slice(0, 8).map((ev) => (
                <div key={ev.id || ev.event_id} className="py-2 flex items-center justify-between">
                  <div className="flex items-center space-x-2 overflow-hidden">
                    <span className="text-slate-500">#{ev.seq}</span>
                    <span className="px-1.5 py-0.5 rounded bg-slate-800 text-teal-300 text-[10px] font-bold uppercase">
                      {ev.type}
                    </span>
                    <span className="text-slate-300 truncate">{ev.device_id}</span>
                    {ev.is_late && (
                      <span className="px-1 py-0.2 rounded bg-amber-900/60 text-amber-300 text-[9px] font-bold">
                        LATE
                      </span>
                    )}
                  </div>
                  <span className="text-slate-500 text-[11px] whitespace-nowrap ml-2">
                    {new Date(ev.received_at || ev.ts).toLocaleTimeString()}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
