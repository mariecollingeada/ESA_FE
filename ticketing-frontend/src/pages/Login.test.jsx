import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import Login from "./Login"

const mockNavigate = vi.fn()
const mockLoginUser = vi.fn()
const mockGetProfile = vi.fn()
const mockInitiateReset = vi.fn()

vi.mock("../api/auth", () => ({
  loginUser: (...args) => mockLoginUser(...args),
  getProfile: (...args) => mockGetProfile(...args),
  initiatePasswordReset: (...args) => mockInitiateReset(...args),
}))

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom")
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

describe("Login page", () => {
  const getInputByName = (name) => {
    const el = document.querySelector(`input[name="${name}"]`)
    expect(el).toBeTruthy()
    return el
  }

  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  it("logs in, stores tokens/profile, and navigates", async () => {
    mockLoginUser.mockResolvedValue({
      data: { accessToken: "abc", refreshToken: "ref" },
    })
    mockGetProfile.mockResolvedValue({
      data: { username: "marie", email: "marie@example.com" },
    })

    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    )

    fireEvent.change(getInputByName("username"), {
      target: { value: "marie" },
    })
    fireEvent.change(getInputByName("password"), {
      target: { value: "Pass1234" },
    })
    fireEvent.click(screen.getByRole("button", { name: "Login" }))

    await waitFor(() => {
      expect(mockLoginUser).toHaveBeenCalledWith({
        username: "marie",
        password: "Pass1234",
      })
    })

    expect(localStorage.getItem("access_token")).toBe("abc")
    expect(localStorage.getItem("refresh_token")).toBe("ref")
    expect(localStorage.getItem("me")).toContain("marie")
    expect(mockNavigate).toHaveBeenCalledWith("/profile")
  })

  it("shows error when login response has no token", async () => {
    mockLoginUser.mockResolvedValue({ data: "" })

    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    )

    fireEvent.change(getInputByName("username"), {
      target: { value: "marie" },
    })
    fireEvent.change(getInputByName("password"), {
      target: { value: "Pass1234" },
    })
    fireEvent.click(screen.getByRole("button", { name: "Login" }))

    expect(await screen.findByText(/No access token returned from login/i)).toBeInTheDocument()
  })

  it("supports forgot password and shows success message", async () => {
    const promptSpy = vi.fn(() => "marie@example.com")
    globalThis.prompt = promptSpy
    mockInitiateReset.mockResolvedValue({})

    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    )

    fireEvent.click(screen.getByRole("button", { name: "Forgot password?" }))

    await waitFor(() => {
      expect(mockInitiateReset).toHaveBeenCalledWith("marie@example.com")
    })

    expect(screen.getByText(/reset link has been sent/i)).toBeInTheDocument()
  })
})
