import React, { useState, useMemo } from 'react';
import { usePlatformStore } from '../store/PlatformContext.js';
import { Device, DeviceStatus } from '../types.js';
import { ActionButton } from '../components/ActionButton.js';
import { Sparkline } from '../components/Sparkline.js';
import { formatRelativeTime } from '../utils/incidentGrouping.js';
import { useToast } from '../components/Toast.js';
import {
  Search,
  Filter,
  Key,
  Radio,
  Copy,
  Check,
  AlertTriangle,
  X,
  Cpu,
  LayoutGrid,
  List,
} from 'lucide-react';

interface DevicesPageProps {
  onFilterDeviceEvents: (deviceId: string) => void;
}

export const DevicesPage: React.FC<DevicesPageProps> = ({ onFilterDeviceEvents }) => {
  const { state, rotateDeviceKey } = usePlatformStore();
  const { devices, connection } = state;
  const isOffline = connection.status === 'offline';
  const { showToast } = useToast();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [locationFilter, setLocationFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

  // Key rotation modal state
  const [rotatedKeyModal, setRotatedKeyModal] = useState<{
    deviceId: string;
    rawKey: string;
  } | null>(null);
  const [rotatingId, setRotatingId] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<boolean>(false);

  const devicesList = useMemo(() => Object.values(devices), [devices]);

  const uniqueLocations = useMemo(() => {
    const locs = new Set<string>();
    devicesList.forEach((d) => {
      if (d.location_id) locs.add(d.location_id);
    });
    return Array.from(locs);
  }, [devicesList]);

  const filteredDevices = useMemo(() => {
    return devicesList.filter((d) => {
      const matchesSearch =
        d.name.toLowerCase().includes(search.toLowerCase()) ||
        d.id.toLowerCase().includes(search.toLowerCase());

      const matchesStatus = statusFilter === 'all' || d.status === statusFilter;
      const matchesLocation = locationFilter === 'all' || d.location_id === locationFilter;

      return matchesSearch && matchesStatus && matchesLocation;
    });
  }, [devicesList, search, statusFilter, locationFilter]);

  const handleRotateKey = async (deviceId: string) => {
    if (isOffline) return;
    if (!window.confirm(`Are you sure you want to rotate the access key for device '${deviceId}'?`)) {
      return;
    }

    setRotatingId(deviceId);
    const newKey = await rotateDeviceKey(deviceId);
    setRotatingId(null);

    if (newKey) {
      setCopiedKey(false);
      setRotatedKeyModal({
        deviceId,
        rawKey: newKey,
      });
      showToast('Key rotated', `New key generated for ${deviceId}`);
    } else {
      showToast('Rotation failed', 'Unable to rotate device key', 'error');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2500);
    showToast('Copied to clipboard');
  };

  const getStatusDot = (status: DeviceStatus) => {
    switch (status) {
      case 'online':
        return (
          <span className="inline-flex items-center space-x-1.5 text-xs font-medium text-[var(--healthy)]">
            <span className="w-2 h-2 rounded-full bg-[var(--healthy)]" />
            <span>Online</span>
          </span>
        );
      case 'stale':
        return (
          <span className="inline-flex items-center space-x-1.5 text-xs font-medium text-[var(--warning)]">
            <span className="w-2 h-2 rounded-full bg-[var(--warning)]" />
            <span>Stale</span>
          </span>
        );
      case 'offline':
        return (
          <span className="inline-flex items-center space-x-1.5 text-xs font-medium text-[var(--critical)]">
            <span className="w-2 h-2 rounded-full bg-[var(--critical)]" />
            <span>Offline</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center space-x-1.5 text-xs font-medium text-[var(--muted)]">
            <span className="w-2 h-2 rounded-full bg-[var(--muted)]" />
            <span>Unknown</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-[var(--ink)]">
            Devices
          </h1>
          <p className="text-xs text-[var(--muted)] mt-0.5">
            Fleet connectivity, reporting intervals, and authentication tokens
          </p>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center space-x-1 p-1 rounded-[var(--radius-control,6px)] bg-[var(--surface)] border border-[var(--hairline)] self-start sm:self-auto">
          <button
            onClick={() => setViewMode('table')}
            className={`p-1.5 rounded-[var(--radius-control,6px)] transition ${
              viewMode === 'table'
                ? 'bg-[var(--canvas)] text-[var(--ink)] font-semibold shadow-xs'
                : 'text-[var(--muted)] hover:text-[var(--ink)]'
            }`}
            title="Table view"
            aria-label="Table view"
          >
            <List className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('grid')}
            className={`p-1.5 rounded-[var(--radius-control,6px)] transition ${
              viewMode === 'grid'
                ? 'bg-[var(--canvas)] text-[var(--ink)] font-semibold shadow-xs'
                : 'text-[var(--muted)] hover:text-[var(--ink)]'
            }`}
            title="Grid view"
            aria-label="Grid view"
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-[var(--surface)] border border-[var(--hairline)] rounded-[var(--radius-panel,12px)] p-4 flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm">
        <div className="w-full md:w-80 relative">
          <Search className="w-4 h-4 text-[var(--muted)] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by device name or ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-[var(--radius-control,6px)] bg-[var(--canvas)] border border-[var(--hairline)] text-xs text-[var(--ink)] placeholder-[var(--muted)] focus:outline-none focus:border-[var(--brand)]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto text-xs">
          <div className="flex items-center space-x-1.5 text-[var(--muted)]">
            <Filter className="w-3.5 h-3.5" />
            <span>Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-[var(--canvas)] border border-[var(--hairline)] rounded-[var(--radius-control,6px)] px-2.5 py-1.5 text-[var(--ink)] text-xs focus:outline-none focus:border-[var(--brand)]"
            >
              <option value="all">All ({devicesList.length})</option>
              <option value="online">Online</option>
              <option value="stale">Stale</option>
              <option value="offline">Offline</option>
            </select>
          </div>

          <div className="flex items-center space-x-1.5 text-[var(--muted)]">
            <span>Location:</span>
            <select
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              className="bg-[var(--canvas)] border border-[var(--hairline)] rounded-[var(--radius-control,6px)] px-2.5 py-1.5 text-[var(--ink)] text-xs focus:outline-none focus:border-[var(--brand)]"
            >
              <option value="all">All Locations</option>
              {uniqueLocations.map((loc) => (
                <option key={loc} value={loc}>
                  {loc}
                </option>
              ))}
            </select>
          </div>

          <div className="text-[var(--muted)] text-xs ml-auto">
            Showing <span className="font-semibold text-[var(--ink)]">{filteredDevices.length}</span> devices
          </div>
        </div>
      </div>

      {/* Table View */}
      {viewMode === 'table' ? (
        <div className="bg-[var(--surface)] border border-[var(--hairline)] rounded-[var(--radius-panel,12px)] overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[var(--canvas)] border-b border-[var(--hairline)] text-[var(--muted)] text-[11px] font-medium">
                <tr>
                  <th className="px-5 py-3 font-semibold">Device</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                  <th className="px-5 py-3 font-semibold">Location</th>
                  <th className="px-5 py-3 font-semibold">Last reported</th>
                  <th className="px-5 py-3 font-semibold">Activity</th>
                  <th className="px-5 py-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--hairline)]">
                {filteredDevices.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-12 text-center text-[var(--muted)]">
                      No devices match the specified search or filter criteria.
                    </td>
                  </tr>
                ) : (
                  filteredDevices.map((device) => {
                    const relativeTime = formatRelativeTime(device.last_seen_at);
                    const mockActivity = [2, 4, 3, 5, 4, device.status === 'online' ? 6 : 1];

                    return (
                      <tr key={device.id} className="hover:bg-[var(--canvas)] transition">
                        <td className="px-5 py-3.5">
                          <div className="flex items-center space-x-2.5">
                            <Cpu className="w-4 h-4 text-[var(--muted)] shrink-0" />
                            <div>
                              <div className="font-semibold text-[var(--ink)]">{device.name}</div>
                              <div className="text-[11px] text-[var(--muted)] font-mono select-all">
                                {device.id}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="px-5 py-3.5">{getStatusDot(device.status)}</td>

                        <td className="px-5 py-3.5 text-[var(--ink)]">
                          {device.location_id || <span className="text-[var(--muted)]">Unassigned</span>}
                        </td>

                        <td className="px-5 py-3.5 text-[var(--muted)]">
                          <span title={device.last_seen_at ? new Date(device.last_seen_at).toLocaleString() : ''}>
                            {device.last_seen_at ? relativeTime : 'Never'}
                          </span>
                        </td>

                        <td className="px-5 py-3.5">
                          <Sparkline
                            data={mockActivity}
                            width={54}
                            height={18}
                            color={device.status === 'online' ? 'var(--healthy)' : 'var(--muted)'}
                          />
                        </td>

                        <td className="px-5 py-3.5 text-right space-x-2 whitespace-nowrap">
                          <ActionButton
                            variant="secondary"
                            onClick={() => onFilterDeviceEvents(device.id)}
                            title="Filter live stream for this device"
                          >
                            <Radio className="w-3.5 h-3.5 mr-1" />
                            Events
                          </ActionButton>

                          <ActionButton
                            variant="secondary"
                            isOffline={isOffline}
                            disabled={rotatingId === device.id}
                            onClick={() => handleRotateKey(device.id)}
                            title="Rotate access key"
                          >
                            <Key className="w-3.5 h-3.5 mr-1" />
                            {rotatingId === device.id ? 'Rotating...' : 'Rotate key'}
                          </ActionButton>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Grid View */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDevices.map((device) => {
            const relativeTime = formatRelativeTime(device.last_seen_at);
            const mockActivity = [2, 4, 3, 5, 4, device.status === 'online' ? 6 : 1];

            return (
              <div
                key={device.id}
                className="bg-[var(--surface)] border border-[var(--hairline)] rounded-[var(--radius-panel,12px)] p-4 shadow-sm hover:border-[var(--muted)]/40 transition space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-0.5">
                    <div className="font-semibold text-sm text-[var(--ink)]">{device.name}</div>
                    <div className="text-xs text-[var(--muted)] font-mono">{device.id}</div>
                  </div>
                  {getStatusDot(device.status)}
                </div>

                <div className="flex items-center justify-between text-xs text-[var(--muted)] pt-2 border-t border-[var(--hairline)]">
                  <span>Location: {device.location_id || 'Unassigned'}</span>
                  <span>{device.last_seen_at ? relativeTime : 'Never'}</span>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <Sparkline
                    data={mockActivity}
                    width={64}
                    height={20}
                    color={device.status === 'online' ? 'var(--healthy)' : 'var(--muted)'}
                  />

                  <div className="flex items-center space-x-1.5">
                    <ActionButton
                      variant="secondary"
                      onClick={() => onFilterDeviceEvents(device.id)}
                    >
                      Events
                    </ActionButton>

                    <ActionButton
                      variant="secondary"
                      isOffline={isOffline}
                      disabled={rotatingId === device.id}
                      onClick={() => handleRotateKey(device.id)}
                    >
                      Rotate key
                    </ActionButton>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Key Rotation Dialog */}
      {rotatedKeyModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[var(--surface)] border border-[var(--hairline)] rounded-[var(--radius-panel,12px)] max-w-md w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-[var(--hairline)] pb-3">
              <div className="flex items-center space-x-2 text-[var(--ink)] font-semibold">
                <Key className="w-4 h-4 text-[var(--brand)]" />
                <span>New Access Key Generated</span>
              </div>
              <button
                onClick={() => setRotatedKeyModal(null)}
                className="text-[var(--muted)] hover:text-[var(--ink)] p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-[var(--warning-bg)] border border-[var(--warning)]/30 rounded-[var(--radius-control,6px)] p-3 text-xs text-[var(--warning)] flex items-start space-x-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold block">Copy and store this token now</span>
                The raw key is securely hashed in storage and cannot be retrieved again.
              </div>
            </div>

            <div className="space-y-1.5 text-xs">
              <span className="text-[var(--muted)]">Device:</span>
              <div className="text-[var(--ink)] font-mono font-medium">{rotatedKeyModal.deviceId}</div>
            </div>

            <div className="space-y-1.5 text-xs">
              <span className="text-[var(--muted)]">New token:</span>
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  readOnly
                  value={rotatedKeyModal.rawKey}
                  className="w-full px-3 py-2 rounded-[var(--radius-control,6px)] bg-[var(--canvas)] border border-[var(--hairline)] text-[var(--ink)] select-all font-mono text-xs outline-none"
                />
                <button
                  onClick={() => copyToClipboard(rotatedKeyModal.rawKey)}
                  className="px-3 py-2 rounded-[var(--radius-control,6px)] bg-[var(--brand)] hover:bg-[var(--brand-hover)] text-white font-medium text-xs flex items-center space-x-1 transition shrink-0"
                >
                  {copiedKey ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedKey ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>

            <div className="pt-3 border-t border-[var(--hairline)] flex justify-end">
              <button
                onClick={() => setRotatedKeyModal(null)}
                className="px-4 py-1.5 rounded-[var(--radius-control,6px)] bg-[var(--brand)] hover:bg-[var(--brand-hover)] text-white font-medium text-xs transition"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
