import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ShellLayout } from './ShellLayout';

const mockUsePathname = vi.fn();

vi.mock('next/navigation', () => ({
  usePathname: () => mockUsePathname(),
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock('../Sidebar/Sidebar', () => ({
  Sidebar: () => <nav data-testid="sidebar">Sidebar</nav>,
}));

vi.mock('../Topbar/Topbar', () => ({
  Topbar: () => <header data-testid="topbar">Topbar</header>,
}));

describe('ShellLayout Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders only children without sidebar and topbar on /login', () => {
    mockUsePathname.mockReturnValue('/login');

    render(
      <ShellLayout>
        <div data-testid="login-content">Login Form</div>
      </ShellLayout>
    );

    expect(screen.getByTestId('login-content')).toBeDefined();
    expect(screen.queryByTestId('sidebar')).toBeNull();
    expect(screen.queryByTestId('topbar')).toBeNull();
  });

  it('renders sidebar, topbar, and main content on dashboard routes', () => {
    mockUsePathname.mockReturnValue('/products');

    render(
      <ShellLayout>
        <div data-testid="page-content">Products Page Content</div>
      </ShellLayout>
    );

    expect(screen.getByTestId('sidebar')).toBeDefined();
    expect(screen.getByTestId('topbar')).toBeDefined();
    expect(screen.getByTestId('page-content')).toBeDefined();
  });
});
