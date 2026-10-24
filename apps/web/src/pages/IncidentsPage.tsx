import React, { useState, useMemo } from 'react';
import { usePlatformStore } from '../store/PlatformContext.js';
import { Incident, IncidentStatus, IncidentSeverity } from '../types.js';
import { ActionButton } from '../components/ActionButton.js';
import { IncidentDetailDrawer } from '../components/IncidentDetailDrawer.js';
import {
  Search,
  Filter,
  ShieldAlert,
  Flame,
  CheckCircle2,
  Clock,
  ChevronRight,
} from 'lucide-react';

interface IncidentsPageProps {
  onExplainEvent: (eventId: string) => void;
  selectedIncidentId: string | null;
  onSelectIncident: (id: string | null) => void;
}

export const IncidentsPage: React.FC<IncidentsPageProps> = ({
  onExplainEvent,
  selectedIncidentId,
  onSelectIncident,
}) => {
  const { state, acknowledgeIncident, resolveIncident } = usePlatformStore();
  const { incidents, devices, connection } = state;
  const isOffline = connection.status === 'offline';

  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [deviceFilter, setDeviceFilter] = useState<string>('all');
  const [search, setSearch] = useState<string>('');

  const incidentsList = useMemo(() => Object.values(incidents), [incidents]);

  const filteredIncidents = useMemo(() => {
    return incidentsList.filter((inc) => {
      const matchStatus = statusFilter === 'all' || inc.status === statusFilter;
      const matchSeverity = severityFilter === 'all' || inc.severity === severityFilter;
      const matchDevice = deviceFilter === 'all' || inc.device_id === deviceFilter;

      const matchSearch =
        !search ||
        (inc.rule_name || '').toLowerCase().includes(search.toLowerCase()) ||
        (inc.device_name || inc.device_id).toLowerCase().includes(search.toLowerCase()) ||
        (inc.summary || '').toLowerCase().includes(search.toLowerCase());

      return matchStatus && matchSeverity && matchDevice && matchSearch;
    });
  }, [incidentsList, statusFilter, severityFilter, deviceFilter, search]);

  const handleQuickAck = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    await acknowledgeIncident(id, 'operator:ui', 'Operator acknowledged via quick-action button');
  };

  const handleQuickResolve = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    await resolveIncident(id, 'operator:ui', 'Operator resolved via quick-action button');
  };

  const getSeverityBadge = (sev: IncidentSeverity) => {
    const colors =
      {
        critical: 'bg-red-950/60 text-red-300 border-red-800/60',
        warning: 'bg-amber-950/60 text-amber-300 border-amber-800/60',
        info: 'bg-zinc-800 text-zinc-300 border-zinc-700',
      }[sev] || 'bg-zinc-800 text-zinc-300 border-zinc-700';

    return (
      <span
        className={`px-2 py-0.5 rounded text-[10px] font-semibold font-mono uppercase border ${colors}`}
      >
        {sev}
      </span>
    );
  };

  const getStatusBadge = (status: IncidentStatus) => {
    const colors =
      {
        open: 'bg-zinc-900 text-red-300 border-red-900/50',
        acknowledged: 'bg-zinc-900 text-amber-300 border-amber-900/50',
        resolved: 'bg-zinc-900 text-emerald-300 border-emerald-900/50',
        auto_resolved: 'bg-zinc-900 text-zinc-300 border-zinc-700',
      }[status] || 'bg-zinc-800 text-zinc-300 border-zinc-700';

    return (
      <span
        className={`px-2 py-0.5 rounded text-[10px] font-medium font-mono uppercase border ${colors}`}
      >
        {status}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Filters and Controls Toolbar */}
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="w-full md:w-80 relative">
          <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search incidents, rules, summaries..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-md bg-zinc-950 border border-zinc-800 text-zinc-100 placeholder-zinc-500 text-xs font-mono focus:outline-none focus:border-zinc-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto text-xs font-mono">
          <div className="flex items-center space-x-1.5 text-zinc-400">
            <Filter className="w-3.5 h-3.5" />
            <span className="text-zinc-500">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-zinc-950 border border-zinc-800 rounded-md px-2.5 py-1.5 text-zinc-200 text-xs focus:outline-none focus:border-zinc-500"
            >
              <option value="all">All ({incidentsList.length})</option>
              <option value="open">Open</option>
              <option value="acknowledged">Acknowledged</option>
              <option value="resolved">Resolved</option>
              <option value="auto_resolved">Auto-Resolved</option>
            </select>
          </div>

          <div className="flex items-center space-x-1.5 text-zinc-400">
            <span className="text-zinc-500">Severity:</span>
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="bg-zinc-950 border border-zinc-800 rounded-md px-2.5 py-1.5 text-zinc-200 text-xs focus:outline-none focus:border-zinc-500"
            >
              <option value="all">All Severities</option>
              <option value="critical">Critical</option>
              <option value="warning">Warning</option>
              <option value="info">Info</option>
            </select>
          </div>

          <div className="flex items-center space-x-1.5 text-zinc-400">
            <span className="text-zinc-500">Device:</span>
            <select
              value={deviceFilter}
              onChange={(e) => setDeviceFilter(e.target.value)}
              className="bg-zinc-950 border border-zinc-800 rounded-md px-2.5 py-1.5 text-zinc-200 text-xs focus:outline-none focus:border-zinc-500 max-w-[140px]"
            >
              <option value="all">All Devices</option>
              {Object.keys(devices).map((id) => (
                <option key={id} value={id}>
                  {devices[id].name || id}
                </option>
              ))}
            </select>
          </div>

          <div className="text-zinc-500 text-xs ml-auto">
            Showing <span className="text-zinc-200 font-semibold">{filteredIncidents.length}</span> incidents
          </div>
        </div>
      </div>

      {/* Incidents Table */}
      <div className="bg-zinc-900/30 border border-zinc-800 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-zinc-900/70 border-b border-zinc-800 text-zinc-400 text-[11px] uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3 font-semibold">Severity</th>
                <th className="px-5 py-3 font-semibold">Status</th>
                <th className="px-5 py-3 font-semibold">Incident / Rule</th>
                <th className="px-5 py-3 font-semibold">Device</th>
                <th className="px-5 py-3 font-semibold">Events</th>
                <th className="px-5 py-3 font-semibold">Last Reported</th>
                <th className="px-5 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-850">
              {filteredIncidents.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-zinc-500">
                    No incidents match the specified filter conditions.
                  </td>
                </tr>
              ) : (
                filteredIncidents.map((incident) => (
                  <tr
                    key={incident.id}
                    onClick={() => onSelectIncident(incident.id)}
                    className="hover:bg-zinc-900/60 transition cursor-pointer group"
                  >
                    <td className="px-5 py-3.5">{getSeverityBadge(incident.severity)}</td>

                    <td className="px-5 py-3.5">{getStatusBadge(incident.status)}</td>

                    <td className="px-5 py-3.5 max-w-sm">
                      <div className="font-semibold text-zinc-100 group-hover:text-white transition">
                        {incident.rule_name || 'System Alert'}
                      </div>
                      <div className="text-[11px] text-zinc-400 truncate mt-0.5">
                        {incident.summary || <span className="text-zinc-600">No summary</span>}
                      </div>
                      <div className="text-[10px] text-zinc-600 mt-0.5 truncate">
                        Key: {incident.dedup_key}
                      </div>
                    </td>

                    <td className="px-5 py-3.5">
                      <div className="text-zinc-200 font-medium">{incident.device_name || incident.device_id}</div>
                      <div className="text-[11px] text-zinc-500">{incident.device_id}</div>
                    </td>

                    <td className="px-5 py-3.5">
                      <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-zinc-900 text-zinc-300 border border-zinc-700/60">
                        <Flame className="w-3 h-3 text-amber-400" />
                        <span>{incident.occurrence_count}</span>
                      </span>
                    </td>

                    <td className="px-5 py-3.5 text-zinc-400 whitespace-nowrap">
                      {incident.last_event_at ? (
                        <span>
                          {new Date(incident.last_event_at).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit',
                          })}
                        </span>
                      ) : (
                        <span className="text-zinc-600">N/A</span>
                      )}
                    </td>

                    <td className="px-5 py-3.5 text-right space-x-2 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                      {incident.status === 'open' && (
                        <ActionButton
                          variant="warning"
                          isOffline={isOffline}
                          onClick={(e) => handleQuickAck(e, incident.id)}
                        >
                          Ack
                        </ActionButton>
                      )}

                      {incident.status !== 'resolved' && incident.status !== 'auto_resolved' && (
                        <ActionButton
                          variant="secondary"
                          isOffline={isOffline}
                          onClick={(e) => handleQuickResolve(e, incident.id)}
                        >
                          Resolve
                        </ActionButton>
                      )}

                      <button
                        onClick={() => onSelectIncident(incident.id)}
                        className="p-1 rounded text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 transition"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Incident Detail Drawer */}
      {selectedIncidentId && (
        <IncidentDetailDrawer
          incidentId={selectedIncidentId}
          isOffline={isOffline}
          onClose={() => onSelectIncident(null)}
          onAcknowledge={(id) =>
            acknowledgeIncident(id, 'operator:ui', 'Acknowledged from drawer')
          }
          onResolve={(id) =>
            resolveIncident(id, 'operator:ui', 'Resolved from drawer')
          }
          onExplainEvent={onExplainEvent}
        />
      )}
    </div>
  );
};
