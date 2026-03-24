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

  it("filters pet cards by selected species tag", async () => {
    mockGetAllPets.mockResolvedValue({
      data: [
        { id: 1, name: "Kiki", species: "Cat", breed: "Siamese" },
        { id: 2, name: "Rex", species: "Dog", breed: "Labrador" },
      ],
    })

    render(<Home />)

    expect(await screen.findByText("Kiki")).toBeInTheDocument()
    expect(screen.getByText("Rex")).toBeInTheDocument()

    fireEvent.click(screen.getByRole("button", { name: "Cat" }))

    expect(screen.getByText("Kiki")).toBeInTheDocument()
    expect(screen.queryByText("Rex")).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole("button", { name: "All" }))

    expect(screen.getByText("Rex")).toBeInTheDocument()
  })

  it("sorts pets by created date with newest first", async () => {
    mockGetAllPets.mockResolvedValue({
      data: [
        { id: 1, name: "Older", species: "Cat", createdAt: "2025-01-01T00:00:00Z" },
        { id: 2, name: "Newer", species: "Dog", createdAt: "2025-03-01T00:00:00Z" },
      ],
    })

    render(<Home />)

    await screen.findByText("Older")

    const cards = document.querySelectorAll(".pet-card h3")
    expect(cards[0]?.textContent).toBe("Newer")
    expect(cards[1]?.textContent).toBe("Older")

    fireEvent.change(screen.getByLabelText("Sort"), {
      target: { value: "oldest" },
    })

    const sortedCards = document.querySelectorAll(".pet-card h3")
    expect(sortedCards[0]?.textContent).toBe("Older")
    expect(sortedCards[1]?.textContent).toBe("Newer")
  })

  it("still reorders when created date is missing by falling back to id", async () => {
    mockGetAllPets.mockResolvedValue({
      data: [
        { id: 1, name: "Alpha", species: "Cat" },
        { id: 3, name: "Gamma", species: "Dog" },
        { id: 2, name: "Beta", species: "Dog" },
      ],
    })

    render(<Home />)

    await screen.findByText("Alpha")

    const cards = document.querySelectorAll(".pet-card h3")
    expect(cards[0]?.textContent).toBe("Gamma")
    expect(cards[1]?.textContent).toBe("Beta")
    expect(cards[2]?.textContent).toBe("Alpha")

    fireEvent.change(screen.getByLabelText("Sort"), {
      target: { value: "oldest" },
    })

    const oldestFirstCards = document.querySelectorAll(".pet-card h3")
    expect(oldestFirstCards[0]?.textContent).toBe("Alpha")
    expect(oldestFirstCards[1]?.textContent).toBe("Beta")
    expect(oldestFirstCards[2]?.textContent).toBe("Gamma")
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
