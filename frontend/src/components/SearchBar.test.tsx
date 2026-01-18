// ABOUTME: Tests for the SearchBar component
// ABOUTME: Verifies input handling, debouncing, and clear functionality

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { SearchBar } from "./SearchBar";

describe("SearchBar", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  it("renders with default placeholder", () => {
    render(<SearchBar onSearch={vi.fn()} />);

    expect(
      screen.getByPlaceholderText(
        "Search by subject, professor, or location...",
      ),
    ).toBeInTheDocument();
  });

  it("renders with custom placeholder", () => {
    render(<SearchBar onSearch={vi.fn()} placeholder="Find groups..." />);

    expect(screen.getByPlaceholderText("Find groups...")).toBeInTheDocument();
  });

  it("has accessible label", () => {
    render(<SearchBar onSearch={vi.fn()} />);

    expect(
      screen.getByRole("textbox", { name: /search/i }),
    ).toBeInTheDocument();
  });

  it("updates input value on change", () => {
    render(<SearchBar onSearch={vi.fn()} />);

    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "calculus" } });

    expect(input).toHaveValue("calculus");
  });

  it("calls onSearch after debounce delay", () => {
    const onSearch = vi.fn();
    render(<SearchBar onSearch={onSearch} />);

    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "physics" } });

    expect(onSearch).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(onSearch).toHaveBeenCalledWith("physics");
  });

  it("debounces multiple rapid inputs", () => {
    const onSearch = vi.fn();
    render(<SearchBar onSearch={onSearch} />);

    const input = screen.getByRole("textbox");

    fireEvent.change(input, { target: { value: "c" } });
    act(() => {
      vi.advanceTimersByTime(100);
    });

    fireEvent.change(input, { target: { value: "ca" } });
    act(() => {
      vi.advanceTimersByTime(100);
    });

    fireEvent.change(input, { target: { value: "cal" } });
    act(() => {
      vi.advanceTimersByTime(100);
    });

    fireEvent.change(input, { target: { value: "calc" } });
    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(onSearch).toHaveBeenCalledTimes(1);
    expect(onSearch).toHaveBeenCalledWith("calc");
  });

  it("shows clear button when input has value", () => {
    render(<SearchBar onSearch={vi.fn()} />);

    const input = screen.getByRole("textbox");

    expect(
      screen.queryByRole("button", { name: /clear/i }),
    ).not.toBeInTheDocument();

    fireEvent.change(input, { target: { value: "test" } });

    expect(screen.getByRole("button", { name: /clear/i })).toBeInTheDocument();
  });

  it("clears input when clear button clicked", () => {
    const onSearch = vi.fn();
    render(<SearchBar onSearch={onSearch} />);

    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "search term" } });

    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(onSearch).toHaveBeenCalledWith("search term");
    onSearch.mockClear();

    const clearButton = screen.getByRole("button", { name: /clear/i });
    fireEvent.click(clearButton);

    expect(input).toHaveValue("");

    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(onSearch).toHaveBeenCalledWith("");
  });

  it("hides clear button when input is empty", () => {
    render(<SearchBar onSearch={vi.fn()} />);

    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "test" } });

    expect(screen.getByRole("button", { name: /clear/i })).toBeInTheDocument();

    fireEvent.change(input, { target: { value: "" } });

    expect(
      screen.queryByRole("button", { name: /clear/i }),
    ).not.toBeInTheDocument();
  });

  it("contains search icon", () => {
    const { container } = render(<SearchBar onSearch={vi.fn()} />);

    expect(container.querySelector(".search-bar__icon")).toBeInTheDocument();
  });
});
