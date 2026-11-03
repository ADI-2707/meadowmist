import React from 'react';
import { formatCurrency } from '@meadowmist/shared';
import styles from './PriceTag.module.css';

interface Props {
  price: number;
  salePrice?: number | null;
}

export default function PriceTag({ price, salePrice }: Props) {
  const display = salePrice ?? price;
  const hasSale = salePrice != null && salePrice < price;

  return (
    <div className={styles.priceTag}>
      <span className={styles.current}>{formatCurrency(display)}</span>
      {hasSale && (
        <span className={styles.original}>{formatCurrency(price)}</span>
      )}
    </div>
  );
}
