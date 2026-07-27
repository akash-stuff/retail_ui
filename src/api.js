// Central place for the backend base URL.
// Set VITE_API_URL in a .env file at the frontend root when deploying
// (e.g. VITE_API_URL=https://your-backend.onrender.com).
// Falls back to localhost for local development.
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

/**
 * Submits a customer check-in from the /claim page.
 */
export async function submitVisit({ name, mobile, email, remarks }) {
  const res = await fetch(`${API_URL}/api/customer/visit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, mobile, email, remarks }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Something went wrong. Please try again.');
  }
  return data;
}

/**
 * Verifies an admin passcode against the backend.
 */
export async function adminLogin(password) {
  const res = await fetch(`${API_URL}/api/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Incorrect passcode.');
  }
  return data;
}

/**
 * Fetches all customer records for the admin dashboard.
 * Requires the admin passcode to be sent as a header.
 */
export async function fetchCustomers(password) {
  const res = await fetch(`${API_URL}/api/admin/customers`, {
    headers: { 'x-admin-password': password },
  });
  const data = await res.json();
  if (!res.ok) {
    const err = new Error(data.message || 'Failed to fetch customers.');
    err.status = res.status;
    throw err;
  }
  return data;
}
