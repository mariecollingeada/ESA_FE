import { useState } from "react"
import { loginUser, getMe } from "../api/auth"
import { useNavigate } from "react-router-dom"

export default function Login() {
  const [form, setForm] = useState({})
  const [error, setError] = useState(null)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)

    try {
      const res = await loginUser(form)
      const { access, refresh } = res.data

      localStorage.setItem("access_token", access)
      localStorage.setItem("refresh_token", refresh)

      const me = await getMe()
      localStorage.setItem("me", JSON.stringify(me.data))

      navigate("/tickets")
    } catch (err) {
      setError(err.response?.data || "Login failed")
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
