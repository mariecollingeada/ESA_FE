import { useState } from "react"
import { Link, useNavigate, useSearchParams } from "react-router-dom"
import { resetPassword } from "../api/auth"

const parseResetContext = (searchParams) => {
  return {
    token: searchParams.get("token") || searchParams.get("resetToken") || "",
    email: searchParams.get("email") || "",
    username: searchParams.get("username") || searchParams.get("user") || "",
  }
}

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

export default function ResetPassword() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const resetContext = parseResetContext(searchParams)

  const [form, setForm] = useState({
    password: "",
    confirmPassword: "",
  })
  const [error, setError] = useState(null)
  const [message, setMessage] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setMessage(null)

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match")
      return
    }

    if (!resetContext.token) {
      setError("Invalid reset link: missing token")
      return
    }

    const payload = {
      token: resetContext.token,
      email: resetContext.email || undefined,
      username: resetContext.username || undefined,
      newPassword: form.password,
      confirmPassword: form.confirmPassword,
    }

    setSubmitting(true)
    try {
      await resetPassword(payload)
      setMessage("Password reset successful. You can now log in.")
      setTimeout(() => navigate("/login"), 800)
    } catch (err) {
      setError(formatApiError(err, "Reset password failed"))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div>
      <h2>Reset Password</h2>
      {message && <p>{message}</p>}
      {error && <pre className="error">{JSON.stringify(error, null, 2)}</pre>}

      <form onSubmit={handleSubmit}>
        <input
          type="password"
          placeholder="New password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          required
        />
        <input
          type="password"
          placeholder="Confirm new password"
          value={form.confirmPassword}
          onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
          required
        />
        <button type="submit" disabled={submitting}>
          {submitting ? "Submitting..." : "Reset Password"}
        </button>
      </form>

      <p>
        <Link to="/login">Back to login</Link>
      </p>
    </div>
  )
}
