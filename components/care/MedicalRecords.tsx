import React, { useEffect, useRef, useState } from 'react';
import {
  AlertTriangle,
  Building2,
  Check,
  ChevronDown,
  Copy,
  Download,
  FileText,
  FlaskConical,
  HeartPulse,
  Info,
  Layers,
  PhoneCall,
  Pill,
  Plus,
  RotateCcw,
  ShieldCheck,
  Sparkles,
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
import { PageHeader } from '../layout';
import { Alert, Button, FormField, Modal, SelectInput, Skeleton, StateMessage, Textarea, TextInput } from '../ui';

interface GroupDefinition {
  title: string;
  category: string;
  keys: string[];
  icon: React.ComponentType<{ size?: number; className?: string; 'aria-hidden'?: boolean | 'true' | 'false' }>;
  badgeColor: string;
  accentBorder: string;
  description: string;
}

const groups: GroupDefinition[] = [
  {
    title: 'Health background',
    category: 'background',
    keys: ['background', 'otherConditions'],
    icon: HeartPulse,
    badgeColor: 'text-wa-crimson bg-wa-rose/70 dark:bg-wa-rose/30',
    accentBorder: 'border-wa-crimson/20',
    description: 'Core sickle cell diagnosis, drug allergies, and chronic co-existing conditions.',
  },
  {
    title: 'Medications & therapies',
    category: 'medications',
    keys: ['medications', 'therapy'],
    icon: Pill,
    badgeColor: 'text-purple-600 bg-purple-50 dark:bg-purple-950/40',
    accentBorder: 'border-purple-200 dark:border-purple-900/40',
    description: 'Current and past prescriptions, Hydroxyurea response, and chelation therapy.',
  },
  {
    title: 'Procedures & hospital care',
    category: 'procedures',
    keys: ['surgeries', 'hospitalizations', 'transfusions'],
    icon: Building2,
    badgeColor: 'text-amber-600 bg-amber-50 dark:bg-amber-950/40',
    accentBorder: 'border-amber-200 dark:border-amber-900/40',
    description: 'Surgical history, inpatient admissions for acute crises, and blood transfusions.',
  },
  {
    title: 'Laboratory records',
    category: 'labs',
    keys: ['labs'],
    icon: FlaskConical,
    badgeColor: 'text-teal-600 bg-teal-50 dark:bg-teal-950/40',
    accentBorder: 'border-teal-200 dark:border-teal-900/40',
    description: 'Baseline blood count tracking (Haemoglobin, Reticulocytes, Bilirubin, HbF%).',
  },
  {
    title: 'Immunizations',
    category: 'immunizations',
    keys: ['immunizations'],
    icon: ShieldCheck,
    badgeColor: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40',
    accentBorder: 'border-emerald-200 dark:border-emerald-900/40',
    description: 'Vaccines protecting against encapsulated bacteria (PCV, MenACWY, Hib).',
  },
  {
    title: 'Care information',
    category: 'care',
    keys: ['care'],
    icon: PhoneCall,
    badgeColor: 'text-blue-600 bg-blue-50 dark:bg-blue-950/40',
    accentBorder: 'border-blue-200 dark:border-blue-900/40',
    description: 'Haematologist contacts, acute pain regimens, and emergency room notes.',
  },
];

const sectionGuides: Record<string, { purpose: string; guidance: string }> = {
  background: {
    purpose: 'Core clinical genotype & allergies',
    guidance: 'Record your verified hemoglobin phenotype (e.g. Hemoglobin SS, SC) and confirmed drug or environmental allergies so attending clinicians have baseline clarity in acute care.',
  },
  otherConditions: {
    purpose: 'Secondary diagnoses & comorbidities',
    guidance: 'Track chronic conditions like avascular necrosis, pulmonary hypertension, or gallstones that require consideration alongside sickle cell management.',
  },
  medications: {
    purpose: 'Active prescriptions & schedule',
    guidance: 'Log prescribed medications (e.g. Hydroxyurea, prophylactic penicillin, folic acid) with daily dosages, start dates, and adherence routines.',
  },
  therapy: {
    purpose: 'Disease-modifying therapies & iron management',
    guidance: 'Document your therapeutic response to Hydroxyurea, target Fetal Hemoglobin (HbF) percentages, recorded side effects, and chelation therapy for iron overload.',
  },
  surgeries: {
    purpose: 'Surgical history & operative notes',
    guidance: 'Keep a record of previous surgical procedures (such as cholecystectomy or splenectomy) to inform anesthesia and surgical teams about airway and transfusion history.',
  },
  hospitalizations: {
    purpose: 'Hospital stays & acute admissions',
    guidance: 'Log past inpatient admissions for severe vaso-occlusive episodes, acute chest syndrome, or severe infections, including admission dates and hospital stay duration.',
  },
  transfusions: {
    purpose: 'Transfusion history & antibody tracking',
    guidance: 'Record simple or exchange blood transfusions, volume transfused, and reaction history. Critical for tracking red cell alloantibodies and safe cross-matching.',
  },
  labs: {
    purpose: 'Steady-state blood markers',
    guidance: 'Track your steady-state baseline blood metrics—Haemoglobin, Reticulocyte count, Bilirubin, and HbF%. Comparing current labs against your baseline helps doctors detect acute aplastic or hemolytic events.',
  },
  immunizations: {
    purpose: 'Preventive bacterial & viral vaccines',
    guidance: 'Document essential immunizations (Pneumococcal conjugate, Meningococcal ACWY/B, Hib, and Influenza) critical for patients with functional asplenia to prevent invasive bacterial infections.',
  },
  care: {
    purpose: 'Care team & emergency protocol',
    guidance: 'Record direct contact information for your primary haematologist, your individualized acute pain protocol, and concise instructions to present immediately to emergency department staff.',
  },
};

// Authentic sickle cell clinical profile with top-level keys mapped accurately to the database schema
const SAMPLE_CLINICAL_RECORD: MedicalRecordData = {
  primaryDiagnosis: 'Sickle Cell Disease (Hemoglobin SS)',
  allergies: 'Penicillin (mild childhood cutaneous rash), Codeine (severe nausea)',
  otherConditions: [
    'Avascular Necrosis of Femoral Head',
    'Cholelithiasis (Post-cholecystectomy)',
  ],
  medications: [
    {
      id: 'sample-med-1',
      name: 'Hydroxyurea',
      dosage: '1,000 mg oral once daily',
      startDate: '2023-03-01',
      endDate: '',
      isActive: true,
      adherenceNotes: 'Taken consistently at bedtime with a full glass of water. Well tolerated.',
    },
    {
      id: 'sample-med-2',
      name: 'Folic Acid',
      dosage: '5 mg oral daily',
      startDate: '2022-01-10',
      endDate: '',
      isActive: true,
      adherenceNotes: 'Supports ongoing red blood cell production.',
    },
  ],
  diseaseModifyingTherapy: {
    hydroxyureaResponse: 'Noticeable clinical improvement: vaso-occlusive pain episodes reduced from 5/year to <1/year. Steady-state baseline stabilized.',
    latestHbF: '15.2%',
    sideEffects: 'Mild benign hyperpigmentation of fingernail beds. No myelosuppression observed.',
  },
  chelation: {
    isActive: false,
    agentName: 'None',
    ironOverloadStatus: 'Normal serum ferritin levels monitored annually post-transfusion.',
  },
  surgeries: [
    {
      id: 'sample-surg-1',
      name: 'Laparoscopic Cholecystectomy',
      date: '2022-11-18',
      hospital: 'St. Nicholas Specialist Hospital',
      complications: 'Elective procedure for pigmented gallstones. Preoperative exchange transfusion; uneventful recovery.',
    },
  ],
  hospitalizations: [
    {
      id: 'sample-hosp-1',
      reason: 'Acute Chest Syndrome & Bilateral Infiltrates',
      date: '2024-04-12',
      durationDays: 4,
      notes: 'Rapid recovery following empiric IV cephalosporin, aggressive incentive spirometry, and analgesia.',
    },
  ],
  transfusions: [
    {
      id: 'sample-trans-1',
      date: '2024-04-13',
      volumeMl: 550,
      units: 2,
      reactionNotes: 'Phenotypically cross-matched leukoreduced packed red blood cells. Premedicated with paracetamol; zero transfusion reactions.',
    },
  ],
  labs: [
    {
      id: 'sample-lab-1',
      date: '2026-08-14',
      hemoglobin: 8.7,
      reticulocyte: 7.8,
      bilirubin: 2.2,
      ldh: 395,
      ferritin: 320,
      hbfPercentage: 15.2,
      notes: 'Routine haematology outpatient clinic; steady-state asymptomatic baseline.',
    },
  ],
  immunizations: [
    'Pneumococcal Conjugate Vaccine (PCV20) - Documented 2024',
    'Meningococcal Conjugate (MenACWY + MenB) - Documented 2025',
    'Haemophilus influenzae type b (Hib) - Complete Childhood Series',
    'Annual Quadrivalent Inactivated Influenza - Updated 2026',
  ],
  emergencyInfo: {
    hematologistName: 'Dr. T. Alabi (Consultant Haematologist)',
    hematologistPhone: '+234 802 555 9812',
    usualPainRegimen: 'Immediate oral hydration. If severe crisis: IV Morphine 0.1 mg/kg or Sublingual Buprenorphine as per personal acute plan. Avoid delayed triage.',
    whatToTellER: 'Adult sickle cell warrior in acute pain crisis. Baseline Hb is 8.5-8.8 g/dL. Prioritize parenteral analgesia within 30 minutes of emergency presentation.',
  },
  notesJournal: 'Patient-curated health log for doctor reviews, clinic appointments, and emergency preparedness.',
};

const fieldsFor = (section: RecordSection): RecordField[] => section.stringList
  ? [{ key: 'value', label: section.title === 'Conditions' ? 'Condition' : 'Immunization information', required: true }]
  : section.fields ?? [];

interface Editor {
  section: RecordSection;
  index?: number;
  draft: Record<string, string>;
}

export const MedicalRecords: React.FC<{ userId: string }> = ({ userId }) => {
  const [data, setData] = useState<MedicalRecordData>({});
  const [readState, setReadState] = useState<'loading' | 'recorded' | 'cached' | 'empty' | 'unavailable'>('loading');
  const [reload, setReload] = useState(0);
  const [editor, setEditor] = useState<Editor | null>(null);
  const [deletion, setDeletion] = useState<{ section: RecordSection; index: number } | null>(null);
  const [clearConfirmOpen, setClearConfirmOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [copiedER, setCopiedER] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [exporting, setExporting] = useState(false);
  const busy = useRef(false);
  const editorRef = useRef<HTMLHeadingElement>(null);
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
    if (editor) editorRef.current?.focus();
    else triggerRef.current?.focus();
  }, [editor?.section.key, editor?.index]);

  useEffect(() => {
    if (!deletion) removalFocusRef.current?.focus();
  }, [deletion]);

  const itemsFor = (section: RecordSection): unknown[] =>
    Array.isArray(data[section.key]) ? data[section.key] as unknown[] : [];

  const itemsCountForGroup = (group: GroupDefinition): string => {
    const groupSections = recordSections.filter(s => group.keys.includes(s.key));
    let count = 0;
    groupSections.forEach(s => {
      if (s.itemLabel) {
        count += itemsFor(s).length;
      } else if (s.fields?.some(f => displayValue(fieldValue(data, f.key)) !== 'Not recorded')) {
        count += 1;
      }
    });
    return count > 0 ? `${count} recorded` : 'Empty';
  };

  const beginEdit = (section: RecordSection, index?: number) => {
    triggerRef.current = document.activeElement as HTMLElement;
    const item = index === undefined ? {} : itemsFor(section)[index];
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
      setNotice(outcome.state === 'device-only'
        ? 'Saved only on this device. Your cloud record was not updated. These changes are not automatically sent later and a future cloud refresh may replace them.'
        : 'Changes recorded in your account. No clinician review or notification is implied.');
      return true;
    } catch {
      setError('Changes could not be saved. Your entries are still here. Please try again.');
      return false;
    } finally {
      busy.current = false;
      setSaving(false);
    }
  };

  const handleLoadSampleRecord = async () => {
    await persist(SAMPLE_CLINICAL_RECORD);
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

  const handleCopyER = async () => {
    const erText = String(fieldValue(data, 'emergencyInfo.whatToTellER') || '');
    if (!erText) return;
    try {
      await navigator.clipboard.writeText(erText);
      setCopiedER(true);
      setTimeout(() => setCopiedER(false), 2200);
    } catch {
      // Graceful clipboard fallback
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
    const items = itemsFor(section);
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
      if (editor.index === undefined) next.push(section.stringList ? item : { ...item as MedicalRecordData, id: crypto.randomUUID() });
      else next[editor.index] = item;
      patch = { [section.key]: next };
    }

    if (!Object.keys(patch).length || await persist(patch)) closeEditor();
  };

  // Structured Definition List component preserving semantic dd for tests
  const renderFields = (source: MedicalRecordData, fields: RecordField[]) => (
    <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {fields.map(field => {
        const val = fieldValue(source, field.key);
        const isRecorded = val !== undefined && val !== null && String(val).trim() !== '';
        return (
          <div
            key={field.key}
            className="min-w-0 rounded-2xl bg-wa-ground/60 dark:bg-wa-surface/70 p-3.5 border border-wa-line-soft transition-all hover:border-wa-line"
          >
            <dt className="text-xs font-semibold uppercase tracking-wider text-foreground-secondary">{field.label}</dt>
            <dd className={`mt-1.5 whitespace-pre-wrap break-words text-body font-medium ${isRecorded ? 'text-foreground' : 'text-foreground-secondary/70 italic'}`}>
              {displayValue(val)}
            </dd>
          </div>
        );
      })}
    </dl>
  );

  const renderSection = (section: RecordSection) => {
    const items = itemsFor(section);
    const editing = editor?.section.key === section.key;
    const guide = sectionGuides[section.key];

    return (
      <section
        key={section.key}
        aria-label={section.title}
        className="rounded-3xl border border-wa-line-soft bg-surface p-5 sm:p-6 shadow-xs space-y-4 transition-all"
      >
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-wa-line-soft pb-3.5">
          <div className="space-y-0.5">
            <h3 className="text-heading-3 text-foreground font-display">{section.title}</h3>
            {guide && (
              <p className="text-xs text-foreground-secondary">{guide.purpose}</p>
            )}
          </div>
        </div>

        {guide && (
          <div className="flex items-start gap-2.5 rounded-2xl bg-wa-ground/60 dark:bg-wa-surface/40 p-3.5 text-small text-foreground-secondary border border-wa-line-soft/80">
            <Info size={16} className="text-wa-crimson shrink-0 mt-0.5" />
            <span className="leading-relaxed">{guide.guidance}</span>
          </div>
        )}

        {/* Section Items */}
        {section.itemLabel ? (
          <>
            {!items.length && (
              <div className="py-4 text-center rounded-2xl bg-wa-ground/30 border border-dashed border-wa-line">
                <p className="text-body text-foreground-secondary">No information recorded yet.</p>
              </div>
            )}
            <ul className="space-y-3.5">
              {items.map((item, index) => {
                const itemRec = isRecord(item) ? item : null;
                const isMed = section.key === 'medications' && itemRec;
                const isLab = section.key === 'labs' && itemRec;

                return (
                  <li
                    key={index}
                    className="space-y-3 rounded-2xl bg-wa-surface dark:bg-wa-surface/90 p-4 sm:p-5 border border-wa-line-soft shadow-xs transition-shadow hover:shadow-sm"
                  >
                    {/* Item Card Header */}
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-wa-line-soft/80 pb-2.5">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-wa-rose/70 text-wa-crimson">
                          {section.itemLabel} #{index + 1}
                        </span>

                      </div>

                      {itemRec && itemRec.isActive !== undefined && (
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${itemRec.isActive
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                              : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                            }`}
                        >
                          {itemRec.isActive ? 'Active Prescription' : 'Discontinued / Past'}
                        </span>
                      )}
                    </div>



                    {/* Content Rendering */}
                    {section.stringList ? (
                      <p className="whitespace-pre-wrap break-words text-body font-medium text-foreground py-1">
                        {displayValue(item)}
                      </p>
                    ) : itemRec ? (
                      renderFields(itemRec, section.fields ?? [])
                    ) : (
                      <p className="text-small text-foreground-secondary">
                        This older entry cannot be displayed in the current format. It has been preserved.
                      </p>
                    )}

                    {/* Action Buttons for this Item */}
                    <div className="flex flex-wrap items-center gap-2 pt-2.5 border-t border-wa-line-soft">
                      <Button
                        variant="secondary"
                        size="sm"
                        disabled={saving || Boolean(editor)}
                        onClick={() => beginEdit(section, index)}
                      >
                        Edit {section.itemLabel} {index + 1}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={saving || Boolean(editor)}
                        onClick={event => {
                          removalFocusRef.current = event.currentTarget.closest('section')?.querySelector<HTMLElement>('[data-record-add]') ?? null;
                          setError('');
                          setDeletion({ section, index });
                        }}
                      >
                        Remove {section.itemLabel} {index + 1}
                      </Button>
                    </div>
                  </li>
                );
              })}
            </ul>
          </>
        ) : (
          renderFields(data, section.fields ?? [])
        )}

        {/* Special Emergency Action for Care Section */}
        {section.key === 'care' && fieldValue(data, 'emergencyInfo.whatToTellER') && (
          <div className="rounded-2xl border-2 border-wa-crimson/30 bg-wa-rose/30 dark:bg-wa-rose/10 p-4 sm:p-5 space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-wa-crimson font-bold text-sm">
                <AlertTriangle size={16} />
                <span>Quick-Show for Emergency Department</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyER}
                leadingIcon={copiedER ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
              >
                {copiedER ? 'Copied to Clipboard' : 'Copy ER Note'}
              </Button>
            </div>
            <p className="text-small font-medium text-foreground leading-relaxed italic">
              "{String(fieldValue(data, 'emergencyInfo.whatToTellER'))}"
            </p>
          </div>
        )}

        {/* Add / Edit Section Button */}
        <Button
          data-record-add
          variant="secondary"
          size="sm"
          disabled={saving || Boolean(editor)}
          onClick={() => beginEdit(section)}
          leadingIcon={<Plus size={14} />}
        >
          {section.itemLabel ? 'Add ' + section.itemLabel : 'Edit ' + section.title.toLowerCase()}
        </Button>

        {/* Inline Section Editor Form */}
        {editing && editor && (
          <form
            onSubmit={saveEditor}
            noValidate
            className="space-y-4 rounded-3xl border-2 border-wa-crimson/40 bg-surface p-5 sm:p-6 shadow-md mt-4 ring-4 ring-wa-rose/30"
          >
            <div className="flex items-center justify-between border-b border-wa-line-soft pb-3">
              <h4
                ref={editorRef}
                tabIndex={-1}
                className="text-heading-3 text-foreground font-display focus-visible:outline focus-visible:outline-focus"
              >
                {editor.index === undefined && section.itemLabel ? 'Add ' + section.itemLabel : 'Edit ' + section.title.toLowerCase()}
              </h4>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {fieldsFor(section).map(field => (
                <FormField key={field.key} label={field.label} required={field.required} error={fieldErrors[field.key]}>
                  {field.type === 'multiline' ? (
                    <Textarea
                      disabled={saving}
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
                      type={field.type === 'number' ? 'number' : 'text'}
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

            <div className="flex flex-wrap gap-3 pt-2">
              <Button type="submit" loading={saving} loadingLabel="Saving information…">
                Save information
              </Button>
              <Button variant="secondary" disabled={saving} onClick={closeEditor}>
                Cancel editing
              </Button>
            </div>
          </form>
        )}
      </section>
    );
  };

  const hasInfo = hasMedicalInformation(data);
  const activeMedsCount = itemsFor(recordSections[2]).filter((m: any) => isRecord(m) && m.isActive).length;
  const labsList = itemsFor(recordSections[7]);
  const surgeriesList = itemsFor(recordSections[4]);
  const hospitalList = itemsFor(recordSections[5]);
  const immunizationsList = itemsFor(recordSections[8]);

  return (
    <div className="space-y-6" data-semantic>
      {/* Hero Header Card */}
      <div className="rounded-3xl border border-wa-line-soft bg-surface p-5 sm:p-6 shadow-xs space-y-4">
        <PageHeader
          title="Medical records"
          description="Patient-maintained information about your health background and care. These entries are not clinician-verified records."
        />

        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-wa-rose text-wa-crimson">
            <HeartPulse size={13} />
            Self-Managed Vault
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-wa-ground text-wa-muted border border-wa-line-soft">
            <ShieldCheck size={13} className="text-emerald-600" />
            Device-First Private Storage
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-wa-ground text-wa-muted border border-wa-line-soft">
            <FileText size={13} className="text-wa-water" />
            PDF Exportable
          </span>
        </div>

        {/* Quick Clinical Snapshot Summary (Shows category stats without duplicating text queries) */}
        {hasInfo && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-wa-line-soft">
            <div className="rounded-2xl bg-wa-rose/40 dark:bg-wa-rose/20 p-3.5 border border-wa-rose/80">
              <span className="text-[11px] font-bold uppercase tracking-wider text-wa-crimson">Clinical Profile</span>
              <p className="mt-1 text-sm font-bold text-wa-plum truncate">
                Genotype & Background
              </p>
            </div>

            <div className="rounded-2xl bg-teal-50 dark:bg-teal-950/30 p-3.5 border border-teal-200/80">
              <span className="text-[11px] font-bold uppercase tracking-wider text-teal-700 dark:text-teal-300">Blood Tests</span>
              <p className="mt-1 text-sm font-bold text-teal-950 dark:text-teal-100 truncate">
                {labsList.length > 0 ? `${labsList.length} Lab Record${labsList.length === 1 ? '' : 's'}` : 'None recorded'}
              </p>
            </div>

            <div className="rounded-2xl bg-purple-50 dark:bg-purple-950/30 p-3.5 border border-purple-200/80">
              <span className="text-[11px] font-bold uppercase tracking-wider text-purple-700 dark:text-purple-300">Active Regimen</span>
              <p className="mt-1 text-sm font-bold text-purple-950 dark:text-purple-100 truncate">
                {activeMedsCount > 0 ? `${activeMedsCount} Active Prescription${activeMedsCount > 1 ? 's' : ''}` : 'None recorded'}
              </p>
            </div>

            <div className="rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 p-3.5 border border-emerald-200/80">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">Vaccine Shield</span>
              <p className="mt-1 text-sm font-bold text-emerald-950 dark:text-emerald-100 truncate">
                {immunizationsList.length > 0 ? `${immunizationsList.length} Vaccine${immunizationsList.length === 1 ? '' : 's'} Logged` : 'None recorded'}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Active Editor Notice Banner */}
      {editor && (
        <div className="flex items-center justify-between gap-3 rounded-2xl bg-wa-rose p-3.5 px-4 text-wa-crimson border border-wa-crimson/30 shadow-xs">
          <div className="flex items-center gap-2.5 text-sm font-bold">
            <span className="flex h-2.5 w-2.5 rounded-full bg-wa-crimson animate-pulse" />
            <span>Currently editing {editor.section.title}. Form is open below.</span>
          </div>
          <Button variant="ghost" size="sm" onClick={closeEditor}>
            Cancel
          </Button>
        </div>
      )}

      {readState === 'loading' ? (
        <div role="status" aria-label="Loading medical records">
          <Skeleton className="h-40 rounded-3xl" />
        </div>
      ) : readState === 'unavailable' ? (
        <StateMessage
          state="error"
          title="Medical records unavailable"
          description="Your account records could not be loaded, and no usable copy is available on this device. Your records have not been changed."
          action={<Button onClick={() => setReload(value => value + 1)}>Try again</Button>}
        />
      ) : (
        <>
          {readState === 'cached' && (
            <Alert tone="warning" title="Showing information saved on this device">
              Cloud confirmation is unavailable. This copy may not include changes from another device.
            </Alert>
          )}

          {notice && (
            <Alert tone={notice.startsWith('Saved only') ? 'warning' : 'info'} title="Save status" live="polite">
              {notice}
            </Alert>
          )}

          {!hasInfo ? (
            <StateMessage
              state="empty"
              title="No information recorded yet"
              description="Add only information you know. Missing details will stay unrecorded."
              action={
                <div className="flex flex-wrap gap-2.5 justify-center mt-3">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => beginEdit(recordSections[0])}
                    leadingIcon={<Plus size={15} />}
                  >
                    Add diagnosis & allergies
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleLoadSampleRecord}
                    loading={saving}
                    leadingIcon={<Sparkles size={15} />}
                  >
                    Pre-fill clinical reference record
                  </Button>
                </div>
              }
            />
          ) : (
            <Alert tone="neutral" title="Review existing information">
              Earlier versions could save sample information. Check existing entries before using or sharing them; their authorship and clinical accuracy have not been verified.
            </Alert>
          )}

          {/* Privacy & Consent Ethics Card */}
          <div className="rounded-3xl border border-wa-line-soft bg-surface p-5 sm:p-6 shadow-xs space-y-2.5">
            <div className="flex items-center gap-2.5 text-wa-plum">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40">
                <ShieldCheck size={20} />
              </div>
              <h3 className="text-base font-bold font-display">Consent & Privacy Ethics</h3>
            </div>
            <p className="text-small text-foreground-secondary leading-relaxed">
              Your medical records belong exclusively to you. All details in this vault are maintained by you to support clinical appointments, emergency triage, and care continuity. Your data is stored securely on your account and device, never shared with third parties or advertisers without your consent, and can be exported as a PDF or deleted whenever you choose.
            </p>
          </div>

          <p className="text-small text-foreground-secondary">
            Daily pain, symptoms, hydration, and check-ins remain in Health History. Medication entries here describe history and do not change your Home medication schedule.
          </p>

          {/* Category Filter Pills (When records are present) */}
          {hasInfo && (
            <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
              <button
                type="button"
                onClick={() => setSelectedCategory('all')}
                className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 ${selectedCategory === 'all'
                    ? 'bg-wa-plum text-white shadow-xs'
                    : 'bg-wa-surface text-wa-muted border border-wa-line-soft hover:bg-wa-ground'
                  }`}
              >
                <Layers size={13} />
                All Sections
              </button>
              {groups.map(g => (
                <button
                  key={g.category}
                  type="button"
                  onClick={() => setSelectedCategory(g.category)}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 ${selectedCategory === g.category
                      ? 'bg-wa-plum text-white shadow-xs'
                      : 'bg-wa-surface text-wa-muted border border-wa-line-soft hover:bg-wa-ground'
                    }`}
                >
                  <g.icon size={13} />
                  {g.title}
                </button>
              ))}
            </div>
          )}

          {/* Category Groups - All groups stay in DOM to guarantee accessibility & test compatibility */}
          <div className="space-y-4">
            {groups.map((group, index) => {
              const isFiltered = selectedCategory !== 'all' && selectedCategory !== group.category;

              return (
                <details
                  key={group.title}
                  open={selectedCategory === group.category || index === 0 ? true : undefined}
                  className={`group rounded-3xl border border-wa-line-soft bg-surface shadow-xs transition-shadow hover:shadow-sm overflow-hidden ${isFiltered ? 'hidden' : ''
                    }`}
                >
                  <summary className="flex min-h-16 cursor-pointer list-none items-center justify-between gap-3 px-4 py-4 sm:px-6 focus-visible:outline focus-visible:outline-2 focus-visible:outline-focus hover:bg-wa-ground/40 transition-colors">
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${group.badgeColor} shadow-xs`}>
                        <group.icon size={22} aria-hidden="true" />
                      </div>
                      <div className="min-w-0">
                        <h2 className="text-heading-2 text-foreground font-display">{group.title}</h2>
                        <p className="text-xs text-foreground-secondary truncate hidden sm:block mt-0.5">
                          {group.description}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2.5 shrink-0">
                      <span className="hidden md:inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-wa-ground text-wa-muted border border-wa-line-soft">
                        {itemsCountForGroup(group)}
                      </span>
                      <div className="flex h-8 w-8 items-center justify-center rounded-full text-foreground-secondary group-open:rotate-180 transition-transform duration-200">
                        <ChevronDown size={20} aria-hidden="true" />
                      </div>
                    </div>
                  </summary>

                  <div className="space-y-6 border-t border-wa-line-soft p-4 sm:p-6 bg-wa-ground/30">
                    {recordSections.filter(section => group.keys.includes(section.key)).map(renderSection)}
                  </div>
                </details>
              );
            })}
          </div>

          {/* Health Summary Export & Vault Management Card */}
          <section
            aria-labelledby="medical-summary-title"
            className="rounded-3xl border border-wa-line-soft bg-surface p-5 sm:p-6 shadow-xs space-y-4"
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-wa-rose text-wa-crimson">
                    <Download size={18} />
                  </div>
                  <h2 id="medical-summary-title" className="text-heading-2 text-foreground font-display">Health summary</h2>
                </div>
                <p className="max-w-prose text-small text-foreground-secondary leading-relaxed">
                  Download the information shown in these sections. The summary contains no generated advice and is not a clinician-approved care plan. Review existing entries before sharing it.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <Button
                  disabled={!hasInfo || saving || Boolean(editor)}
                  loading={exporting}
                  leadingIcon={<Download size={18} />}
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

                {hasInfo && (
                  <>
                    <Button
                      variant="secondary"
                      size="sm"
                      disabled={saving || Boolean(editor)}
                      onClick={handleLoadSampleRecord}
                      leadingIcon={<Sparkles size={14} />}
                    >
                      Reload reference sample
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={saving || Boolean(editor)}
                      onClick={() => setClearConfirmOpen(true)}
                      leadingIcon={<RotateCcw size={16} />}
                    >
                      Reset records
                    </Button>
                  </>
                )}
              </div>
            </div>
            {error && !editor && !deletion && <Alert tone="danger" title="Download unavailable">{error}</Alert>}
          </section>
        </>
      )}

      {/* Remove Single Entry Modal */}
      <Modal
        open={Boolean(deletion)}
        onOpenChange={open => {
          if (!open && !saving) {
            setDeletion(null);
            setError('');
          }
        }}
        title="Remove recorded information?"
        description="This removes the selected entry from your patient-maintained records."
        footer={
          <div className="flex flex-wrap gap-3">
            <Button variant="secondary" disabled={saving} onClick={() => { setDeletion(null); setError(''); }}>
              Keep entry
            </Button>
            <Button
              variant="danger"
              loading={saving}
              onClick={async () => {
                if (!deletion) return;
                const next = itemsFor(deletion.section).filter((_, index) => index !== deletion.index);
                if (await persist({ [deletion.section.key]: next })) setDeletion(null);
              }}
            >
              Remove entry
            </Button>
          </div>
        }
      >
        <p className="text-small text-foreground-secondary leading-relaxed">
          This will permanently delete this recorded item from your vault.
        </p>
      </Modal>

      {/* Clear All Records Modal */}
      <Modal
        open={clearConfirmOpen}
        onOpenChange={open => { if (!open && !saving) setClearConfirmOpen(false); }}
        title="Reset all medical records?"
        description="This will clear all recorded entries from your patient-maintained vault on this device and account. You can re-enter your details at any time."
        footer={
          <div className="flex flex-wrap gap-3">
            <Button variant="secondary" disabled={saving} onClick={() => setClearConfirmOpen(false)}>
              Keep records
            </Button>
            <Button
              variant="danger"
              loading={saving}
              onClick={handleClearAll}
            >
              Reset all
            </Button>
          </div>
        }
      >
        <p className="text-small text-foreground-secondary leading-relaxed">
          Resetting will remove all diagnoses, medications, procedures, labs, and care notes entered in this profile.
        </p>
      </Modal>
    </div>
  );
};
