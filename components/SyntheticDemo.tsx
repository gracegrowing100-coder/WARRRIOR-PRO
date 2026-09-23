import React, { useMemo, useState } from 'react';
import {
  Activity,
  ArrowLeft,
  Check,
  ChevronRight,
  ClipboardCheck,
  Droplets,
  HeartPulse,
  Info,
  Pill,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  UserRound,
} from 'lucide-react';

type DemoView = 'patient' | 'nurse';

interface SyntheticDemoProps {
  onExit: () => void;
}

const patients = [
  { initials: 'TA', name: 'Tayo A.', status: 'Review now', tone: 'rose', pain: 7, reason: 'Pain increased from 3 to 7 today', lastCheckIn: '8 min ago' },
  { initials: 'AM', name: 'Amaka M.', status: 'Watch', tone: 'amber', pain: 4, reason: 'Missed two medication logs', lastCheckIn: '41 min ago' },
  { initials: 'BI', name: 'Bisi I.', status: 'Stable', tone: 'emerald', pain: 1, reason: 'No new warning signals', lastCheckIn: '2 hr ago' },
] as const;

const toneStyles = {
  rose: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/30 dark:text-rose-300 dark:border-rose-900/60',
  amber: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-900/60',
  emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-900/60',
} as const;

export const SyntheticDemo: React.FC<SyntheticDemoProps> = ({ onExit }) => {
  const [view, setView] = useState<DemoView>('patient');
  const [painToday, setPainToday] = useState(true);
  const [painScore, setPainScore] = useState(7);
  const [water, setWater] = useState(1.5);
  const [medicationTaken, setMedicationTaken] = useState(false);
  const [saved, setSaved] = useState(false);
  const [briefApproved, setBriefApproved] = useState(false);

  const riskLabel = useMemo(() => {
    if (!painToday || painScore <= 3) return 'Routine';
    if (painScore <= 6) return 'Watch';
    return 'Review now';
  }, [painScore, painToday]);

  const saveCheckIn = () => {
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2800);
  };

  return (
    <div className="min-h-screen bg-[#f4f6f8] text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <header className="border-b border-slate-200 bg-white/95 backdrop-blur dark:border-slate-800 dark:bg-slate-900/95">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-600 text-lg font-black text-white">W</div>
            <div>
              <p className="text-sm font-black tracking-tight">Warrior AI</p>
              <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Synthetic pilot workspace</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onExit}
            className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <ArrowLeft size={16} /> Exit demo
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
        <section className="mb-6 overflow-hidden rounded-3xl bg-slate-950 px-5 py-6 text-white shadow-xl shadow-slate-300/30 dark:shadow-none sm:px-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-[11px] font-black uppercase tracking-[0.16em] text-cyan-300">
                <ShieldCheck size={13} /> Demonstration only
              </div>
              <h1 className="text-2xl font-black tracking-tight sm:text-3xl">See the patient check-in and nurse review loop</h1>
              <p className="mt-2 max-w-xl text-sm leading-6 text-slate-300">
                Every name, symptom and recommendation on this screen is synthetic. Nothing is sent to Firebase, and this demonstration does not diagnose or predict a crisis.
              </p>
            </div>
            <div className="inline-flex rounded-2xl bg-white/10 p-1" aria-label="Choose demo perspective">
              <ViewButton active={view === 'patient'} onClick={() => setView('patient')} icon={<UserRound size={16} />} label="Patient check-in" />
              <ViewButton active={view === 'nurse'} onClick={() => setView('nurse')} icon={<Stethoscope size={16} />} label="Nurse review" />
            </div>
          </div>
        </section>

        {view === 'patient' ? (
          <div className="grid gap-6 lg:grid-cols-[1.35fr_0.65fr]">
            <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-7">
              <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-red-600">Today’s check-in</p>
                  <h2 className="mt-1 text-2xl font-black tracking-tight">Good afternoon, Tayo</h2>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">This usually takes less than one minute.</p>
                </div>
                <span className="inline-flex w-fit items-center rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-black text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-300">
                  {riskLabel}
                </span>
              </div>

              <div className="space-y-7">
                <fieldset>
                  <legend className="text-sm font-black">Are you experiencing pain today?</legend>
                  <div className="mt-3 grid grid-cols-2 gap-3">
                    <ChoiceButton active={painToday} onClick={() => setPainToday(true)} label="Yes, pain today" />
                    <ChoiceButton active={!painToday} onClick={() => setPainToday(false)} label="No pain today" />
                  </div>
                </fieldset>

                {painToday && (
                  <div>
                    <div className="flex items-center justify-between gap-4">
                      <label htmlFor="demo-pain-score" className="text-sm font-black">Pain intensity</label>
                      <span className="text-2xl font-black text-red-600">{painScore}<span className="text-sm text-slate-400">/10</span></span>
                    </div>
                    <input
                      id="demo-pain-score"
                      type="range"
                      min="0"
                      max="10"
                      value={painScore}
                      onChange={(event) => setPainScore(Number(event.target.value))}
                      className="mt-3 h-2 w-full cursor-pointer accent-red-600"
                    />
                    <div className="mt-2 flex justify-between text-[11px] font-semibold text-slate-400"><span>No pain</span><span>Severe pain</span></div>
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between gap-4">
                    <p className="text-sm font-black">Water logged today</p>
                    <p className="text-sm font-black text-cyan-700 dark:text-cyan-300">{water.toFixed(1)} L of 3.0 L</p>
                  </div>
                  <div className="mt-3 h-3 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                    <div className="h-full rounded-full bg-cyan-500 transition-all" style={{ width: `${Math.min((water / 3) * 100, 100)}%` }} />
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {[0.25, 0.5, 0.75].map((amount) => (
                      <button key={amount} type="button" onClick={() => setWater((current) => Math.min(3.5, current + amount))} className="min-h-11 rounded-xl border border-cyan-200 bg-cyan-50 px-4 text-sm font-black text-cyan-800 hover:bg-cyan-100 dark:border-cyan-900 dark:bg-cyan-950/30 dark:text-cyan-200">
                        +{amount} L
                      </button>
                    ))}
                  </div>
                </div>

                <button type="button" onClick={() => setMedicationTaken((current) => !current)} className={`flex min-h-14 w-full items-center justify-between rounded-2xl border px-4 text-left transition ${medicationTaken ? 'border-emerald-300 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/30' : 'border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/60'}`}>
                  <span className="flex items-center gap-3"><Pill size={19} className={medicationTaken ? 'text-emerald-600' : 'text-slate-500'} /><span><span className="block text-sm font-black">Hydroxyurea log</span><span className="text-xs text-slate-500 dark:text-slate-400">Mark today’s scheduled dose</span></span></span>
                  <span className={`flex h-7 w-7 items-center justify-center rounded-full ${medicationTaken ? 'bg-emerald-600 text-white' : 'border border-slate-300 dark:border-slate-600'}`}>{medicationTaken && <Check size={16} />}</span>
                </button>

                <button type="button" onClick={saveCheckIn} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-red-600 px-5 text-sm font-black text-white shadow-lg shadow-red-200 transition hover:bg-red-700 dark:shadow-red-950/30">
                  <ClipboardCheck size={18} /> Save synthetic check-in
                </button>
                {saved && <p role="status" className="rounded-xl bg-emerald-50 px-4 py-3 text-center text-sm font-bold text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300">Saved locally for this demo. The nurse queue has been updated.</p>}
              </div>
            </section>

            <aside className="space-y-4">
              <Metric icon={<HeartPulse size={19} />} label="7-day pain average" value="4.1 / 10" note="Up from 2.8 last week" tone="rose" />
              <Metric icon={<Droplets size={19} />} label="Hydration progress" value="50%" note="1.5 L remaining today" tone="cyan" />
              <Metric icon={<Activity size={19} />} label="Recent episodes" value="2 this week" note="Last logged 2 days ago" tone="amber" />
              <div className="rounded-3xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
                <div className="flex gap-3"><Info size={18} className="mt-0.5 shrink-0 text-slate-500" /><div><h3 className="text-sm font-black">If symptoms feel urgent</h3><p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">Follow the emergency plan provided by your clinic or contact local emergency services. This demo is not monitored.</p></div></div>
              </div>
            </aside>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
            <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6">
              <div className="mb-5">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-red-600">Morning review queue</p>
                <h2 className="mt-1 text-2xl font-black tracking-tight">3 patients need sorting</h2>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Synthetic alerts ordered by rule-based urgency.</p>
              </div>
              <div className="space-y-3">
                {patients.map((patient) => (
                  <button key={patient.name} type="button" className="flex min-h-20 w-full items-center gap-3 rounded-2xl border border-slate-200 p-3 text-left transition hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-sm font-black text-white dark:bg-slate-700">{patient.initials}</span>
                    <span className="min-w-0 flex-1"><span className="flex items-center justify-between gap-2"><span className="font-black">{patient.name}</span><span className={`rounded-full border px-2 py-0.5 text-[10px] font-black ${toneStyles[patient.tone]}`}>{patient.status}</span></span><span className="mt-1 block truncate text-xs text-slate-500 dark:text-slate-400">{patient.reason}</span></span>
                    <ChevronRight size={17} className="shrink-0 text-slate-400" />
                  </button>
                ))}
              </div>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-7">
              <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 dark:border-slate-800 sm:flex-row sm:items-start sm:justify-between">
                <div><p className="text-xs font-black uppercase tracking-[0.16em] text-rose-600">Review now</p><h2 className="mt-1 text-2xl font-black">Tayo A.</h2><p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Last check-in 8 minutes ago · synthetic patient</p></div>
                <span className="inline-flex w-fit items-center rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-black text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-300">Pain 7/10</span>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <SmallStat label="Pain change" value="3 → 7" />
                <SmallStat label="Water today" value={`${water.toFixed(1)} L`} />
                <SmallStat label="Medication" value={medicationTaken ? 'Logged' : 'Not logged'} />
              </div>

              <div className="mt-5 rounded-2xl border border-indigo-200 bg-indigo-50/70 p-5 dark:border-indigo-900/60 dark:bg-indigo-950/20">
                <div className="flex items-start gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white"><Sparkles size={17} /></span>
                  <div>
                    <div className="flex flex-wrap items-center gap-2"><h3 className="text-sm font-black">AI-assisted care brief</h3><span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-black text-indigo-700 dark:bg-slate-900 dark:text-indigo-300">Requires nurse approval</span></div>
                    <p className="mt-2 text-sm leading-6 text-slate-700 dark:text-slate-300">Pain rose by four points while today’s hydration remains below the daily target. Ask whether the patient has fever, breathing difficulty, chest pain, unusual weakness, or another red-flag symptom before deciding the next action.</p>
                    <div className="mt-3 space-y-1 text-xs font-semibold text-slate-500 dark:text-slate-400"><p>Evidence: today’s synthetic pain check-in, hydration log and medication status.</p><p>Boundary: this brief does not diagnose a crisis or recommend medication changes.</p></div>
                  </div>
                </div>
              </div>

              <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                <button type="button" onClick={() => setBriefApproved(true)} className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 text-sm font-black text-white hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"><Check size={17} /> Approve brief for callback</button>
                <button type="button" className="min-h-12 rounded-2xl border border-slate-300 px-5 text-sm font-black text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">Edit questions</button>
              </div>
              {briefApproved && <p role="status" className="mt-4 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300">Demo action recorded: nurse callback requested. No message was sent.</p>}
            </section>
          </div>
        )}
      </main>
    </div>
  );
};

