import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { OrderReturnModal } from './OrderReturnModal';

describe('OrderReturnModal Component', () => {
  const mockItems = [
    { id: 'item_1', productName: 'Botanical Amber Soy Candle', quantity: 2 },
    { id: 'item_2', productName: 'Fluted Ceramic Saucer', quantity: 1 },
  ];

  it('returns null when isOpen is false', () => {
    const { container } = render(
      <OrderReturnModal
        isOpen={false}
        orderNumber="MM-ORD-1001"
        items={mockItems}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders 7-day handcrafted guarantee and item checkboxes', () => {
    render(
      <OrderReturnModal
        isOpen={true}
        orderNumber="MM-ORD-1001"
        items={mockItems}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
      />
    );

    expect(screen.getByText(/Request Return #MM-ORD-1001/i)).toBeDefined();
    expect(screen.getByText(/7-Day Handcrafted Guarantee/i)).toBeDefined();
    expect(screen.getByText(/Botanical Amber Soy Candle \(Qty: 2\)/i)).toBeDefined();
    expect(screen.getByText(/Fluted Ceramic Saucer \(Qty: 1\)/i)).toBeDefined();
  });

  it('renders candle hygiene policy and transit breakage protocol notices', () => {
    render(
      <OrderReturnModal
        isOpen={true}
        orderNumber="MM-ORD-1001"
        items={mockItems}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
      />
    );

    expect(screen.getByText(/Candle Hygiene & Safety Policy/i)).toBeDefined();
    expect(screen.getByText(/Used or burned candles cannot be returned/i)).toBeDefined();
    expect(screen.getByText(/Transit Breakage Protocol/i)).toBeDefined();
    expect(screen.getByText(/within 48 hours of delivery/i)).toBeDefined();
    expect(screen.getByText(/Shipping sharp shards of broken ceramic back/i)).toBeDefined();
  });

  it('switches resolution preference between refund and replacement', () => {
    render(
      <OrderReturnModal
        isOpen={true}
        orderNumber="MM-ORD-1001"
        items={mockItems}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
      />
    );

    const replacementOption = screen.getByText('Studio Replacement');
    fireEvent.click(replacementOption);

    const replacementRadio = screen.getByRole('radio', { name: /studio replacement/i });
    expect((replacementRadio as HTMLInputElement).checked).toBe(true);
  });

  it('submits return request with structured details, resolution preference, and images', async () => {
    const onConfirm = vi.fn().mockResolvedValue(undefined);
    render(
      <OrderReturnModal
        isOpen={true}
        orderNumber="MM-ORD-1001"
        items={mockItems}
        onClose={vi.fn()}
        onConfirm={onConfirm}
      />
    );

    const reasonSelect = screen.getByLabelText(/Reason for Return/i);
    fireEvent.change(reasonSelect, {
      target: { value: 'Defective wick / improper burn / wax leak' },
    });

    const replacementOption = screen.getByText('Studio Replacement');
    fireEvent.click(replacementOption);

    const notesInput = screen.getByLabelText(/Craftsmanship Details/i);
    fireEvent.change(notesInput, {
      target: { value: 'Wick drowned on first burn' },
    });

    const submitBtn = screen.getByRole('button', { name: /Submit Return Request/i });
    await act(async () => {
      fireEvent.click(submitBtn);
    });

    expect(onConfirm).toHaveBeenCalledWith({
      reason: 'Defective wick / improper burn / wax leak',
      resolutionPreference: 'REPLACEMENT',
      notes: 'Wick drowned on first burn',
      selectedItems: ['item_1', 'item_2'],
      images: [],
    });
  });

  it('calls onClose when clicking Keep Items or close button', () => {
    const onClose = vi.fn();
    render(
      <OrderReturnModal
        isOpen={true}
        orderNumber="MM-ORD-1001"
        items={mockItems}
        onClose={onClose}
        onConfirm={vi.fn()}
      />
    );

    const keepBtn = screen.getByRole('button', { name: /Keep Items/i });
    fireEvent.click(keepBtn);
    expect(onClose).toHaveBeenCalledTimes(1);

    const closeBtn = screen.getByLabelText(/Close dialog/i);
    fireEvent.click(closeBtn);
    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it('rejects defect photo exceeding 5MB limit before making network request', async () => {
    const fetchSpy = vi.spyOn(global, 'fetch');
    const { container } = render(
      <OrderReturnModal
        isOpen={true}
        orderNumber="MM-ORD-1001"
        items={mockItems}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
      />
    );

    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
    const largeFile = new File(['a'.repeat(100)], 'defect-photo.jpg', {
      type: 'image/jpeg',
    });
    Object.defineProperty(largeFile, 'size', { value: 6 * 1024 * 1024 });

    fireEvent.change(fileInput, { target: { files: [largeFile] } });

    expect(await screen.findByText(/exceeds 5MB limit/i)).toBeDefined();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('rejects defect photo with invalid file format before making network request', async () => {
    const fetchSpy = vi.spyOn(global, 'fetch');
    const { container } = render(
      <OrderReturnModal
        isOpen={true}
        orderNumber="MM-ORD-1001"
        items={mockItems}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
      />
    );

    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
    const invalidFile = new File(['content'], 'defect.pdf', {
      type: 'application/pdf',
    });

    fireEvent.change(fileInput, { target: { files: [invalidFile] } });

    expect(await screen.findByText(/invalid format/i)).toBeDefined();
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
