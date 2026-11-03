'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  User,
  Package,
  MapPin,
  KeyRound,
  Heart,
  LogOut,
  ChevronDown,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import styles from './AccountDropdown.module.css';

export default function AccountDropdown() {
  const router = useRouter();
  const { user, isAuthenticated, checkAuth, logout } = useAuthStore();
  const [isOpen, setIsOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const closeTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    return () => {
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    };
  }, []);

  const closeDropdown = useCallback(() => {
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    setIsClosing(true);
    closeTimerRef.current = setTimeout(() => {
      setIsOpen(false);
      setIsClosing(false);
    }, 180);
  }, []);

  const toggleDropdown = () => {
    if (isOpen && !isClosing) {
      closeDropdown();
    } else {
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
      setIsClosing(false);
      setIsOpen(true);
    }
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        if (isOpen && !isClosing) {
          closeDropdown();
        }
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isOpen && !isClosing) {
          closeDropdown();
        }
      }
    };

    if (isOpen && !isClosing) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, isClosing, closeDropdown]);

  const handleLogout = async () => {
    closeDropdown();
    await logout(() => {
      router.push('/');
      router.refresh();
    });
  };

  const firstName = user?.name ? user.name.split(' ')[0] : 'Account';

  return (
    <div ref={containerRef} className={styles.wrapper}>
      <button
        type="button"
        className={`${styles.triggerBtn} ${isOpen && !isClosing ? styles.triggerBtnOpen : ''}`}
        onClick={toggleDropdown}
        aria-expanded={isOpen && !isClosing}
        aria-haspopup="true"
        aria-label="Account menu"
      >
        <span className={styles.userIconWrap}>
          <User size={18} />
        </span>
        <span className={styles.userLabel}>
          <span className={styles.userGreeting}>
            {isAuthenticated ? 'Hello' : 'Sign in'}
          </span>
          <span className={styles.userName}>
            {isAuthenticated ? firstName : 'Account'}
          </span>
        </span>
        <ChevronDown
          size={14}
          className={`${styles.chevron} ${isOpen && !isClosing ? styles.chevronRotated : ''}`}
        />
      </button>

      {(isOpen || isClosing) && (
        <div
          className={`${styles.dropdownCard} ${isClosing ? styles.dropdownCardClosing : ''}`}
          role="menu"
        >
          {isAuthenticated && user ? (
            <>
              <div className={styles.cardHeader}>
                <div className={styles.cardTitle}>{user.name}</div>
                <div className={styles.cardEmail}>{user.email}</div>
              </div>

              <div className={styles.menuList}>
                <Link
                  href="/account?tab=orders"
                  className={styles.menuItem}
                  onClick={closeDropdown}
                >
                  <span className={styles.menuIcon}>
                    <Package size={15} />
                  </span>
                  <span>My Orders</span>
                </Link>

                <Link
                  href="/account?tab=addresses"
                  className={styles.menuItem}
                  onClick={closeDropdown}
                >
                  <span className={styles.menuIcon}>
                    <MapPin size={15} />
                  </span>
                  <span>Saved Addresses</span>
                </Link>

                <Link
                  href="/account?tab=profile"
                  className={styles.menuItem}
                  onClick={closeDropdown}
                >
                  <span className={styles.menuIcon}>
                    <KeyRound size={15} />
                  </span>
                  <span>Change Password</span>
                </Link>

                <Link
                  href="/account?tab=wishlist"
                  className={styles.menuItem}
                  onClick={closeDropdown}
                >
                  <span className={styles.menuIcon}>
                    <Heart size={15} />
                  </span>
                  <span>My Wishlist</span>
                </Link>

                <div className={styles.divider} />

                <button
                  type="button"
                  onClick={handleLogout}
                  className={styles.logoutBtn}
                >
                  <span className={styles.menuIcon}>
                    <LogOut size={15} />
                  </span>
                  <span>Sign Out</span>
                </button>
              </div>
            </>
          ) : (
            <div className={styles.guestPrompt}>
              <div className={styles.cardTitle}>Welcome to Meadow Mist</div>
              <p className={styles.guestPromptText}>
                Sign in to view your orders, addresses, and wishlist.
              </p>
              <Link
                href="/login?redirect=/account"
                className={styles.signInBtn}
                onClick={closeDropdown}
              >
                Sign In
              </Link>
              <div className={styles.signupPrompt}>
                New customer?{' '}
                <Link
                  href="/signup"
                  className={styles.signupLink}
                  onClick={closeDropdown}
                >
                  Start here
                </Link>
              </div>
              <div className={styles.divider} />
              <Link
                href="/account?tab=orders"
                className={styles.menuItem}
                onClick={closeDropdown}
              >
                <span className={styles.menuIcon}>
                  <Package size={15} />
                </span>
                <span>Track Orders</span>
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
