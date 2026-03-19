import { Routes, Route } from 'react-router-dom'
import Nav from './components/Nav'
import Home from './pages/Home'
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
          <Route path="/" element={<Home />} />
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
