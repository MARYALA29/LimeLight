import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { StatusChanger } from "@/components/vulnerabilities/status-changer";

describe("StatusChanger", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock) = jest.fn();
  });

  it("renders the current status as a non-interactive badge for non-admins", () => {
    render(
      <StatusChanger
        projectId="p1"
        vulnId="v1"
        currentStatus="OPEN"
        canEdit={false}
        onStatusChanged={jest.fn()}
      />
    );
    expect(screen.getByText(/^open$/i)).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /change status/i })
    ).not.toBeInTheDocument();
  });

  it("shows a Change status button for admins", () => {
    render(
      <StatusChanger
        projectId="p1"
        vulnId="v1"
        currentStatus="OPEN"
        canEdit={true}
        onStatusChanged={jest.fn()}
      />
    );
    expect(
      screen.getByRole("button", { name: /change status/i })
    ).toBeInTheDocument();
  });

  it("opens a menu showing only valid transitions for the current status", async () => {
    const user = userEvent.setup();
    render(
      <StatusChanger
        projectId="p1"
        vulnId="v1"
        currentStatus="OPEN"
        canEdit={true}
        onStatusChanged={jest.fn()}
      />
    );
    await user.click(screen.getByRole("button", { name: /change status/i }));

    // OPEN can go to TRIAGED, WONT_FIX, DUPLICATE
    expect(screen.getByRole("menuitem", { name: /triaged/i })).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: /won't fix/i })).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: /duplicate/i })).toBeInTheDocument();
    // OPEN cannot go directly to PATCHED, VERIFIED
    expect(screen.queryByRole("menuitem", { name: /patched/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("menuitem", { name: /verified/i })).not.toBeInTheDocument();
  });

  it("shows a 'no further transitions' state for terminal statuses", async () => {
    const user = userEvent.setup();
    render(
      <StatusChanger
        projectId="p1"
        vulnId="v1"
        currentStatus="VERIFIED"
        canEdit={true}
        onStatusChanged={jest.fn()}
      />
    );
    await user.click(screen.getByRole("button", { name: /change status/i }));
    expect(screen.getByText(/no further transitions/i)).toBeInTheDocument();
  });

  it("PATCHes the vuln on selection and calls onStatusChanged", async () => {
    const onStatusChanged = jest.fn();
    const updated = { id: "v1", status: "TRIAGED" };
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ vulnerability: updated }),
    });

    const user = userEvent.setup();
    render(
      <StatusChanger
        projectId="p1"
        vulnId="v1"
        currentStatus="OPEN"
        canEdit={true}
        onStatusChanged={onStatusChanged}
      />
    );

    await user.click(screen.getByRole("button", { name: /change status/i }));
    await user.click(screen.getByRole("menuitem", { name: /triaged/i }));

    await waitFor(() => {
      expect(onStatusChanged).toHaveBeenCalledWith(updated);
    });
    expect(global.fetch).toHaveBeenCalledWith(
      "/api/projects/p1/vulnerabilities/v1",
      expect.objectContaining({
        method: "PATCH",
        body: JSON.stringify({ status: "TRIAGED" }),
      })
    );
  });

  it("surfaces a server error when the PATCH fails", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      json: async () => ({ error: "Invalid status transition: OPEN → VERIFIED" }),
    });

    const user = userEvent.setup();
    render(
      <StatusChanger
        projectId="p1"
        vulnId="v1"
        currentStatus="OPEN"
        canEdit={true}
        onStatusChanged={jest.fn()}
      />
    );

    await user.click(screen.getByRole("button", { name: /change status/i }));
    await user.click(screen.getByRole("menuitem", { name: /triaged/i }));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(/invalid status/i);
    });
  });
});
