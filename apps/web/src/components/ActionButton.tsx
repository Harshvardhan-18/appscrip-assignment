import React, { useState } from 'react';

interface ActionButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isOffline?: boolean;
  offlineTooltip?: string;
  variant?: 'primary' | 'secondary' | 'danger' | 'warning' | 'success';
}

export const ActionButton: React.FC<ActionButtonProps> = ({
  isOffline = false,
  offlineTooltip = 'Actions are disabled while offline',
  disabled = false,
  variant = 'primary',
  children,
  className = '',
  title,
  ...props
}) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const effectivelyDisabled = disabled || isOffline;

  const variantStyles = {
    primary:
      'bg-zinc-100 hover:bg-zinc-200 text-zinc-950 border-transparent shadow-sm active:scale-[0.98]',
    secondary:
      'bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border-zinc-800 hover:border-zinc-700 active:scale-[0.98]',
    danger:
      'bg-zinc-900 hover:bg-red-950/50 text-red-400 border-red-900/50 hover:border-red-800 active:scale-[0.98]',
    warning:
      'bg-zinc-900 hover:bg-amber-950/50 text-amber-300 border-amber-900/50 hover:border-amber-800 active:scale-[0.98]',
    success:
      'bg-zinc-900 hover:bg-emerald-950/50 text-emerald-400 border-emerald-900/50 hover:border-emerald-800 active:scale-[0.98]',
  }[variant];

  return (
    <div
      className="relative inline-block"
      onMouseEnter={() => isOffline && setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <button
        {...props}
        disabled={effectivelyDisabled}
        title={isOffline ? offlineTooltip : title}
        className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-all duration-150 inline-flex items-center justify-center space-x-1.5 focus:outline-none focus:ring-1 focus:ring-zinc-400 ${variantStyles} ${
          effectivelyDisabled ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''
        } ${className}`}
      >
        {children}
      </button>

      {isOffline && showTooltip && (
        <div
          role="tooltip"
          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1 text-[11px] font-sans font-medium text-zinc-200 bg-zinc-900 border border-zinc-700 rounded-md shadow-xl whitespace-nowrap z-50 pointer-events-none"
        >
          {offlineTooltip}
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-zinc-900"></div>
        </div>
      )}
    </div>
  );
};
