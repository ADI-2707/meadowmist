import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import CustomerPhotosGallery from './CustomerPhotosGallery';
import type { Review } from '@meadowmist/shared';

describe('CustomerPhotosGallery Component', () => {
  it('returns null when no photos or reviews are provided', () => {
    const { container } = render(<CustomerPhotosGallery photos={[]} reviews={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders ribbon with customer photos count and thumbnails', () => {
    const photos = ['/uploads/photo1.jpg', '/uploads/photo2.jpg'];
    render(<CustomerPhotosGallery photos={photos} />);

    expect(screen.getByText('Customer Photos')).toBeDefined();
    expect(screen.getByText('(2)')).toBeDefined();

    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBe(2);
  });

  it('opens lightbox on thumbnail click and displays review details', () => {
    const review: Review = {
      id: 'rev-1',
      productId: 'p-1',
      userId: 'u-1',
      rating: 5,
      title: 'Stunning glaze and burn',
      comment: 'Arrived packaged safely in compostable paper.',
      user: { name: 'Alara V.' },
      isVerifiedPurchase: true,
      isApproved: true,
      createdAt: '2026-10-15T00:00:00.000Z',
      images: ['/uploads/candle1.jpg'],
    };

    render(<CustomerPhotosGallery reviews={[review]} />);

    const thumbBtn = screen.getByLabelText('View photo 1 of 1');
    fireEvent.click(thumbBtn);

    expect(screen.getByRole('dialog')).toBeDefined();
    expect(screen.getByText('Alara V.')).toBeDefined();
    expect(screen.getByText('Verified Purchase')).toBeDefined();
    expect(screen.getByText('Stunning glaze and burn')).toBeDefined();
    expect(screen.getByText('Arrived packaged safely in compostable paper.')).toBeDefined();
    expect(screen.getByText('Photo 1 of 1')).toBeDefined();
  });

  it('navigates next and previous photos in lightbox', () => {
    const photos = ['/uploads/photo1.jpg', '/uploads/photo2.jpg', '/uploads/photo3.jpg'];
    render(<CustomerPhotosGallery photos={photos} />);

    fireEvent.click(screen.getByLabelText('View photo 1 of 3'));
    expect(screen.getByText('Photo 1 of 3')).toBeDefined();

    fireEvent.click(screen.getByLabelText('Next photo'));
    expect(screen.getByText('Photo 2 of 3')).toBeDefined();

    fireEvent.click(screen.getByLabelText('Previous photo'));
    expect(screen.getByText('Photo 1 of 3')).toBeDefined();
  });

  it('closes lightbox when close button is clicked', () => {
    const photos = ['/uploads/photo1.jpg'];
    render(<CustomerPhotosGallery photos={photos} />);

    fireEvent.click(screen.getByLabelText('View photo 1 of 1'));
    expect(screen.getByRole('dialog')).toBeDefined();

    fireEvent.click(screen.getByLabelText('Close photo modal'));
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('closes lightbox when Escape key is pressed', () => {
    const photos = ['/uploads/photo1.jpg'];
    render(<CustomerPhotosGallery photos={photos} />);

    fireEvent.click(screen.getByLabelText('View photo 1 of 1'));
    expect(screen.getByRole('dialog')).toBeDefined();

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).toBeNull();
  });
});
