import { useCallback, useEffect, useMemo, useState } from "react"
import {
  createPet,
  deletePet,
  getMyPets,
  getPetById,
  updatePet,
} from "../api/pets"

const EMPTY_FORM = {
  name: "",
  species: "",
  breed: "",
  age: "",
  description: "",
}

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

const mapFormToPayload = (form) => {
  const payload = {
    name: form.name?.trim(),
    species: form.species?.trim(),
    breed: form.breed?.trim(),
    description: form.description?.trim(),
  }

  if (form.age !== "") {
    payload.age = Number(form.age)
  }

  Object.keys(payload).forEach((key) => {
    if (payload[key] === "" || payload[key] == null) {
      delete payload[key]
    }
  })

  return payload
}

const getPetId = (pet) => pet.id ?? pet.petId ?? pet._id

export default function Profile() {
  const [activeTab, setActiveTab] = useState("profile")
  const [myPets, setMyPets] = useState([])
  const [selectedPet, setSelectedPet] = useState(null)
  const [createForm, setCreateForm] = useState(EMPTY_FORM)
  const [editForm, setEditForm] = useState(EMPTY_FORM)
  const [editingPet, setEditingPet] = useState(false)
  const [loadingPets, setLoadingPets] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [message, setMessage] = useState(null)

  const rawMe = localStorage.getItem("me")
  const me = rawMe ? JSON.parse(rawMe) : null

  const hasAccessToken = useMemo(
    () => Boolean(localStorage.getItem("access_token")),
    [],
  )

  const loadMyPets = useCallback(async () => {
    if (!hasAccessToken) {
      return
    }

    setLoadingPets(true)
    setError(null)

    try {
      const res = await getMyPets()
      const pets = Array.isArray(res.data) ? res.data : []
      setMyPets(pets)

      if (pets.length === 0) {
        setSelectedPet(null)
        setEditingPet(false)
        return
      }

      setSelectedPet((prev) => {
        if (!prev) {
          return prev
        }
        const selectedId = getPetId(prev)
        return pets.find((pet) => getPetId(pet) === selectedId) || null
      })
    } catch (err) {
      setError(formatApiError(err, "Failed to load your pets"))
    } finally {
      setLoadingPets(false)
    }
  }, [hasAccessToken])

  useEffect(() => {
    if (activeTab === "pets") {
      loadMyPets()
    }
  }, [activeTab, loadMyPets])

  const handleAddPet = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    setMessage(null)

    try {
      await createPet(mapFormToPayload(createForm))
      setCreateForm(EMPTY_FORM)
      setMessage("Pet added successfully")
      await loadMyPets()
    } catch (err) {
      setError(formatApiError(err, "Failed to add pet"))
    } finally {
      setSubmitting(false)
    }
  }

  const handleSelectPet = async (pet) => {
    const id = getPetId(pet)

    if (!id) {
      setSelectedPet(pet)
      return
    }

    setError(null)
    setMessage(null)
    setEditingPet(false)

    try {
      const res = await getPetById(id)
      setSelectedPet(res.data || pet)
    } catch (err) {
      setError(formatApiError(err, "Failed to load pet profile"))
      setSelectedPet(pet)
    }
  }

  const handleStartEdit = () => {
    if (!selectedPet) {
      return
    }

    setEditForm({
      name: selectedPet.name || "",
      species: selectedPet.species || "",
      breed: selectedPet.breed || "",
      age: selectedPet.age != null ? String(selectedPet.age) : "",
      description: selectedPet.description || "",
    })
    setEditingPet(true)
    setError(null)
    setMessage(null)
  }

  const handleCancelEdit = () => {
    setEditingPet(false)
    setEditForm(EMPTY_FORM)
  }

  const handleUpdatePet = async (e) => {
    e.preventDefault()

    const id = getPetId(selectedPet)
    if (!id) {
      setError("Selected pet has no id and cannot be edited")
      return
    }

    setSubmitting(true)
    setError(null)
    setMessage(null)

    try {
      const res = await updatePet(id, mapFormToPayload(editForm))
      setSelectedPet(res.data || selectedPet)
      setEditingPet(false)
      setEditForm(EMPTY_FORM)
      setMessage("Pet updated successfully")
      await loadMyPets()
    } catch (err) {
      setError(formatApiError(err, "Failed to update pet"))
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeletePet = async () => {
    const id = getPetId(selectedPet)
    if (!id) {
      setError("Selected pet has no id and cannot be deleted")
      return
    }

    const confirmed = window.confirm("Delete this pet?")
    if (!confirmed) {
      return
    }

    setSubmitting(true)
    setError(null)
    setMessage(null)

    try {
      await deletePet(id)
      setMessage("Pet deleted successfully")
      setSelectedPet(null)
      setEditingPet(false)
      await loadMyPets()
    } catch (err) {
      setError(formatApiError(err, "Failed to delete pet"))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="profile-layout">
      <h2>Profile</h2>
      <div className="tab-row" role="tablist" aria-label="Profile tabs">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "profile"}
          className={activeTab === "profile" ? "tab-btn active" : "tab-btn"}
          onClick={() => setActiveTab("profile")}
        >
          My Profile
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "pets"}
          className={activeTab === "pets" ? "tab-btn active" : "tab-btn"}
          onClick={() => setActiveTab("pets")}
        >
          My Pets
        </button>
      </div>

      {error && <pre className="error">{JSON.stringify(error, null, 2)}</pre>}
      {message && <p>{message}</p>}

      {activeTab === "profile" && (
        <section>
          {me ? (
            <div className="info-card">
              <h3>My Profile</h3>
              <p>
                <strong>Username:</strong> {me.username || "-"}
              </p>
              <p>
                <strong>Email:</strong> {me.email || "-"}
              </p>
              <p>
                <strong>Role:</strong> {me.role || "-"}
              </p>
            </div>
          ) : (
            <p>No profile data found. Please log in again.</p>
          )}
        </section>
      )}

      {activeTab === "pets" && (
        <section>
          <h3>Add Pet</h3>
          <form onSubmit={handleAddPet}>
            <input
              placeholder="Name"
              required
              value={createForm.name}
              onChange={(e) =>
                setCreateForm({ ...createForm, name: e.target.value })
              }
            />
            <input
              placeholder="Species"
              required
              value={createForm.species}
              onChange={(e) =>
                setCreateForm({ ...createForm, species: e.target.value })
              }
            />
            <input
              placeholder="Breed"
              value={createForm.breed}
              onChange={(e) =>
                setCreateForm({ ...createForm, breed: e.target.value })
              }
            />
            <input
              type="number"
              min="0"
              placeholder="Age"
              value={createForm.age}
              onChange={(e) =>
                setCreateForm({ ...createForm, age: e.target.value })
              }
            />
            <textarea
              placeholder="Description"
              rows={3}
              value={createForm.description}
              onChange={(e) =>
                setCreateForm({ ...createForm, description: e.target.value })
              }
            />
            <button type="submit" disabled={submitting}>
              {submitting ? "Saving..." : "Add Pet"}
            </button>
          </form>

          <h3>My Pets</h3>
          {loadingPets ? (
            <p>Loading...</p>
          ) : myPets.length === 0 ? (
            <p>You have no pets yet.</p>
          ) : (
            <div className="pet-card-grid">
              {myPets.map((pet) => {
                const id = getPetId(pet)
                const name = pet.name || "Unnamed"
                return (
                  <button
                    type="button"
                    key={id || JSON.stringify(pet)}
                    className="pet-card pet-card-btn"
                    onClick={() => handleSelectPet(pet)}
                  >
                    <div className="pet-avatar" aria-hidden="true">
                      <span>{name.charAt(0).toUpperCase()}</span>
                    </div>
                    <h4>{name}</h4>
                  </button>
                )
              })}
            </div>
          )}

          {selectedPet && (
            <div className="info-card">
              <h3>Pet Profile</h3>
              {!editingPet ? (
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
                  <button
                    type="button"
                    onClick={handleStartEdit}
                    disabled={submitting}
                  >
                    Edit Pet
                  </button>{" "}
                  <button
                    type="button"
                    onClick={handleDeletePet}
                    disabled={submitting}
                  >
                    {submitting ? "Deleting..." : "Delete Pet"}
                  </button>
                </>
              ) : (
                <form onSubmit={handleUpdatePet}>
                  <input
                    placeholder="Name"
                    required
                    value={editForm.name}
                    onChange={(e) =>
                      setEditForm({ ...editForm, name: e.target.value })
                    }
                  />
                  <input
                    placeholder="Species"
                    required
                    value={editForm.species}
                    onChange={(e) =>
                      setEditForm({ ...editForm, species: e.target.value })
                    }
                  />
                  <input
                    placeholder="Breed"
                    value={editForm.breed}
                    onChange={(e) =>
                      setEditForm({ ...editForm, breed: e.target.value })
                    }
                  />
                  <input
                    type="number"
                    min="0"
                    placeholder="Age"
                    value={editForm.age}
                    onChange={(e) =>
                      setEditForm({ ...editForm, age: e.target.value })
                    }
                  />
                  <textarea
                    placeholder="Description"
                    rows={3}
                    value={editForm.description}
                    onChange={(e) =>
                      setEditForm({ ...editForm, description: e.target.value })
                    }
                  />
                  <button type="submit" disabled={submitting}>
                    {submitting ? "Saving..." : "Save Changes"}
                  </button>{" "}
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    disabled={submitting}
                  >
                    Cancel
                  </button>
                </form>
              )}
            </div>
          )}
        </section>
      )}
    </div>
  )
}
