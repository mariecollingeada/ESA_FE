import axios from "axios"

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE || undefined,
})

// Automatically attach JWT token
api.interceptors.request.use(config => {
  if (config.data instanceof FormData) {
    delete config.headers["Content-Type"]
  }

  const token = localStorage.getItem("access_token")
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export default api
