import React, { useState, useMemo } from 'react';
import { usePlatformStore } from '../store/PlatformContext.js';
import { Rule, RuleType, IncidentSeverity } from '../types.js';
import { ActionButton } from '../components/ActionButton.js';
import {
  Sliders,
  Plus,
  Trash2,
  X,
  Layers,
  Clock,
  ShieldAlert,
  SlidersHorizontal,
} from 'lucide-react';

export const RulesPage: React.FC = () => {
  const { state, createRule, deleteRule, toggleRuleEnabled } = usePlatformStore();
  const { rules, devices, connection } = state;
  const isOffline = connection.status === 'offline';

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [ruleType, setRuleType] = useState<RuleType>('threshold');
  const [name, setName] = useState('');
  const [severity, setSeverity] = useState<IncidentSeverity>('critical');
  const [scopeType, setScopeType] = useState<'all' | 'location' | 'device'>('all');
  const [scopeValue, setScopeValue] = useState('');
  const [cooldown, setCooldown] = useState<number>(60);

  // Dynamic Rule Config State
  const [threshField, setThreshField] = useState('temperature');
  const [threshOp, setThreshOp] = useState<'>' | '>=' | '<' | '<=' | '==' | '!='>('>');
  const [threshValue, setThreshValue] = useState<number>(80);
  const [absenceTimeout, setAbsenceTimeout] = useState<number>(60);
  const [eventTypeVal, setEventTypeVal] = useState('device.error');

  const rulesList = useMemo(() => Object.values(rules), [rules]);

  const resetForm = () => {
    setName('');
    setRuleType('threshold');
    setSeverity('critical');
    setScopeType('all');
    setScopeValue('');
    setCooldown(60);
    setThreshField('temperature');
    setThreshOp('>');
    setThreshValue(80);
    setAbsenceTimeout(60);
    setEventTypeVal('device.error');
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isOffline) return;

    if (!name.trim()) {
      alert('Please provide a rule name');
      return;
    }

    let config: any = {};
    if (ruleType === 'threshold') {
      config = {
        field: threshField.trim(),
        operator: threshOp,
        value: Number(threshValue),
      };
    } else if (ruleType === 'absence') {
      config = {
        timeout_seconds: Number(absenceTimeout),
      };
    } else if (ruleType === 'event_type') {
      config = {
        event_type: eventTypeVal.trim(),
      };
    }

    const payload = {
      name: name.trim(),
      type: ruleType,
      rule_type: ruleType,
      config,
      scope: {
        type: scopeType,
        value: scopeType === 'all' ? undefined : scopeValue.trim(),
      },
      scope_type: scopeType,
      scope_value: scopeType === 'all' ? undefined : scopeValue.trim(),
      severity,
      enabled: true,
      cooldown: Number(cooldown),
    };

    setSubmitting(true);
    const success = await createRule(payload);
    setSubmitting(false);

    if (success) {
      setIsModalOpen(false);
      resetForm();
    }
  };

  const handleDelete = async (id: string, ruleName: string) => {
    if (isOffline) return;
    if (window.confirm(`Are you sure you want to delete rule '${ruleName}'?`)) {
      await deleteRule(id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header & New Rule Button */}
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-zinc-100 tracking-tight">Rules Engine</h2>
          <p className="text-xs text-zinc-400 mt-1 font-mono">
            Deterministic evaluation pipelines for telemetry thresholds, device absence, and event types
          </p>
        </div>

        <ActionButton
          isOffline={isOffline}
          variant="primary"
          onClick={() => {
            resetForm();
            setIsModalOpen(true);
          }}
        >
          <Plus className="w-3.5 h-3.5 mr-1" />
          <span>Create New Rule</span>
        </ActionButton>
      </div>

      {/* Rules Table */}
      <div className="bg-zinc-900/30 border border-zinc-800 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-zinc-900/70 text-zinc-400 border-b border-zinc-800 text-[11px] uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3 font-semibold">Rule Name</th>
                <th className="px-5 py-3 font-semibold">Type</th>
                <th className="px-5 py-3 font-semibold">Condition Config</th>
                <th className="px-5 py-3 font-semibold">Scope</th>
                <th className="px-5 py-3 font-semibold">Severity</th>
                <th className="px-5 py-3 font-semibold">State</th>
                <th className="px-5 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-850">
              {rulesList.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-zinc-500">
                    No rules configured yet. Click 'Create New Rule' to add one.
                  </td>
                </tr>
              ) : (
                rulesList.map((rule: Rule) => (
                  <tr key={rule.id} className="hover:bg-zinc-900/50 transition">
                    <td className="px-5 py-3.5">
                      <div className="font-semibold text-zinc-100">{rule.name}</div>
                      <div className="text-[10px] text-zinc-500 font-mono">{rule.id}</div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="px-2 py-0.5 rounded text-[10px] font-medium uppercase bg-zinc-800 text-zinc-300 border border-zinc-700/60">
                        {rule.rule_type || rule.type}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-zinc-300">
                      {rule.rule_type === 'threshold' && (
                        <span>
                          {rule.config?.field} {rule.config?.operator} {rule.config?.value}
                        </span>
                      )}
                      {rule.rule_type === 'absence' && (
                        <span>Silence &gt; {rule.config?.timeout_seconds}s</span>
                      )}
                      {rule.rule_type === 'event_type' && (
                        <span>type == &quot;{rule.config?.event_type}&quot;</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-zinc-300 uppercase text-[11px]">
                        {rule.scope_type || rule.scope?.type || 'all'}
                        {rule.scope_value ? `: ${rule.scope_value}` : ''}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase border ${
                          rule.severity === 'critical'
                            ? 'bg-red-950/60 text-red-300 border-red-800/60'
                            : rule.severity === 'warning'
                              ? 'bg-amber-950/60 text-amber-300 border-amber-800/60'
                              : 'bg-zinc-800 text-zinc-300 border-zinc-700'
                        }`}
                      >
                        {rule.severity}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <label className="relative inline-flex items-center cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={rule.enabled}
                          disabled={isOffline}
                          onChange={(e) => toggleRuleEnabled(rule.id, e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-8 h-4 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-zinc-300 after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-zinc-200 peer-checked:after:bg-zinc-950"></div>
                        <span className="ml-2 text-[10px] text-zinc-400 font-mono">
                          {rule.enabled ? 'ENABLED' : 'MUTED'}
                        </span>
                      </label>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <ActionButton
                        isOffline={isOffline}
                        variant="danger"
                        onClick={() => handleDelete(rule.id, rule.name)}
                      >
                        <Trash2 className="w-3.5 h-3.5 mr-1" />
                        Delete
                      </ActionButton>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Rule Modal Form */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg max-w-lg w-full p-6 shadow-2xl space-y-5 font-mono text-xs animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="text-base font-semibold text-zinc-100">Create Detection Rule</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-zinc-500 hover:text-zinc-300 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              {/* Rule Name */}
              <div className="space-y-1">
                <label className="text-zinc-400 font-medium">Rule Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Engine High Temperature Alarm"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 rounded-md bg-zinc-950 border border-zinc-800 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-zinc-500"
                />
              </div>

              {/* Rule Type Selector */}
              <div className="space-y-1">
                <label className="text-zinc-400 font-medium">Rule Type *</label>
                <select
                  value={ruleType}
                  onChange={(e) => setRuleType(e.target.value as RuleType)}
                  className="w-full px-3 py-2 rounded-md bg-zinc-950 border border-zinc-800 text-zinc-200 focus:outline-none focus:border-zinc-500"
                >
                  <option value="threshold">Threshold (Telemetry payload value &gt; N)</option>
                  <option value="absence">Absence (Device silence &gt; N seconds)</option>
                  <option value="event_type">Event Type (Exact match on type)</option>
                </select>
              </div>

              {/* Dynamic Form per Rule Type */}
              {ruleType === 'threshold' && (
                <div className="p-3 bg-zinc-950 rounded-md border border-zinc-800 space-y-3">
                  <span className="font-semibold text-zinc-200 block">Threshold Condition</span>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="text-[10px] text-zinc-500">Field</label>
                      <input
                        type="text"
                        required
                        value={threshField}
                        onChange={(e) => setThreshField(e.target.value)}
                        placeholder="temperature"
                        className="w-full px-2 py-1.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-100"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-zinc-500">Operator</label>
                      <select
                        value={threshOp}
                        onChange={(e) => setThreshOp(e.target.value as any)}
                        className="w-full px-2 py-1.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-200"
                      >
                        <option value=">">&gt;</option>
                        <option value=">=">&gt;=</option>
                        <option value="<">&lt;</option>
                        <option value="<=">&lt;=</option>
                        <option value="==">==</option>
                        <option value="!=">!=</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] text-zinc-500">Threshold Value</label>
                      <input
                        type="number"
                        step="any"
                        required
                        value={threshValue}
                        onChange={(e) => setThreshValue(Number(e.target.value))}
                        className="w-full px-2 py-1.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-100"
                      />
                    </div>
                  </div>
                </div>
              )}

              {ruleType === 'absence' && (
                <div className="p-3 bg-zinc-950 rounded-md border border-zinc-800 space-y-2">
                  <span className="font-semibold text-zinc-200 block">Absence Detection</span>
                  <div>
                    <label className="text-[10px] text-zinc-500">
                      Timeout in Seconds (Device silent for &gt; N)
                    </label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={absenceTimeout}
                      onChange={(e) => setAbsenceTimeout(Number(e.target.value))}
                      className="w-full px-3 py-1.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-100"
                    />
                  </div>
                </div>
              )}

              {ruleType === 'event_type' && (
                <div className="p-3 bg-zinc-950 rounded-md border border-zinc-800 space-y-2">
                  <span className="font-semibold text-zinc-200 block">Event Type Match</span>
                  <div>
                    <label className="text-[10px] text-zinc-500">Target Event Type</label>
                    <input
                      type="text"
                      required
                      value={eventTypeVal}
                      onChange={(e) => setEventTypeVal(e.target.value)}
                      placeholder="e.g. device.error, tamper"
                      className="w-full px-3 py-1.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-100"
                    />
                  </div>
                </div>
              )}

              {/* Scope & Severity */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-zinc-400 font-medium">Scope</label>
                  <select
                    value={scopeType}
                    onChange={(e) => setScopeType(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-md bg-zinc-950 border border-zinc-800 text-zinc-200"
                  >
                    <option value="all">All Devices (Global)</option>
                    <option value="location">Specific Location</option>
                    <option value="device">Specific Device</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-zinc-400 font-medium">Severity</label>
                  <select
                    value={severity}
                    onChange={(e) => setSeverity(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-md bg-zinc-950 border border-zinc-800 text-zinc-200"
                  >
                    <option value="critical">Critical</option>
                    <option value="warning">Warning</option>
                    <option value="info">Info</option>
                  </select>
                </div>
              </div>

              {scopeType !== 'all' && (
                <div className="space-y-1">
                  <label className="text-zinc-400 font-medium">
                    {scopeType === 'location' ? 'Location ID' : 'Device ID'}
                  </label>
                  {scopeType === 'device' ? (
                    <select
                      value={scopeValue}
                      onChange={(e) => setScopeValue(e.target.value)}
                      className="w-full px-3 py-2 rounded-md bg-zinc-950 border border-zinc-800 text-zinc-200"
                    >
                      <option value="">Select Device</option>
                      {Object.values(devices).map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name} ({d.id})
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      placeholder="e.g. loc-warehouse-1"
                      value={scopeValue}
                      onChange={(e) => setScopeValue(e.target.value)}
                      className="w-full px-3 py-2 rounded-md bg-zinc-950 border border-zinc-800 text-zinc-100"
                    />
                  )}
                </div>
              )}

              {/* Cooldown */}
              <div className="space-y-1">
                <label className="text-zinc-400 font-medium">Cooldown (Seconds)</label>
                <input
                  type="number"
                  min="0"
                  value={cooldown}
                  onChange={(e) => setCooldown(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-md bg-zinc-950 border border-zinc-800 text-zinc-100"
                />
              </div>

              {/* Actions */}
              <div className="pt-3 border-t border-zinc-800 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition"
                >
                  Cancel
                </button>
                <ActionButton isOffline={isOffline} variant="primary" disabled={submitting}>
                  {submitting ? 'Creating Rule...' : 'Save Rule'}
                </ActionButton>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
