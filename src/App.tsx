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
  Trophy,
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
  const [forceShinyCheat, setForceShinyCheat] = useState(false);

  // Achievements / Statistics state
  const [stats, setStats] = useState({
    hatchedCount: 0,
    fusionsCount: 0,
    shiniesCount: 0,
    battlesWon: 0,
  });

  const saveStats = (updatedStats: any) => {
    setStats((prev) => {
      const next = typeof updatedStats === "function" ? updatedStats(prev) : updatedStats;
      localStorage.setItem("pokemon_fusion_stats", JSON.stringify(next));
      return next;
    });
  };

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

    const savedStats = localStorage.getItem("pokemon_fusion_stats");
    if (savedStats) {
      try {
        setStats(JSON.parse(savedStats));
      } catch (e) {
        // Keep defaults
      }
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
      const initialStats = {
        hatchedCount: 0,
        fusionsCount: 0,
        shiniesCount: 0,
        battlesWon: 0,
      };
      saveStats(initialStats);
    }
  };

  // Hatch Egg routine
  const triggerHatchEgg = async () => {
    if (pokemonList.length >= 24) {
      alert("Storage full! Release some Pokémon to claim more starter eggs.");
      return;
    }
    setIsHatching(true);
    setHatchedPokemon(null);

    // Pick random starter ID
    const randomId = STARTERS_IDS[Math.floor(Math.random() * STARTERS_IDS.length)];
    // Start level is scaled slightly to speed up gameplay
    const randomLevel = Math.floor(Math.random() * 4) + 5; // Level 5 to 8 spawn
    const newPoke = createNewPokemonInstance(randomId, randomLevel);

    // 1 in 50 chance or forced via cheat flag
    const isShiny = forceShinyCheat || Math.random() < 0.02;

    const startHatchTime = Date.now();

    try {
      if (isShiny) {
        const response = await fetch("/api/shiny", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: newPoke.name, types: newPoke.types }),
        });

        if (response.ok) {
          const shinyData = await response.json();
          newPoke.isShiny = true;
          newPoke.pokedexEntry = shinyData.pokedexEntry;
          newPoke.colors = {
            primary: shinyData.colors.primary,
            secondary: shinyData.colors.secondary,
          };
          newPoke.ability = shinyData.ability;
          newPoke.signatureMove = shinyData.signatureMove;
          // Shiny stats boost of +10%
          newPoke.baseStats = {
            hp: Math.floor(newPoke.baseStats.hp * 1.1),
            attack: Math.floor(newPoke.baseStats.attack * 1.1),
            defense: Math.floor(newPoke.baseStats.defense * 1.1),
            spAtk: Math.floor(newPoke.baseStats.spAtk * 1.1),
            spDef: Math.floor(newPoke.baseStats.spDef * 1.1),
            speed: Math.floor(newPoke.baseStats.speed * 1.1),
          };
        } else {
          console.warn("Failed to generate shiny metadata, hatching normal specimen.");
        }
      }
    } catch (err) {
      console.error("Failed to call /api/shiny:", err);
    }

    // Keep egg animation going for at least 2200ms for premium suspense
    const elapsed = Date.now() - startHatchTime;
    const minDelay = 2200;
    const remaining = Math.max(0, minDelay - elapsed);

    setTimeout(() => {
      setHatchedPokemon(newPoke);
      setIsHatching(false);
    }, remaining);
  };

  // Confirm Egg Hatch and claim
  const claimHatchedPokemon = () => {
    if (hatchedPokemon) {
      const updated = [...pokemonList, hatchedPokemon];
      saveToStorage(updated);
      setSelectedPokemonId(hatchedPokemon.id);
      saveStats((prev: any) => ({
        ...prev,
        hatchedCount: prev.hatchedCount + 1,
        shiniesCount: hatchedPokemon.isShiny ? prev.shiniesCount + 1 : prev.shiniesCount,
      }));
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

      // Update statistics
      saveStats((prev: any) => ({
        ...prev,
        fusionsCount: prev.fusionsCount + 1,
      }));

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

    // Update statistics
    saveStats((prev: any) => ({
      ...prev,
      battlesWon: prev.battlesWon + 1,
    }));

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

  // Achievements evaluation
  const maxLevelInRoster = pokemonList.length > 0 ? Math.max(...pokemonList.map((p) => p.level)) : 0;
  const hasShiny = pokemonList.some((p) => p.isShiny) || stats.shiniesCount > 0;
  const hasFused = pokemonList.some((p) => p.isFused) || stats.fusionsCount > 0;

  const achievements = [
    {
      id: "hatch_10",
      title: "Pioneer Incubator",
      description: "Hatch 10 starter eggs from the lab",
      icon: Egg,
      current: stats.hatchedCount,
      target: 10,
      isCompleted: stats.hatchedCount >= 10,
      color: "from-amber-400 to-yellow-600 border-amber-500/30",
      textCol: "text-amber-400"
    },
    {
      id: "first_fusion",
      title: "Genetic Resonance",
      description: "Fuse companions to create a genetic hybrid",
      icon: Zap,
      current: hasFused ? 1 : 0,
      target: 1,
      isCompleted: hasFused,
      color: "from-purple-400 to-indigo-600 border-purple-500/30",
      textCol: "text-purple-400"
    },
    {
      id: "level_50",
      title: "Elite Trainer",
      description: "Train any companion to Level 50 or beyond",
      icon: Award,
      current: maxLevelInRoster,
      target: 50,
      isCompleted: maxLevelInRoster >= 50,
      color: "from-emerald-400 to-teal-600 border-emerald-500/30",
      textCol: "text-emerald-400"
    },
    {
      id: "first_shiny",
      title: "Cosmic Spark",
      description: "Hatch or possess a cosmic Shiny companion",
      icon: Sparkles,
      current: hasShiny ? 1 : 0,
      target: 1,
      isCompleted: hasShiny,
      color: "from-pink-400 to-rose-600 border-pink-500/30",
      textCol: "text-pink-400"
    },
    {
      id: "battles_5",
      title: "Colosseum Champion",
      description: "Defeat 5 wild opponents in battle arena",
      icon: Swords,
      current: stats.battlesWon,
      target: 5,
      isCompleted: stats.battlesWon >= 5,
      color: "from-cyan-400 to-blue-600 border-cyan-500/30",
      textCol: "text-cyan-400"
    },
    {
      id: "dex_12",
      title: "Dex Completionist",
      description: "Amass 12 companions in your Active Roster",
      icon: Shield,
      current: pokemonList.length,
      target: 12,
      isCompleted: pokemonList.length >= 12,
      color: "from-blue-400 to-indigo-600 border-blue-500/30",
      textCol: "text-blue-400"
    },
  ];

  const completedCount = achievements.filter((a) => a.isCompleted).length;

  // Extract unique types available inside currently owned squad for filter tabs
  const allOwnedTypes: string[] = ["All", ...Array.from(new Set<string>(pokemonList.flatMap((p) => p.types)))];

  const filteredPokemonList = pokemonList.filter((p) => {
    if (filterType === "All") return true;
    return p.types.includes(filterType);
  });

  return (
    <div className="min-h-screen bg-[#020617] font-sans text-slate-100 flex flex-col relative selection:bg-indigo-500/30 selection:text-white overflow-x-hidden">
      {/* Background Matrix Starfield glows */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,#1e293b_0%,#020617_70%)] pointer-events-none" />

      {/* Main Container */}
      <div className="container mx-auto px-4 py-6 md:py-10 w-full flex-1 flex flex-col space-y-8 z-10">
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

            <label className="flex items-center gap-1.5 text-[10px] font-mono text-slate-400 bg-slate-900/60 border border-white/5 hover:border-white/10 px-3.5 py-2 rounded-full cursor-pointer select-none transition-colors">
              <input
                type="checkbox"
                checked={forceShinyCheat}
                onChange={(e) => setForceShinyCheat(e.target.checked)}
                className="rounded border-slate-700 bg-slate-950 text-indigo-600 focus:ring-indigo-500 w-3 h-3 cursor-pointer"
              />
              Force Shiny ✨
            </label>

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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 items-start">
          {/* LEFT: GENESIS FUSION REACTOR CHAMBER & ACHIEVEMENTS (5 cols) */}
          <div className="md:col-span-1 lg:col-span-5 space-y-6">
            <section className="bg-slate-900/40 border border-white/5 rounded-3xl p-6 backdrop-blur-xl relative overflow-hidden">
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

          {/* ACHIEVEMENTS & MILESTONES SECTION */}
          <section className="bg-slate-900/40 border border-white/5 rounded-3xl p-6 backdrop-blur-xl relative overflow-hidden">
            {/* Pulsing grid network background */}
            <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px] opacity-20" />

            <div className="relative z-10 flex justify-between items-center mb-5 border-b border-white/5 pb-3">
              <div className="space-y-0.5">
                <h2 className="text-lg font-bold font-display flex items-center gap-2 text-indigo-400 uppercase tracking-tight italic">
                  <Trophy className="w-5 h-5 text-amber-400 animate-pulse" /> Achievements
                </h2>
                <p className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">
                  Lab Milestones & Medals
                </p>
              </div>
              <div className="bg-slate-950/80 border border-indigo-500/20 px-3 py-1 rounded-full text-right flex items-center gap-1.5 shadow-[0_0_10px_rgba(99,102,241,0.15)]">
                <span className="text-[10px] font-mono text-slate-400">Mastered:</span>
                <span className="text-sm font-bold font-mono text-indigo-400">
                  {completedCount} <span className="text-xs text-slate-500">/ {achievements.length}</span>
                </span>
              </div>
            </div>

            {/* Achievements Grid/List */}
            <div className="relative z-10 space-y-3 max-h-[340px] overflow-y-auto pr-1 scrollbar-thin">
              {achievements.map((ach) => {
                const IconComponent = ach.icon;
                const percent = Math.min(100, Math.floor((ach.current / ach.target) * 100));
                
                return (
                  <div 
                    key={ach.id} 
                    className={`p-3 bg-slate-950/60 border rounded-2xl transition-all duration-300 relative group overflow-hidden ${
                      ach.isCompleted 
                        ? "border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.05)] bg-gradient-to-r from-emerald-950/20 to-transparent" 
                        : "border-white/5 hover:border-white/10"
                    }`}
                  >
                    {/* Top Row: Icon, Title, and Completion Check */}
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center border transition-all duration-300 ${
                        ach.isCompleted 
                          ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 scale-105" 
                          : "bg-slate-900 border-white/5 text-slate-400 group-hover:text-slate-200"
                      }`}>
                        <IconComponent className={`w-4 h-4 ${ach.isCompleted ? "animate-pulse" : ""}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className={`text-xs font-bold block truncate tracking-tight transition-colors ${ach.isCompleted ? "text-emerald-400 font-extrabold" : "text-slate-200"}`}>
                            {ach.title}
                          </span>
                          <span className={`text-[10px] font-mono font-bold ${ach.isCompleted ? "text-emerald-400" : "text-slate-400"}`}>
                            {ach.current} / {ach.target}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400 block truncate font-mono leading-tight">
                          {ach.description}
                        </span>
                      </div>
                    </div>

                    {/* Bottom Row: Dynamic Progress Bar */}
                    <div className="mt-2.5">
                      <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden border border-white/5">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${percent}%` }}
                          transition={{ duration: 0.5, ease: "easeOut" }}
                          className={`h-full rounded-full ${
                            ach.isCompleted 
                              ? "bg-gradient-to-r from-emerald-500 to-teal-400 shadow-[0_0_8px_rgba(16,185,129,0.4)]" 
                              : "bg-gradient-to-r from-indigo-500 to-indigo-400"
                          }`}
                        />
                      </div>
                    </div>

                    {/* Sparkling aura badge on completed achievements */}
                    {ach.isCompleted && (
                      <div className="absolute -top-1 -right-1 w-6 h-6 bg-emerald-500/10 rounded-bl-xl border-b border-l border-emerald-500/20 flex items-center justify-center">
                        <span className="text-[9px] text-emerald-400 font-mono font-bold">✓</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        </div>

        {/* RIGHT: THE DETAILED POKÉDEX & SQUAD SHELF (7 cols) */}
          <div className="md:col-span-1 lg:col-span-7 space-y-6">
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
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-1 xl:grid-cols-2 gap-4 max-h-[420px] overflow-y-auto scrollbar-thin rounded-xl pr-1.5 justify-items-center">
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
                      <div className="flex gap-2 items-center flex-wrap">
                        <span className="text-[10px] font-mono tracking-widest text-slate-400 uppercase bg-slate-800 border border-white/10 px-2.5 py-0.5 rounded-full">
                          Species Registry #{selectedPokemon.pokemonId}
                        </span>
                        {selectedPokemon.isShiny && (
                          <span className="text-[9px] px-2 py-0.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 font-bold tracking-widest rounded font-mono uppercase flex items-center gap-1 animate-pulse">
                            <Sparkles className="w-3 h-3 text-amber-400 animate-spin" /> Shiny Specimen
                          </span>
                        )}
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

                      {/* Ability and moves if fused OR shiny */}
                      {(selectedPokemon.isFused || selectedPokemon.isShiny) && selectedPokemon.ability && (
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
              {hatchedPokemon.isShiny ? (
                <span className="px-3.5 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded-full text-[10px] tracking-widest font-mono uppercase flex items-center gap-1 font-bold animate-bounce shadow-[0_0_15px_rgba(245,158,11,0.3)]">
                  <Sparkles className="w-3.5 h-3.5 animate-spin text-amber-300" /> ✨ SHINY HATCHED! ✨
                </span>
              ) : (
                <span className="px-3.5 py-1 bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 rounded-full text-[10px] tracking-widest font-mono uppercase flex items-center gap-1 font-bold">
                  <Sparkles className="w-3.5 h-3.5 animate-spin text-indigo-300" /> EGG HATCHED
                </span>
              )}
              <h3 className="text-3xl font-display font-bold tracking-tight uppercase italic leading-tight">
                {hatchedPokemon.isShiny ? "Cosmic Anomaly Detected!" : "A Pokémon Hatch was Successful!"}
              </h3>

              <div className="relative w-56 h-56 flex items-center justify-center my-4">
                <div className={`absolute inset-0 rounded-full blur-xl animate-pulse ${hatchedPokemon.isShiny ? "bg-amber-400/20 shadow-[0_0_30px_rgba(251,191,36,0.5)]" : "bg-indigo-500/10"}`} />
                <img
                  src={hatchedPokemon.sprite}
                  alt={hatchedPokemon.name}
                  referrerPolicy="no-referrer"
                  className={`w-full h-full object-contain filter drop-shadow-[0_12px_24px_rgba(0,0,0,0.5)] scale-110 ${hatchedPokemon.isShiny ? "brightness-110 contrast-105" : ""}`}
                />
                {hatchedPokemon.isShiny && (
                  <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                    <Sparkles className="w-8 h-8 text-amber-300 animate-ping absolute top-0 left-0" />
                    <Sparkles className="w-6 h-6 text-white animate-bounce absolute bottom-0 right-0" />
                  </div>
                )}
              </div>

              <div
                style={hatchedPokemon.isShiny && hatchedPokemon.colors ? {
                  background: `linear-gradient(135deg, ${hatchedPokemon.colors.primary}99 0%, ${hatchedPokemon.colors.secondary}88 100%)`,
                  borderColor: hatchedPokemon.colors.primary
                } : undefined}
                className="bg-slate-900 border border-white/5 rounded-3xl p-5 w-full relative overflow-hidden"
              >
                {hatchedPokemon.isShiny && (
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(245,158,11,0.15),transparent_60%)] pointer-events-none animate-pulse" />
                )}
                <span className="text-[10px] text-slate-400 font-mono uppercase tracking-widest block mb-1">
                  {hatchedPokemon.isShiny ? "✨ Ultra Rare Classified" : "Species Classified"}
                </span>
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
