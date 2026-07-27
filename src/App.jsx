import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ClaimPage from './pages/ClaimPage.jsx';
import AdminPage from './pages/AdminPage.jsx';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Customer-facing check-in flow, opened via the counter QR code */}
        <Route path="/claim" element={<ClaimPage />} />

        {/* Store staff dashboard */}
        <Route path="/admin" element={<AdminPage />} />

        {/* Default: send anyone hitting "/" straight to the claim form */}
        <Route path="/" element={<Navigate to="/claim" replace />} />
        <Route path="*" element={<Navigate to="/claim" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
