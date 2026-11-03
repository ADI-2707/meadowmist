import React, { useEffect, useRef } from 'react';
import styles from './Modal.module.css';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  maxWidth?: string | number;
  className?: string;
  hideCloseButton?: boolean;
}

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  maxWidth,
  className,
  hideCloseButton = false,
}: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className={styles.backdrop}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-label={title || 'Dialog'}
        className={`${styles.modal} ${className || ''}`.trim()}
        style={maxWidth ? { maxWidth: typeof maxWidth === 'number' ? `${maxWidth}px` : maxWidth } : undefined}
      >
        {title && (
          <div className={styles.header}>
            <h2 className={styles.title}>{title}</h2>
            {!hideCloseButton && (
              <button
                type="button"
                onClick={onClose}
                className={styles.closeButton}
                aria-label="Close dialog"
              >
                ✕
              </button>
            )}
          </div>
        )}
        <div className={styles.content}>{children}</div>
      </div>
    </div>
  );
}

export default Modal;
