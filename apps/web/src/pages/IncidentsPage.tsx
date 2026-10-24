import React, { useState, useMemo } from 'react';
import { usePlatformStore } from '../store/PlatformContext.js';
import { Incident, IncidentStatus, IncidentSeverity } from '../types.js';
import { ActionButton } from '../components/ActionButton.js';
import { IncidentDetailDrawer } from '../components/IncidentDetailDrawer.js';
import { formatRelativeTime } from '../utils/incidentGrouping.js';
import { useToast } from '../components/Toast.js';
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
  const { showToast } = useToast();

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

  const handleQuickAck = async (e: React.MouseEvent, id: string, name: string) => {
    e.stopPropagation();
    const success = await acknowledgeIncident(id, 'operator:ui', 'Operator acknowledged');
    if (success) {
      showToast('Acknowledged', name);
    }
  };

  const handleQuickResolve = async (e: React.MouseEvent, id: string, name: string) => {
    e.stopPropagation();
    const success = await resolveIncident(id, 'operator:ui', 'Operator resolved');
    if (success) {
      showToast('Resolved', name);
    }
  };

  const getSeverityBadge = (sev: IncidentSeverity) => {
    const isCritical = sev === 'critical';
    const isWarning = sev === 'warning';
    return (
      <span
        className={`px-2 py-0.5 rounded-[var(--radius-control,6px)] text-[11px] font-medium uppercase tracking-wide ${
          isCritical
            ? 'bg-[var(--critical-bg)] text-[var(--critical)]'
            : isWarning
              ? 'bg-[var(--warning-bg)] text-[var(--warning)]'
              : 'bg-[var(--canvas)] text-[var(--muted)]'
        }`}
      >
        {sev}
      </span>
    );
  };

  const getStatusBadge = (status: IncidentStatus) => {
    return (
      <span
        className={`px-2 py-0.5 rounded-[var(--radius-control,6px)] text-[11px] font-medium capitalize ${
          status === 'open'
            ? 'bg-[var(--canvas)] text-[var(--ink)] border border-[var(--hairline)]'
            : status === 'acknowledged'
              ? 'bg-[var(--warning-bg)] text-[var(--warning)]'
              : 'bg-[var(--healthy-bg)] text-[var(--healthy)]'
        }`}
      >
        {status.replace('_', ' ')}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header and Filter Toolbar */}
      <div>
        <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-[var(--ink)]">
          Incidents
        </h1>
        <p className="text-xs text-[var(--muted)] mt-0.5">
          Active alerts and anomaly conditions detected across the fleet
        </p>
      </div>

      <div className="bg-[var(--surface)] border border-[var(--hairline)] rounded-[var(--radius-panel,12px)] p-4 flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm">
        <div className="w-full md:w-80 relative">
          <Search className="w-4 h-4 text-[var(--muted)] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search incidents, rules, summaries..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-[var(--radius-control,6px)] bg-[var(--canvas)] border border-[var(--hairline)] text-xs text-[var(--ink)] placeholder-[var(--muted)] focus:outline-none focus:border-[var(--brand)]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto text-xs">
          <div className="flex items-center space-x-1.5 text-[var(--muted)]">
            <Filter className="w-3.5 h-3.5" />
            <span>Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-[var(--canvas)] border border-[var(--hairline)] rounded-[var(--radius-control,6px)] px-2.5 py-1.5 text-[var(--ink)] text-xs focus:outline-none focus:border-[var(--brand)]"
            >
              <option value="all">All ({incidentsList.length})</option>
              <option value="open">Open</option>
              <option value="acknowledged">Acknowledged</option>
              <option value="resolved">Resolved</option>
            </select>
          </div>

          <div className="flex items-center space-x-1.5 text-[var(--muted)]">
            <span>Severity:</span>
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="bg-[var(--canvas)] border border-[var(--hairline)] rounded-[var(--radius-control,6px)] px-2.5 py-1.5 text-[var(--ink)] text-xs focus:outline-none focus:border-[var(--brand)]"
            >
              <option value="all">All severities</option>
              <option value="critical">Critical</option>
              <option value="warning">Warning</option>
              <option value="info">Info</option>
            </select>
          </div>

          <div className="flex items-center space-x-1.5 text-[var(--muted)]">
            <span>Device:</span>
            <select
              value={deviceFilter}
              onChange={(e) => setDeviceFilter(e.target.value)}
              className="bg-[var(--canvas)] border border-[var(--hairline)] rounded-[var(--radius-control,6px)] px-2.5 py-1.5 text-[var(--ink)] text-xs focus:outline-none focus:border-[var(--brand)] max-w-[140px]"
            >
              <option value="all">All devices</option>
              {Object.keys(devices).map((id) => (
                <option key={id} value={id}>
                  {devices[id].name || id}
                </option>
              ))}
            </select>
          </div>

          <div className="text-[var(--muted)] text-xs ml-auto">
            Showing <span className="font-semibold text-[var(--ink)]">{filteredIncidents.length}</span> incidents
          </div>
        </div>
      </div>

      {/* Incidents Table */}
      <div className="bg-[var(--surface)] border border-[var(--hairline)] rounded-[var(--radius-panel,12px)] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[var(--canvas)] border-b border-[var(--hairline)] text-[var(--muted)] text-[11px] font-medium">
              <tr>
                <th className="px-5 py-3 font-semibold">Severity</th>
                <th className="px-5 py-3 font-semibold">Status</th>
                <th className="px-5 py-3 font-semibold">Alert rule</th>
                <th className="px-5 py-3 font-semibold">Device</th>
                <th className="px-5 py-3 font-semibold">Occurrences</th>
                <th className="px-5 py-3 font-semibold">Age</th>
                <th className="px-5 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--hairline)]">
              {filteredIncidents.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-[var(--muted)]">
                    No incidents match the specified filter criteria.
                  </td>
                </tr>
              ) : (
                filteredIncidents.map((incident) => {
                  const relativeAge = formatRelativeTime(incident.last_event_at || incident.created_at);

                  return (
                    <tr
                      key={incident.id}
                      onClick={() => onSelectIncident(incident.id)}
                      className="hover:bg-[var(--canvas)] transition cursor-pointer group"
                    >
                      <td className="px-5 py-3.5">{getSeverityBadge(incident.severity)}</td>

                      <td className="px-5 py-3.5">{getStatusBadge(incident.status)}</td>

                      <td className="px-5 py-3.5 max-w-sm">
                        <div className="font-semibold text-[var(--ink)] group-hover:text-[var(--brand)] transition">
                          {incident.rule_name || 'System alert'}
                        </div>
                        {incident.summary && (
                          <div className="text-xs text-[var(--muted)] truncate mt-0.5">
                            {incident.summary}
                          </div>
                        )}
                      </td>

                      <td className="px-5 py-3.5">
                        <div className="font-medium text-[var(--ink)]">
                          {incident.device_name || incident.device_id}
                        </div>
                        <div className="text-[11px] text-[var(--muted)] font-mono">{incident.device_id}</div>
                      </td>

                      <td className="px-5 py-3.5">
                        <span className="inline-flex items-center space-x-1 text-xs text-[var(--muted)]">
                          <Flame className="w-3.5 h-3.5 text-[var(--warning)]" />
                          <span>{incident.occurrence_count}</span>
                        </span>
                      </td>

                      <td className="px-5 py-3.5 text-[var(--muted)] whitespace-nowrap">
                        <span title={incident.last_event_at ? new Date(incident.last_event_at).toLocaleString() : ''}>
                          {relativeAge}
                        </span>
                      </td>

                      <td
                        className="px-5 py-3.5 text-right space-x-2 whitespace-nowrap"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {incident.status === 'open' && (
                          <ActionButton
                            variant="warning"
                            isOffline={isOffline}
                            onClick={(e) => handleQuickAck(e, incident.id, incident.rule_name)}
                          >
                            Acknowledge
                          </ActionButton>
                        )}

                        {incident.status !== 'resolved' && incident.status !== 'auto_resolved' && (
                          <ActionButton
                            variant="secondary"
                            isOffline={isOffline}
                            onClick={(e) => handleQuickResolve(e, incident.id, incident.rule_name)}
                          >
                            Resolve
                          </ActionButton>
                        )}

                        <button
                          onClick={() => onSelectIncident(incident.id)}
                          className="p-1 rounded-[var(--radius-control,6px)] text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--canvas)] transition"
                          aria-label="View incident details"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Incident Detail Right-Side Sheet */}
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
