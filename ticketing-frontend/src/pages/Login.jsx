import { useState } from "react"
import { loginUser, getProfile, initiatePasswordReset } from "../api/auth"
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
  const [message, setMessage] = useState(null)
  const navigate = useNavigate()

  const handleForgotPassword = async (e) => {
    e.preventDefault()
    setError(null)
    setMessage(null)

    const email = window.prompt("Enter your email to reset your password")

    if (!email) {
      return
    }

    try {
      await initiatePasswordReset(email)
      setMessage("If this email exists, a reset link has been sent.")
    } catch (err) {
      setError(formatApiError(err, "Password reset request failed"))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setMessage(null)

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
      {message && <p>{message}</p>}
      {error && <pre className="error">{JSON.stringify(error, null, 2)}</pre>}
      <form onSubmit={handleSubmit}>
        <input placeholder="Username" required onChange={e => setForm({...form, username: e.target.value})} />
        <input type="password" placeholder="Password" required onChange={e => setForm({...form, password: e.target.value})} />
        <button type="submit">Login</button>
      </form>
      <p>
        <button type="button" onClick={handleForgotPassword}>Forgot password?</button>
      </p>
    </div>
  )
}
