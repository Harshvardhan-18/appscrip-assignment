import React, { useState, useEffect } from 'react';
import { Incident, IncidentHistoryItem } from '../types.js';
import { authFetch } from '../api.js';
import { ActionButton } from '../components/ActionButton.js';
import {
  X,
  ShieldAlert,
  Flame,
  Clock,
  Send,
  HelpCircle,
  Cpu,
  History,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';

interface IncidentDetailDrawerProps {
  incidentId: string | null;
  isOffline: boolean;
  onClose: () => void;
  onAcknowledge: (id: string) => Promise<boolean>;
  onResolve: (id: string) => Promise<boolean>;
  onExplainEvent: (eventId: string) => void;
}

export const IncidentDetailDrawer: React.FC<IncidentDetailDrawerProps> = ({
  incidentId,
  isOffline,
  onClose,
  onAcknowledge,
  onResolve,
  onExplainEvent,
}) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'events' | 'history' | 'notifications' | 'rules'>('overview');
  const [data, setData] = useState<{
    incident: Incident;
    events: Array<{
      event_id: string;
      seq: number;
      ts: string;
      type: string;
      payload: any;
      attached_at: string;
    }>;
    history: IncidentHistoryItem[];
    notifications: any[];
    rule_evaluations: any[];
  } | null>(null);

  const [retryingNotif, setRetryingNotif] = useState<boolean>(false);

  const fetchDetail = () => {
    if (!incidentId) return;
    setLoading(true);
    authFetch(`/api/incidents/${incidentId}`)
      .then((res) => {
        if (!res.ok) throw new Error('Incident not found');
        return res.json();
      })
      .then((res) => {
        setData(res);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchDetail();
  }, [incidentId]);

  if (!incidentId) return null;

  const incident = data?.incident;

  const handleRetryDeadNotif = async () => {
    setRetryingNotif(true);
    try {
      await authFetch(`/api/incidents/${incidentId}/retry-notifications`, { method: 'POST' });
      fetchDetail();
    } finally {
      setRetryingNotif(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex justify-end">
      <div className="bg-zinc-950 border-l border-zinc-800 w-full max-w-2xl h-full flex flex-col shadow-2xl font-mono animate-in slide-in-from-right duration-200">
        {/* Drawer Header */}
        <div className="px-6 py-4 border-b border-zinc-800 bg-zinc-900/60 flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                  incident?.severity === 'critical'
                    ? 'bg-red-950/80 text-red-300 border border-red-800/60'
                    : incident?.severity === 'warning'
                      ? 'bg-amber-950/80 text-amber-300 border border-amber-800/60'
                      : 'bg-zinc-800 text-zinc-300 border border-zinc-700'
                }`}
              >
                {incident?.severity || 'warning'}
              </span>
              <span className="text-sm font-semibold text-zinc-100 truncate max-w-md">
                {incident?.rule_name || 'Incident Detail'}
              </span>
            </div>
            <div className="text-xs text-zinc-500">
              ID: <span className="text-zinc-300 select-all font-mono">{incidentId}</span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-md hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Drawer Action Bar */}
        <div className="px-6 py-3 border-b border-zinc-800/80 bg-zinc-950 flex items-center justify-between">
          <div className="flex items-center space-x-2 text-xs">
            <span className="text-zinc-500">Status:</span>
            <span
              className={`px-2 py-0.5 rounded font-semibold uppercase text-[10px] ${
                incident?.status === 'open'
                  ? 'bg-zinc-900 text-red-300 border border-red-900/50'
                  : incident?.status === 'acknowledged'
                    ? 'bg-zinc-900 text-amber-300 border border-amber-900/50'
                    : 'bg-zinc-900 text-emerald-300 border border-emerald-900/50'
              }`}
            >
              {incident?.status || 'open'}
            </span>
            {incident && incident.occurrence_count > 1 && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-900 text-zinc-300 border border-zinc-800 flex items-center space-x-1">
                <Flame className="w-3 h-3 text-amber-400" />
                <span>{incident.occurrence_count} occurrences</span>
              </span>
            )}
          </div>

          <div className="flex items-center space-x-2">
            {incident?.status === 'open' && (
              <ActionButton
                isOffline={isOffline}
                variant="warning"
                onClick={async () => {
                  const success = await onAcknowledge(incidentId);
                  if (success) fetchDetail();
                }}
              >
                Acknowledge
              </ActionButton>
            )}

            {(incident?.status === 'open' || incident?.status === 'acknowledged') && (
              <ActionButton
                isOffline={isOffline}
                variant="success"
                onClick={async () => {
                  const success = await onResolve(incidentId);
                  if (success) fetchDetail();
                }}
              >
                Resolve
              </ActionButton>
            )}
          </div>
        </div>

        {/* Internal Tabs */}
        <div className="flex border-b border-zinc-800 px-6 space-x-2 text-xs font-mono bg-zinc-900/30 overflow-x-auto">
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'events', label: `Events (${data?.events?.length || 0})` },
            { id: 'history', label: `History (${data?.history?.length || 0})` },
            { id: 'notifications', label: 'Outbox' },
            { id: 'rules', label: 'Explainability' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-2 px-2.5 border-b-2 font-medium transition ${
                activeTab === tab.id
                  ? 'border-zinc-200 text-zinc-100'
                  : 'border-transparent text-zinc-500 hover:text-zinc-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Drawer Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs">
          {loading ? (
            <div className="text-center py-16 text-zinc-500">Loading incident context...</div>
          ) : !incident ? (
            <div className="text-center py-16 text-red-400">Error loading incident.</div>
          ) : (
            <>
              {activeTab === 'overview' && (
                <div className="space-y-4">
                  {/* Device and Dedup Info */}
                  <div className="bg-zinc-900/40 p-4 rounded-lg border border-zinc-800 space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-zinc-500 text-[11px] block">DEVICE</span>
                        <span className="font-semibold text-zinc-100 text-sm">
                          {incident.device_name || incident.device_id}
                        </span>
                        <span className="text-[11px] text-zinc-400 block font-mono">{incident.device_id}</span>
                      </div>
                      <div>
                        <span className="text-zinc-500 text-[11px] block">RULE TYPE</span>
                        <span className="font-semibold text-zinc-200 uppercase">{incident.rule_type}</span>
                        <span className="text-[11px] text-zinc-500 block">
                          Scope: {incident.rule_config?.scope || 'all'}
                        </span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-zinc-800/80">
                      <span className="text-zinc-500 text-[11px] block">DEDUP KEY (PARTIAL UNIQUE INDEX)</span>
                      <span className="text-zinc-300 font-mono text-[11px]">{incident.dedup_key}</span>
                    </div>

                    {incident.summary && (
                      <div className="pt-2 border-t border-zinc-800/80">
                        <span className="text-zinc-500 text-[11px] block">SUMMARY</span>
                        <p className="text-zinc-300 text-xs mt-0.5">{incident.summary}</p>
                      </div>
                    )}
                  </div>

                  {/* Quick stats on attached events and state */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-zinc-900/40 p-3 rounded-lg border border-zinc-800">
                      <div className="text-zinc-500 text-[11px]">Repeat Occurrence Count</div>
                      <div className="text-xl font-bold text-zinc-100 mt-1 flex items-center space-x-1.5">
                        <Flame className="w-4 h-4 text-amber-400" />
                        <span>{incident.occurrence_count}</span>
                      </div>
                    </div>

                    <div className="bg-zinc-900/40 p-3 rounded-lg border border-zinc-800">
                      <div className="text-zinc-500 text-[11px]">Last Event Timestamp</div>
                      <div className="text-xs font-semibold text-zinc-200 mt-1">
                        {incident.last_event_at ? new Date(incident.last_event_at).toLocaleString() : 'N/A'}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'events' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-zinc-400 text-xs">
                    <span>Linked Trigger Events ({data?.events.length || 0})</span>
                  </div>
                  <div className="space-y-2">
                    {data?.events.map((ev) => (
                      <div
                        key={ev.event_id}
                        className="p-3 bg-zinc-900/50 rounded-lg border border-zinc-800 flex items-center justify-between font-mono"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <span className="font-semibold text-zinc-100">#{ev.seq}</span>
                            <span className="text-zinc-400 font-medium">{ev.type}</span>
                            <span className="text-[10px] text-zinc-500">{ev.event_id}</span>
                          </div>
                          <div className="text-[10px] text-zinc-500">
                            {new Date(ev.ts).toLocaleString()}
                          </div>
                          {ev.payload && (
                            <pre className="text-[10px] text-zinc-400 max-w-sm truncate">
                              {JSON.stringify(ev.payload)}
                            </pre>
                          )}
                        </div>

                        <button
                          onClick={() => onExplainEvent(ev.event_id)}
                          className="px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs transition border border-zinc-700/60"
                        >
                          Explain &rarr;
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'history' && (
                <div className="space-y-4">
                  <span className="font-semibold text-zinc-200 block">State Transition History</span>
                  {data?.history && data.history.length > 0 ? (
                    <div className="relative pl-4 border-l border-zinc-800 space-y-4">
                      {data.history.map((hist) => (
                        <div key={hist.id} className="relative">
                          <span className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-zinc-200 ring-4 ring-zinc-950"></span>
                          <div className="flex items-center space-x-2 text-xs">
                            <span className="text-zinc-500">{hist.from_status || 'created'}</span>
                            <span className="text-zinc-400">&rarr;</span>
                            <span className="font-semibold text-zinc-100 uppercase">{hist.to_status}</span>
                          </div>
                          <div className="text-xs text-zinc-300 mt-1">{hist.reason}</div>
                          <div className="text-[10px] text-zinc-500 mt-1 flex items-center space-x-2">
                            <span>Actor: {hist.actor}</span>
                            <span>·</span>
                            <span>
                              {new Date(hist.created_at || hist.timestamp || '').toLocaleString()}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-zinc-500 text-xs">No state transition history recorded yet.</p>
                  )}
                </div>
              )}

              {activeTab === 'notifications' && (
                <div className="space-y-4">
                  <div className="bg-zinc-900/40 p-4 rounded-lg border border-zinc-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-zinc-100">Transactional Outbox Status</span>
                      <div className="flex items-center space-x-2">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                            incident.notification_status === 'sent'
                              ? 'bg-zinc-900 text-emerald-400 border border-emerald-900/60'
                              : incident.notification_status === 'dead'
                                ? 'bg-red-950 text-red-300 border border-red-800/60'
                                : 'bg-amber-950 text-amber-300 border border-amber-800/60'
                          }`}
                        >
                          {incident.notification_status || 'pending'}
                        </span>
                        {incident.notification_status === 'dead' && (
                          <ActionButton
                            isOffline={isOffline}
                            variant="secondary"
                            disabled={retryingNotif}
                            onClick={handleRetryDeadNotif}
                          >
                            <RefreshCw className="w-3 h-3 mr-1" />
                            {retryingNotif ? 'Retrying...' : 'Retry Webhook'}
                          </ActionButton>
                        )}
                      </div>
                    </div>

                    {data?.notifications && data.notifications.length > 0 ? (
                      <div className="divide-y divide-zinc-800/80 pt-1">
                        {data.notifications.map((n: any) => (
                          <div
                            key={n.id}
                            className="py-2.5 flex items-center justify-between text-xs font-mono"
                          >
                            <div>
                              <div className="text-zinc-300 truncate max-w-xs">
                                {n.destination_url}
                              </div>
                              {n.last_error && (
                                <div className="text-red-400 text-[10px] mt-0.5">{n.last_error}</div>
                              )}
                            </div>
                            <div className="text-zinc-400 text-right text-[11px]">
                              <div>Attempts: {n.attempts}</div>
                              <div className="text-[10px] text-zinc-500">
                                {new Date(n.created_at).toLocaleTimeString()}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-zinc-500 text-xs">No notifications recorded.</p>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'rules' && (
                <div className="space-y-4">
                  <span className="font-semibold text-zinc-100 block">
                    Rule Evaluation &amp; Suppression Explainability
                  </span>
                  {data?.rule_evaluations && data.rule_evaluations.length > 0 ? (
                    <div className="space-y-2">
                      {data.rule_evaluations.map((evalItem: any) => (
                        <div
                          key={evalItem.id}
                          className="p-3 bg-zinc-900/50 rounded-lg border border-zinc-800 space-y-1 font-mono"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-zinc-200">
                              {evalItem.rule_name || evalItem.rule_id}
                            </span>
                            <span
                              className={`px-1.5 py-0.5 rounded text-[9px] font-semibold uppercase ${
                                evalItem.decision === 'created'
                                  ? 'bg-zinc-800 text-emerald-400 border border-emerald-500/40'
                                  : evalItem.decision === 'suppressed'
                                    ? 'bg-amber-950/80 text-amber-300 border border-amber-800/60'
                                    : evalItem.matched
                                      ? 'bg-zinc-800 text-zinc-200'
                                      : 'bg-zinc-950 text-zinc-500'
                              }`}
                            >
                              {evalItem.decision === 'created'
                                ? 'INCIDENT CREATED'
                                : evalItem.decision === 'suppressed'
                                  ? 'SUPPRESSED (DEDUP)'
                                  : evalItem.matched
                                    ? 'MATCHED'
                                    : 'NO MATCH'}
                            </span>
                          </div>
                          <p className="text-zinc-200 font-medium text-xs">
                            {evalItem.decision_explanation || evalItem.reason}
                          </p>
                          {evalItem.decision_explanation &&
                            evalItem.decision_explanation !== evalItem.reason && (
                              <p className="text-zinc-500 text-[10px]">
                                <span className="font-semibold">Condition: </span>
                                {evalItem.reason}
                              </p>
                            )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-zinc-500 text-xs">
                      No rule evaluation details recorded for this incident.
                    </p>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
