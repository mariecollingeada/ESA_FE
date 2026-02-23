import { Link, useNavigate } from "react-router-dom"

export default function Nav() {
  const navigate = useNavigate()
  const loggedIn = !!localStorage.getItem("access_token")

  const logout = () => {
    localStorage.removeItem("access_token")
    localStorage.removeItem("refresh_token")
    localStorage.removeItem("me")
    navigate("/login")
  }

  return (
    <nav className="nav">
      <Link to="/">Home</Link>
      <Link to="/register">Register</Link>
      <Link to="/login">Login</Link>
      <Link to="/tickets">Tickets</Link>
      {loggedIn && <button onClick={logout}>Logout</button>}
    </nav>
  )
}
