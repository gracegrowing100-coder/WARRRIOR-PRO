import React from 'react';
import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
const service = vi.hoisted(() => ({ getCareVaultResult: vi.fn(), saveCareVault: vi.fn() }));
vi.mock('../../../services/firebaseService', () => ({ firebaseService: service }));
vi.mock('../../../services/pdfPassportService', () => ({ generateClinicalPassportPDF: vi.fn() }));
vi.mock('../../../components/health', () => ({ HealthHistory: () => <div>Health History timeline</div> }));
import { CareHub } from '../../../components/care/CareHub';
import { CareVault } from '../../../components/CareVault';

const openRecords = async (user: ReturnType<typeof userEvent.setup>) => {
  render(<CareHub userId="A" onOpenAppointments={vi.fn()} />);
  await user.click(screen.getByRole('button', { name: 'Open records: Medical records' }));
  await screen.findByRole('heading', { name: 'Medical records' });
};
const expand = async (user: ReturnType<typeof userEvent.setup>, name: string) => {
  await user.click(screen.getByRole('heading', { level: 2, name }));
};
describe('Patient-maintained Medical Records', () => {
  beforeEach(() => {
    service.getCareVaultResult.mockReset().mockResolvedValue({ state: 'empty', data: {} });
    service.saveCareVault.mockReset().mockResolvedValue({ state: 'recorded' });
  });
  it('opens from Care, needs no unlock, stays empty, and returns using the keyboard', async () => {
    const user = userEvent.setup();
    await openRecords(user);
    expect(await screen.findByText('No information recorded yet')).toBeInTheDocument();
    expect(screen.getByText(/Patient-maintained information/)).toBeInTheDocument();
    expect(document.body.textContent).not.toMatch(/1234|fingerprint|AES-256|decrypting|encrypted sync|double-secured|MD5|HIPAA|HbSS|Asthma|Hydroxyurea 1500|Martinez|Predictive Analysis|8.2 g/);
    expect(screen.getByRole('button', { name: 'Download health summary' })).toBeDisabled();
    expect(service.saveCareVault).not.toHaveBeenCalled();
    screen.getByRole('button', { name: 'Back to Care' }).focus();
    await user.keyboard('{Enter}');
    expect(screen.getByRole('heading', { level: 1, name: 'Care' })).toBeInTheDocument();
  });
  it('preserves stored values and zero labs without exposing excluded legacy tools', async () => {
    service.getCareVaultResult.mockResolvedValue({ state: 'recorded', data: {
      primaryDiagnosis: 'Patient-entered diagnosis', allergies: '', otherConditions: ['Recorded condition'],
      medications: [{ id: 'm-own', name: 'Recorded medication', isActive: false }],
      labs: [{ id: 'l-own', date: '2026-09-20', hemoglobin: 0 }], immunizations: ['Recorded vaccination'],
      painCrises: [{ chiefComplaint: 'Excluded legacy symptom' }], attachedFiles: [{ name: 'mock-scan.pdf' }],
    } });
    const user = userEvent.setup(); await openRecords(user);
    expect(await screen.findByText('Patient-entered diagnosis')).toBeInTheDocument();
    expect(screen.getByText('Recorded condition')).toBeInTheDocument();
    await expand(user, 'Medications & therapies');
    expect(screen.getByText('Recorded medication')).toBeVisible();
    expect(screen.getByText('No', { selector: 'dd' })).toBeVisible();
    await expand(user, 'Laboratory records');
    expect(screen.getByText('0', { selector: 'dd' })).toBeVisible();
    await expand(user, 'Immunizations');
    expect(screen.getByText('Recorded vaccination')).toBeVisible();
    expect(screen.queryByText(/Excluded legacy symptom|mock-scan.pdf/)).not.toBeInTheDocument();
  });
  it.each(['loading', 'unavailable'])('keeps Back to Care available in %s state', async state => {
    service.getCareVaultResult.mockImplementation(() => state === 'loading' ? new Promise(() => {}) : Promise.resolve({ state, data: {} }));
    const user = userEvent.setup(); await openRecords(user);
    await user.click(screen.getByRole('button', { name: 'Back to Care' }));
    expect(screen.getByRole('heading', { name: 'Care', level: 1 })).toBeInTheDocument();
  });
  it('retries unavailable records without creating a sample or saving anything', async () => {
    service.getCareVaultResult.mockResolvedValueOnce({ state: 'unavailable', data: {} });
    const user = userEvent.setup(); await openRecords(user);
    await user.click(await screen.findByRole('button', { name: 'Try again' }));
    expect(await screen.findByText('No information recorded yet')).toBeInTheDocument();
    expect(service.saveCareVault).not.toHaveBeenCalled();
  });
  it('saves only explicit edits and reports device-only storage with focus restoration', async () => {
    service.saveCareVault.mockResolvedValueOnce({ state: 'device-only' });
    const user = userEvent.setup(); await openRecords(user);
    const edit = screen.getByRole('button', { name: 'Edit health background' });
    await user.click(edit);
    expect(screen.getByLabelText('Diagnosis')).toHaveValue('');
    expect(screen.getByLabelText('Allergies')).toHaveValue('');
    await user.type(screen.getByLabelText('Allergies'), 'Patient-entered allergy');
    expect(service.saveCareVault).not.toHaveBeenCalled();
    await user.click(screen.getByRole('button', { name: 'Save information' }));
    expect(service.saveCareVault).toHaveBeenCalledWith('A', { allergies: 'Patient-entered allergy' });
    expect(await screen.findByText(/Saved only on this device/)).toBeInTheDocument();
    await waitFor(() => expect(edit).toHaveFocus());
  });
  it('retains a failed edit and permits retry without claiming success', async () => {
    service.saveCareVault.mockRejectedValueOnce(new Error('storage failure'));
    const user = userEvent.setup(); await openRecords(user);
    await user.click(screen.getByRole('button', { name: 'Edit health background' }));
    await user.type(screen.getByLabelText('Diagnosis'), 'Entered diagnosis');
    await user.click(screen.getByRole('button', { name: 'Save information' }));
    expect(await screen.findByText('Not saved')).toBeInTheDocument();
    expect(screen.getByLabelText('Diagnosis')).toHaveValue('Entered diagnosis');
    await user.click(screen.getByRole('button', { name: 'Save information' }));
    expect(await screen.findByText(/Changes recorded in your account/)).toBeInTheDocument();
  });
  it('adds an actual lab value without filling unrelated measurements', async () => {
    const user = userEvent.setup(); await openRecords(user); await expand(user, 'Laboratory records');
    await user.click(screen.getByRole('button', { name: 'Add laboratory record' }));
    await user.type(screen.getByLabelText(/Laboratory date/), '2026-09-29');
    await user.type(screen.getByLabelText(/Haemoglobin/), '0');
    await user.click(screen.getByRole('button', { name: 'Save information' }));
    expect(service.saveCareVault).toHaveBeenCalledWith('A', { labs: [{ id: expect.any(String), date: '2026-09-29', hemoglobin: 0 }] });
  });
  it('requires explicit removal confirmation and preserves the remaining entries', async () => {
    service.getCareVaultResult.mockResolvedValueOnce({ state: 'recorded', data: { otherConditions: ['First', 'Second'] } });
    const user = userEvent.setup(); await openRecords(user);
    await user.click(screen.getByRole('button', { name: 'Remove condition 1' }));
    expect(service.saveCareVault).not.toHaveBeenCalled();
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Remove entry' }));
    expect(service.saveCareVault).toHaveBeenCalledWith('A', { otherConditions: ['Second'] });
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(screen.getByRole('button', { name: 'Add condition' })).toHaveFocus();
  });
  it('cannot show a previous account while the next account loads', async () => {
    service.getCareVaultResult.mockResolvedValueOnce({ state: 'recorded', data: { primaryDiagnosis: 'Only account A' } });
    const { rerender } = render(<CareVault userId="A" />);
    await screen.findByText('Only account A');
    let finish: (value: unknown) => void = () => {};
    service.getCareVaultResult.mockImplementationOnce(() => new Promise(resolve => { finish = resolve; }));
    rerender(<CareVault userId="B" />);
    expect(screen.queryByText('Only account A')).not.toBeInTheDocument();
    await act(async () => finish({ state: 'unavailable', data: {} }));
    expect(await screen.findByText('Medical records unavailable')).toBeInTheDocument();
  });
});
