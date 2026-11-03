import React from 'react';
import styles from './Skeleton.module.css';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'text' | 'rectangular' | 'circular' | 'rounded';
  width?: string | number;
  height?: string | number;
  borderRadius?: string | number;
}

export function Skeleton({
  variant = 'rounded',
  width,
  height,
  borderRadius,
  className,
  style,
  ...rest
}: SkeletonProps) {
  const variantClass = styles[variant] || styles.rounded;

  const inlineStyles: React.CSSProperties = {
    ...style,
    ...(width !== undefined ? { width: typeof width === 'number' ? `${width}px` : width } : {}),
    ...(height !== undefined ? { height: typeof height === 'number' ? `${height}px` : height } : {}),
    ...(borderRadius !== undefined
      ? { borderRadius: typeof borderRadius === 'number' ? `${borderRadius}px` : borderRadius }
      : {}),
  };

  return (
    <div
      role="status"
      aria-busy="true"
      aria-hidden="true"
      className={`${styles.skeleton} ${variantClass} ${className || ''}`.trim()}
      style={inlineStyles}
      {...rest}
    />
  );
}

export default Skeleton;

