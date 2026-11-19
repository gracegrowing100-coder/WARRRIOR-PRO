import React, { useState, useEffect } from 'react';
import { ArrowLeft, CalendarDays, ChevronRight, ClipboardList, HeartPulse, Pill, Sparkles, Download, Share2, Check, MapPin, Phone, Search, Building2, ExternalLink } from 'lucide-react';
import { CareVault } from '../CareVault';
import { HealthHistory } from '../health';
import { HistoryErrorBoundary } from '../health/HistoryErrorBoundary';
import { PageHeader } from '../layout';
import { Button, SosPill } from '../ui';
import { firebaseService } from '../../services/firebaseService';

type CareView = 'overview' | 'history' | 'records' | 'directory';

interface ScdDirectoryFacility {
  id: string;
  name: string;
  city: 'Lagos' | 'Abuja' | 'Ogun';
  type: 'SCD Clinics' | 'Hydroxyurea Pharmacies' | 'Emergency & NGOs';
  area: string;
  askAbout: string;
}

// Starting list of public institutions only. Phone numbers, opening hours and medicine stock
// are intentionally NOT stored here: they have not been verified and change often. Patients are
// directed to Google Maps for current contact details and told to confirm before travelling.
const SCD_CARE_DIRECTORY: ScdDirectoryFacility[] = [
  {
    id: 'luth-lagos',
    name: 'Lagos University Teaching Hospital (LUTH)',
    city: 'Lagos',
    type: 'SCD Clinics',
    area: 'Idi-Araba, Surulere, Lagos',
    askAbout: 'Ask the haematology clinic about sickle cell follow-up and hydroxyurea prescribing.'
  },
  {
    id: 'scfn-lagos',
    name: 'Sickle Cell Foundation Nigeria',
    city: 'Lagos',
    type: 'Emergency & NGOs',
    area: 'Idi-Araba, Surulere, Lagos',
    askAbout: 'Ask about genotype testing, counselling and patient support programmes.'
  },
  {
    id: 'lasuth-ikeja',
    name: 'Lagos State University Teaching Hospital (LASUTH)',
    city: 'Lagos',
    type: 'SCD Clinics',
    area: 'Ikeja, Lagos',
    askAbout: 'Ask the haematology clinic and hospital pharmacy about hydroxyurea refills.'
  },
  {
    id: 'national-hosp-abuja',
    name: 'National Hospital Abuja',
    city: 'Abuja',
    type: 'SCD Clinics',
    area: 'Central Business District, Abuja',
    askAbout: 'Ask the haematology department about sickle cell clinic days and referrals.'
  },
  {
    id: 'fmc-abeokuta',
    name: 'Federal Medical Centre Abeokuta',
    city: 'Ogun',
    type: 'SCD Clinics',
    area: 'Idi-Aba, Abeokuta, Ogun State',
    askAbout: 'Ask the haematology clinic about sickle cell follow-up and medicine access.'
  },
  {
    id: 'oouth-sagamu',
    name: 'Olabisi Onabanjo University Teaching Hospital (OOUTH)',
    city: 'Ogun',
    type: 'SCD Clinics',
    area: 'Sagamu, Ogun State',
    askAbout: 'Ask the haematology clinic and hospital pharmacy about hydroxyurea refills.'
  }
];

export interface CareHubProps {
  userId: string;
  onOpenAppointments: () => void;
}

