import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react"
import Home from "./Home"

const mockGetAllPets = vi.fn()
const mockGetPetById = vi.fn()

vi.mock("../api/pets", () => ({
  getAllPets: (...args) => mockGetAllPets(...args),
  getPetById: (...args) => mockGetPetById(...args),
}))

describe("Home page", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  it("shows login hint and pet cards for logged out users", async () => {
    mockGetAllPets.mockResolvedValue({
      data: [{ id: 1, name: "Kiki", species: "Cat" }],
    })

    render(<Home />)

    expect(await screen.findByText("Kiki")).toBeInTheDocument()
    expect(screen.getByText(/Log in to click a pet/i)).toBeInTheDocument()
  })

  it("does not request detail when logged out card is clicked", async () => {
    mockGetAllPets.mockResolvedValue({
      data: [{ id: 1, name: "Kiki", species: "Cat" }],
    })

    render(<Home />)

    fireEvent.click(await screen.findByText("Kiki"))
    expect(mockGetPetById).not.toHaveBeenCalled()
  })

  it("shows pet detail for logged-in users when card is clicked", async () => {
    localStorage.setItem("access_token", "token")
    mockGetAllPets.mockResolvedValue({
      data: [{ id: 2, name: "Rex", species: "Dog" }],
    })
    mockGetPetById.mockResolvedValue({
      data: {
        id: 2,
        name: "Rex",
        species: "Dog",
        breed: "Labrador",
        age: 3,
        description: "Friendly",
      },
    })

    render(<Home />)

    fireEvent.click(await screen.findByRole("button", { name: /Rex/i }))

    await waitFor(() => {
      expect(mockGetPetById).toHaveBeenCalledWith(2)
    })

    expect(await screen.findByText(/Labrador/i)).toBeInTheDocument()
    expect(screen.getByText(/Friendly/i)).toBeInTheDocument()
  })

  it("shows error when initial pet load fails", async () => {
    mockGetAllPets.mockRejectedValue({
      response: { status: 404, data: "Not Found" },
    })

    render(<Home />)

    expect(await screen.findByText(/Failed to load pets: 404 - Not Found/i)).toBeInTheDocument()
  })

  it("shows empty state when no pets are returned", async () => {
    mockGetAllPets.mockResolvedValue({ data: [] })

    render(<Home />)

    expect(await screen.findByText("No pets available.")).toBeInTheDocument()
  })

  it("falls back to clicked pet when detail fetch fails", async () => {
    localStorage.setItem("access_token", "token")
    mockGetAllPets.mockResolvedValue({
      data: [{ id: 9, name: "Nala", species: "Cat" }],
    })
    mockGetPetById.mockRejectedValue({
      response: { status: 500, data: "Server error" },
    })

    render(<Home />)

    fireEvent.click(await screen.findByRole("button", { name: /Nala/i }))

    expect(await screen.findByText(/Failed to load pet profile: 500 - Server error/i)).toBeInTheDocument()
    const detailCard = screen.getByText("Pet Profile").closest(".info-card")
    expect(detailCard).toBeInTheDocument()
    expect(within(detailCard).getByText("Nala")).toBeInTheDocument()
  })

  it("shows detail when clicked pet has no id", async () => {
    localStorage.setItem("access_token", "token")
    mockGetAllPets.mockResolvedValue({
      data: [{ name: "Ghost", species: "Dog" }],
    })

    render(<Home />)

    fireEvent.click(await screen.findByRole("button", { name: /Ghost/i }))

    expect(mockGetPetById).not.toHaveBeenCalled()
    const detailCard = (await screen.findByText("Pet Profile")).closest(".info-card")
    expect(detailCard).toBeInTheDocument()
    expect(within(detailCard).getByText("Ghost")).toBeInTheDocument()
  })
})
