import { useState } from "react";
import { Activity, ShieldCheck, Users, Calendar, AlertTriangle, CheckCircle2, Sliders } from "lucide-react";
import { MOCK_FACILITIES } from "../data/facilities";

export default function AnalyticsDashboard() {
  const [maintenanceMode, setMaintenanceMode] = useState({});

  const toggleMaintenance = (id) => {
    setMaintenanceMode((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 space-y-8">
      <div>
        <span className="text-xs font-extrabold tracking-wider text-accent uppercase">
          IIT Guwahati Gymkhana Admin Panel
        </span>
        <h1 className="mt-1 font-display text-3xl font-bold text-white sm:text-4xl">
          Facility Analytics & Operational Control
        </h1>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-surface-border bg-surface p-5 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted">Total Slots Reserved Today</span>
            <Calendar className="h-5 w-5 text-accent" />
          </div>
          <div className="mt-3 font-display text-3xl font-bold text-white">142</div>
          <span className="mt-1 inline-block text-[11px] font-semibold text-available">
            +18% from yesterday
          </span>
        </div>

        <div className="rounded-2xl border border-surface-border bg-surface p-5 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted">Peak Hours Utilization</span>
            <Activity className="h-5 w-5 text-accent" />
          </div>
          <div className="mt-3 font-display text-3xl font-bold text-white">88.4%</div>
          <span className="mt-1 inline-block text-[11px] font-semibold text-accent">
            Peak: 6:00 PM – 10:00 PM
          </span>
        </div>

        <div className="rounded-2xl border border-surface-border bg-surface p-5 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted">Double-Booking Collisions</span>
            <ShieldCheck className="h-5 w-5 text-available" />
          </div>
          <div className="mt-3 font-display text-3xl font-bold text-white">0</div>
          <span className="mt-1 inline-block text-[11px] font-semibold text-available">
            100% Conflict Prevention
          </span>
        </div>

        <div className="rounded-2xl border border-surface-border bg-surface p-5 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted">Active Campus Users</span>
            <Users className="h-5 w-5 text-accent" />
          </div>
          <div className="mt-3 font-display text-3xl font-bold text-white">1,280</div>
          <span className="mt-1 inline-block text-[11px] font-semibold text-muted">
            Across 10 Facilities
          </span>
        </div>
      </div>

      {/* Facilities Maintenance Control Table */}
      <div className="rounded-2xl border border-surface-border bg-surface overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between border-b border-surface-border p-6 bg-surface-hover/30">
          <div>
            <h3 className="font-display text-xl font-bold text-white">
              Ground & Hall Status Management
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
              {MOCK_FACILITIES.map((f) => {
                const isUnderMaintenance = maintenanceMode[f.id];

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
                        onClick={() => toggleMaintenance(f.id)}
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
  );
}