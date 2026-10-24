import React, { useState, useEffect, useRef, useMemo } from 'react';
import { usePlatformStore } from '../store/PlatformContext.js';
import { LiveEventItem } from '../types.js';
import {
  Play,
  Pause,
  HelpCircle,
  Filter,
  X,
  Radio,
  Clock,
  RotateCcw,
} from 'lucide-react';

interface LiveEventsPageProps {
  initialDeviceFilter?: string | null;
  onClearInitialDeviceFilter?: () => void;
  onExplainEvent: (eventId: string) => void;
}

export const LiveEventsPage: React.FC<LiveEventsPageProps> = ({
  initialDeviceFilter = null,
  onClearInitialDeviceFilter,
  onExplainEvent,
}) => {
  const { state } = usePlatformStore();
  const { liveEvents, devices } = state;

  const [deviceFilter, setDeviceFilter] = useState<string>(initialDeviceFilter || 'all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [autoScroll, setAutoScroll] = useState<boolean>(true);

  // When paused, freeze the events view
  const [frozenEvents, setFrozenEvents] = useState<LiveEventItem[]>([]);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Sync initial filter prop if changed
  useEffect(() => {
    if (initialDeviceFilter) {
      setDeviceFilter(initialDeviceFilter);
    }
  }, [initialDeviceFilter]);

  // Handle Pause/Resume
  const handleTogglePause = () => {
    if (!isPaused) {
      setFrozenEvents([...liveEvents]);
      setIsPaused(true);
    } else {
      setIsPaused(false);
    }
  };

  const activeEvents = isPaused ? frozenEvents : liveEvents;

  // Filter events
  const filteredEvents = useMemo(() => {
    return activeEvents.filter((ev) => {
      const matchDevice = deviceFilter === 'all' || ev.device_id === deviceFilter;
      const matchType = typeFilter === 'all' || ev.type === typeFilter;
      return matchDevice && matchType;
    });
  }, [activeEvents, deviceFilter, typeFilter]);

  // Auto-scroll effect: scroll to top when new events arrive if autoScroll is enabled
  useEffect(() => {
    if (autoScroll && containerRef.current && !isPaused) {
      containerRef.current.scrollTop = 0;
    }
  }, [liveEvents, autoScroll, isPaused]);

  // Extract unique types from current stream
  const eventTypes = useMemo(() => {
    const types = new Set<string>();
    liveEvents.forEach((e) => {
      if (e.type) types.add(e.type);
    });
    return Array.from(types);
  }, [liveEvents]);

  const activeFilterChips = useMemo(() => {
    const chips: Array<{ id: string; label: string; onRemove: () => void }> = [];
    if (deviceFilter !== 'all') {
      const devName = devices[deviceFilter]?.name || deviceFilter;
      chips.push({
        id: 'device',
        label: `Device: ${devName}`,
        onRemove: () => {
          setDeviceFilter('all');
          if (onClearInitialDeviceFilter) onClearInitialDeviceFilter();
        },
      });
    }
    if (typeFilter !== 'all') {
      chips.push({
        id: 'type',
        label: `Type: ${typeFilter}`,
        onRemove: () => setTypeFilter('all'),
      });
    }
    return chips;
  }, [deviceFilter, typeFilter, devices, onClearInitialDeviceFilter]);

  return (
    <div className="space-y-4">
      {/* Header & Controls Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-[var(--ink)]">
            Live Events
          </h1>
          <p className="text-xs text-[var(--muted)] mt-0.5">
            Real-time telemetry stream from connected devices
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {/* Pause / Resume Button */}
          <button
            onClick={handleTogglePause}
            className={`px-3 py-1.5 rounded-[var(--radius-control,6px)] text-xs font-medium border transition inline-flex items-center space-x-1.5 ${
              isPaused
                ? 'bg-[var(--warning-bg)] text-[var(--warning)] border-[var(--warning)]/30'
                : 'bg-[var(--surface)] text-[var(--ink)] border-[var(--hairline)] hover:bg-[var(--canvas)]'
            }`}
          >
            {isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
            <span>{isPaused ? 'Resume stream' : 'Pause stream'}</span>
          </button>

          {/* Auto Scroll Toggle */}
          <label className="flex items-center space-x-2 text-xs text-[var(--ink)] cursor-pointer select-none bg-[var(--surface)] px-3 py-1.5 rounded-[var(--radius-control,6px)] border border-[var(--hairline)]">
            <input
              type="checkbox"
              checked={autoScroll}
              onChange={(e) => setAutoScroll(e.target.checked)}
              className="rounded-[4px] border-[var(--hairline)] text-[var(--brand)] focus:ring-0"
            />
            <span>Auto-scroll</span>
          </label>
        </div>
      </div>

      {/* Filter Chips Bar */}
      <div className="bg-[var(--surface)] border border-[var(--hairline)] rounded-[var(--radius-panel,12px)] p-3 flex flex-wrap items-center justify-between gap-3 text-xs shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          {/* Device Dropdown */}
          <div className="flex items-center space-x-1.5 text-[var(--muted)]">
            <span>Device:</span>
            <select
              value={deviceFilter}
              onChange={(e) => setDeviceFilter(e.target.value)}
              className="bg-[var(--canvas)] border border-[var(--hairline)] rounded-[var(--radius-control,6px)] px-2 py-1 text-[var(--ink)] text-xs focus:outline-none focus:border-[var(--brand)]"
            >
              <option value="all">All devices</option>
              {Object.keys(devices).map((dId) => (
                <option key={dId} value={dId}>
                  {devices[dId].name || dId}
                </option>
              ))}
            </select>
          </div>

          {/* Type Dropdown */}
          <div className="flex items-center space-x-1.5 text-[var(--muted)]">
            <span>Type:</span>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="bg-[var(--canvas)] border border-[var(--hairline)] rounded-[var(--radius-control,6px)] px-2 py-1 text-[var(--ink)] text-xs focus:outline-none focus:border-[var(--brand)]"
            >
              <option value="all">All types</option>
              {eventTypes.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          {/* Active Chips */}
          {activeFilterChips.map((chip) => (
            <span
              key={chip.id}
              className="inline-flex items-center space-x-1.5 px-2 py-0.5 rounded-[var(--radius-control,6px)] bg-[var(--brand-soft)] text-[var(--brand)] font-medium text-xs border border-[var(--brand)]/20"
            >
              <span>{chip.label}</span>
              <button onClick={chip.onRemove} className="hover:opacity-75">
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>

        <div className="text-[var(--muted)] text-xs font-mono">
          Showing <span className="font-semibold text-[var(--ink)]">{filteredEvents.length}</span> events
        </div>
      </div>

      {/* Dense Live Events Table with Sticky Header */}
      <div
        ref={containerRef}
        className="bg-[var(--surface)] border border-[var(--hairline)] rounded-[var(--radius-panel,12px)] overflow-y-auto max-h-[70vh] shadow-sm"
      >
        <table className="w-full text-left text-xs">
          <thead className="bg-[var(--canvas)] border-b border-[var(--hairline)] text-[var(--muted)] text-[11px] font-medium sticky top-0 z-10 backdrop-blur-sm">
            <tr>
              <th className="px-4 py-2.5 font-semibold">Sequence</th>
              <th className="px-4 py-2.5 font-semibold">Time</th>
              <th className="px-4 py-2.5 font-semibold">Device</th>
              <th className="px-4 py-2.5 font-semibold">Type</th>
              <th className="px-4 py-2.5 font-semibold">Payload</th>
              <th className="px-4 py-2.5 font-semibold">Tags</th>
              <th className="px-4 py-2.5 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--hairline)]">
            {filteredEvents.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-[var(--muted)]">
                  <div className="flex flex-col items-center space-y-2">
                    <Radio className="w-6 h-6 text-[var(--muted)] animate-pulse" />
                    <span>Waiting for device stream updates...</span>
                  </div>
                </td>
              </tr>
            ) : (
              filteredEvents.map((ev) => {
                const formattedTime = ev.ts
                  ? new Date(ev.ts).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                      fractionalSecondDigits: 3,
                    })
                  : 'now';

                return (
                  <tr
                    key={`${ev.id}-${ev.seq}`}
                    className="hover:bg-[var(--canvas)] transition font-mono"
                  >
                    <td className="px-4 py-2 text-[var(--ink)] font-medium">#{ev.seq}</td>

                    <td className="px-4 py-2 text-[var(--muted)] whitespace-nowrap">
                      {formattedTime}
                    </td>

                    <td className="px-4 py-2">
                      <span className="text-[var(--ink)] font-sans font-medium">{ev.device_id}</span>
                    </td>

                    <td className="px-4 py-2">
                      <span className="px-1.5 py-0.5 rounded-[var(--radius-control,6px)] text-[11px] font-sans font-medium bg-[var(--canvas)] text-[var(--muted)] border border-[var(--hairline)]">
                        {ev.type}
                      </span>
                    </td>

                    <td className="px-4 py-2 max-w-xs md:max-w-md truncate text-[var(--muted)] text-[11px]">
                      {typeof ev.payload === 'object' && ev.payload !== null
                        ? JSON.stringify(ev.payload)
                        : String(ev.payload || '')}
                    </td>

                    <td className="px-4 py-2 whitespace-nowrap space-x-1.5">
                      {ev.is_duplicate ? (
                        <span className="px-1.5 py-0.5 rounded-[var(--radius-control,6px)] text-[10px] font-sans font-medium bg-[var(--warning-bg)] text-[var(--warning)] border border-[var(--warning)]/20">
                          Duplicate
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.5 rounded-[var(--radius-control,6px)] text-[10px] font-sans font-medium bg-[var(--canvas)] text-[var(--muted)] border border-[var(--hairline)]">
                          Accepted
                        </span>
                      )}
                      {ev.is_late && (
                        <span className="px-1.5 py-0.5 rounded-[var(--radius-control,6px)] text-[10px] font-sans font-medium bg-[var(--hairline)] text-[var(--muted)]">
                          Late
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-2 text-right">
                      <button
                        onClick={() => onExplainEvent(ev.event_id || ev.id)}
                        className="text-[var(--muted)] hover:text-[var(--ink)] px-2 py-1 rounded-[var(--radius-control,6px)] bg-[var(--surface)] hover:bg-[var(--canvas)] border border-[var(--hairline)] text-xs font-sans font-medium transition inline-flex items-center space-x-1"
                        title="Explain rule evaluations for this event"
                      >
                        <HelpCircle className="w-3 h-3" />
                        <span>Explain</span>
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
  );
};
