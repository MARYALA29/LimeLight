"use client";

import { useState } from "react";
import { Vulnerability, VulnStatus } from "@/types";
import { allowedTransitions } from "@/lib/vulnerability-state-machine";
import { StatusBadge } from "./status-badge";

interface Props {
  projectId: string;
  vulnId: string;
  currentStatus: VulnStatus;
  canEdit: boolean;
  onStatusChanged: (vuln: Vulnerability) => void;
}

const LABELS: Record<VulnStatus, string> = {
  OPEN: "Open",
  TRIAGED: "Triaged",
  IN_PROGRESS: "In progress",
  PATCHED: "Patched",
  VERIFIED: "Verified",
  WONT_FIX: "Won't fix",
  DUPLICATE: "Duplicate",
};

export function StatusChanger({
  projectId,
  vulnId,
  currentStatus,
  canEdit,
  onStatusChanged,
}: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState("");
  const [pending, setPending] = useState<VulnStatus | null>(null);

  if (!canEdit) {
    return <StatusBadge status={currentStatus} />;
  }

  const targets = allowedTransitions(currentStatus);

  const change = async (target: VulnStatus) => {
    setPending(target);
    setError("");
    try {
      const res = await fetch(
        `/api/projects/${projectId}/vulnerabilities/${vulnId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: target }),
        }
      );
      const result = await res.json();
      if (!res.ok) {
        setError(result.error || "Failed to change status");
        return;
      }
      onStatusChanged(result.vulnerability);
      setIsOpen(false);
    } catch {
      setError("An error occurred. Please try again.");
    } finally {
      setPending(null);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <StatusBadge status={currentStatus} />
        <button
          type="button"
          onClick={() => setIsOpen((v) => !v)}
          className="text-xs font-medium text-orange-600 hover:text-orange-700"
        >
          Change status
        </button>
      </div>

      {isOpen && (
        <div
          role="menu"
          className="rounded-xl border border-orange-100 bg-white shadow-sm overflow-hidden"
        >
          {targets.length === 0 ? (
            <div className="px-3 py-2 text-xs text-gray-500">
              No further transitions available.
            </div>
          ) : (
            targets.map((target) => (
              <button
                key={target}
                role="menuitem"
                type="button"
                disabled={pending !== null}
                onClick={() => change(target)}
                className="w-full text-left px-3 py-2 text-sm hover:bg-orange-50 disabled:opacity-50"
              >
                Move to {LABELS[target]}
                {pending === target && (
                  <span className="ml-2 text-xs text-gray-500">…</span>
                )}
              </button>
            ))
          )}
        </div>
      )}

      {error && (
        <div role="alert" className="text-xs text-red-600">
          {error}
        </div>
      )}
    </div>
  );
}
