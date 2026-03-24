import { useEffect, useMemo, useState } from "react"
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

const getCreatedTimestamp = (pet) => {
  const candidate =
    pet.createdAt ||
    pet.created_at ||
    pet.createdDate ||
    pet.creationDate ||
    pet.createdOn ||
    pet.created_on ||
    pet.created ||
    pet.dateCreated ||
    pet.date_created

  if (!candidate) {
    return Number.NEGATIVE_INFINITY
  }

  if (typeof candidate === "number") {
    // Accept epoch milliseconds or seconds.
    return candidate > 1e12 ? candidate : candidate * 1000
  }

  if (candidate instanceof Date) {
    return candidate.getTime()
  }

  const ts = Date.parse(candidate)
  return Number.isNaN(ts) ? Number.NEGATIVE_INFINITY : ts
}

const compareFallback = (a, b, sortOrder) => {
  const aId = getPetId(a)
  const bId = getPetId(b)

  if (typeof aId === "number" && typeof bId === "number" && aId !== bId) {
    return sortOrder === "newest" ? bId - aId : aId - bId
  }

  const aName = (a.name || "").toLowerCase()
  const bName = (b.name || "").toLowerCase()

  if (aName !== bName) {
    return sortOrder === "newest"
      ? bName.localeCompare(aName)
      : aName.localeCompare(bName)
  }

  return 0
}

export default function Home() {
  const [pets, setPets] = useState([])
  const [selectedPet, setSelectedPet] = useState(null)
  const [activeSpecies, setActiveSpecies] = useState("All")
  const [sortOrder, setSortOrder] = useState("newest")
  const [loading, setLoading] = useState(true)
  const [loadingPetDetail, setLoadingPetDetail] = useState(false)
  const [error, setError] = useState(null)
  const loggedIn = Boolean(localStorage.getItem("access_token"))

  const speciesTags = useMemo(() => {
    const uniqueSpecies = Array.from(
      new Set(
        pets
          .map((pet) => pet.species?.trim())
          .filter(Boolean),
      ),
    ).sort((a, b) => a.localeCompare(b))

    return ["All", ...uniqueSpecies]
  }, [pets])

  const filteredPets = useMemo(() => {
    if (activeSpecies === "All") {
      return pets
    }

    return pets.filter((pet) => (pet.species || "") === activeSpecies)
  }, [pets, activeSpecies])

  const visiblePets = useMemo(() => {
    const sorted = [...filteredPets]

    sorted.sort((a, b) => {
      const aTs = getCreatedTimestamp(a)
      const bTs = getCreatedTimestamp(b)

      if (Number.isFinite(aTs) && Number.isFinite(bTs) && aTs !== bTs) {
        return sortOrder === "newest" ? bTs - aTs : aTs - bTs
      }

      if (Number.isFinite(aTs) && !Number.isFinite(bTs)) {
        return sortOrder === "newest" ? -1 : 1
      }

      if (!Number.isFinite(aTs) && Number.isFinite(bTs)) {
        return sortOrder === "newest" ? 1 : -1
      }

      return compareFallback(a, b, sortOrder)
    })

    return sorted
  }, [filteredPets, sortOrder])

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

      {!loading && pets.length > 0 && (
        <div className="filter-controls">
          <div className="filter-tag-row" aria-label="Species filters">
            {speciesTags.map((species) => (
              <button
                key={species}
                type="button"
                className={activeSpecies === species ? "filter-tag active" : "filter-tag"}
                onClick={() => setActiveSpecies(species)}
              >
                {species}
              </button>
            ))}
          </div>
          <div className="sort-row">
            <label htmlFor="home-sort-order">Sort</label>
            <select
              id="home-sort-order"
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
            >
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
            </select>
          </div>
        </div>
      )}

      {loading ? (
        <p>Loading...</p>
      ) : visiblePets.length === 0 ? (
        <p>No pets available.</p>
      ) : (
        <div className="pet-card-grid">
          {visiblePets.map((pet) => {
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
                  {pet.imageUrl ? (
                    <img
                      className="pet-image"
                      src={pet.imageUrl}
                      alt={`${label} profile`}
                    />
                  ) : (
                    <div className="pet-avatar" aria-hidden="true">
                      <span>{label.charAt(0).toUpperCase()}</span>
                    </div>
                  )}
                  <h3>{label}</h3>
                </button>
              )
            }

            return (
              <article className="pet-card" key={id || `${label}-${pet.species || "x"}`}>
                {pet.imageUrl ? (
                  <img className="pet-image" src={pet.imageUrl} alt={`${label} profile`} />
                ) : (
                  <div className="pet-avatar" aria-hidden="true">
                    <span>{label.charAt(0).toUpperCase()}</span>
                  </div>
                )}
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
              {selectedPet.imageUrl ? (
                <img
                  className="pet-image pet-image-large"
                  src={selectedPet.imageUrl}
                  alt={`${selectedPet.name || "Pet"} profile`}
                />
              ) : (
                <div className="pet-avatar" aria-hidden="true">
                  <span>{(selectedPet.name || "P").charAt(0).toUpperCase()}</span>
                </div>
              )}
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
