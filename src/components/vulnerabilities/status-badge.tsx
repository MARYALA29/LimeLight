import { VulnStatus } from "@/types";

const STYLES: Record<VulnStatus, string> = {
  OPEN: "bg-red-50 text-red-700 border-red-200",
  TRIAGED: "bg-orange-50 text-orange-700 border-orange-200",
  IN_PROGRESS: "bg-amber-50 text-amber-700 border-amber-200",
  PATCHED: "bg-blue-50 text-blue-700 border-blue-200",
  VERIFIED: "bg-green-50 text-green-700 border-green-200",
  WONT_FIX: "bg-gray-100 text-gray-600 border-gray-200",
  DUPLICATE: "bg-gray-100 text-gray-600 border-gray-200",
};

const LABELS: Record<VulnStatus, string> = {
  OPEN: "Open",
  TRIAGED: "Triaged",
  IN_PROGRESS: "In progress",
  PATCHED: "Patched",
  VERIFIED: "Verified",
  WONT_FIX: "Won't fix",
  DUPLICATE: "Duplicate",
};

export function StatusBadge({ status }: { status: VulnStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium ${STYLES[status]}`}
    >
      {LABELS[status]}
    </span>
  );
}
