export const SPECIES_OPTIONS = [
  "Dog",
  "Cat",
  "Bird",
  "Rabbit",
  "Fish",
  "Reptile",
  "Small Mammal",
  "Other",
]

export const BREED_OPTIONS_BY_SPECIES = {
  Dog: ["Labrador", "Golden Retriever", "German Shepherd", "Bulldog", "Poodle", "Mixed", "Other"],
  Cat: ["Domestic Shorthair", "Siamese", "Maine Coon", "Persian", "Ragdoll", "Mixed", "Other"],
  Bird: ["Budgie", "Cockatiel", "Parrot", "Canary", "Finch", "Other"],
  Rabbit: ["Netherland Dwarf", "Mini Lop", "Rex", "Lionhead", "Mixed"],
  Fish: ["Goldfish", "Betta", "Guppy", "Tetra", "Cichlid", "Other"],
  Reptile: ["Leopard Gecko", "Bearded Dragon", "Corn Snake", "Turtle", "Other"],
  "Small Mammal": ["Hamster", "Guinea Pig", "Gerbil", "Ferret", "Other"],
  Other: ["Mixed", "Unknown", "Other"],
}

export const getBreedOptionsForSpecies = (species) => {
  return BREED_OPTIONS_BY_SPECIES[species] || []
}
