import React, { useState, useEffect, useRef, useMemo } from 'react';
import { usePlatformStore } from '../store/PlatformContext.js';
import { LiveEventItem } from '../types.js';
import {
  Play,
  Pause,
  HelpCircle,
  Filter,
  Radio,
  Search,
  SlidersHorizontal,
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

  return (
    <div className="space-y-4 font-mono">
      {/* Top Controls Bar */}
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* Pause / Resume Button */}
          <button
            onClick={handleTogglePause}
            className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-all duration-150 inline-flex items-center space-x-1.5 ${
              isPaused
                ? 'bg-amber-950/80 hover:bg-amber-900/80 text-amber-200 border-amber-800/80'
                : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border-zinc-800 hover:border-zinc-700'
            }`}
          >
            {isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
            <span>{isPaused ? 'Resume Stream' : 'Pause Stream'}</span>
            {isPaused && (
              <span className="text-[10px] bg-amber-900/60 text-amber-200 px-1.5 py-0.2 rounded font-mono">
                PAUSED
              </span>
            )}
          </button>

          {/* Auto Scroll Toggle */}
          <label className="flex items-center space-x-2 text-xs text-zinc-300 cursor-pointer select-none bg-zinc-950 px-3 py-1.5 rounded-md border border-zinc-800">
            <input
              type="checkbox"
              checked={autoScroll}
              onChange={(e) => setAutoScroll(e.target.checked)}
              className="rounded bg-zinc-900 border-zinc-700 text-zinc-100 focus:ring-0"
            />
            <span>Auto-scroll to top</span>
          </label>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-3 text-xs">
          {/* Device Filter */}
          <div className="flex items-center space-x-1.5 text-zinc-400">
            <span className="text-zinc-500">Device:</span>
            <select
              value={deviceFilter}
              onChange={(e) => setDeviceFilter(e.target.value)}
              className="bg-zinc-950 border border-zinc-800 rounded-md px-2.5 py-1.5 text-zinc-200 text-xs focus:outline-none focus:border-zinc-500 max-w-[150px]"
            >
              <option value="all">All Devices</option>
              {Object.keys(devices).map((dId) => (
                <option key={dId} value={dId}>
                  {devices[dId].name || dId}
                </option>
              ))}
            </select>
            {deviceFilter !== 'all' && (
              <button
                onClick={() => {
                  setDeviceFilter('all');
                  if (onClearInitialDeviceFilter) onClearInitialDeviceFilter();
                }}
                className="text-zinc-500 hover:text-zinc-300 text-xs underline"
              >
                Clear
              </button>
            )}
          </div>

          {/* Event Type Filter */}
          <div className="flex items-center space-x-1.5 text-zinc-400">
            <span className="text-zinc-500">Type:</span>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="bg-zinc-950 border border-zinc-800 rounded-md px-2.5 py-1.5 text-zinc-200 text-xs focus:outline-none focus:border-zinc-500"
            >
              <option value="all">All Types</option>
              {eventTypes.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <div className="text-zinc-500 text-xs pl-2 border-l border-zinc-800">
            Events in memory: <span className="text-zinc-200 font-semibold">{filteredEvents.length}</span>
          </div>
        </div>
      </div>

      {/* Live Stream Table Container */}
      <div
        ref={containerRef}
        className="bg-zinc-900/30 border border-zinc-800 rounded-lg overflow-y-auto max-h-[72vh] shadow-inner"
      >
        <table className="w-full text-left text-xs">
          <thead className="bg-zinc-900/80 border-b border-zinc-800 text-zinc-400 text-[11px] uppercase tracking-wider sticky top-0 z-10 backdrop-blur-sm">
            <tr>
              <th className="px-4 py-2.5 font-semibold">Seq</th>
              <th className="px-4 py-2.5 font-semibold">Time</th>
              <th className="px-4 py-2.5 font-semibold">Device</th>
              <th className="px-4 py-2.5 font-semibold">Type</th>
              <th className="px-4 py-2.5 font-semibold">Payload Preview</th>
              <th className="px-4 py-2.5 font-semibold">Status</th>
              <th className="px-4 py-2.5 font-semibold text-right">Explain</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-850">
            {filteredEvents.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-zinc-500">
                  <div className="flex flex-col items-center space-y-2">
                    <Radio className="w-6 h-6 text-zinc-600 animate-pulse" />
                    <span>Awaiting live change_log stream updates from PostgreSQL...</span>
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
                  : 'N/A';

                return (
                  <tr
                    key={`${ev.id}-${ev.seq}`}
                    className="hover:bg-zinc-900/60 transition group font-mono"
                  >
                    <td className="px-4 py-2 text-zinc-400 font-semibold">#{ev.seq}</td>

                    <td className="px-4 py-2 text-zinc-500 whitespace-nowrap">
                      {formattedTime}
                    </td>

                    <td className="px-4 py-2">
                      <span className="text-zinc-200 font-medium">{ev.device_id}</span>
                    </td>

                    <td className="px-4 py-2">
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-zinc-800 text-zinc-300 border border-zinc-700/60">
                        {ev.type}
                      </span>
                    </td>

                    <td className="px-4 py-2 max-w-xs md:max-w-md truncate text-zinc-400 text-[11px]">
                      {typeof ev.payload === 'object' && ev.payload !== null
                        ? JSON.stringify(ev.payload)
                        : String(ev.payload || '')}
                    </td>

                    <td className="px-4 py-2 whitespace-nowrap space-x-1.5">
                      {ev.is_duplicate ? (
                        <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-amber-950 text-amber-300 border border-amber-800/60">
                          DUP
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-zinc-800 text-zinc-300 border border-zinc-700/60">
                          ACCEPTED
                        </span>
                      )}
                      {ev.is_late && (
                        <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-zinc-800 text-zinc-400 border border-zinc-700">
                          LATE
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-2 text-right">
                      <button
                        onClick={() => onExplainEvent(ev.event_id || ev.id)}
                        className="text-zinc-400 hover:text-zinc-100 px-2 py-1 rounded bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-xs transition inline-flex items-center space-x-1"
                        title="Explain rule evaluations for this event"
                      >
                        <HelpCircle className="w-3 h-3 text-zinc-400" />
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
