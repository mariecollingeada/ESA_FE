import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import Register from "./Register"

const mockNavigate = vi.fn()
const mockRegisterUser = vi.fn()

vi.mock("../api/auth", () => ({
  registerUser: (...args) => mockRegisterUser(...args),
}))

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom")
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

describe("Register page", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("submits registration payload and navigates on success", async () => {
    const alertSpy = vi.fn()
    globalThis.alert = alertSpy
    mockRegisterUser.mockResolvedValue({})

    render(
      <MemoryRouter>
        <Register />
      </MemoryRouter>
    )

    fireEvent.change(screen.getByPlaceholderText("Username"), {
      target: { value: "marie" },
    })
    fireEvent.change(screen.getByPlaceholderText("Email"), {
      target: { value: "marie@example.com" },
    })
    fireEvent.change(screen.getByPlaceholderText("Password"), {
      target: { value: "Pass1234" },
    })
    fireEvent.change(screen.getByPlaceholderText("Confirm Password"), {
      target: { value: "Pass1234" },
    })

    fireEvent.click(screen.getByRole("button", { name: "Register" }))

    await waitFor(() => {
      expect(mockRegisterUser).toHaveBeenCalledWith({
        username: "marie",
        email: "marie@example.com",
        password: "Pass1234",
        confirmPassword: "Pass1234",
      })
    })

    expect(alertSpy).toHaveBeenCalledWith("Registration successful")
    expect(mockNavigate).toHaveBeenCalledWith("/login")
  })

  it("shows API error on failed registration", async () => {
    mockRegisterUser.mockRejectedValue({
      response: { data: { message: "Email taken" } },
    })

    render(
      <MemoryRouter>
        <Register />
      </MemoryRouter>
    )

    fireEvent.change(screen.getByPlaceholderText("Username"), {
      target: { value: "marie" },
    })
    fireEvent.change(screen.getByPlaceholderText("Email"), {
      target: { value: "marie@example.com" },
    })
    fireEvent.change(screen.getByPlaceholderText("Password"), {
      target: { value: "Pass1234" },
    })
    fireEvent.change(screen.getByPlaceholderText("Confirm Password"), {
      target: { value: "Pass1234" },
    })

    fireEvent.click(screen.getByRole("button", { name: "Register" }))

    expect(await screen.findByText(/Email taken/i)).toBeInTheDocument()
  })
})
