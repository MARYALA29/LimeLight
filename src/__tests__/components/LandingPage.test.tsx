import { render, screen } from "@testing-library/react";
import { LandingPage } from "@/components/landing/landing-page";

jest.mock("next/link", () => {
  const MockLink = ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  );
  MockLink.displayName = "MockLink";
  return MockLink;
});

describe("LandingPage", () => {
  it("renders the LimeLight brand", () => {
    render(<LandingPage />);
    expect(screen.getAllByText("LimeLight").length).toBeGreaterThan(0);
  });

  it("renders the full hero headline", () => {
    render(<LandingPage />);
    expect(screen.getByText(/illuminate your/i)).toBeInTheDocument();
    expect(screen.getByText(/workflow/i)).toBeInTheDocument();
  });

  it("renders the hero subheadline describing the product", () => {
    render(<LandingPage />);
    expect(
      screen.getByText(/modern task management platform/i)
    ).toBeInTheDocument();
  });

  it("renders primary and secondary calls-to-action in the hero", () => {
    render(<LandingPage />);
    expect(
      screen.getAllByRole("link", { name: /start free today/i }).length
    ).toBeGreaterThan(0);
    expect(
      screen.getAllByRole("link", { name: /sign in/i }).length
    ).toBeGreaterThan(0);
  });

  it("renders a social proof / stats section", () => {
    render(<LandingPage />);
    expect(screen.getByTestId("stats-section")).toBeInTheDocument();
  });

  it("renders six feature cards", () => {
    render(<LandingPage />);
    const features = screen.getAllByTestId("feature-card");
    expect(features).toHaveLength(6);
  });

  it("includes the original three core features", () => {
    render(<LandingPage />);
    expect(screen.getByText(/kanban boards/i)).toBeInTheDocument();
    expect(screen.getByText(/team collaboration/i)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /track progress/i })).toBeInTheDocument();
  });

  it("renders a how-it-works section with three steps", () => {
    render(<LandingPage />);
    const steps = screen.getAllByTestId("how-step");
    expect(steps).toHaveLength(3);
  });

  it("renders a final CTA section", () => {
    render(<LandingPage />);
    expect(screen.getByTestId("final-cta")).toBeInTheDocument();
  });

  it("links the Get Started button to the register page", () => {
    render(<LandingPage />);
    const getStarted = screen.getByRole("link", { name: /get started/i });
    expect(getStarted).toHaveAttribute("href", "/register");
  });

  it("renders the footer", () => {
    render(<LandingPage />);
    expect(screen.getByRole("contentinfo")).toBeInTheDocument();
  });
});
