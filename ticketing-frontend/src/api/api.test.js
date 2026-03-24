import { beforeEach, describe, expect, it, vi } from "vitest"

const createSpy = vi.fn()
const useSpy = vi.fn()

vi.mock("axios", () => ({
  default: {
    create: (...args) => createSpy(...args),
  },
}))

describe("api client", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
    localStorage.clear()
  })

  it("configures axios with VITE_API_BASE", async () => {
    const apiInstance = {
      interceptors: { request: { use: useSpy } },
    }
    createSpy.mockReturnValue(apiInstance)

    await import("./api")

    const expectedBaseUrl = import.meta.env?.VITE_API_BASE || undefined
    expect(createSpy).toHaveBeenCalledWith({ baseURL: expectedBaseUrl })
    expect(useSpy).toHaveBeenCalledTimes(1)
  })

  it("attaches auth token and removes content-type for FormData", async () => {
    const apiInstance = {
      interceptors: { request: { use: useSpy } },
    }
    createSpy.mockReturnValue(apiInstance)

    await import("./api")

    const interceptor = useSpy.mock.calls[0][0]
    localStorage.setItem("access_token", "abc")

    const cfg = {
      data: new FormData(),
      headers: { "Content-Type": "application/json" },
    }

    const next = interceptor(cfg)

    expect(next.headers.Authorization).toBe("Bearer abc")
    expect(next.headers["Content-Type"]).toBeUndefined()
  })

  it("leaves Authorization unset when no token", async () => {
    const apiInstance = {
      interceptors: { request: { use: useSpy } },
    }
    createSpy.mockReturnValue(apiInstance)

    await import("./api")

    const interceptor = useSpy.mock.calls[0][0]
    const cfg = { data: { hello: "world" }, headers: {} }

    const next = interceptor(cfg)

    expect(next.headers.Authorization).toBeUndefined()
  })
})
