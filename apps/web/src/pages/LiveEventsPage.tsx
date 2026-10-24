import React, { useState, useEffect, useRef, useMemo } from 'react';
import { usePlatformStore } from '../store/PlatformContext.js';
import { LiveEventItem } from '../types.js';

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

  return (
    <div className="space-y-4 font-mono">
      {/* Top Controls Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          {/* Pause / Resume Button */}
          <button
            onClick={handleTogglePause}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition flex items-center space-x-1.5 ${
              isPaused
                ? 'bg-amber-600 hover:bg-amber-500 text-white border-amber-500'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
            }`}
          >
            <span>{isPaused ? '▶ Resume Stream' : '⏸ Pause Stream'}</span>
            {isPaused && (
              <span className="text-[10px] bg-amber-900/80 px-1.5 py-0.2 rounded font-mono">
                PAUSED
              </span>
            )}
          </button>

          {/* Auto Scroll Toggle */}
          <label className="flex items-center space-x-2 text-xs text-slate-300 cursor-pointer select-none bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800">
            <input
              type="checkbox"
              checked={autoScroll}
              onChange={(e) => setAutoScroll(e.target.checked)}
              className="rounded bg-slate-900 border-slate-700 text-teal-500 focus:ring-0"
            />
            <span>Auto-scroll</span>
          </label>

          {/* Device Filter */}
          <select
            value={deviceFilter}
            onChange={(e) => setDeviceFilter(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-teal-500"
          >
            <option value="all">All Devices</option>
            {Object.values(devices).map((d) => (
              <option key={d.id} value={d.id}>
                {d.name} ({d.id})
              </option>
            ))}
          </select>

          {/* Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-teal-500"
          >
            <option value="all">All Event Types</option>
            {eventTypes.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>

          {deviceFilter !== 'all' && onClearInitialDeviceFilter && (
            <button
              onClick={() => {
                setDeviceFilter('all');
                onClearInitialDeviceFilter();
              }}
              className="text-xs text-slate-400 hover:text-white underline"
            >
              Clear Filter
            </button>
          )}
        </div>

        <div className="flex items-center space-x-3 text-xs text-slate-400">
          <span>Showing {filteredEvents.length} events</span>
          <span className="text-slate-600">|</span>
          <span className="text-teal-400">Cap: 250 in-memory</span>
        </div>
      </div>

      {/* Events Table Container */}
      <div
        ref={containerRef}
        className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm max-h-[680px] overflow-y-auto"
      >
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-950/80 sticky top-0 z-10 text-slate-400 border-b border-slate-800 text-[11px] uppercase tracking-wider backdrop-blur">
            <tr>
              <th className="px-4 py-3 font-semibold">Seq</th>
              <th className="px-4 py-3 font-semibold">Timestamp</th>
              <th className="px-4 py-3 font-semibold">Device</th>
              <th className="px-4 py-3 font-semibold">Type</th>
              <th className="px-4 py-3 font-semibold">Payload Summary</th>
              <th className="px-4 py-3 font-semibold">Tags / Status</th>
              <th className="px-4 py-3 font-semibold text-right">Explain</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {filteredEvents.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-5 py-16 text-center text-slate-500">
                  {isPaused
                    ? 'Stream is paused and no events match current filters.'
                    : 'No events received yet. Simulator is feeding events in the background.'}
                </td>
              </tr>
            ) : (
              filteredEvents.map((ev) => (
                <tr key={ev.id || ev.event_id} className="hover:bg-slate-800/40 transition">
                  <td className="px-4 py-2.5 font-bold text-teal-400">#{ev.seq}</td>
                  <td className="px-4 py-2.5 text-slate-400 whitespace-nowrap">
                    <div>{new Date(ev.received_at || ev.ts).toLocaleTimeString()}</div>
                    <div className="text-[10px] text-slate-600">
                      {new Date(ev.received_at || ev.ts).toISOString().split('T')[0]}
                    </div>
                  </td>
                  <td className="px-4 py-2.5 font-semibold text-slate-200">
                    <div>{devices[ev.device_id]?.name || ev.device_id}</div>
                    <div className="text-[10px] text-slate-500">{ev.device_id}</div>
                  </td>
                  <td className="px-4 py-2.5">
                    <span className="px-2 py-0.5 rounded bg-slate-800 text-teal-300 font-bold text-[10px] uppercase border border-slate-700">
                      {ev.type}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 max-w-xs truncate text-slate-300 text-[11px]">
                    {typeof ev.payload === 'object'
                      ? JSON.stringify(ev.payload)
                      : String(ev.payload)}
                  </td>
                  <td className="px-4 py-2.5 space-x-1.5 whitespace-nowrap">
                    {/* Status */}
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                        ev.processing_status === 'done'
                          ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/60'
                          : ev.processing_status === 'failed'
                            ? 'bg-rose-950/60 text-rose-400 border border-rose-800/60'
                            : 'bg-amber-950/60 text-amber-400 border border-amber-800/60'
                      }`}
                    >
                      {ev.processing_status}
                    </span>

                    {/* Late Tag */}
                    {ev.is_late && (
                      <span
                        title="Received outside late window threshold (>300s)"
                        className="px-1.5 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-700 text-[10px] font-bold tracking-wide"
                      >
                        LATE
                      </span>
                    )}

                    {/* Duplicate Tag */}
                    {ev.is_duplicate && (
                      <span
                        title="Duplicate event suppressed by server idempotency"
                        className="px-1.5 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-700 text-[10px] font-bold tracking-wide"
                      >
                        DUPLICATE
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <button
                      onClick={() => onExplainEvent(ev.event_id || ev.id)}
                      className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-teal-400 hover:text-teal-300 border border-slate-700 text-xs transition"
                    >
                      Explain
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
