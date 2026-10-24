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
    primary: 'bg-teal-600 hover:bg-teal-500 text-white border-teal-500',
    secondary: 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700',
    danger: 'bg-rose-700 hover:bg-rose-600 text-white border-rose-600',
    warning: 'bg-amber-600 hover:bg-amber-500 text-white border-amber-500',
    success: 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-500',
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
        className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition flex items-center justify-center space-x-1.5 ${variantStyles} ${
          effectivelyDisabled ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''
        } ${className}`}
      >
        {children}
      </button>

      {isOffline && showTooltip && (
        <div
          role="tooltip"
          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1 text-[11px] font-sans font-medium text-slate-100 bg-slate-900 border border-slate-700 rounded-md shadow-xl whitespace-nowrap z-50 pointer-events-none"
        >
          {offlineTooltip}
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900"></div>
        </div>
      )}
    </div>
  );
};
