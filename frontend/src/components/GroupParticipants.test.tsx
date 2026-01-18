// ABOUTME: Tests for the GroupParticipants component
// ABOUTME: Verifies participant visibility based on membership

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { GroupParticipants } from "./GroupParticipants";

// Mock supabase
const mockRpc = vi.fn();
vi.mock("../lib/supabase", () => ({
  supabase: {
    rpc: (...args: unknown[]) => mockRpc(...args),
  },
}));

describe("GroupParticipants", () => {
  beforeEach(() => {
    mockRpc.mockReset();
  });

  it("does not render when no user email", () => {
    const { container } = render(
      <GroupParticipants
        groupId="123"
        userEmail={null}
        participantCount={5}
      />
    );

    expect(container.firstChild).toBeNull();
  });

  it("does not render when no participants", () => {
    const { container } = render(
      <GroupParticipants
        groupId="123"
        userEmail="test@columbia.edu"
        participantCount={0}
      />
    );

    expect(container.firstChild).toBeNull();
  });

  it("renders toggle button when user email and participants exist", () => {
    render(
      <GroupParticipants
        groupId="123"
        userEmail="test@columbia.edu"
        participantCount={3}
      />
    );

    expect(screen.getByText("3 participants")).toBeInTheDocument();
  });

  it("shows singular participant text for count of 1", () => {
    render(
      <GroupParticipants
        groupId="123"
        userEmail="test@columbia.edu"
        participantCount={1}
      />
    );

    expect(screen.getByText("1 participant")).toBeInTheDocument();
  });

  it("fetches and displays participants when expanded", async () => {
    mockRpc.mockResolvedValue({
      data: [
        { id: "1", name: "Alice", email: "alice@columbia.edu", joined_at: "2026-01-17T10:00:00Z" },
        { id: "2", name: "Bob", email: "bob@columbia.edu", joined_at: "2026-01-17T11:00:00Z" },
      ],
      error: null,
    });

    render(
      <GroupParticipants
        groupId="123"
        userEmail="test@columbia.edu"
        participantCount={2}
      />
    );

    // Click to expand
    fireEvent.click(screen.getByRole("button"));

    await waitFor(() => {
      expect(screen.getByText("Alice")).toBeInTheDocument();
      expect(screen.getByText("alice@columbia.edu")).toBeInTheDocument();
      expect(screen.getByText("Bob")).toBeInTheDocument();
    });

    expect(mockRpc).toHaveBeenCalledWith("get_group_participants_if_member", {
      p_study_group_id: "123",
      p_requester_email: "test@columbia.edu",
    });
  });

  it("shows message when user is not a member", async () => {
    mockRpc.mockResolvedValue({
      data: [],
      error: null,
    });

    render(
      <GroupParticipants
        groupId="123"
        userEmail="outsider@columbia.edu"
        participantCount={2}
      />
    );

    fireEvent.click(screen.getByRole("button"));

    await waitFor(() => {
      expect(screen.getByText(/Join this group to see/)).toBeInTheDocument();
    });
  });
});
