import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Wrench,
  FileCheck,
  Calendar,
  Clock,
  User,
  Plus,
  Trash2,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ClipboardList
} from "lucide-react";
import {
  getMaintenanceWindows,
  createMaintenanceWindow,
  deleteMaintenanceWindow,
  getEventApprovals,
  processEventApproval
} from "../api/client";

export default function OperationsManager({ facilities = [] }) {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("maintenance"); // 'maintenance' | 'approvals'

  // Maintenance Form State
  const [mFacilityId, setMFacilityId] = useState(facilities[0]?.id || "badminton-hall");
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split("T")[0]);
  const [reason, setReason] = useState("Annual court resurfacing and lighting maintenance");

  const [toastMessage, setToastMessage] = useState(null);

  // Queries
  const { data: windows = [], isLoading: isLoadingWindows } = useQuery({
    queryKey: ["maintenanceWindows"],
    queryFn: getMaintenanceWindows
  });

  const { data: approvals = [], isLoading: isLoadingApprovals } = useQuery({
    queryKey: ["eventApprovals"],
    queryFn: getEventApprovals
  });

  // Mutations
  const addWindowMutation = useMutation({
    mutationFn: createMaintenanceWindow,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["maintenanceWindows"] });
      queryClient.invalidateQueries({ queryKey: ["slots"] });
      queryClient.invalidateQueries({ queryKey: ["facilities"] });
      setToastMessage("Maintenance closure window scheduled!");
      setTimeout(() => setToastMessage(null), 4000);
    }
  });

  const deleteWindowMutation = useMutation({
    mutationFn: deleteMaintenanceWindow,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["maintenanceWindows"] });
      queryClient.invalidateQueries({ queryKey: ["slots"] });
      queryClient.invalidateQueries({ queryKey: ["facilities"] });
      setToastMessage("Maintenance window removed.");
      setTimeout(() => setToastMessage(null), 3000);
    }
  });

  const processApprovalMutation = useMutation({
    mutationFn: ({ id, action, rejectionReason }) => processEventApproval(id, { action, rejectionReason }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["eventApprovals"] });
      queryClient.invalidateQueries({ queryKey: ["slots"] });
      queryClient.invalidateQueries({ queryKey: ["analytics"] });
      queryClient.invalidateQueries({ queryKey: ["myBookings"] });
      setToastMessage(
        variables.action === "APPROVE"
          ? "Event request APPROVED & slot locked!"
          : "Event request REJECTED."
      );
      setTimeout(() => setToastMessage(null), 4000);
    }
  });

  const handleAddWindow = async (e) => {
    e.preventDefault();
    if (!reason.trim()) return;

    try {
      await addWindowMutation.mutateAsync({
        facilityId: mFacilityId,
        startDate,
        endDate,
        reason,
        slotIds: ["all"]
      });
    } catch (err) {
      alert(`Failed to add window: ${err.message}`);
    }
  };

  const pendingApprovals = approvals.filter((a) => a.status === "PENDING");

  return (
    <div className="rounded-2xl border border-surface-border bg-surface shadow-2xl overflow-hidden space-y-6">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-2xl border border-accent/40 bg-surface/95 p-4 text-sm font-semibold text-white shadow-2xl backdrop-blur-md animate-bounce">
          <CheckCircle className="h-5 w-5 text-accent shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header & Tabs */}
      <div className="border-b border-surface-border p-6 bg-surface-hover/30 flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-extrabold text-accent uppercase tracking-wider">
            Facility Manager Operations
          </span>
          <h2 className="font-display text-2xl font-bold text-white mt-0.5">
            Operational Control Center
          </h2>
        </div>

        <div className="flex rounded-full bg-base p-1 border border-surface-border">
          <button
            onClick={() => setActiveTab("maintenance")}
            className={`flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold transition ${
              activeTab === "maintenance"
                ? "bg-accent text-accent-foreground shadow-md"
                : "text-muted hover:text-white"
            }`}
          >
            <Wrench className="h-4 w-4" /> Closure & Maintenance ({windows.length})
          </button>
          <button
            onClick={() => setActiveTab("approvals")}
            className={`flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold transition relative ${
              activeTab === "approvals"
                ? "bg-accent text-accent-foreground shadow-md"
                : "text-muted hover:text-white"
            }`}
          >
            <FileCheck className="h-4 w-4" /> Event Approvals ({pendingApprovals.length})
            {pendingApprovals.length > 0 && (
              <span className="flex h-2 w-2 rounded-full bg-booked animate-ping" />
            )}
          </button>
        </div>
      </div>

      <div className="p-6 pt-0">
        {/* TAB 1: MAINTENANCE WINDOWS */}
        {activeTab === "maintenance" && (
          <div className="space-y-8">
            {/* Create Closure Window Form */}
            <form onSubmit={handleAddWindow} className="rounded-xl border border-surface-border bg-base/70 p-5 space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Plus className="h-4 w-4 text-accent" /> Schedule New Maintenance / Event Closure Window
              </h3>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <label className="block text-xs font-bold text-muted uppercase tracking-wider mb-1">
                    Facility
                  </label>
                  <select
                    value={mFacilityId}
                    onChange={(e) => setMFacilityId(e.target.value)}
                    className="w-full rounded-xl border border-surface-border bg-surface px-3 py-2 text-xs font-semibold text-white focus:border-accent focus:outline-none"
                  >
                    {facilities.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.name} ({f.sport})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-muted uppercase tracking-wider mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full rounded-xl border border-surface-border bg-surface px-3 py-2 text-xs font-semibold text-white focus:border-accent focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-muted uppercase tracking-wider mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full rounded-xl border border-surface-border bg-surface px-3 py-2 text-xs font-semibold text-white focus:border-accent focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-muted uppercase tracking-wider mb-1">
                  Reason / Purpose of Closure
                </label>
                <input
                  type="text"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g. Floor polishing, floodlight repairs, Inter-IIT Tournament"
                  className="w-full rounded-xl border border-surface-border bg-surface px-3 py-2 text-xs font-semibold text-white focus:border-accent focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={addWindowMutation.isPending}
                className="rounded-full bg-accent px-6 py-2.5 text-xs font-extrabold text-accent-foreground shadow-md transition hover:brightness-110 disabled:opacity-50"
              >
                Schedule Closure Window
              </button>
            </form>

            {/* Active Closure Windows Table */}
            <div>
              <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                <Wrench className="h-4 w-4 text-accent" /> Active Maintenance & Scheduled Closure Windows ({windows.length})
              </h3>

              {windows.length === 0 ? (
                <div className="rounded-xl border border-surface-border/60 bg-base/40 p-6 text-center text-xs text-muted">
                  No active maintenance windows scheduled. All ground slots are running on standard schedules.
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-surface-border">
                  <table className="w-full text-left text-xs text-muted">
                    <thead className="border-b border-surface-border bg-base text-xs font-bold text-white uppercase">
                      <tr>
                        <th className="px-4 py-3">Facility</th>
                        <th className="px-4 py-3">Dates</th>
                        <th className="px-4 py-3">Reason</th>
                        <th className="px-4 py-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-surface-border/50">
                      {windows.map((w) => (
                        <tr key={w.id} className="hover:bg-surface-hover/50 transition">
                          <td className="px-4 py-3 font-bold text-white">{w.facilityName}</td>
                          <td className="px-4 py-3 font-semibold text-accent">
                            {w.startDate} → {w.endDate}
                          </td>
                          <td className="px-4 py-3 text-muted">{w.reason}</td>
                          <td className="px-4 py-3 text-right">
                            <button
                              onClick={() => deleteWindowMutation.mutate(w.id)}
                              className="rounded-lg p-1.5 text-muted hover:text-booked hover:bg-booked/10 transition"
                              title="Delete Maintenance Window"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: EVENT APPROVALS QUEUE */}
        {activeTab === "approvals" && (
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-bold text-white mb-1 flex items-center gap-2">
                <FileCheck className="h-4 w-4 text-accent" /> Tournament & Inter-Hostel Event Approvals Queue
              </h3>
              <p className="text-xs text-muted">
                Review and approve special event reservation requests submitted by campus captains and hostel secretaries.
              </p>
            </div>

            {approvals.length === 0 ? (
              <div className="rounded-xl border border-surface-border/60 bg-base/40 p-8 text-center text-xs text-muted">
                No event approval requests submitted yet.
              </div>
            ) : (
              <div className="space-y-4">
                {approvals.map((appr) => {
                  const isPending = appr.status === "PENDING";
                  const isApproved = appr.status === "APPROVED";
                  const isRejected = appr.status === "REJECTED";

                  return (
                    <div
                      key={appr.id}
                      className={`flex flex-col justify-between p-5 rounded-2xl border transition-all ${
                        isPending
                          ? "border-accent/50 bg-accent/5 shadow-md shadow-accent/10"
                          : isApproved
                          ? "border-available/40 bg-available/5"
                          : "border-booked/40 bg-booked/5 opacity-75"
                      }`}
                    >
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-display text-lg font-bold text-white">
                              {appr.eventName}
                            </span>
                            <span
                              className={`rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase ${
                                isPending
                                  ? "bg-accent/20 text-accent border border-accent/40"
                                  : isApproved
                                  ? "bg-available/20 text-available border border-available/40"
                                  : "bg-booked/20 text-booked border border-booked/40"
                              }`}
                            >
                              {appr.status}
                            </span>
                          </div>

                          <div className="mt-2 space-y-1 text-xs text-muted font-medium">
                            <div className="flex items-center gap-2 text-white font-semibold">
                              <Calendar className="h-3.5 w-3.5 text-accent shrink-0" />
                              <span>{appr.facilityName} — {appr.dateKey} ({appr.startLabel} - {appr.endLabel})</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <User className="h-3.5 w-3.5 shrink-0" />
                              <span>Organizer: {appr.studentName} (Roll No: {appr.rollNumber})</span>
                            </div>
                            <div className="flex items-center gap-2 text-white/90 italic mt-1">
                              <ClipboardList className="h-3.5 w-3.5 text-muted shrink-0" />
                              <span>"{appr.purpose}"</span>
                            </div>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        {isPending && (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() =>
                                processApprovalMutation.mutate({ id: appr.id, action: "APPROVE" })
                              }
                              disabled={processApprovalMutation.isPending}
                              className="flex items-center gap-1.5 rounded-full bg-available px-4 py-2 text-xs font-bold text-base shadow-md hover:brightness-110 transition"
                            >
                              <CheckCircle className="h-3.5 w-3.5" /> Approve & Lock Slot
                            </button>

                            <button
                              onClick={() =>
                                processApprovalMutation.mutate({
                                  id: appr.id,
                                  action: "REJECT",
                                  rejectionReason: "Slot unavailable or overlaps with regular student practice hours"
                                })
                              }
                              disabled={processApprovalMutation.isPending}
                              className="flex items-center gap-1.5 rounded-full bg-surface-border border border-booked/40 px-4 py-2 text-xs font-bold text-booked hover:bg-booked hover:text-white transition"
                            >
                              <XCircle className="h-3.5 w-3.5" /> Reject
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
