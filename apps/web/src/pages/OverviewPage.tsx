import React from 'react';
import { usePlatformStore } from '../store/PlatformContext.js';
import { Incident } from '../types.js';
import {
  Activity,
  Cpu,
  ShieldAlert,
  Clock,
  ArrowRight,
  Radio,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  Server,
  Send,
} from 'lucide-react';
import { ActionButton } from '../components/ActionButton.js';

interface OverviewPageProps {
  onNavigateTab: (tab: string) => void;
  onSelectIncident: (id: string) => void;
}

export const OverviewPage: React.FC<OverviewPageProps> = ({ onNavigateTab, onSelectIncident }) => {
  const { state, acknowledgeIncident, resolveIncident } = usePlatformStore();
  const { stats, incidents, devices, connection } = state;
  const isOffline = connection.status === 'offline';

  const incidentsList = Object.values(incidents);
  const devicesList = Object.values(devices);
  const openIncidents = incidentsList.filter(
    (i) => i.status === 'open' || i.status === 'acknowledged'
  );

  const handleQuickAck = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    await acknowledgeIncident(id, 'operator:ui', 'Acknowledged from overview');
  };

  const handleQuickResolve = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    await resolveIncident(id, 'operator:ui', 'Resolved from overview');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-zinc-900/50 border border-zinc-800 rounded-lg p-5">
        <div>
          <div className="flex items-center space-x-2.5">
            <h2 className="text-lg font-semibold text-zinc-100 tracking-tight">Platform Overview</h2>
            {connection.isStale && (
              <span className="text-[10px] font-mono font-medium bg-amber-950/80 text-amber-300 border border-amber-800/60 px-2 py-0.5 rounded">
                DATA STALE
              </span>
            )}
          </div>
          <p className="text-xs text-zinc-400 mt-1 font-mono">
            Durable operations engine on PostgreSQL 16 · Real-time SSE fan-out
          </p>
        </div>

        <div className="flex items-center space-x-3 text-xs">
          <div className="bg-zinc-950 px-3 py-1.5 rounded-md border border-zinc-800 flex items-center space-x-2 font-mono text-zinc-300">
            <Activity className="w-3.5 h-3.5 text-zinc-400" />
            <span className="text-zinc-500">Rate:</span>
            <span className="font-semibold text-zinc-100">{stats?.events_per_minute ?? 0} ev/m</span>
          </div>
          <button
            onClick={() => onNavigateTab('events')}
            className="px-3 py-1.5 rounded-md bg-zinc-100 hover:bg-zinc-200 text-zinc-900 font-medium transition inline-flex items-center space-x-1 shadow-sm"
          >
            <span>Live Stream</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Core Stats Cards Grid (ShadCN style) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Ingestion & Rate */}
        <div className="bg-zinc-900/40 border border-zinc-800 rounded-lg p-5 hover:border-zinc-700 transition">
          <div className="flex items-center justify-between text-xs font-mono text-zinc-400 mb-2">
            <span className="font-medium">INGESTION RATE</span>
            <Activity className="w-4 h-4 text-zinc-500" />
          </div>
          <div className="text-2xl font-bold font-mono text-zinc-100">
            {stats?.events_per_minute ?? 0}
            <span className="text-xs font-normal text-zinc-500 ml-1.5">ev / min</span>
          </div>
          <div className="mt-3 pt-3 border-t border-zinc-800/80 flex items-center justify-between text-xs font-mono text-zinc-400">
            <span>Buffer Depth</span>
            <span className="font-medium text-zinc-200">
              {stats?.queue_depth_and_lag?.depth ?? 0}
            </span>
          </div>
        </div>

        {/* Fleet Health */}
        <div className="bg-zinc-900/40 border border-zinc-800 rounded-lg p-5 hover:border-zinc-700 transition">
          <div className="flex items-center justify-between text-xs font-mono text-zinc-400 mb-2">
            <span className="font-medium">DEVICE FLEET</span>
            <Cpu className="w-4 h-4 text-zinc-500" />
          </div>
          <div className="text-2xl font-bold font-mono text-zinc-100">
            {stats?.devices_by_status?.total ?? devicesList.length}
            <span className="text-xs font-normal text-zinc-500 ml-1.5">total</span>
          </div>
          <div className="mt-3 pt-3 border-t border-zinc-800/80 flex items-center justify-between text-xs font-mono">
            <span className="text-emerald-400">
              {stats?.devices_by_status?.online ?? devicesList.filter((d) => d.status === 'online').length} online
            </span>
            <span className="text-zinc-500">|</span>
            <span className="text-amber-400">{stats?.devices_by_status?.stale ?? 0} stale</span>
            <span className="text-zinc-500">|</span>
            <span className="text-red-400">{stats?.devices_by_status?.offline ?? 0} offline</span>
          </div>
        </div>

        {/* Incidents by Severity */}
        <div className="bg-zinc-900/40 border border-zinc-800 rounded-lg p-5 hover:border-zinc-700 transition">
          <div className="flex items-center justify-between text-xs font-mono text-zinc-400 mb-2">
            <span className="font-medium">ACTIVE INCIDENTS</span>
            <ShieldAlert className="w-4 h-4 text-zinc-500" />
          </div>
          <div className="text-2xl font-bold font-mono text-zinc-100">
            {openIncidents.length}
            <span className="text-xs font-normal text-zinc-500 ml-1.5">open / ack</span>
          </div>
          <div className="mt-3 pt-3 border-t border-zinc-800/80 flex items-center justify-between text-xs font-mono">
            <span className="text-red-400 font-medium">
              {stats?.open_incidents_by_severity?.critical ?? 0} Critical
            </span>
            <span className="text-amber-400">
              {stats?.open_incidents_by_severity?.warning ?? 0} Warning
            </span>
            <span className="text-zinc-400">
              {stats?.open_incidents_by_severity?.info ?? 0} Info
            </span>
          </div>
        </div>

        {/* Processing Queue & Lag */}
        <div className="bg-zinc-900/40 border border-zinc-800 rounded-lg p-5 hover:border-zinc-700 transition">
          <div className="flex items-center justify-between text-xs font-mono text-zinc-400 mb-2">
            <span className="font-medium">QUEUE LAG</span>
            <Clock className="w-4 h-4 text-zinc-500" />
          </div>
          <div className="text-2xl font-bold font-mono text-zinc-100">
            {stats?.queue_depth_and_lag?.lag_seconds ?? 0}
            <span className="text-xs font-normal text-zinc-500 ml-1.5">seconds</span>
          </div>
          <div className="mt-3 pt-3 border-t border-zinc-800/80 flex items-center justify-between text-xs font-mono text-zinc-400">
            <span>Processing / Done</span>
            <span className="font-medium text-zinc-200">
              {stats?.queue_depth_and_lag?.processing ?? 0} / {stats?.queue_depth_and_lag?.done ?? 0}
            </span>
          </div>
        </div>
      </div>

      {/* Main Split Layout: Active Incidents Feed & System Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Active Incidents List */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <h3 className="text-sm font-semibold text-zinc-200">Active Incidents Requiring Attention</h3>
              <span className="text-xs font-mono bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded-full">
                {openIncidents.length}
              </span>
            </div>
            <button
              onClick={() => onNavigateTab('incidents')}
              className="text-xs font-medium text-zinc-400 hover:text-zinc-200 transition flex items-center space-x-1"
            >
              <span>View All</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {openIncidents.length === 0 ? (
            <div className="bg-zinc-900/30 border border-zinc-800 rounded-lg p-10 text-center">
              <CheckCircle2 className="w-8 h-8 text-zinc-500 mx-auto mb-2" />
              <div className="text-sm font-medium text-zinc-300">All Systems Nominal</div>
              <p className="text-xs text-zinc-500 mt-1">No open or acknowledged incidents at this time.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {openIncidents.slice(0, 6).map((inc) => (
                <div
                  key={inc.id}
                  onClick={() => onSelectIncident(inc.id)}
                  className="bg-zinc-900/40 hover:bg-zinc-900/70 border border-zinc-800 hover:border-zinc-700/80 rounded-lg p-4 cursor-pointer transition flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <span
                        className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded border uppercase ${
                          inc.severity === 'critical'
                            ? 'bg-red-950/60 text-red-300 border-red-800/60'
                            : inc.severity === 'warning'
                              ? 'bg-amber-950/60 text-amber-300 border-amber-800/60'
                              : 'bg-zinc-800 text-zinc-300 border-zinc-700'
                        }`}
                      >
                        {inc.severity}
                      </span>
                      <span
                        className={`text-[10px] font-mono font-medium px-2 py-0.5 rounded border uppercase ${
                          inc.status === 'open'
                            ? 'bg-zinc-900 text-red-300 border-zinc-700'
                            : 'bg-zinc-900 text-amber-300 border-zinc-700'
                        }`}
                      >
                        {inc.status}
                      </span>
                      <span className="text-xs font-semibold text-zinc-200 truncate">
                        {inc.rule_name || 'Rule Alert'}
                      </span>
                    </div>

                    <div className="text-xs text-zinc-400 flex items-center space-x-2 font-mono">
                      <span>Device: <span className="text-zinc-200">{inc.device_name || inc.device_id}</span></span>
                      <span>·</span>
                      <span>Events: <span className="text-zinc-200">{inc.occurrence_count}</span></span>
                      {inc.last_event_at && (
                        <>
                          <span>·</span>
                          <span className="text-zinc-500">
                            {new Date(inc.last_event_at).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                              second: '2-digit',
                            })}
                          </span>
                        </>
                      )}
                    </div>

                    {inc.summary && (
                      <p className="text-xs text-zinc-400 truncate max-w-xl">
                        {inc.summary}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center space-x-2 sm:self-center shrink-0">
                    {inc.status === 'open' && (
                      <ActionButton
                        variant="warning"
                        isOffline={isOffline}
                        onClick={(e) => handleQuickAck(e, inc.id)}
                      >
                        Ack
                      </ActionButton>
                    )}
                    <ActionButton
                      variant="secondary"
                      isOffline={isOffline}
                      onClick={(e) => handleQuickResolve(e, inc.id)}
                    >
                      Resolve
                    </ActionButton>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right 1 Col: Platform Telemetry & Outbox */}
        <div className="space-y-4">
          {/* Outbox Pipeline Status */}
          <div className="bg-zinc-900/40 border border-zinc-800 rounded-lg p-5 space-y-3">
            <div className="flex items-center justify-between text-xs font-mono text-zinc-400">
              <span className="font-medium flex items-center space-x-2">
                <Send className="w-3.5 h-3.5 text-zinc-400" />
                <span>OUTBOX NOTIFICATIONS</span>
              </span>
              <button
                onClick={() => onNavigateTab('ops')}
                className="text-zinc-400 hover:text-zinc-200 text-xs transition"
              >
                Ops &rarr;
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs font-mono pt-1">
              <div className="bg-zinc-950/80 p-2.5 rounded border border-zinc-800/80">
                <div className="text-zinc-500 text-[11px]">Delivered / Sent</div>
                <div className="text-base font-semibold text-zinc-200 mt-0.5">
                  {stats?.outbox_state?.sent ?? 0}
                </div>
              </div>
              <div className="bg-zinc-950/80 p-2.5 rounded border border-zinc-800/80">
                <div className="text-zinc-500 text-[11px]">Pending / In-Flight</div>
                <div className="text-base font-semibold text-zinc-200 mt-0.5">
                  {(stats?.outbox_state?.pending ?? 0) + (stats?.outbox_state?.in_flight ?? 0)}
                </div>
              </div>
              <div className="bg-zinc-950/80 p-2.5 rounded border border-zinc-800/80">
                <div className="text-zinc-500 text-[11px]">Failed Retries</div>
                <div className="text-base font-semibold text-amber-400 mt-0.5">
                  {stats?.outbox_state?.failed ?? 0}
                </div>
              </div>
              <div className="bg-zinc-950/80 p-2.5 rounded border border-zinc-800/80">
                <div className="text-zinc-500 text-[11px]">Dead State</div>
                <div
                  className={`text-base font-semibold mt-0.5 ${
                    (stats?.outbox_state?.dead ?? 0) > 0 ? 'text-red-400' : 'text-zinc-400'
                  }`}
                >
                  {stats?.outbox_state?.dead ?? 0}
                </div>
              </div>
            </div>
          </div>

          {/* Quick Ops Info */}
          <div className="bg-zinc-900/40 border border-zinc-800 rounded-lg p-5 space-y-3 font-mono text-xs">
            <div className="flex items-center space-x-2 text-zinc-300 font-semibold">
              <Server className="w-4 h-4 text-zinc-400" />
              <span>PostgreSQL Durable Engine</span>
            </div>
            <div className="text-zinc-400 space-y-2 text-[11px]">
              <div className="flex justify-between py-1 border-b border-zinc-800/60">
                <span className="text-zinc-500">Queue Model:</span>
                <span className="text-zinc-300">SKIP LOCKED + Lease</span>
              </div>
              <div className="flex justify-between py-1 border-b border-zinc-800/60">
                <span className="text-zinc-500">Incident Dedup:</span>
                <span className="text-zinc-300">rule_id:device_id index</span>
              </div>
              <div className="flex justify-between py-1 border-b border-zinc-800/60">
                <span className="text-zinc-500">Event Stream:</span>
                <span className="text-zinc-300">LISTEN change_log</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-zinc-500">Outbox Pattern:</span>
                <span className="text-zinc-300">Transactional Delivery</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
