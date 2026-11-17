import React, { useState, useEffect } from 'react';
import { Phone, MessageSquare, AlertTriangle, Edit3, ShieldAlert, Check, UserCheck, Copy, ExternalLink, Send, Activity, Droplets, Pill, Eye } from 'lucide-react';
import { Button, Modal } from './ui';

interface CaregiverInfo {
  name: string;
  relationship: string;
  phone: string;
  altPhone: string;
  hospitalHotline: string;
  notes: string;
  customSosText: string;
}

const EMPTY_CAREGIVER: CaregiverInfo = {
  name: '',
  relationship: '',
  phone: '',
  altPhone: '',
  hospitalHotline: '',
  notes: '',
  customSosText: '',
};

interface DesignatedCaregiverWidgetProps {
  userId?: string;
  currentPainLevel?: number;
}

export const DesignatedCaregiverWidget: React.FC<DesignatedCaregiverWidgetProps> = ({ userId = '', currentPainLevel = 3 }) => {
  const [caregiver, setCaregiver] = useState<CaregiverInfo>(EMPTY_CAREGIVER);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<CaregiverInfo>(EMPTY_CAREGIVER);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [copiedAlert, setCopiedAlert] = useState(false);
  const [showSosModal, setShowSosModal] = useState(false);
  const [showCompanionView, setShowCompanionView] = useState(false);
  const [sosSentStatus, setSosSentStatus] = useState<string | null>(null);
  const storageKey = userId ? `warrior_designated_caregiver_${userId}` : 'warrior_designated_caregiver';
  const hasCaregiver = Boolean(caregiver.name.trim() && caregiver.phone.trim());

  // Read today's logged hydration & medication signals for Trusted Companion Health Linking
  const getTodayCompanionSignals = () => {
    try {
      const waterRaw = localStorage.getItem(userId ? `warrior_water_${userId}` : 'warrior_water');
      const waterMl = waterRaw ? Number(JSON.parse(waterRaw)?.amount ?? 0) : 0;
      const medsRaw = localStorage.getItem(userId ? `warrior_meds_${userId}` : 'warrior_meds');
      const medsList = medsRaw ? JSON.parse(medsRaw) : [];
      const takenCount = Array.isArray(medsList) ? medsList.filter((m: any) => m?.taken).length : 0;
      const totalMeds = Array.isArray(medsList) ? medsList.length : 0;
      return {
        waterLiters: waterMl > 0 ? `${(waterMl / 1000).toFixed(1)}L` : 'Not logged today',
        medsSummary: totalMeds > 0 ? `${takenCount}/${totalMeds} doses taken` : 'Schedule on Home',
      };
    } catch {
      return { waterLiters: 'Not logged today', medsSummary: 'Schedule on Home' };
    }
  };
  const companionSignals = getTodayCompanionSignals();

  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = { ...EMPTY_CAREGIVER, ...JSON.parse(saved) };
        setCaregiver(parsed);
        setFormData(parsed);
      } else {
        setCaregiver(EMPTY_CAREGIVER);
        setFormData(EMPTY_CAREGIVER);
      }
    } catch (e) {
      console.warn('Failed to parse caregiver details from storage:', e);
    }
  }, [storageKey]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setCaregiver(formData);
    try {
      localStorage.setItem(storageKey, JSON.stringify(formData));
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2500);
      setIsEditing(false);
    } catch (err) {
      console.error(err);
    }
  };

  const cleanPhone = (phoneStr: string) => phoneStr.replace(/[^0-9+]/g, '');

  const buildSosMessage = () => {
    const extra = caregiver.customSosText.trim() ? `\nMessage: ${caregiver.customSosText.trim()}` : '';
    const notesLine = caregiver.notes.trim() ? `\nCare Notes: ${caregiver.notes.trim()}` : '';
    return `[WARRIOR.AI TRUSTED COMPANION & SOS ALERT]\nCaregiver: ${caregiver.name || 'Trusted Companion'}\nCurrent Pain Level: ${currentPainLevel}/10\nHydration Today: ${companionSignals.waterLiters}\nMedications: ${companionSignals.medsSummary}${notesLine}${extra}\nTime: ${new Date().toLocaleTimeString()}`;
  };

  const triggerSosBroadcast = () => {
    const text = encodeURIComponent(buildSosMessage());
    const smsUrl = `sms:${cleanPhone(caregiver.phone)}?body=${text}`;
    window.location.href = smsUrl;
    setSosSentStatus('Emergency SMS draft opened for your primary caregiver.');
    setTimeout(() => {
      setShowSosModal(false);
      setSosSentStatus(null);
    }, 2500);
  };

  const copySosSummary = async () => {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(buildSosMessage());
        setCopiedAlert(true);
        setTimeout(() => setCopiedAlert(false), 2000);
      }
    } catch (err) {
      console.warn('Could not copy SOS message:', err);
    }
  };

  return (
    <div className="rounded-[28px] border border-wa-line bg-wa-surface p-5 text-wa-plum shadow-xs sm:p-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span
            aria-hidden="true"
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-wa-rose text-wa-crimson"
          >
            <ShieldAlert size={20} />
          </span>
          <div>
            <h2 className="font-display text-base font-extrabold text-wa-plum sm:text-lg">
              Designated Caregiver
            </h2>
            <p className="text-xs text-wa-plum-muted">
              One-tap emergency assist &amp; trusted family contact
            </p>
          </div>
        </div>

        <button
          type="button"
          data-ui-control
          onClick={() => {
            setFormData(caregiver);
            setIsEditing(true);
          }}
          className="inline-flex min-h-10 items-center gap-1.5 rounded-full border border-wa-line bg-wa-ground px-3.5 text-xs font-bold text-wa-plum transition-colors hover:border-wa-crimson/40 hover:bg-wa-rose/40 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wa-crimson"
        >
          <Edit3 size={14} aria-hidden="true" />
          {hasCaregiver ? 'Edit Info' : 'Add Info'}
        </button>
      </div>

      {savedSuccess && (
        <div
          role="status"
          className="mt-4 flex items-center gap-2 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2.5 text-xs font-bold text-emerald-700 dark:text-emerald-300"
        >
          <Check size={15} aria-hidden="true" />
          Caregiver contact saved on this device.
        </div>
      )}

      {/* Caregiver Summary Card */}
      <div className="mt-5">
        {hasCaregiver ? (
          <div className="space-y-3 rounded-[22px] border border-wa-line-soft bg-wa-ground/70 p-4 dark:bg-white/5">
            <div className="flex flex-col justify-between gap-3 border-b border-wa-line-soft pb-3 sm:flex-row sm:items-center">
              <div className="min-w-0">
                <span className="inline-flex items-center rounded-full bg-wa-rose px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-wa-crimson">
                  Primary Contact
                </span>
                <h3 className="mt-1.5 flex items-center gap-2 font-display text-lg font-extrabold text-wa-plum">
                  <UserCheck size={18} className="shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
                  <span className="truncate">{caregiver.name}</span>
                </h3>
                {caregiver.relationship && (
                  <p className="text-xs font-semibold text-wa-plum-muted">{caregiver.relationship}</p>
                )}
              </div>

              <div className="text-left sm:text-right">
                <span className="block text-[11px] font-bold uppercase tracking-wider text-wa-plum-muted">
                  Phone Number
                </span>
                <a
                  href={`tel:${cleanPhone(caregiver.phone)}`}
                  className="mt-0.5 inline-flex items-center gap-1.5 font-display text-sm font-extrabold text-wa-crimson hover:underline"
                >
                  <Phone size={14} aria-hidden="true" />
                  {caregiver.phone}
                </a>
                {caregiver.altPhone.trim() && (
                  <a
                    href={`tel:${cleanPhone(caregiver.altPhone)}`}
                    className="mt-1 flex items-center gap-1 text-xs font-semibold text-wa-plum-muted hover:text-wa-plum sm:justify-end"
                  >
                    <Phone size={12} aria-hidden="true" />
                    ER / Alt: {caregiver.altPhone}
                  </a>
                )}
              </div>
            </div>

            {caregiver.notes.trim() && (
              <p className="rounded-xl border border-wa-line-soft bg-wa-surface p-3 text-xs leading-relaxed text-wa-plum-muted">
                {caregiver.notes}
              </p>
            )}
          </div>
        ) : (
          <div className="rounded-[22px] border border-dashed border-wa-line bg-wa-ground/60 p-6 text-center dark:bg-white/5">
            <p className="font-display text-sm font-bold text-wa-plum">No designated caregiver recorded</p>
            <p className="mt-1 text-xs text-wa-plum-muted">
              Add a trusted contact before using caregiver call or message actions.
            </p>
            <Button
              variant="primary"
              size="sm"
              className="mt-4"
              onClick={() => {
                setFormData(caregiver);
                setIsEditing(true);
              }}
            >
              Add trusted caregiver
            </Button>
          </div>
        )}
      </div>

      {/* One-Tap Action Buttons */}
      {hasCaregiver && (
        <div className="mt-4 space-y-2.5">
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
            <a
              href={`tel:${cleanPhone(caregiver.phone)}`}
              className="flex flex-col items-center justify-center rounded-2xl bg-emerald-600 p-3.5 text-center text-white shadow-xs transition-all hover:bg-emerald-700 active:scale-[0.98]"
            >
              <Phone size={20} className="mb-1" aria-hidden="true" />
              <span className="text-xs font-bold">Call Now</span>
              <span className="text-[10px] text-white/85">Direct dial</span>
            </a>

            <a
              href={`sms:${cleanPhone(caregiver.phone)}?body=${encodeURIComponent('URGENT: Sickle Cell Pain Crisis Assistance Needed!')}`}
              className="flex flex-col items-center justify-center rounded-2xl bg-wa-water p-3.5 text-center text-white shadow-xs transition-all hover:opacity-90 active:scale-[0.98]"
            >
              <MessageSquare size={20} className="mb-1" aria-hidden="true" />
              <span className="text-xs font-bold">SMS Alert</span>
              <span className="text-[10px] text-white/85">Quick message</span>
            </a>

            <a
              href={`https://wa.me/${cleanPhone(caregiver.phone)}?text=${encodeURIComponent('URGENT: Sickle Cell Crisis Assistance Needed!')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center justify-center rounded-2xl bg-wa-hero p-3.5 text-center text-white shadow-xs transition-all hover:opacity-90 active:scale-[0.98]"
            >
              <ExternalLink size={20} className="mb-1" aria-hidden="true" />
              <span className="text-xs font-bold">WhatsApp</span>
              <span className="text-[10px] text-white/85">Instant chat</span>
            </a>

            <button
              type="button"
              data-ui-control
              onClick={() => setShowSosModal(true)}
              className="flex flex-col items-center justify-center rounded-2xl bg-wa-crimson p-3.5 text-center text-white shadow-xs transition-all hover:bg-wa-crimson-press active:scale-[0.98] cursor-pointer"
            >
              <AlertTriangle size={20} className="mb-1" aria-hidden="true" />
              <span className="text-xs font-bold">Emergency Alert</span>
              <span className="text-[10px] text-white/85">Send crisis alert</span>
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => void copySosSummary()}
              className="inline-flex min-h-10 flex-1 items-center justify-center gap-2 rounded-full border border-wa-line bg-wa-ground px-4 text-xs font-bold text-wa-plum transition-colors hover:bg-wa-rose/30 cursor-pointer"
            >
              <Copy size={14} aria-hidden="true" />
              {copiedAlert ? 'Emergency alert text copied!' : 'Copy emergency alert summary'}
            </button>
            <button
              type="button"
              onClick={() => setShowCompanionView(!showCompanionView)}
              aria-expanded={showCompanionView}
              className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-full border border-wa-line bg-wa-rose/50 px-4 text-xs font-bold text-wa-crimson transition-colors hover:bg-wa-rose cursor-pointer"
            >
              <Eye size={14} aria-hidden="true" />
              <span>{showCompanionView ? 'Hide Companion Live View' : 'Companion Live View'}</span>
            </button>
          </div>

          {/* Trusted Companion Health Linking — Two-Way Live Snapshot Preview */}
          {showCompanionView && (
            <div className="mt-3 rounded-[22px] border border-wa-line bg-wa-ground/80 p-4 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
                    Trusted Companion Health Linking &bull; Live Snapshot
                  </span>
                  <h4 className="mt-1 font-display text-sm font-bold text-wa-plum">
                    What {caregiver.name} receives during check-ins &amp; SOS
                  </h4>
                </div>
                <span className="text-[11px] font-mono text-wa-plum-muted">
                  Synced on device
                </span>
              </div>

              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
                <div className="rounded-2xl border border-wa-line-soft bg-wa-surface p-3">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-wa-plum-muted">
                    <Activity size={13} className="text-wa-crimson" />
                    <span>Pain Signal</span>
                  </div>
                  <p className="mt-1 font-display text-base font-extrabold text-wa-plum">
                    {currentPainLevel}/10
                  </p>
                </div>
                <div className="rounded-2xl border border-wa-line-soft bg-wa-surface p-3">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-wa-plum-muted">
                    <Droplets size={13} className="text-wa-water" />
                    <span>Hydration Today</span>
                  </div>
                  <p className="mt-1 font-display text-base font-extrabold text-wa-plum">
                    {companionSignals.waterLiters}
                  </p>
                </div>
                <div className="rounded-2xl border border-wa-line-soft bg-wa-surface p-3">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-wa-plum-muted">
                    <Pill size={13} className="text-emerald-600" />
                    <span>Daily Meds</span>
                  </div>
                  <p className="mt-1 font-display text-sm font-extrabold text-wa-plum">
                    {companionSignals.medsSummary}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-1">
                <a
                  href={`https://wa.me/${cleanPhone(caregiver.phone)}?text=${encodeURIComponent(buildSosMessage())}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-9 items-center gap-1.5 rounded-full bg-[var(--wa-hero)] px-3.5 text-xs font-bold text-white transition hover:opacity-90"
                >
                  <ExternalLink size={13} aria-hidden="true" />
                  <span>Share Live Snapshot on WhatsApp</span>
                </a>
                <a
                  href={`sms:${cleanPhone(caregiver.phone)}?body=${encodeURIComponent(buildSosMessage())}`}
                  className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-wa-line bg-wa-surface px-3.5 text-xs font-bold text-wa-plum transition hover:border-wa-crimson"
                >
                  <MessageSquare size={13} aria-hidden="true" />
                  <span>Send Snapshot via SMS</span>
                </a>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Edit Caregiver Modal */}
      <Modal
        open={isEditing}
        onOpenChange={setIsEditing}
        title="Edit Caregiver & Emergency Contact"
        description="Stored locally on this device for quick emergency calls and alerts."
        size="md"
      >
        <form onSubmit={handleSave} className="space-y-4 text-sm">
          <div>
            <label className="mb-1 block text-xs font-bold text-wa-plum">Caregiver Full Name</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Caregiver or trusted contact name"
              className="min-h-11 w-full rounded-xl border border-wa-line bg-wa-surface px-3.5 text-sm text-wa-plum placeholder:text-wa-plum-muted focus:border-wa-crimson focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-bold text-wa-plum">Relationship</label>
              <input
                type="text"
                required
                value={formData.relationship}
                onChange={(e) => setFormData({ ...formData, relationship: e.target.value })}
                placeholder="e.g. Spouse / Primary Support"
                className="min-h-11 w-full rounded-xl border border-wa-line bg-wa-surface px-3.5 text-sm text-wa-plum placeholder:text-wa-plum-muted focus:border-wa-crimson focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold text-wa-plum">Primary Phone Number</label>
              <input
                type="text"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="Include country code"
                className="min-h-11 w-full rounded-xl border border-wa-line bg-wa-surface px-3.5 text-sm text-wa-plum placeholder:text-wa-plum-muted focus:border-wa-crimson focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-bold text-wa-plum">Hospital ER Hotline / Alternate Contact</label>
            <input
              type="text"
              value={formData.altPhone}
              onChange={(e) => setFormData({ ...formData, altPhone: e.target.value })}
              placeholder="Optional alternate contact number"
              className="min-h-11 w-full rounded-xl border border-wa-line bg-wa-surface px-3.5 text-sm text-wa-plum placeholder:text-wa-plum-muted focus:border-wa-crimson focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-bold text-wa-plum">Care Notes &amp; Medical Guidance</label>
            <textarea
              rows={2}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Notes about blood type, clinical passport location, or key house access..."
              className="w-full rounded-xl border border-wa-line bg-wa-surface p-3 text-sm text-wa-plum placeholder:text-wa-plum-muted focus:border-wa-crimson focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-bold text-wa-plum">Custom Emergency Message</label>
            <textarea
              rows={2}
              value={formData.customSosText}
              onChange={(e) => setFormData({ ...formData, customSosText: e.target.value })}
              placeholder="Optional message for the SMS draft"
              className="w-full rounded-xl border border-wa-line bg-wa-surface p-3 text-sm text-wa-plum placeholder:text-wa-plum-muted focus:border-wa-crimson focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setIsEditing(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" leadingIcon={<Check size={16} />}>
              Save Caregiver Profile
            </Button>
          </div>
        </form>
      </Modal>

      {/* SOS Confirmation Modal */}
      <Modal
        open={showSosModal}
        onOpenChange={setShowSosModal}
        title="Confirm Emergency Alert"
        description={`Primary Caregiver: ${caregiver.name}`}
        size="sm"
      >
        <div className="space-y-4">
          <p className="rounded-2xl border border-wa-line-soft bg-wa-ground p-3.5 text-xs leading-relaxed text-wa-plum dark:bg-white/5">
            Sending crisis SMS draft to <strong>{caregiver.phone}</strong> with your current pain level ({currentPainLevel}/10).
          </p>

          {sosSentStatus ? (
            <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-3 text-center text-xs font-bold text-emerald-700 dark:text-emerald-300">
              {sosSentStatus}
            </div>
          ) : (
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button type="button" variant="secondary" onClick={() => setShowSosModal(false)}>
                Cancel
              </Button>
              <Button
                type="button"
                variant="danger"
                leadingIcon={<Send size={15} />}
                onClick={triggerSosBroadcast}
              >
                Send Emergency Alert Now
              </Button>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};
