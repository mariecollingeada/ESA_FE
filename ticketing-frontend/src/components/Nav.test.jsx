import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import Nav from "./Nav"

const mockNavigate = vi.fn()

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom")
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

describe("Nav", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  it("shows login/register links when logged out", () => {
    render(
      <MemoryRouter>
        <Nav />
      </MemoryRouter>
    )

    expect(screen.getByRole("link", { name: "Home" })).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "Register" })).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "Login" })).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Logout" })).not.toBeInTheDocument()
  })

  it("shows profile/logout when logged in and logs out", () => {
    localStorage.setItem("access_token", "token")
    localStorage.setItem("refresh_token", "refresh")
    localStorage.setItem("me", "{\"username\":\"marie\"}")

    render(
      <MemoryRouter>
        <Nav />
      </MemoryRouter>
    )

    expect(screen.getByRole("link", { name: "Profile" })).toBeInTheDocument()

    fireEvent.click(screen.getByRole("button", { name: "Logout" }))

    expect(localStorage.getItem("access_token")).toBeNull()
    expect(localStorage.getItem("refresh_token")).toBeNull()
    expect(localStorage.getItem("me")).toBeNull()
    expect(mockNavigate).toHaveBeenCalledWith("/login")
  })
})
