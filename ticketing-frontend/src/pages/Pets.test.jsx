import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import Pets from "./Pets"

const mockCreatePet = vi.fn()
const mockDeletePet = vi.fn()
const mockGetAllPets = vi.fn()
const mockGetMyPets = vi.fn()
const mockUpdatePet = vi.fn()

vi.mock("../api/pets", () => ({
  createPet: (...args) => mockCreatePet(...args),
  deletePet: (...args) => mockDeletePet(...args),
  getAllPets: (...args) => mockGetAllPets(...args),
  getMyPets: (...args) => mockGetMyPets(...args),
  updatePet: (...args) => mockUpdatePet(...args),
}))

describe("Pets page", () => {
  const getInputByName = (name) => {
    const el = document.querySelector(`input[name="${name}"]`)
    expect(el).toBeTruthy()
    return el
  }

  beforeEach(() => {
    vi.clearAllMocks()
    globalThis.confirm = vi.fn(() => true)

    mockGetAllPets.mockResolvedValue({
      data: [{ id: 1, name: "Kiki", species: "Cat", age: 2 }],
    })
    mockGetMyPets.mockResolvedValue({
      data: [{ id: 1, name: "Kiki", species: "Cat", age: 2 }],
    })
  })

  it("loads and renders pets", async () => {
    render(<Pets />)

    expect(await screen.findByRole("heading", { name: "All Pets" })).toBeInTheDocument()
    expect(screen.getAllByText("Kiki").length).toBeGreaterThan(0)
  })

  it("creates a pet", async () => {
    mockCreatePet.mockResolvedValue({})

    render(<Pets />)

    fireEvent.change(getInputByName("name"), {
      target: { value: "Rex" },
    })
    fireEvent.change(getInputByName("species"), {
      target: { value: "Dog" },
    })
    fireEvent.click(screen.getByRole("button", { name: "Create" }))

    await waitFor(() => {
      expect(mockCreatePet).toHaveBeenCalled()
    })
  })

  it("edits and deletes a pet", async () => {
    mockUpdatePet.mockResolvedValue({})
    mockDeletePet.mockResolvedValue({})

    render(<Pets />)

    fireEvent.click(await screen.findByRole("button", { name: "Edit" }))

    fireEvent.change(screen.getByDisplayValue("Kiki"), {
      target: { value: "Kiki Updated" },
    })
    fireEvent.click(screen.getByRole("button", { name: "Update" }))

    await waitFor(() => {
      expect(mockUpdatePet).toHaveBeenCalled()
    })

    fireEvent.click(screen.getByRole("button", { name: "Delete" }))

    await waitFor(() => {
      expect(mockDeletePet).toHaveBeenCalledWith(1)
    })
  })

  it("shows load error when pets request fails", async () => {
    mockGetAllPets.mockRejectedValue({
      response: { status: 500, data: "Oops" },
    })
    mockGetMyPets.mockRejectedValue({
      response: { status: 500, data: "Oops" },
    })

    render(<Pets />)

    expect(await screen.findByText(/Failed to load pets: 500 - Oops/i)).toBeInTheDocument()
  })

  it("does not delete when confirmation is cancelled", async () => {
    globalThis.confirm = vi.fn(() => false)

    render(<Pets />)

    fireEvent.click(await screen.findByRole("button", { name: "Delete" }))

    expect(mockDeletePet).not.toHaveBeenCalled()
  })

  it("shows empty list states", async () => {
    mockGetAllPets.mockResolvedValue({ data: [] })
    mockGetMyPets.mockResolvedValue({ data: [] })

    render(<Pets />)

    expect(await screen.findByText("You do not have any pets yet.")).toBeInTheDocument()
    expect(screen.getByText("No pets available.")).toBeInTheDocument()
  })
})
