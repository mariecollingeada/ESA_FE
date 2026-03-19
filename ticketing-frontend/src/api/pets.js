import api from "./api"

export const getAllPets = () => api.get("/api/pets")
export const getPetById = (id) => api.get(`/api/pets/${id}`)
export const getMyPets = () => api.get("/api/pets/my-pets")
export const createPet = (data) => api.post("/api/pets/create", data)
export const updatePet = (id, data) => api.put(`/api/pets/${id}`, data)
export const deletePet = (id) => api.delete(`/api/pets/${id}`)
