"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui";
import { Role, User, Vulnerability, VulnSeverity, VulnStatus } from "@/types";
import { SeverityBadge } from "./severity-badge";
import { StatusBadge } from "./status-badge";
import { ExploitBadge } from "./exploit-badge";
import { CreateVulnerabilityModal } from "./create-vulnerability-modal";

interface Props {
  projectId: string;
  members: User[];
  currentUser: User;
  myRole: Role;
  initialVulnerabilities: Vulnerability[];
}

const ALL_SEVERITIES: VulnSeverity[] = ["CRITICAL", "HIGH", "MEDIUM", "LOW"];
const ALL_STATUSES: VulnStatus[] = [
  "OPEN",
  "TRIAGED",
  "IN_PROGRESS",
  "PATCHED",
  "VERIFIED",
  "WONT_FIX",
  "DUPLICATE",
];

const STATUS_LABELS: Record<VulnStatus, string> = {
  OPEN: "Open",
  TRIAGED: "Triaged",
  IN_PROGRESS: "In progress",
  PATCHED: "Patched",
  VERIFIED: "Verified",
  WONT_FIX: "Won't fix",
  DUPLICATE: "Duplicate",
};

export function VulnerabilitiesList({
  projectId,
  members,
  currentUser,
  myRole,
  initialVulnerabilities,
}: Props) {
  const [vulns, setVulns] = useState(initialVulnerabilities);
  const [severityFilter, setSeverityFilter] = useState<Set<VulnSeverity>>(
    new Set()
  );
  const [statusFilter, setStatusFilter] = useState<Set<VulnStatus>>(new Set());
  const [hasCveOnly, setHasCveOnly] = useState(false);
  const [assignedToMeOnly, setAssignedToMeOnly] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const isAdmin = myRole === "ADMIN";

  const visible = useMemo(() => {
    let list = [...vulns];
    if (severityFilter.size > 0) {
      list = list.filter((v) => severityFilter.has(v.severity));
    }
    if (statusFilter.size > 0) {
      list = list.filter((v) => statusFilter.has(v.status));
    }
    if (hasCveOnly) {
      list = list.filter((v) => !!v.cveId);
    }
    if (assignedToMeOnly) {
      list = list.filter((v) => v.assigneeId === currentUser.id);
    }
    list.sort((a, b) => {
      const aScore = a.cvssScore ?? -1;
      const bScore = b.cvssScore ?? -1;
      return bScore - aScore;
    });
    return list;
  }, [
    vulns,
    severityFilter,
    statusFilter,
    hasCveOnly,
    assignedToMeOnly,
    currentUser.id,
  ]);

  const toggle = <T,>(set: Set<T>, value: T): Set<T> => {
    const next = new Set(set);
    if (next.has(value)) next.delete(value);
    else next.add(value);
    return next;
  };

  const activeFilterCount =
    severityFilter.size +
    statusFilter.size +
    (hasCveOnly ? 1 : 0) +
    (assignedToMeOnly ? 1 : 0);

  const clearFilters = () => {
    setSeverityFilter(new Set());
    setStatusFilter(new Set());
    setHasCveOnly(false);
    setAssignedToMeOnly(false);
  };

  const handleCreated = (v: Vulnerability) => {
    setVulns([v, ...vulns]);
    setIsCreateOpen(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-semibold text-gray-900">
          Vulnerabilities{" "}
          <span className="text-sm font-normal text-gray-500">
            ({visible.length} of {vulns.length})
          </span>
        </h2>
        {isAdmin && (
          <Button onClick={() => setIsCreateOpen(true)}>
            + Report vulnerability
          </Button>
        )}
      </div>

      <div className="rounded-2xl border border-orange-100 bg-white p-4 shadow-sm space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Severity
          </span>
          {ALL_SEVERITIES.map((s) => (
            <FilterPill
              key={s}
              label={s.charAt(0) + s.slice(1).toLowerCase()}
              active={severityFilter.has(s)}
              onClick={() => setSeverityFilter(toggle(severityFilter, s))}
            />
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Status
          </span>
          {ALL_STATUSES.map((s) => (
            <FilterPill
              key={s}
              label={STATUS_LABELS[s]}
              active={statusFilter.has(s)}
              onClick={() => setStatusFilter(toggle(statusFilter, s))}
            />
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <FilterPill
            label="Has CVE"
            active={hasCveOnly}
            onClick={() => setHasCveOnly(!hasCveOnly)}
          />
          <FilterPill
            label="Assigned to me"
            active={assignedToMeOnly}
            onClick={() => setAssignedToMeOnly(!assignedToMeOnly)}
          />
          {activeFilterCount > 0 && (
            <button
              type="button"
              onClick={clearFilters}
              className="text-xs font-medium text-orange-600 hover:text-orange-700 ml-2"
            >
              Clear ({activeFilterCount})
            </button>
          )}
        </div>
      </div>

      {visible.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-orange-200 bg-orange-50/50 p-12 text-center">
          <p className="text-gray-700 font-medium">No vulnerabilities</p>
          <p className="mt-1 text-sm text-gray-500">
            {vulns.length === 0
              ? "Nothing's been reported on this project yet."
              : "No vulnerabilities match the current filters."}
          </p>
        </div>
      ) : (
        <div className="rounded-2xl border border-orange-100 bg-white shadow-sm divide-y divide-orange-50 overflow-hidden">
          {visible.map((v) => (
            <VulnRow key={v.id} vuln={v} projectId={projectId} />
          ))}
        </div>
      )}

      <CreateVulnerabilityModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        projectId={projectId}
        members={members}
        onCreated={handleCreated}
      />
    </div>
  );
}

function FilterPill({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
        active
          ? "border-orange-500 bg-orange-500 text-white"
          : "border-gray-200 bg-white text-gray-700 hover:border-orange-300 hover:bg-orange-50"
      }`}
    >
      {label}
    </button>
  );
}

function VulnRow({ vuln, projectId }: { vuln: Vulnerability; projectId: string }) {
  return (
    <Link
      data-testid="vuln-row"
      href={`/projects/${projectId}/vulnerabilities/${vuln.id}`}
      className="block p-4 hover:bg-orange-50/50 transition-colors"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <SeverityBadge severity={vuln.severity} />
            <StatusBadge status={vuln.status} />
            <ExploitBadge exploitStatus={vuln.exploitStatus} />
            {vuln.cveId && (
              <span className="text-xs font-mono text-gray-500">
                {vuln.cveId}
              </span>
            )}
            {vuln.ghsaId && !vuln.cveId && (
              <span className="text-xs font-mono text-gray-500">
                {vuln.ghsaId}
              </span>
            )}
          </div>
          <div className="mt-2 font-medium text-gray-900 truncate">
            {vuln.title}
          </div>
          {vuln.affectedComponent && (
            <div className="mt-1 text-xs text-gray-500 font-mono">
              {vuln.affectedComponent}
            </div>
          )}
        </div>
        <div className="flex flex-col items-end gap-1 text-xs text-gray-500 whitespace-nowrap">
          {vuln.cvssScore !== null && (
            <span className="font-semibold text-gray-700">
              CVSS {vuln.cvssScore.toFixed(1)}
            </span>
          )}
          {vuln.assignee && <span>{vuln.assignee.name}</span>}
        </div>
      </div>
    </Link>
  );
}
