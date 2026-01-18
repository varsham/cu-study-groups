// ABOUTME: Tests for the HomePage component
// ABOUTME: Verifies study group listing, search, and join functionality

import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { HomePage } from "./HomePage";

// Mock useAuth to return no user (so we don't redirect)
vi.mock("../contexts/AuthContext", () => ({
  useAuth: () => ({
    user: null,
    isLoading: false,
  }),
}));

// Mock useUserEmail
vi.mock("../contexts/UserEmailContext", () => ({
  useUserEmail: () => ({
    userEmail: null,
    setUserEmail: vi.fn(),
    clearUserEmail: vi.fn(),
  }),
}));

const mockGroups = [
  {
    id: "1",
    subject: "Calculus I",
    professor_name: "Smith",
    location: "Butler Library",
    start_time: "2026-01-20T14:00:00-05:00",
    end_time: "2026-01-20T16:00:00-05:00",
    student_limit: 10,
    organizer_name: "John Doe",
    created_at: "2026-01-17T10:00:00-05:00",
    expires_at: "2026-01-20T16:00:00-05:00",
    participant_count: 3,
    is_full: false,
  },
  {
    id: "2",
    subject: "Physics II",
    professor_name: "Johnson",
    location: "Mudd Building",
    start_time: "2026-01-21T10:00:00-05:00",
    end_time: "2026-01-21T12:00:00-05:00",
    student_limit: null,
    organizer_name: null,
    created_at: "2026-01-17T11:00:00-05:00",
    expires_at: "2026-01-21T12:00:00-05:00",
    participant_count: 5,
    is_full: false,
  },
];

const mockJoinGroup = vi.fn();
const mockRefetch = vi.fn();

vi.mock("../hooks/useStudyGroups", () => ({
  useStudyGroups: vi.fn(),
}));

import { useStudyGroups } from "../hooks/useStudyGroups";
const mockUseStudyGroups = useStudyGroups as ReturnType<typeof vi.fn>;

describe("HomePage", () => {
  beforeEach(() => {
    mockJoinGroup.mockReset();
    mockRefetch.mockReset();
  });

  const renderWithRouter = (ui: React.ReactElement) => {
    return render(<MemoryRouter>{ui}</MemoryRouter>);
  };

  it("renders hero section", () => {
    mockUseStudyGroups.mockReturnValue({
      groups: [],
      isLoading: false,
      error: null,
      refetch: mockRefetch,
      joinGroup: mockJoinGroup,
    });

    renderWithRouter(<HomePage />);

    expect(screen.getByText("CU Study Groups")).toBeInTheDocument();
    expect(screen.getByText(/Find and join study groups/)).toBeInTheDocument();
  });

  it("renders search bar", () => {
    mockUseStudyGroups.mockReturnValue({
      groups: [],
      isLoading: false,
      error: null,
      refetch: mockRefetch,
      joinGroup: mockJoinGroup,
    });

    renderWithRouter(<HomePage />);

    expect(
      screen.getByPlaceholderText(/Search by subject/),
    ).toBeInTheDocument();
  });

  it("shows loading state", () => {
    mockUseStudyGroups.mockReturnValue({
      groups: [],
      isLoading: true,
      error: null,
      refetch: mockRefetch,
      joinGroup: mockJoinGroup,
    });

    renderWithRouter(<HomePage />);

    expect(screen.getByText("Loading study groups...")).toBeInTheDocument();
  });

  it("shows error state with retry", () => {
    mockUseStudyGroups.mockReturnValue({
      groups: [],
      isLoading: false,
      error: "Failed to load groups",
      refetch: mockRefetch,
      joinGroup: mockJoinGroup,
    });

    renderWithRouter(<HomePage />);

    expect(screen.getByText("Failed to load groups")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /try again/i }),
    ).toBeInTheDocument();
  });

  it("shows empty state when no groups", () => {
    mockUseStudyGroups.mockReturnValue({
      groups: [],
      isLoading: false,
      error: null,
      refetch: mockRefetch,
      joinGroup: mockJoinGroup,
    });

    renderWithRouter(<HomePage />);

    expect(screen.getByText("No study groups available")).toBeInTheDocument();
  });

  it("displays study groups", () => {
    mockUseStudyGroups.mockReturnValue({
      groups: mockGroups,
      isLoading: false,
      error: null,
      refetch: mockRefetch,
      joinGroup: mockJoinGroup,
    });

    renderWithRouter(<HomePage />);

    expect(screen.getByText("Calculus I")).toBeInTheDocument();
    expect(screen.getByText("Physics II")).toBeInTheDocument();
    expect(screen.getByText("2 study groups available")).toBeInTheDocument();
  });

  it("opens join modal when Join clicked", () => {
    mockUseStudyGroups.mockReturnValue({
      groups: mockGroups,
      isLoading: false,
      error: null,
      refetch: mockRefetch,
      joinGroup: mockJoinGroup,
    });

    renderWithRouter(<HomePage />);

    const joinButtons = screen.getAllByRole("button", { name: /join/i });
    fireEvent.click(joinButtons[0]);

    expect(screen.getByText("Join Study Group")).toBeInTheDocument();
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("closes join modal on cancel", () => {
    mockUseStudyGroups.mockReturnValue({
      groups: mockGroups,
      isLoading: false,
      error: null,
      refetch: mockRefetch,
      joinGroup: mockJoinGroup,
    });

    renderWithRouter(<HomePage />);

    const joinButtons = screen.getAllByRole("button", { name: /join/i });
    fireEvent.click(joinButtons[0]);

    expect(screen.getByRole("dialog")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /cancel/i }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("calls joinGroup on form submit", async () => {
    mockJoinGroup.mockResolvedValue(undefined);
    mockUseStudyGroups.mockReturnValue({
      groups: mockGroups,
      isLoading: false,
      error: null,
      refetch: mockRefetch,
      joinGroup: mockJoinGroup,
    });

    renderWithRouter(<HomePage />);

    const joinButtons = screen.getAllByRole("button", { name: /join/i });
    fireEvent.click(joinButtons[0]);

    fireEvent.change(screen.getByLabelText("Your Name"), {
      target: { value: "Test User" },
    });
    fireEvent.change(screen.getByLabelText("Columbia Email"), {
      target: { value: "test@columbia.edu" },
    });
    fireEvent.click(screen.getByRole("button", { name: /join group/i }));

    await waitFor(() => {
      expect(mockJoinGroup).toHaveBeenCalledWith(
        "1",
        "Test User",
        "test@columbia.edu",
      );
    });
  });
});
