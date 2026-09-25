import React from 'react';
import { render, screen } from '@testing-library/react';
import { FormField, SelectInput, Textarea, TextInput } from '../../../components/ui';

describe('FormField', () => {
  it('associates its label, help, error, and required state with the control', () => {
    render(
      <FormField
        id="pain-note"
        label="Pain note"
        helpText="Describe what changed."
        error="Enter at least two words."
        required
      >
        <TextInput />
      </FormField>,
    );

    const input = screen.getByRole('textbox', { name: /pain note/i });
    expect(input).toBeRequired();
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAttribute('aria-describedby', 'pain-note-help pain-note-error');
    expect(input).toHaveAttribute('aria-errormessage', 'pain-note-error');
    expect(screen.getByText('Enter at least two words.').closest('p')).toHaveAttribute('id', 'pain-note-error');
  });

  it('provides the same field contract to select and textarea controls', () => {
    render(
      <>
        <FormField id="status" label="Status">
          <SelectInput defaultValue="stable">
            <option value="stable">Stable</option>
          </SelectInput>
        </FormField>
        <FormField id="notes" label="Notes">
          <Textarea />
        </FormField>
      </>,
    );

    expect(screen.getByRole('combobox', { name: 'Status' })).toHaveAttribute('id', 'status');
    expect(screen.getByRole('textbox', { name: 'Notes' })).toHaveAttribute('id', 'notes');
  });
});