const ViewButton = ({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) => (
  <button type="button" onClick={onClick} className={`inline-flex min-h-11 items-center gap-2 rounded-xl px-4 text-sm font-black transition ${active ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-300 hover:text-white'}`}>{icon}{label}</button>
);

const ChoiceButton = ({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) => (
  <button type="button" onClick={onClick} className={`min-h-12 rounded-2xl border px-4 text-sm font-black transition ${active ? 'border-red-600 bg-red-50 text-red-700 ring-2 ring-red-100 dark:bg-red-950/25 dark:text-red-300 dark:ring-red-950' : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300'}`}>{label}</button>
);

const Metric = ({ icon, label, value, note, tone }: { icon: React.ReactNode; label: string; value: string; note: string; tone: 'rose' | 'cyan' | 'amber' }) => {
  const tones = { rose: 'bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-300', cyan: 'bg-cyan-50 text-cyan-700 dark:bg-cyan-950/30 dark:text-cyan-300', amber: 'bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300' };
  return <div className="rounded-3xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"><span className={`flex h-10 w-10 items-center justify-center rounded-xl ${tones[tone]}`}>{icon}</span><p className="mt-4 text-xs font-bold text-slate-500 dark:text-slate-400">{label}</p><p className="mt-1 text-xl font-black">{value}</p><p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{note}</p></div>;
};

const SmallStat = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-800/70"><p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{label}</p><p className="mt-1 text-lg font-black">{value}</p></div>
);

