// ABOUTME: Tests for the StudyGroupCard component
// ABOUTME: Verifies rendering of group details, join button, and full state

import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { StudyGroupCard } from "./StudyGroupCard";
import type { StudyGroupWithCounts } from "../lib/database.types";

const createMockGroup = (
  overrides: Partial<StudyGroupWithCounts> = {},
): StudyGroupWithCounts => ({
  id: "test-id-123",
  subject: "Calculus I",
  description: null,
  professor_name: "Smith",
  location: "Butler Library Room 301",
  start_time: "2026-01-20T14:00:00-05:00",
  end_time: "2026-01-20T16:00:00-05:00",
  student_limit: 10,
  organizer_name: "Jane Doe",
  created_at: "2026-01-17T10:00:00-05:00",
  expires_at: "2026-01-20T16:00:00-05:00",
  participant_count: 3,
  is_full: false,
  ...overrides,
});

describe("StudyGroupCard", () => {
  it("renders the subject", () => {
    const group = createMockGroup({ subject: "Multivariable Calculus" });
    render(<StudyGroupCard group={group} onJoin={vi.fn()} />);

    expect(screen.getByText("Multivariable Calculus")).toBeInTheDocument();
  });

  it("renders professor name with prefix", () => {
    const group = createMockGroup({ professor_name: "Johnson" });
    render(<StudyGroupCard group={group} onJoin={vi.fn()} />);

    expect(screen.getByText("Prof. Johnson")).toBeInTheDocument();
  });

  it("does not render professor when null", () => {
    const group = createMockGroup({ professor_name: null });
    render(<StudyGroupCard group={group} onJoin={vi.fn()} />);

    expect(screen.queryByText(/Prof\./)).not.toBeInTheDocument();
  });

  it("renders the location as a link", () => {
    const group = createMockGroup({ location: "Mudd Building 501" });
    render(<StudyGroupCard group={group} onJoin={vi.fn()} />);

    const link = screen.getByRole("link", { name: "Mudd Building 501" });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href");
    expect(link.getAttribute("href")).toContain("google.com/maps");
    expect(link.getAttribute("href")).toContain("Mudd%20Building%20501");
  });

  it("renders organizer name when provided", () => {
    const group = createMockGroup({ organizer_name: "John Smith" });
    render(<StudyGroupCard group={group} onJoin={vi.fn()} />);

    expect(screen.getByText("Organized by John Smith")).toBeInTheDocument();
  });

  it("does not render organizer when null", () => {
    const group = createMockGroup({ organizer_name: null });
    render(<StudyGroupCard group={group} onJoin={vi.fn()} />);

    expect(screen.queryByText(/Organized by/)).not.toBeInTheDocument();
  });

  it("renders capacity with limit", () => {
    const group = createMockGroup({
      participant_count: 5,
      student_limit: 12,
    });
    render(<StudyGroupCard group={group} onJoin={vi.fn()} />);

    expect(screen.getByText("5/12")).toBeInTheDocument();
  });

  it("renders capacity without limit", () => {
    const group = createMockGroup({
      participant_count: 7,
      student_limit: null,
    });
    render(<StudyGroupCard group={group} onJoin={vi.fn()} />);

    expect(screen.getByText("7 joined")).toBeInTheDocument();
  });

  it("renders Join button when not full", () => {
    const group = createMockGroup({ is_full: false });
    render(<StudyGroupCard group={group} onJoin={vi.fn()} />);

    expect(screen.getByRole("button", { name: /join/i })).toBeInTheDocument();
    expect(screen.queryByText("Full")).not.toBeInTheDocument();
  });

  it("renders Full badge when group is full", () => {
    const group = createMockGroup({ is_full: true });
    render(<StudyGroupCard group={group} onJoin={vi.fn()} />);

    expect(screen.getByText("Full")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /join/i }),
    ).not.toBeInTheDocument();
  });

  it("calls onJoin with group id when Join button clicked", () => {
    const onJoin = vi.fn();
    const group = createMockGroup({ id: "group-abc-123" });
    render(<StudyGroupCard group={group} onJoin={onJoin} />);

    fireEvent.click(screen.getByRole("button", { name: /join/i }));

    expect(onJoin).toHaveBeenCalledTimes(1);
    expect(onJoin).toHaveBeenCalledWith("group-abc-123");
  });

  it("applies full class when group is full", () => {
    const group = createMockGroup({ is_full: true });
    const { container } = render(
      <StudyGroupCard group={group} onJoin={vi.fn()} />,
    );

    expect(
      container.querySelector(".study-group-card.full"),
    ).toBeInTheDocument();
  });

  it("does not apply full class when group is not full", () => {
    const group = createMockGroup({ is_full: false });
    const { container } = render(
      <StudyGroupCard group={group} onJoin={vi.fn()} />,
    );

    expect(
      container.querySelector(".study-group-card.full"),
    ).not.toBeInTheDocument();
    expect(container.querySelector(".study-group-card")).toBeInTheDocument();
  });
});
