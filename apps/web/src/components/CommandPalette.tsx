import React, { useState, useEffect, useRef } from 'react';
import { Search, Layers, Cpu, Radio, ShieldAlert, Sliders, Terminal, Sun, Moon, ArrowRight, X } from 'lucide-react';
import { usePlatformStore } from '../store/PlatformContext.js';
import { useTheme } from '../store/ThemeContext.js';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateTab: (tab: string) => void;
  onSelectIncident: (id: string) => void;
  onFilterDevice: (deviceId: string) => void;
}

interface PaletteItem {
  id: string;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  action: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onNavigateTab,
  onSelectIncident,
  onFilterDevice,
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const { state } = usePlatformStore();
  const { devices, incidents } = state;
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const navItems: PaletteItem[] = [
    { id: 'overview', title: 'Go to Overview', icon: Layers, action: () => onNavigateTab('overview') },
    { id: 'devices', title: 'Go to Devices', icon: Cpu, action: () => onNavigateTab('devices') },
    { id: 'events', title: 'Go to Live Events', icon: Radio, action: () => onNavigateTab('events') },
    { id: 'incidents', title: 'Go to Incidents', icon: ShieldAlert, action: () => onNavigateTab('incidents') },
    { id: 'rules', title: 'Go to Rules', icon: Sliders, action: () => onNavigateTab('rules') },
    { id: 'ops', title: 'Go to Operations & Diagnostics', icon: Terminal, action: () => onNavigateTab('ops') },
    { id: 'theme', title: `Switch to ${theme === 'dark' ? 'Light' : 'Dark'} theme`, icon: theme === 'dark' ? Sun : Moon, action: () => toggleTheme() },
  ];

  const incidentItems: PaletteItem[] = Object.values(incidents)
    .filter((i) => i.status === 'open' || i.status === 'acknowledged')
    .slice(0, 5)
    .map((inc) => ({
      id: `inc-${inc.id}`,
      title: `${inc.rule_name || 'Incident'} (${inc.device_name || inc.device_id})`,
      icon: ShieldAlert,
      badge: inc.severity,
      action: () => {
        onNavigateTab('incidents');
        onSelectIncident(inc.id);
      },
    }));

  const deviceItems: PaletteItem[] = Object.values(devices)
    .slice(0, 5)
    .map((dev) => ({
      id: `dev-${dev.id}`,
      title: `${dev.name} (${dev.id})`,
      icon: Cpu,
      badge: dev.status,
      action: () => {
        onFilterDevice(dev.id);
      },
    }));

  const allItems: PaletteItem[] = [...navItems, ...incidentItems, ...deviceItems];

  const filteredItems = query.trim()
    ? allItems.filter((item) => item.title.toLowerCase().includes(query.toLowerCase()))
    : allItems;

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, filteredItems.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredItems.length) % Math.max(1, filteredItems.length));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredItems[selectedIndex]) {
        filteredItems[selectedIndex].action();
        onClose();
      }
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-start justify-center pt-20 px-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-[var(--surface)] border border-[var(--hairline)] rounded-[var(--radius-panel,12px)] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-100"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center px-4 py-3 border-b border-[var(--hairline)]">
          <Search className="w-4 h-4 text-[var(--muted)] mr-3 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Type a command, page name, or device..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full bg-transparent text-sm text-[var(--ink)] placeholder-[var(--muted)] outline-none"
          />
          <button
            onClick={onClose}
            className="p-1 rounded-[var(--radius-control,6px)] text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--canvas)]"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="max-h-80 overflow-y-auto p-2 space-y-0.5">
          {filteredItems.length === 0 ? (
            <div className="py-8 text-center text-xs text-[var(--muted)]">
              No matching commands found.
            </div>
          ) : (
            filteredItems.map((item, idx) => {
              const Icon = item.icon;
              const isSelected = idx === selectedIndex;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    item.action();
                    onClose();
                  }}
                  className={`w-full text-left px-3 py-2 rounded-[var(--radius-control,6px)] flex items-center justify-between text-xs transition ${
                    isSelected
                      ? 'bg-[var(--brand-soft)] text-[var(--brand)] font-medium'
                      : 'text-[var(--ink)] hover:bg-[var(--canvas)]'
                  }`}
                >
                  <div className="flex items-center space-x-2.5 truncate">
                    <Icon className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-[var(--brand)]' : 'text-[var(--muted)]'}`} />
                    <span className="truncate">{item.title}</span>
                  </div>
                  {item.badge && (
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-mono capitalize bg-[var(--hairline)] text-[var(--muted)] shrink-0">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })
          )}
        </div>

        <div className="px-4 py-2 bg-[var(--canvas)] border-t border-[var(--hairline)] flex items-center justify-between text-[11px] text-[var(--muted)] font-mono">
          <span>Use ↑↓ to navigate</span>
          <span>↵ select · esc close</span>
        </div>
      </div>
    </div>
  );
};
