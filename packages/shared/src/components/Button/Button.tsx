import React, { forwardRef } from 'react';
import styles from './Button.module.css';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  fullWidth?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    children,
    variant = 'primary',
    size = 'md',
    isLoading = false,
    fullWidth = false,
    disabled = false,
    className,
    type = 'button',
    ...rest
  },
  ref
) {
  const variantClass = styles[variant] || styles.primary;
  const sizeClass = styles[size] || styles.md;
  const fullWidthClass = fullWidth ? styles.fullWidth : '';
  const disabledClass = disabled || isLoading ? styles.disabled : '';

  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || isLoading}
      aria-busy={isLoading}
      className={`${styles.button} ${variantClass} ${sizeClass} ${fullWidthClass} ${disabledClass} ${className || ''}`.trim()}
      {...rest}
    >
      {isLoading && <span className={styles.spinner} aria-hidden="true" />}
      <span>{children}</span>
    </button>
  );
});

export default Button;
