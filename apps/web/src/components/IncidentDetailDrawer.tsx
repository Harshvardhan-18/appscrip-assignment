import React, { useState, useEffect } from 'react';
import { Incident, IncidentHistoryItem } from '../types.js';
import { authFetch } from '../api.js';
import { ActionButton } from '../components/ActionButton.js';
import { useToast } from './Toast.js';
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
  Bell,
  AlertTriangle,
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
  const [activeTab, setActiveTab] = useState<'overview' | 'explain' | 'events' | 'timeline' | 'notifications'>('overview');
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
  const { showToast } = useToast();

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

  const handleRetryNotification = async () => {
    setRetryingNotif(true);
    try {
      const res = await authFetch(`/api/incidents/${incidentId}/retry-notifications`, { method: 'POST' });
      if (res.ok) {
        showToast('Retried', 'Notification redelivery initiated');
        fetchDetail();
      }
    } finally {
      setRetryingNotif(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex justify-end"
      onClick={onClose}
    >
      <div
        className="bg-[var(--surface)] border-l border-[var(--hairline)] w-full max-w-xl h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Sheet Header */}
        <div className="px-6 py-4 border-b border-[var(--hairline)] flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span
                className={`px-2 py-0.5 rounded-[var(--radius-control,6px)] text-[11px] font-medium uppercase tracking-wide ${
                  incident?.severity === 'critical'
                    ? 'bg-[var(--critical-bg)] text-[var(--critical)]'
                    : incident?.severity === 'warning'
                      ? 'bg-[var(--warning-bg)] text-[var(--warning)]'
                      : 'bg-[var(--canvas)] text-[var(--muted)]'
                }`}
              >
                {incident?.severity || 'warning'}
              </span>

              <span
                className="px-2 py-0.5 rounded-[var(--radius-control,6px)] text-[11px] font-medium capitalize bg-[var(--canvas)] text-[var(--ink)] border border-[var(--hairline)]"
              >
                {incident?.status || 'open'}
              </span>

              <span className="text-sm font-semibold text-[var(--ink)] truncate max-w-xs">
                {incident?.rule_name || 'Incident details'}
              </span>
            </div>

            <div className="text-xs text-[var(--muted)] font-mono">
              ID: <span className="text-[var(--ink)] select-all">{incidentId}</span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-[var(--radius-control,6px)] hover:bg-[var(--canvas)] text-[var(--muted)] hover:text-[var(--ink)] transition"
            aria-label="Close sheet"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Action Bar */}
        <div className="px-6 py-3 border-b border-[var(--hairline)] bg-[var(--canvas)] flex items-center justify-between">
          <div className="flex items-center space-x-2 text-xs text-[var(--muted)]">
            {incident && incident.occurrence_count > 1 && (
              <span className="flex items-center space-x-1 text-[var(--warning)] font-medium">
                <Flame className="w-3.5 h-3.5" />
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
                  if (success) {
                    showToast('Acknowledged', incident.rule_name);
                    fetchDetail();
                  }
                }}
              >
                Acknowledge
              </ActionButton>
            )}

            {(incident?.status === 'open' || incident?.status === 'acknowledged') && (
              <ActionButton
                isOffline={isOffline}
                variant="secondary"
                onClick={async () => {
                  const success = await onResolve(incidentId);
                  if (success) {
                    showToast('Resolved', incident.rule_name);
                    fetchDetail();
                  }
                }}
              >
                Resolve
              </ActionButton>
            )}
          </div>
        </div>

        {/* Internal Tabs */}
        <div className="flex border-b border-[var(--hairline)] px-6 space-x-4 text-xs font-medium overflow-x-auto">
          {[
            { id: 'overview', label: 'Summary' },
            { id: 'explain', label: 'Why it triggered' },
            { id: 'events', label: `Events (${data?.events?.length || 0})` },
            { id: 'timeline', label: `Timeline (${data?.history?.length || 0})` },
            { id: 'notifications', label: 'Notifications' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-3 border-b-2 transition whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-[var(--brand)] text-[var(--brand)] font-semibold'
                  : 'border-transparent text-[var(--muted)] hover:text-[var(--ink)]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Sheet Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs">
          {loading ? (
            <div className="text-center py-16 text-[var(--muted)]">Loading incident context...</div>
          ) : !incident ? (
            <div className="text-center py-16 text-[var(--critical)]">
              Unable to load incident details.
            </div>
          ) : (
            <>
              {/* Tab 1: Overview Summary */}
              {activeTab === 'overview' && (
                <div className="space-y-4">
                  <div className="bg-[var(--canvas)] p-4 rounded-[var(--radius-panel,12px)] border border-[var(--hairline)] space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-[11px] text-[var(--muted)]">Device</div>
                        <div className="text-sm font-semibold text-[var(--ink)] mt-0.5">
                          {incident.device_name || incident.device_id}
                        </div>
                        <div className="text-xs text-[var(--muted)] font-mono">{incident.device_id}</div>
                      </div>

                      <div>
                        <div className="text-[11px] text-[var(--muted)]">Rule</div>
                        <div className="text-sm font-semibold text-[var(--ink)] mt-0.5">
                          {incident.rule_name}
                        </div>
                        <div className="text-xs text-[var(--muted)] capitalize">
                          Type: {incident.rule_type}
                        </div>
                      </div>
                    </div>

                    {incident.summary && (
                      <div className="pt-3 border-t border-[var(--hairline)]">
                        <div className="text-[11px] text-[var(--muted)]">Condition summary</div>
                        <p className="text-xs text-[var(--ink)] mt-1">{incident.summary}</p>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-[var(--canvas)] rounded-[var(--radius-panel,12px)] border border-[var(--hairline)]">
                      <div className="text-[11px] text-[var(--muted)]">Opened</div>
                      <div className="text-xs font-medium text-[var(--ink)] mt-1 font-mono">
                        {incident.opened_at || incident.created_at
                          ? new Date(incident.opened_at || incident.created_at!).toLocaleString()
                          : 'N/A'}
                      </div>
                    </div>

                    <div className="p-3 bg-[var(--canvas)] rounded-[var(--radius-panel,12px)] border border-[var(--hairline)]">
                      <div className="text-[11px] text-[var(--muted)]">Last occurrence</div>
                      <div className="text-xs font-medium text-[var(--ink)] mt-1 font-mono">
                        {incident.last_event_at
                          ? new Date(incident.last_event_at).toLocaleString()
                          : 'N/A'}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 2: Why it triggered (Explainability in Plain English) */}
              {activeTab === 'explain' && (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-xs font-semibold text-[var(--ink)]">
                      Evaluation Rationale
                    </h3>
                    <p className="text-[11px] text-[var(--muted)] mt-0.5">
                      Plain English explanation of why rules triggered or suppressed new incident creation.
                    </p>
                  </div>

                  {data?.rule_evaluations && data.rule_evaluations.length > 0 ? (
                    <div className="space-y-2">
                      {data.rule_evaluations.map((evalItem: any) => (
                        <div
                          key={evalItem.id}
                          className="p-3.5 bg-[var(--canvas)] rounded-[var(--radius-panel,12px)] border border-[var(--hairline)] space-y-1.5"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-[var(--ink)]">
                              {evalItem.rule_name || evalItem.rule_id}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded-[var(--radius-control,6px)] text-[10px] font-medium uppercase ${
                                evalItem.decision === 'created'
                                  ? 'bg-[var(--healthy-bg)] text-[var(--healthy)]'
                                  : evalItem.decision === 'suppressed'
                                    ? 'bg-[var(--warning-bg)] text-[var(--warning)]'
                                    : 'bg-[var(--hairline)] text-[var(--muted)]'
                              }`}
                            >
                              {evalItem.decision === 'created'
                                ? 'Created incident'
                                : evalItem.decision === 'suppressed'
                                  ? 'Grouped / suppressed'
                                  : 'Evaluated'}
                            </span>
                          </div>

                          <div className="text-xs text-[var(--ink)] font-medium">
                            {evalItem.decision_explanation || evalItem.reason}
                          </div>

                          {evalItem.decision_explanation &&
                            evalItem.decision_explanation !== evalItem.reason && (
                              <div className="text-[11px] text-[var(--muted)]">
                                Match rule: {evalItem.reason}
                              </div>
                            )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-6 text-center text-xs text-[var(--muted)] bg-[var(--canvas)] rounded-[var(--radius-panel,12px)] border border-[var(--hairline)]">
                      No explanation recorded for this incident yet.
                    </div>
                  )}
                </div>
              )}

              {/* Tab 3: Linked Events */}
              {activeTab === 'events' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-[var(--ink)]">
                      Linked events ({data?.events?.length || 0})
                    </span>
                  </div>

                  <div className="space-y-2">
                    {data?.events.map((ev) => (
                      <div
                        key={ev.event_id}
                        className="p-3 bg-[var(--canvas)] rounded-[var(--radius-panel,12px)] border border-[var(--hairline)] flex items-center justify-between font-mono"
                      >
                        <div className="space-y-1 min-w-0 pr-3">
                          <div className="flex items-center space-x-2">
                            <span className="font-semibold text-[var(--ink)]">#{ev.seq}</span>
                            <span className="text-[var(--muted)] font-sans">{ev.type}</span>
                            <span className="text-[10px] text-[var(--muted)] truncate max-w-xs">{ev.event_id}</span>
                          </div>
                          <div className="text-[10px] text-[var(--muted)]">
                            {new Date(ev.ts).toLocaleString()}
                          </div>
                          {ev.payload && (
                            <pre className="text-[10px] text-[var(--muted)] max-w-sm truncate">
                              {JSON.stringify(ev.payload)}
                            </pre>
                          )}
                        </div>

                        <button
                          onClick={() => onExplainEvent(ev.event_id)}
                          className="px-2.5 py-1 rounded-[var(--radius-control,6px)] bg-[var(--surface)] hover:bg-[var(--canvas)] text-[var(--brand)] text-xs font-medium border border-[var(--hairline)] transition shrink-0"
                        >
                          Explain
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tab 4: History Timeline */}
              {activeTab === 'timeline' && (
                <div className="space-y-4">
                  <h3 className="text-xs font-semibold text-[var(--ink)]">State timeline</h3>
                  {data?.history && data.history.length > 0 ? (
                    <div className="relative pl-4 border-l border-[var(--hairline)] space-y-4">
                      {data.history.map((hist) => (
                        <div key={hist.id} className="relative">
                          <span className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-[var(--brand)] ring-4 ring-[var(--surface)]" />
                          <div className="flex items-center space-x-2 text-xs">
                            <span className="text-[var(--muted)] capitalize">{hist.from_status || 'created'}</span>
                            <span className="text-[var(--muted)]">&rarr;</span>
                            <span className="font-semibold text-[var(--ink)] capitalize">{hist.to_status}</span>
                          </div>
                          <div className="text-xs text-[var(--ink)] mt-1">{hist.reason}</div>
                          <div className="text-[11px] text-[var(--muted)] mt-1 flex items-center space-x-2">
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
                    <p className="text-[var(--muted)] text-xs">No status transitions recorded yet.</p>
                  )}
                </div>
              )}

              {/* Tab 5: Notifications */}
              {activeTab === 'notifications' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xs font-semibold text-[var(--ink)]">Notification status</h3>
                      <p className="text-[11px] text-[var(--muted)] mt-0.5">
                        Webhook dispatches to assigned location operators.
                      </p>
                    </div>

                    <div className="flex items-center space-x-2">
                      <span
                        className={`px-2 py-0.5 rounded-[var(--radius-control,6px)] text-[10px] font-medium uppercase ${
                          incident.notification_status === 'sent'
                            ? 'bg-[var(--healthy-bg)] text-[var(--healthy)]'
                            : incident.notification_status === 'dead'
                              ? 'bg-[var(--critical-bg)] text-[var(--critical)]'
                              : 'bg-[var(--warning-bg)] text-[var(--warning)]'
                        }`}
                      >
                        {incident.notification_status || 'pending'}
                      </span>

                      {incident.notification_status === 'dead' && (
                        <ActionButton
                          isOffline={isOffline}
                          variant="secondary"
                          disabled={retryingNotif}
                          onClick={handleRetryNotification}
                        >
                          <RefreshCw className="w-3 h-3 mr-1" />
                          {retryingNotif ? 'Retrying...' : 'Retry notification'}
                        </ActionButton>
                      )}
                    </div>
                  </div>

                  {data?.notifications && data.notifications.length > 0 ? (
                    <div className="space-y-2">
                      {data.notifications.map((n: any) => (
                        <div
                          key={n.id}
                          className="p-3 bg-[var(--canvas)] rounded-[var(--radius-panel,12px)] border border-[var(--hairline)] space-y-1.5"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-[var(--ink)] truncate max-w-xs">
                              {n.destination_url}
                            </span>
                            <span className="text-[10px] font-mono text-[var(--muted)]">
                              Attempts: {n.attempts}
                            </span>
                          </div>
                          {n.last_error && (
                            <div className="text-[11px] text-[var(--critical)]">
                              {n.last_error}
                            </div>
                          )}
                          <div className="text-[10px] text-[var(--muted)] font-mono">
                            {new Date(n.created_at).toLocaleString()}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[var(--muted)] text-xs">No notifications recorded.</p>
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
