import { useEffect, useState } from "react"
import { getAllPets, getPetById } from "../api/pets"

const formatApiError = (err, context) => {
  const status = err.response?.status
  const data = err.response?.data
  const details =
    typeof data === "string"
      ? data
      : data?.message || data?.error || JSON.stringify(data)

  if (!err.response && err.message) {
    return `${context}: ${err.message}`
  }

  if (!err.response) {
    return `${context}: could not reach server`
  }

  return `${context}: ${status}${details ? ` - ${details}` : ""}`
}

const getPetId = (pet) => pet.id ?? pet.petId ?? pet._id

export default function Home() {
  const [pets, setPets] = useState([])
  const [selectedPet, setSelectedPet] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loadingPetDetail, setLoadingPetDetail] = useState(false)
  const [error, setError] = useState(null)
  const loggedIn = Boolean(localStorage.getItem("access_token"))

  useEffect(() => {
    const loadPets = async () => {
      setLoading(true)
      setError(null)

      try {
        const res = await getAllPets()
        setPets(Array.isArray(res.data) ? res.data : [])
      } catch (err) {
        setError(formatApiError(err, "Failed to load pets"))
      } finally {
        setLoading(false)
      }
    }

    loadPets()
  }, [])

  const handleSelectPet = async (pet) => {
    if (!loggedIn) {
      return
    }

    const id = getPetId(pet)
    if (!id) {
      setSelectedPet(pet)
      return
    }

    setLoadingPetDetail(true)
    setError(null)

    try {
      const res = await getPetById(id)
      setSelectedPet(res.data || pet)
    } catch (err) {
      setError(formatApiError(err, "Failed to load pet profile"))
      setSelectedPet(pet)
    } finally {
      setLoadingPetDetail(false)
    }
  }

  return (
    <div>
      <h2>Pets</h2>
      <p>Discover the community pets.</p>
      {!loggedIn && <p>Log in to click a pet and view full details.</p>}
      {error && <pre className="error">{JSON.stringify(error, null, 2)}</pre>}

      {loading ? (
        <p>Loading...</p>
      ) : pets.length === 0 ? (
        <p>No pets available.</p>
      ) : (
        <div className="pet-card-grid">
          {pets.map((pet) => {
            const id = getPetId(pet)
            const label = pet.name || "Unnamed"

            if (loggedIn) {
              return (
                <button
                  type="button"
                  className="pet-card pet-card-btn"
                  key={id || `${label}-${pet.species || "x"}`}
                  onClick={() => handleSelectPet(pet)}
                >
                  <div className="pet-avatar" aria-hidden="true">
                    <span>{label.charAt(0).toUpperCase()}</span>
                  </div>
                  <h3>{label}</h3>
                </button>
              )
            }

            return (
              <article className="pet-card" key={id || `${label}-${pet.species || "x"}`}>
                <div className="pet-avatar" aria-hidden="true">
                  <span>{label.charAt(0).toUpperCase()}</span>
                </div>
                <h3>{label}</h3>
              </article>
            )
          })}
        </div>
      )}

      {loggedIn && selectedPet && (
        <div className="info-card">
          <h3>Pet Profile</h3>
          {loadingPetDetail ? (
            <p>Loading pet details...</p>
          ) : (
            <>
              <p>
                <strong>Name:</strong> {selectedPet.name || "-"}
              </p>
              <p>
                <strong>Species:</strong> {selectedPet.species || "-"}
              </p>
              <p>
                <strong>Breed:</strong> {selectedPet.breed || "-"}
              </p>
              <p>
                <strong>Age:</strong>{" "}
                {selectedPet.age != null ? selectedPet.age : "-"}
              </p>
              <p>
                <strong>Description:</strong>{" "}
                {selectedPet.description || selectedPet.notes || "-"}
              </p>
            </>
          )}
        </div>
      )}
    </div>
  )
}
