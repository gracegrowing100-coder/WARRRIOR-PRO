import React, { useEffect, useRef, useState } from 'react';
import {
  AlertTriangle,
  Building2,
  Check,
  ChevronDown,
  Copy,
  Download,
  Eye,
  FlaskConical,
  HeartPulse,
  Pencil,
  Phone,
  PhoneCall,
  Pill,
  Plus,
  RotateCcw,
  ShieldCheck,
  Stethoscope,
  Trash2,
  X,
} from 'lucide-react';
import { firebaseService } from '../../services/firebaseService';
import {
  displayValue,
  fieldPatch,
  fieldValue,
  hasMedicalInformation,
  isRecord,
  mergeMedicalRecords,
  recordSections,
  type MedicalRecordData,
  type RecordField,
  type RecordSection,
} from '../../services/medicalRecords';
import { generateClinicalPassportPDF } from '../../services/pdfPassportService';
import { Alert, Button, FormField, Modal, SelectInput, Skeleton, Textarea, TextInput } from '../ui';
import { EXAMPLE_MEDICAL_RECORD, SHOW_MEDICAL_RECORDS_EXAMPLE } from './medicalRecordsExample';

interface GroupDefinition {
  title: string;
  category: string;
  keys: string[];
  icon: React.ComponentType<{ size?: number; className?: string; 'aria-hidden'?: boolean | 'true' | 'false' }>;
  iconClass: string;
  description: string;
}

const groups: GroupDefinition[] = [
  {
    title: 'Health background',
    category: 'background',
    keys: ['background', 'otherConditions'],
    icon: HeartPulse,
    iconClass: 'bg-wa-rose text-wa-crimson',
    description: 'Diagnosis, allergies and other conditions',
  },
  {
    title: 'Medicines & treatment',
    category: 'medications',
    keys: ['medications', 'therapy'],
    icon: Pill,
    iconClass: 'bg-wa-rose text-wa-crimson',
    description: 'What you take or took, and how hydroxyurea is working',
  },
  {
    title: 'Hospital & procedures',
    category: 'procedures',
    keys: ['surgeries', 'hospitalizations', 'transfusions'],
    icon: Building2,
    iconClass: 'bg-wa-sun-soft text-wa-sun-ink dark:text-amber-300',
    description: 'Admissions, surgeries and blood transfusions',
  },
  {
    title: 'Blood tests',
    category: 'labs',
    keys: ['labs'],
    icon: FlaskConical,
    iconClass: 'bg-wa-water-soft text-wa-water-ink dark:text-wa-water-bright',
    description: 'Steady-state Hb, PCV, E/U/Cr and other results',
  },
  {
    title: 'Vaccines',
    category: 'immunizations',
    keys: ['immunizations'],
    icon: ShieldCheck,
    iconClass: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
    description: 'Pneumococcal, meningococcal, flu and others',
  },
  {
    title: 'Care team & emergency plan',
    category: 'care',
    keys: ['care'],
    icon: PhoneCall,
    iconClass: 'bg-wa-water-soft text-wa-water-ink dark:text-wa-water-bright',
    description: 'Your clinic contact, pain plan and what to tell the ER',
  },
];

/** One-line hints shown under each section title and in its edit form. */
const sectionHints: Record<string, string> = {
  background: 'Your genotype or diagnosis and any allergies, as your clinic recorded them.',
  otherConditions: 'Other long-term conditions, e.g. avascular necrosis or gallstones.',
  medications: 'Use the dose on your prescription or clinic card.',
  therapy: 'How hydroxyurea is working for you, your latest HbF, and any chelation.',
  surgeries: 'Past operations help surgical and anaesthetic teams plan safely.',
  hospitalizations: 'Admissions for crises, acute chest syndrome or infections.',
  transfusions: 'Past transfusions and any reactions help with safe cross-matching.',
  labs: 'Results from a well (steady-state) day give doctors your baseline to compare against.',
  immunizations: 'Vaccines you have had, with the year if you know it.',
  care: 'Who to call, your usual pain plan, and a short note for emergency staff.',
};

