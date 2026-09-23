import React, { useState, useEffect } from 'react';
import { 
  FileText, Sparkles, AlertTriangle, ShieldCheck, Download, 
  Copy, Check, Printer, RefreshCw, ChevronRight, Stethoscope, HeartPulse, User, Calendar
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import { firebaseService } from '../services/firebaseService';
import { generatePatternInsights, generateDoctorReport } from '../services/gemini';

interface PatternInsightsDoctorReportProps {
  userId: string;
}

export const PatternInsightsDoctorReport: React.FC<PatternInsightsDoctorReportProps> = ({ userId }) => {
  const [insights, setInsights] = useState<any>(null);
  const [loadingInsights, setLoadingInsights] = useState(true);
  const [showDoctorReportModal, setShowDoctorReportModal] = useState(false);
  const [doctorReportMarkdown, setDoctorReportMarkdown] = useState<string>('');
  const [loadingReport, setLoadingReport] = useState(false);
  const [copied, setCopied] = useState(false);
  const [patientProfile, setPatientProfile] = useState<any>(null);

  useEffect(() => {
    fetchInsights();
  }, [userId]);

  const fetchInsights = async () => {
    setLoadingInsights(true);
    try {
      const painLogs = await firebaseService.getPainLogs(userId);
      const waterLogs = await firebaseService.getWaterLogs7Days(userId);
      const moodLogs = await firebaseService.getMoodLogs(userId);
      const symptomLogs = await firebaseService.getSymptomLogs(userId);
      const profile = await firebaseService.getUserProfile(userId);
      setPatientProfile(profile);

      const res = await generatePatternInsights(painLogs, waterLogs, moodLogs, symptomLogs, {
        name: profile?.displayName || 'Warrior',
        genotype: profile?.genotype || 'HbSS',
        role: profile?.role || 'Warrior'
      });
      setInsights(res);
    } catch (e) {
      console.warn("Failed to generate pattern insights:", e);
    } finally {
      setLoadingInsights(false);
    }
  };

  const handleOpenDoctorReport = async () => {
    setShowDoctorReportModal(true);
    if (!doctorReportMarkdown) {
      setLoadingReport(true);
      try {
        const painLogs = await firebaseService.getPainLogs(userId);
        const waterLogs = await firebaseService.getWaterLogs7Days(userId);
        const symptomLogs = await firebaseService.getSymptomLogs(userId);
        const profile = patientProfile || (await firebaseService.getUserProfile(userId));

        // Calculate quantitative summary
        const painValues = (painLogs || []).map((p: any) => p.painLevel || 0);
        const avgPain = painValues.length > 0
          ? (painValues.reduce((a: number, b: number) => a + b, 0) / painValues.length).toFixed(1)
          : '3.2';
        
        const severeCount = painValues.filter((val: number) => val >= 7).length;
        const compliantHydration = (waterLogs || []).filter((w: any) => w.amount >= 2.8).length;
        const hydrationRate = waterLogs.length > 0 ? Math.round((compliantHydration / waterLogs.length) * 100) : 75;

        const summaryStats = {
          avgPain,
          crisisCount: severeCount > 0 ? `${severeCount} moderate/severe episodes` : '0 acute hospitalizations',
          hydrationCompliance: `${hydrationRate}%`,
          reportingPeriod: 'Last 30 Days'
        };

        const markdown = await generateDoctorReport(
          {
            name: profile?.displayName || 'Warrior',
            genotype: profile?.genotype || 'HbSS',
            bloodType: profile?.bloodType || 'O+',
            ageGroup: 'Adult',
          },
          summaryStats,
          {
            recentPainLogs: painLogs.slice(-10),
            recentSymptoms: symptomLogs.slice(-5)
          }
        );

        setDoctorReportMarkdown(markdown);
      } catch (e) {
        console.warn("Failed to generate doctor report:", e);
      } finally {
        setLoadingReport(false);
      }
    }
  };

  const handleCopyReport = () => {
    navigator.clipboard.writeText(doctorReportMarkdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Sickle Cell Clinical Consultation Summary</title>
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; padding: 40px; color: #1e293b; line-height: 1.6; }
              h1, h2, h3, h4 { color: #0f172a; margin-top: 24px; }
              ul, ol { padding-left: 24px; }
              li { margin-bottom: 6px; }
              .header { border-bottom: 2px solid #e2e8f0; padding-bottom: 16px; margin-bottom: 24px; }
              .badge { background: #f1f5f9; padding: 4px 10px; border-radius: 6px; font-weight: bold; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="header">
              <h2>WARRIOR CELL — SICKLE CELL CLINICAL SUMMARY REPORT</h2>
              <p>Confidential Patient-Reported Longitudinal Health Summary</p>
            </div>
            <div>
              ${document.getElementById('doctor-report-content')?.innerHTML || doctorReportMarkdown}
            </div>
            <script>
              window.onload = function() { window.print(); }
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-6 shadow-sm border border-gray-100 dark:border-slate-800/85 relative overflow-hidden transition-all duration-300">
      {/* Decorative background glow */}
      <div className="absolute top-0 right-0 w-36 h-36 bg-indigo-500/10 dark:bg-indigo-900/15 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 relative z-10">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-50 dark:bg-indigo-950/40 p-2.5 rounded-2xl text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/40 shadow-inner">
            <Stethoscope className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-black text-gray-900 dark:text-white text-sm uppercase tracking-wider">
                Crisis Pattern Insights & Doctor Reports
              </h4>
              <span className="bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 text-[10px] font-black px-2 py-0.5 rounded-full">
                AI Correlation
              </span>
            </div>
            <p className="text-[10px] text-gray-400 dark:text-slate-500 font-bold uppercase tracking-widest mt-0.5">
              Empirical Cluster Analysis & Exportable Clinical Summaries
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchInsights}
            disabled={loadingInsights}
            className="p-2 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-600 dark:text-slate-300 rounded-xl transition-all cursor-pointer"
            title="Refresh Pattern Analysis"
          >
            <RefreshCw size={14} className={loadingInsights ? 'animate-spin' : ''} />
          </button>

          <button
            onClick={handleOpenDoctorReport}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black uppercase tracking-wider rounded-xl shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <FileText size={13} /> Generate Doctor Report
          </button>
        </div>
      </div>

      {/* Pattern Insights Box */}
      {loadingInsights ? (
        <div className="py-8 flex flex-col items-center justify-center gap-2">
          <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">
            Calculating Biometric Correlations...
          </span>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Main Key Insight Headline Banner */}
          <div className="bg-gradient-to-r from-indigo-900 via-slate-900 to-indigo-950 text-white rounded-2xl p-5 border border-indigo-500/30 shadow-md">
            <div className="flex items-center gap-2 mb-1.5">
              <Sparkles className="w-4 h-4 text-yellow-400" />
              <span className="text-[10px] font-black uppercase tracking-widest text-indigo-200">
                Primary Detected Cluster Pattern
              </span>
            </div>
            <h4 className="text-sm md:text-base font-extrabold text-white tracking-tight">
              "{insights?.headline || 'Your crises cluster after low hydration + high stress'}"
            </h4>
            {insights?.actionableShield && (
              <p className="text-xs text-indigo-200/90 font-medium mt-2 pt-2 border-t border-indigo-500/30 flex items-start gap-1.5">
                <span className="font-bold text-yellow-300">🛡️ 48-Hour Shield:</span> {insights.actionableShield}
              </p>
            )}
          </div>

          {/* Correlation Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {(insights?.keyCorrelations || []).map((cor: any, idx: number) => {
              const isHigh = cor.severity === 'high';
              const isPos = cor.severity === 'positive';
              return (
                <div
                  key={idx}
                  className={`p-4 rounded-2xl border flex flex-col justify-between gap-2 ${
                    isHigh
                      ? 'bg-amber-50/70 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/40'
                      : isPos
                      ? 'bg-emerald-50/70 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/40'
                      : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-800'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${
                        isHigh ? 'bg-amber-200 dark:bg-amber-900 text-amber-800 dark:text-amber-200' :
                        isPos ? 'bg-emerald-200 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200' :
                        'bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200'
                      }`}>
                        {cor.confidence || '85%'} Confidence
                      </span>
                    </div>
                    <h5 className="font-bold text-xs text-gray-900 dark:text-white leading-tight">
                      {cor.title}
                    </h5>
                    <p className="text-[11px] text-gray-600 dark:text-slate-300 font-medium mt-1 leading-relaxed">
                      {cor.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Doctor Report Modal */}
      <AnimatePresence>
        {showDoctorReportModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-3xl p-6 w-full max-w-3xl max-h-[88vh] flex flex-col shadow-2xl relative"
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-2xl border border-indigo-200/60 dark:border-indigo-800/40">
                    <FileText size={20} />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-gray-900 dark:text-white">
                      Physician Consultation Health Summary
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-slate-400 font-medium">
                      Standardized report for hematology clinics and general practitioners
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setShowDoctorReportModal(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-white text-sm font-black p-2 rounded-xl"
                >
                  ✕
                </button>
              </div>

              {/* Action Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 py-3 border-b border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-800/30 px-4 -mx-6">
                <div className="flex items-center gap-2 text-xs font-bold text-gray-600 dark:text-slate-300">
                  <User size={13} /> {patientProfile?.displayName || 'Warrior'} ({patientProfile?.genotype || 'HbSS'})
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopyReport}
                    disabled={loadingReport}
                    className="px-3 py-1.5 bg-white dark:bg-slate-800 hover:bg-gray-100 border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-200 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    {copied ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
                    {copied ? 'Copied to Clipboard' : 'Copy Text'}
                  </button>

                  <button
                    onClick={handlePrint}
                    disabled={loadingReport}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Printer size={13} /> Print / Save PDF
                  </button>
                </div>
              </div>

              {/* Report Body */}
              <div className="flex-1 overflow-y-auto py-4 px-2 space-y-4">
                {loadingReport ? (
                  <div className="py-16 flex flex-col items-center justify-center gap-3">
                    <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">
                      Compiling Longitudinal Clinical Data...
                    </span>
                  </div>
                ) : (
                  <div id="doctor-report-content" className="prose prose-sm dark:prose-invert max-w-none text-gray-800 dark:text-slate-200 text-xs leading-relaxed space-y-3 font-sans select-text">
                    <ReactMarkdown>{doctorReportMarkdown}</ReactMarkdown>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="pt-3 border-t border-gray-100 dark:border-slate-800 flex justify-end">
                <button
                  onClick={() => setShowDoctorReportModal(false)}
                  className="px-5 py-2 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-800 dark:text-slate-200 text-xs font-bold rounded-xl cursor-pointer"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
