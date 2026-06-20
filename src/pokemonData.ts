import { PokemonSpecies, PokemonInstance } from "./types";

export const POKEMON_SPECIES_LIST: PokemonSpecies[] = [
  // Bulbasaur family
  {
    pokemonId: 1,
    name: "Bulbasaur",
    types: ["Grass", "Poison"],
    baseStats: { hp: 45, attack: 49, defense: 49, spAtk: 65, spDef: 65, speed: 45 },
    stage: 1,
    evolutionId: 2,
    evolutionLevel: 16,
  },
  {
    pokemonId: 2,
    name: "Ivysaur",
    types: ["Grass", "Poison"],
    baseStats: { hp: 60, attack: 62, defense: 63, spAtk: 80, spDef: 80, speed: 60 },
    stage: 2,
    evolutionId: 3,
    evolutionLevel: 32,
  },
  {
    pokemonId: 3,
    name: "Venusaur",
    types: ["Grass", "Poison"],
    baseStats: { hp: 80, attack: 82, defense: 83, spAtk: 100, spDef: 100, speed: 80 },
    stage: 3,
  },

  // Charmander family
  {
    pokemonId: 4,
    name: "Charmander",
    types: ["Fire"],
    baseStats: { hp: 39, attack: 52, defense: 43, spAtk: 60, spDef: 50, speed: 65 },
    stage: 1,
    evolutionId: 5,
    evolutionLevel: 16,
  },
  {
    pokemonId: 5,
    name: "Charmeleon",
    types: ["Fire"],
    baseStats: { hp: 58, attack: 64, defense: 58, spAtk: 80, spDef: 65, speed: 80 },
    stage: 2,
    evolutionId: 6,
    evolutionLevel: 36,
  },
  {
    pokemonId: 6,
    name: "Charizard",
    types: ["Fire", "Flying"],
    baseStats: { hp: 78, attack: 84, defense: 78, spAtk: 109, spDef: 85, speed: 100 },
    stage: 3,
  },

  // Squirtle family
  {
    pokemonId: 7,
    name: "Squirtle",
    types: ["Water"],
    baseStats: { hp: 44, attack: 48, defense: 65, spAtk: 50, spDef: 64, speed: 43 },
    stage: 1,
    evolutionId: 8,
    evolutionLevel: 16,
  },
  {
    pokemonId: 8,
    name: "Wartortle",
    types: ["Water"],
    baseStats: { hp: 59, attack: 63, defense: 80, spAtk: 65, spDef: 80, speed: 58 },
    stage: 2,
    evolutionId: 9,
    evolutionLevel: 36,
  },
  {
    pokemonId: 9,
    name: "Blastoise",
    types: ["Water"],
    baseStats: { hp: 79, attack: 83, defense: 100, spAtk: 85, spDef: 105, speed: 78 },
    stage: 3,
  },

  // Pichu family
  {
    pokemonId: 172,
    name: "Pichu",
    types: ["Electric"],
    baseStats: { hp: 20, attack: 40, defense: 15, spAtk: 35, spDef: 35, speed: 60 },
    stage: 1,
    evolutionId: 25,
    evolutionLevel: 16,
  },
  {
    pokemonId: 25,
    name: "Pikachu",
    types: ["Electric"],
    baseStats: { hp: 35, attack: 55, defense: 40, spAtk: 50, spDef: 50, speed: 90 },
    stage: 2,
    evolutionId: 26,
    evolutionLevel: 30,
  },
  {
    pokemonId: 26,
    name: "Raichu",
    types: ["Electric"],
    baseStats: { hp: 60, attack: 90, defense: 55, spAtk: 90, spDef: 80, speed: 110 },
    stage: 3,
  },

  // Gastly family
  {
    pokemonId: 92,
    name: "Gastly",
    types: ["Ghost", "Poison"],
    baseStats: { hp: 30, attack: 35, defense: 30, spAtk: 100, spDef: 35, speed: 80 },
    stage: 1,
    evolutionId: 93,
    evolutionLevel: 16,
  },
  {
    pokemonId: 93,
    name: "Haunter",
    types: ["Ghost", "Poison"],
    baseStats: { hp: 45, attack: 50, defense: 45, spAtk: 115, spDef: 55, speed: 95 },
    stage: 2,
    evolutionId: 94,
    evolutionLevel: 32,
  },
  {
    pokemonId: 94,
    name: "Gengar",
    types: ["Ghost", "Poison"],
    baseStats: { hp: 60, attack: 65, defense: 60, spAtk: 130, spDef: 75, speed: 110 },
    stage: 3,
  },

  // Eevee family
  {
    pokemonId: 133,
    name: "Eevee",
    types: ["Normal"],
    baseStats: { hp: 55, attack: 55, defense: 50, spAtk: 45, spDef: 65, speed: 55 },
    stage: 1,
    evolutionId: 135, // Jolteon as primary showcase, but we can resolve uniquely or randomized!
    evolutionLevel: 20,
  },
  {
    pokemonId: 135,
    name: "Jolteon",
    types: ["Electric"],
    baseStats: { hp: 65, attack: 65, defense: 60, spAtk: 110, spDef: 95, speed: 130 },
    stage: 2,
  },
  {
    pokemonId: 136,
    name: "Flareon",
    types: ["Fire"],
    baseStats: { hp: 65, attack: 130, defense: 60, spAtk: 95, spDef: 110, speed: 65 },
    stage: 2,
  },
  {
    pokemonId: 134,
    name: "Vaporeon",
    types: ["Water"],
    baseStats: { hp: 130, attack: 65, defense: 60, spAtk: 110, spDef: 95, speed: 65 },
    stage: 2,
  },

  // Dratini family
  {
    pokemonId: 147,
    name: "Dratini",
    types: ["Dragon"],
    baseStats: { hp: 41, attack: 64, defense: 45, spAtk: 50, spDef: 50, speed: 50 },
    stage: 1,
    evolutionId: 148,
    evolutionLevel: 18,
  },
  {
    pokemonId: 148,
    name: "Dragonair",
    types: ["Dragon"],
    baseStats: { hp: 61, attack: 84, defense: 65, spAtk: 70, spDef: 70, speed: 70 },
    stage: 2,
    evolutionId: 149,
    evolutionLevel: 30,
  },
  {
    pokemonId: 149,
    name: "Dragonite",
    types: ["Dragon", "Flying"],
    baseStats: { hp: 91, attack: 134, defense: 95, spAtk: 100, spDef: 100, speed: 80 },
    stage: 3,
  },

  // Ralts family
  {
    pokemonId: 280,
    name: "Ralts",
    types: ["Psychic", "Fairy"],
    baseStats: { hp: 28, attack: 25, defense: 25, spAtk: 45, spDef: 35, speed: 40 },
    stage: 1,
    evolutionId: 281,
    evolutionLevel: 16,
  },
  {
    pokemonId: 281,
    name: "Kirlia",
    types: ["Psychic", "Fairy"],
    baseStats: { hp: 38, attack: 35, defense: 35, spAtk: 65, spDef: 55, speed: 50 },
    stage: 2,
    evolutionId: 282,
    evolutionLevel: 30,
  },
  {
    pokemonId: 282,
    name: "Gardevoir",
    types: ["Psychic", "Fairy"],
    baseStats: { hp: 68, attack: 65, defense: 65, spAtk: 125, spDef: 115, speed: 80 },
    stage: 3,
  },

  // Treecko family
  {
    pokemonId: 252,
    name: "Treecko",
    types: ["Grass"],
    baseStats: { hp: 40, attack: 45, defense: 35, spAtk: 65, spDef: 55, speed: 70 },
    stage: 1,
    evolutionId: 253,
    evolutionLevel: 16,
  },
  {
    pokemonId: 253,
    name: "Grovyle",
    types: ["Grass"],
    baseStats: { hp: 50, attack: 65, defense: 45, spAtk: 85, spDef: 65, speed: 95 },
    stage: 2,
    evolutionId: 254,
    evolutionLevel: 36,
  },
  {
    pokemonId: 254,
    name: "Sceptile",
    types: ["Grass"],
    baseStats: { hp: 70, attack: 85, defense: 65, spAtk: 105, spDef: 85, speed: 120 },
    stage: 3,
  },

  // Torchic family
  {
    pokemonId: 255,
    name: "Torchic",
    types: ["Fire"],
    baseStats: { hp: 45, attack: 60, defense: 40, spAtk: 70, spDef: 50, speed: 45 },
    stage: 1,
    evolutionId: 256,
    evolutionLevel: 16,
  },
  {
    pokemonId: 256,
    name: "Combusken",
    types: ["Fire", "Fighting"],
    baseStats: { hp: 60, attack: 85, defense: 60, spAtk: 85, spDef: 60, speed: 55 },
    stage: 2,
    evolutionId: 257,
    evolutionLevel: 36,
  },
  {
    pokemonId: 257,
    name: "Blaziken",
    types: ["Fire", "Fighting"],
    baseStats: { hp: 80, attack: 120, defense: 70, spAtk: 110, spDef: 70, speed: 80 },
    stage: 3,
  },

  // Mudkip family
  {
    pokemonId: 258,
    name: "Mudkip",
    types: ["Water"],
    baseStats: { hp: 50, attack: 70, defense: 50, spAtk: 50, spDef: 50, speed: 40 },
    stage: 1,
    evolutionId: 259,
    evolutionLevel: 16,
  },
  {
    pokemonId: 259,
    name: "Marshtomp",
    types: ["Water", "Ground"],
    baseStats: { hp: 70, attack: 85, defense: 70, spAtk: 60, spDef: 70, speed: 50 },
    stage: 2,
    evolutionId: 260,
    evolutionLevel: 36,
  },
  {
    pokemonId: 260,
    name: "Swampert",
    types: ["Water", "Ground"],
    baseStats: { hp: 100, attack: 110, defense: 90, spAtk: 85, spDef: 90, speed: 60 },
    stage: 3,
  }
];

