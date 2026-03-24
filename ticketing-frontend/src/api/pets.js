import api from "./api"

export const getAllPets = () => api.get("/api/pets")
export const getPetById = (id) => api.get(`/api/pets/${id}`)
export const getMyPets = () => api.get("/api/pets/my-pets")
export const getMyFavoritePets = () => api.get("/api/pets/favorites/me")
export const createPet = (data) => api.post("/api/pets/create", data)
export const updatePet = (id, data) => api.put(`/api/pets/${id}`, data)
export const deletePet = (id) => api.delete(`/api/pets/${id}`)
export const addPetToFavorites = (id) => api.post(`/api/pets/${id}/favorite`)
export const removePetFromFavorites = (id) => api.delete(`/api/pets/${id}/favorite`)
export const uploadPetImage = (id, file) => {
	const formData = new FormData()
	formData.append("file", file)
	return api.post(`/api/pets/${id}/image`, formData)
}
