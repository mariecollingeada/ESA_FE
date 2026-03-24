import { describe, it, expect, vi, beforeEach } from "vitest"

const mockGet = vi.fn()
const mockPost = vi.fn()
const mockPut = vi.fn()
const mockDelete = vi.fn()

vi.mock("./api", () => ({
  default: {
    get: (...args) => mockGet(...args),
    post: (...args) => mockPost(...args),
    put: (...args) => mockPut(...args),
    delete: (...args) => mockDelete(...args),
  },
}))

import {
  getAllPets,
  getPetById,
  getMyPets,
  getMyFavoritePets,
  createPet,
  updatePet,
  deletePet,
  addPetToFavorites,
  removePetFromFavorites,
  uploadPetImage,
} from "./pets"

describe("pets api module", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("calls list endpoints", () => {
    getAllPets()
    getMyPets()
    getMyFavoritePets()
    getPetById(7)

    expect(mockGet).toHaveBeenCalledWith("/api/pets")
    expect(mockGet).toHaveBeenCalledWith("/api/pets/my-pets")
    expect(mockGet).toHaveBeenCalledWith("/api/pets/favorites/me")
    expect(mockGet).toHaveBeenCalledWith("/api/pets/7")
  })

  it("calls create update delete endpoints", () => {
    const payload = { name: "Kiki" }
    createPet(payload)
    updatePet(10, payload)
    deletePet(10)
    addPetToFavorites(10)
    removePetFromFavorites(10)

    expect(mockPost).toHaveBeenCalledWith("/api/pets/create", payload)
    expect(mockPut).toHaveBeenCalledWith("/api/pets/10", payload)
    expect(mockDelete).toHaveBeenCalledWith("/api/pets/10")
    expect(mockPost).toHaveBeenCalledWith("/api/pets/10/favorite")
    expect(mockDelete).toHaveBeenCalledWith("/api/pets/10/favorite")
  })

  it("uploads image as multipart form data", () => {
    const file = new File(["abc"], "pet.png", { type: "image/png" })
    uploadPetImage(3, file)

    const [url, body] = mockPost.mock.calls[0]
    expect(url).toBe("/api/pets/3/image")
    expect(body).toBeInstanceOf(FormData)
    expect(body.get("file")).toBe(file)
  })
})
