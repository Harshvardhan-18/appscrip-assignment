import React, { useState, useMemo } from 'react';
import { usePlatformStore } from '../store/PlatformContext.js';
import { Rule, RuleType, IncidentSeverity } from '../types.js';
import { ActionButton } from '../components/ActionButton.js';

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
  // 1. Threshold
  const [threshField, setThreshField] = useState('temperature');
  const [threshOp, setThreshOp] = useState<'>' | '>=' | '<' | '<=' | '==' | '!='>('>');
  const [threshValue, setThreshValue] = useState<number>(80);

  // 2. Absence
  const [absenceTimeout, setAbsenceTimeout] = useState<number>(60);

  // 3. Event Type
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
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Rules Engine</h2>
          <p className="text-xs text-slate-400 mt-1 font-mono">
            Pure evaluation pipelines for threshold, absence detection, and event types
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
          + Create New Rule
        </ActionButton>
      </div>

      {/* Rules Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-950/60 text-slate-400 border-b border-slate-800 text-[11px] uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3 font-semibold">Rule Name</th>
                <th className="px-5 py-3 font-semibold">Type</th>
                <th className="px-5 py-3 font-semibold">Condition Config</th>
                <th className="px-5 py-3 font-semibold">Scope</th>
                <th className="px-5 py-3 font-semibold">Severity</th>
                <th className="px-5 py-3 font-semibold">Enabled</th>
                <th className="px-5 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {rulesList.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-16 text-center text-slate-500">
                    No rules configured yet. Click '+ Create New Rule' to add one.
                  </td>
                </tr>
              ) : (
                rulesList.map((rule: Rule) => (
                  <tr key={rule.id} className="hover:bg-slate-800/40 transition">
                    <td className="px-5 py-3.5">
                      <div className="font-bold text-white text-sm">{rule.name}</div>
                      <div className="text-[10px] text-slate-500">{rule.id}</div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-teal-950 text-teal-300 border border-teal-850">
                        {rule.rule_type || rule.type}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-slate-300">
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
                      <span className="text-slate-300 uppercase text-[11px]">
                        {rule.scope_type || rule.scope?.type || 'all'}
                        {rule.scope_value ? `: ${rule.scope_value}` : ''}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                          rule.severity === 'critical'
                            ? 'bg-rose-500/20 text-rose-300'
                            : rule.severity === 'warning'
                              ? 'bg-amber-500/20 text-amber-300'
                              : 'bg-sky-500/20 text-sky-300'
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
                        <div className="w-8 h-4 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-teal-600"></div>
                        <span className="ml-2 text-[10px] text-slate-400">
                          {rule.enabled ? 'ON' : 'OFF'}
                        </span>
                      </label>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <ActionButton
                        isOffline={isOffline}
                        variant="danger"
                        onClick={() => handleDelete(rule.id, rule.name)}
                      >
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
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-lg w-full p-6 shadow-2xl space-y-5 font-mono text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white">Create Detection Rule</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              {/* Rule Name */}
              <div className="space-y-1">
                <label className="text-slate-400 font-semibold">Rule Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Engine High Temperature Alarm"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-teal-500"
                />
              </div>

              {/* Rule Type Selector */}
              <div className="space-y-1">
                <label className="text-slate-400 font-semibold">Rule Type *</label>
                <select
                  value={ruleType}
                  onChange={(e) => setRuleType(e.target.value as RuleType)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-teal-500"
                >
                  <option value="threshold">Threshold (Telemetry value &gt; N)</option>
                  <option value="absence">Absence (Device silence &gt; N seconds)</option>
                  <option value="event_type">Event Type (Exact match type == error)</option>
                </select>
              </div>

              {/* Dynamic Form per Rule Type */}
              {ruleType === 'threshold' && (
                <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-3">
                  <span className="font-bold text-teal-400 block">Threshold Condition</span>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="text-[10px] text-slate-500">Field</label>
                      <input
                        type="text"
                        required
                        value={threshField}
                        onChange={(e) => setThreshField(e.target.value)}
                        placeholder="temperature"
                        className="w-full px-2 py-1.5 rounded bg-slate-900 border border-slate-800 text-white"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500">Operator</label>
                      <select
                        value={threshOp}
                        onChange={(e) => setThreshOp(e.target.value as any)}
                        className="w-full px-2 py-1.5 rounded bg-slate-900 border border-slate-800 text-white"
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
                      <label className="text-[10px] text-slate-500">Threshold Value</label>
                      <input
                        type="number"
                        step="any"
                        required
                        value={threshValue}
                        onChange={(e) => setThreshValue(Number(e.target.value))}
                        className="w-full px-2 py-1.5 rounded bg-slate-900 border border-slate-800 text-white"
                      />
                    </div>
                  </div>
                </div>
              )}

              {ruleType === 'absence' && (
                <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-2">
                  <span className="font-bold text-teal-400 block">Absence Detection</span>
                  <div>
                    <label className="text-[10px] text-slate-500">
                      Timeout in Seconds (Device silent for &gt; N)
                    </label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={absenceTimeout}
                      onChange={(e) => setAbsenceTimeout(Number(e.target.value))}
                      className="w-full px-3 py-1.5 rounded bg-slate-900 border border-slate-800 text-white"
                    />
                  </div>
                </div>
              )}

              {ruleType === 'event_type' && (
                <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-2">
                  <span className="font-bold text-teal-400 block">Event Type Match</span>
                  <div>
                    <label className="text-[10px] text-slate-500">Target Event Type</label>
                    <input
                      type="text"
                      required
                      value={eventTypeVal}
                      onChange={(e) => setEventTypeVal(e.target.value)}
                      placeholder="e.g. device.error, tamper"
                      className="w-full px-3 py-1.5 rounded bg-slate-900 border border-slate-800 text-white"
                    />
                  </div>
                </div>
              )}

              {/* Scope & Severity */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-400 font-semibold">Scope</label>
                  <select
                    value={scopeType}
                    onChange={(e) => setScopeType(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white"
                  >
                    <option value="all">All Devices (Global)</option>
                    <option value="location">Specific Location</option>
                    <option value="device">Specific Device</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-slate-400 font-semibold">Severity</label>
                  <select
                    value={severity}
                    onChange={(e) => setSeverity(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white"
                  >
                    <option value="critical">Critical</option>
                    <option value="warning">Warning</option>
                    <option value="info">Info</option>
                  </select>
                </div>
              </div>

              {scopeType !== 'all' && (
                <div className="space-y-1">
                  <label className="text-slate-400 font-semibold">
                    {scopeType === 'location' ? 'Location ID' : 'Device ID'}
                  </label>
                  {scopeType === 'device' ? (
                    <select
                      value={scopeValue}
                      onChange={(e) => setScopeValue(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white"
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
                      className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white"
                    />
                  )}
                </div>
              )}

              {/* Cooldown */}
              <div className="space-y-1">
                <label className="text-slate-400 font-semibold">Cooldown (Seconds)</label>
                <input
                  type="number"
                  min="0"
                  value={cooldown}
                  onChange={(e) => setCooldown(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white"
                />
              </div>

              {/* Actions */}
              <div className="pt-3 border-t border-slate-800 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
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
