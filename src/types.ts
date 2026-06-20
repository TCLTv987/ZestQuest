export interface PokemonSpecies {
  pokemonId: number;
  name: string;
  types: string[];
  baseStats: {
    hp: number;
    attack: number;
    defense: number;
    spAtk: number;
    spDef: number;
    speed: number;
  };
  stage: number; // 1, 2, or 3
  evolutionId?: number; // species ID of next form
  evolutionLevel?: number; // level needed to evolve
}

export interface PokemonInstance {
  id: string; // unique instance GUID/id
  pokemonId: number; // species ID
  name: string; // current name (either species or fused name)
  level: number;
  exp: number;
  expNeeded: number;
  types: string[];
  baseStats: {
    hp: number;
    attack: number;
    defense: number;
    spAtk: number;
    spDef: number;
    speed: number;
  };
  sprite: string; // high-quality official 3D artwork image URL
  stage: number;
  isFused: boolean;
  fusionParents?: {
    pokemon1: {
      name: string;
      sprite: string;
      types: string[];
    };
    pokemon2: {
      name: string;
      sprite: string;
      types: string[];
    };
  };
  pokedexEntry?: string;
  ability?: {
    name: string;
    description: string;
  };
  signatureMove?: {
    name: string;
    type: string;
    power: number;
    accuracy: number;
    description: string;
  };
  colors?: {
    primary: string;
    secondary: string;
  };
}

export interface BattleOpponent {
  name: string;
  pokemonId: number;
  level: number;
  types: string[];
  baseStats: {
    hp: number;
    attack: number;
    defense: number;
    spAtk: number;
    spDef: number;
    speed: number;
  };
  sprite: string;
  hpRemaining: number;
  hpMax: number;
}
