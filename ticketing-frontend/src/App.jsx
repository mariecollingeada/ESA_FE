import { Routes, Route } from 'react-router-dom'
import Nav from './components/Nav'
import Register from './pages/Register'
import Login from './pages/Login'
import Profile from './pages/Profile'
import ResetPassword from './pages/ResetPassword'

export default function App() {
  return (
    <>
      <Nav />
      <div className="container">
        <Routes>
          <Route path="/" element={<h2>ESE App</h2>} />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          {/* <Route path="/tickets" element={<Tickets />} /> */}
        </Routes>
      </div>
    </>
  )
}