export const CareHub: React.FC<CareHubProps> = ({ userId, onOpenAppointments }) => {
  const [view, setView] = useState<CareView>('overview');
  const [stats, setStats] = useState<{ count: number; avgPain: string | null }>({ count: 0, avgPain: null });
  const [copied, setCopied] = useState(false);

  // SCD Clinic, Pharmacy & Hydroxyurea Access Directory state
  const [dirCity, setDirCity] = useState<'All' | 'Lagos' | 'Abuja' | 'Ogun'>('All');
  const [dirType, setDirType] = useState<'All' | 'SCD Clinics' | 'Hydroxyurea Pharmacies' | 'Emergency & NGOs'>('All');
  const [dirSearch, setDirSearch] = useState('');
  const huStorageKey = `warrior_hydroxyurea_tracker_${userId || 'guest'}`;
  const [huTracker, setHuTracker] = useState<{
    status: string;
    daysRemaining: string;
    preferredFacility: string;
  }>(() => {
    try {
      const saved = localStorage.getItem(huStorageKey);
      return saved
        ? JSON.parse(saved)
        : { status: 'Prescribed & Active', daysRemaining: '14', preferredFacility: '' };
    } catch {
      return { status: 'Prescribed & Active', daysRemaining: '14', preferredFacility: '' };
    }
  });
  const [huSaved, setHuSaved] = useState(false);

  const handleSaveHuTracker = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      localStorage.setItem(huStorageKey, JSON.stringify(huTracker));
      setHuSaved(true);
      setTimeout(() => setHuSaved(false), 2500);
    } catch {
      // ignore storage errors
    }
  };

  useEffect(() => {
    let active = true;
    if (typeof firebaseService?.getPainLogs === 'function') {
      void firebaseService.getPainLogs(userId).then((logs) => {
        if (!active || !Array.isArray(logs)) return;
        const valid = logs.filter((l) => typeof l.painLevel === 'number');
        const total = valid.reduce((sum, cur) => sum + (cur.painLevel || 0), 0);
        setStats({
          count: valid.length,
          avgPain: valid.length > 0 ? (total / valid.length).toFixed(1) : null,
        });
      }).catch(() => {
        // Graceful offline fallback
      });
    }
    return () => { active = false; };
  }, [userId]);

  const handleShareReport = async () => {
    const text = `Warrior AI Health Report — ${new Date().toLocaleDateString()}\n\nSummary (Last 30 Days):\n- Recorded Entries: ${stats.count}\n- Average Pain: ${stats.avgPain ? `${stats.avgPain}/10` : 'Not recorded'}\n\nGenerated by Warrior AI for clinical consultation support.`;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Ignore clipboard write failure
    }
  };

  const handleDownloadCSV = async () => {
    try {
      if (typeof firebaseService?.getPainLogs !== 'function') return;
      const logs = await firebaseService.getPainLogs(userId);
      const rows = [
        ['Date', 'Pain Level', 'Symptoms', 'Triggers'],
        ...(Array.isArray(logs) ? logs : []).map((l: any) => [
          l.dateStr || '',
          l.painLevel ?? '',
          Array.isArray(l.symptoms) ? l.symptoms.join('; ') : '',
          Array.isArray(l.triggers) ? l.triggers.join('; ') : '',
        ]),
      ];
      const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `warrior-care-records-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.warn('Failed to export records CSV:', e);
    }
  };

  if (view === 'history') {
    return (
      <HistoryErrorBoundary message="We couldn't load your health history. Your records are safe on this device." resetKey={userId}>
        <div className="space-y-4">
          <HealthHistory userId={userId} onBack={() => setView('overview')} />
        </div>
      </HistoryErrorBoundary>
    );
  }

  if (view === 'records') {
    return (
      <HistoryErrorBoundary message="We couldn't load your medical records. Your entries are safe on this device." resetKey={userId}>
        <div className="space-y-6">
          <Button variant="ghost" leadingIcon={<ArrowLeft size={18} />} onClick={() => setView('overview')}>
            Back to Care
          </Button>
          <CareVault userId={userId} />
        </div>
      </HistoryErrorBoundary>
    );
  }

  if (view === 'directory') {
    const filteredFacilities = SCD_CARE_DIRECTORY.filter((f) => {
      const matchesCity = dirCity === 'All' || f.city === dirCity;
      const matchesType = dirType === 'All' || f.type === dirType;
      const q = dirSearch.trim().toLowerCase();
      const matchesQuery =
        !q ||
        f.name.toLowerCase().includes(q) ||
                f.area.toLowerCase().includes(q) ||
        f.askAbout.toLowerCase().includes(q);
      return matchesCity && matchesType && matchesQuery;
    });

    const daysLeftNum = Number(huTracker.daysRemaining);
    const needsRefillSoon = !Number.isNaN(daysLeftNum) && daysLeftNum >= 0 && daysLeftNum <= 7;

    return (
      <div className="space-y-6">
        <Button variant="ghost" leadingIcon={<ArrowLeft size={18} />} onClick={() => setView('overview')}>
          Back to Care
        </Button>

        {/* Plum Hero Header */}
        <div className="rounded-[28px] bg-[var(--wa-hero)] p-5 sm:p-6 text-white space-y-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-[#FFC7D0]">
            Lagos &bull; Abuja &bull; Ogun Care Navigation
          </span>
          <h1 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            SCD Clinics, Pharmacies &amp; Hydroxyurea Access
          </h1>
          <p className="text-xs sm:text-sm text-[#D9B9CC] max-w-2xl leading-relaxed">
            A starting list of public hospitals with haematology services, plus a personal tracker for your Hydroxyurea supply. Always confirm details before you travel.
          </p>
        </div>

        {/* Personal Hydroxyurea & Routine Refill Access Tracker */}
        <form
          onSubmit={handleSaveHuTracker}
          className="rounded-[28px] border border-wa-line bg-wa-surface p-5 sm:p-6 text-wa-plum shadow-xs space-y-4"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-wa-rose text-wa-crimson">
                <Pill size={20} />
              </span>
              <div>
                <h2 className="font-display text-base sm:text-lg font-extrabold text-wa-plum">
                  Hydroxyurea &amp; Routine Supply Tracker
                </h2>
                <p className="text-xs text-wa-plum-muted">
                  Personal refill planning (only follow dosages prescribed by your hematologist)
                </p>
              </div>
            </div>
            {needsRefillSoon && (
              <span className="rounded-full bg-amber-500/15 border border-amber-500/40 px-3 py-1 text-xs font-bold text-amber-800 dark:text-amber-300">
                Refill due in {huTracker.daysRemaining} days
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-xs font-bold text-wa-plum">Access Status</label>
              <select
                value={huTracker.status}
                onChange={(e) => setHuTracker({ ...huTracker, status: e.target.value })}
                className="min-h-11 w-full rounded-xl border border-wa-line bg-wa-ground px-3 text-xs font-bold text-wa-plum focus:border-wa-crimson focus:outline-none"
              >
                <option value="Prescribed & Active">Prescribed &amp; Active</option>
                <option value="Refill Needed Soon">Refill Needed Soon</option>
                <option value="Discussing with Hematologist">Discussing with Hematologist</option>
                <option value="Seeking Subsidized Access">Seeking Subsidized Access</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold text-wa-plum">Days of Supply Left</label>
              <input
                type="number"
                min="0"
                max="365"
                value={huTracker.daysRemaining}
                onChange={(e) => setHuTracker({ ...huTracker, daysRemaining: e.target.value })}
                className="min-h-11 w-full rounded-xl border border-wa-line bg-wa-ground px-3.5 text-xs font-bold text-wa-plum focus:border-wa-crimson focus:outline-none"
                placeholder="e.g. 14"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold text-wa-plum">Preferred Clinic / Pharmacy</label>
              <input
                type="text"
                value={huTracker.preferredFacility}
                onChange={(e) => setHuTracker({ ...huTracker, preferredFacility: e.target.value })}
                className="min-h-11 w-full rounded-xl border border-wa-line bg-wa-ground px-3.5 text-xs font-semibold text-wa-plum focus:border-wa-crimson focus:outline-none"
                placeholder="e.g. LUTH Idi-Araba / National Hospital"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            <span className="text-[11px] text-wa-plum-muted">
              Saved on this device to help you plan refills and routine FBC blood checks.
            </span>
            <Button type="submit" size="sm" leadingIcon={<Check size={15} />}>
              {huSaved ? 'Saved Supply Plan' : 'Save Refill Plan'}
            </Button>
          </div>
        </form>

        {/* Directory Filters */}
        <div className="rounded-[28px] border border-wa-line bg-wa-surface p-4 sm:p-5 space-y-3.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-1.5">
              {(['All', 'Lagos', 'Abuja', 'Ogun'] as const).map((city) => (
                <button
                  key={city}
                  type="button"
                  onClick={() => setDirCity(city)}
                  className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition cursor-pointer ${
                    dirCity === city
                      ? 'bg-[var(--wa-hero)] text-white shadow-2xs'
                      : 'bg-wa-ground text-wa-plum-muted border border-wa-line hover:text-wa-plum'
                  }`}
                >
                  {city === 'All' ? 'All States' : city}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              {(['All', 'SCD Clinics', 'Emergency & NGOs'] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setDirType(type)}
                  className={`rounded-full px-3 py-1 text-[11px] font-bold transition cursor-pointer ${
                    dirType === type
                      ? 'bg-wa-crimson text-white'
                      : 'bg-wa-ground text-wa-plum-muted border border-wa-line hover:text-wa-plum'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          <div className="relative">
            <Search size={15} className="absolute left-3.5 top-3 text-wa-plum-muted" />
            <input
              type="text"
              value={dirSearch}
              onChange={(e) => setDirSearch(e.target.value)}
              placeholder="Search hospital or area (e.g. Surulere, Ikeja, Abeokuta)..."
              className="w-full rounded-full border border-wa-line bg-wa-ground py-2.5 pl-9 pr-4 text-xs font-medium text-wa-plum placeholder:text-wa-plum-muted/60 focus:border-wa-crimson focus:outline-none"
            />
          </div>
        </div>

        <div role="note" className="flex items-start gap-2.5 rounded-[20px] border border-amber-500/40 bg-amber-500/10 p-4 text-xs text-wa-plum">
          <Phone size={15} className="mt-0.5 shrink-0 text-wa-crimson" />
          <p className="leading-relaxed">
            <strong>Confirm before you travel.</strong> This list has not been checked with each hospital. Clinic days and medicine stock change often, so open Google Maps for current phone numbers. In an emergency, call <a href="tel:112" className="font-bold underline">112</a> or go to the nearest emergency unit.
          </p>
        </div>

        {/* Directory Cards */}
        {filteredFacilities.length === 0 && (
          <p className="rounded-[20px] border border-wa-line bg-wa-surface p-4 text-xs text-wa-plum-muted">
            No hospitals match this search yet. Try another area, or search Google Maps for haematology clinics near you.
          </p>
        )}
        <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2">
          {filteredFacilities.map((facility) => (
            <div
              key={facility.id}
              className="flex flex-col justify-between rounded-[24px] border border-wa-line bg-wa-surface p-5 text-wa-plum shadow-2xs space-y-3.5"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="rounded-full bg-wa-rose px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-wa-crimson">
                    {facility.type}
                  </span>
                  <span className="rounded-full border border-wa-line bg-wa-ground px-2.5 py-0.5 text-[11px] font-bold text-wa-plum">
                    {facility.city}
                  </span>
                </div>
                <h3 className="font-display text-base font-extrabold text-wa-plum">
                  {facility.name}
                </h3>
                <p className="flex items-start gap-1.5 text-xs text-wa-plum-muted">
                  <MapPin size={14} className="mt-0.5 shrink-0 text-wa-crimson" />
                  <span>{facility.area}</span>
                </p>
                <p className="rounded-xl border border-wa-line-soft bg-wa-ground/70 p-2.5 text-xs text-wa-plum-muted leading-relaxed">
                  {facility.askAbout}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-wa-line-soft">
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${facility.name} ${facility.area}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-10 flex-1 items-center justify-center gap-1.5 rounded-full bg-wa-crimson px-4 text-xs font-bold text-white transition hover:bg-wa-crimson-press"
                >
                  <ExternalLink size={13} />
                  <span>Contact &amp; directions</span>
                </a>
                <button
                  type="button"
                  onClick={() => {
                    setHuTracker((prev) => ({ ...prev, preferredFacility: facility.name }));
                  }}
                  className="inline-flex min-h-10 items-center justify-center rounded-full border border-wa-line bg-wa-surface px-3 text-[11px] font-bold text-wa-plum-muted hover:text-wa-plum cursor-pointer"
                >
                  Set Preferred
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-7" data-semantic>
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-[28px] sm:text-[34px] font-extrabold tracking-[-0.02em] text-wa-plum dark:text-white leading-tight">
            Care
          </h1>
          <p className="mt-1 text-sm sm:text-[15px] text-wa-plum-muted dark:text-wa-on-plum-muted">
            Your records, appointments and what to show your doctor.
          </p>
        </div>
        <SosPill className="md:hidden" onClick={() => document.getElementById('emergency-fab')?.click()} />
      </div>

      <section aria-label="Care destinations" className="space-y-4 sm:space-y-5">
        {/* 1. Health History Hero Card */}
        <button
          type="button"
          onClick={() => setView('history')}
          aria-label="Review history: Health history"
          className="group relative flex min-h-20 w-full flex-col justify-between overflow-hidden rounded-[28px] bg-[var(--wa-hero)] p-5 sm:p-6 text-left text-white shadow-none transition-all hover:brightness-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--wa-hero)]"
        >
          {/* Watermark brand icon */}
          <div aria-hidden="true" className="pointer-events-none absolute -bottom-8 -right-6 h-44 w-32 opacity-10 text-wa-coral">
            <svg viewBox="14 2 72 96" className="h-full w-full fill-current">
              <path fillRule="evenodd" d="M50 6C50 6 82 42 82 63A32 32 0 0 1 18 63C18 42 50 6 50 6ZM50 40L44.5 56.5L28 62L44.5 67.5L50 84L55.5 67.5L72 62L55.5 56.5Z" />
            </svg>
          </div>

          <div className="relative z-10 flex items-start justify-between gap-3">
            <div>
              <div className="font-display text-[22px] sm:text-2xl font-extrabold leading-tight text-white">
                Health history
              </div>
              <p className="mt-1 text-sm text-[#D9B9CC]">
                Pain, symptoms, water and check-ins you recorded
              </p>
            </div>
            <span aria-hidden="true" className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/10 text-wa-coral group-hover:translate-x-0.5 transition-transform">
              <ChevronRight size={20} />
            </span>
          </div>

          {/* Sparkline Visualization */}
          <div aria-hidden="true" className="relative z-10 my-4 h-12 w-full">
            <svg viewBox="0 0 320 48" className="h-full w-full overflow-visible" preserveAspectRatio="none">
              <polyline
                points="0,28 30,24 60,24 90,16 120,8 150,16 180,24 230,32 260,38 290,38 320,38"
                fill="none"
                stroke="#E8344F"
                strokeWidth="3"
                strokeLinejoin="round"
                strokeLinecap="round"
              />
            </svg>
          </div>

          {/* Quick Stats Badges */}
          <div className="relative z-10 flex flex-wrap gap-2 text-xs font-semibold">
            <span className="inline-flex h-7 items-center rounded-full bg-white/10 px-3 text-[#FFC7D0]">
              {stats.count > 0 ? `${stats.count} entries · 30 days` : '30 days · patient recorded'}
            </span>
            <span className="inline-flex h-7 items-center rounded-full bg-white/10 px-3 text-white">
              {stats.avgPain ? `Avg pain ${stats.avgPain}` : 'Baseline tracking'}
            </span>
          </div>
        </button>

        {/* 2. Appointments Card */}
        <div className="rounded-[28px] border border-wa-line-soft bg-wa-surface p-5 text-wa-plum shadow-none dark:border-white/10 dark:bg-white/5 dark:text-white">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-display text-lg sm:text-xl font-bold">Appointments</h2>
            <button
              type="button"
              onClick={onOpenAppointments}
              className="inline-flex h-9 items-center rounded-full bg-wa-hero px-4 text-xs font-bold text-white transition-all hover:bg-wa-hero/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wa-crimson"
            >
              + Request
            </button>
          </div>

          <button
            type="button"
            onClick={onOpenAppointments}
            aria-label="Manage appointments: Appointments"
            className="group mt-4 flex w-full items-center gap-3.5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wa-crimson rounded-2xl"
          >
            <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-[18px] bg-wa-rose text-wa-crimson">
              <CalendarDays size={22} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm sm:text-base font-bold text-wa-plum dark:text-white group-hover:text-wa-crimson transition-colors">
                Request &amp; manage appointments
              </div>
              <div className="truncate text-xs text-wa-plum-muted dark:text-wa-on-plum-muted mt-0.5">
                Doctor, Clinical Hematologist, or Mental Health Therapist
              </div>
            </div>
            <ChevronRight size={18} className="text-wa-plum-muted group-hover:text-wa-crimson transition-colors shrink-0" />
          </button>

          {/* 3-Step Workflow Guide */}
          <div className="mt-4 grid grid-cols-3 gap-2 text-[11px] font-semibold">
            <div className="space-y-1.5">
              <div className="h-1.5 rounded-full bg-wa-crimson/80" />
              <span className="text-wa-plum dark:text-white">1. Request</span>
            </div>
            <div className="space-y-1.5">
              <div className="h-1.5 rounded-full bg-wa-line-soft dark:bg-white/10" />
              <span className="text-wa-plum-muted dark:text-wa-on-plum-muted">2. Clinic review</span>
            </div>
            <div className="space-y-1.5">
              <div className="h-1.5 rounded-full bg-wa-line-soft dark:bg-white/10" />
              <span className="text-wa-plum-muted dark:text-wa-on-plum-muted">3. Visit / Call</span>
            </div>
          </div>
        </div>

        {/* 3. Medical Records Card */}
        <button
          type="button"
          onClick={() => setView('records')}
          aria-label="Open records: Medical records"
          className="group flex w-full items-center gap-3.5 rounded-[28px] border border-wa-line-soft bg-wa-surface p-4 sm:p-5 text-left text-wa-plum shadow-none transition-all hover:bg-wa-ground/60 dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wa-crimson"
        >
          <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-[18px] bg-wa-ground dark:bg-white/10 text-wa-crimson shadow-none">
            <ClipboardList size={22} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block font-display text-base sm:text-lg font-bold">Medical records</span>
            <span className="mt-0.5 block text-xs text-wa-plum-muted dark:text-wa-on-plum-muted">Genotype, treatments, care history</span>
          </span>
          <ChevronRight size={20} className="text-wa-crimson group-hover:translate-x-0.5 transition-transform shrink-0" />
        </button>

        {/* 3.5 SCD-Aware Clinic, Pharmacy & Hydroxyurea Access Directory */}
        <button
          type="button"
          onClick={() => setView('directory')}
          aria-label="Open directory: SCD clinics, pharmacies and Hydroxyurea access"
          className="group flex w-full items-center gap-3.5 rounded-[28px] border border-wa-line-soft bg-wa-surface p-4 sm:p-5 text-left text-wa-plum shadow-none transition-all hover:bg-wa-ground/60 dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wa-crimson cursor-pointer"
        >
          <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-[18px] bg-wa-rose text-wa-crimson">
            <Building2 size={22} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="flex flex-wrap items-center gap-2">
              <span className="font-display text-base sm:text-lg font-bold">SCD clinics, pharmacies &amp; Hydroxyurea access</span>
              <span className="rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
                Lagos &bull; Abuja &bull; Ogun
              </span>
            </span>
            <span className="mt-0.5 block text-xs text-wa-plum-muted dark:text-wa-on-plum-muted">
              Public SCD care centres to ask about, plus personal Hydroxyurea refill tracking
            </span>
          </span>
          <ChevronRight size={20} className="text-wa-crimson group-hover:translate-x-0.5 transition-transform shrink-0" />
        </button>

        {/* 4. Report for Your Doctor Card */}
        <div className="rounded-[28px] border border-wa-line-soft bg-wa-rose p-5 text-wa-plum shadow-none dark:border-white/10 dark:bg-white/5 dark:text-white">
          <div className="flex items-center gap-2">
            <Sparkles className="text-wa-crimson shrink-0" size={18} />
            <h2 className="font-display text-base sm:text-lg font-bold">Report for your doctor</h2>
          </div>
          <p className="mt-2 text-xs sm:text-sm leading-relaxed text-wa-plum/90 dark:text-wa-on-plum-muted">
            A one-page summary of the last 30 days: pain, triggers, water and medicines. Patterns are from your records, not a diagnosis.
          </p>
          <div className="mt-4 flex gap-2.5">
            <button
              type="button"
              onClick={handleShareReport}
              className="inline-flex h-11 flex-1 items-center justify-center gap-1.5 rounded-full bg-wa-crimson px-4 text-xs font-bold text-white transition-all hover:bg-wa-crimson-press shadow-sm"
            >
              {copied ? <Check size={14} className="text-white" /> : <Share2 size={14} />}
              <span>{copied ? 'Copied' : 'Share'}</span>
            </button>
            <button
              type="button"
              onClick={handleDownloadCSV}
              className="inline-flex h-11 flex-1 items-center justify-center gap-1.5 rounded-full border border-wa-plum/30 bg-transparent px-4 text-xs font-bold text-wa-plum dark:text-white dark:border-white/20 transition-all hover:bg-white/20"
            >
              <Download size={14} />
              <span>Download</span>
            </button>
          </div>
        </div>

        {/* About Your Records Disclaimer */}
        <div className="flex items-start gap-3 rounded-[20px] bg-wa-ground/60 dark:bg-white/5 p-4 border border-wa-line-soft/80 dark:border-white/10 text-xs text-wa-plum-muted dark:text-wa-on-plum-muted">
          <Pill size={16} aria-hidden="true" className="mt-0.5 shrink-0 text-wa-crimson" />
          <p className="leading-relaxed">
            Medication scheduling stays on Home. Care does not estimate missing doses or add generated predictions to your recorded history.
          </p>
        </div>
      </section>
    </div>
  );
};