/** Which field names an entry in its card header. */
const primaryFieldKey: Record<string, string> = {
  medications: 'name',
  surgeries: 'name',
  hospitalizations: 'reason',
  transfusions: 'date',
  labs: 'date',
};

const USES = [
  { icon: AlertTriangle, text: 'Show emergency staff your diagnosis, allergies and pain plan in seconds.' },
  { icon: FlaskConical, text: 'Keep your steady-state blood results so doctors can compare during a crisis.' },
  { icon: Download, text: 'Download one summary to take to a new clinic or hospital.' },
];

const fieldsFor = (section: RecordSection): RecordField[] => section.stringList
  ? [{ key: 'value', label: section.title === 'Conditions' ? 'Condition' : 'Immunization information', required: true }]
  : section.fields ?? [];

const isRecorded = (value: unknown) => displayValue(value) !== 'Not recorded';
const isDateField = (key: string) => /(^|\.)(date|startDate|endDate)$/.test(key);

const formatValue = (key: string, value: unknown) => {
  if (isDateField(key) && typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const parsed = new Date(`${value}T12:00:00`);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
    }
  }
  return displayValue(value);
};

interface Editor {
  section: RecordSection;
  index?: number;
  draft: Record<string, string>;
}

export const MedicalRecords: React.FC<{ userId: string }> = ({ userId }) => {
  const [data, setData] = useState<MedicalRecordData>({});
  const [readState, setReadState] = useState<'loading' | 'recorded' | 'cached' | 'empty' | 'unavailable'>('loading');
  const [reload, setReload] = useState(0);
  const [showExample, setShowExample] = useState(false);
  const [editor, setEditor] = useState<Editor | null>(null);
  const [deletion, setDeletion] = useState<{ section: RecordSection; index: number } | null>(null);
  const [clearConfirmOpen, setClearConfirmOpen] = useState(false);
  const [copiedER, setCopiedER] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [exporting, setExporting] = useState(false);
  const busy = useRef(false);
  const triggerRef = useRef<HTMLElement | null>(null);
  const removalFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    let active = true;
    setReadState('loading');
    firebaseService.getCareVaultResult(userId).then(result => {
      if (active) { setData(result.data); setReadState(result.state); }
    }).catch(() => { if (active) setReadState('unavailable'); });
    return () => { active = false; };
  }, [userId, reload]);

  useEffect(() => {
    if (!editor) triggerRef.current?.focus();
  }, [editor?.section.key, editor?.index]);

  useEffect(() => {
    if (!deletion) removalFocusRef.current?.focus();
  }, [deletion]);

  // The example is only ever rendered, never saved; every write path uses `data`.
  const view = showExample ? EXAMPLE_MEDICAL_RECORD : data;
  const readOnly = showExample;

  const itemsFor = (section: RecordSection, source: MedicalRecordData = view): unknown[] =>
    Array.isArray(source[section.key]) ? source[section.key] as unknown[] : [];

  const sectionCount = (section: RecordSection): number => section.itemLabel
    ? itemsFor(section).length
    : (section.fields ?? []).filter(field => isRecorded(fieldValue(view, field.key))).length > 0 ? 1 : 0;

  const groupCount = (group: GroupDefinition): number =>
    recordSections.filter(s => group.keys.includes(s.key)).reduce((sum, s) => sum + sectionCount(s), 0);

  const beginEdit = (section: RecordSection, index?: number) => {
    if (readOnly) return;
    triggerRef.current = document.activeElement as HTMLElement;
    const item = index === undefined ? {} : itemsFor(section, data)[index];
    const source = section.stringList ? { value: item } : section.itemLabel ? (isRecord(item) ? item : {}) : data;
    const draft: Record<string, string> = {};
    fieldsFor(section).forEach(field => {
      const value = fieldValue(source, field.key);
      draft[field.key] = typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean' ? String(value) : '';
    });
    setFieldErrors({});
    setError('');
    setEditor({ section, index, draft });
  };

  const closeEditor = () => {
    setEditor(null);
    setError('');
  };

  const persist = async (patch: MedicalRecordData) => {
    if (busy.current) return false;
    busy.current = true;
    setSaving(true);
    setError('');
    setNotice('');
    try {
      const outcome = await firebaseService.saveCareVault(userId, patch);
      setData(current => mergeMedicalRecords(current, patch));
      setReadState(outcome.state === 'device-only' ? 'cached' : 'recorded');
      setNotice(outcome.state === 'device-only'
        ? 'Saved only on this device. Your account copy was not updated.'
        : 'Changes recorded in your account.');
      return true;
    } catch {
      setError('Changes could not be saved. Your entries are still here. Please try again.');
      return false;
    } finally {
      busy.current = false;
      setSaving(false);
    }
  };

  const handleClearAll = async () => {
    const emptyPatch: MedicalRecordData = {
      primaryDiagnosis: '',
      allergies: '',
      otherConditions: [],
      medications: [],
      diseaseModifyingTherapy: {},
      chelation: {},
      surgeries: [],
      hospitalizations: [],
      transfusions: [],
      labs: [],
      immunizations: [],
      emergencyInfo: {},
      notesJournal: '',
    };
    if (await persist(emptyPatch)) {
      setData({});
      setClearConfirmOpen(false);
    }
  };

  const emergencyText = () => [
    isRecorded(fieldValue(view, 'primaryDiagnosis')) ? `Diagnosis: ${fieldValue(view, 'primaryDiagnosis')}` : '',
    isRecorded(fieldValue(view, 'allergies')) ? `Allergies: ${fieldValue(view, 'allergies')}` : '',
    isRecorded(fieldValue(view, 'emergencyInfo.whatToTellER')) ? String(fieldValue(view, 'emergencyInfo.whatToTellER')) : '',
    isRecorded(fieldValue(view, 'emergencyInfo.hematologistName'))
      ? `Care contact: ${fieldValue(view, 'emergencyInfo.hematologistName')}${isRecorded(fieldValue(view, 'emergencyInfo.hematologistPhone')) ? `, ${fieldValue(view, 'emergencyInfo.hematologistPhone')}` : ''}`
      : '',
  ].filter(Boolean).join('\n');

  const handleCopyER = async () => {
    const text = emergencyText();
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopiedER(true);
      setTimeout(() => setCopiedER(false), 2200);
    } catch {
      // Clipboard can be blocked; the text stays visible on screen.
    }
  };

  const saveEditor = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!editor || busy.current) return;
    const errors: Record<string, string> = {};
    fieldsFor(editor.section).forEach(field => {
      const value = editor.draft[field.key].trim();
      if (field.required && !value) errors[field.key] = 'Enter ' + field.label.toLowerCase() + '.';
      if (field.type === 'number' && value && (!Number.isFinite(Number(value)) || Number(value) < 0)) {
        errors[field.key] = 'Enter a number of zero or more.';
      }
    });
    setFieldErrors(errors);
    if (Object.keys(errors).length) return;

    const section = editor.section;
    const items = itemsFor(section, data);
    const oldItem = editor.index === undefined ? {} : items[editor.index];
    const source = section.stringList ? { value: oldItem } : section.itemLabel ? (isRecord(oldItem) ? oldItem : {}) : data;
    let changes: MedicalRecordData = {};

    fieldsFor(section).forEach(field => {
      const raw = editor.draft[field.key].trim();
      const oldValue = fieldValue(source, field.key);
      if ((oldValue === undefined || oldValue === null) && !raw) return;
      if (String(oldValue ?? '') === raw) return;
      const value = field.type === 'number' ? (raw ? Number(raw) : null)
        : field.type === 'boolean' ? (raw ? raw === 'true' : null) : raw;
      changes = mergeMedicalRecords(changes, fieldPatch(field.key, value));
    });

    let patch = changes;
    if (section.itemLabel) {
      const item = section.stringList ? editor.draft.value.trim()
        : mergeMedicalRecords(isRecord(oldItem) ? oldItem : {}, changes);
      const next = [...items];
      const generatedId = typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID()
        : `rec-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
      if (editor.index === undefined) next.push(section.stringList ? item : { ...item as MedicalRecordData, id: generatedId });
      else next[editor.index] = item;
      patch = { [section.key]: next };
    }

    if (!Object.keys(patch).length || await persist(patch)) closeEditor();
  };

  const actionButton = 'inline-flex min-h-11 items-center gap-1.5 rounded-full px-3.5 text-[13px] font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wa-crimson disabled:opacity-50';

  /** Recorded fields only, so a lab with two values does not show eight "Not recorded" rows. */
  const renderFields = (source: MedicalRecordData, fields: RecordField[], skipKey?: string) => {
    const shown = fields.filter(field => field.key !== skipKey && isRecorded(fieldValue(source, field.key)));
    if (!shown.length) return null;
    return (
      <dl className="grid gap-x-4 gap-y-2.5 sm:grid-cols-2">
        {shown.map(field => (
          <div key={field.key} className="min-w-0">
            <dt className="text-xs font-semibold text-wa-plum-muted">{field.label}</dt>
            <dd className="mt-0.5 whitespace-pre-wrap break-words text-sm text-wa-plum">
              {formatValue(field.key, fieldValue(source, field.key))}
            </dd>
          </div>
        ))}
      </dl>
    );
  };

  const renderSection = (section: RecordSection, showTitle = true) => {
    const items = itemsFor(section);
    const hint = sectionHints[section.key];
    const fieldsShown = !section.itemLabel ? renderFields(view, section.fields ?? []) : null;
    const primaryKey = primaryFieldKey[section.key];

    return (
      <section key={section.key} aria-label={section.title} className="space-y-3">
        <div>
          {showTitle && <h3 className="font-display text-[15px] font-bold text-wa-plum">{section.title}</h3>}
          {hint && <p className="text-xs leading-snug text-wa-plum-muted">{hint}</p>}
        </div>

        {section.itemLabel ? (
          items.length ? (
            <ul className="space-y-2.5">
              {items.map((item, index) => {
                const itemRec = isRecord(item) ? item : null;
                const title = section.stringList
                  ? displayValue(item)
                  : itemRec && primaryKey
                    ? formatValue(primaryKey, fieldValue(itemRec, primaryKey))
                    : `${section.itemLabel} ${index + 1}`;
                const isActive = itemRec?.isActive;

                return (
                  <li key={index} className="rounded-[18px] border border-wa-line bg-wa-surface p-3.5">
                    <div className="flex items-start justify-between gap-3">
                      <p className="min-w-0 whitespace-pre-wrap break-words text-[15px] font-bold leading-snug text-wa-plum">
                        {section.key === 'labs' ? `Results from ${title}` : title}
                      </p>
                      {typeof isActive === 'boolean' && (
                        <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-bold ${isActive
                          ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                          : 'bg-wa-ground text-wa-plum-muted'}`}
                        >
                          {isActive ? 'Taking now' : 'Stopped'}
                        </span>
                      )}
                    </div>

                    {!section.stringList && (
                      itemRec ? (
                        <div className="mt-2.5">{renderFields(itemRec, section.fields ?? [], primaryKey)}</div>
                      ) : (
                        <p className="mt-2 text-xs text-wa-plum-muted">
                          This older entry cannot be shown in the current format. It has been kept.
                        </p>
                      )
                    )}

                    {!readOnly && (
                      <div className="mt-2.5 flex items-center gap-1 border-t border-wa-line-soft pt-2">
                        <button
                          type="button"
                          aria-label={`Edit ${section.itemLabel} ${index + 1}`}
                          disabled={saving || Boolean(editor)}
                          onClick={() => beginEdit(section, index)}
                          className={`${actionButton} text-wa-plum hover:bg-wa-ground`}
                        >
                          <Pencil size={14} aria-hidden="true" /> Edit
                        </button>
                        <button
                          type="button"
                          aria-label={`Remove ${section.itemLabel} ${index + 1}`}
                          disabled={saving || Boolean(editor)}
                          onClick={event => {
                            removalFocusRef.current = event.currentTarget.closest('section')?.querySelector<HTMLElement>('[data-record-add]') ?? null;
                            setError('');
                            setDeletion({ section, index });
                          }}
                          className={`${actionButton} text-wa-plum-muted hover:bg-wa-rose/40 hover:text-wa-crimson`}
                        >
                          <Trash2 size={14} aria-hidden="true" /> Remove
                        </button>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="rounded-[18px] border border-dashed border-wa-line px-3.5 py-3 text-[13px] text-wa-plum-muted">
              Nothing added yet.
            </p>
          )
        ) : fieldsShown ? (
          <div className="rounded-[18px] border border-wa-line bg-wa-surface p-3.5">{fieldsShown}</div>
        ) : (
          <p className="rounded-[18px] border border-dashed border-wa-line px-3.5 py-3 text-[13px] text-wa-plum-muted">
            Nothing added yet.
          </p>
        )}

        {!readOnly && (
          <button
            type="button"
            data-record-add
            disabled={saving || Boolean(editor)}
            onClick={() => beginEdit(section)}
            className={`${actionButton} border border-wa-line bg-wa-surface text-wa-plum hover:border-wa-crimson/40 hover:bg-wa-rose/30`}
          >
            {section.itemLabel ? <Plus size={15} className="text-wa-crimson" aria-hidden="true" /> : <Pencil size={14} className="text-wa-crimson" aria-hidden="true" />}
            {section.itemLabel ? 'Add ' + section.itemLabel : 'Edit ' + section.title.toLowerCase()}
          </button>
        )}
      </section>
    );
  };

  const hasInfo = hasMedicalInformation(view);
  const hasOwnInfo = hasMedicalInformation(data);
  const careSection = recordSections.find(s => s.key === 'care');
  const backgroundSection = recordSections.find(s => s.key === 'background');
  const diagnosis = fieldValue(view, 'primaryDiagnosis');
  const allergies = fieldValue(view, 'allergies');
  const erNote = fieldValue(view, 'emergencyInfo.whatToTellER');
  const contactName = fieldValue(view, 'emergencyInfo.hematologistName');
  const contactPhone = fieldValue(view, 'emergencyInfo.hematologistPhone');
  const hasEmergencyInfo = [diagnosis, allergies, erNote, contactName].some(isRecorded);

  return (
    <div className="space-y-4 pb-6" data-semantic>
      <header className="space-y-1">
        <h1 className="font-display text-2xl font-extrabold text-wa-plum">Medical records</h1>
        <p className="text-sm text-wa-plum">Your own health file, ready for a new doctor or the emergency room.</p>
        <p className="flex items-center gap-1.5 text-xs text-wa-plum-muted">
          <ShieldCheck size={14} className="shrink-0 text-emerald-600" aria-hidden="true" />
          Patient-maintained information: private to you, not checked by a clinician.
        </p>
      </header>

      {readState === 'loading' ? (
        <div role="status" aria-label="Loading medical records" className="space-y-3">
          <Skeleton className="h-36 rounded-[22px]" />
          <Skeleton className="h-20 rounded-[22px]" />
        </div>
      ) : (
        <>
          {showExample && (
            <div role="status" className="sticky top-[4.25rem] z-20 flex items-start gap-3 rounded-[18px] border border-wa-sun/40 bg-wa-sun-soft p-3.5 text-wa-plum shadow-sm lg:top-20">
              <Eye size={18} className="mt-0.5 shrink-0 text-wa-sun-ink" aria-hidden="true" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold">Example only, not your records</p>
                <p className="text-xs text-wa-plum-muted">This shows how a filled-in record looks. Nothing here is saved.</p>
              </div>
              <Button size="sm" variant="secondary" className="h-11 shrink-0" leadingIcon={<X size={15} />} onClick={() => setShowExample(false)}>
                Close
              </Button>
            </div>
          )}

          {readState === 'unavailable' && !showExample && (
            <Alert
              tone="warning"
              title="Medical records unavailable"
              action={<Button variant="secondary" size="sm" className="h-11" onClick={() => setReload(value => value + 1)}>Try again</Button>}
            >
              Your account records could not be loaded. Anything you add now is kept on this device.
            </Alert>
          )}

          {readState === 'cached' && !showExample && (
            <Alert tone="warning" title="Showing the copy saved on this device">
              It may not include changes made on another device.
            </Alert>
          )}

          {notice && !showExample && (
            <Alert tone={notice.startsWith('Saved only') ? 'warning' : 'success'} title="Save status" live="polite">
              {notice}
            </Alert>
          )}

          {!hasInfo && (
            <section aria-labelledby="records-empty-title" className="rounded-[22px] border border-wa-line bg-wa-surface p-4 sm:p-5">
              <h2 id="records-empty-title" className="font-display text-[17px] font-bold text-wa-plum">No information recorded yet</h2>
              <p className="mt-1 text-[13px] text-wa-plum-muted">Add only what you know. Start with the basics; you can fill in the rest any time.</p>
              <ul className="mt-3 space-y-2.5">
                {USES.map(({ icon: Icon, text }) => (
                  <li key={text} className="flex items-start gap-3 text-[13px] text-wa-plum">
                    <span aria-hidden="true" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-wa-rose text-wa-crimson">
                      <Icon size={16} />
                    </span>
                    <span className="pt-1.5">{text}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-4 flex flex-wrap gap-2.5">
                {backgroundSection && (
                  <Button className="h-11" leadingIcon={<Plus size={16} />} onClick={() => beginEdit(backgroundSection)}>
                    Add diagnosis & allergies
                  </Button>
                )}
                {SHOW_MEDICAL_RECORDS_EXAMPLE && (
                  <Button variant="secondary" className="h-11" leadingIcon={<Eye size={16} />} onClick={() => setShowExample(true)}>
                    See an example
                  </Button>
                )}
              </div>
            </section>
          )}

          {hasInfo && (
            <section aria-labelledby="emergency-card-title" className="overflow-hidden rounded-[22px] border border-wa-crimson/25 bg-wa-surface">
              <div className="flex items-center gap-3 bg-wa-rose/50 px-4 py-3 dark:bg-wa-rose/10">
                <span aria-hidden="true" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-wa-surface text-wa-crimson">
                  <Stethoscope size={18} />
                </span>
                <div className="min-w-0">
                  <h2 id="emergency-card-title" className="font-display text-[15px] font-bold text-wa-crimson">Emergency card</h2>
                  <p className="text-xs text-wa-plum-muted">Show this to hospital staff</p>
                </div>
              </div>
              {hasEmergencyInfo ? (
                <div className="space-y-3 p-4">
                  <dl className="space-y-2.5">
                    {[
                      { label: 'Diagnosis', value: diagnosis },
                      { label: 'Allergies', value: allergies },
                      { label: 'Tell emergency staff', value: erNote },
                    ].filter(row => isRecorded(row.value)).map(row => (
                      <div key={row.label}>
                        <dt className="text-xs font-semibold text-wa-plum-muted">{row.label}</dt>
                        <dd className="mt-0.5 whitespace-pre-wrap break-words text-sm font-semibold text-wa-plum">{displayValue(row.value)}</dd>
                      </div>
                    ))}
                  </dl>
                  {isRecorded(contactName) && (
                    <p className="text-[13px] text-wa-plum">
                      <span className="text-wa-plum-muted">Care contact: </span>
                      <span className="font-semibold">{displayValue(contactName)}</span>
                      {isRecorded(contactPhone) ? ` · ${displayValue(contactPhone)}` : ''}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-11"
                      onClick={() => void handleCopyER()}
                      leadingIcon={copiedER ? <Check size={15} /> : <Copy size={15} />}
                    >
                      {copiedER ? 'Copied' : 'Copy for ER'}
                    </Button>
                    {isRecorded(contactPhone) && !readOnly && (
                      <a
                        href={`tel:${String(contactPhone).replace(/[^\d+]/g, '')}`}
                        className="inline-flex h-11 items-center gap-1.5 rounded-full border border-wa-line bg-wa-surface px-4 text-[13px] font-bold text-wa-plum hover:bg-wa-ground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wa-crimson"
                      >
                        <Phone size={15} aria-hidden="true" /> Call care contact
                      </a>
                    )}
                    {careSection && !readOnly && (
                      <Button variant="ghost" size="sm" className="h-11" leadingIcon={<Pencil size={14} />} onClick={() => beginEdit(careSection)}>
                        Edit emergency plan
                      </Button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-3 p-4">
                  <p className="text-[13px] text-wa-plum-muted">Add your diagnosis, allergies and a short note for emergency staff so this card is ready when you need it.</p>
                  {careSection && !readOnly && (
                    <Button size="sm" className="h-11" leadingIcon={<Plus size={15} />} onClick={() => beginEdit(careSection)}>
                      Add emergency plan
                    </Button>
                  )}
                </div>
              )}
            </section>
          )}

          <div className="space-y-2.5">
            <h2 className="px-1 text-xs font-bold uppercase tracking-wider text-wa-plum-muted">Your record</h2>
            {groups.map((group, index) => {
              const count = groupCount(group);
              return (
                <details
                  key={group.title}
                  open={index === 0 ? true : undefined}
                  className="group overflow-hidden rounded-[22px] border border-wa-line bg-wa-surface"
                >
                  <summary className="flex min-h-[68px] cursor-pointer list-none items-center gap-3 px-4 py-3 transition-colors hover:bg-wa-ground/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-wa-crimson">
                    <span aria-hidden="true" className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${group.iconClass}`}>
                      <group.icon size={20} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <h2 className="font-display text-[15px] font-bold leading-tight text-wa-plum">{group.title}</h2>
                      <p className="mt-0.5 text-xs leading-snug text-wa-plum-muted">{group.description}</p>
                    </div>
                    <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-bold ${count ? 'bg-wa-ground text-wa-plum' : 'text-wa-plum-muted'}`}>
                      {count ? `${count} added` : 'Empty'}
                    </span>
                    <ChevronDown size={20} className="shrink-0 text-wa-plum-muted transition-transform group-open:rotate-180" aria-hidden="true" />
                  </summary>
                  <div className="space-y-5 border-t border-wa-line-soft bg-wa-ground/40 p-4 dark:bg-white/[0.02]">
                    {/* A group with one section would repeat its own title, so only multi-section groups label them. */}
                    {recordSections.filter(section => group.keys.includes(section.key)).map(section => renderSection(section, group.keys.length > 1))}
                  </div>
                </details>
              );
            })}
          </div>

          <section aria-labelledby="medical-summary-title" className="space-y-3 rounded-[22px] border border-wa-line bg-wa-surface p-4 sm:p-5">
            <div className="flex items-start gap-3">
              <span aria-hidden="true" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-wa-rose text-wa-crimson">
                <Download size={20} />
              </span>
              <div className="min-w-0">
                <h2 id="medical-summary-title" className="font-display text-[15px] font-bold text-wa-plum">Health summary</h2>
                <p className="text-xs leading-snug text-wa-plum-muted">
                  A PDF of everything above to take to clinic. It contains only what you entered, no generated advice.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                className="h-11"
                disabled={!hasOwnInfo || readOnly || saving || Boolean(editor)}
                loading={exporting}
                leadingIcon={<Download size={16} />}
                onClick={async () => {
                  setExporting(true);
                  setError('');
                  try {
                    await generateClinicalPassportPDF(data);
                  } catch {
                    setError('The summary could not be downloaded. Please try again.');
                  } finally {
                    setExporting(false);
                  }
                }}
              >
                Download health summary
              </Button>
              {hasOwnInfo && !readOnly && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-11"
                  disabled={saving || Boolean(editor)}
                  onClick={() => setClearConfirmOpen(true)}
                  leadingIcon={<RotateCcw size={15} />}
                >
                  Reset records
                </Button>
              )}
              {hasOwnInfo && SHOW_MEDICAL_RECORDS_EXAMPLE && !showExample && (
                <Button variant="ghost" size="sm" className="h-11" leadingIcon={<Eye size={15} />} onClick={() => setShowExample(true)}>
                  See an example
                </Button>
              )}
            </div>
            {error && !editor && !deletion && <Alert tone="danger" title="Download unavailable">{error}</Alert>}
          </section>

          <p className="px-1 text-xs leading-relaxed text-wa-plum-muted">
            Your records belong to you; download or delete them any time. Medicines listed here are your history and do not change your daily medicine check-in on Home.
          </p>
        </>
      )}

      <Modal
        open={Boolean(deletion)}
        onOpenChange={open => {
          if (!open && !saving) {
            setDeletion(null);
            setError('');
          }
        }}
        title="Remove this entry?"
        description="It will be deleted from your medical records."
        size="sm"
        footer={
          <div className="flex w-full gap-3 sm:justify-end">
            <Button variant="secondary" className="h-12 flex-1 sm:flex-none" disabled={saving} onClick={() => { setDeletion(null); setError(''); }}>
              Keep entry
            </Button>
            <Button
              variant="danger"
              className="h-12 flex-1 sm:flex-none"
              loading={saving}
              onClick={async () => {
                if (!deletion) return;
                const next = itemsFor(deletion.section, data).filter((_, index) => index !== deletion.index);
                if (await persist({ [deletion.section.key]: next })) setDeletion(null);
              }}
            >
              Remove entry
            </Button>
          </div>
        }
      >
        <p className="text-[13px] text-wa-plum-muted">This can&apos;t be undone.</p>
      </Modal>

      <Modal
        open={clearConfirmOpen}
        onOpenChange={open => { if (!open && !saving) setClearConfirmOpen(false); }}
        title="Reset all medical records?"
        description="This clears every entry from your records on this device and your account."
        size="sm"
        footer={
          <div className="flex w-full gap-3 sm:justify-end">
            <Button variant="secondary" className="h-12 flex-1 sm:flex-none" disabled={saving} onClick={() => setClearConfirmOpen(false)}>
              Keep records
            </Button>
            <Button variant="danger" className="h-12 flex-1 sm:flex-none" loading={saving} onClick={handleClearAll}>
              Reset all
            </Button>
          </div>
        }
      >
        <p className="text-[13px] text-wa-plum-muted">Diagnoses, medicines, hospital history, blood tests and care notes will all be removed.</p>
      </Modal>

      <Modal
        open={Boolean(editor)}
        onOpenChange={open => {
          if (!open && !saving) closeEditor();
        }}
        title={editor ? (editor.index === undefined && editor.section.itemLabel ? 'Add ' + editor.section.itemLabel : 'Edit ' + editor.section.title.toLowerCase()) : 'Edit record'}
        description={editor ? sectionHints[editor.section.key] : undefined}
        size="md"
        footer={editor ? (
          <div className="flex w-full gap-3 sm:justify-end">
            <Button type="button" variant="secondary" className="h-12 flex-1 sm:flex-none" disabled={saving} onClick={closeEditor}>
              Cancel editing
            </Button>
            <Button type="submit" form="medical-record-form" className="h-12 flex-1 sm:flex-none" loading={saving} loadingLabel="Saving information…">
              Save information
            </Button>
          </div>
        ) : undefined}
      >
        {editor && (
          <form id="medical-record-form" onSubmit={saveEditor} noValidate className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              {fieldsFor(editor.section).map(field => (
                <FormField
                  key={field.key}
                  label={field.label}
                  required={field.required}
                  error={fieldErrors[field.key]}
                  className={field.type === 'multiline' ? 'sm:col-span-2' : undefined}
                >
                  {field.type === 'multiline' ? (
                    <Textarea
                      disabled={saving}
                      rows={3}
                      value={editor.draft[field.key]}
                      onChange={event => setEditor({ ...editor, draft: { ...editor.draft, [field.key]: event.target.value } })}
                    />
                  ) : field.type === 'boolean' ? (
                    <SelectInput
                      disabled={saving}
                      value={editor.draft[field.key]}
                      onChange={event => setEditor({ ...editor, draft: { ...editor.draft, [field.key]: event.target.value } })}
                    >
                      <option value="">Not recorded</option>
                      <option value="true">Yes</option>
                      <option value="false">No</option>
                    </SelectInput>
                  ) : (
                    <TextInput
                      disabled={saving}
                      type={field.type === 'number' ? 'number' : isDateField(field.key) ? 'date' : 'text'}
                      inputMode={field.type === 'number' ? 'decimal' : undefined}
                      step={field.type === 'number' ? 'any' : undefined}
                      min={field.type === 'number' ? 0 : undefined}
                      value={editor.draft[field.key]}
                      onChange={event => setEditor({ ...editor, draft: { ...editor.draft, [field.key]: event.target.value } })}
                    />
                  )}
                </FormField>
              ))}
            </div>

            {error && <Alert tone="danger" title="Not saved" live="assertive">{error}</Alert>}
          </form>
        )}
      </Modal>
    </div>
  );
};
