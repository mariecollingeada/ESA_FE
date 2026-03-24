import { useEffect, useMemo, useState } from "react"
import {
  createPet,
  deletePet,
  getAllPets,
  getMyPets,
  updatePet,
} from "../api/pets"
import {
  getBreedOptionsForSpecies,
  SPECIES_OPTIONS,
} from "../constants/petOptions"

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

export default function Pets() {
  const [allPets, setAllPets] = useState([])
  const [myPets, setMyPets] = useState([])
  const [createForm, setCreateForm] = useState(EMPTY_FORM)
  const [editForm, setEditForm] = useState(EMPTY_FORM)
  const [editingPetId, setEditingPetId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [message, setMessage] = useState(null)

  const myPetIds = useMemo(
    () => new Set(myPets.map((pet) => getPetId(pet)).filter(Boolean)),
    [myPets],
  )

  const loadPets = async () => {
    setLoading(true)
    setError(null)

    try {
      const [allRes, mineRes] = await Promise.all([getAllPets(), getMyPets()])
      setAllPets(Array.isArray(allRes.data) ? allRes.data : [])
      setMyPets(Array.isArray(mineRes.data) ? mineRes.data : [])
    } catch (err) {
      setError(formatApiError(err, "Failed to load pets"))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadPets()
  }, [])

  const startEditing = (pet) => {
    const id = getPetId(pet)
    if (!id) {
      setError("Selected pet has no id")
      return
    }

    setEditingPetId(id)
    setEditForm({
      name: pet.name || "",
      species: pet.species || "",
      breed: pet.breed || "",
      age: pet.age != null ? String(pet.age) : "",
      description: pet.description || pet.notes || "",
    })
    setMessage(null)
    setError(null)
  }

  const cancelEditing = () => {
    setEditingPetId(null)
    setEditForm(EMPTY_FORM)
  }

  const createBreedOptions = getBreedOptionsForSpecies(createForm.species)
  const editBreedOptions = getBreedOptionsForSpecies(editForm.species)

  const handleCreate = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    setMessage(null)

    try {
      await createPet(mapFormToPayload(createForm))
      setCreateForm(EMPTY_FORM)
      setMessage("Pet created successfully")
      await loadPets()
    } catch (err) {
      setError(formatApiError(err, "Failed to create pet"))
    } finally {
      setSubmitting(false)
    }
  }

  const handleUpdate = async (e) => {
    e.preventDefault()

    if (!editingPetId) {
      return
    }

    setSubmitting(true)
    setError(null)
    setMessage(null)

    try {
      await updatePet(editingPetId, mapFormToPayload(editForm))
      setMessage("Pet updated successfully")
      cancelEditing()
      await loadPets()
    } catch (err) {
      setError(formatApiError(err, "Failed to update pet"))
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id) => {
    if (!id) {
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
      if (editingPetId === id) {
        cancelEditing()
      }
      await loadPets()
    } catch (err) {
      setError(formatApiError(err, "Failed to delete pet"))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div>
      <h2>Pets</h2>
      {message && <p>{message}</p>}
      {error && <pre className="error">{JSON.stringify(error, null, 2)}</pre>}

      <section>
        <h3>Create Pet</h3>
        <form onSubmit={handleCreate}>
          <label htmlFor="create-pet-name">Name</label>
          <input
            id="create-pet-name"
            name="name"
            required
            value={createForm.name}
            onChange={(e) =>
              setCreateForm({ ...createForm, name: e.target.value })
            }
          />
          <label htmlFor="create-pet-species">Species</label>
          <select
            id="create-pet-species"
            name="species"
            required
            value={createForm.species}
            onChange={(e) => {
              const nextSpecies = e.target.value
              const validBreeds = getBreedOptionsForSpecies(nextSpecies)
              setCreateForm((prev) => ({
                ...prev,
                species: nextSpecies,
                breed: validBreeds.includes(prev.breed) ? prev.breed : "",
              }))
            }}
          >
            <option value="">Select species</option>
            {SPECIES_OPTIONS.map((species) => (
              <option key={species} value={species}>
                {species}
              </option>
            ))}
          </select>
          <label htmlFor="create-pet-breed">Breed</label>
          <select
            id="create-pet-breed"
            name="breed"
            value={createForm.breed}
            onChange={(e) =>
              setCreateForm({ ...createForm, breed: e.target.value })
            }
            disabled={!createForm.species}
          >
            <option value="">Select breed</option>
            {createBreedOptions.map((breed) => (
              <option key={breed} value={breed}>
                {breed}
              </option>
            ))}
          </select>
          <label htmlFor="create-pet-age">Age</label>
          <input
            id="create-pet-age"
            type="number"
            name="age"
            min="0"
            value={createForm.age}
            onChange={(e) =>
              setCreateForm({ ...createForm, age: e.target.value })
            }
          />
          <label htmlFor="create-pet-description">Description</label>
          <textarea
            id="create-pet-description"
            name="description"
            rows={3}
            value={createForm.description}
            onChange={(e) =>
              setCreateForm({ ...createForm, description: e.target.value })
            }
          />
          <button type="submit" disabled={submitting}>
            {submitting ? "Saving..." : "Create"}
          </button>
        </form>
      </section>

      {editingPetId && (
        <section>
          <h3>Edit Pet #{editingPetId}</h3>
          <form onSubmit={handleUpdate}>
            <label htmlFor="edit-pet-name">Name</label>
            <input
              id="edit-pet-name"
              name="name"
              required
              value={editForm.name}
              onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
            />
            <label htmlFor="edit-pet-species">Species</label>
            <select
              id="edit-pet-species"
              name="species"
              required
              value={editForm.species}
              onChange={(e) => {
                const nextSpecies = e.target.value
                const validBreeds = getBreedOptionsForSpecies(nextSpecies)
                setEditForm((prev) => ({
                  ...prev,
                  species: nextSpecies,
                  breed: validBreeds.includes(prev.breed) ? prev.breed : "",
                }))
              }}
            >
              <option value="">Select species</option>
              {SPECIES_OPTIONS.map((species) => (
                <option key={species} value={species}>
                  {species}
                </option>
              ))}
            </select>
            <label htmlFor="edit-pet-breed">Breed</label>
            <select
              id="edit-pet-breed"
              name="breed"
              value={editForm.breed}
              onChange={(e) => setEditForm({ ...editForm, breed: e.target.value })}
              disabled={!editForm.species}
            >
              <option value="">Select breed</option>
              {editBreedOptions.map((breed) => (
                <option key={breed} value={breed}>
                  {breed}
                </option>
              ))}
            </select>
            <label htmlFor="edit-pet-age">Age</label>
            <input
              id="edit-pet-age"
              type="number"
              name="age"
              min="0"
              value={editForm.age}
              onChange={(e) => setEditForm({ ...editForm, age: e.target.value })}
            />
            <label htmlFor="edit-pet-description">Description</label>
            <textarea
              id="edit-pet-description"
              name="description"
              rows={3}
              value={editForm.description}
              onChange={(e) =>
                setEditForm({ ...editForm, description: e.target.value })
              }
            />
            <button type="submit" disabled={submitting}>
              {submitting ? "Updating..." : "Update"}
            </button>
            <button type="button" onClick={cancelEditing} disabled={submitting}>
              Cancel
            </button>
          </form>
        </section>
      )}

      <section>
        <h3>My Pets</h3>
        {loading ? (
          <p>Loading...</p>
        ) : myPets.length === 0 ? (
          <p>You do not have any pets yet.</p>
        ) : (
          <ul>
            {myPets.map((pet) => {
              const id = getPetId(pet)
              return (
                <li key={id || JSON.stringify(pet)}>
                  <strong>{pet.name || "Unnamed"}</strong>
                  {pet.species ? ` (${pet.species})` : ""}
                  {pet.breed ? ` - ${pet.breed}` : ""}
                  {pet.age != null ? ` - age ${pet.age}` : ""}
                  {id && (
                    <>
                      {" "}
                      <button
                        type="button"
                        onClick={() => startEditing(pet)}
                        disabled={submitting}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(id)}
                        disabled={submitting}
                      >
                        Delete
                      </button>
                    </>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </section>

      <section>
        <h3>All Pets</h3>
        {loading ? (
          <p>Loading...</p>
        ) : allPets.length === 0 ? (
          <p>No pets available.</p>
        ) : (
          <ul>
            {allPets.map((pet) => {
              const id = getPetId(pet)
              const isMine = id ? myPetIds.has(id) : false

              return (
                <li key={id || `${pet.name}-${pet.species}-${pet.age}`}>
                  <strong>{pet.name || "Unnamed"}</strong>
                  {pet.species ? ` (${pet.species})` : ""}
                  {pet.breed ? ` - ${pet.breed}` : ""}
                  {pet.age != null ? ` - age ${pet.age}` : ""}
                  {isMine ? " - yours" : ""}
                </li>
              )
            })}
          </ul>
        )}
      </section>
    </div>
  )
}
