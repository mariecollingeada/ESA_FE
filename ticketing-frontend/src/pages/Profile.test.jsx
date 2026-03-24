import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import Profile from "./Profile"

const mockCreatePet = vi.fn()
const mockDeletePet = vi.fn()
const mockGetMyPets = vi.fn()
const mockGetPetById = vi.fn()
const mockUploadPetImage = vi.fn()
const mockUpdatePet = vi.fn()

vi.mock("../api/pets", () => ({
  createPet: (...args) => mockCreatePet(...args),
  deletePet: (...args) => mockDeletePet(...args),
  getMyPets: (...args) => mockGetMyPets(...args),
  getPetById: (...args) => mockGetPetById(...args),
  uploadPetImage: (...args) => mockUploadPetImage(...args),
  updatePet: (...args) => mockUpdatePet(...args),
}))

describe("Profile page", () => {
  const getInputByName = (name) => {
    const el = document.querySelector(
      `input[name="${name}"], select[name="${name}"], textarea[name="${name}"]`
    )
    expect(el).toBeTruthy()
    return el
  }

  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    localStorage.setItem("access_token", "token")
    localStorage.setItem(
      "me",
      JSON.stringify({ username: "marie", email: "m@example.com", role: "USER" })
    )
    globalThis.confirm = vi.fn(() => true)
  })

  it("renders my profile tab details", () => {
    render(<Profile />)

    expect(screen.getByRole("tab", { name: "My Profile" })).toBeInTheDocument()
    expect(screen.getByText(/Username:/i)).toBeInTheDocument()
    expect(screen.getByText(/marie/i)).toBeInTheDocument()
  })

  it("loads pets in My Pets tab and allows adding a pet", async () => {
    mockGetMyPets.mockResolvedValue({
      data: [{ id: 1, name: "Kiki", species: "Cat", breed: "Siamese" }],
    })
    mockCreatePet.mockResolvedValue({})

    render(<Profile />)

    fireEvent.click(screen.getByRole("tab", { name: "My Pets" }))

    expect(await screen.findByText("Kiki")).toBeInTheDocument()

    fireEvent.change(getInputByName("Name"), {
      target: { value: "Rex" },
    })
    fireEvent.change(getInputByName("Species"), {
      target: { value: "Dog" },
    })
    fireEvent.click(screen.getByRole("button", { name: "Add Pet" }))

    await waitFor(() => {
      expect(mockCreatePet).toHaveBeenCalled()
    })
  })

  it("selects a pet, loads details, and deletes pet", async () => {
    mockGetMyPets.mockResolvedValue({
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
    mockDeletePet.mockResolvedValue({})

    render(<Profile />)

    fireEvent.click(screen.getByRole("tab", { name: "My Pets" }))

    fireEvent.click(await screen.findByRole("button", { name: /Rex/i }))

    expect(await screen.findByText(/Labrador/i)).toBeInTheDocument()

    fireEvent.click(screen.getByRole("button", { name: "Delete Pet" }))

    await waitFor(() => {
      expect(mockDeletePet).toHaveBeenCalledWith(2)
    })
  })

  it("shows error when loading my pets fails", async () => {
    mockGetMyPets.mockRejectedValue({
      response: { status: 500, data: "Oops" },
    })

    render(<Profile />)

    fireEvent.click(screen.getByRole("tab", { name: "My Pets" }))

    expect(await screen.findByText(/Failed to load your pets: 500 - Oops/i)).toBeInTheDocument()
  })

  it("falls back to clicked pet when detail fetch fails", async () => {
    mockGetMyPets.mockResolvedValue({
      data: [{ id: 3, name: "Milo", species: "Cat" }],
    })
    mockGetPetById.mockRejectedValue({
      response: { status: 404, data: "Not found" },
    })

    render(<Profile />)

    fireEvent.click(screen.getByRole("tab", { name: "My Pets" }))
    fireEvent.click(await screen.findByRole("button", { name: /Milo/i }))

    expect(await screen.findByText(/Failed to load pet profile: 404 - Not found/i)).toBeInTheDocument()
    expect(screen.getByText(/Name:/i)).toBeInTheDocument()
  })

  it("does not delete when confirmation is cancelled", async () => {
    globalThis.confirm = vi.fn(() => false)
    mockGetMyPets.mockResolvedValue({
      data: [{ id: 4, name: "Luna", species: "Cat" }],
    })
    mockGetPetById.mockResolvedValue({
      data: { id: 4, name: "Luna", species: "Cat" },
    })

    render(<Profile />)

    fireEvent.click(screen.getByRole("tab", { name: "My Pets" }))
    fireEvent.click(await screen.findByRole("button", { name: /Luna/i }))
    fireEvent.click(await screen.findByRole("button", { name: "Delete Pet" }))

    expect(mockDeletePet).not.toHaveBeenCalled()
  })

  it("validates selected image type before upload", async () => {
    mockGetMyPets.mockResolvedValue({
      data: [{ id: 5, name: "Rocky", species: "Dog" }],
    })
    mockGetPetById.mockResolvedValue({
      data: { id: 5, name: "Rocky", species: "Dog" },
    })

    render(<Profile />)

    fireEvent.click(screen.getByRole("tab", { name: "My Pets" }))
    fireEvent.click(await screen.findByRole("button", { name: /Rocky/i }))

    const fileInput = document.querySelector('input[type="file"]')
    expect(fileInput).toBeInTheDocument()
    const invalidFile = new File(["abc"], "bad.txt", { type: "text/plain" })
    fireEvent.change(fileInput, { target: { files: [invalidFile] } })

    expect(await screen.findByText(/Please select a valid image file/i)).toBeInTheDocument()
    expect(mockUploadPetImage).not.toHaveBeenCalled()
  })

  it("shows message when user has no pets", async () => {
    mockGetMyPets.mockResolvedValue({ data: [] })

    render(<Profile />)

    fireEvent.click(screen.getByRole("tab", { name: "My Pets" }))

    expect(await screen.findByText("You have no pets yet.")).toBeInTheDocument()
  })

  it("shows fallback when no profile data in localStorage", () => {
    localStorage.removeItem("me")

    render(<Profile />)

    expect(screen.getByText(/No profile data found/i)).toBeInTheDocument()
  })

  it("shows add pet error when create fails", async () => {
    mockGetMyPets.mockResolvedValue({ data: [] })
    mockCreatePet.mockRejectedValue({
      response: { status: 400, data: "Bad request" },
    })

    render(<Profile />)

    fireEvent.click(screen.getByRole("tab", { name: "My Pets" }))
    fireEvent.change(getInputByName("Name"), {
      target: { value: "Bobby" },
    })
    fireEvent.change(getInputByName("Species"), {
      target: { value: "Dog" },
    })
    fireEvent.click(screen.getByRole("button", { name: "Add Pet" }))

    expect(await screen.findByText(/Failed to add pet: 400 - Bad request/i)).toBeInTheDocument()
  })

  it("enters edit mode and can cancel", async () => {
    mockGetMyPets.mockResolvedValue({
      data: [{ id: 11, name: "Bolt", species: "Dog" }],
    })
    mockGetPetById.mockResolvedValue({
      data: { id: 11, name: "Bolt", species: "Dog" },
    })

    render(<Profile />)

    fireEvent.click(screen.getByRole("tab", { name: "My Pets" }))
    fireEvent.click(await screen.findByRole("button", { name: /Bolt/i }))
    fireEvent.click(await screen.findByRole("button", { name: "Edit Pet" }))

    expect(await screen.findByRole("button", { name: "Save Changes" })).toBeInTheDocument()
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }))
    expect(screen.queryByRole("button", { name: "Save Changes" })).not.toBeInTheDocument()
  })

  it("updates pet successfully", async () => {
    mockGetMyPets.mockResolvedValue({
      data: [{ id: 12, name: "Mochi", species: "Cat", breed: "Siamese" }],
    })
    mockGetPetById.mockResolvedValue({
      data: { id: 12, name: "Mochi", species: "Cat", breed: "Siamese" },
    })
    mockUpdatePet.mockResolvedValue({
      data: { id: 12, name: "Mochi", species: "Cat", breed: "Siamese" },
    })

    render(<Profile />)

    fireEvent.click(screen.getByRole("tab", { name: "My Pets" }))
    fireEvent.click(await screen.findByRole("button", { name: /Mochi/i }))
    fireEvent.click(await screen.findByRole("button", { name: "Edit Pet" }))

    fireEvent.change(document.querySelector("#profile-edit-pet-breed"), {
      target: { value: "Siamese" },
    })
    fireEvent.click(screen.getByRole("button", { name: "Save Changes" }))

    await waitFor(() => {
      expect(mockUpdatePet).toHaveBeenCalledWith(
        12,
        expect.objectContaining({
          name: "Mochi",
          species: "Cat",
          breed: "Siamese",
        })
      )
    })

    expect(await screen.findByText(/Pet updated successfully/i)).toBeInTheDocument()
  })

  it("shows update error when update fails", async () => {
    mockGetMyPets.mockResolvedValue({
      data: [{ id: 13, name: "Nova", species: "Dog" }],
    })
    mockGetPetById.mockResolvedValue({
      data: { id: 13, name: "Nova", species: "Dog" },
    })
    mockUpdatePet.mockRejectedValue({
      response: { status: 403, data: "Forbidden" },
    })

    render(<Profile />)

    fireEvent.click(screen.getByRole("tab", { name: "My Pets" }))
    fireEvent.click(await screen.findByRole("button", { name: /Nova/i }))
    fireEvent.click(await screen.findByRole("button", { name: "Edit Pet" }))
    fireEvent.click(screen.getByRole("button", { name: "Save Changes" }))

    expect(await screen.findByText(/Failed to update pet: 403 - Forbidden/i)).toBeInTheDocument()
  })

  it("shows explicit errors when selected pet has no id", async () => {
    mockGetMyPets.mockResolvedValue({
      data: [{ name: "Shadow", species: "Dog" }],
    })

    render(<Profile />)

    fireEvent.click(screen.getByRole("tab", { name: "My Pets" }))
    fireEvent.click(await screen.findByRole("button", { name: /Shadow/i }))
    fireEvent.click(await screen.findByRole("button", { name: "Delete Pet" }))

    expect(await screen.findByText(/cannot be deleted/i)).toBeInTheDocument()

    fireEvent.click(screen.getByRole("button", { name: "Edit Pet" }))
    fireEvent.click(screen.getByRole("button", { name: "Save Changes" }))

    expect(await screen.findByText(/cannot be edited/i)).toBeInTheDocument()
  })

  it("validates max image size and supports successful upload", async () => {
    mockGetMyPets.mockResolvedValue({
      data: [{ id: 14, name: "Pixel", species: "Cat" }],
    })
    mockGetPetById.mockResolvedValue({
      data: { id: 14, name: "Pixel", species: "Cat" },
    })
    mockUploadPetImage.mockResolvedValue({
      data: { id: 14, name: "Pixel", species: "Cat", imageUrl: "https://img/pixel.png" },
    })

    render(<Profile />)

    fireEvent.click(screen.getByRole("tab", { name: "My Pets" }))
    fireEvent.click(await screen.findByRole("button", { name: /Pixel/i }))

    const fileInput = document.querySelector('input[type="file"]')
    expect(fileInput).toBeInTheDocument()

    const bigFile = new File([new Uint8Array(5 * 1024 * 1024 + 10)], "big.png", {
      type: "image/png",
    })
    fireEvent.change(fileInput, { target: { files: [bigFile] } })
    expect(await screen.findByText(/Image must be 5MB or smaller/i)).toBeInTheDocument()

    const validFile = new File(["ok"], "ok.png", { type: "image/png" })
    fireEvent.change(fileInput, { target: { files: [validFile] } })
    fireEvent.click(screen.getByRole("button", { name: "Upload Image" }))

    await waitFor(() => {
      expect(mockUploadPetImage).toHaveBeenCalledWith(14, validFile)
    })
    expect(await screen.findByText(/Pet image updated successfully/i)).toBeInTheDocument()
  })

  it("shows upload error when image upload fails", async () => {
    mockGetMyPets.mockResolvedValue({
      data: [{ id: 15, name: "Otis", species: "Dog" }],
    })
    mockGetPetById.mockResolvedValue({
      data: { id: 15, name: "Otis", species: "Dog" },
    })
    mockUploadPetImage.mockRejectedValue({
      response: { status: 500, data: "Upload failed" },
    })

    render(<Profile />)

    fireEvent.click(screen.getByRole("tab", { name: "My Pets" }))
    fireEvent.click(await screen.findByRole("button", { name: /Otis/i }))

    const fileInput = document.querySelector('input[type="file"]')
    const validFile = new File(["ok"], "ok.png", { type: "image/png" })
    fireEvent.change(fileInput, { target: { files: [validFile] } })
    fireEvent.click(screen.getByRole("button", { name: "Upload Image" }))

    expect(await screen.findByText(/Failed to upload pet image: 500 - Upload failed/i)).toBeInTheDocument()
  })

  it("skips loading pets API when no access token", async () => {
    localStorage.removeItem("access_token")

    render(<Profile />)

    fireEvent.click(screen.getByRole("tab", { name: "My Pets" }))

    await waitFor(() => {
      expect(mockGetMyPets).not.toHaveBeenCalled()
    })
  })
})
