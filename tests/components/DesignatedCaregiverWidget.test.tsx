import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';

import { DesignatedCaregiverWidget } from '../../components/DesignatedCaregiverWidget';

describe('DesignatedCaregiverWidget patient data', () => {
  beforeEach(() => localStorage.clear());

  it('starts empty and does not expose contact actions for a fabricated caregiver', () => {
    render(<DesignatedCaregiverWidget userId="patient-1" />);

    expect(screen.getByText('No designated caregiver recorded')).toBeInTheDocument();
    expect(screen.queryByText(/Evelyn Vance/i)).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /Call Now/i })).not.toBeInTheDocument();
  });

  it('loads only the current account caregiver cache', () => {
    localStorage.setItem('warrior_designated_caregiver', JSON.stringify({ name: 'Legacy Contact', phone: '+111' }));
    localStorage.setItem('warrior_designated_caregiver_patient-2', JSON.stringify({ name: 'Other Contact', phone: '+222' }));
    localStorage.setItem('warrior_designated_caregiver_patient-1', JSON.stringify({ name: 'My Contact', relationship: 'Parent', phone: '+333' }));

    render(<DesignatedCaregiverWidget userId="patient-1" />);

    expect(screen.getByText('My Contact')).toBeInTheDocument();
    expect(screen.queryByText('Legacy Contact')).not.toBeInTheDocument();
    expect(screen.queryByText('Other Contact')).not.toBeInTheDocument();
  });

  it('saves a user-entered caregiver to the UID-scoped cache', async () => {
    const user = userEvent.setup();
    render(<DesignatedCaregiverWidget userId="patient-1" />);

    await user.click(screen.getByRole('button', { name: /Add Info/i }));
    await user.type(screen.getByPlaceholderText('Caregiver or trusted contact name'), 'Ada Okafor');
    await user.type(screen.getByPlaceholderText('e.g. Spouse / Primary Support'), 'Sibling');
    await user.type(screen.getByPlaceholderText('Include country code'), '+2348000000000');
    await user.click(screen.getByRole('button', { name: /Save Caregiver Profile/i }));

    expect(JSON.parse(localStorage.getItem('warrior_designated_caregiver_patient-1') || '{}')).toEqual(
      expect.objectContaining({ name: 'Ada Okafor', relationship: 'Sibling', phone: '+2348000000000' }),
    );
    expect(localStorage.getItem('warrior_designated_caregiver')).toBeNull();
  });
});
