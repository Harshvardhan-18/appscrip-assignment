import React from 'react';
import { ConnectionState } from '../types.js';

interface ConnectionBannerProps {
  connection: ConnectionState;
  onManualReconnect?: () => void;
}

export const ConnectionBanner: React.FC<ConnectionBannerProps> = ({
  connection,
  onManualReconnect,
}) => {
  const { status, offlineSince, isStale, lastSeq } = connection;

  const formatOfflineTime = (date: Date | null): string => {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  if (status === 'connected') {
    return (
      <div
        data-testid="connection-banner-connected"
        className="bg-emerald-950/40 border-b border-emerald-900/60 px-4 py-1.5 text-xs font-mono text-emerald-400 flex items-center justify-between"
      >
        <div className="flex items-center space-x-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="font-semibold">Connected to real-time event stream</span>
          <span className="text-emerald-500/80">· Sequence #{lastSeq}</span>
        </div>
        <span className="text-[11px] text-emerald-500/70 hidden sm:inline">
          LISTEN/NOTIFY via PostgreSQL
        </span>
      </div>
    );
  }

  if (status === 'reconnecting') {
    return (
      <div
        data-testid="connection-banner-reconnecting"
        className="bg-amber-950/80 border-b border-amber-800 px-4 py-2 text-xs font-mono text-amber-300 flex items-center justify-between animate-pulse"
      >
        <div className="flex items-center space-x-2">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-amber-400"></span>
          <span className="font-bold">Reconnecting...</span>
          <span>· Live stream temporarily interrupted. Showing last-known data (stale).</span>
        </div>
        {isStale && (
          <span className="bg-amber-900/60 text-amber-200 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">
            STALE DATA
          </span>
        )}
      </div>
    );
  }

  // Offline status
  const timeStr = formatOfflineTime(offlineSince);
  return (
    <div
      data-testid="connection-banner-offline"
      className="bg-red-950/90 border-b border-red-800 px-4 py-2.5 text-xs font-mono text-red-200 flex flex-wrap items-center justify-between gap-2 shadow-lg"
    >
      <div className="flex items-center space-x-2.5">
        <span className="inline-block h-3 w-3 rounded-full bg-red-500 ring-2 ring-red-400/40"></span>
        <span className="font-bold text-red-100">Offline since {timeStr || 'hh:mm'}</span>
        <span className="text-red-300">
          · Showing cached data (stale) · Action buttons disabled
        </span>
      </div>

      <div className="flex items-center space-x-2">
        <span className="bg-red-900/80 text-red-100 px-2 py-0.5 rounded text-[10px] font-bold tracking-wider">
          OFFLINE
        </span>
        {onManualReconnect && (
          <button
            onClick={onManualReconnect}
            className="px-2.5 py-1 rounded bg-red-900 hover:bg-red-800 text-white font-medium text-xs transition"
          >
            Retry Now
          </button>
        )}
      </div>
    </div>
  );
};
