import React, { useRef, useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button, Modal } from '../../../components/ui';

const ModalHarness: React.FC<{ initiallyOpen?: boolean }> = ({ initiallyOpen = false }) => {
  const [open, setOpen] = useState(initiallyOpen);
  const firstActionRef = useRef<HTMLButtonElement>(null);
  return (
    <>
      <Button onClick={() => setOpen(true)}>Open details</Button>
      <Modal
        open={open}
        onOpenChange={setOpen}
        title="Entry details"
        description="Review this information."
        initialFocusRef={firstActionRef}
        footer={<Button onClick={() => setOpen(false)}>Done</Button>}
      >
        <Button ref={firstActionRef}>First action</Button>
        <Button>Second action</Button>
      </Modal>
    </>
  );
};

describe('Modal', () => {
  it('renders a labelled portal, locks scroll, and places initial focus', () => {
    render(<ModalHarness initiallyOpen />);

    const dialog = screen.getByRole('dialog', { name: 'Entry details' });
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAccessibleDescription('Review this information.');
    expect(screen.getByRole('button', { name: 'First action' })).toHaveFocus();
    expect(document.body.style.overflow).toBe('hidden');
  });

  it('contains keyboard focus inside the dialog', async () => {
    const user = userEvent.setup();
    render(<ModalHarness initiallyOpen />);

    const close = screen.getByRole('button', { name: 'Close dialog' });
    close.focus();
    await user.tab({ shift: true });
    expect(screen.getByRole('button', { name: 'Done' })).toHaveFocus();
  });

  it('dismisses on Escape, restores focus, and releases scroll lock', async () => {
    const user = userEvent.setup();
    render(<ModalHarness />);

    const trigger = screen.getByRole('button', { name: 'Open details' });
    await user.click(trigger);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    await user.keyboard('{Escape}');

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
    expect(document.body.style.overflow).toBe('');
  });
});
