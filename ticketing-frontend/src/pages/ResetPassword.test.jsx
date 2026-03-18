import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import ResetPassword from "./ResetPassword"

const mockNavigate = vi.fn()
const mockResetPassword = vi.fn()

vi.mock("../api/auth", () => ({
  resetPassword: (...args) => mockResetPassword(...args),
}))

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom")
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

const renderPage = (path = "/reset-password") => {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <ResetPassword />
    </MemoryRouter>
  )
}

describe("ResetPassword page", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("shows only password fields", () => {
    renderPage("/reset-password?token=abc&email=user@example.com&username=marie")

    expect(screen.getByPlaceholderText("New password")).toBeInTheDocument()
    expect(screen.getByPlaceholderText("Confirm new password")).toBeInTheDocument()
    expect(screen.queryByPlaceholderText("Token")).not.toBeInTheDocument()
    expect(screen.queryByPlaceholderText("Email (optional)")).not.toBeInTheDocument()
    expect(screen.queryByPlaceholderText("Username (optional)")).not.toBeInTheDocument()
  })

  it("shows mismatch error and does not submit", async () => {
    renderPage("/reset-password?token=abc")

    fireEvent.change(screen.getByPlaceholderText("New password"), {
      target: { value: "Pass1234" },
    })
    fireEvent.change(screen.getByPlaceholderText("Confirm new password"), {
      target: { value: "Different1234" },
    })
    fireEvent.click(screen.getByRole("button", { name: "Reset Password" }))

    expect(await screen.findByText(/Passwords do not match/i)).toBeInTheDocument()
    expect(mockResetPassword).not.toHaveBeenCalled()
  })

  it("shows missing token error and does not submit", async () => {
    renderPage("/reset-password")

    fireEvent.change(screen.getByPlaceholderText("New password"), {
      target: { value: "Pass1234" },
    })
    fireEvent.change(screen.getByPlaceholderText("Confirm new password"), {
      target: { value: "Pass1234" },
    })
    fireEvent.click(screen.getByRole("button", { name: "Reset Password" }))

    expect(await screen.findByText(/missing token/i)).toBeInTheDocument()
    expect(mockResetPassword).not.toHaveBeenCalled()
  })

  it("submits payload with token and URL context", async () => {
    mockResetPassword.mockResolvedValue({})

    renderPage("/reset-password?token=abc123&email=user@example.com&username=marie")

    fireEvent.change(screen.getByPlaceholderText("New password"), {
      target: { value: "Pass1234" },
    })
    fireEvent.change(screen.getByPlaceholderText("Confirm new password"), {
      target: { value: "Pass1234" },
    })
    fireEvent.click(screen.getByRole("button", { name: "Reset Password" }))

    await waitFor(() => {
      expect(mockResetPassword).toHaveBeenCalledWith({
        token: "abc123",
        email: "user@example.com",
        username: "marie",
        newPassword: "Pass1234",
        confirmPassword: "Pass1234",
      })
    })

    expect(screen.getByText(/Password reset successful/i)).toBeInTheDocument()
  })
})
