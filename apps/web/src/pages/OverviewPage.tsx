import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { usePlatformStore } from '../store/PlatformContext.js';
import { Sparkline } from '../components/Sparkline.js';
import { ActionButton } from '../components/ActionButton.js';
import { groupIncidents, GroupedIncident } from '../utils/incidentGrouping.js';
import { useToast } from '../components/Toast.js';
import {
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  Cpu,
  Activity,
  Clock,
  Radio,
  ArrowRight,
  Flame,
  Check,
} from 'lucide-react';

interface OverviewPageProps {
  onNavigateTab: (tab: string) => void;
  onSelectIncident: (id: string) => void;
}

export const OverviewPage: React.FC<OverviewPageProps> = ({
  onNavigateTab,
  onSelectIncident,
}) => {
  const { state, acknowledgeIncident, resolveIncident } = usePlatformStore();
  const { stats, incidents, devices, liveEvents, connection } = state;
  const isOffline = connection.status === 'offline';
  const { showToast } = useToast();

  const [selectedGroupIndex, setSelectedGroupIndex] = useState<number>(0);

  // Group all open/acknowledged incidents by rule+device
  const openIncidentsList = useMemo(() => {
    return Object.values(incidents).filter(
      (i) => i.status === 'open' || i.status === 'acknowledged'
    );
  }, [incidents]);

  const groupedIncidents = useMemo(() => {
    return groupIncidents(openIncidentsList);
  }, [openIncidentsList]);

  const devicesList = useMemo(() => Object.values(devices), [devices]);
  const offlineDevicesCount = useMemo(() => {
    return devicesList.filter((d) => d.status === 'offline').length;
  }, [devicesList]);

  const criticalCount = useMemo(() => {
    return groupedIncidents.filter((g) => g.severity === 'critical' && g.status === 'open').length;
  }, [groupedIncidents]);

  // Generate human-language status summary sentence
  const statusSentence = useMemo(() => {
    if (offlineDevicesCount > 0 && groupedIncidents.length > 0) {
      return `${offlineDevicesCount} ${offlineDevicesCount === 1 ? 'device is' : 'devices are'} offline and ${groupedIncidents.length} ${groupedIncidents.length === 1 ? 'incident needs' : 'incidents need'} attention`;
    }
    if (criticalCount > 0) {
      return `${criticalCount} critical ${criticalCount === 1 ? 'incident requires' : 'incidents require'} immediate triage`;
    }
    if (groupedIncidents.length > 0) {
      return `${groupedIncidents.length} ${groupedIncidents.length === 1 ? 'incident needs' : 'incidents need'} review`;
    }
    if (offlineDevicesCount > 0) {
      return `${offlineDevicesCount} ${offlineDevicesCount === 1 ? 'device is' : 'devices are'} offline`;
    }
    return 'Everything is running normally';
  }, [offlineDevicesCount, groupedIncidents.length, criticalCount]);

  // Sparkline data simulations based on live stats
  const rateSparkline = useMemo(() => {
    const rate = stats?.events_per_minute ?? 100;
    return [
      Math.max(10, rate * 0.85),
      Math.max(10, rate * 0.92),
      Math.max(10, rate * 0.8),
      Math.max(10, rate * 1.05),
      Math.max(10, rate * 0.98),
      rate,
    ];
  }, [stats?.events_per_minute]);

  const delaySparkline = useMemo(() => {
    const delay = stats?.queue_depth_and_lag?.lag_seconds ?? 0;
    return [delay + 1, delay, delay + 2, Math.max(0, delay - 1), delay];
  }, [stats?.queue_depth_and_lag?.lag_seconds]);

  // Quick Action Handlers with Toast Feedback
  const handleQuickAck = async (e: React.MouseEvent, group: GroupedIncident) => {
    e.stopPropagation();
    const success = await acknowledgeIncident(group.primaryId, 'operator:ui', 'Operator acknowledged');
    if (success) {
      showToast('Acknowledged', `${group.rule_name} on ${group.device_name}`);
    }
  };

  const handleQuickResolve = async (e: React.MouseEvent, group: GroupedIncident) => {
    e.stopPropagation();
    const success = await resolveIncident(group.primaryId, 'operator:ui', 'Operator resolved');
    if (success) {
      showToast('Resolved', `${group.rule_name} on ${group.device_name}`);
    }
  };

  // Keyboard Navigation: J/K, A, R, Enter
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input or textarea
      if (
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA' ||
        document.activeElement?.tagName === 'SELECT'
      ) {
        return;
      }

      if (e.key === 'j' || e.key === 'J') {
        e.preventDefault();
        setSelectedGroupIndex((prev) => Math.min(groupedIncidents.length - 1, prev + 1));
      } else if (e.key === 'k' || e.key === 'K') {
        e.preventDefault();
        setSelectedGroupIndex((prev) => Math.max(0, prev - 1));
      } else if (e.key === 'a' || e.key === 'A') {
        const cur = groupedIncidents[selectedGroupIndex];
        if (cur && cur.status === 'open' && !isOffline) {
          e.preventDefault();
          acknowledgeIncident(cur.primaryId, 'operator:keyboard', 'Keyboard shortcut A').then(
            (ok) => ok && showToast('Acknowledged', `${cur.rule_name} on ${cur.device_name}`)
          );
        }
      } else if (e.key === 'r' || e.key === 'R') {
        const cur = groupedIncidents[selectedGroupIndex];
        if (cur && !isOffline) {
          e.preventDefault();
          resolveIncident(cur.primaryId, 'operator:keyboard', 'Keyboard shortcut R').then(
            (ok) => ok && showToast('Resolved', `${cur.rule_name} on ${cur.device_name}`)
          );
        }
      } else if (e.key === 'Enter') {
        const cur = groupedIncidents[selectedGroupIndex];
        if (cur) {
          e.preventDefault();
          onSelectIncident(cur.primaryId);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [groupedIncidents, selectedGroupIndex, isOffline, acknowledgeIncident, resolveIncident, onSelectIncident, showToast]);

  return (
    <div className="space-y-6">
      {/* 1. Plain-Language Status Hero */}
      <section className="bg-[var(--surface)] border border-[var(--hairline)] rounded-[var(--radius-panel,12px)] p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
          <div className="space-y-1">
            <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-[var(--ink)] flex items-center space-x-2.5">
              <span>{statusSentence}</span>
              {groupedIncidents.length === 0 && offlineDevicesCount === 0 && (
                <CheckCircle2 className="w-5 h-5 text-[var(--healthy)] shrink-0" />
              )}
            </h1>
            <p className="text-xs text-[var(--muted)]">
              Real-time fleet operations snapshot · Updated continuously
            </p>
          </div>

          <div className="text-xs font-mono text-[var(--muted)] shrink-0">
            {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </div>
        </div>

        {/* 2. Compact Strip of 3 Key Numbers with Sparklines (NO 4 equal square tiles) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-6 mt-6 border-t border-[var(--hairline)]">
          {/* Metric 1: Events per minute */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="text-xs text-[var(--muted)]">Events per minute</div>
              <div className="text-2xl font-medium tabular-nums text-[var(--ink)]">
                {stats?.events_per_minute ?? 0}
                <span className="text-xs font-normal text-[var(--muted)] ml-1">ev/m</span>
              </div>
            </div>
            <Sparkline data={rateSparkline} color="var(--brand)" />
          </div>

          {/* Metric 2: Devices online of total */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="text-xs text-[var(--muted)]">Devices online of total</div>
              <div className="text-2xl font-medium tabular-nums text-[var(--ink)]">
                {stats?.devices_by_status?.online ?? devicesList.filter((d) => d.status === 'online').length}
                <span className="text-xs font-normal text-[var(--muted)] ml-1">
                  / {stats?.devices_by_status?.total ?? devicesList.length}
                </span>
              </div>
            </div>
            <div className="flex items-center space-x-1 text-xs">
              {offlineDevicesCount > 0 ? (
                <span className="text-[var(--critical)] font-medium">
                  {offlineDevicesCount} offline
                </span>
              ) : (
                <span className="text-[var(--healthy)] font-medium">All online</span>
              )}
            </div>
          </div>

          {/* Metric 3: Processing delay */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="text-xs text-[var(--muted)]">Processing delay</div>
              <div className="text-2xl font-medium tabular-nums text-[var(--ink)]">
                {stats?.queue_depth_and_lag?.lag_seconds ?? 0}
                <span className="text-xs font-normal text-[var(--muted)] ml-1">seconds</span>
              </div>
            </div>
            <Sparkline data={delaySparkline} color="var(--healthy)" />
          </div>
        </div>
      </section>

      {/* 3. Main Split View: "Needs attention" Hero Queue (Left) & Calm Live Feed (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): Grouped Incidents Queue */}
        <section className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <h2 className="text-sm font-semibold text-[var(--ink)] tracking-tight">
                Needs attention
              </h2>
              <span className="px-2 py-0.5 rounded-full text-xs font-mono font-medium bg-[var(--hairline)] text-[var(--muted)]">
                {groupedIncidents.length}
              </span>
            </div>

            <div className="hidden sm:flex items-center space-x-3 text-xs text-[var(--muted)] font-mono">
              <span>J/K move</span>
              <span>·</span>
              <span>A acknowledge</span>
              <span>·</span>
              <span>R resolve</span>
            </div>
          </div>

          {groupedIncidents.length === 0 ? (
            <div className="bg-[var(--surface)] border border-[var(--hairline)] rounded-[var(--radius-panel,12px)] p-12 text-center space-y-2 shadow-sm">
              <CheckCircle2 className="w-8 h-8 text-[var(--healthy)] mx-auto" />
              <div className="text-sm font-semibold text-[var(--ink)]">
                No incidents. New ones will appear here the moment a rule triggers.
              </div>
              <p className="text-xs text-[var(--muted)]">
                All devices and evaluation pipelines are performing within normal parameters.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {groupedIncidents.map((group, idx) => {
                const isSelected = idx === selectedGroupIndex;
                const isCritical = group.severity === 'critical';
                const isOpen = group.status === 'open';

                return (
                  <div
                    key={group.key}
                    onClick={() => onSelectIncident(group.primaryId)}
                    className={`bg-[var(--surface)] border rounded-[var(--radius-panel,12px)] p-4 cursor-pointer transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm ${
                      isSelected
                        ? 'border-[var(--brand)] ring-1 ring-[var(--brand)]'
                        : 'border-[var(--hairline)] hover:border-[var(--muted)]/40'
                    }`}
                  >
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        {/* Status Icon Indicator */}
                        <span
                          className={`w-2 h-2 rounded-full shrink-0 ${
                            isCritical ? 'bg-[var(--critical)]' : 'bg-[var(--warning)]'
                          }`}
                        />

                        {/* Severity Badge */}
                        <span
                          className={`px-2 py-0.5 rounded-[var(--radius-control,6px)] text-[11px] font-medium uppercase tracking-wide ${
                            isCritical
                              ? 'bg-[var(--critical-bg)] text-[var(--critical)]'
                              : 'bg-[var(--warning-bg)] text-[var(--warning)]'
                          }`}
                        >
                          {group.severity}
                        </span>

                        {/* Status Tag */}
                        <span
                          className={`px-1.5 py-0.5 rounded-[var(--radius-control,6px)] text-[11px] font-medium capitalize ${
                            isOpen
                              ? 'bg-[var(--canvas)] text-[var(--ink)] border border-[var(--hairline)]'
                              : 'bg-[var(--warning-bg)] text-[var(--warning)]'
                          }`}
                        >
                          {group.status}
                        </span>

                        <span className="text-sm font-semibold text-[var(--ink)] truncate">
                          {group.rule_name}
                        </span>
                      </div>

                      {/* Plain-English summary */}
                      {group.summary && (
                        <p className="text-xs text-[var(--ink)]/90 truncate max-w-xl">
                          {group.summary}
                        </p>
                      )}

                      {/* Device, Occurrences, Relative Age */}
                      <div className="flex items-center space-x-3 text-xs text-[var(--muted)]">
                        <span className="font-medium text-[var(--ink)]">
                          {group.device_name}
                        </span>
                        <span>·</span>
                        <span className="inline-flex items-center space-x-1">
                          <Flame className="w-3.5 h-3.5 text-[var(--warning)]" />
                          <span>{group.occurrence_count} occurrences</span>
                        </span>
                        <span>·</span>
                        <span
                          title={group.last_event_at ? new Date(group.last_event_at).toLocaleString() : ''}
                        >
                          {group.age}
                        </span>
                      </div>
                    </div>

                    {/* Inline Actions */}
                    <div
                      className="flex items-center space-x-2 shrink-0 sm:self-center"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {isOpen && (
                        <ActionButton
                          variant="warning"
                          isOffline={isOffline}
                          onClick={(e) => handleQuickAck(e, group)}
                        >
                          Acknowledge
                        </ActionButton>
                      )}

                      <ActionButton
                        variant="secondary"
                        isOffline={isOffline}
                        onClick={(e) => handleQuickResolve(e, group)}
                      >
                        Resolve
                      </ActionButton>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Right Column (1 Col): Calm Live Activity Feed */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-[var(--ink)] tracking-tight">
              Live activity
            </h2>
            <button
              onClick={() => onNavigateTab('events')}
              className="text-xs text-[var(--brand)] hover:underline font-medium"
            >
              All events
            </button>
          </div>

          <div className="bg-[var(--surface)] border border-[var(--hairline)] rounded-[var(--radius-panel,12px)] overflow-hidden shadow-sm divide-y divide-[var(--hairline)]">
            {liveEvents.length === 0 ? (
              <div className="p-8 text-center text-xs text-[var(--muted)]">
                Awaiting incoming device activity...
              </div>
            ) : (
              liveEvents.slice(0, 8).map((ev) => (
                <div
                  key={`${ev.id}-${ev.seq}`}
                  className="p-3 text-xs flex items-center justify-between hover:bg-[var(--canvas)] transition font-mono"
                >
                  <div className="space-y-0.5 truncate pr-2">
                    <div className="text-[var(--ink)] font-sans font-medium truncate">
                      {ev.device_id}
                    </div>
                    <div className="text-[11px] text-[var(--muted)]">
                      {ev.type}
                    </div>
                  </div>
                  <div className="text-right shrink-0 text-[11px] text-[var(--muted)]">
                    {ev.ts
                      ? new Date(ev.ts).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                        })
                      : 'now'}
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
};
