import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PageHeader } from './PageHeader';

describe('PageHeader Component', () => {
  it('renders title, eyebrow, subtitle, and action buttons', () => {
    render(
      <PageHeader
        title="Products Catalog"
        eyebrow="Inventory"
        subtitle="Manage handcrafted pieces and variants"
        actions={<button type="button">Add Product</button>}
      />
    );

    expect(screen.getByText('Products Catalog')).toBeDefined();
    expect(screen.getByText('Inventory')).toBeDefined();
    expect(screen.getByText('Manage handcrafted pieces and variants')).toBeDefined();
    expect(screen.getByRole('button', { name: 'Add Product' })).toBeDefined();
  });
});
