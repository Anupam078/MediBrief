import React from 'react';
import useAnalysisStore from '../store/useAnalysisStore';
import { AlertTriangle, Info, ShieldAlert, Flag as FlagIcon } from 'lucide-react';

const FlagsPanel = () => {
  const { analysisResult, setActiveSourceId, activeSourceId } = useAnalysisStore();

  if (!analysisResult || !analysisResult.flags) return (
    <div className="glass-panel p-6 h-[200px] flex flex-col items-center justify-center text-slate-400 gap-4">
      <FlagIcon size={48} className="text-slate-200" />
      <p className="font-medium text-slate-500">Flags will appear here</p>
    </div>
  );

  const severityConfig = {
    HIGH: { color: 'severity-high', icon: ShieldAlert, label: 'Critical' },
    MEDIUM: { color: 'severity-medium', icon: AlertTriangle, label: 'Moderate' },
    LOW: { color: 'severity-low', icon: Info, label: 'Info' }
  };

  return (
    <div className="glass-panel p-6 h-full animate-fade-in flex flex-col">
      <div className="flex justify-between items-end mb-6">
        <h2 className="text-xl font-semibold text-slate-800">Clinical Flags</h2>
        <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded-md text-xs font-bold">
          {analysisResult.flags.length} Detects
        </span>
      </div>

      <div className="space-y-4 overflow-y-auto pr-2 flex-1">
        {analysisResult.flags.length === 0 ? (
          <p className="text-slate-500 italic text-center mt-10">All clear. No clinical flags detected.</p>
        ) : (
          analysisResult.flags.map((flag, idx) => {
            const config = severityConfig[flag.severity] || severityConfig.LOW;
            const Icon = config.icon;
            const isActive = activeSourceId === flag.sourceId;

            return (
              <div 
                key={idx}
                onClick={() => setActiveSourceId(isActive ? null : flag.sourceId)}
                className={`p-4 rounded-xl cursor-pointer transition-all border ${config.color} ${isActive ? 'ring-2 ring-offset-2 ring-slate-400 shadow-md transform scale-[1.02]' : 'hover:scale-[1.01]'}`}
              >
                <div className="flex items-start gap-3">
                  <Icon size={20} className="shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-bold text-sm mb-1 uppercase tracking-wider opacity-90">{flag.type.replace('_', ' ')}</h3>
                    <p className="text-sm font-bold mb-1">{flag.entity}</p>
                    <p className="text-xs opacity-80 leading-snug">{flag.reason}</p>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
      <div className="mt-4 pt-4 border-t border-slate-100 text-xs text-slate-400 text-center">
        Click a flag to highlight where it was found in the text.
      </div>
    </div>
  );
};

export default FlagsPanel;
