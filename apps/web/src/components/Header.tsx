import React from 'react';
import { SystemStats } from '../types.js';

interface HeaderProps {
  stats: SystemStats | null;
  activeTab: string;
  onTabChange: (tab: string) => void;
  openIncidentsCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  stats,
  activeTab,
  onTabChange,
  openIncidentsCount,
}) => {
  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'devices', label: 'Devices' },
    { id: 'events', label: 'Live Events' },
    { id: 'incidents', label: 'Incidents', badge: openIncidentsCount },
    { id: 'rules', label: 'Rules' },
    { id: 'ops', label: 'Ops' },
  ];

  return (
    <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur sticky top-0 z-30 font-mono">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div
            className="flex items-center space-x-3 cursor-pointer"
            onClick={() => onTabChange('overview')}
          >
            <div className="w-9 h-9 rounded-lg bg-teal-500/20 border border-teal-500/50 flex items-center justify-center font-bold text-teal-400 text-base">
              ⚡
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-semibold text-white tracking-wide text-base">
                  APS Device Ops
                </span>
                <span className="text-[10px] uppercase px-1.5 py-0.5 rounded bg-slate-800 text-teal-400 border border-teal-800/40 font-bold">
                  v1.0
                </span>
              </div>
              <div className="text-[11px] text-slate-400">PostgreSQL Durable Single-Source</div>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="hidden lg:flex items-center space-x-4 text-xs">
            <div className="flex items-center space-x-3 bg-slate-950/80 px-3 py-1.5 rounded-lg border border-slate-800">
              <span className="text-slate-400">Rate:</span>
              <span className="text-teal-400 font-bold">{stats?.events_per_minute ?? 0} ev/m</span>
              <span className="text-slate-700">|</span>
              <span className="text-slate-400">Queue Lag:</span>
              <span className="text-slate-200">
                {stats?.queue_depth_and_lag?.lag_seconds ?? 0}s
              </span>
              <span className="text-slate-700">|</span>
              <span className="text-slate-400">Dead Letters:</span>
              <span
                className={
                  (stats?.failed_events?.failed_count ?? 0) > 0
                    ? 'text-rose-400 font-bold'
                    : 'text-slate-400'
                }
              >
                {stats?.failed_events?.failed_count ?? 0}
              </span>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex space-x-6 text-xs font-semibold border-t border-slate-800/80 overflow-x-auto">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`py-3 px-1 border-b-2 font-medium flex items-center space-x-2 whitespace-nowrap transition ${
                  isActive
                    ? 'border-teal-400 text-teal-300'
                    : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
                }`}
              >
                <span>{tab.label}</span>
                {typeof tab.badge === 'number' && tab.badge > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
