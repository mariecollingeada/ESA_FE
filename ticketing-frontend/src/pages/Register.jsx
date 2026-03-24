import { useState } from "react"
import { registerUser } from "../api/auth"
import { useNavigate } from "react-router-dom"

export default function Register() {
  const [form, setForm] = useState({})
  const [error, setError] = useState(null)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)

    try {
      await registerUser(form)
      alert("Registration successful")
      navigate("/login")
    } catch (err) {
      setError(err.response?.data || "Registration failed")
    }
  }

  return (
    <div>
      <h2>Register</h2>
      {error && <pre className="error">{JSON.stringify(error, null, 2)}</pre>}
      <form onSubmit={handleSubmit}>
        <label htmlFor="register-username">Username</label>
        <input
          id="register-username"
          name="username"
          required
          onChange={e => setForm({...form, username: e.target.value})}
        />
        <label htmlFor="register-email">Email</label>
        <input
          id="register-email"
          name="email"
          required
          onChange={e => setForm({...form, email: e.target.value})}
        />
        <label htmlFor="register-password">Password</label>
        <input
          id="register-password"
          type="password"
          name="password"
          required
          onChange={e => setForm({...form, password: e.target.value})}
        />
        <label htmlFor="register-confirm-password">Confirm Password</label>
        <input
          id="register-confirm-password"
          type="password"
          name="confirmPassword"
          required
          onChange={e => setForm({...form, confirmPassword: e.target.value})}
        />
        <button type="submit">Register</button>
      </form>
    </div>
  )
}
