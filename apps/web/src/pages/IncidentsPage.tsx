import React, { useState, useMemo } from 'react';
import { usePlatformStore } from '../store/PlatformContext.js';
import { Incident, IncidentStatus, IncidentSeverity } from '../types.js';
import { ActionButton } from '../components/ActionButton.js';
import { IncidentDetailDrawer } from '../components/IncidentDetailDrawer.js';

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
        critical: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
        warning: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
        info: 'bg-sky-500/20 text-sky-300 border-sky-500/40',
      }[sev] || 'bg-slate-800 text-slate-300 border-slate-700';

    return (
      <span
        className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono uppercase border ${colors}`}
      >
        {sev}
      </span>
    );
  };

  const getStatusBadge = (status: IncidentStatus) => {
    const colors =
      {
        open: 'bg-rose-950 text-rose-300 border-rose-800',
        acknowledged: 'bg-amber-950 text-amber-300 border-amber-800',
        resolved: 'bg-emerald-950 text-emerald-300 border-emerald-800',
        auto_resolved: 'bg-teal-950 text-teal-300 border-teal-800',
      }[status] || 'bg-slate-800 text-slate-300 border-slate-700';

    return (
      <span
        className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono uppercase border ${colors}`}
      >
        {status}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Filters and Controls */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm">
        <div className="w-full md:w-72">
          <input
            type="text"
            placeholder="Search incidents or rules..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-500 text-xs font-mono focus:outline-none focus:border-teal-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto font-mono text-xs">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-teal-500"
          >
            <option value="all">All Statuses</option>
            <option value="open">Open</option>
            <option value="acknowledged">Acknowledged</option>
            <option value="resolved">Resolved</option>
            <option value="auto_resolved">Auto Resolved</option>
          </select>

          {/* Severity Filter */}
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-teal-500"
          >
            <option value="all">All Severities</option>
            <option value="critical">Critical</option>
            <option value="warning">Warning</option>
            <option value="info">Info</option>
          </select>

          {/* Device Filter */}
          <select
            value={deviceFilter}
            onChange={(e) => setDeviceFilter(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-teal-500"
          >
            <option value="all">All Devices</option>
            {Object.values(devices).map((d) => (
              <option key={d.id} value={d.id}>
                {d.name} ({d.id})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Incidents Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-950/60 text-slate-400 border-b border-slate-800 text-[11px] uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3 font-semibold">Incident / Rule</th>
                <th className="px-5 py-3 font-semibold">Severity</th>
                <th className="px-5 py-3 font-semibold">Status</th>
                <th className="px-5 py-3 font-semibold">Device</th>
                <th className="px-5 py-3 font-semibold">Occurrences</th>
                <th className="px-5 py-3 font-semibold">Notification</th>
                <th className="px-5 py-3 font-semibold text-right">Quick Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredIncidents.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-16 text-center text-slate-500">
                    No incidents match the selected filter criteria.
                  </td>
                </tr>
              ) : (
                filteredIncidents.map((inc: Incident) => (
                  <tr
                    key={inc.id}
                    onClick={() => onSelectIncident(inc.id)}
                    className="hover:bg-slate-800/40 cursor-pointer transition"
                  >
                    <td className="px-5 py-3.5">
                      <div className="font-bold text-white text-sm">
                        {inc.rule_name || 'Rule Alert'}
                      </div>
                      <div className="text-[11px] text-slate-400 truncate max-w-sm">
                        {inc.summary || inc.dedup_key}
                      </div>
                    </td>
                    <td className="px-5 py-3.5">{getSeverityBadge(inc.severity)}</td>
                    <td className="px-5 py-3.5">{getStatusBadge(inc.status)}</td>
                    <td className="px-5 py-3.5">
                      <div className="font-semibold text-slate-200">
                        {inc.device_name || inc.device_id}
                      </div>
                      <div className="text-[10px] text-slate-500">{inc.device_id}</div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-200 border border-slate-700 font-bold">
                        x{inc.occurrence_count}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                          inc.notification_status === 'sent'
                            ? 'text-emerald-400 bg-emerald-950/60'
                            : inc.notification_status === 'dead'
                              ? 'text-rose-400 bg-rose-950/60'
                              : 'text-amber-400 bg-amber-950/60'
                        }`}
                      >
                        {inc.notification_status || 'pending'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right space-x-2">
                      {inc.status === 'open' && (
                        <ActionButton
                          isOffline={isOffline}
                          variant="warning"
                          onClick={(e) => handleQuickAck(e, inc.id)}
                        >
                          Ack
                        </ActionButton>
                      )}

                      {(inc.status === 'open' || inc.status === 'acknowledged') && (
                        <ActionButton
                          isOffline={isOffline}
                          variant="success"
                          onClick={(e) => handleQuickResolve(e, inc.id)}
                        >
                          Resolve
                        </ActionButton>
                      )}

                      {(inc.status === 'resolved' || inc.status === 'auto_resolved') && (
                        <span className="text-slate-500 text-[11px]">Closed</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Drawer */}
      {selectedIncidentId && (
        <IncidentDetailDrawer
          incidentId={selectedIncidentId}
          isOffline={isOffline}
          onClose={() => onSelectIncident(null)}
          onAcknowledge={acknowledgeIncident}
          onResolve={resolveIncident}
          onExplainEvent={onExplainEvent}
        />
      )}
    </div>
  );
};
