import { useState } from "react";
import styles from "./subscription-upgrade.module.css";

interface UpgradeProps {
  currentPlan: 'standard' | 'premium';
  currentPrice: number;
  premiumPrice: number;
  subscriptionId: string;
}

export const SubscriptionUpgrade = ({ 
  currentPlan, 
  currentPrice, 
  premiumPrice, 
  subscriptionId 
}: UpgradeProps) => {
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [upgradeSuccess, setUpgradeSuccess] = useState(false);
  const [error, setError] = useState('');

  // Only show upgrade option if user is on standard plan
  if (currentPlan === 'premium') {
    return (
      <div className={styles.container}>
        <div className={styles.premiumBadge}>
          ✨ You're on Premium
        </div>
        <p>You have access to all premium features!</p>
      </div>
    );
  }

  const priceDifference = premiumPrice - currentPrice;
  const monthlyDifference = priceDifference / 100; // Convert from cents

  const handleUpgrade = async () => {
    setIsUpgrading(true);
    setError('');

    try {
      const response = await fetch('http://localhost:9000/subscription/upgrade', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscriptionId,
          newPlan: 'premium'
        }),
      });

      if (!response.ok) {
        throw new Error('Upgrade failed');
      }

      const result = await response.json();
      setUpgradeSuccess(true);
      
      // Optionally refresh the page or update parent component
      setTimeout(() => {
        window.location.reload();
      }, 2000);

    } catch (err) {
      setError('Failed to upgrade subscription. Please try again.');
      console.error('Upgrade error:', err);
    } finally {
      setIsUpgrading(false);
    }
  };

  if (upgradeSuccess) {
    return (
      <div className={styles.container}>
        <div className={styles.successMessage}>
          🎉 Successfully upgraded to Premium!
        </div>
        <p>You now have access to all premium features.</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.upgradeCard}>
        <h3 className={styles.title}>Upgrade to Premium</h3>
        
        <div className={styles.comparison}>
          <div className={styles.currentPlan}>
            <h4>Current: Standard</h4>
            <p className={styles.price}>${currentPrice / 100}/month</p>
          </div>
          
          <div className={styles.arrow}>→</div>
          
          <div className={styles.newPlan}>
            <h4>Premium</h4>
            <p className={styles.price}>${premiumPrice / 100}/month</p>
          </div>
        </div>

        <div className={styles.benefits}>
          <h4>Premium Benefits:</h4>
          <ul>
            <li>✅ Priority court booking</li>
            <li>✅ Advanced booking up to 7 days</li>
            <li>✅ Member discounts</li>
          </ul>
        </div>

        <div className={styles.proration}>
          <p>
            <strong>Today's charge: ${monthlyDifference.toFixed(2)}</strong>
          </p>
          <p className={styles.prorationNote}>
            You'll be charged the prorated difference for the remaining days in your current billing cycle.
          </p>
        </div>

        {error && (
          <div className={styles.error}>
            {error}
          </div>
        )}

        <button 
          className={styles.upgradeButton}
          onClick={handleUpgrade}
          disabled={isUpgrading}
        >
          {isUpgrading ? 'Upgrading...' : `Upgrade for $${monthlyDifference.toFixed(2)}`}
        </button>
      </div>
    </div>
  );
};