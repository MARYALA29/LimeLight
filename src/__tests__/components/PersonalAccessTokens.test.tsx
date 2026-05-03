import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PersonalAccessTokens } from "@/components/settings/PersonalAccessTokens";

jest.mock("@/components/ui", () => {
  const React = require("react");
  return {
    Button: React.forwardRef(
      (
        {
          children,
          variant,
          size,
          isLoading,
          ...props
        }: React.ButtonHTMLAttributes<HTMLButtonElement> & {
          children: React.ReactNode;
          variant?: string;
          size?: string;
          isLoading?: boolean;
        },
        ref: React.Ref<HTMLButtonElement>
      ) => (
        <button ref={ref} {...props}>
          {isLoading ? "Loading..." : children}
        </button>
      )
    ),
    Input: React.forwardRef(
      (
        {
          label,
          error,
          ...props
        }: { label?: string; error?: string } & React.InputHTMLAttributes<HTMLInputElement>,
        ref: React.Ref<HTMLInputElement>
      ) => (
        <div>
          {label && <label htmlFor={props.id}>{label}</label>}
          <input ref={ref} {...props} />
          {error && <span role="alert">{error}</span>}
        </div>
      )
    ),
    Modal: ({
      isOpen,
      title,
      children,
    }: {
      isOpen: boolean;
      onClose: () => void;
      title?: React.ReactNode;
      children: React.ReactNode;
    }) =>
      isOpen ? (
        <div role="dialog" aria-label={typeof title === "string" ? title : "Modal"}>
          {title && <div>{title}</div>}
          {children}
        </div>
      ) : null,
  };
});

describe("PersonalAccessTokens settings panel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("shows the empty state with a call to action when the user has no tokens", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ personalAccessTokens: [] }),
    });

    render(<PersonalAccessTokens />);

    await waitFor(() => {
      expect(screen.getByText(/create your first token/i)).toBeInTheDocument();
    });
  });

  it("lists existing tokens with name, prefix and last-used info", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        personalAccessTokens: [
          {
            id: "pat-1",
            name: "ci-token",
            prefix: "abcd1234",
            scopes: ["*"],
            createdAt: "2024-01-02T00:00:00.000Z",
            lastUsedAt: null,
          },
        ],
      }),
    });

    render(<PersonalAccessTokens />);

    await waitFor(() => {
      expect(screen.getByText("ci-token")).toBeInTheDocument();
    });

    expect(screen.getByText(/ll_pat_abcd1234/i)).toBeInTheDocument();
    expect(screen.getByText(/never used/i)).toBeInTheDocument();
  });

  it("creates a token, shows it once with the warning, then refreshes the list", async () => {
    const user = userEvent.setup();
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ personalAccessTokens: [] }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          token: "ll_pat_secret_value_xyz",
          personalAccessToken: {
            id: "pat-1",
            name: "ci-token",
            prefix: "secret_v",
            scopes: ["*"],
            createdAt: "2024-01-02T00:00:00.000Z",
            lastUsedAt: null,
          },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          personalAccessTokens: [
            {
              id: "pat-1",
              name: "ci-token",
              prefix: "secret_v",
              scopes: ["*"],
              createdAt: "2024-01-02T00:00:00.000Z",
              lastUsedAt: null,
            },
          ],
        }),
      });

    render(<PersonalAccessTokens />);

    await waitFor(() => {
      expect(screen.getByText(/create your first token/i)).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: /create token/i }));
    await user.type(screen.getByLabelText(/token name/i), "ci-token");
    await user.click(screen.getByRole("button", { name: /^create$/i }));

    await waitFor(() => {
      expect(screen.getByText("ll_pat_secret_value_xyz")).toBeInTheDocument();
    });

    expect(
      screen.getByText(/copy now — you won't see this again/i)
    ).toBeInTheDocument();

    // The POST call should have used the right URL and method
    const postCall = (global.fetch as jest.Mock).mock.calls.find(
      (c) => c[1]?.method === "POST"
    );
    expect(postCall![0]).toBe("/api/users/me/tokens");
    expect(JSON.parse(postCall![1].body).name).toBe("ci-token");
  });

  it("revokes a token after confirmation and refreshes the list", async () => {
    const user = userEvent.setup();
    const confirmSpy = jest.spyOn(window, "confirm").mockReturnValue(true);

    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          personalAccessTokens: [
            {
              id: "pat-1",
              name: "ci-token",
              prefix: "abcd1234",
              scopes: ["*"],
              createdAt: "2024-01-02T00:00:00.000Z",
              lastUsedAt: null,
            },
          ],
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ personalAccessTokens: [] }),
      });

    render(<PersonalAccessTokens />);

    await waitFor(() => {
      expect(screen.getByText("ci-token")).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: /revoke/i }));

    await waitFor(() => {
      const calls = (global.fetch as jest.Mock).mock.calls;
      expect(
        calls.find((c) => c[0] === "/api/users/me/tokens/pat-1" && c[1]?.method === "DELETE")
      ).toBeDefined();
    });

    confirmSpy.mockRestore();
  });
});
