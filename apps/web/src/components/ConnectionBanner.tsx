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
        className="bg-zinc-950 border-b border-zinc-850 px-4 py-1.5 text-xs font-mono text-zinc-400 flex items-center justify-between border-zinc-800"
      >
        <div className="flex items-center space-x-2.5">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="font-medium text-zinc-200">Connected to real-time event stream</span>
          <span className="text-zinc-500">· Sequence #{lastSeq}</span>
        </div>
        <div className="flex items-center space-x-3 text-[11px] text-zinc-500 hidden sm:flex">
          <span>PostgreSQL LISTEN/NOTIFY</span>
          <span className="inline-block h-1 w-1 rounded-full bg-zinc-700"></span>
          <span className="text-zinc-400">At-Least-Once Replay</span>
        </div>
      </div>
    );
  }

  if (status === 'reconnecting') {
    return (
      <div
        data-testid="connection-banner-reconnecting"
        className="bg-zinc-900 border-b border-amber-900/60 px-4 py-2 text-xs font-mono text-amber-300 flex items-center justify-between"
      >
        <div className="flex items-center space-x-2.5">
          <span className="inline-block h-2 w-2 rounded-full bg-amber-400 animate-pulse"></span>
          <span className="font-semibold text-amber-200">Reconnecting...</span>
          <span className="text-zinc-400">
            · Live stream temporarily interrupted. Showing last-known data (stale).
          </span>
        </div>
        {isStale && (
          <span className="bg-amber-950 text-amber-300 border border-amber-800/60 px-2 py-0.5 rounded text-[10px] font-bold tracking-wider">
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
      className="bg-zinc-900 border-b border-red-900/60 px-4 py-2.5 text-xs font-mono text-zinc-200 flex flex-wrap items-center justify-between gap-2 shadow-lg"
    >
      <div className="flex items-center space-x-2.5">
        <span className="inline-block h-2.5 w-2.5 rounded-full bg-red-500"></span>
        <span className="font-semibold text-zinc-100">Offline since {timeStr || 'hh:mm'}</span>
        <span className="text-zinc-400">
          · Showing cached data (stale) · Action buttons disabled
        </span>
      </div>

      <div className="flex items-center space-x-3">
        <span className="bg-red-950 text-red-300 border border-red-800/60 px-2 py-0.5 rounded text-[10px] font-bold tracking-wider">
          OFFLINE
        </span>
        {onManualReconnect && (
          <button
            onClick={onManualReconnect}
            className="px-2.5 py-1 rounded bg-zinc-100 hover:bg-zinc-200 text-zinc-900 font-medium text-xs transition"
          >
            Retry Now
          </button>
        )}
      </div>
    </div>
  );
};
