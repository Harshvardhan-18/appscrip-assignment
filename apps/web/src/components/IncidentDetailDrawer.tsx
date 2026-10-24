import React, { useState, useEffect } from 'react';
import { Incident, IncidentHistoryItem, ExplainData } from '../types.js';
import { authFetch } from '../api.js';
import { ActionButton } from '../components/ActionButton.js';

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
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex justify-end">
      <div className="bg-slate-900 border-l border-slate-800 w-full max-w-2xl h-full flex flex-col shadow-2xl font-mono">
        {/* Drawer Header */}
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                  incident?.severity === 'critical'
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                    : incident?.severity === 'warning'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      : 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                }`}
              >
                {incident?.severity || 'warning'}
              </span>
              <span className="text-sm font-bold text-white truncate max-w-md">
                {incident?.rule_name || 'Incident Detail'}
              </span>
            </div>
            <div className="text-xs text-slate-400">
              ID: <span className="text-slate-300 select-all">{incidentId}</span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition"
          >
            ✕
          </button>
        </div>

        {/* Drawer Action Bar */}
        <div className="px-6 py-3 border-b border-slate-800/80 bg-slate-950/40 flex items-center justify-between">
          <div className="flex items-center space-x-2 text-xs">
            <span className="text-slate-400">Status:</span>
            <span
              className={`px-2 py-0.5 rounded font-bold uppercase text-[10px] ${
                incident?.status === 'open'
                  ? 'bg-rose-950 text-rose-300 border border-rose-800'
                  : incident?.status === 'acknowledged'
                    ? 'bg-amber-950 text-amber-300 border border-amber-800'
                    : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
              }`}
            >
              {incident?.status || 'open'}
            </span>
            {incident && incident.occurrence_count > 1 && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                {incident.occurrence_count} occurrences
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

        {/* Drawer Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs">
          {loading ? (
            <div className="text-center py-16 text-slate-500">Loading incident context...</div>
          ) : !incident ? (
            <div className="text-center py-16 text-rose-400">Error loading incident.</div>
          ) : (
            <>
              {/* Device and Dedup Info */}
              <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-2">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-slate-500 text-[11px] block">DEVICE</span>
                    <span className="font-bold text-white text-sm">
                      {incident.device_name || incident.device_id}
                    </span>
                    <span className="text-[11px] text-slate-400 block">{incident.device_id}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[11px] block">RULE TYPE</span>
                    <span className="font-bold text-teal-300 uppercase">{incident.rule_type}</span>
                    <span className="text-[11px] text-slate-400 block">
                      Scope: {incident.rule_config?.scope || 'all'}
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800/80">
                  <span className="text-slate-500 text-[11px] block">DEDUP KEY</span>
                  <span className="text-slate-300 font-mono text-[11px]">{incident.dedup_key}</span>
                </div>
              </div>

              {/* Notification Outbox Delivery Status */}
              <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white">Operator Notification</span>
                  <div className="flex items-center space-x-2">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        incident.notification_status === 'sent'
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                          : incident.notification_status === 'dead'
                            ? 'bg-rose-950 text-rose-400 border border-rose-800'
                            : 'bg-amber-950 text-amber-400 border border-amber-800'
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
                        {retryingNotif ? 'Retrying...' : 'Retry Webhook'}
                      </ActionButton>
                    )}
                  </div>
                </div>

                {data?.notifications && data.notifications.length > 0 ? (
                  <div className="divide-y divide-slate-800/60 pt-1">
                    {data.notifications.map((n: any) => (
                      <div
                        key={n.id}
                        className="py-2 flex items-center justify-between text-[11px]"
                      >
                        <div>
                          <div className="text-slate-300 truncate max-w-xs">
                            {n.destination_url}
                          </div>
                          {n.last_error && (
                            <div className="text-rose-400 text-[10px]">{n.last_error}</div>
                          )}
                        </div>
                        <div className="text-slate-400 text-right">
                          <div>Attempts: {n.attempts}</div>
                          <div className="text-[10px] text-slate-500">
                            {new Date(n.created_at).toLocaleTimeString()}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-500 text-[11px]">No notifications generated.</p>
                )}
              </div>

              {/* Rule Evaluation Explanation */}
              <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-3">
                <span className="font-bold text-white block">
                  Rule Evaluation &amp; Explanation
                </span>
                {data?.rule_evaluations && data.rule_evaluations.length > 0 ? (
                  <div className="space-y-2">
                    {data.rule_evaluations.map((evalItem: any) => (
                      <div
                        key={evalItem.id}
                        className="p-3 bg-slate-900 rounded-lg border border-slate-800 space-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-teal-300">
                            {evalItem.rule_name || evalItem.rule_id}
                          </span>
                          <span
                            className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                              evalItem.decision === 'created'
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                : evalItem.decision === 'suppressed'
                                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                  : evalItem.matched
                                    ? 'bg-rose-500/20 text-rose-300'
                                    : 'bg-slate-800 text-slate-400'
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
                        <p className="text-white font-medium text-[11px]">
                          {evalItem.decision_explanation || evalItem.reason}
                        </p>
                        {evalItem.decision_explanation &&
                          evalItem.decision_explanation !== evalItem.reason && (
                            <p className="text-slate-400 text-[10px]">
                              <span className="font-semibold">Condition: </span>
                              {evalItem.reason}
                            </p>
                          )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-500 text-[11px]">
                    No rule evaluation details recorded for this incident.
                  </p>
                )}
              </div>

              {/* History Timeline */}
              <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-3">
                <span className="font-bold text-white block">State Transition History</span>
                {data?.history && data.history.length > 0 ? (
                  <div className="relative pl-4 border-l border-slate-800 space-y-4">
                    {data.history.map((hist) => (
                      <div key={hist.id} className="relative">
                        <span className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-teal-500 ring-4 ring-slate-950"></span>
                        <div className="flex items-center space-x-2 text-[11px]">
                          <span className="text-slate-400">{hist.from_status || 'created'}</span>
                          <span className="text-teal-400">&rarr;</span>
                          <span className="font-bold text-white uppercase">{hist.to_status}</span>
                        </div>
                        <div className="text-[11px] text-slate-300 mt-0.5">{hist.reason}</div>
                        <div className="text-[10px] text-slate-500 mt-1 flex items-center space-x-2">
                          <span>By: {hist.actor}</span>
                          <span>·</span>
                          <span>
                            {new Date(hist.created_at || hist.timestamp || '').toLocaleString()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-500 text-[11px]">No history recorded yet.</p>
                )}
              </div>

              {/* Attached Events */}
              <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-3">
                <span className="font-bold text-white block">
                  Linked Trigger Events ({data?.events.length || 0})
                </span>
                <div className="space-y-2">
                  {data?.events.map((ev) => (
                    <div
                      key={ev.event_id}
                      className="p-3 bg-slate-900 rounded-lg border border-slate-800 flex items-center justify-between"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-teal-400">#{ev.seq}</span>
                          <span className="text-slate-300 font-semibold">{ev.type}</span>
                        </div>
                        <div className="text-[10px] text-slate-500">
                          {new Date(ev.ts).toLocaleString()}
                        </div>
                      </div>

                      <button
                        onClick={() => onExplainEvent(ev.event_id)}
                        className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-teal-300 text-[10px] transition"
                      >
                        Explain &rarr;
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
