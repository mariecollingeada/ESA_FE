export default function Profile() {
  const rawMe = localStorage.getItem("me")
  const me = rawMe ? JSON.parse(rawMe) : null

  return (
    <div>
      <h2>Profile</h2>
      {me ? (
        <pre>{JSON.stringify(me, null, 2)}</pre>
      ) : (
        <p>No profile data found. Please log in again.</p>
      )}
    </div>
  )
}
