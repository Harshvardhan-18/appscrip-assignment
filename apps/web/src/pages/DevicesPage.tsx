import React, { useState, useMemo } from 'react';
import { usePlatformStore } from '../store/PlatformContext.js';
import { Device, DeviceStatus } from '../types.js';
import { ActionButton } from '../components/ActionButton.js';

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
      setRotatedKeyModal({
        deviceId,
        rawKey: newKey,
      });
    } else {
      alert('Failed to rotate device key');
    }
  };

  const getStatusBadge = (status: DeviceStatus) => {
    switch (status) {
      case 'online':
        return (
          <span className="inline-flex items-center space-x-1.5 px-2 py-0.5 rounded-full text-xs font-mono font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            <span>online</span>
          </span>
        );
      case 'stale':
        return (
          <span className="inline-flex items-center space-x-1.5 px-2 py-0.5 rounded-full text-xs font-mono font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
            <span>stale</span>
          </span>
        );
      case 'offline':
        return (
          <span className="inline-flex items-center space-x-1.5 px-2 py-0.5 rounded-full text-xs font-mono font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span>
            <span>offline</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center space-x-1.5 px-2 py-0.5 rounded-full text-xs font-mono font-semibold bg-slate-800 text-slate-300 border border-slate-700">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
            <span>unknown</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Search and Filters Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
        <div className="flex-1 w-full flex items-center space-x-3">
          <input
            type="text"
            placeholder="Search by device name or ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full max-w-sm px-3.5 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-500 text-xs font-mono focus:outline-none focus:border-teal-500 transition"
          />
        </div>

        <div className="flex items-center space-x-3 w-full sm:w-auto">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 text-xs font-mono focus:outline-none focus:border-teal-500"
          >
            <option value="all">All Statuses</option>
            <option value="online">Online</option>
            <option value="stale">Stale</option>
            <option value="offline">Offline</option>
            <option value="unknown">Unknown</option>
          </select>

          {/* Location Filter */}
          <select
            value={locationFilter}
            onChange={(e) => setLocationFilter(e.target.value)}
            className="px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 text-xs font-mono focus:outline-none focus:border-teal-500"
          >
            <option value="all">All Locations</option>
            {uniqueLocations.map((loc) => (
              <option key={loc} value={loc}>
                {loc}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Devices Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-950/60 text-slate-400 border-b border-slate-800 text-[11px] uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3 font-semibold">Device</th>
                <th className="px-5 py-3 font-semibold">Status</th>
                <th className="px-5 py-3 font-semibold">Location</th>
                <th className="px-5 py-3 font-semibold">Monotonic Seq</th>
                <th className="px-5 py-3 font-semibold">Last Seen</th>
                <th className="px-5 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredDevices.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-slate-500">
                    No devices match the active filters.
                  </td>
                </tr>
              ) : (
                filteredDevices.map((device: Device) => (
                  <tr key={device.id} className="hover:bg-slate-800/40 transition">
                    <td className="px-5 py-3.5">
                      <div className="font-bold text-white text-sm">{device.name}</div>
                      <div className="text-[11px] text-slate-400">{device.id}</div>
                    </td>
                    <td className="px-5 py-3.5">{getStatusBadge(device.status)}</td>
                    <td className="px-5 py-3.5">
                      <span className="text-slate-300">
                        {device.location_name || device.location_id}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-teal-400 font-bold">#{device.last_seq}</span>
                    </td>
                    <td className="px-5 py-3.5 text-slate-300">
                      {device.last_seen_at ? (
                        <div>
                          <div>{new Date(device.last_seen_at).toLocaleTimeString()}</div>
                          <div className="text-[10px] text-slate-500">
                            {new Date(device.last_seen_at).toLocaleDateString()}
                          </div>
                        </div>
                      ) : (
                        <span className="text-slate-500">Never</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-right space-x-2">
                      <button
                        onClick={() => onFilterDeviceEvents(device.id)}
                        className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs transition"
                      >
                        Events
                      </button>

                      <ActionButton
                        isOffline={isOffline}
                        variant="secondary"
                        disabled={rotatingId === device.id}
                        onClick={() => handleRotateKey(device.id)}
                      >
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

      {/* Rotated Key Modal */}
      {rotatedKeyModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full p-6 shadow-2xl space-y-4 font-mono">
            <h3 className="text-base font-bold text-white">Device Key Rotated Successfully</h3>
            <p className="text-xs text-amber-300 bg-amber-950/60 p-3 rounded-lg border border-amber-800/80">
              ⚠️ Copy this raw key now. It is hashed in PostgreSQL and will not be displayed again.
            </p>

            <div className="space-y-1">
              <label className="text-[11px] text-slate-400">Device ID</label>
              <div className="text-sm font-bold text-white">{rotatedKeyModal.deviceId}</div>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] text-slate-400">New Bearer Key</label>
              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-teal-400 break-all select-all text-xs font-mono font-semibold">
                {rotatedKeyModal.rawKey}
              </div>
            </div>

            <div className="pt-2 flex justify-end space-x-3">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(rotatedKeyModal.rawKey);
                  alert('Bearer key copied to clipboard!');
                }}
                className="px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold"
              >
                Copy Key
              </button>
              <button
                onClick={() => setRotatedKeyModal(null)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
