import React from 'react';
import styles from './payment-receipt.module.css';

interface PaymentReceiptProps {
  paymentIntentId?: string;
  paymentMethodLast4?: string;
  paymentMethodType?: string;
  amount: number; // Amount in cents
  currency: string;
}

export const PaymentReceipt: React.FC<PaymentReceiptProps> = ({
  paymentIntentId,
  paymentMethodLast4,
  paymentMethodType,
  amount,
  currency,
}) => {
  const totalAmount = amount / 100;
  const subtotal = totalAmount; // No tax breakdown for now

  return (
    <div className={styles.paymentReceipt}>
      <h4 className={styles.receiptHeader}>
        Payment Receipt
      </h4>
      
      {/* Transaction Details */}
      <div className={styles.transactionDetails}>
        <div className={styles.detailRow}>
          <span className={styles.detailLabel}>Transaction ID:</span>
          <span className={styles.detailValue}>
            {paymentIntentId?.slice(-8) || 'N/A'}
          </span>
        </div>
        <div className={styles.detailRow}>
          <span className={styles.detailLabel}>Payment Method:</span>
          <span className={styles.paymentMethodInfo}>
            <span className={styles.cardNumber}>•••• {paymentMethodLast4 || '****'}</span>
            <span className={styles.cardBadge}>
              {paymentMethodType || 'card'}
            </span>
          </span>
        </div>
      </div>

      {/* Cost Breakdown */}
      <div className={styles.costBreakdown}>
        <div className={styles.costRow}>
          <span className={styles.costLabel}>Subtotal:</span>
          <span className={styles.costValue}>
            ${subtotal.toFixed(2)} {currency.toUpperCase()}
          </span>
        </div>
        <div className={styles.totalRow}>
          <span>Total Paid:</span>
          <span>
            ${totalAmount.toFixed(2)} {currency.toUpperCase()}
          </span>
        </div>
      </div>

      {/* Transaction Time */}
      <div className={styles.transactionTime}>
        Transaction completed on {new Date().toLocaleString('en-CA', {
          year: 'numeric',
          month: 'short', 
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })}
      </div>
    </div>
  );
};