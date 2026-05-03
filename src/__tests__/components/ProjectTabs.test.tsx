import { render, screen } from "@testing-library/react";
import { ProjectTabs } from "@/components/projects/project-tabs";

jest.mock("next/link", () => {
  const MockLink = ({
    children,
    href,
    ...rest
  }: {
    children: React.ReactNode;
    href: string;
  } & React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a href={href} {...rest}>
      {children}
    </a>
  );
  MockLink.displayName = "MockLink";
  return MockLink;
});

describe("ProjectTabs", () => {
  it("renders Board and Vulnerabilities tabs", () => {
    render(<ProjectTabs projectId="p1" active="board" />);
    expect(screen.getByRole("link", { name: /board/i })).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /vulnerabilities/i })
    ).toBeInTheDocument();
  });

  it("links Board to the project root", () => {
    render(<ProjectTabs projectId="p1" active="board" />);
    expect(screen.getByRole("link", { name: /board/i })).toHaveAttribute(
      "href",
      "/projects/p1"
    );
  });

  it("links Vulnerabilities to the vulnerabilities sub-route", () => {
    render(<ProjectTabs projectId="p1" active="vulnerabilities" />);
    expect(
      screen.getByRole("link", { name: /vulnerabilities/i })
    ).toHaveAttribute("href", "/projects/p1/vulnerabilities");
  });

  it("marks the active tab with aria-current", () => {
    render(<ProjectTabs projectId="p1" active="board" />);
    expect(screen.getByRole("link", { name: /board/i })).toHaveAttribute(
      "aria-current",
      "page"
    );
    expect(
      screen.getByRole("link", { name: /vulnerabilities/i })
    ).not.toHaveAttribute("aria-current", "page");
  });

  it("highlights the vulnerabilities tab when active", () => {
    render(<ProjectTabs projectId="p1" active="vulnerabilities" />);
    expect(
      screen.getByRole("link", { name: /vulnerabilities/i })
    ).toHaveAttribute("aria-current", "page");
  });
});
