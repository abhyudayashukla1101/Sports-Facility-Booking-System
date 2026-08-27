import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./hooks/useAuth";
import Navbar from "./components/Navbar";
import FacilityList from "./pages/FacilityList";
import SlotGrid from "./pages/SlotGrid";
import MyBookings from "./pages/myBookings";
import AnalyticsDashboard from "./pages/AnalyticsDashboard";
import LandingPage from "./pages/LandingPage";

function AdminRouteGuard() {
  const { isAdmin } = useAuth();

  if (!isAdmin) {
    return <Navigate to="/" replace />;
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
            <Route path="/" element={<LandingPage />} />
            <Route path="/facilities" element={<FacilityList />} />
            <Route path="/facilities/:id" element={<SlotGrid />} />
            <Route path="/bookings" element={<MyBookings />} />
            <Route path="/admin" element={<AdminRouteGuard />} />
          </Routes>
        </main>
      </div>
    </AuthProvider>
  );
}
