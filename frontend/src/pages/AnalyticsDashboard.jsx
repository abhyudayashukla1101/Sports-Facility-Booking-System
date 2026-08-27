import { useSearchParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Activity,
  Users,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Sliders,
  Sparkles,
  BarChart3,
  TrendingUp,
  UserCheck,
  UserX,
  Wrench,
  Zap,
  Flame
} from "lucide-react";
import {
  getAnalytics,
  toggleMaintenance as apiToggleMaintenance,
  updateBookingAttendance
} from "../api/client";
import { useFacilities } from "../hooks/useFacilities";
import ConcurrentBookingSimulator from "../components/ConcurrentBookingSimulator";
import OperationsManager from "../components/OperationsManager";

export default function AnalyticsDashboard() {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();

  // Active tab derived from URL query string ?tab= analytics | attendance | operations | racedemo
  const activeTab = searchParams.get("tab") || "analytics";

  const setActiveTab = (tab) => {
    setSearchParams({ tab });
  };

  // Query: Get live analytics metrics & Groq AI insights
  const { data: analytics = {} } = useQuery({
    queryKey: ["analytics"],
    queryFn: getAnalytics,
    refetchInterval: 5000
  });

  // Query: Get all facilities
  const { data: facilities = [] } = useFacilities();

  // Mutation: Toggle maintenance lock
  const toggleMaintenanceMutation = useMutation({
    mutationFn: ({ id, isMaintenanceLocked }) => apiToggleMaintenance(id, isMaintenanceLocked),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["facilities"] });
      queryClient.invalidateQueries({ queryKey: ["analytics"] });
      queryClient.invalidateQueries({ queryKey: ["slots"] });
    }
  });

  // Mutation: Attendance Status Check-in
  const attendanceMutation = useMutation({
    mutationFn: ({ id, attendanceStatus }) => updateBookingAttendance(id, attendanceStatus),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["analytics"] });
    }
  });

  const handleToggleMaintenance = async (id, currentStatus) => {
    try {
      await toggleMaintenanceMutation.mutateAsync({ id, isMaintenanceLocked: !currentStatus });
    } catch (err) {
      alert(`Failed to update maintenance mode: ${err.message}`);
    }
  };

  const {
    totalBookings = 0,
    overallUtilizationRate = 0,
    activeUsers = 0,
    noShowStats = { attended: 0, noShow: 0, pending: 0, noShowRate: 0 },
    peakHoursDistribution = [],
    facilityUtilization = [],
    aiInsights = { summary: "", recommendations: [] },
    todaysBookings = []
  } = analytics;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 space-y-6">
      {/* Admin Panel Header & Sub-Navigation Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-surface-border pb-5">
        <div>
          <span className="text-xs font-extrabold tracking-wider text-accent uppercase">
            IIT Guwahati Gymkhana Admin Panel
          </span>
          <h1 className="mt-1 font-display text-3xl font-bold text-white sm:text-4xl">
            Admin Management Console
          </h1>
        </div>

        {/* Tab Selector Controls */}
        <div className="flex flex-wrap rounded-2xl bg-surface border border-surface-border p-1.5 shadow-lg">
          <button
            onClick={() => setActiveTab("analytics")}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition ${
              activeTab === "analytics"
                ? "bg-accent text-accent-foreground shadow-md"
                : "text-muted hover:text-white"
            }`}
          >
            <BarChart3 className="h-4 w-4" /> Analytics & Peak Hours
          </button>

          <button
            onClick={() => setActiveTab("attendance")}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition ${
              activeTab === "attendance"
                ? "bg-accent text-accent-foreground shadow-md"
                : "text-muted hover:text-white"
            }`}
          >
            <UserCheck className="h-4 w-4" /> Attendance Marker
          </button>

          <button
            onClick={() => setActiveTab("operations")}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition ${
              activeTab === "operations"
                ? "bg-accent text-accent-foreground shadow-md"
                : "text-muted hover:text-white"
            }`}
          >
            <Wrench className="h-4 w-4" /> Operations & Status
          </button>

          <button
            onClick={() => setActiveTab("racedemo")}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition ${
              activeTab === "racedemo"
                ? "bg-accent text-accent-foreground shadow-md"
                : "text-muted hover:text-white"
            }`}
          >
            <Flame className="h-4 w-4" /> Concurrency Race Demo
          </button>
        </div>
      </div>

      {/* PAGE 1: ANALYTICS & HOURLY DISTRIBUTION GRAPH */}
      {activeTab === "analytics" && (
        <div className="space-y-8 animate-fadeIn">
          {/* Metric Cards Row */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-surface-border bg-surface p-5 shadow-xl">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted">Total Slots Reserved Today</span>
                <Calendar className="h-5 w-5 text-accent" />
              </div>
              <div className="mt-3 font-display text-3xl font-bold text-white">{totalBookings}</div>
              <span className="mt-1 inline-block text-[11px] font-semibold text-available">
                Updated live from database
              </span>
            </div>

            <div className="rounded-2xl border border-surface-border bg-surface p-5 shadow-xl">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted">Campus Ground Utilization</span>
                <TrendingUp className="h-5 w-5 text-accent" />
              </div>
              <div className="mt-3 font-display text-3xl font-bold text-white">{overallUtilizationRate}%</div>
              <span className="mt-1 inline-block text-[11px] font-semibold text-accent">
                Capacity throughput
              </span>
            </div>

            <div className="rounded-2xl border border-surface-border bg-surface p-5 shadow-xl">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted">Active Campus Users</span>
                <Users className="h-5 w-5 text-accent" />
              </div>
              <div className="mt-3 font-display text-3xl font-bold text-white">{activeUsers}</div>
              <span className="mt-1 inline-block text-[11px] font-semibold text-muted">
                Students in bookings & waitlists
              </span>
            </div>

            <div className="rounded-2xl border border-surface-border bg-surface p-5 shadow-xl">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted">No-Show Rate</span>
                <UserX className="h-5 w-5 text-booked" />
              </div>
              <div className="mt-3 font-display text-3xl font-bold text-white">{noShowStats.noShowRate}%</div>
              <span className="mt-1 inline-block text-[11px] font-semibold text-muted">
                {noShowStats.noShow} no-shows / {noShowStats.attended + noShowStats.noShow} checked-in
              </span>
            </div>
          </div>

          {/* Groq AI Executive Insights Banner */}
          <div className="rounded-2xl border border-accent/40 bg-accent/5 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="font-display text-lg font-bold text-white">
                    Groq AI Executive Recommendations
                  </h3>
                  <p className="text-xs text-muted">
                    Real-time operational guidance generated by LLM analysis of campus utilization metrics.
                  </p>
                </div>
              </div>
              <span className="rounded-full bg-accent/20 border border-accent/40 px-3 py-1 text-[11px] font-extrabold text-accent">
                {aiInsights.isAiPowered ? "⚡ Powered by Groq AI (llama-3.3-70b)" : "Smart Rule Engine"}
              </span>
            </div>

            <p className="text-xs font-medium text-white/90 bg-base/60 p-3.5 rounded-xl border border-surface-border italic">
              "{aiInsights.summary}"
            </p>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3 pt-2">
              {aiInsights.recommendations.map((rec, index) => (
                <div key={index} className="rounded-xl border border-surface-border bg-surface p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-display text-sm font-bold text-white">{rec.title}</h4>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold uppercase ${
                        rec.impact === "High" || rec.impact === "Critical"
                          ? "bg-booked/20 text-booked border border-booked/40"
                          : "bg-accent/20 text-accent border border-accent/40"
                      }`}
                    >
                      {rec.impact} Impact
                    </span>
                  </div>
                  <p className="text-xs text-muted leading-relaxed">{rec.actionableAdvice}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Hourly Peak Demand Distribution Heatmap Graph */}
          <div className="rounded-2xl border border-surface-border bg-surface p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-display text-xl font-bold text-white flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-accent" /> Hourly Peak Demand Distribution Graph
                </h3>
                <p className="text-xs text-muted mt-0.5">
                  Hourly booking intensity across all campus facilities (6:00 AM – 9:00 PM).
                </p>
              </div>
              <span className="text-xs font-bold text-accent">6 PM – 9 PM Peak Window</span>
            </div>

            <div className="grid grid-cols-8 gap-2 sm:grid-cols-16 pt-4">
              {peakHoursDistribution.map((slot) => (
                <div key={slot.slotId} className="flex flex-col items-center gap-2 group">
                  <div className="relative w-full h-36 bg-base rounded-lg border border-surface-border/60 flex items-end p-1 overflow-hidden">
                    <div
                      style={{ height: `${Math.max(slot.percent, 8)}%` }}
                      className={`w-full rounded transition-all duration-500 ${
                        slot.percent > 75
                          ? "bg-booked shadow-md shadow-booked/30"
                          : slot.percent > 40
                          ? "bg-accent shadow-md shadow-accent/20"
                          : "bg-available/60"
                      }`}
                    />
                    <span className="absolute top-1 left-0 right-0 text-center text-[10px] font-extrabold text-white">
                      {slot.count}
                    </span>
                  </div>
                  <span className="text-[10px] font-semibold text-muted tracking-tight text-center">
                    {slot.label.split(" ")[0]}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Facility Utilization Matrix */}
          <div className="rounded-2xl border border-surface-border bg-surface p-6 shadow-2xl space-y-4">
            <h3 className="font-display text-xl font-bold text-white">
              Facility Utilization & Capacity Throughput
            </h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {facilityUtilization.map((f) => (
                <div key={f.id} className="rounded-xl border border-surface-border bg-base/60 p-4 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-white">{f.name} ({f.sport})</span>
                    <span className="font-extrabold text-accent">{f.utilizationRate}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-surface overflow-hidden">
                    <div
                      style={{ width: `${f.utilizationRate}%` }}
                      className="h-full bg-accent rounded-full transition-all duration-500"
                    />
                  </div>
                  <span className="text-[10px] text-muted block">
                    {f.bookedCount} active reservations
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* PAGE 2: ATTENDANCE MARKER */}
      {activeTab === "attendance" && (
        <div className="space-y-6 animate-fadeIn">
          <div className="rounded-2xl border border-surface-border bg-surface overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between border-b border-surface-border p-6 bg-surface-hover/30">
              <div>
                <h3 className="font-display text-xl font-bold text-white flex items-center gap-2">
                  <UserCheck className="h-5 w-5 text-accent" /> Ground Staff Check-In & No-Show Attendance Marker
                </h3>
                <p className="text-xs text-muted mt-0.5">
                  Mark student attendance as they arrive at the ground to calculate campus no-show percentages.
                </p>
              </div>
              <span className="text-xs font-semibold text-muted">
                Today's Reservations ({todaysBookings.length})
              </span>
            </div>

            {todaysBookings.length === 0 ? (
              <div className="p-12 text-center text-xs text-muted">
                No confirmed bookings recorded for today yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-muted">
                  <thead className="border-b border-surface-border/80 bg-base/60 text-xs font-bold text-white uppercase tracking-wider">
                    <tr>
                      <th className="px-6 py-4">Student Name</th>
                      <th className="px-6 py-4">Roll Number</th>
                      <th className="px-6 py-4">Facility</th>
                      <th className="px-6 py-4">Slot</th>
                      <th className="px-6 py-4">Attendance Status</th>
                      <th className="px-6 py-4 text-right">Ground Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-border/50">
                    {todaysBookings.map((b) => {
                      const isAttended = b.attendanceStatus === "ATTENDED";
                      const isNoShow = b.attendanceStatus === "NO_SHOW";

                      return (
                        <tr key={b.id} className="hover:bg-surface-hover/50 transition">
                          <td className="px-6 py-4 font-bold text-white">{b.studentName}</td>
                          <td className="px-6 py-4 text-muted font-mono">{b.rollNumber}</td>
                          <td className="px-6 py-4 font-semibold text-accent">{b.facilityName}</td>
                          <td className="px-6 py-4 font-medium text-white">{b.startLabel} - {b.endLabel}</td>
                          <td className="px-6 py-4">
                            <span
                              className={`rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase ${
                                isAttended
                                  ? "bg-available/20 text-available border border-available/40"
                                  : isNoShow
                                  ? "bg-booked/20 text-booked border border-booked/40"
                                  : "bg-surface-border text-muted"
                              }`}
                            >
                              {b.attendanceStatus}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() =>
                                  attendanceMutation.mutate({ id: b.id, attendanceStatus: "ATTENDED" })
                                }
                                disabled={attendanceMutation.isPending}
                                className={`flex items-center gap-1 rounded-full px-4 py-1.5 text-xs font-bold transition ${
                                  isAttended
                                    ? "bg-available text-base shadow-md"
                                    : "bg-surface-border text-muted hover:text-available"
                                }`}
                              >
                                <UserCheck className="h-3.5 w-3.5" /> Attended
                              </button>

                              <button
                                onClick={() =>
                                  attendanceMutation.mutate({ id: b.id, attendanceStatus: "NO_SHOW" })
                                }
                                disabled={attendanceMutation.isPending}
                                className={`flex items-center gap-1 rounded-full px-4 py-1.5 text-xs font-bold transition ${
                                  isNoShow
                                    ? "bg-booked text-white shadow-md"
                                    : "bg-surface-border text-muted hover:text-booked"
                                }`}
                              >
                                <UserX className="h-3.5 w-3.5" /> No-Show
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* PAGE 3: OPERATIONS CONTROL & GROUND STATUS MANAGEMENT */}
      {activeTab === "operations" && (
        <div className="space-y-8 animate-fadeIn">
          {/* Facility Operations Manager (Closures & Approvals) */}
          <OperationsManager facilities={facilities} />

          {/* Ground & Hall Status Lock Management */}
          <div className="rounded-2xl border border-surface-border bg-surface overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between border-b border-surface-border p-6 bg-surface-hover/30">
              <div>
                <h3 className="font-display text-xl font-bold text-white">
                  Ground & Hall Maintenance Lock Management
                </h3>
                <p className="text-xs text-muted mt-0.5">
                  Toggle maintenance locks to pause bookings for grounds undergoing repair or tournament events.
                </p>
              </div>
              <Sliders className="h-5 w-5 text-muted" />
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-muted">
                <thead className="border-b border-surface-border/80 bg-base/60 text-xs font-bold text-white uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-4">Facility Name</th>
                    <th className="px-6 py-4">Sport</th>
                    <th className="px-6 py-4">Location</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-border/50">
                  {facilities.map((f) => {
                    const isUnderMaintenance = f.isMaintenanceLocked;

                    return (
                      <tr key={f.id} className="hover:bg-surface-hover/50 transition">
                        <td className="px-6 py-4 font-bold text-white">
                          {f.name}
                        </td>
                        <td className="px-6 py-4 font-semibold text-accent">
                          {f.sport}
                        </td>
                        <td className="px-6 py-4 text-xs">
                          {f.location}
                        </td>
                        <td className="px-6 py-4">
                          {isUnderMaintenance ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-booked/15 border border-booked/30 px-2.5 py-0.5 text-xs font-bold text-booked">
                              <AlertTriangle className="h-3.5 w-3.5" /> Maintenance
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full bg-available/15 border border-available/30 px-2.5 py-0.5 text-xs font-bold text-available">
                              <CheckCircle2 className="h-3.5 w-3.5" /> Operational
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => handleToggleMaintenance(f.id, f.isMaintenanceLocked)}
                            className={`rounded-full px-4 py-1.5 text-xs font-bold transition ${
                              isUnderMaintenance
                                ? "bg-available text-base hover:brightness-110"
                                : "bg-surface-border text-white hover:bg-booked hover:text-white"
                            }`}
                          >
                            {isUnderMaintenance ? "Re-open Facility" : "Lock for Maintenance"}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* PAGE 4: CONCURRENCY RACE SIMULATOR DEMO */}
      {activeTab === "racedemo" && (
        <div className="space-y-6 animate-fadeIn">
          <ConcurrentBookingSimulator facilities={facilities} />
        </div>
      )}
    </div>
  );
}
