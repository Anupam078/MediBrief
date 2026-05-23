import React from 'react';
import useAnalysisStore from '../store/useAnalysisStore';
import { FileText, Loader2, AlertCircle } from 'lucide-react';

const InputPanel = () => {
  const { inputText, setInputText, isAnalyzing, analyzeRecord, errorMessage, activeSourceId, analysisResult } = useAnalysisStore();

  const handleAnalyze = () => {
    analyzeRecord(inputText);
  };

  // Helper function to highlight source text
  const getHighlightedText = () => {
    if (!analysisResult || !activeSourceId || !analysisResult.sources) return inputText;
    
    const sourceText = analysisResult.sources[activeSourceId];
    if (!sourceText) return inputText;

    // A very simple highlight mechanism (in production we'd map exact indices)
    const parts = inputText.split(sourceText);
    if (parts.length === 1) return inputText;

    return (
      <React.Fragment>
        {parts.map((p, i) => (
          <React.Fragment key={i}>
            {p}
            {i < parts.length - 1 && (
              <span className="bg-amber-200 text-amber-900 px-1 rounded shadow-sm font-medium transition-all duration-300">
                {sourceText}
              </span>
            )}
          </React.Fragment>
        ))}
      </React.Fragment>
    );
  };

  return (
    <div className="glass-panel p-6 flex flex-col h-full">
      <div className="flex items-center gap-2 mb-4">
        <FileText className="text-primary-600" size={24} />
        <h2 className="text-xl font-semibold text-slate-800">Medical Record</h2>
      </div>
      
      <div className="flex-1 relative mb-4">
        {/* Render highlighted overlay if activeSourceId exists, else just the textarea */}
        {activeSourceId ? (
          <div className="absolute inset-0 w-full h-full p-4 border border-transparent rounded-xl bg-white/50 text-slate-700 whitespace-pre-wrap overflow-y-auto leading-relaxed">
            {getHighlightedText()}
          </div>
        ) : (
          <textarea
            className="absolute inset-0 w-full h-full p-4 border border-slate-200 rounded-xl bg-white/50 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none resize-none font-sans text-slate-700 disabled:opacity-50 transition-all leading-relaxed"
            placeholder="Paste patient medical record here..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={isAnalyzing}
          />
        )}
      </div>

      {errorMessage && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-lg flex items-start gap-2 border border-red-100 animate-fade-in">
          <AlertCircle size={18} className="shrink-0 mt-0.5" />
          <p>{errorMessage}</p>
        </div>
      )}

      <button 
        className="btn-primary w-full flex items-center justify-center gap-2 py-3"
        onClick={handleAnalyze}
        disabled={isAnalyzing || inputText.length < 20}
      >
        {isAnalyzing ? (
          <>
            <Loader2 className="animate-spin" size={20} />
            Analyzing with NLP...
          </>
        ) : (
          'Generate Clinical Insights'
        )}
      </button>
    </div>
  );
};

export default InputPanel;
