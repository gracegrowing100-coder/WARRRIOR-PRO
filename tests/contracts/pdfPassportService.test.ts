import { beforeEach, describe, expect, it, vi } from 'vitest';
const pdf = vi.hoisted(() => ({ setFont: vi.fn(), setFontSize: vi.fn(), splitTextToSize: vi.fn((text: string) => [text]), text: vi.fn(), addPage: vi.fn(), save: vi.fn() }));
vi.mock('jspdf', () => ({ jsPDF: class { constructor() { return pdf; } } }));
import { generateClinicalPassportPDF } from '../../services/pdfPassportService';
describe('Factual patient health summary', () => {
  beforeEach(() => vi.clearAllMocks());
  it('exports missing values without invented patient data, advice, or verification', () => {
    generateClinicalPassportPDF({});
    const text = pdf.text.mock.calls.map(call => call[0]).join(' ');
    expect(text).toContain('Not clinician-verified');
    expect(text).toContain('Not recorded');
    expect(text).not.toMatch(/HbSS|7.5|8.2|Hydroxyurea 500|Folic Acid|Penicillin VK|MD5|W-PASSPORT|Vance|555|30 mins|IV Normal/);
    expect(pdf.save).toHaveBeenCalledWith('Patient_Health_Summary.pdf');
  });
  it('retains zeroes, inactive medication status, and long actual values with pagination', () => {
    generateClinicalPassportPDF({ medications: [{ name: 'Recorded medicine', isActive: false }], labs: [{ date: 'Original date', hemoglobin: 0 }], notesJournal: 'Recorded note' });
    const text = pdf.text.mock.calls.map(call => call[0]).join(' ');
    expect(text).toContain('Medication name: Recorded medicine');
    expect(text).toContain('Currently taking: No');
    expect(text).toContain('Haemoglobin (g/dL): 0');
    expect(text).toContain('Laboratory date: Original date');
    expect(pdf.addPage).toHaveBeenCalled();
  });
});
