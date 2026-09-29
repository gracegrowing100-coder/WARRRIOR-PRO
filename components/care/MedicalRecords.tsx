import React, { useEffect, useRef, useState } from 'react';
import { ChevronDown, Download } from 'lucide-react';
import { firebaseService } from '../../services/firebaseService';
import { displayValue, fieldPatch, fieldValue, hasMedicalInformation, isRecord, mergeMedicalRecords, recordSections, type MedicalRecordData, type RecordField, type RecordSection } from '../../services/medicalRecords';
import { generateClinicalPassportPDF } from '../../services/pdfPassportService';
import { PageHeader } from '../layout';
import { Alert, Button, FormField, Modal, SelectInput, Skeleton, StateMessage, Textarea, TextInput } from '../ui';

const groups = [
  { title: 'Health background', keys: ['background', 'otherConditions'] },
  { title: 'Medications & therapies', keys: ['medications', 'therapy'] },
  { title: 'Procedures & hospital care', keys: ['surgeries', 'hospitalizations', 'transfusions'] },
  { title: 'Laboratory records', keys: ['labs'] },
  { title: 'Immunizations', keys: ['immunizations'] },
  { title: 'Care information', keys: ['care'] },
];
const fieldsFor = (section: RecordSection): RecordField[] => section.stringList
  ? [{ key: 'value', label: section.title === 'Conditions' ? 'Condition' : 'Immunization information', required: true }]
  : section.fields ?? [];
interface Editor { section: RecordSection; index?: number; draft: Record<string, string>; }

