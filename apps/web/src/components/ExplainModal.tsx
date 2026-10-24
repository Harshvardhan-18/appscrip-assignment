import React, { useEffect, useState } from 'react';
import { ExplainData } from '../types.js';
import { authFetch } from '../api.js';
import { HelpCircle, X, Check, ShieldAlert, Cpu } from 'lucide-react';

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
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden font-mono animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-950">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-md bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-100">
              <HelpCircle className="w-4 h-4 text-zinc-300" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-zinc-100">Event Explainability Inspector</h3>
              <p className="text-xs text-zinc-500 font-mono">GET /api/events/{eventId}/explain</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-500 hover:text-zinc-200 p-1.5 rounded-md hover:bg-zinc-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs">
          {loading ? (
            <div className="text-center py-12 text-zinc-500">
              Loading rule evaluations...
            </div>
          ) : error ? (
            <div className="text-center py-12 text-red-400 bg-red-950/20 rounded-md border border-red-900/50">
              {error}
            </div>
          ) : !data ? null : (
            <>
              {/* Event Metadata */}
              <div>
                <h4 className="text-[11px] uppercase tracking-wider text-zinc-400 mb-2 font-semibold">
                  Ingested Event Context
                </h4>
                <div className="bg-zinc-950 p-4 rounded-md border border-zinc-800 space-y-2">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-zinc-400">
                    <div>
                      <span className="text-zinc-500 block text-[10px]">Device ID:</span>
                      <span className="text-zinc-100 font-semibold">{data.event.device_id}</span>
                    </div>
                    <div>
                      <span className="text-zinc-500 block text-[10px]">Sequence:</span>
                      <span className="text-zinc-200">#{data.event.seq}</span>
                    </div>
                    <div>
                      <span className="text-zinc-500 block text-[10px]">Event Type:</span>
                      <span className="text-zinc-200">{data.event.type}</span>
                    </div>
                    <div>
                      <span className="text-zinc-500 block text-[10px]">Queue Status:</span>
                      <span className="text-zinc-100 font-semibold uppercase">
                        {data.event.processing_status}
                      </span>
                    </div>
                  </div>
                  <div className="pt-2 border-t border-zinc-800/80">
                    <span className="text-zinc-500 block mb-1 text-[10px]">Payload:</span>
                    <pre className="bg-zinc-900 p-2.5 rounded text-[11px] text-zinc-300 overflow-x-auto border border-zinc-800">
                      {JSON.stringify(data.event.payload, null, 2)}
                    </pre>
                  </div>
                </div>
              </div>

              {/* Rule Evaluations */}
              <div>
                <h4 className="text-[11px] uppercase tracking-wider text-zinc-400 mb-2 font-semibold">
                  Rule Evaluation Pipeline ({data.evaluations.length} evaluated)
                </h4>
                {data.evaluations.length === 0 ? (
                  <p className="text-xs text-zinc-500 italic bg-zinc-950 p-4 rounded-md border border-zinc-800">
                    No evaluations recorded yet for this event (Worker may still be processing)
                  </p>
                ) : (
                  <div className="space-y-3">
                    {data.evaluations.map((evalItem) => (
                      <div
                        key={evalItem.id}
                        className={`p-3.5 rounded-md border text-xs transition-all ${
                          evalItem.matched
                            ? 'bg-zinc-900/80 border-zinc-700'
                            : 'bg-zinc-950/60 border-zinc-800/80'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center space-x-2">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                                evalItem.decision === 'created'
                                  ? 'bg-zinc-800 text-emerald-400 border border-emerald-500/40'
                                  : evalItem.decision === 'suppressed'
                                    ? 'bg-amber-950/80 text-amber-300 border border-amber-800/60'
                                    : evalItem.matched
                                      ? 'bg-zinc-800 text-zinc-200 border border-zinc-700'
                                      : 'bg-zinc-950 text-zinc-500 border border-zinc-800'
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
                            <span className="font-semibold text-zinc-200">
                              {evalItem.rule_name || evalItem.rule_id}
                            </span>
                            <span className="text-[10px] text-zinc-500 capitalize">
                              ({evalItem.rule_type})
                            </span>
                          </div>
                          <span className="text-[10px] text-zinc-500">
                            {new Date(evalItem.evaluated_at).toLocaleTimeString()}
                          </span>
                        </div>
                        <div className="text-[11px] text-zinc-300 mt-1 bg-zinc-950/80 p-2.5 rounded border border-zinc-800 space-y-1">
                          <div>
                            <span className="font-medium text-zinc-400">
                              Decision Rationale:{' '}
                            </span>
                            <span className="text-zinc-100 font-medium">
                              {evalItem.decision_explanation || evalItem.reason}
                            </span>
                          </div>
                          {evalItem.decision_explanation &&
                            evalItem.decision_explanation !== evalItem.reason && (
                              <div className="text-zinc-500 text-[10px]">
                                <span className="font-medium">Rule Evaluation Detail: </span>
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
        <div className="px-6 py-3.5 border-t border-zinc-800 bg-zinc-950 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-950 text-xs font-medium rounded-md transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
