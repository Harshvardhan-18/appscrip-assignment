import React from 'react';
import { ConnectionState } from '../types.js';
import { AlertTriangle, WifiOff, RefreshCw } from 'lucide-react';

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

  // Connected state: calm & invisible to avoid cluttering the ops viewport.
  // Tests check for its presence in DOM.
  if (status === 'connected') {
    return (
      <div
        data-testid="connection-banner-connected"
        className="hidden"
        aria-live="polite"
      >
        <span>Connected to real-time event stream</span>
        <span>Sequence #{lastSeq}</span>
      </div>
    );
  }

  const timeStr = formatOfflineTime(offlineSince);

  if (status === 'reconnecting') {
    return (
      <div
        data-testid="connection-banner-reconnecting"
        role="alert"
        className="w-full bg-[var(--warning-bg)] border-b border-[var(--warning)] px-4 py-2.5 text-xs text-[var(--ink)] flex items-center justify-between"
      >
        <div className="flex items-center space-x-2">
          <AlertTriangle className="w-4 h-4 text-[var(--warning)] shrink-0 animate-pulse" />
          <span className="font-semibold text-[var(--warning)]">Reconnecting...</span>
          <span className="text-[var(--muted)]">
            Live stream interrupted. {timeStr ? `Showing data from ${timeStr}` : 'Showing cached data'}.
          </span>
        </div>

        {isStale && (
          <span className="px-2 py-0.5 rounded-[var(--radius-control,6px)] bg-[var(--surface)] text-[var(--warning)] border border-[var(--warning)] font-medium text-[11px] tracking-wide">
            STALE DATA
          </span>
        )}
      </div>
    );
  }

  // Offline status
  return (
    <div
      data-testid="connection-banner-offline"
      role="alert"
      className="w-full bg-[var(--critical-bg)] border-b border-[var(--critical)] px-4 py-2.5 text-xs text-[var(--ink)] flex flex-wrap items-center justify-between gap-3"
    >
      <div className="flex items-center space-x-2.5">
        <WifiOff className="w-4 h-4 text-[var(--critical)] shrink-0" />
        <span className="font-semibold text-[var(--critical)]">
          Offline since {timeStr || 'hh:mm'}
        </span>
        <span className="text-[var(--muted)]">
          · Showing cached data (stale) · Action buttons disabled
        </span>
      </div>

      <div className="flex items-center space-x-2">
        <span className="px-2 py-0.5 rounded-[var(--radius-control,6px)] bg-[var(--surface)] text-[var(--critical)] border border-[var(--critical)] font-medium text-[11px]">
          OFFLINE
        </span>
        {onManualReconnect && (
          <button
            onClick={onManualReconnect}
            className="px-2.5 py-1 rounded-[var(--radius-control,6px)] bg-[var(--surface)] hover:bg-[var(--canvas)] text-[var(--ink)] border border-[var(--hairline)] font-medium text-xs flex items-center space-x-1.5 transition"
          >
            <RefreshCw className="w-3 h-3 text-[var(--ink)]" />
            <span>Retry Now</span>
          </button>
        )}
      </div>
    </div>
  );
};
