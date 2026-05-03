import { VulnSeverity } from "@/types";

const STYLES: Record<VulnSeverity, string> = {
  LOW: "bg-gray-100 text-gray-700 border-gray-200",
  MEDIUM: "bg-amber-100 text-amber-700 border-amber-200",
  HIGH: "bg-orange-100 text-orange-700 border-orange-200",
  CRITICAL: "bg-red-100 text-red-700 border-red-200",
};

const LABELS: Record<VulnSeverity, string> = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
  CRITICAL: "Critical",
};

export function SeverityBadge({ severity }: { severity: VulnSeverity }) {
  return (
    <span
      className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium ${STYLES[severity]}`}
    >
      {LABELS[severity]}
    </span>
  );
}
