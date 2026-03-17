import { useState } from "react"
import { loginUser, getProfile } from "../api/auth"
import { useNavigate } from "react-router-dom"

const formatApiError = (err, context) => {
  const status = err.response?.status
  const data = err.response?.data
  const details = typeof data === "string" ? data : data?.message || data?.error || JSON.stringify(data)

  if (!err.response && err.message) {
    return `${context}: ${err.message}`
  }

  if (!err.response) {
    return `${context}: could not reach server`
  }

  return `${context}: ${status}${details ? ` - ${details}` : ""}`
}

const getTokenFromResponse = (payload) => {
  return (
    payload.accessToken ||
    payload.access ||
    payload.token ||
    payload.jwt ||
    payload.data?.accessToken ||
    payload.data?.access ||
    null
  )
}

const getRefreshFromResponse = (payload) => {
  return payload.refreshToken || payload.refresh || payload.data?.refreshToken || payload.data?.refresh || null
}

export default function Login() {
  const [form, setForm] = useState({})
  const [error, setError] = useState(null)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)

    try {
      const res = await loginUser(form)
      const access = getTokenFromResponse(res.data)
      const refresh = getRefreshFromResponse(res.data)

      if (!access) {
        throw new Error(`No access token returned from login. Response: ${JSON.stringify(res.data)}`)
      }

      localStorage.setItem("access_token", access)
      if (refresh) {
        localStorage.setItem("refresh_token", refresh)
      }

      let me
      try {
        me = await getProfile()
      } catch (profileErr) {
        setError(formatApiError(profileErr, "Profile request failed after successful login"))
        return
      }

      localStorage.setItem("me", JSON.stringify(me.data))

      navigate("/profile")
    } catch (err) {
      setError(formatApiError(err, "Login failed"))
    }
  }

  return (
    <div>
      <h2>Login</h2>
      {error && <pre className="error">{JSON.stringify(error, null, 2)}</pre>}
      <form onSubmit={handleSubmit}>
        <input placeholder="Username" required onChange={e => setForm({...form, username: e.target.value})} />
        <input type="password" placeholder="Password" required onChange={e => setForm({...form, password: e.target.value})} />
        <button type="submit">Login</button>
      </form>
    </div>
  )
}
