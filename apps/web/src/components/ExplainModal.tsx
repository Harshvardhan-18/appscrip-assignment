import React, { useEffect, useState } from 'react';
import { ExplainData } from '../types.js';
import { authFetch } from '../api.js';

interface ExplainModalProps {
  eventId: string | null;
  onClose: () => void;
}

export const ExplainModal: React.FC<ExplainModalProps> = ({ eventId, onClose }) => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ExplainData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!eventId) return;
    setLoading(true);
    setError(null);

    authFetch(`/api/events/${eventId}/explain`)
      .then(async (res) => {
        if (!res.ok) {
          throw new Error((await res.json()).error || 'Failed to fetch explain data');
        }
        return res.json();
      })
      .then((res) => {
        setData(res);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [eventId]);

  if (!eventId) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center space-x-3">
            <span className="text-xl">🔍</span>
            <div>
              <h3 className="text-base font-bold text-white">Event Explainability Inspector</h3>
              <p className="text-xs text-slate-400 font-mono">GET /api/events/{eventId}/explain</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 text-lg"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-sm">
          {loading ? (
            <div className="text-center py-12 text-slate-400 font-mono">
              Loading rule evaluations...
            </div>
          ) : error ? (
            <div className="text-center py-12 text-rose-400 font-mono bg-rose-950/20 rounded border border-rose-900/50">
              {error}
            </div>
          ) : !data ? null : (
            <>
              {/* Event Metadata */}
              <div>
                <h4 className="text-xs uppercase font-mono tracking-wider text-slate-400 mb-2">
                  📦 Ingested Event Details
                </h4>
                <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 font-mono text-xs space-y-2">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-slate-400">
                    <div>
                      <span className="text-slate-600 block">Device ID:</span>
                      <span className="text-teal-400 font-bold">{data.event.device_id}</span>
                    </div>
                    <div>
                      <span className="text-slate-600 block">Sequence:</span>
                      <span className="text-slate-200">#{data.event.seq}</span>
                    </div>
                    <div>
                      <span className="text-slate-600 block">Event Type:</span>
                      <span className="text-slate-200">{data.event.type}</span>
                    </div>
                    <div>
                      <span className="text-slate-600 block">Queue Status:</span>
                      <span className="text-emerald-400 font-bold uppercase">
                        {data.event.processing_status}
                      </span>
                    </div>
                  </div>
                  <div className="pt-2 border-t border-slate-800/80">
                    <span className="text-slate-600 block mb-1">Payload:</span>
                    <pre className="bg-slate-900 p-2.5 rounded text-[11px] text-teal-300 overflow-x-auto">
                      {JSON.stringify(data.event.payload, null, 2)}
                    </pre>
                  </div>
                </div>
              </div>

              {/* Rule Evaluations */}
              <div>
                <h4 className="text-xs uppercase font-mono tracking-wider text-slate-400 mb-2">
                  🧠 Rule Evaluations ({data.evaluations.length} evaluated)
                </h4>
                {data.evaluations.length === 0 ? (
                  <p className="text-xs text-slate-500 italic bg-slate-950 p-4 rounded border border-slate-800">
                    No evaluations recorded yet for this event (Worker may still be processing)
                  </p>
                ) : (
                  <div className="space-y-3">
                    {data.evaluations.map((evalItem) => (
                      <div
                        key={evalItem.id}
                        className={`p-3.5 rounded-lg border text-xs font-mono transition-all ${
                          evalItem.matched
                            ? 'bg-rose-950/20 border-rose-800/60'
                            : 'bg-slate-950/60 border-slate-800/80'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center space-x-2">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                evalItem.decision === 'created'
                                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                                  : evalItem.decision === 'suppressed'
                                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                                    : evalItem.matched
                                      ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                                      : 'bg-slate-800 text-slate-400'
                              }`}
                            >
                              {evalItem.decision === 'created'
                                ? 'INCIDENT CREATED'
                                : evalItem.decision === 'suppressed'
                                  ? 'SUPPRESSED (DEDUP)'
                                  : evalItem.matched
                                    ? 'MATCHED'
                                    : 'NO MATCH'}
                            </span>
                            <span className="font-semibold text-slate-200">
                              {evalItem.rule_name || evalItem.rule_id}
                            </span>
                            <span className="text-[10px] text-slate-500 capitalize">
                              ({evalItem.rule_type})
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-500">
                            {new Date(evalItem.evaluated_at).toLocaleTimeString()}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-300 font-sans mt-1 bg-slate-900/60 p-2.5 rounded border border-slate-800/40 space-y-1">
                          <div>
                            <span className="font-semibold text-slate-400">
                              Decision Rationale:{' '}
                            </span>
                            <span className="text-white font-medium">
                              {evalItem.decision_explanation || evalItem.reason}
                            </span>
                          </div>
                          {evalItem.decision_explanation &&
                            evalItem.decision_explanation !== evalItem.reason && (
                              <div className="text-slate-400 text-[10px]">
                                <span className="font-semibold">Rule Evaluation Detail: </span>
                                {evalItem.reason}
                              </div>
                            )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/80 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
