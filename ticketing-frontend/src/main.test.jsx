import { describe, it, expect, vi, beforeEach } from "vitest"

const renderSpy = vi.fn()
const createRootSpy = vi.fn(() => ({ render: renderSpy }))

vi.mock("react-dom/client", () => ({
  default: {
    createRoot: (...args) => createRootSpy(...args),
  },
}))

vi.mock("react-router-dom", () => ({
  BrowserRouter: ({ children }) => children,
}))

vi.mock("./App", () => ({
  default: () => null,
}))

describe("main bootstrap", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
    document.body.innerHTML = '<div id="root"></div>'
  })

  it("creates react root and renders app", async () => {
    await import("./main.jsx")

    const rootEl = document.getElementById("root")
    expect(createRootSpy).toHaveBeenCalledWith(rootEl)
    expect(renderSpy).toHaveBeenCalledTimes(1)
  })
})
