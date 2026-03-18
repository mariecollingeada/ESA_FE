import api from "./api"

export const registerUser = (data) => api.post("/auth/register", data)
export const loginUser = (data) => api.post("/auth/login", data)
export const getProfile = () => api.get("/auth/profile")
export const initiatePasswordReset = (email) =>
	api.post("/auth/reset-password/initiate", null, {
		params: { email },
	})
export const resetPassword = (data) => api.post("/auth/reset-password", data)
