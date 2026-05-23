import { create } from 'zustand';
import { evaluateRecord } from '../services/api';

const useAnalysisStore = create((set) => ({
  inputText: '',
  isAnalyzing: false,
  analysisResult: null,
  activeSourceId: null,
  errorMessage: null,

  setInputText: (text) => set({ inputText: text }),
  setActiveSourceId: (id) => set({ activeSourceId: id }),
  clearError: () => set({ errorMessage: null }),
  reset: () => set({ inputText: '', analysisResult: null, activeSourceId: null, errorMessage: null }),

  analyzeRecord: async (text) => {
    // Basic validation
    if (!text || text.length < 20) {
      set({ errorMessage: 'Please enter at least 20 characters of the medical record.' });
      return;
    }

    set({ isAnalyzing: true, errorMessage: null, analysisResult: null, activeSourceId: null });
    try {
      const data = await evaluateRecord(text);
      set({ analysisResult: data, isAnalyzing: false });
    } catch (error) {
      set({ errorMessage: error.message || 'An error occurred during analysis.', isAnalyzing: false });
    }
  }
}));

export default useAnalysisStore;
