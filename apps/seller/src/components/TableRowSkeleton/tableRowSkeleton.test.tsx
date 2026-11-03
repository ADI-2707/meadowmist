import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TableRowSkeleton } from './TableRowSkeleton';

describe('TableRowSkeleton', () => {
  it('renders specified number of rows and columns with aria-hidden', () => {
    render(
      <table>
        <tbody>
          <TableRowSkeleton columns={4} rows={3} />
        </tbody>
      </table>
    );

    const rows = screen.getAllByTestId('table-row-skeleton');
    expect(rows).toHaveLength(3);
    rows.forEach((row) => {
      expect(row.getAttribute('aria-hidden')).toBe('true');
      const cells = row.querySelectorAll('td');
      expect(cells).toHaveLength(4);
    });
  });
});
