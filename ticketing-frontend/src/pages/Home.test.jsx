import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react"
import Home from "./Home"

const mockGetAllPets = vi.fn()
const mockGetPetById = vi.fn()
const mockAddPetToFavorites = vi.fn()
const mockRemovePetFromFavorites = vi.fn()

vi.mock("../api/pets", () => ({
  getAllPets: (...args) => mockGetAllPets(...args),
  getPetById: (...args) => mockGetPetById(...args),
  addPetToFavorites: (...args) => mockAddPetToFavorites(...args),
  removePetFromFavorites: (...args) => mockRemovePetFromFavorites(...args),
}))

describe("Home page", () => {
  const petCards = () => document.querySelectorAll(".pet-card h3")

  const petGrid = () => {
    const grid = document.querySelector(".pet-card-grid")
    expect(grid).toBeTruthy()
    return grid
  }

  const expectPetVisibleInGrid = (name) => {
    expect(within(petGrid()).getByText(name)).toBeInTheDocument()
  }

  const expectPetHiddenInGrid = (name) => {
    expect(within(petGrid()).queryByText(name)).not.toBeInTheDocument()
  }

  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  it("shows login hint and pet cards for logged out users", async () => {
    mockGetAllPets.mockResolvedValue({
      data: [{ id: 1, name: "Kiki", species: "Cat" }],
    })

    render(<Home />)

    await waitFor(() => {
      expect(petCards().length).toBeGreaterThan(0)
    })
    expectPetVisibleInGrid("Kiki")
    expect(screen.getByText(/Log in to click a pet/i)).toBeInTheDocument()
  })

  it("does not request detail when logged out card is clicked", async () => {
    mockGetAllPets.mockResolvedValue({
      data: [{ id: 1, name: "Kiki", species: "Cat" }],
    })

    render(<Home />)

    await waitFor(() => {
      expect(petCards().length).toBeGreaterThan(0)
    })
    fireEvent.click(within(petGrid()).getByText("Kiki"))
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

  it("toggles favorites for logged-in users", async () => {
    localStorage.setItem("access_token", "token")
    mockGetAllPets.mockResolvedValue({
      data: [{ id: 2, name: "Rex", species: "Dog", isFavorited: false }],
    })
    mockAddPetToFavorites.mockResolvedValue({})
    mockRemovePetFromFavorites.mockResolvedValue({})

    render(<Home />)

    const addBtn = await screen.findByRole("button", { name: "Add to favorites" })
    fireEvent.click(addBtn)

    await waitFor(() => {
      expect(mockAddPetToFavorites).toHaveBeenCalledWith(2)
    })

    const removeBtn = await screen.findByRole("button", { name: "Remove from favorites" })
    fireEvent.click(removeBtn)

    await waitFor(() => {
      expect(mockRemovePetFromFavorites).toHaveBeenCalledWith(2)
    })
  })

  it("rolls back favorite state and shows error when add favorite fails", async () => {
    localStorage.setItem("access_token", "token")
    mockGetAllPets.mockResolvedValue({
      data: [{ id: 2, name: "Rex", species: "Dog", isFavorited: false, favoriteCount: 2 }],
    })
    mockAddPetToFavorites.mockRejectedValue({
      response: { status: 500, data: "Boom" },
    })

    render(<Home />)

    const addBtn = await screen.findByRole("button", { name: "Add to favorites" })
    fireEvent.click(addBtn)

    await waitFor(() => {
      expect(mockAddPetToFavorites).toHaveBeenCalledWith(2)
    })

    // Reverted back to not favorited after API failure.
    expect(await screen.findByRole("button", { name: "Add to favorites" })).toBeInTheDocument()
    expect(await screen.findByText(/Failed to update favorite: 500 - Boom/i)).toBeInTheDocument()
  })

  it("shows error and skips favorite API when selected pet has no id", async () => {
    localStorage.setItem("access_token", "token")
    mockGetAllPets.mockResolvedValue({
      data: [{ name: "Ghost", species: "Dog", isFavorited: false }],
    })

    render(<Home />)

    const addBtn = await screen.findByRole("button", { name: "Add to favorites" })
    fireEvent.click(addBtn)

    expect(mockAddPetToFavorites).not.toHaveBeenCalled()
    expect(mockRemovePetFromFavorites).not.toHaveBeenCalled()
    expect(await screen.findByText(/cannot be favorited/i)).toBeInTheDocument()
  })

  it("supports My Favorites filter for logged-in users", async () => {
    localStorage.setItem("access_token", "token")
    mockGetAllPets.mockResolvedValue({
      data: [
        { id: 1, name: "Kiki", species: "Cat", isFavorited: true },
        { id: 2, name: "Rex", species: "Dog", isFavorited: false },
      ],
    })

    render(<Home />)

    await waitFor(() => {
      expect(petCards().length).toBe(2)
    })
    expectPetVisibleInGrid("Kiki")
    expectPetVisibleInGrid("Rex")

    fireEvent.click(screen.getByRole("button", { name: "My Favourites" }))

    expectPetVisibleInGrid("Kiki")
    expectPetHiddenInGrid("Rex")
  })

  it("shows top 3 most favorited pets", async () => {
    mockGetAllPets.mockResolvedValue({
      data: [
        { id: 1, name: "Kiki", species: "Cat", favoriteCount: 5 },
        { id: 2, name: "Rex", species: "Dog", favoriteCount: 10 },
        { id: 3, name: "Milo", species: "Cat", favoriteCount: 8 },
        { id: 4, name: "Luna", species: "Dog", favoriteCount: 1 },
      ],
    })

    render(<Home />)

    const section = await screen.findByRole("heading", { name: /Most Favou?rited/i })
    const container = section.closest("section")
    expect(container).toBeInTheDocument()
    const items = within(container).getAllByRole("listitem")

    expect(items).toHaveLength(3)
    expect(items[0].textContent).toContain("Rex")
    expect(items[1].textContent).toContain("Milo")
    expect(items[2].textContent).toContain("Kiki")
    expect(within(container).queryByText(/Luna/i)).not.toBeInTheDocument()
  })

  it("supports favorite count field fallbacks when ranking most favorited", async () => {
    mockGetAllPets.mockResolvedValue({
      data: [
        { id: 1, name: "A", species: "Cat", favouritesCount: 11 },
        { id: 2, name: "B", species: "Dog", favoriteCount: 10 },
        { id: 3, name: "C", species: "Dog", favoritesCount: 9 },
        { id: 4, name: "D", species: "Cat", favouriteCount: 8 },
      ],
    })

    render(<Home />)

    const section = await screen.findByRole("heading", { name: /Most Favou?rited/i })
    const container = section.closest("section")
    expect(container).toBeInTheDocument()
    const items = within(container).getAllByRole("listitem")

    expect(items).toHaveLength(3)
    expect(items[0].textContent).toContain("A")
    expect(items[1].textContent).toContain("B")
    expect(items[2].textContent).toContain("C")
  })

  it("shows Most Favorited for logged-out users even when counts are zero", async () => {
    mockGetAllPets.mockResolvedValue({
      data: [
        { id: 1, name: "Kiki", species: "Cat", favoriteCount: 0 },
        { id: 2, name: "Rex", species: "Dog", favoriteCount: 0 },
        { id: 3, name: "Milo", species: "Cat", favoriteCount: 0 },
      ],
    })

    render(<Home />)

    const sectionHeading = await screen.findByRole("heading", { name: /Most Favou?rited/i })
    const container = sectionHeading.closest("section")
    expect(container).toBeInTheDocument()

    const items = within(container).getAllByRole("listitem")
    expect(items).toHaveLength(3)
    expect(items[0].textContent).toContain("Kiki")
    expect(items[1].textContent).toContain("Milo")
    expect(items[2].textContent).toContain("Rex")
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

    await waitFor(() => {
      expect(petCards().length).toBe(2)
    })
    expectPetVisibleInGrid("Kiki")
    expectPetVisibleInGrid("Rex")

    fireEvent.click(screen.getByRole("button", { name: "Cat" }))

    expectPetVisibleInGrid("Kiki")
    expectPetHiddenInGrid("Rex")

    fireEvent.click(screen.getByRole("button", { name: "All" }))

    expectPetVisibleInGrid("Rex")
  })

  it("sorts pets by created date with newest first", async () => {
    mockGetAllPets.mockResolvedValue({
      data: [
        { id: 1, name: "Older", species: "Cat", createdAt: "2025-01-01T00:00:00Z" },
        { id: 2, name: "Newer", species: "Dog", createdAt: "2025-03-01T00:00:00Z" },
      ],
    })

    render(<Home />)

    await waitFor(() => {
      expect(petCards().length).toBe(2)
    })

    const cards = petCards()
    expect(cards[0]?.textContent).toBe("Newer")
    expect(cards[1]?.textContent).toBe("Older")

    fireEvent.change(screen.getByLabelText("Sort"), {
      target: { value: "oldest" },
    })

    const sortedCards = petCards()
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

    await waitFor(() => {
      expect(petCards().length).toBe(3)
    })

    const cards = petCards()
    expect(cards[0]?.textContent).toBe("Gamma")
    expect(cards[1]?.textContent).toBe("Beta")
    expect(cards[2]?.textContent).toBe("Alpha")

    fireEvent.change(screen.getByLabelText("Sort"), {
      target: { value: "oldest" },
    })

    const oldestFirstCards = petCards()
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
