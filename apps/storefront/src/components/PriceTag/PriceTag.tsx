import React from 'react';
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
      <span className={styles.current}>₹{display.toLocaleString('en-IN')}</span>
      {hasSale && (
        <span className={styles.original}>₹{price.toLocaleString('en-IN')}</span>
      )}
    </div>
  );
}
