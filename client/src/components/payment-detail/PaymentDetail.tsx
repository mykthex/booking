import React from 'react';
import styles from './payment-detail.module.css';

interface PaymentDetailProps {
  amount: number; // Amount in cents
  currency: string;
}

export const PaymentDetail: React.FC<PaymentDetailProps> = ({
  amount,
  currency,
}) => {
  const totalAmount = amount / 100;
  const subtotal = totalAmount; // No tax breakdown for now

  return (
    <div className={styles.paymentReceipt}>
      <h4 className={styles.receiptHeader}>
        Payment Detail
      </h4>

      {/* Cost Breakdown */}
      <div className={styles.costBreakdown}>
        <div className={styles.costRow}>
          <span className={styles.costLabel}>Subtotal:</span>
          <span className={styles.costValue}>
            ${subtotal.toFixed(2)} {currency.toUpperCase()}
          </span>
        </div>
        <div className={styles.totalRow}>
          <span>Total to be paid:</span>
          <span>
            ${totalAmount.toFixed(2)} {currency.toUpperCase()}
          </span>
        </div>
      </div>
    </div>
  );
};