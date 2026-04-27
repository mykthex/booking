import React from 'react';
import styles from './booking-list-item.module.css';

interface BookingListItemProps {
  date?: string | null;
  courtName?: string | null;
  hour?: string | null;
  player1?: string | null;
  player2?: string | null;
}

export const BookingListItem: React.FC<BookingListItemProps> = ({
  date,
  courtName,
  hour,
  player1,
  player2
}) => {
  const bookingDate = new Date(date || '');

  return (
    <div className={styles.bookingListItem}>
      <div className={styles.bookingPreview}>
        <span className={styles.month}>
          {bookingDate.toLocaleDateString('en-US', { month: 'short' })}
        </span>
        <span className={styles.date}>
          {bookingDate.getDate()}
        </span>
      </div>
      <div className={styles.bookingItem}>
        <div className={styles.bookingItemHeader}>
          <span className={styles.bookingItemCourt}>{courtName}</span>&nbsp;at&nbsp;
          <span className={styles.bookingItemDate}>
            {hour}:00
          </span>
        </div>
        <div className={styles.bookingItemPlayers}>
          <strong>{player1}</strong> vs <strong>{player2 || 'TBD'}</strong>
        </div>
      </div>
    </div>
  );
};