export const MedicalRecords: React.FC<{ userId: string }> = ({ userId }) => {
  const [data, setData] = useState<MedicalRecordData>({});
  const [readState, setReadState] = useState<'loading' | 'recorded' | 'cached' | 'empty' | 'unavailable'>('loading');
  const [reload, setReload] = useState(0);
  const [editor, setEditor] = useState<Editor | null>(null);
  const [deletion, setDeletion] = useState<{ section: RecordSection; index: number } | null>(null);
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
  useEffect(() => { if (!deletion) removalFocusRef.current?.focus(); }, [deletion]);

  const itemsFor = (section: RecordSection): unknown[] => Array.isArray(data[section.key]) ? data[section.key] as unknown[] : [];
  const beginEdit = (section: RecordSection, index?: number) => {
    triggerRef.current = document.activeElement as HTMLElement;
    const item = index === undefined ? {} : itemsFor(section)[index];
    const source = section.stringList ? { value: item } : section.itemLabel ? (isRecord(item) ? item : {}) : data;
    const draft: Record<string, string> = {};
    fieldsFor(section).forEach(field => {
      const value = fieldValue(source, field.key);
      draft[field.key] = typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean' ? String(value) : '';
    });
    setFieldErrors({}); setError(''); setEditor({ section, index, draft });
  };
  const closeEditor = () => { setEditor(null); setError(''); };

  const persist = async (patch: MedicalRecordData) => {
    if (busy.current) return false;
    busy.current = true; setSaving(true); setError(''); setNotice('');
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
    } finally { busy.current = false; setSaving(false); }
  };

  const saveEditor = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!editor || busy.current) return;
    const errors: Record<string, string> = {};
    fieldsFor(editor.section).forEach(field => {
      const value = editor.draft[field.key].trim();
      if (field.required && !value) errors[field.key] = 'Enter ' + field.label.toLowerCase() + '.';
      if (field.type === 'number' && value && (!Number.isFinite(Number(value)) || Number(value) < 0)) errors[field.key] = 'Enter a number of zero or more.';
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

  const renderFields = (source: MedicalRecordData, fields: RecordField[]) => (
    <dl className="grid gap-3 sm:grid-cols-2">
      {fields.map(field => <div key={field.key} className="min-w-0">
        <dt className="text-small font-medium text-foreground-secondary">{field.label}</dt>
        <dd className="mt-1 whitespace-pre-wrap break-words text-body text-foreground">{displayValue(fieldValue(source, field.key))}</dd>
      </div>)}
    </dl>
  );

  const renderSection = (section: RecordSection) => {
    const items = itemsFor(section);
    const editing = editor?.section.key === section.key;
    return <section key={section.key} aria-label={section.title} className="space-y-4">
      <h3 className="text-heading-3 text-foreground">{section.title}</h3>
      {section.itemLabel ? <>
        {!items.length && <p className="text-body text-foreground-secondary">No information recorded yet.</p>}
        <ul className="divide-y divide-line">
          {items.map((item, index) => <li key={index} className="space-y-3 py-4 first:pt-0">
            {section.stringList ? <p className="whitespace-pre-wrap break-words text-body">{displayValue(item)}</p>
              : isRecord(item) ? renderFields(item, section.fields ?? [])
                : <p className="text-small text-foreground-secondary">This older entry cannot be displayed in the current format. It has been preserved.</p>}
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" disabled={saving || Boolean(editor)} onClick={() => beginEdit(section, index)}>Edit {section.itemLabel} {index + 1}</Button>
              <Button variant="ghost" disabled={saving || Boolean(editor)} onClick={event => {
                removalFocusRef.current = event.currentTarget.closest('section')?.querySelector<HTMLElement>('[data-record-add]') ?? null;
                setError(''); setDeletion({ section, index });
              }}>Remove {section.itemLabel} {index + 1}</Button>
            </div>
          </li>)}
        </ul>
      </> : renderFields(data, section.fields ?? [])}
      <Button data-record-add variant="secondary" disabled={saving || Boolean(editor)} onClick={() => beginEdit(section)}>
        {section.itemLabel ? 'Add ' + section.itemLabel : 'Edit ' + section.title.toLowerCase()}
      </Button>
      {editing && editor && <form onSubmit={saveEditor} noValidate className="space-y-4 border-t border-line pt-4">
        <h4 ref={editorRef} tabIndex={-1} className="text-heading-3 focus-visible:outline focus-visible:outline-focus">
          {editor.index === undefined && section.itemLabel ? 'Add ' + section.itemLabel : 'Edit ' + section.title.toLowerCase()}
        </h4>
        <div className="grid gap-4 sm:grid-cols-2">
          {fieldsFor(section).map(field => <FormField key={field.key} label={field.label} required={field.required} error={fieldErrors[field.key]}>
            {field.type === 'multiline' ? <Textarea disabled={saving} value={editor.draft[field.key]} onChange={event => setEditor({ ...editor, draft: { ...editor.draft, [field.key]: event.target.value } })} />
              : field.type === 'boolean' ? <SelectInput disabled={saving} value={editor.draft[field.key]} onChange={event => setEditor({ ...editor, draft: { ...editor.draft, [field.key]: event.target.value } })}>
                <option value="">Not recorded</option><option value="true">Yes</option><option value="false">No</option>
              </SelectInput>
              : <TextInput disabled={saving} type={field.type === 'number' ? 'number' : 'text'} step={field.type === 'number' ? 'any' : undefined} min={field.type === 'number' ? 0 : undefined} value={editor.draft[field.key]} onChange={event => setEditor({ ...editor, draft: { ...editor.draft, [field.key]: event.target.value } })} />}
          </FormField>)}
        </div>
        {error && <Alert tone="danger" title="Not saved" live="assertive">{error}</Alert>}
        <div className="flex flex-wrap gap-3">
          <Button type="submit" loading={saving} loadingLabel="Saving information…">Save information</Button>
          <Button variant="secondary" disabled={saving} onClick={closeEditor}>Cancel editing</Button>
        </div>
      </form>}
    </section>;
  };

  return <div className="space-y-6" data-semantic>
    <PageHeader title="Medical records" description="Patient-maintained information about your health background and care. These entries are not clinician-verified records." />
    {readState === 'loading' ? <div role="status" aria-label="Loading medical records"><Skeleton className="h-32" /></div>
      : readState === 'unavailable' ? <StateMessage state="error" title="Medical records unavailable" description="Your account records could not be loaded, and no usable copy is available on this device. Your records have not been changed." action={<Button onClick={() => setReload(value => value + 1)}>Try again</Button>} />
      : <>
        {readState === 'cached' && <Alert tone="warning" title="Showing information saved on this device">Cloud confirmation is unavailable. This copy may not include changes from another device.</Alert>}
        {notice && <Alert tone={notice.startsWith('Saved only') ? 'warning' : 'info'} title="Save status" live="polite">{notice}</Alert>}
        {!hasMedicalInformation(data) ? <StateMessage state="empty" title="No information recorded yet" description="Add only information you know. Missing details will stay unrecorded." />
          : <Alert tone="neutral" title="Review existing information">Earlier versions could save sample information. Check existing entries before using or sharing them; their authorship and clinical accuracy have not been verified.</Alert>}
        <p className="text-small text-foreground-secondary">Daily pain, symptoms, hydration, and check-ins remain in Health History. Medication entries here describe history and do not change your Home medication schedule.</p>
        <div className="divide-y divide-line rounded-card border border-line bg-surface">
          {groups.map((group, index) => <details key={group.title} open={index === 0 ? true : undefined} className="group">
            <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-3 px-4 py-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-focus sm:px-5">
              <h2 className="text-heading-2 text-foreground">{group.title}</h2><ChevronDown size={20} aria-hidden="true" className="shrink-0" />
            </summary>
            <div className="space-y-6 border-t border-line px-4 py-5 sm:px-5">
              {recordSections.filter(section => group.keys.includes(section.key)).map(renderSection)}
            </div>
          </details>)}
        </div>
        <section aria-labelledby="medical-summary-title" className="space-y-3">
          <h2 id="medical-summary-title" className="text-heading-2">Health summary</h2>
          <p className="max-w-prose text-small text-foreground-secondary">Download the information shown in these sections. The summary contains no generated advice and is not a clinician-approved care plan. Review existing entries before sharing it.</p>
          <Button disabled={!hasMedicalInformation(data) || saving || Boolean(editor)} loading={exporting} leadingIcon={<Download size={18} />} onClick={async () => {
            setExporting(true); setError('');
            try { await generateClinicalPassportPDF(data); }
            catch { setError('The summary could not be downloaded. Please try again.'); }
            finally { setExporting(false); }
          }}>Download health summary</Button>
          {error && !editor && !deletion && <Alert tone="danger" title="Download unavailable">{error}</Alert>}
        </section>
      </>}
    <Modal open={Boolean(deletion)} onOpenChange={open => { if (!open && !saving) { setDeletion(null); setError(''); } }} title="Remove recorded information?" description="This removes the selected entry from your patient-maintained records." footer={<div className="flex flex-wrap gap-3">
      <Button variant="secondary" disabled={saving} onClick={() => { setDeletion(null); setError(''); }}>Keep entry</Button>
      <Button variant="danger" loading={saving} onClick={async () => {
        if (!deletion) return;
        const next = itemsFor(deletion.section).filter((_, index) => index !== deletion.index);
        if (await persist({ [deletion.section.key]: next })) setDeletion(null);
      }}>Remove entry</Button>
    </div>}>
      {error && <Alert tone="danger" title="Not removed" live="assertive">{error}</Alert>}
    </Modal>
  </div>;
};
