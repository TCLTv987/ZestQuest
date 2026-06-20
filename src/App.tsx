import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { PokemonInstance } from "./types";
import {
  POKEMON_SPECIES_LIST,
  STARTERS_IDS,
  createNewPokemonInstance,
  TYPE_COLORS,
  getOfficialArtworkUrl,
} from "./pokemonData";
import { FusionCard } from "./components/FusionCard";
import { EvolutionOverlay } from "./components/EvolutionOverlay";
import { BattleArena } from "./components/BattleArena";
import {
  Sparkles,
  Egg,
  Info,
  Trash2,
  Heart,
  Shield,
  Zap,
  Swords,
  ChevronRight,
  TrendingUp,
  Award,
  Lock,
  RotateCcw,
  Plus,
  AlertTriangle,
} from "lucide-react";

export default function App() {
  const [pokemonList, setPokemonList] = useState<PokemonInstance[]>([]);
  const [selectedPokemonId, setSelectedPokemonId] = useState<string | null>(null);

  // Fusion pod selections
  const [leftPodId, setLeftPodId] = useState<string | null>(null);
  const [rightPodId, setRightPodId] = useState<string | null>(null);

  // Egg hatching sequence
  const [isHatching, setIsHatching] = useState(false);
  const [hatchedPokemon, setHatchedPokemon] = useState<PokemonInstance | null>(null);

  // Evolution pending state
  const [evolutionPending, setEvolutionPending] = useState<{
    before: PokemonInstance;
    after: PokemonInstance;
  } | null>(null);

  // Combat active state
  const [battleActivePokemonId, setBattleActivePokemonId] = useState<string | null>(null);

  // Server fusion call states
  const [isFusing, setIsFusing] = useState(false);
  const [fusionError, setFusionError] = useState<string | null>(null);

  // Active Pokédex Filters
  const [filterType, setFilterType] = useState<string>("All");

  // Load from local storage or initialize starting team
  useEffect(() => {
    const saved = localStorage.getItem("pokemon_fusion_save");
    if (saved) {
      try {
        setPokemonList(JSON.parse(saved));
      } catch (e) {
        initializeStarters();
      }
    } else {
      initializeStarters();
    }
  }, []);

  // Save utility called automatically when list modifies
  const saveToStorage = (updatedList: PokemonInstance[]) => {
    setPokemonList(updatedList);
    localStorage.setItem("pokemon_fusion_save", JSON.stringify(updatedList));
  };

  const initializeStarters = () => {
    // Generate the iconic 3 starters (Charmander, Bulbasaur, Squirtle)
    const bulb = createNewPokemonInstance(1, 5);
    const charm = createNewPokemonInstance(4, 5);
    const squirt = createNewPokemonInstance(7, 5);
    saveToStorage([bulb, charm, squirt]);
  };

  const handleReset = () => {
    if (confirm("Reset simulation data? This will restore original starting Squad.")) {
      initializeStarters();
      setSelectedPokemonId(null);
      setLeftPodId(null);
      setRightPodId(null);
    }
  };

  // Hatch Egg routine
  const triggerHatchEgg = () => {
    if (pokemonList.length >= 24) {
      alert("Storage full! Release some Pokémon to claim more starter eggs.");
      return;
    }
    setIsHatching(true);
    setHatchedPokemon(null);

    setTimeout(() => {
      // Pick random starter ID
      const randomId = STARTERS_IDS[Math.floor(Math.random() * STARTERS_IDS.length)];
      // Start level is scaled slightly to speed up gameplay
      const randomLevel = Math.floor(Math.random() * 4) + 5; // Level 5 to 8 spawn
      const newPoke = createNewPokemonInstance(randomId, randomLevel);

      setHatchedPokemon(newPoke);
      setIsHatching(false);
    }, 2200);
  };

  // Confirm Egg Hatch and claim
  const claimHatchedPokemon = () => {
    if (hatchedPokemon) {
      const updated = [...pokemonList, hatchedPokemon];
      saveToStorage(updated);
      setSelectedPokemonId(hatchedPokemon.id);
      setHatchedPokemon(null);
    }
  };

  // Release a Pokemon from dex
  const releasePokemon = (id: string) => {
    if (pokemonList.length <= 1) {
      alert("You must keep at least 1 companion Pokemon!");
      return;
    }
    if (confirm("Are you sure you want to release this Pokėmon back into the wild?")) {
      const updated = pokemonList.filter((p) => p.id !== id);
      saveToStorage(updated);
      if (selectedPokemonId === id) setSelectedPokemonId(null);
      if (leftPodId === id) setLeftPodId(null);
      if (rightPodId === id) setRightPodId(null);
    }
  };

  // Clear slots
  const clearPod = (side: "left" | "right") => {
    if (side === "left") setLeftPodId(null);
    else setRightPodId(null);
  };

  // Deploy Pokemon into fusion slot
  const assignToPod = (id: string, side: "left" | "right") => {
    if (side === "left") {
      if (rightPodId === id) setRightPodId(null);
      setLeftPodId(id);
    } else {
      if (leftPodId === id) setLeftPodId(null);
      setRightPodId(id);
    }
  };

  // Trigger server-side fusion
  const executePokemonFusion = async () => {
    const parent1 = pokemonList.find((p) => p.id === leftPodId);
    const parent2 = pokemonList.find((p) => p.id === rightPodId);

    if (!parent1 || !parent2) {
      setFusionError("Please place two Pokemon in the fusion sockets first.");
      return;
    }

    setIsFusing(true);
    setFusionError(null);

    try {
      const response = await fetch("/api/fuse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pokemon1: parent1, pokemon2: parent2 }),
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.error || "The server could not process the genetic resonance.");
      }

      const fusionData = await response.json();

      // Form the fused Pokemon Instance
      const averageLevel = Math.floor((parent1.level + parent2.level) / 2) + 2;

      const fPoke: PokemonInstance = {
        id: Math.random().toString(36).substr(2, 9),
        pokemonId: parent1.pokemonId * 1000 + parent2.pokemonId, // custom hybrid index
        name: fusionData.fusedName,
        level: averageLevel,
        exp: 0,
        expNeeded: averageLevel * 100,
        types: fusionData.types,
        baseStats: fusionData.stats,
        sprite: getOfficialArtworkUrl(parent2.pokemonId), // uses actual high-quality imagery
        stage: Math.max(parent1.stage, parent2.stage),
        isFused: true,
        fusionParents: {
          pokemon1: { name: parent1.name, sprite: parent1.sprite, types: parent1.types },
          pokemon2: { name: parent2.name, sprite: parent2.sprite, types: parent2.types },
        },
        pokedexEntry: fusionData.pokedexEntry,
        ability: fusionData.ability,
        signatureMove: fusionData.signatureMove,
        colors: fusionData.colors,
      };

      // Genetic breeding consumes the parent Pokemons!
      const remaining = pokemonList.filter((p) => p.id !== leftPodId && p.id !== rightPodId);
      const updated = [...remaining, fPoke];

      saveToStorage(updated);
      setSelectedPokemonId(fPoke.id);

      // Clean the pods on complete
      setLeftPodId(null);
      setRightPodId(null);
    } catch (e: any) {
      console.error(e);
      setFusionError(e.message || "Failed to establish neural fusion. Try again.");
    } finally {
      setIsFusing(false);
    }
  };

  // Leveling of Pokemon from Battle victory
  const handleBattleVictory = (expGained: number) => {
    if (!battleActivePokemonId) return;

    const findIndex = pokemonList.findIndex((p) => p.id === battleActivePokemonId);
    if (findIndex === -1) return;

    const instance = { ...pokemonList[findIndex] };
    instance.exp += expGained;

    // Check leveling loop
    let levelledUp = false;
    while (instance.exp >= instance.expNeeded) {
      instance.exp -= instance.expNeeded;
      instance.level += 1;
      instance.expNeeded = instance.level * 100;
      levelledUp = true;

      // Recalculate stats based on Level Scaling
      const scale = 1.1; // flat upgrade scaling per level
      instance.baseStats = {
        hp: Math.floor(instance.baseStats.hp * scale),
        attack: Math.floor(instance.baseStats.attack * scale),
        defense: Math.floor(instance.baseStats.defense * scale),
        spAtk: Math.floor(instance.baseStats.spAtk * scale),
        spDef: Math.floor(instance.baseStats.spDef * scale),
        speed: Math.floor(instance.baseStats.speed * scale),
      };
    }

    const updated = [...pokemonList];
    updated[findIndex] = instance;
    saveToStorage(updated);

    // Evolution Check
    if (levelledUp) {
      const species = POKEMON_SPECIES_LIST.find((s) => s.pokemonId === instance.pokemonId);
      if (species && species.evolutionId && species.evolutionLevel) {
        if (instance.level >= species.evolutionLevel) {
          // Trigger instant evolution sequence!
          const evolvedSpecies = POKEMON_SPECIES_LIST.find((s) => s.pokemonId === species.evolutionId);
          if (evolvedSpecies) {
            const evolvedInstance: PokemonInstance = {
              ...instance,
              pokemonId: evolvedSpecies.pokemonId,
              name: evolvedSpecies.name,
              types: [...evolvedSpecies.types],
              sprite: getOfficialArtworkUrl(evolvedSpecies.pokemonId),
              stage: evolvedSpecies.stage,
            };

            // Set evolution pending to trigger the fullscreen overlay
            setEvolutionPending({
              before: instance,
              after: evolvedInstance,
            });
          }
        }
      }
    }
  };

  // Finish evolution pending and save
  const completeEvolution = () => {
    if (evolutionPending) {
      const matchedIdx = pokemonList.findIndex((p) => p.id === evolutionPending.before.id);
      if (matchedIdx !== -1) {
        const updated = [...pokemonList];
        updated[matchedIdx] = evolutionPending.after;
        saveToStorage(updated);
        setSelectedPokemonId(evolutionPending.after.id);
      }
      setEvolutionPending(null);
    }
  };

  // Helper variables
  const selectedPokemon = pokemonList.find((p) => p.id === selectedPokemonId);
  const leftPodPokemon = pokemonList.find((p) => p.id === leftPodId);
  const rightPodPokemon = pokemonList.find((p) => p.id === rightPodId);
  const battlePokemon = pokemonList.find((p) => p.id === battleActivePokemonId);

  // Extract unique types available inside currently owned squad for filter tabs
  const allOwnedTypes: string[] = ["All", ...Array.from(new Set<string>(pokemonList.flatMap((p) => p.types)))];

  const filteredPokemonList = pokemonList.filter((p) => {
    if (filterType === "All") return true;
    return p.types.includes(filterType);
  });

  return (
    <div className="min-h-screen bg-[#020617] font-sans text-slate-100 flex flex-col p-4 md:p-8 relative selection:bg-indigo-500/30 selection:text-white overflow-x-hidden">
      {/* Background Matrix Starfield glows */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,#1e293b_0%,#020617_70%)] pointer-events-none" />

      {/* Main Container */}
      <div className="max-w-7xl mx-auto w-full flex-1 flex flex-col space-y-8 z-10">
        {/* TOP COMMAND ACTION BAR */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900/40 border border-white/10 backdrop-blur-md p-6 rounded-3xl relative overflow-hidden">
          {/* Cyber Header Info */}
          <div className="space-y-1 relative z-10">
            <div className="flex items-center gap-2">
              <span className="p-1 px-2.5 rounded text-[10px] uppercase font-mono font-bold bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 tracking-wider">
                Resonance Prototype v2.1
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-display font-black tracking-tight uppercase italic text-white">
              Nexus <span className="text-indigo-400">Genesis Fusion Lab</span>
            </h1>
            <p className="text-xs text-slate-400 font-mono">
              Incubate starters, discipline companions in combat mechanics, and perform element synthesis.
            </p>
          </div>

          {/* Quick Stats Toolbar */}
          <div className="flex gap-4 items-center relative z-10 w-full md:w-auto justify-end">
            <div className="flex flex-col items-end pr-4 border-r border-white/10 text-right">
              <span className="text-[10px] uppercase text-slate-400 tracking-widest font-mono">My Dex Size</span>
              <span className="text-xl font-bold font-mono text-indigo-400">
                {pokemonList.length} <span className="text-xs text-slate-500">/ 24</span>
              </span>
            </div>

            <button
              onClick={triggerHatchEgg}
              disabled={isHatching}
              className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white hover:bg-indigo-500 disabled:opacity-40 transition font-bold text-xs uppercase tracking-widest rounded-full shadow-lg shadow-indigo-600/20 active:scale-95 cursor-pointer"
            >
              <Egg className={`w-4 h-4 ${isHatching ? "animate-bounce" : ""}`} /> Hatch Egg
            </button>

            <button
              onClick={handleReset}
              title="Reset Database"
              className="p-3 bg-slate-800 border border-white/10 hover:bg-slate-700 hover:text-red-400 rounded-full text-slate-400 transition cursor-pointer active:scale-95"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* COMBAT VIEW */}
        <AnimatePresence mode="wait">
          {battleActivePokemonId && battlePokemon && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <BattleArena
                activePokemon={battlePokemon}
                onExit={() => setBattleActivePokemonId(null)}
                onVictory={handleBattleVictory}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* INCUBATOR DETAILS AND REACTOR CORES / SPLIT SECTIONS */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* LEFT: GENESIS FUSION REACTOR CHAMBER (5 cols) */}
          <section className="lg:col-span-5 bg-slate-900/40 border border-white/5 rounded-3xl p-6 backdrop-blur-xl relative overflow-hidden">
            {/* Pulsing grid network */}
            <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px] opacity-20" />

            <div className="relative z-10 flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold font-display flex items-center gap-2 text-indigo-400 uppercase tracking-tight italic">
                <Sparkles className="w-5 h-5 text-indigo-400 animate-spin" /> Neural Fusion Pods
              </h2>
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">
                Element Reactor
              </span>
            </div>

            {/* Visual Double Pod Slots */}
            <div className="grid grid-cols-2 gap-4 h-64 mb-6 relative z-10">
              {/* LEFT SOCKET */}
              <div className="bg-slate-950/80 border border-white/10 rounded-2xl flex flex-col items-center justify-center p-4 relative group">
                {leftPodPokemon ? (
                  <div className="h-full w-full flex flex-col justify-between items-center text-center">
                    <button
                      onClick={() => clearPod("left")}
                      className="absolute top-2 right-2 p-1 bg-red-500/10 hover:bg-red-500/30 rounded text-red-400 transition cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <div className="flex-1 flex items-center justify-center">
                      <img
                        src={leftPodPokemon.sprite}
                        alt=""
                        referrerPolicy="no-referrer"
                        className="w-24 h-24 object-contain filter drop-shadow-[0_4px_12px_rgba(0,0,0,0.5)] animate-pulse"
                      />
                    </div>
                    <div className="space-y-0.5 mt-2">
                      <span className="font-semibold text-xs text-slate-200 block truncate max-w-[120px]">
                        {leftPodPokemon.name}
                      </span>
                      <span className="text-[10px] font-mono text-indigo-300 block">Lv. {leftPodPokemon.level}</span>
                    </div>
                  </div>
                ) : (
                  <div className="text-center space-y-2">
                    <div className="w-10 h-10 rounded-full bg-slate-900 border border-white/10 flex items-center justify-center text-slate-600 mx-auto group-hover:text-amber-400 transition-colors">
                      <Plus className="w-5 h-5" />
                    </div>
                    <p className="text-[10px] text-slate-500 font-mono max-w-[100px] mx-auto uppercase tracking-tighter">
                      Select companion, click "Insert Left"
                    </p>
                  </div>
                )}
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500/30 to-transparent" />
              </div>

              {/* RIGHT SOCKET */}
              <div className="bg-slate-950/80 border border-white/10 rounded-2xl flex flex-col items-center justify-center p-4 relative group">
                {rightPodPokemon ? (
                  <div className="h-full w-full flex flex-col justify-between items-center text-center">
                    <button
                      onClick={() => clearPod("right")}
                      className="absolute top-2 right-2 p-1 bg-red-500/10 hover:bg-red-500/30 rounded text-red-400 transition cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <div className="flex-1 flex items-center justify-center">
                      <img
                        src={rightPodPokemon.sprite}
                        alt=""
                        referrerPolicy="no-referrer"
                        className="w-24 h-24 object-contain filter drop-shadow-[0_4px_12px_rgba(0,0,0,0.5)] animate-pulse"
                      />
                    </div>
                    <div className="space-y-0.5 mt-2">
                      <span className="font-semibold text-xs text-slate-200 block truncate max-w-[120px]">
                        {rightPodPokemon.name}
                      </span>
                      <span className="text-[10px] font-mono text-indigo-300 block">Lv. {rightPodPokemon.level}</span>
                    </div>
                  </div>
                ) : (
                  <div className="text-center space-y-2">
                    <div className="w-10 h-10 rounded-full bg-slate-900 border border-white/10 flex items-center justify-center text-slate-600 mx-auto group-hover:text-amber-400 transition-colors">
                      <Plus className="w-5 h-5" />
                    </div>
                    <p className="text-[10px] text-slate-500 font-mono max-w-[100px] mx-auto uppercase tracking-tighter">
                      Select companion, click "Insert Right"
                    </p>
                  </div>
                )}
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent to-indigo-500/30" />
              </div>
            </div>

            {/* Fusion Action triggers and loaders */}
            <div className="relative z-10 space-y-3">
              {leftPodPokemon && rightPodPokemon ? (
                <button
                  onClick={executePokemonFusion}
                  disabled={isFusing}
                  className="w-full py-3.5 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-full font-bold uppercase tracking-widest text-xs shadow-[0_0_25px_rgba(99,102,241,0.4)] active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isFusing ? (
                    <>
                      <div className="w-4.5 h-4.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Engaging Neural Core...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4.5 h-4.5 text-amber-300" /> Initiate Fusion
                    </>
                  )}
                </button>
              ) : (
                <div className="w-full py-3.5 bg-slate-950 border border-white/5 text-slate-500 text-center text-xs font-mono rounded-full flex items-center justify-center gap-2 select-none uppercase tracking-wider">
                  <Lock className="w-4 h-4" /> Insert companions to fuse
                </div>
              )}

              {/* Error warning boards */}
              {fusionError && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-300 text-xs rounded-2xl p-3 flex items-start gap-2 select-none">
                  <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0 text-red-400" />
                  <p className="font-mono">{fusionError}</p>
                </div>
              )}

              {/* Fusion Chamber descriptive text */}
              <p className="text-[10px] text-center text-slate-500 font-mono leading-relaxed pt-2 uppercase tracking-tight">
                ⚠️ BREEDING PROTOCOL CONTAINS REVERSIBILITY SAFEGUARDS: Consuming the parental genetic DNA is
                required to yield superior fusions. Explore wild battles to hatch replacements.
              </p>
            </div>
          </section>

          {/* RIGHT: THE DETAILED POKÉDEX & SQUAD SHELF (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            {/* SQUAD SHELF WITH CARDS GRID */}
            <section className="bg-slate-900/40 border border-white/5 rounded-3xl p-6 backdrop-blur-xl space-y-4">
              <div className="flex flex-col md:flex-row justify-between md:items-center gap-3 border-b border-white/5 pb-4">
                <div className="space-y-0.5">
                  <h2 className="text-lg font-bold font-display text-slate-100 flex items-center gap-2 uppercase tracking-tight italic">
                    <Swords className="w-5 h-5 text-indigo-400" /> Active Roster Grid
                  </h2>
                  <p className="text-xs text-slate-400 font-mono">
                    Select your companion to evaluate stats, training options, or reactor placement.
                  </p>
                </div>

                {/* Filter Tabs */}
                <div className="flex flex-wrap gap-1.5 self-start">
                  {allOwnedTypes.slice(0, 7).map((type) => (
                    <button
                      key={type}
                      onClick={() => setFilterType(type)}
                      style={{
                        backgroundColor:
                          filterType === type ? TYPE_COLORS[type] || "#777777" : "transparent",
                      }}
                      className={`text-[10px] uppercase tracking-widest font-mono px-2.5 py-1 rounded-md transition cursor-pointer border ${
                        filterType === type
                          ? "border-transparent text-black font-extrabold"
                          : "border-white/10 text-slate-400 hover:text-white"
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              {/* Roster scroll shelf */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 max-h-[420px] overflow-y-auto scrollbar-thin rounded-xl pr-1.5">
                {filteredPokemonList.map((poke) => (
                  <FusionCard
                    key={poke.id}
                    pokemon={poke}
                    selected={selectedPokemonId === poke.id}
                    onClick={() => {
                      setSelectedPokemonId(poke.id);
                    }}
                    onInsertLeft={() => assignToPod(poke.id, "left")}
                    onInsertRight={() => assignToPod(poke.id, "right")}
                    onBattle={() => setBattleActivePokemonId(poke.id)}
                  />
                ))}

                {filteredPokemonList.length === 0 && (
                  <div className="col-span-full py-16 text-center text-slate-500 font-mono text-xs uppercase tracking-wider">
                    No companion Pokemon of this filter type found in storage.
                  </div>
                )}
              </div>
            </section>

            {/* COMPANION DETAILED EVALUATION CARD */}
            <section className="bg-slate-900/40 border border-white/5 rounded-3xl p-6 backdrop-blur-xl relative overflow-hidden">
              {selectedPokemon ? (
                <div className="space-y-6">
                  {/* Title details bar */}
                  <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
                    <div className="space-y-1">
                      <div className="flex gap-2 items-center">
                        <span className="text-[10px] font-mono tracking-widest text-slate-400 uppercase bg-slate-800 border border-white/10 px-2.5 py-0.5 rounded-full">
                          Species Registry #{selectedPokemon.pokemonId}
                        </span>
                        {selectedPokemon.isFused && (
                          <span className="text-[9px] px-2 py-0.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-bold tracking-widest rounded font-mono uppercase">
                            Genetic Hybrid
                          </span>
                        )}
                      </div>
                      <h3 className="font-display text-2xl font-black mt-2 tracking-wide uppercase italic text-white">
                        {selectedPokemon.name}
                      </h3>
                    </div>

                    {/* Toolbar Actions inside Drawer details */}
                    <div className="flex gap-2 flex-wrap text-xs font-mono">
                      <button
                        onClick={() => assignToPod(selectedPokemon.id, "left")}
                        className="px-4 py-2 bg-slate-800 border border-white/10 rounded-full text-xs font-bold uppercase tracking-widest hover:bg-slate-700 text-slate-200 transition-colors cursor-pointer active:scale-95"
                      >
                        Insert Left
                      </button>
                      <button
                        onClick={() => assignToPod(selectedPokemon.id, "right")}
                        className="px-4 py-2 bg-slate-800 border border-white/10 rounded-full text-xs font-bold uppercase tracking-widest hover:bg-slate-700 text-slate-200 transition-colors cursor-pointer active:scale-95"
                      >
                        Insert Right
                      </button>
                      <button
                        onClick={() => setBattleActivePokemonId(selectedPokemon.id)}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-full text-xs font-bold uppercase tracking-widest shadow-lg shadow-indigo-600/20 hover:bg-indigo-500 hover:shadow-indigo-500/25 transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                      >
                        <Swords className="w-3.5 h-3.5" /> Battle & Train
                      </button>
                      <button
                        onClick={() => releasePokemon(selectedPokemon.id)}
                        className="p-2 bg-red-500/10 border border-red-500/10 hover:bg-red-500/20 hover:text-red-400 rounded-full text-slate-400 transition cursor-pointer active:scale-95 flex items-center justify-center w-8 h-8"
                        title="Release back into Wild"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Split parameters panel */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-white/5">
                    {/* STATS BREAKDOWN GRID PANEL */}
                    <div className="space-y-3 bg-slate-950/40 p-4 rounded-2xl border border-white/5">
                      <h4 className="text-[10px] font-mono font-bold text-indigo-400 uppercase tracking-widest flex items-center gap-1">
                        <TrendingUp className="w-3.5 h-3.5 text-indigo-400" /> Stats Breakthrough
                      </h4>
                      <div className="space-y-2 text-xs font-mono text-slate-300">
                        {/* HP */}
                        <div className="space-y-1">
                          <div className="flex justify-between">
                            <span>HP</span>
                            <span className="font-bold">{selectedPokemon.baseStats.hp}</span>
                          </div>
                          <div className="w-full bg-slate-950 border border-white/5 h-2 rounded-full overflow-hidden">
                            <div
                              style={{ width: `${Math.min(100, (selectedPokemon.baseStats.hp / 250) * 100)}%` }}
                              className="h-full bg-emerald-500"
                            />
                          </div>
                        </div>
                        {/* Attack */}
                        <div className="space-y-1">
                          <div className="flex justify-between">
                            <span>Attack</span>
                            <span className="font-bold">{selectedPokemon.baseStats.attack}</span>
                          </div>
                          <div className="w-full bg-slate-950 border border-white/5 h-2 rounded-full overflow-hidden">
                            <div
                              style={{ width: `${Math.min(100, (selectedPokemon.baseStats.attack / 250) * 100)}%` }}
                              className="h-full bg-red-400"
                            />
                          </div>
                        </div>
                        {/* Defense */}
                        <div className="space-y-1">
                          <div className="flex justify-between">
                            <span>Defense</span>
                            <span className="font-bold">{selectedPokemon.baseStats.defense}</span>
                          </div>
                          <div className="w-full bg-slate-950 border border-white/5 h-2 rounded-full overflow-hidden">
                            <div
                              style={{ width: `${Math.min(100, (selectedPokemon.baseStats.defense / 250) * 100)}%` }}
                              className="h-full bg-blue-400"
                            />
                          </div>
                        </div>
                        {/* Sp. Atk */}
                        <div className="space-y-1">
                          <div className="flex justify-between">
                            <span>Sp. Atk</span>
                            <span className="font-bold">{selectedPokemon.baseStats.spAtk}</span>
                          </div>
                          <div className="w-full bg-slate-950 border border-white/5 h-2 rounded-full overflow-hidden">
                            <div
                              style={{ width: `${Math.min(100, (selectedPokemon.baseStats.spAtk / 250) * 100)}%` }}
                              className="h-full bg-indigo-400"
                            />
                          </div>
                        </div>
                        {/* Sp. Def */}
                        <div className="space-y-1">
                          <div className="flex justify-between">
                            <span>Sp. Def</span>
                            <span className="font-bold">{selectedPokemon.baseStats.spDef}</span>
                          </div>
                          <div className="w-full bg-slate-950 border border-white/5 h-2 rounded-full overflow-hidden">
                            <div
                              style={{ width: `${Math.min(100, (selectedPokemon.baseStats.spDef / 250) * 100)}%` }}
                              className="h-full bg-indigo-400"
                            />
                          </div>
                        </div>
                        {/* Speed */}
                        <div className="space-y-1">
                          <div className="flex justify-between">
                            <span>Speed</span>
                            <span className="font-bold">{selectedPokemon.baseStats.speed}</span>
                          </div>
                          <div className="w-full bg-slate-950 border border-white/5 h-2 rounded-full overflow-hidden">
                            <div
                              style={{ width: `${Math.min(100, (selectedPokemon.baseStats.speed / 250) * 100)}%` }}
                              className="h-full bg-amber-400"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* BIOGRAPHY, BREEDING GENOME, DESCRIPTORS */}
                    <div className="space-y-4">
                      {/* Dex Entry */}
                      <div className="space-y-1">
                        <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest block">
                          Pokédex Profile
                        </span>
                        <p className="text-xs text-slate-300 leading-relaxed font-sans bg-slate-950/40 p-4 rounded-2xl border border-white/5">
                          {selectedPokemon.pokedexEntry ||
                            `A standard companion Pokémon registered in the local bio database. Level up this ${selectedPokemon.name} to evolve, or fuse it with another specimen in the genetic chambers to unlock highly advanced hybrid signatures.`}
                        </p>
                      </div>

                      {/* Parent details if fused */}
                      {selectedPokemon.isFused && selectedPokemon.fusionParents && (
                        <div className="space-y-1">
                          <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest block">
                            Breeding Components
                          </span>
                          <div className="flex gap-4 items-center bg-slate-950/40 p-3 rounded-2xl border border-white/5 text-[11px]">
                            <div className="flex items-center gap-1.5">
                              <img
                                src={selectedPokemon.fusionParents.pokemon1.sprite}
                                alt=""
                                referrerPolicy="no-referrer"
                                className="w-8 h-8 object-contain"
                              />
                              <span className="font-semibold text-slate-300">
                                {selectedPokemon.fusionParents.pokemon1.name}
                              </span>
                            </div>
                            <span className="text-white/20">&times;</span>
                            <div className="flex items-center gap-1.5">
                              <img
                                src={selectedPokemon.fusionParents.pokemon2.sprite}
                                alt=""
                                referrerPolicy="no-referrer"
                                className="w-8 h-8 object-contain"
                              />
                              <span className="font-semibold text-slate-300">
                                {selectedPokemon.fusionParents.pokemon2.name}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Ability and moves if fused */}
                      {selectedPokemon.isFused && selectedPokemon.ability && (
                        <div className="grid grid-cols-2 gap-3">
                          <div className="bg-gradient-to-br from-indigo-500/10 to-purple-500/5 p-3 rounded-2xl border border-indigo-500/10">
                            <span className="text-[9px] uppercase tracking-widest font-mono text-indigo-400 block mb-0.5 font-bold">
                              Ability: {selectedPokemon.ability.name}
                            </span>
                            <p className="text-[10px] text-slate-300 leading-normal">
                              {selectedPokemon.ability.description}
                            </p>
                          </div>
                          {selectedPokemon.signatureMove && (
                            <div className="bg-gradient-to-br from-indigo-500/10 to-blue-500/5 p-3 rounded-2xl border border-indigo-500/10">
                              <span className="text-[9px] uppercase tracking-widest font-mono text-indigo-300 block mb-0.5 animate-pulse font-bold">
                                Signature Attack
                              </span>
                              <span className="text-xs font-semibold text-white truncate max-w-[120px] block">
                                {selectedPokemon.signatureMove.name}
                              </span>
                              <p className="text-[9px] text-slate-400">
                                Type: {selectedPokemon.signatureMove.type} | Power:{" "}
                                {selectedPokemon.signatureMove.power}
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-16 text-center text-slate-500 font-mono text-xs flex flex-col items-center justify-center gap-2 uppercase tracking-tight">
                  <Info className="w-5 h-5 text-slate-600" /> Let’s evaluate! Click any Pokémon in your Active Roster grid above.
                </div>
              )}
            </section>
          </div>
        </div>
      </div>

      {/* MODAL OVERLAY: FULLSCREEN EGG HATCHING SEQUENCE */}
      <AnimatePresence>
        {isHatching && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-950/95 backdrop-blur-2xl z-50 flex flex-col items-center justify-center text-center p-6 select-none"
          >
            <motion.div
              animate={{
                rotate: [0, -6, 6, -3, 3, 0],
                y: [0, -10, 10, -5, 5, 0],
              }}
              transition={{ repeat: Infinity, duration: 1.2, ease: "easeInOut" }}
              className="relative w-48 h-48 flex items-center justify-center pointer-events-none mb-6"
            >
              <div className="absolute inset-0 rounded-full bg-indigo-500/10 blur-2xl flex-shrink-0" />
              {/* Retro Pokémon Egg style */}
              <div className="w-32 h-44 bg-slate-50 rounded-[50%_50%_50%_50%_/_60%_60%_40%_40%] border-4 border-slate-200 relative overflow-hidden shadow-2xl flex items-center justify-center">
                <div className="absolute top-1/4 left-4 w-6 h-6 rounded-full bg-indigo-500/20" />
                <div className="absolute bottom-1/4 right-6 w-8 h-8 rounded-full bg-indigo-500/20" />
                <div className="absolute top-2/4 right-2 w-5 h-5 rounded-full bg-indigo-400/20" />
              </div>
            </motion.div>
            <h3 className="text-2xl font-display font-bold text-indigo-400 tracking-tight animate-pulse uppercase tracking-wide">
              Genetic Egg Incubation...
            </h3>
            <p className="text-xs text-slate-400 font-mono mt-1 uppercase tracking-wider">
              Synchronizing parental species alignment configurations...
            </p>
          </motion.div>
        )}

        {hatchedPokemon && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-950/95 backdrop-blur-2xl z-50 flex items-center justify-center p-6 text-white"
          >
            <div className="flex flex-col items-center text-center max-w-sm w-full space-y-6">
              <span className="px-3.5 py-1 bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 rounded-full text-[10px] tracking-widest font-mono uppercase flex items-center gap-1 font-bold">
                <Sparkles className="w-3.5 h-3.5 animate-spin text-indigo-300" /> EGG HATCHED
              </span>
              <h3 className="text-3xl font-display font-bold tracking-tight uppercase italic leading-tight">
                A Pokémon Hatch was Successful!
              </h3>

              <div className="relative w-56 h-56 flex items-center justify-center my-4">
                <div className="absolute inset-0 bg-indigo-500/10 rounded-full blur-xl animate-pulse" />
                <img
                  src={hatchedPokemon.sprite}
                  alt={hatchedPokemon.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-contain filter drop-shadow-[0_12px_24px_rgba(0,0,0,0.5)] scale-110"
                />
              </div>

              <div className="bg-slate-900 border border-white/5 rounded-3xl p-5 w-full">
                <span className="text-[10px] text-slate-400 font-mono uppercase tracking-widest block mb-1">Species Classified</span>
                <span className="text-xl font-bold block">{hatchedPokemon.name}</span>
                <div className="flex justify-center gap-1.5 mt-2">
                  {hatchedPokemon.types.map((t) => (
                    <span
                      key={t}
                      style={{ backgroundColor: TYPE_COLORS[t] || "#777" }}
                      className="px-2.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>

              <button
                onClick={claimHatchedPokemon}
                className="w-full py-3.5 bg-indigo-600 text-white rounded-full text-xs font-bold uppercase tracking-widest shadow-lg shadow-indigo-600/20 hover:bg-indigo-500 active:scale-95 transition cursor-pointer"
              >
                Claim companion to Dex Box
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODAL OVERLAY: FULLSCREEN EVOLUTION BREAKTHROUGH CINEMATIC */}
      {evolutionPending && (
        <EvolutionOverlay
          pokemonBefore={evolutionPending.before}
          pokemonAfter={evolutionPending.after}
          onComplete={completeEvolution}
        />
      )}
    </div>
  );
}
