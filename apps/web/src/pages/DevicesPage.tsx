import React, { useState, useMemo } from 'react';
import { usePlatformStore } from '../store/PlatformContext.js';
import { Device, DeviceStatus } from '../types.js';
import { ActionButton } from '../components/ActionButton.js';
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
} from 'lucide-react';

interface DevicesPageProps {
  onFilterDeviceEvents: (deviceId: string) => void;
}

export const DevicesPage: React.FC<DevicesPageProps> = ({ onFilterDeviceEvents }) => {
  const { state, rotateDeviceKey } = usePlatformStore();
  const { devices, connection } = state;
  const isOffline = connection.status === 'offline';

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [locationFilter, setLocationFilter] = useState<string>('all');

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
    if (
      !window.confirm(`Are you sure you want to rotate the Bearer key for device '${deviceId}'?`)
    ) {
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
    } else {
      alert('Failed to rotate device key');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2500);
  };

  const getStatusBadge = (status: DeviceStatus) => {
    switch (status) {
      case 'online':
        return (
          <span className="inline-flex items-center space-x-1.5 px-2 py-0.5 rounded text-xs font-mono font-medium bg-zinc-900 text-emerald-400 border border-emerald-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            <span>online</span>
          </span>
        );
      case 'stale':
        return (
          <span className="inline-flex items-center space-x-1.5 px-2 py-0.5 rounded text-xs font-mono font-medium bg-zinc-900 text-amber-300 border border-amber-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
            <span>stale</span>
          </span>
        );
      case 'offline':
        return (
          <span className="inline-flex items-center space-x-1.5 px-2 py-0.5 rounded text-xs font-mono font-medium bg-zinc-900 text-red-400 border border-red-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-red-400"></span>
            <span>offline</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center space-x-1.5 px-2 py-0.5 rounded text-xs font-mono font-medium bg-zinc-900 text-zinc-400 border border-zinc-700">
            <span className="w-1.5 h-1.5 rounded-full bg-zinc-400"></span>
            <span>unknown</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Search and Filters Toolbar */}
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="w-full md:w-80 relative">
          <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by device name or ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-md bg-zinc-950 border border-zinc-800 text-zinc-100 placeholder-zinc-500 text-xs font-mono focus:outline-none focus:border-zinc-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto text-xs font-mono">
          <div className="flex items-center space-x-1.5 text-zinc-400">
            <Filter className="w-3.5 h-3.5" />
            <span className="text-zinc-500">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-zinc-950 border border-zinc-800 rounded-md px-2.5 py-1.5 text-zinc-200 text-xs focus:outline-none focus:border-zinc-500"
            >
              <option value="all">All ({devicesList.length})</option>
              <option value="online">Online</option>
              <option value="stale">Stale</option>
              <option value="offline">Offline</option>
            </select>
          </div>

          <div className="flex items-center space-x-1.5 text-zinc-400">
            <span className="text-zinc-500">Location:</span>
            <select
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              className="bg-zinc-950 border border-zinc-800 rounded-md px-2.5 py-1.5 text-zinc-200 text-xs focus:outline-none focus:border-zinc-500"
            >
              <option value="all">All Locations</option>
              {uniqueLocations.map((loc) => (
                <option key={loc} value={loc}>
                  {loc}
                </option>
              ))}
            </select>
          </div>

          <div className="text-zinc-500 text-xs ml-auto">
            Showing <span className="text-zinc-200 font-semibold">{filteredDevices.length}</span> devices
          </div>
        </div>
      </div>

      {/* Devices Table */}
      <div className="bg-zinc-900/30 border border-zinc-800 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-zinc-900/70 border-b border-zinc-800 text-zinc-400 text-[11px] uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3 font-semibold">Device</th>
                <th className="px-5 py-3 font-semibold">Status</th>
                <th className="px-5 py-3 font-semibold">Location</th>
                <th className="px-5 py-3 font-semibold">Last Reported</th>
                <th className="px-5 py-3 font-semibold">Seq</th>
                <th className="px-5 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-850">
              {filteredDevices.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-zinc-500">
                    No devices match the specified search or filter criteria.
                  </td>
                </tr>
              ) : (
                filteredDevices.map((device) => (
                  <tr key={device.id} className="hover:bg-zinc-900/50 transition">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center space-x-2.5">
                        <Cpu className="w-4 h-4 text-zinc-500 shrink-0" />
                        <div>
                          <div className="font-semibold text-zinc-100">{device.name}</div>
                          <div className="text-[11px] text-zinc-500 select-all">{device.id}</div>
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-3.5">{getStatusBadge(device.status)}</td>

                    <td className="px-5 py-3.5">
                      <span className="text-zinc-300">
                        {device.location_id || <span className="text-zinc-600">Unassigned</span>}
                      </span>
                    </td>

                    <td className="px-5 py-3.5 text-zinc-400">
                      {device.last_seen_at ? (
                        <span>
                          {new Date(device.last_seen_at).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit',
                          })}
                        </span>
                      ) : (
                        <span className="text-zinc-600">Never</span>
                      )}
                    </td>

                    <td className="px-5 py-3.5 text-zinc-300">
                      #{device.last_seq ?? 0}
                    </td>

                    <td className="px-5 py-3.5 text-right space-x-2">
                      <ActionButton
                        variant="secondary"
                        onClick={() => onFilterDeviceEvents(device.id)}
                        title="Filter live stream by this device"
                      >
                        <Radio className="w-3.5 h-3.5 mr-1" />
                        Events
                      </ActionButton>

                      <ActionButton
                        variant="secondary"
                        isOffline={isOffline}
                        disabled={rotatingId === device.id}
                        onClick={() => handleRotateKey(device.id)}
                        title="Rotate Bearer API Key"
                      >
                        <Key className="w-3.5 h-3.5 mr-1" />
                        {rotatingId === device.id ? 'Rotating...' : 'Rotate Key'}
                      </ActionButton>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Rotated Key Modal Dialog */}
      {rotatedKeyModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center space-x-2 text-zinc-100 font-semibold">
                <Key className="w-4 h-4 text-zinc-100" />
                <span>New Bearer Key Generated</span>
              </div>
              <button
                onClick={() => setRotatedKeyModal(null)}
                className="text-zinc-500 hover:text-zinc-300 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-amber-950/40 border border-amber-900/60 rounded-md p-3 text-xs text-amber-200 flex items-start space-x-2 font-mono">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold block">Store this key immediately!</span>
                The raw Bearer token is salted and hashed (SHA-256) in PostgreSQL and will never be shown again.
              </div>
            </div>

            <div className="space-y-1.5 font-mono text-xs">
              <span className="text-zinc-400">Device ID:</span>
              <div className="text-zinc-200 font-semibold">{rotatedKeyModal.deviceId}</div>
            </div>

            <div className="space-y-1.5 font-mono text-xs">
              <span className="text-zinc-400">New Bearer Token:</span>
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  readOnly
                  value={rotatedKeyModal.rawKey}
                  className="w-full px-3 py-2 rounded bg-zinc-950 border border-zinc-800 text-zinc-100 select-all font-mono text-xs"
                />
                <button
                  onClick={() => copyToClipboard(rotatedKeyModal.rawKey)}
                  className="px-3 py-2 rounded bg-zinc-100 hover:bg-zinc-200 text-zinc-950 font-medium text-xs flex items-center space-x-1 transition shrink-0"
                >
                  {copiedKey ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedKey ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>

            <div className="pt-3 border-t border-zinc-800 flex justify-end">
              <button
                onClick={() => setRotatedKeyModal(null)}
                className="px-4 py-1.5 rounded bg-zinc-100 hover:bg-zinc-200 text-zinc-950 font-medium text-xs transition"
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
