import React from 'react';
import useAnalysisStore from '../store/useAnalysisStore';
import { FileSearch, Clock } from 'lucide-react';

const ResultsPanel = () => {
  const { analysisResult } = useAnalysisStore();

  if (!analysisResult) return (
    <div className="glass-panel p-6 h-full flex flex-col items-center justify-center text-slate-400 gap-4">
      <FileSearch size={48} className="text-slate-200" />
      <p className="font-medium text-slate-500">Analysis results will appear here</p>
    </div>
  );

  const { summary, timeline, partial } = analysisResult;

  return (
    <div className="flex flex-col gap-6 h-full animate-fade-in">
      {partial && (
        <div className="p-4 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-sm font-medium shadow-sm flex gap-2 items-start">
          <span className="text-amber-500 rotate-180 inline-block">⚠</span>
          <p>Warning: The LLM model timed out or encountered an error. Showing deterministic deterministic flags and extracted entities only.</p>
        </div>
      )}
      
      <div className="glass-panel p-6">
        <div className="flex items-center gap-2 mb-4">
          <FileSearch className="text-primary-600" size={24} />
          <h2 className="text-xl font-semibold text-slate-800">Clinical Summary</h2>
        </div>
        <p className="text-slate-700 leading-relaxed font-medium">
          {summary || "No unstructured summary generated."}
        </p>
      </div>

      <div className="glass-panel p-6 flex-1 h-full min-h-[300px]">
        <div className="flex items-center gap-2 mb-6">
          <Clock className="text-primary-600" size={24} />
          <h2 className="text-xl font-semibold text-slate-800">Timeline</h2>
        </div>
        <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
          {timeline && timeline.length > 0 ? timeline.map((event, idx) => (
            <div key={idx} className="flex gap-4 group">
              <div className="w-24 shrink-0 text-sm font-semibold text-slate-500 text-right pt-1">{event.date}</div>
              <div className="w-px bg-slate-200 relative group-hover:bg-primary-300 transition-colors">
                <div className="absolute top-2 -left-1 w-2.5 h-2.5 rounded-full bg-primary-500 border-2 border-white group-hover:scale-125 transition-transform"></div>
              </div>
              <div className="pb-6 text-slate-700 flex-1">{event.event}</div>
            </div>
          )) : <p className="text-slate-500 italic">No chronological events detected.</p>}
        </div>
      </div>
    </div>
  );
};

export default ResultsPanel;
