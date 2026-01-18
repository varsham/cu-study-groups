// ABOUTME: Tests for the ConfirmModal component
// ABOUTME: Verifies confirmation dialog behavior and destructive styling

import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ConfirmModal } from "./ConfirmModal";

describe("ConfirmModal", () => {
  const defaultProps = {
    title: "Confirm Action",
    message: "Are you sure you want to proceed?",
    onConfirm: vi.fn().mockResolvedValue(undefined),
    onCancel: vi.fn(),
  };

  it("renders title and message", () => {
    render(<ConfirmModal {...defaultProps} />);

    expect(screen.getByText("Confirm Action")).toBeInTheDocument();
    expect(
      screen.getByText("Are you sure you want to proceed?"),
    ).toBeInTheDocument();
  });

  it("has accessible dialog role", () => {
    render(<ConfirmModal {...defaultProps} />);

    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("renders default button labels", () => {
    render(<ConfirmModal {...defaultProps} />);

    expect(screen.getByRole("button", { name: "Confirm" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument();
  });

  it("renders custom button labels", () => {
    render(
      <ConfirmModal
        {...defaultProps}
        confirmLabel="Delete"
        cancelLabel="Keep"
      />,
    );

    expect(screen.getByRole("button", { name: "Delete" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Keep" })).toBeInTheDocument();
  });

  it("calls onCancel when cancel button clicked", () => {
    const onCancel = vi.fn();
    render(<ConfirmModal {...defaultProps} onCancel={onCancel} />);

    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("calls onConfirm when confirm button clicked", async () => {
    const onConfirm = vi.fn().mockResolvedValue(undefined);
    render(<ConfirmModal {...defaultProps} onConfirm={onConfirm} />);

    fireEvent.click(screen.getByRole("button", { name: "Confirm" }));

    await waitFor(() => {
      expect(onConfirm).toHaveBeenCalledTimes(1);
    });
  });

  it("shows loading state during confirmation", () => {
    const onConfirm = vi.fn().mockImplementation(() => new Promise(() => {}));
    render(<ConfirmModal {...defaultProps} onConfirm={onConfirm} />);

    fireEvent.click(screen.getByRole("button", { name: "Confirm" }));

    expect(screen.getByText("Please wait...")).toBeInTheDocument();
  });

  it("disables buttons during confirmation", () => {
    const onConfirm = vi.fn().mockImplementation(() => new Promise(() => {}));
    render(<ConfirmModal {...defaultProps} onConfirm={onConfirm} />);

    fireEvent.click(screen.getByRole("button", { name: "Confirm" }));

    expect(screen.getByRole("button", { name: "Cancel" })).toBeDisabled();
    expect(
      screen.getByRole("button", { name: "Please wait..." }),
    ).toBeDisabled();
  });

  it("shows error message on failure", async () => {
    const onConfirm = vi.fn().mockRejectedValue(new Error("Delete failed"));
    render(<ConfirmModal {...defaultProps} onConfirm={onConfirm} />);

    fireEvent.click(screen.getByRole("button", { name: "Confirm" }));

    await waitFor(() => {
      expect(screen.getByText("Delete failed")).toBeInTheDocument();
    });
  });

  it("applies destructive styling when isDestructive is true", () => {
    const { container } = render(
      <ConfirmModal {...defaultProps} isDestructive />,
    );

    expect(
      container.querySelector(".confirm-modal__button--destructive"),
    ).toBeInTheDocument();
  });

  it("calls onCancel when backdrop clicked", () => {
    const onCancel = vi.fn();
    render(<ConfirmModal {...defaultProps} onCancel={onCancel} />);

    fireEvent.click(screen.getByRole("dialog"));

    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("does not close when modal content clicked", () => {
    const onCancel = vi.fn();
    render(<ConfirmModal {...defaultProps} onCancel={onCancel} />);

    fireEvent.click(screen.getByText("Confirm Action"));

    expect(onCancel).not.toHaveBeenCalled();
  });
});
