
import React, { useState } from 'react';
import { Megaphone, FileText, Send, Loader2, Sparkles, Copy, Globe, CheckCircle, Award, AlertCircle, Newspaper } from 'lucide-react';
import { generateAdvocacyPetition } from '../services/gemini';
import { SCDUpdates } from './SCDUpdates';

const Advocacy: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'updates' | 'petition'>('updates');
  const [issue, setIssue] = useState('');
  const [region, setRegion] = useState('');
  const [petition, setPetition] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!issue || !region) return;
    setLoading(true);
    setError(null);
    try {
      const res = await generateAdvocacyPetition(issue, region);
      setPetition(res);
    } catch (e) {
      setError("The Policy Engine is temporarily overloaded. Please try again in a few moments.");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (!petition) return;
    try {
      // Use fallback if navigator.clipboard is blocked by SecurityError in blob environments
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(petition);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } else {
        throw new Error("Clipboard API unavailable");
      }
    } catch (e) {
      // Fallback: alert the user or show a selection UI
      alert("Please manually select and copy the text below. Your browser security settings blocked automatic copying.");
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      <div className="bg-gradient-to-br from-indigo-700 to-purple-900 rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32 blur-[100px] group-hover:bg-white/10 transition-all duration-700"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-4xl font-black mb-2 flex items-center gap-4 tracking-tighter leading-none">
              <Megaphone className="rotate-[-15deg] text-yellow-400 drop-shadow-lg" size={40} /> Policy & Research Portal
            </h2>
            <p className="text-sm font-medium opacity-80 leading-relaxed max-w-md">Empowering Warriors with clinical trial news, advocacy milestones, and AI-driven legislative policy tools.</p>
          </div>

          {/* Navigation Pill Switcher */}
          <div className="flex bg-white/10 p-1.5 rounded-2xl border border-white/15 shrink-0 self-start md:self-center">
            <button
              type="button"
              onClick={() => setActiveTab('updates')}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === 'updates'
                  ? 'bg-white text-indigo-900 shadow-md font-extrabold'
                  : 'text-white/80 hover:text-white'
              }`}
            >
              <Newspaper size={14} /> SCD Updates
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('petition')}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === 'petition'
                  ? 'bg-white text-indigo-900 shadow-md font-extrabold'
                  : 'text-white/80 hover:text-white'
              }`}
            >
              <FileText size={14} /> Draft Petition
            </button>
          </div>
        </div>
      </div>

      {activeTab === 'updates' ? (
        <SCDUpdates />
      ) : (
        <div className="space-y-6">
          <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm space-y-8">
            <div className="flex items-center gap-4">
               <div className="bg-yellow-50 p-3 rounded-2xl text-yellow-600 border border-yellow-100 shadow-inner">
                 <Sparkles size={24} fill="currentColor" />
               </div>
               <div>
                 <h3 className="font-black text-gray-800 uppercase tracking-widest text-xs">Advocacy Petition Synthesizer</h3>
                 <p className="text-[10px] text-gray-400 font-bold mt-1 uppercase tracking-tighter">Powered by Gemini 3 Flash</p>
               </div>
            </div>
            
            <div className="space-y-6">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] ml-3">Policy Challenge</label>
                <input 
                  type="text" 
                  placeholder="e.g. Mandatory SCD screening in birth centers" 
                  value={issue}
                  onChange={(e) => setIssue(e.target.value)}
                  className="w-full px-8 py-5 bg-gray-50 border border-gray-100 rounded-[1.5rem] focus:outline-none focus:ring-8 focus:ring-indigo-500/5 font-black text-gray-800 placeholder:text-gray-300 transition-all text-sm"
                />
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] ml-3">Location / Region</label>
                <div className="relative">
                  <Globe className="absolute left-7 top-5.5 text-gray-400" size={20} />
                  <input 
                    type="text" 
                    placeholder="e.g. Nairobi, Kenya" 
                    value={region}
                    onChange={(e) => setRegion(e.target.value)}
                    className="w-full pl-16 pr-8 py-5 bg-gray-50 border border-gray-100 rounded-[1.5rem] focus:outline-none focus:ring-8 focus:ring-indigo-500/5 font-black text-gray-800 placeholder:text-gray-300 transition-all text-sm"
                  />
                </div>
              </div>
              
              {error && (
                <div className="flex items-center gap-3 p-4 bg-red-50 text-red-600 rounded-2xl border border-red-100 animate-in zoom-in-95">
                  <AlertCircle size={18} />
                  <span className="text-xs font-bold">{error}</span>
                </div>
              )}

              <button 
                onClick={handleGenerate}
                disabled={loading || !issue || !region}
                className="w-full bg-indigo-600 text-white font-black py-6 rounded-[2rem] hover:bg-indigo-700 transition-all flex items-center justify-center gap-4 disabled:opacity-50 shadow-2xl shadow-indigo-200 uppercase tracking-[0.2em] text-sm active:scale-95 outline-none"
              >
                {loading ? <Loader2 className="animate-spin" size={20} /> : <FileText size={20} />}
                {loading ? 'Consulting Global Policy Database...' : 'Draft Formal Petition'}
              </button>
            </div>
          </div>

          {petition && (
            <div className="bg-white p-8 rounded-[2.5rem] border-2 border-indigo-100 shadow-2xl animate-in slide-in-from-bottom-12 duration-700 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none">
                 <FileText size={160}/>
              </div>
              <div className="flex justify-between items-center mb-8 pb-6 border-b border-gray-50 relative z-10">
                <div>
                  <h4 className="font-black text-indigo-800 uppercase tracking-widest text-xs">Policy Draft v1.0</h4>
                  <p className="text-[9px] text-gray-400 font-bold uppercase mt-1">Ready for Legislative Submission</p>
                </div>
                <div className="flex gap-4">
                  <button 
                    onClick={copyToClipboard}
                    className="p-4 bg-gray-50 rounded-2xl hover:bg-indigo-50 hover:text-indigo-600 transition-all active:scale-90 shadow-sm border border-gray-100"
                    title="Copy to Clipboard"
                  >
                    {copied ? <CheckCircle size={24} className="text-green-500 animate-in zoom-in" /> : <Copy size={24} className="text-gray-400" />}
                  </button>
                  <button className="p-4 bg-indigo-600 rounded-2xl hover:bg-indigo-700 text-white transition-all shadow-xl active:scale-90 shadow-indigo-200">
                    <Send size={24} fill="currentColor" />
                  </button>
                </div>
              </div>
              <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap leading-loose font-medium italic relative z-10 bg-gray-50/50 p-8 rounded-[2rem] border border-gray-50 shadow-inner">
                {petition}
              </div>
            </div>
          )}
        </div>
      )}

      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-orange-50 p-8 rounded-[2.5rem] border border-orange-100 shadow-sm relative group overflow-hidden">
          <div className="absolute -bottom-10 -right-10 text-orange-200/40 rotate-[-20deg] group-hover:scale-110 transition-all duration-700"><Globe size={200} /></div>
          <div className="relative z-10">
            <h4 className="font-black text-orange-800 uppercase tracking-widest text-xs mb-2">Advocacy Reach</h4>
            <p className="text-3xl font-black text-orange-900 tracking-tighter">72% Global</p>
            <p className="text-[10px] text-orange-600 font-black uppercase tracking-widest mt-2 leading-none">High Influence Potential</p>
            <div className="w-full bg-white h-4 rounded-full mt-8 overflow-hidden border border-orange-200 p-1 shadow-inner">
              <div className="bg-orange-500 h-full w-[72%] rounded-full shadow-lg shadow-orange-300"></div>
            </div>
          </div>
        </div>
        <div className="bg-indigo-50 p-8 rounded-[2.5rem] border border-indigo-100 shadow-sm relative group overflow-hidden">
          <div className="absolute -bottom-10 -right-10 text-indigo-200/40 rotate-[-20deg] group-hover:scale-110 transition-all duration-700"><Award size={200} /></div>
          <div className="relative z-10">
            <h4 className="font-black text-indigo-800 uppercase tracking-widest text-xs mb-2">Warrior Rank</h4>
            <p className="text-3xl font-black text-indigo-900 tracking-tighter">Certified Ally</p>
            <p className="text-[10px] text-indigo-600 font-black uppercase tracking-widest mt-2 leading-none">NIH Policy Partner</p>
            <div className="flex gap-2 mt-8">
              <span className="text-[10px] bg-white px-4 py-2 rounded-xl border border-indigo-200 text-indigo-600 font-black uppercase tracking-tighter shadow-sm">Verified</span>
              <span className="text-[10px] bg-white px-4 py-2 rounded-xl border border-indigo-200 text-indigo-600 font-black uppercase tracking-tighter shadow-sm">UN Active</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Advocacy;
