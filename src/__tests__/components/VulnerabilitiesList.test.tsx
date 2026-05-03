import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { VulnerabilitiesList } from "@/components/vulnerabilities/vulnerabilities-list";
import { Vulnerability, User, Role } from "@/types";

jest.mock("@/components/vulnerabilities/create-vulnerability-modal", () => ({
  CreateVulnerabilityModal: ({ isOpen }: { isOpen: boolean }) =>
    isOpen ? <div data-testid="create-modal" /> : null,
}));

const reporter: User = {
  id: "u1",
  email: "alice@test.com",
  name: "Alice",
  avatarUrl: null,
  role: "USER",
  createdAt: new Date(),
};

const me: User = {
  id: "me",
  email: "me@test.com",
  name: "Me",
  avatarUrl: null,
  role: "USER",
  createdAt: new Date(),
};

function vuln(overrides: Partial<Vulnerability>): Vulnerability {
  return {
    id: "v1",
    projectId: "p1",
    title: "RCE",
    description: null,
    cveId: null,
    ghsaId: null,
    severity: "HIGH",
    cvssScore: null,
    cvssVector: null,
    exploitStatus: "UNKNOWN",
    affectedComponent: null,
    affectedVersions: null,
    fixedVersion: null,
    status: "OPEN",
    reportedAt: new Date("2026-05-01"),
    patchedAt: null,
    verifiedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    reporterId: reporter.id,
    assigneeId: null,
    reporter,
    assignee: null,
    ...overrides,
  };
}

const baseProps = {
  projectId: "p1",
  members: [reporter, me],
  currentUser: me,
  myRole: "ADMIN" as Role,
};

