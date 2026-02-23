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
        <input placeholder="Username" required onChange={e => setForm({...form, username: e.target.value})} />
        <input placeholder="Email" required onChange={e => setForm({...form, email: e.target.value})} />
        <input type="password" placeholder="Password" required onChange={e => setForm({...form, password: e.target.value})} />
        <input type="password" placeholder="Confirm Password" required onChange={e => setForm({...form, password2: e.target.value})} />
        <button type="submit">Register</button>
      </form>
    </div>
  )
}
