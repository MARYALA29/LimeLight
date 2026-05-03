import { render, screen, waitFor } from "@testing-library/react";
import DocsPage from "@/app/docs/page";

// Stub swagger-ui-react. We just need a marker we can assert on once it
// mounts, plus we want to avoid pulling in the real Swagger UI bundle from
// jsdom (it expects browser globals we don't provide here).
jest.mock("swagger-ui-react", () => {
  return {
    __esModule: true,
    default: ({ spec }: { spec: { info?: { title?: string } } }) => (
      <div data-testid="swagger-ui">{spec?.info?.title ?? "no-spec"}</div>
    ),
  };
});

// The page imports the CSS for swagger-ui-react. CSS isn't useful in jsdom
// and Next's jest config maps it to an identity proxy, so we don't need to
// mock it here — but we do guard against accidental node-side imports.
jest.mock("swagger-ui-react/swagger-ui.css", () => ({}), { virtual: true });

describe("DocsPage", () => {
  beforeEach(() => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        openapi: "3.1.0",
        info: { title: "LimeLight API", version: "0.0.0-test" },
        paths: {},
      }),
    });
  });

  it("shows a loading state initially, then mounts SwaggerUI with the fetched spec", async () => {
    render(<DocsPage />);

    expect(screen.getByText(/Loading API documentation/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByTestId("swagger-ui")).toBeInTheDocument();
    });

    expect(global.fetch).toHaveBeenCalledWith("/api/openapi.json");
    expect(screen.getByTestId("swagger-ui")).toHaveTextContent("LimeLight API");
  });
});
