import { render, screen } from "@testing-library/react";
import LoginPage from "@/app/(auth)/login/page";

jest.mock("@/components/ui", () => {
  const React = require("react");
  return {
    Button: React.forwardRef(
      (
        {
          children,
          isLoading,
          ...props
        }: React.ButtonHTMLAttributes<HTMLButtonElement> & {
          children: React.ReactNode;
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
        </div>
      )
    ),
  };
});

describe("LoginPage demo credentials banner", () => {
  const originalNodeEnv = process.env.NODE_ENV;

  afterEach(() => {
    Object.defineProperty(process.env, "NODE_ENV", {
      value: originalNodeEnv,
      configurable: true,
    });
  });

  function setNodeEnv(value: string) {
    Object.defineProperty(process.env, "NODE_ENV", {
      value,
      configurable: true,
    });
  }

  it("shows the demo credentials banner in development", () => {
    setNodeEnv("development");
    render(<LoginPage />);
    expect(screen.getByText(/demo@example\.com/)).toBeInTheDocument();
    expect(screen.getByText(/password123/)).toBeInTheDocument();
  });

  it("shows the demo credentials banner in test", () => {
    setNodeEnv("test");
    render(<LoginPage />);
    expect(screen.getByText(/demo@example\.com/)).toBeInTheDocument();
  });

  it("hides the demo credentials banner in production", () => {
    setNodeEnv("production");
    render(<LoginPage />);
    expect(screen.queryByText(/demo@example\.com/)).not.toBeInTheDocument();
    expect(screen.queryByText(/password123/)).not.toBeInTheDocument();
  });

  it("renders the email input regardless of environment", () => {
    setNodeEnv("production");
    render(<LoginPage />);
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
  });
});
