import React, { useState } from 'react';
import { ConnectionState } from '../types.js';

interface LiveIndicatorProps {
  connection: ConnectionState;
  onReconnect?: () => void;
  className?: string;
}

export const LiveIndicator: React.FC<LiveIndicatorProps> = ({
  connection,
  onReconnect,
  className = '',
}) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const { status, lastSeq, offlineSince } = connection;

  const dotColor = {
    connected: 'bg-[var(--healthy)]',
    reconnecting: 'bg-[var(--warning)] animate-pulse',
    offline: 'bg-[var(--critical)]',
  }[status];

  const statusLabel = {
    connected: 'Live',
    reconnecting: 'Reconnecting',
    offline: 'Offline',
  }[status];

  return (
    <div
      data-testid="live-indicator"
      data-status={status}
      className={`relative inline-flex items-center ${className}`}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <button
        type="button"
        onClick={() => status !== 'connected' && onReconnect && onReconnect()}
        className="flex items-center space-x-2 px-2.5 py-1.5 rounded-[var(--radius-control,6px)] hover:bg-[var(--hairline)] transition text-xs font-medium text-[var(--muted)] hover:text-[var(--ink)] focus:outline-none"
        aria-label={`Connection status: ${statusLabel}`}
      >
        <span className="relative flex h-2 w-2">
          {status === 'connected' && (
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--healthy)] opacity-75" />
          )}
          <span className={`relative inline-flex rounded-full h-2 w-2 ${dotColor}`} />
        </span>
        <span className="text-xs">{statusLabel}</span>
      </button>

      {/* Discreet status popover */}
      {showTooltip && (
        <div
          role="tooltip"
          className="absolute bottom-full left-0 mb-2 p-2.5 rounded-[var(--radius-panel,12px)] bg-[var(--surface)] border border-[var(--hairline)] text-xs shadow-md z-50 whitespace-nowrap font-mono space-y-1"
        >
          <div className="flex items-center space-x-2 text-[var(--ink)] font-semibold font-sans">
            <span className={`h-1.5 w-1.5 rounded-full ${dotColor}`} />
            <span>Real-time Stream: {statusLabel}</span>
          </div>
          <div className="text-[11px] text-[var(--muted)]">
            Sequence: <span className="text-[var(--ink)]">#{lastSeq}</span>
          </div>
          {status === 'offline' && offlineSince && (
            <div className="text-[11px] text-[var(--critical)] font-sans">
              Disconnected at {new Date(offlineSince).toLocaleTimeString()}
            </div>
          )}
          {status !== 'connected' && onReconnect && (
            <div className="pt-1 border-t border-[var(--hairline)]">
              <span className="text-[var(--brand)] font-sans font-medium cursor-pointer">
                Click to reconnect
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
