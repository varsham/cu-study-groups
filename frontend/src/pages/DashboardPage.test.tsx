// ABOUTME: Tests for the DashboardPage component
// ABOUTME: Verifies auth-based display of login or dashboard

import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { DashboardPage } from "./DashboardPage";

// Mock the hooks and components
vi.mock("../contexts/AuthContext", () => ({
  useAuth: vi.fn(),
}));

vi.mock("../components/LoginForm", () => ({
  LoginForm: () => <div data-testid="login-form">Login Form</div>,
}));

vi.mock("../components/OrganizerDashboard", () => ({
  OrganizerDashboard: () => (
    <div data-testid="organizer-dashboard">Organizer Dashboard</div>
  ),
}));

import { useAuth } from "../contexts/AuthContext";
const mockUseAuth = useAuth as ReturnType<typeof vi.fn>;

describe("DashboardPage", () => {
  it("shows loading state", () => {
    mockUseAuth.mockReturnValue({
      user: null,
      isLoading: true,
    });

    render(<DashboardPage />);

    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("shows login form when not authenticated", () => {
    mockUseAuth.mockReturnValue({
      user: null,
      isLoading: false,
    });

    render(<DashboardPage />);

    expect(screen.getByTestId("login-form")).toBeInTheDocument();
    expect(screen.queryByTestId("organizer-dashboard")).not.toBeInTheDocument();
  });

  it("shows dashboard when authenticated", () => {
    mockUseAuth.mockReturnValue({
      user: { email: "test@columbia.edu" },
      isLoading: false,
    });

    render(<DashboardPage />);

    expect(screen.getByTestId("organizer-dashboard")).toBeInTheDocument();
    expect(screen.queryByTestId("login-form")).not.toBeInTheDocument();
  });
});
