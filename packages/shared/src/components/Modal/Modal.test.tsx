import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Modal } from './Modal';

describe('Shared Modal Component', () => {
  it('renders children when isOpen is true', () => {
    render(
      <Modal isOpen={true} onClose={() => {}} title="Test Title">
        <p>Modal content</p>
      </Modal>
    );

    expect(screen.getByRole('dialog')).toBeDefined();
    expect(screen.getByText('Test Title')).toBeDefined();
    expect(screen.getByText('Modal content')).toBeDefined();
  });

  it('renders nothing when isOpen is false', () => {
    const { container } = render(
      <Modal isOpen={false} onClose={() => {}} title="Test Title">
        <p>Modal content</p>
      </Modal>
    );

    expect(container.firstElementChild).toBeNull();
  });

  it('triggers onClose when Escape key is pressed', () => {
    const handleClose = vi.fn();
    render(
      <Modal isOpen={true} onClose={handleClose} title="Escape Test">
        <p>Content</p>
      </Modal>
    );

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('triggers onClose when close button is clicked', () => {
    const handleClose = vi.fn();
    render(
      <Modal isOpen={true} onClose={handleClose} title="Close Button Test">
        <p>Content</p>
      </Modal>
    );

    const closeBtn = screen.getByRole('button', { name: /close dialog/i });
    fireEvent.click(closeBtn);
    expect(handleClose).toHaveBeenCalledTimes(1);
  });
});
