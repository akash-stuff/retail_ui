import { useState } from 'react';
import { submitVisit } from '../api.js';
import DiscountBadge from '../components/DiscountBadge.jsx';

const initialForm = { name: '', mobile: '', email: '', remarks: '' };

export default function ClaimPage() {
  const [form, setForm] = useState(initialForm);
  const [fieldError, setFieldError] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null); // holds { discount, visitCount, customerName }

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function validate() {
    if (!form.name.trim()) return 'Please enter your name.';
    const digits = form.mobile.replace(/\D/g, '');
    if (!digits || digits.length < 7) return 'Please enter a valid mobile number.';
    if (form.email && !/^\S+@\S+\.\S+$/.test(form.email)) return 'That email looks incomplete.';
    return '';
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitError('');
    const validationMessage = validate();
    if (validationMessage) {
      setFieldError(validationMessage);
      return;
    }
    setFieldError('');
    setLoading(true);
    try {
      const data = await submitVisit(form);
      setResult({
        discount: data.discount,
        visitCount: data.visitCount,
        customerName: data.customerName,
      });
    } catch (err) {
      setSubmitError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  function handleCheckInAgain() {
    setForm(initialForm);
    setResult(null);
    setSubmitError('');
    setFieldError('');
  }

  return (
    <div className="page-shell">
      <div className="brandbar">
        <span className="brandbar-dot" />
        <span className="brandbar-label">Counter Rewards</span>
      </div>

      <div className="claim-wrap">
        <div className="claim-card">
          {result ? (
            <DiscountBadge result={result} onCheckInAgain={handleCheckInAgain} />
          ) : (
            <>
              <p className="claim-eyebrow">Checkout check-in</p>
              <h1 className="claim-title">Get an instant discount</h1>
              <p className="claim-subtitle">
                Enter your details below to unlock a random 5%–10% discount on today's purchase.
                Come back next time for another surprise discount.
              </p>

              {submitError && <div className="form-banner error">{submitError}</div>}

              <form onSubmit={handleSubmit} noValidate>
                <div className="field-group">
                  <label className="field-label" htmlFor="name">
                    Full name
                  </label>
                  <input
                    id="name"
                    name="name"
                    className="field-input"
                    type="text"
                    autoComplete="name"
                    placeholder="e.g. Your Name"
                    value={form.name}
                    onChange={handleChange}
                  />
                </div>

                <div className="field-group">
                  <label className="field-label" htmlFor="mobile">
                    Mobile number
                  </label>
                  <input
                    id="mobile"
                    name="mobile"
                    className="field-input"
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    placeholder="e.g. 0123456789"
                    value={form.mobile}
                    onChange={handleChange}
                  />
                </div>

                <div className="field-group">
                  <label className="field-label" htmlFor="email">
                    Email <span className="optional"></span>
                  </label>
                  <input
                    id="email"
                    name="email"
                    className="field-input"
                    type="email"
                    autoComplete="email"
                    placeholder="e.g. yourname@gmail.com"
                    value={form.email}
                    onChange={handleChange}
                  />
                </div>

                <div className="field-group">
                  <label className="field-label" htmlFor="remarks">
                    Remarks / feedback <span className="optional">(optional)</span>
                  </label>
                  <textarea
                    id="remarks"
                    name="remarks"
                    className="field-textarea"
                    placeholder="Anything you'd like us to know?"
                    value={form.remarks}
                    onChange={handleChange}
                  />
                </div>

                {fieldError && <div className="field-error">{fieldError}</div>}

                <button className="submit-btn" type="submit" disabled={loading}>
                  {loading ? (
                    <>
                      <span className="spinner" /> Checking in…
                    </>
                  ) : (
                    'Claim my discount'
                  )}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
