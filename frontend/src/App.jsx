import React from 'react';
import InputPanel from './components/InputPanel';
import ResultsPanel from './components/ResultsPanel';
import FlagsPanel from './components/FlagsPanel';
import { Stethoscope } from 'lucide-react';

function App() {
  return (
    <div className="min-h-screen bg-clinical-bg p-4 md:p-6 lg:p-8 flex flex-col h-screen">
      <header className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-primary-600 p-2 rounded-xl shadow-sm text-white">
            <Stethoscope size={28} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight leading-none">
              MediBrief<span className="text-primary-600">.ai</span>
            </h1>
            <p className="text-slate-500 text-sm mt-1 font-medium">Clinical Decision Support System</p>
          </div>
        </div>
        <div className="hidden md:flex items-center gap-4 text-sm font-medium text-slate-500 bg-white/50 px-4 py-2 rounded-full border border-slate-200">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500"></div> System Online
          </div>
        </div>
      </header>

      <main className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-0">
        <div className="lg:col-span-4 h-full">
          <InputPanel />
        </div>
        
        <div className="lg:col-span-5 h-full">
          <ResultsPanel />
        </div>
        
        <div className="lg:col-span-3 h-full">
          <FlagsPanel />
        </div>
      </main>
    </div>
  );
}

export default App;
