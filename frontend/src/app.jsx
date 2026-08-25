import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./hooks/useAuth";
import Navbar from "./components/Navbar";
import FacilityList from "./pages/FacilityList";
import SlotGrid from "./pages/SlotGrid";
import MyBookings from "./pages/myBookings";
import AnalyticsDashboard from "./pages/AnalyticsDashboard";
import LoginModal from "./components/LoginModal";
import { useState } from "react";
import { ShieldAlert } from "lucide-react";

function AdminRouteGuard() {
  const { isAdmin } = useAuth();
  const [showModal, setShowModal] = useState(false);

  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center text-muted">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-booked/10 text-booked">
          <ShieldAlert className="h-8 w-8" />
        </div>
        <h2 className="mt-4 font-display text-2xl font-bold text-white">
          Admin Access Required
        </h2>
        <p className="mt-2 text-sm text-muted">
          You must be logged in with an Admin account to access campus analytics and controls.
        </p>
        <button
          onClick={() => setShowModal(true)}
          className="mt-6 rounded-full bg-accent px-6 py-2.5 text-sm font-bold text-accent-foreground shadow-lg hover:brightness-110"
        >
          Sign in as Admin
        </button>

        {showModal && (
          <LoginModal
            onClose={() => setShowModal(false)}
            initialTab="admin"
            subtitle="Admin passcode verification required"
          />
        )}
      </div>
    );
  }

  return <AnalyticsDashboard />;
}

export default function App() {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-base flex flex-col font-body">
        <Navbar />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<FacilityList />} />
            <Route path="/facilities/:id" element={<SlotGrid />} />
            <Route path="/bookings" element={<MyBookings />} />
            <Route path="/admin" element={<AdminRouteGuard />} />
          </Routes>
        </main>
      </div>
    </AuthProvider>
  );
}