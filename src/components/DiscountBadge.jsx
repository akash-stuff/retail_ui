import { useEffect, useState } from 'react';

/**
 * The "ticket stub" success screen. Shows the awarded discount, visit
 * count, and a live-updating timestamp so the cashier can see the
 * screen was generated just now (guards against reused screenshots).
 */
export default function DiscountBadge({ result, onCheckInAgain }) {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const visitLabel =
    result.visitCount === 1 ? 'Welcome — first visit' : `Visit #${result.visitCount}`;

  const timeString = now.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  return (
    <div className="ticket">
      <div className="ticket-top">
        <div className="ticket-emoji">🎉</div>
        <p className="ticket-headline">Checkout reward unlocked</p>
        <p className="ticket-discount">
          {result.discount}
          <span>%</span>
        </p>
        <p className="ticket-off-label">OFF THIS PURCHASE</p>
      </div>

      <div className="ticket-perf" />

      <div className="ticket-bottom">
        <div className="ticket-row">
          <span className="ticket-row-label">Customer</span>
          <span className="ticket-row-value">{result.customerName}</span>
        </div>
        <div className="ticket-row">
          <span className="ticket-row-label">Status</span>
          <span className="ticket-row-value">{visitLabel}</span>
        </div>

        <p className="ticket-instruction">Show this screen to the cashier</p>
        <p className="ticket-timestamp">Generated at {timeString}</p>

        <button className="ticket-again-btn" onClick={onCheckInAgain} type="button">
          Check in a different customer
        </button>
      </div>
    </div>
  );
}
