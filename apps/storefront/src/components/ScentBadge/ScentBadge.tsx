import React from 'react';
import styles from './ScentBadge.module.css';

const FAMILY_LABELS: Record<string, string> = {
  floral: 'Floral',
  woody: 'Woody',
  fresh: 'Fresh',
  spice: 'Spice',
  pillar: 'Pillar',
  'wax-art': 'Wax Art',
  bowl: 'Bowl',
  'trinket-box': 'Trinket Box',
  planter: 'Planter',
  'tealight-holder': 'Tealight',
};

const COLOR_MAP: Record<string, string> = {
  clay: 'clay',
  mauve: 'mauve',
  blush: 'blush',
  ivory: 'ivory',
  forest: 'forest',
  gold: 'gold',
};

interface Props {
  family: string;
  colorFamily: string;
}

export default function ScentBadge({ family, colorFamily }: Props) {
  const label = FAMILY_LABELS[family] ?? family;
  const color = COLOR_MAP[colorFamily] ?? 'forest';

  return (
    <span className={`${styles.badge} ${styles[`color-${color}`]}`}>
      {label}
    </span>
  );
}