export const STARTERS_IDS = [1, 4, 7, 172, 92, 133, 147, 280, 252, 255, 258];

export function getMinLevelForSpecies(speciesId: number): number {
  const species = POKEMON_SPECIES_LIST.find((s) => s.pokemonId === speciesId);
  if (!species) return 1;
  if (species.stage === 1) return 1;

  // Walk up to find what evolves into this and return that evolution level
  const parent = POKEMON_SPECIES_LIST.find((s) => s.evolutionId === species.pokemonId);
  if (parent && parent.evolutionLevel) {
    return parent.evolutionLevel;
  }
  return 1;
}

export function getOfficialArtworkUrl(pokemonId: number): string {
  // Ultra high quality beautifully detailed transparent 3D digital art from PokeAPI!
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${pokemonId}.png`;
}

export function createNewPokemonInstance(speciesId: number, level: number = 1): PokemonInstance {
  const species = POKEMON_SPECIES_LIST.find((s) => s.pokemonId === speciesId);
  if (!species) {
    throw new Error(`Species with ID ${speciesId} not found`);
  }

  // Calculate stats based on level scaling
  const scale = 1 + (level - 1) * 0.12;
  const scaledStats = {
    hp: Math.floor(species.baseStats.hp * scale),
    attack: Math.floor(species.baseStats.attack * scale),
    defense: Math.floor(species.baseStats.defense * scale),
    spAtk: Math.floor(species.baseStats.spAtk * scale),
    spDef: Math.floor(species.baseStats.spDef * scale),
    speed: Math.floor(species.baseStats.speed * scale),
  };

  return {
    id: Math.random().toString(36).substr(2, 9),
    pokemonId: species.pokemonId,
    name: species.name,
    level,
    exp: 0,
    expNeeded: level * 100,
    types: [...species.types],
    baseStats: scaledStats,
    sprite: getOfficialArtworkUrl(species.pokemonId),
    stage: species.stage,
    isFused: false,
  };
}

export const TYPE_COLORS: Record<string, string> = {
  Normal: "#A8A77A",
  Fire: "#EE8130",
  Water: "#6390F0",
  Electric: "#F7D02C",
  Grass: "#7AC74C",
  Ice: "#96D9D6",
  Fighting: "#C22E28",
  Poison: "#A33EA1",
  Ground: "#E2BF65",
  Flying: "#A98FF3",
  Psychic: "#F95587",
  Bug: "#A6B91A",
  Rock: "#B6A136",
  Ghost: "#735797",
  Dragon: "#6F35FC",
  Dark: "#705746",
  Steel: "#B7B7CE",
  Fairy: "#D685AD",
};
