import { describe, it, expect, vi, beforeEach } from "vitest"

const mockPost = vi.fn()
const mockGet = vi.fn()

vi.mock("./api", () => ({
  default: {
    post: (...args) => mockPost(...args),
    get: (...args) => mockGet(...args),
  },
}))

import {
  registerUser,
  loginUser,
  getProfile,
  initiatePasswordReset,
  resetPassword,
} from "./auth"

describe("auth api module", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("calls register endpoint", () => {
    const payload = { username: "marie" }
    registerUser(payload)
    expect(mockPost).toHaveBeenCalledWith("/auth/register", payload)
  })

  it("calls login endpoint", () => {
    const payload = { username: "marie", password: "pw" }
    loginUser(payload)
    expect(mockPost).toHaveBeenCalledWith("/auth/login", payload)
  })

  it("calls profile endpoint", () => {
    getProfile()
    expect(mockGet).toHaveBeenCalledWith("/auth/profile")
  })

  it("calls initiate reset endpoint with query param", () => {
    initiatePasswordReset("a@example.com")
    expect(mockPost).toHaveBeenCalledWith("/auth/reset-password/initiate", null, {
      params: { email: "a@example.com" },
    })
  })

  it("calls reset password endpoint", () => {
    const payload = { token: "abc", newPassword: "Pass1234" }
    resetPassword(payload)
    expect(mockPost).toHaveBeenCalledWith("/auth/reset-password", payload)
  })
})
