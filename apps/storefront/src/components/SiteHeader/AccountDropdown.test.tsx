import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import AccountDropdown from './AccountDropdown';
import { useAuthStore } from '@/store/authStore';

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
  }),
}));

describe('AccountDropdown Component', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    useAuthStore.setState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      checkAuth: vi.fn().mockResolvedValue(undefined),
    });
  });

  it('renders guest trigger and opens guest options on click', async () => {
    await act(async () => {
      render(<AccountDropdown />);
    });

    expect(screen.getByText('Sign in')).toBeDefined();
    expect(screen.getByText('Account')).toBeDefined();

    const trigger = screen.getByRole('button', { name: /account menu/i });
    act(() => {
      fireEvent.click(trigger);
    });

    expect(screen.getByText('Welcome to Meadow Mist')).toBeDefined();
    expect(screen.getByText('Start here')).toBeDefined();
    expect(screen.getByText('Track Orders')).toBeDefined();
  });

  it('renders authenticated trigger and opens user links on click', async () => {
    useAuthStore.setState({
      user: {
        id: 'usr_42',
        name: 'Aarav Mehta',
        email: 'aarav@example.com',
      },
      isAuthenticated: true,
      isLoading: false,
      checkAuth: vi.fn().mockResolvedValue(undefined),
    });

    await act(async () => {
      render(<AccountDropdown />);
    });

    expect(screen.getByText('Hello')).toBeDefined();
    expect(screen.getByText('Aarav')).toBeDefined();

    const trigger = screen.getByRole('button', { name: /account menu/i });
    act(() => {
      fireEvent.click(trigger);
    });

    expect(screen.getByText('Aarav Mehta')).toBeDefined();
    expect(screen.getByText('aarav@example.com')).toBeDefined();
    expect(screen.getByText('My Orders')).toBeDefined();
    expect(screen.getByText('Saved Addresses')).toBeDefined();
    expect(screen.getByText('Change Password')).toBeDefined();
    expect(screen.getByText('My Wishlist')).toBeDefined();
    expect(screen.getByText('Sign Out')).toBeDefined();
  });

  it('triggers exit animation when Escape key is pressed', async () => {
    await act(async () => {
      render(<AccountDropdown />);
    });

    const trigger = screen.getByRole('button', { name: /account menu/i });
    act(() => {
      fireEvent.click(trigger);
    });
    expect(screen.getByText('Welcome to Meadow Mist')).toBeDefined();

    act(() => {
      fireEvent.keyDown(document, { key: 'Escape' });
    });

    const menu = screen.getByRole('menu');
    expect(menu.className).toContain('dropdownCardClosing');

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 250));
    });

    expect(screen.queryByText('Welcome to Meadow Mist')).toBeNull();
  });
});
