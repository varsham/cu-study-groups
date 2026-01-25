// ABOUTME: Tests for the LoginForm component
// ABOUTME: Verifies login form validation and OTP code submission

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { LoginForm } from "./LoginForm";

// Mock the useAuth hook
const mockSendOtpCode = vi.fn();
const mockVerifyOtpCode = vi.fn();

vi.mock("../contexts/AuthContext", () => ({
  useAuth: () => ({
    sendOtpCode: mockSendOtpCode,
    verifyOtpCode: mockVerifyOtpCode,
  }),
}));

describe("LoginForm", () => {
  beforeEach(() => {
    mockSendOtpCode.mockReset();
    mockVerifyOtpCode.mockReset();
    mockSendOtpCode.mockResolvedValue({ error: null });
    mockVerifyOtpCode.mockResolvedValue({ error: null });
  });

  describe("Email Step", () => {
    it("renders login form", () => {
      render(<LoginForm />);

      expect(screen.getByText("Organizer Login")).toBeInTheDocument();
      expect(screen.getByLabelText("Columbia Email")).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /send verification code/i }),
      ).toBeInTheDocument();
    });

    it("disables submit button when email is empty", () => {
      render(<LoginForm />);

      expect(
        screen.getByRole("button", { name: /send verification code/i }),
      ).toBeDisabled();
    });

    it("disables submit button with invalid email", () => {
      render(<LoginForm />);

      fireEvent.change(screen.getByLabelText("Columbia Email"), {
        target: { value: "test@gmail.com" },
      });

      expect(
        screen.getByRole("button", { name: /send verification code/i }),
      ).toBeDisabled();
    });

    it("enables submit button with valid Columbia email", () => {
      render(<LoginForm />);

      fireEvent.change(screen.getByLabelText("Columbia Email"), {
        target: { value: "test@columbia.edu" },
      });

      expect(
        screen.getByRole("button", { name: /send verification code/i }),
      ).not.toBeDisabled();
    });

    it("shows email error for invalid email", () => {
      render(<LoginForm />);

      fireEvent.change(screen.getByLabelText("Columbia Email"), {
        target: { value: "test@gmail.com" },
      });

      expect(
        screen.getByText("Please use your @columbia.edu or @barnard.edu email"),
      ).toBeInTheDocument();
    });

    it("accepts barnard.edu emails", () => {
      render(<LoginForm />);

      fireEvent.change(screen.getByLabelText("Columbia Email"), {
        target: { value: "test@barnard.edu" },
      });

      expect(
        screen.getByRole("button", { name: /send verification code/i }),
      ).not.toBeDisabled();
    });

    it("calls sendOtpCode on submit", async () => {
      render(<LoginForm />);

      fireEvent.change(screen.getByLabelText("Columbia Email"), {
        target: { value: "TEST@Columbia.EDU" },
      });
      fireEvent.click(
        screen.getByRole("button", { name: /send verification code/i }),
      );

      await waitFor(() => {
        expect(mockSendOtpCode).toHaveBeenCalledWith("test@columbia.edu");
      });
    });

    it("shows error message on send code failure", async () => {
      mockSendOtpCode.mockResolvedValue({
        error: new Error("Rate limit exceeded"),
      });
      render(<LoginForm />);

      fireEvent.change(screen.getByLabelText("Columbia Email"), {
        target: { value: "test@columbia.edu" },
      });
      fireEvent.click(
        screen.getByRole("button", { name: /send verification code/i }),
      );

      await waitFor(() => {
        expect(screen.getByText("Rate limit exceeded")).toBeInTheDocument();
      });
    });

    it("shows loading state during submission", async () => {
      mockSendOtpCode.mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(() => resolve({ error: null }), 100),
          ),
      );
      render(<LoginForm />);

      fireEvent.change(screen.getByLabelText("Columbia Email"), {
        target: { value: "test@columbia.edu" },
      });
      fireEvent.click(
        screen.getByRole("button", { name: /send verification code/i }),
      );

      expect(screen.getByText("Sending...")).toBeInTheDocument();
      expect(screen.getByLabelText("Columbia Email")).toBeDisabled();

      await waitFor(() => {
        expect(screen.getByText("Enter Verification Code")).toBeInTheDocument();
      });
    });

    it("disables 'Already have a code?' when email is invalid", () => {
      render(<LoginForm />);

      expect(screen.getByText("Already have a code?")).toBeDisabled();

      fireEvent.change(screen.getByLabelText("Columbia Email"), {
        target: { value: "test@gmail.com" },
      });

      expect(screen.getByText("Already have a code?")).toBeDisabled();
    });

    it("allows skipping to code entry with valid email", () => {
      render(<LoginForm />);

      fireEvent.change(screen.getByLabelText("Columbia Email"), {
        target: { value: "test@columbia.edu" },
      });

      expect(screen.getByText("Already have a code?")).not.toBeDisabled();

      fireEvent.click(screen.getByText("Already have a code?"));

      expect(screen.getByText("Enter Verification Code")).toBeInTheDocument();
      expect(screen.getByLabelText("Verification Code")).toBeInTheDocument();
      expect(mockSendOtpCode).not.toHaveBeenCalled();
    });
  });

  describe("Code Step", () => {
    async function goToCodeStep() {
      render(<LoginForm />);

      fireEvent.change(screen.getByLabelText("Columbia Email"), {
        target: { value: "test@columbia.edu" },
      });
      fireEvent.click(
        screen.getByRole("button", { name: /send verification code/i }),
      );

      await waitFor(() => {
        expect(screen.getByText("Enter Verification Code")).toBeInTheDocument();
      });
    }

    it("shows code input after sending email", async () => {
      await goToCodeStep();

      expect(screen.getByLabelText("Verification Code")).toBeInTheDocument();
      expect(screen.getByText(/test@columbia.edu/)).toBeInTheDocument();
    });

    it("disables verify button when code is empty", async () => {
      await goToCodeStep();

      expect(
        screen.getByRole("button", { name: /verify code/i }),
      ).toBeDisabled();
    });

    it("disables verify button with invalid code format", async () => {
      await goToCodeStep();

      fireEvent.change(screen.getByLabelText("Verification Code"), {
        target: { value: "1234567" },
      });

      expect(
        screen.getByRole("button", { name: /verify code/i }),
      ).toBeDisabled();
    });

    it("enables verify button with valid 8-digit code", async () => {
      await goToCodeStep();

      fireEvent.change(screen.getByLabelText("Verification Code"), {
        target: { value: "12345678" },
      });

      expect(
        screen.getByRole("button", { name: /verify code/i }),
      ).not.toBeDisabled();
    });

    it("only accepts numeric input", async () => {
      await goToCodeStep();

      const input = screen.getByLabelText("Verification Code");
      fireEvent.change(input, {
        target: { value: "12ab56" },
      });

      expect(input).toHaveValue("1256");
    });

    it("calls verifyOtpCode on submit", async () => {
      await goToCodeStep();

      fireEvent.change(screen.getByLabelText("Verification Code"), {
        target: { value: "12345678" },
      });
      fireEvent.click(screen.getByRole("button", { name: /verify code/i }));

      await waitFor(() => {
        expect(mockVerifyOtpCode).toHaveBeenCalledWith(
          "test@columbia.edu",
          "12345678",
        );
      });
    });

    it("calls onSuccess callback after successful verification", async () => {
      const onSuccess = vi.fn();
      render(<LoginForm onSuccess={onSuccess} />);

      fireEvent.change(screen.getByLabelText("Columbia Email"), {
        target: { value: "test@columbia.edu" },
      });
      fireEvent.click(
        screen.getByRole("button", { name: /send verification code/i }),
      );

      await waitFor(() => {
        expect(screen.getByText("Enter Verification Code")).toBeInTheDocument();
      });

      fireEvent.change(screen.getByLabelText("Verification Code"), {
        target: { value: "12345678" },
      });
      fireEvent.click(screen.getByRole("button", { name: /verify code/i }));

      await waitFor(() => {
        expect(onSuccess).toHaveBeenCalledTimes(1);
      });
    });

    it("auto-resends code on verification failure", async () => {
      mockVerifyOtpCode.mockResolvedValue({
        error: new Error("Invalid token"),
      });

      await goToCodeStep();
      mockSendOtpCode.mockClear();

      fireEvent.change(screen.getByLabelText("Verification Code"), {
        target: { value: "12345678" },
      });
      fireEvent.click(screen.getByRole("button", { name: /verify code/i }));

      await waitFor(() => {
        expect(mockSendOtpCode).toHaveBeenCalledWith("test@columbia.edu");
        expect(
          screen.getByText(
            "Code invalid or already used. We've sent a new code to your email.",
          ),
        ).toBeInTheDocument();
      });
    });

    it("clears code input on verification failure", async () => {
      mockVerifyOtpCode.mockResolvedValue({
        error: new Error("Invalid token"),
      });

      await goToCodeStep();

      const input = screen.getByLabelText("Verification Code");
      fireEvent.change(input, {
        target: { value: "12345678" },
      });
      fireEvent.click(screen.getByRole("button", { name: /verify code/i }));

      await waitFor(() => {
        expect(input).toHaveValue("");
      });
    });

    it("allows resending code manually", async () => {
      await goToCodeStep();
      mockSendOtpCode.mockClear();

      fireEvent.click(screen.getByText("Resend code"));

      await waitFor(() => {
        expect(mockSendOtpCode).toHaveBeenCalledWith("test@columbia.edu");
        expect(
          screen.getByText("New code sent to your email."),
        ).toBeInTheDocument();
      });
    });

    it("allows going back to email step", async () => {
      await goToCodeStep();

      fireEvent.click(screen.getByText("Use different email"));

      expect(screen.getByText("Organizer Login")).toBeInTheDocument();
      expect(screen.getByLabelText("Columbia Email")).toBeInTheDocument();
    });

    it("shows loading state during verification", async () => {
      mockVerifyOtpCode.mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(() => resolve({ error: null }), 100),
          ),
      );

      await goToCodeStep();

      fireEvent.change(screen.getByLabelText("Verification Code"), {
        target: { value: "12345678" },
      });
      fireEvent.click(screen.getByRole("button", { name: /verify code/i }));

      expect(screen.getByText("Verifying...")).toBeInTheDocument();
      expect(screen.getByLabelText("Verification Code")).toBeDisabled();
    });
  });
});
