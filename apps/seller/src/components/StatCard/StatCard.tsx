import React from 'react';
import styles from './StatCard.module.css';

interface StatCardProps {
  label: string;
  value: string | number;
  subtext?: string;
  icon?: React.ComponentType<{ size?: number; className?: string }> | React.ReactNode;
  badge?: {
    text: string;
    variant?: 'success' | 'warning' | 'danger' | 'neutral';
  };
  highlight?: boolean;
}

export function StatCard({ label, value, subtext, icon, badge, highlight }: StatCardProps) {
  const getBadgeClass = (variant?: string) => {
    switch (variant) {
      case 'success':
        return styles.badgeSuccess;
      case 'warning':
        return styles.badgeWarning;
      case 'danger':
        return styles.badgeDanger;
      default:
        return styles.badgeNeutral;
    }
  };

  const renderIcon = () => {
    if (!icon) return null;
    if (React.isValidElement(icon)) {
      return icon;
    }
    const IconComponent = icon as React.ComponentType<{ size?: number; className?: string }>;
    return <IconComponent size={15} />;
  };

  return (
    <div className={`${styles.card} ${highlight ? styles.cardHighlight : ''}`}>
      <div className={styles.topRow}>
        <span className={styles.label}>{label}</span>
        {icon && <div className={styles.iconWrapper}>{renderIcon()}</div>}
      </div>

      <div className={styles.value}>{value}</div>

      <div className={styles.bottomRow}>
        {badge && (
          <span className={`${styles.badge} ${getBadgeClass(badge.variant)}`}>
            {badge.text}
          </span>
        )}
        {subtext && <span className={styles.subtext}>{subtext}</span>}
      </div>
    </div>
  );
}

export default StatCard;