describe("VulnerabilitiesList", () => {
  it("renders an empty state when there are no vulnerabilities", () => {
    render(<VulnerabilitiesList {...baseProps} initialVulnerabilities={[]} />);
    expect(screen.getByText(/no vulnerabilities/i)).toBeInTheDocument();
  });

  it("renders one row per vulnerability", () => {
    const vulns = [
      vuln({ id: "v1", title: "RCE in foo" }),
      vuln({ id: "v2", title: "XSS in bar", severity: "MEDIUM" }),
    ];
    render(
      <VulnerabilitiesList {...baseProps} initialVulnerabilities={vulns} />
    );
    expect(screen.getByText("RCE in foo")).toBeInTheDocument();
    expect(screen.getByText("XSS in bar")).toBeInTheDocument();
  });

  it("sorts by CVSS score descending by default", () => {
    const vulns = [
      vuln({ id: "v1", title: "Lower", cvssScore: 5.0 }),
      vuln({ id: "v2", title: "Higher", cvssScore: 9.8 }),
      vuln({ id: "v3", title: "Mid", cvssScore: 7.5 }),
    ];
    render(
      <VulnerabilitiesList {...baseProps} initialVulnerabilities={vulns} />
    );
    const rows = screen.getAllByTestId("vuln-row");
    expect(rows[0]).toHaveTextContent("Higher");
    expect(rows[1]).toHaveTextContent("Mid");
    expect(rows[2]).toHaveTextContent("Lower");
  });

  it("filters by severity", async () => {
    const user = userEvent.setup();
    const vulns = [
      vuln({ id: "v1", title: "Critical thing", severity: "CRITICAL" }),
      vuln({ id: "v2", title: "Low thing", severity: "LOW" }),
    ];
    render(
      <VulnerabilitiesList {...baseProps} initialVulnerabilities={vulns} />
    );

    expect(screen.getByText("Critical thing")).toBeInTheDocument();
    expect(screen.getByText("Low thing")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /^critical$/i }));

    expect(screen.getByText("Critical thing")).toBeInTheDocument();
    expect(screen.queryByText("Low thing")).not.toBeInTheDocument();
  });

  it("filters by status", async () => {
    const user = userEvent.setup();
    const vulns = [
      vuln({ id: "v1", title: "Open thing", status: "OPEN" }),
      vuln({ id: "v2", title: "Patched thing", status: "PATCHED" }),
    ];
    render(
      <VulnerabilitiesList {...baseProps} initialVulnerabilities={vulns} />
    );

    await user.click(screen.getByRole("button", { name: /^open$/i }));

    expect(screen.getByText("Open thing")).toBeInTheDocument();
    expect(screen.queryByText("Patched thing")).not.toBeInTheDocument();
  });

  it("toggles assigned-to-me filter", async () => {
    const user = userEvent.setup();
    const vulns = [
      vuln({ id: "v1", title: "Mine", assigneeId: me.id, assignee: me }),
      vuln({
        id: "v2",
        title: "Theirs",
        assigneeId: reporter.id,
        assignee: reporter,
      }),
    ];
    render(
      <VulnerabilitiesList {...baseProps} initialVulnerabilities={vulns} />
    );

    await user.click(screen.getByRole("button", { name: /assigned to me/i }));

    expect(screen.getByText("Mine")).toBeInTheDocument();
    expect(screen.queryByText("Theirs")).not.toBeInTheDocument();
  });

  it("filters by has-CVE", async () => {
    const user = userEvent.setup();
    const vulns = [
      vuln({ id: "v1", title: "With CVE", cveId: "CVE-2025-1" }),
      vuln({ id: "v2", title: "Without CVE", cveId: null }),
    ];
    render(
      <VulnerabilitiesList {...baseProps} initialVulnerabilities={vulns} />
    );

    await user.click(screen.getByRole("button", { name: /has cve/i }));

    expect(screen.getByText("With CVE")).toBeInTheDocument();
    expect(screen.queryByText("Without CVE")).not.toBeInTheDocument();
  });

  it("clears all filters", async () => {
    const user = userEvent.setup();
    const vulns = [
      vuln({ id: "v1", title: "Critical thing", severity: "CRITICAL" }),
      vuln({ id: "v2", title: "Low thing", severity: "LOW" }),
    ];
    render(
      <VulnerabilitiesList {...baseProps} initialVulnerabilities={vulns} />
    );

    await user.click(screen.getByRole("button", { name: /^critical$/i }));
    expect(screen.queryByText("Low thing")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /clear/i }));

    expect(screen.getByText("Low thing")).toBeInTheDocument();
  });

  it("shows the report button for project admins", () => {
    render(
      <VulnerabilitiesList
        {...baseProps}
        myRole="ADMIN"
        initialVulnerabilities={[]}
      />
    );
    expect(
      screen.getByRole("button", { name: /report vulnerability/i })
    ).toBeInTheDocument();
  });

  it("hides the report button for regular project members", () => {
    render(
      <VulnerabilitiesList
        {...baseProps}
        myRole="MEMBER"
        initialVulnerabilities={[]}
      />
    );
    expect(
      screen.queryByRole("button", { name: /report vulnerability/i })
    ).not.toBeInTheDocument();
  });

  it("opens the create modal when the report button is clicked", async () => {
    const user = userEvent.setup();
    render(
      <VulnerabilitiesList
        {...baseProps}
        myRole="ADMIN"
        initialVulnerabilities={[]}
      />
    );
    expect(screen.queryByTestId("create-modal")).not.toBeInTheDocument();
    await user.click(
      screen.getByRole("button", { name: /report vulnerability/i })
    );
    expect(screen.getByTestId("create-modal")).toBeInTheDocument();
  });

  it("shows CVE id when present", () => {
    const vulns = [vuln({ cveId: "CVE-2025-1234" })];
    render(
      <VulnerabilitiesList {...baseProps} initialVulnerabilities={vulns} />
    );
    expect(screen.getByText("CVE-2025-1234")).toBeInTheDocument();
  });

  it("links each row to the detail page", () => {
    const vulns = [vuln({ id: "v-abc" })];
    render(
      <VulnerabilitiesList {...baseProps} initialVulnerabilities={vulns} />
    );
    expect(screen.getByTestId("vuln-row")).toHaveAttribute(
      "href",
      "/projects/p1/vulnerabilities/v-abc"
    );
  });
});
