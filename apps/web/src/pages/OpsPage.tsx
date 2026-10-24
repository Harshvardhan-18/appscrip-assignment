import React, { useState, useEffect } from 'react';
import { usePlatformStore } from '../store/PlatformContext.js';
import { authFetch } from '../api.js';
import { ActionButton } from '../components/ActionButton.js';
import {
  RefreshCw,
  RotateCcw,
  Terminal,
  Send,
  AlertTriangle,
  Clock,
  Layers,
  CheckCircle2,
} from 'lucide-react';

export const OpsPage: React.FC = () => {
  const { state, requeueDeadLetter, retryDeadNotifications } = usePlatformStore();
  const { stats, connection } = state;
  const isOffline = connection.status === 'offline';

  const [loading, setLoading] = useState(false);
  const [deadLetters, setDeadLetters] = useState<{
    failed_events: any[];
    dead_notifications: any[];
    rejected_events: any[];
  }>({
    failed_events: [],
    dead_notifications: [],
    rejected_events: [],
  });

  const [outboxItems, setOutboxItems] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'dead-letters' | 'outbox'>('dead-letters');
  const [requeuing, setRequeuing] = useState(false);

  const fetchOpsData = async () => {
    setLoading(true);
    try {
      const [dlRes, outboxRes] = await Promise.all([
        authFetch('/api/dead-letters')
          .then((r) => r.json())
          .catch(() => ({})),
        authFetch('/sink/notifications')
          .then((r) => r.json())
          .catch(() => []),
      ]);

      if (dlRes) {
        setDeadLetters({
          failed_events: dlRes.failed_events || [],
          dead_notifications: dlRes.dead_notifications || [],
          rejected_events: dlRes.rejected_events || [],
        });
      }

      if (Array.isArray(outboxRes)) {
        setOutboxItems(outboxRes);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOpsData();
    const interval = setInterval(fetchOpsData, 8000);
    return () => clearInterval(interval);
  }, []);

  const handleRequeueAll = async () => {
    if (isOffline) return;
    setRequeuing(true);
    try {
      const success = await requeueDeadLetter({ target: 'all' });
      if (success) {
        alert('All dead letters requeued successfully');
        fetchOpsData();
      }
    } finally {
      setRequeuing(false);
    }
  };

  const handleRequeueSingleEvent = async (eventId: string) => {
    if (isOffline) return;
    try {
      const res = await authFetch(`/api/events/${eventId}/requeue`, { method: 'POST' });
      if (res.ok) {
        alert(`Event ${eventId} requeued to pending`);
        fetchOpsData();
      }
    } catch (err: any) {
      alert(`Error requeueing event: ${err.message}`);
    }
  };

  const handleRetryAllOutbox = async () => {
    if (isOffline) return;
    setRequeuing(true);
    try {
      const success = await retryDeadNotifications();
      if (success) {
        alert('Retried all dead outbox notifications');
        fetchOpsData();
      }
    } finally {
      setRequeuing(false);
    }
  };

  const totalDeadLetters =
    deadLetters.failed_events.length +
    deadLetters.dead_notifications.length +
    deadLetters.rejected_events.length;

  return (
    <div className="space-y-6 font-mono text-xs">
      {/* Header and Quick Stats */}
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-zinc-100 tracking-tight">
              System Operations &amp; Diagnostics
            </h2>
            <p className="text-zinc-400 mt-1">
              Durable queue health, dead-letter DLQ recovery, and transactional outbox webhook audit
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={fetchOpsData}
              disabled={loading}
              className="px-3 py-1.5 rounded-md bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 hover:border-zinc-700 transition flex items-center space-x-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>{loading ? 'Refreshing...' : 'Refresh'}</span>
            </button>

            <ActionButton
              isOffline={isOffline}
              variant="warning"
              disabled={requeuing || totalDeadLetters === 0}
              onClick={handleRequeueAll}
            >
              <RotateCcw className="w-3.5 h-3.5 mr-1" />
              <span>{requeuing ? 'Requeuing...' : 'Requeue All Dead Letters'}</span>
            </ActionButton>
          </div>
        </div>

        {/* Diagnostics Metrics Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 pt-2">
          <div className="bg-zinc-950 p-3 rounded-md border border-zinc-800">
            <span className="text-[10px] text-zinc-500 block uppercase">QUEUE DEPTH</span>
            <span className="text-lg font-semibold text-zinc-100">
              {stats?.queue_depth_and_lag.depth ?? 0}
            </span>
          </div>

          <div className="bg-zinc-950 p-3 rounded-md border border-zinc-800">
            <span className="text-[10px] text-zinc-500 block uppercase">QUEUE LAG</span>
            <span
              className={`text-lg font-semibold ${
                (stats?.queue_depth_and_lag.lag_seconds ?? 0) > 30
                  ? 'text-red-400'
                  : 'text-emerald-400'
              }`}
            >
              {stats?.queue_depth_and_lag.lag_seconds ?? 0}s
            </span>
          </div>

          <div className="bg-zinc-950 p-3 rounded-md border border-zinc-800">
            <span className="text-[10px] text-zinc-500 block uppercase">PROCESSING</span>
            <span className="text-lg font-semibold text-amber-300">
              {stats?.queue_depth_and_lag.processing ?? 0}
            </span>
          </div>

          <div className="bg-zinc-950 p-3 rounded-md border border-zinc-800">
            <span className="text-[10px] text-zinc-500 block uppercase">DONE (COMMITTED)</span>
            <span className="text-lg font-semibold text-emerald-400">
              {stats?.queue_depth_and_lag.done ?? 0}
            </span>
          </div>

          <div className="bg-zinc-950 p-3 rounded-md border border-zinc-800">
            <span className="text-[10px] text-zinc-500 block uppercase">DEAD LETTERS</span>
            <span
              className={`text-lg font-semibold ${
                totalDeadLetters > 0 ? 'text-red-400' : 'text-zinc-400'
              }`}
            >
              {totalDeadLetters}
            </span>
          </div>

          <div className="bg-zinc-950 p-3 rounded-md border border-zinc-800">
            <span className="text-[10px] text-zinc-500 block uppercase">OUTBOX SENT</span>
            <span className="text-lg font-semibold text-zinc-100">{stats?.outbox_state.sent ?? 0}</span>
          </div>
        </div>
      </div>

      {/* Tabs: Dead Letters vs Outbox Audit */}
      <div className="flex items-center space-x-1 border-b border-zinc-800 pb-1">
        <button
          onClick={() => setActiveTab('dead-letters')}
          className={`px-3 py-1.5 rounded-md font-medium transition ${
            activeTab === 'dead-letters'
              ? 'bg-zinc-800 text-zinc-100 border border-zinc-700/60'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60'
          }`}
        >
          Dead Letters ({totalDeadLetters})
        </button>

        <button
          onClick={() => setActiveTab('outbox')}
          className={`px-3 py-1.5 rounded-md font-medium transition ${
            activeTab === 'outbox'
              ? 'bg-zinc-800 text-zinc-100 border border-zinc-700/60'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60'
          }`}
        >
          Notification Outbox ({outboxItems.length})
        </button>
      </div>

      {/* Dead Letters View */}
      {activeTab === 'dead-letters' && (
        <div className="space-y-6">
          {/* Failed Events */}
          <div className="bg-zinc-900/30 border border-zinc-800 rounded-lg overflow-hidden">
            <div className="px-5 py-3 border-b border-zinc-800 bg-zinc-900/70 flex items-center justify-between">
              <span className="font-semibold text-zinc-100">
                Failed Events (Exceeded Max Retries) - {deadLetters.failed_events.length}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-zinc-950 text-zinc-400 text-[11px] uppercase border-b border-zinc-800">
                  <tr>
                    <th className="px-4 py-2.5 font-semibold">Event ID</th>
                    <th className="px-4 py-2.5 font-semibold">Device</th>
                    <th className="px-4 py-2.5 font-semibold">Attempts</th>
                    <th className="px-4 py-2.5 font-semibold">Last Error</th>
                    <th className="px-4 py-2.5 font-semibold text-right">Requeue</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-850">
                  {deadLetters.failed_events.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-5 py-8 text-center text-zinc-500">
                        No failed events in dead-letter queue.
                      </td>
                    </tr>
                  ) : (
                    deadLetters.failed_events.map((ev) => (
                      <tr key={ev.event_id || ev.id} className="hover:bg-zinc-900/50 transition">
                        <td className="px-4 py-2 font-semibold text-zinc-200 select-all">
                          {ev.event_id || ev.id}
                        </td>
                        <td className="px-4 py-2 text-zinc-300">{ev.device_id}</td>
                        <td className="px-4 py-2">
                          <span className="px-1.5 py-0.5 rounded bg-red-950/80 text-red-300 border border-red-900/60 font-semibold text-[10px]">
                            {ev.attempts} attempts
                          </span>
                        </td>
                        <td className="px-4 py-2 text-red-300 max-w-xs truncate">
                          {ev.last_error || 'Execution failed'}
                        </td>
                        <td className="px-4 py-2 text-right">
                          <ActionButton
                            isOffline={isOffline}
                            variant="secondary"
                            onClick={() => handleRequeueSingleEvent(ev.event_id || ev.id)}
                          >
                            Requeue
                          </ActionButton>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Rejected Malformed Events */}
          <div className="bg-zinc-900/30 border border-zinc-800 rounded-lg overflow-hidden">
            <div className="px-5 py-3 border-b border-zinc-800 bg-zinc-900/70">
              <span className="font-semibold text-zinc-100">
                Rejected Malformed Events (Capped) - {deadLetters.rejected_events.length}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-zinc-950 text-zinc-400 text-[11px] uppercase border-b border-zinc-800">
                  <tr>
                    <th className="px-4 py-2.5 font-semibold">Device ID</th>
                    <th className="px-4 py-2.5 font-semibold">Rejection Reason</th>
                    <th className="px-4 py-2.5 font-semibold">Received At</th>
                    <th className="px-4 py-2.5 font-semibold">Raw Payload</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-850">
                  {deadLetters.rejected_events.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-5 py-8 text-center text-zinc-500">
                        No rejected events stored.
                      </td>
                    </tr>
                  ) : (
                    deadLetters.rejected_events.map((r, idx) => (
                      <tr key={idx} className="hover:bg-zinc-900/50 transition">
                        <td className="px-4 py-2 font-semibold text-zinc-200">{r.device_id}</td>
                        <td className="px-4 py-2 text-red-300">{r.reason}</td>
                        <td className="px-4 py-2 text-zinc-400 whitespace-nowrap">
                          {new Date(r.received_at || r.created_at).toLocaleTimeString()}
                        </td>
                        <td className="px-4 py-2 text-zinc-400 max-w-sm truncate text-[11px]">
                          {typeof r.raw_payload === 'object'
                            ? JSON.stringify(r.raw_payload)
                            : String(r.raw_payload)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Outbox View */}
      {activeTab === 'outbox' && (
        <div className="bg-zinc-900/30 border border-zinc-800 rounded-lg overflow-hidden space-y-4 p-5">
          <div className="flex items-center justify-between">
            <div>
              <span className="font-semibold text-zinc-100 block text-sm">
                Transactional Outbox &amp; Webhook Sink Receiver
              </span>
              <span className="text-zinc-400 text-[11px]">
                Auditing operator webhook deliveries with idempotency keys and exponential backoff
              </span>
            </div>

            <ActionButton isOffline={isOffline} variant="warning" onClick={handleRetryAllOutbox}>
              Retry Failed &amp; Dead Outbox
            </ActionButton>
          </div>

          <div className="overflow-x-auto border border-zinc-800 rounded-lg">
            <table className="w-full text-left">
              <thead className="bg-zinc-950 text-zinc-400 text-[11px] uppercase border-b border-zinc-800">
                <tr>
                  <th className="px-4 py-2.5 font-semibold">Outbox ID / Key</th>
                  <th className="px-4 py-2.5 font-semibold">Incident ID</th>
                  <th className="px-4 py-2.5 font-semibold">Status</th>
                  <th className="px-4 py-2.5 font-semibold">Received At</th>
                  <th className="px-4 py-2.5 font-semibold">Payload Data</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-850">
                {outboxItems.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-12 text-center text-zinc-500">
                      No webhook notifications received by sink yet.
                    </td>
                  </tr>
                ) : (
                  outboxItems.map((item, idx) => (
                    <tr key={item.id || idx} className="hover:bg-zinc-900/50 transition">
                      <td className="px-4 py-2 font-semibold text-zinc-200 select-all">
                        {item.idempotency_key || item.id}
                      </td>
                      <td className="px-4 py-2 text-zinc-300">
                        {item.body?.incident_id || 'N/A'}
                      </td>
                      <td className="px-4 py-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold uppercase bg-zinc-800 text-emerald-400 border border-emerald-900/60">
                          DELIVERED
                        </span>
                      </td>
                      <td className="px-4 py-2 text-zinc-400 whitespace-nowrap">
                        {new Date(item.received_at).toLocaleTimeString()}
                      </td>
                      <td className="px-4 py-2 text-zinc-300 max-w-sm truncate text-[11px]">
                        {typeof item.body === 'object'
                          ? JSON.stringify(item.body)
                          : String(item.body)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
