import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { PokemonInstance, BattleOpponent } from "../types";
import { POKEMON_SPECIES_LIST, getOfficialArtworkUrl, TYPE_COLORS, getMinLevelForSpecies } from "../pokemonData";
import { Swords, SwordsIcon, Trophy, Skull, RefreshCw, ChevronRight, Zap, Sparkles } from "lucide-react";

interface BattleArenaProps {
  activePokemon: PokemonInstance;
  onExit: () => void;
  onVictory: (expGained: number, trainingPointsGained: number) => void;
  onCapture: (captured: PokemonInstance) => void;
  canCapture: boolean;
}

// Pokemon element type effectiveness relationships
const TYPE_EFFECTIVENESS: Record<string, Record<string, number>> = {
  Fire: { Grass: 2, Water: 0.5, Dragon: 0.5, Fire: 0.5 },
  Water: { Fire: 2, Ground: 2, Water: 0.5, Dragon: 0.5, Grass: 0.5 },
  Grass: { Water: 2, Ground: 2, Fire: 0.5, Poison: 0.5, Flying: 0.5, Dragon: 0.5, Grass: 0.5 },
  Electric: { Water: 2, Flying: 2, Ground: 0, Grass: 0.5, Dragon: 0.5, Electric: 0.5 },
  Psychic: { Fighting: 2, Poison: 2, Psychic: 0.5 },
  Ghost: { Psychic: 2, Ghost: 2, Normal: 0 },
  Dragon: { Dragon: 2, Fairy: 0.5 },
  Fairy: { Dragon: 2, Fighting: 2, Poison: 0.5, Fire: 0.5 },
  Poison: { Grass: 2, Fairy: 2, Poison: 0.5, Ground: 0.5, Ghost: 0.5 },
  Ground: { Fire: 2, Electric: 2, Poison: 2, Flying: 0, Grass: 0.5 },
  Flying: { Grass: 2, Fighting: 2, Electric: 0.5 },
  Fighting: { Normal: 2, Flying: 0.5, Poison: 0.5, Psychic: 0.5, Ghost: 0, Fairy: 0.5 },
  Normal: { Ghost: 0 },
};

export function getEffectivenessMultiplier(moveType: string, targetTypes: string[]): number {
  let multiplier = 1;
  for (const tType of targetTypes) {
    if (TYPE_EFFECTIVENESS[moveType] && TYPE_EFFECTIVENESS[moveType][tType] !== undefined) {
      multiplier *= TYPE_EFFECTIVENESS[moveType][tType];
    }
  }
  return multiplier;
}

export function BattleArena({ activePokemon, onExit, onVictory, onCapture, canCapture }: BattleArenaProps) {
  const [battleType, setBattleType] = useState<"wild" | "boss" | null>(null);
  const [opponent, setOpponent] = useState<BattleOpponent | null>(null);
  const [playerHp, setPlayerHp] = useState(activePokemon.baseStats.hp);
  const [combatLog, setCombatLog] = useState<string[]>([]);
  const [isBattleOver, setIsBattleOver] = useState(false);
  const [victoryState, setVictoryState] = useState<"victory" | "defeat" | null>(null);
  const [animatingPlayerHit, setAnimatingPlayerHit] = useState(false);
  const [animatingOpponentHit, setAnimatingOpponentHit] = useState(false);
  const [canAttack, setCanAttack] = useState(true);

  // Catch sequence states
  const [isCatching, setIsCatching] = useState(false);
  const [catchStatus, setCatchStatus] = useState<"idle" | "throwing" | "success" | "failed">("idle");

  // Generate an opponent depending on chosen challenge type
  useEffect(() => {
    if (!battleType) return;

    if (battleType === "wild") {
      // Target a level near the player’s level
      const levelDiff = Math.floor(Math.random() * 3) - 1; // -1, 0, or +1
      const targetLevel = Math.max(1, activePokemon.level + levelDiff);

      // Only allow species whose minimum level (based on their evolution requirements) is <= targetLevel
      const possibleOpponents = POKEMON_SPECIES_LIST.filter((s) => {
        return getMinLevelForSpecies(s.pokemonId) <= targetLevel;
      });

      const candidates = possibleOpponents.length > 0
        ? possibleOpponents
        : POKEMON_SPECIES_LIST.filter((s) => s.stage === 1);

      const randomSpecies = candidates[Math.floor(Math.random() * candidates.length)];

      // Scaling opponent stats nicely
      const scale = 1 + (targetLevel - 1) * 0.12;
      const opponentHp = Math.floor(randomSpecies.baseStats.hp * scale);

      const match: BattleOpponent = {
        name: `Wild ${randomSpecies.name}`,
        pokemonId: randomSpecies.pokemonId,
        level: targetLevel,
        types: [...randomSpecies.types],
        baseStats: {
          hp: opponentHp,
          attack: Math.floor(randomSpecies.baseStats.attack * scale),
          defense: Math.floor(randomSpecies.baseStats.defense * scale),
          spAtk: Math.floor(randomSpecies.baseStats.spAtk * scale),
          spDef: Math.floor(randomSpecies.baseStats.spDef * scale),
          speed: Math.floor(randomSpecies.baseStats.speed * scale),
        },
        sprite: getOfficialArtworkUrl(randomSpecies.pokemonId),
        hpRemaining: opponentHp,
        hpMax: opponentHp,
      };

      setOpponent(match);
      setPlayerHp(activePokemon.baseStats.hp);
      setCombatLog([
        `⚔️ Wild ${randomSpecies.name} (Lv. ${targetLevel}) has blocked your path!`,
        `👉 Go, ${activePokemon.name}! Show them your potential!`,
      ]);
    } else {
      // Generate an Apex Boss Fusion!
      // Pick two random species to fuse
      const pList = POKEMON_SPECIES_LIST;
      const p1 = pList[Math.floor(Math.random() * pList.length)];
      const p2 = pList[Math.floor(Math.random() * pList.length)];

      const targetLevel = activePokemon.level + 5; // Boss is always +5 levels!

      // Blend names and types
      const half1 = p1.name.slice(0, Math.ceil(p1.name.length / 2));
      const half2 = p2.name.slice(Math.ceil(p2.name.length / 2));
      const bossName = `APEX ${half1}${half2}`.toUpperCase();

      const combinedTypes = Array.from(new Set([p1.types[0], p2.types[0]]));

      const scale = (1 + (targetLevel - 1) * 0.12) * 1.2;
      const bossHp = Math.floor(((p1.baseStats.hp + p2.baseStats.hp) / 2) * scale * 2.0); // 2x Health for Boss Raid

      const match: BattleOpponent = {
        name: bossName,
        pokemonId: p1.pokemonId,
        level: targetLevel,
        types: combinedTypes,
        baseStats: {
          hp: bossHp,
          attack: Math.floor(((p1.baseStats.attack + p2.baseStats.attack) / 2) * scale * 1.15),
          defense: Math.floor(((p1.baseStats.defense + p2.baseStats.defense) / 2) * scale * 1.15),
          spAtk: Math.floor(((p1.baseStats.spAtk + p2.baseStats.spAtk) / 2) * scale * 1.15),
          spDef: Math.floor(((p1.baseStats.spDef + p2.baseStats.spDef) / 2) * scale * 1.15),
          speed: Math.floor(((p1.baseStats.speed + p2.baseStats.speed) / 2) * scale * 1.15),
        },
        sprite: getOfficialArtworkUrl(p1.pokemonId),
        hpRemaining: bossHp,
        hpMax: bossHp,
      };

      setOpponent(match);
      setPlayerHp(activePokemon.baseStats.hp);
      setCombatLog([
        `🚨 WARNING: CRITICAL RESISTANCE EMISSION IN PROGRESS!`,
        `👾 APEX FUSION ${bossName} (Lv. ${targetLevel}) [${combinedTypes.join("/")}] has emerged!`,
        `👉 Battle stations, ${activePokemon.name}! Unleash your full element arrays!`,
      ]);
    }
  }, [activePokemon, battleType]);

  // Turn calculation logic
  const handleAttack = (moveName: string, movePower: number = 20, moveType: string = "Normal") => {
    if (isBattleOver || !opponent || !canAttack) return;

    setCanAttack(false);

    // --- PLAYER ATTACK TURN ---
    setAnimatingOpponentHit(true);
    setTimeout(() => setAnimatingOpponentHit(false), 300);

    // Calculate Type Effectiveness Damage Multiplier
    const effectiveness = getEffectivenessMultiplier(moveType, opponent.types);
    const baseDamage = Math.floor(
      ((2 * activePokemon.level) / 5 + 2) * movePower * (activePokemon.baseStats.attack / opponent.baseStats.defense) / 20 + 2
    );
    const damage = Math.max(2, Math.floor(baseDamage * effectiveness * (0.85 + Math.random() * 0.15)));
    const nextOpponentHp = Math.max(0, opponent.hpRemaining - damage);

    let effectivenessMessage = "";
    if (effectiveness > 1) {
      effectivenessMessage = " It's super effective! 💥";
    } else if (effectiveness === 0) {
      effectivenessMessage = " It had no effect... 🛑";
    } else if (effectiveness < 1) {
      effectivenessMessage = " It's not very effective... 🍃";
    }

    const playerLog = `🔥 ${activePokemon.name} used ${moveName}! It dealt ${damage} damage to ${opponent.name}.${effectivenessMessage}`;
    const updatedOpponent = { ...opponent, hpRemaining: nextOpponentHp };
    setOpponent(updatedOpponent);

    setCombatLog((prev) => [...prev, playerLog]);

    if (nextOpponentHp <= 0) {
      // Victory Sequence
      setTimeout(() => {
        setIsBattleOver(true);
        setVictoryState("victory");
        // Calculate dynamic reward multipliers
        const baseXP = updatedOpponent.level * 40;
        const xpMultiplier = battleType === "boss" ? 3.0 : (activePokemon.isFused ? 1.5 : 1.0);
        const rewardXP = Math.floor(baseXP * xpMultiplier);
        const trainingPointsGained = battleType === "boss" ? 10 : 2;

        setCombatLog((prev) => [
          ...prev,
          `🏆 ${opponent.name} was successfully defeated!`,
          `✨ ${activePokemon.name} completed the exercise! Gained +${rewardXP} EXP and +${trainingPointsGained} Stat Training Points!`,
        ]);
        onVictory(rewardXP, trainingPointsGained);
      }, 800);
      return;
    }

    // --- OPPONENT COUNTER TURN ---
    setTimeout(() => {
      setAnimatingPlayerHit(true);
      setTimeout(() => setAnimatingPlayerHit(false), 300);

      // Simple normal wild strike with element effectiveness
      const opAttackType = opponent.types[0] || "Normal";
      const opMoveName = `${opAttackType} Strike`;
      const opEffectiveness = getEffectivenessMultiplier(opAttackType, activePokemon.types);
      const baseOpponentDamage = Math.floor(
        ((2 * opponent.level) / 5 + 2) * 20 * (opponent.baseStats.attack / activePokemon.baseStats.defense) / 20 + 2
      );
      const opponentDamage = Math.max(2, Math.floor(baseOpponentDamage * opEffectiveness * (0.85 + Math.random() * 0.15)));
      const nextPlayerHp = Math.max(0, playerHp - opponentDamage);

      let opEffectMessage = "";
      if (opEffectiveness > 1) {
        opEffectMessage = " It's super effective! 💥";
      } else if (opEffectiveness === 0) {
        opEffectMessage = " It had no effect... 🛑";
      } else if (opEffectiveness < 1) {
        opEffectMessage = " It's not very effective... 🍃";
      }

      setPlayerHp(nextPlayerHp);
      setCombatLog((prev) => [
        ...prev,
        `💥 ${opponent.name} fought back with ${opMoveName}! Dealt ${opponentDamage} damage.${opEffectMessage}`,
      ]);

      if (nextPlayerHp <= 0) {
        setTimeout(() => {
          setIsBattleOver(true);
          setVictoryState("defeat");
          setCombatLog((prev) => [
            ...prev,
            `💀 ${activePokemon.name} has fainted. Try training more!`,
          ]);
        }, 800);
      } else {
        setCanAttack(true);
      }
    }, 1200);
  };

  const handleCaptureAttempt = () => {
    if (isBattleOver || !opponent || !canAttack) return;
    if (!canCapture) {
      alert("Your Active Roster is full (max 24)! Release a companion first to make space.");
      return;
    }

    setCanAttack(false);
    setIsCatching(true);
    setCatchStatus("throwing");

    setCombatLog((prev) => [
      ...prev,
      `✨ Deploying Resonance Capture Snare at ${opponent.name}...`,
    ]);

    // Calculate capture rate based on HP remaining
    const catchRate = Math.min(95, Math.round(15 + (1 - opponent.hpRemaining / opponent.hpMax) * 80));
    const roll = Math.random() * 100;

    // Shake 1
    setTimeout(() => {
      setCombatLog((prev) => [...prev, "⚡ Resonance frequency aligning... (Pulse 1)"]);
    }, 800);

    // Shake 2
    setTimeout(() => {
      setCombatLog((prev) => [...prev, "⚡ Element locking sequence... (Pulse 2)"]);
    }, 1600);

    // Final result
    setTimeout(() => {
      if (roll <= catchRate) {
        setCatchStatus("success");
        setIsBattleOver(true);
        setVictoryState("victory");

        const cleanName = opponent.name.replace(/^Wild\s+/, "");
        setCombatLog((prev) => [
          ...prev,
          `✨ QUANTUM LOCK SECURED!`,
          `🎉 Success! ${cleanName} was successfully registered!`,
        ]);

        // Construct captured Pokemon instance
        const capturedInstance: PokemonInstance = {
          id: Math.random().toString(36).substr(2, 9),
          pokemonId: opponent.pokemonId,
          name: cleanName,
          level: opponent.level,
          exp: 0,
          expNeeded: opponent.level * 100,
          types: [...opponent.types],
          baseStats: {
            hp: opponent.hpMax,
            attack: opponent.baseStats.attack,
            defense: opponent.baseStats.defense,
            spAtk: opponent.baseStats.spAtk,
            spDef: opponent.baseStats.spDef,
            speed: opponent.baseStats.speed,
          },
          sprite: opponent.sprite,
          stage: 1,
          isFused: false,
        };

        // Notify parent
        onCapture(capturedInstance);

      } else {
        setCatchStatus("failed");
        setCombatLog((prev) => [
          ...prev,
          `❌ Snare broke! ${opponent.name} shattered the element alignment grid!`,
        ]);

        // Opponent counter-attack turn immediately!
        setTimeout(() => {
          setAnimatingPlayerHit(true);
          setTimeout(() => setAnimatingPlayerHit(false), 300);

          const opAttackType = opponent.types[0] || "Normal";
          const opMoveName = `${opAttackType} Strike`;
          const baseOpponentDamage = Math.floor(
            ((2 * opponent.level) / 5 + 2) * 20 * (opponent.baseStats.attack / activePokemon.baseStats.defense) / 20 + 2
          );
          const opponentDamage = Math.max(2, Math.floor(baseOpponentDamage * (0.85 + Math.random() * 0.15)));
          const nextPlayerHp = Math.max(0, playerHp - opponentDamage);

          setPlayerHp(nextPlayerHp);
          setCombatLog((prev) => [
            ...prev,
            `💥 ${opponent.name} retaliated with ${opMoveName}! Dealt ${opponentDamage} damage.`,
          ]);

          if (nextPlayerHp <= 0) {
            setTimeout(() => {
              setIsBattleOver(true);
              setVictoryState("defeat");
              setCombatLog((prev) => [
                ...prev,
                `💀 ${activePokemon.name} has fainted. Try training more!`,
              ]);
            }, 800);
          } else {
            // Reset catching state to let player attack again
            setIsCatching(false);
            setCatchStatus("idle");
            setCanAttack(true);
          }
        }, 1000);
      }
    }, 2400);
  };

  if (!opponent) {
    return (
      <div className="flex flex-col items-center justify-center p-20 text-neutral-400 font-mono">
        <RefreshCw className="animate-spin w-8 h-8 mb-3" />
        Scanning surrounding element frequencies...
      </div>
    );
  }

  // Generate exactly 4 rich, active combat moves for the companion
  const getCompanionMoves = (poke: PokemonInstance) => {
    const list: { name: string; power: number; type: string }[] = [];

    // 1. Move 1: STAB Primary Type Move
    const pType = poke.types[0] || "Normal";
    let move1 = { name: "Tackle", power: 30, type: "Normal" };
    if (pType === "Fire") move1 = poke.level >= 15 ? { name: "Flamethrower", power: 45, type: "Fire" } : { name: "Ember", power: 30, type: "Fire" };
    else if (pType === "Water") move1 = poke.level >= 15 ? { name: "Hydro Pump", power: 45, type: "Water" } : { name: "Water Gun", power: 30, type: "Water" };
    else if (pType === "Grass") move1 = poke.level >= 15 ? { name: "Giga Drain", power: 45, type: "Grass" } : { name: "Vine Whip", power: 30, type: "Grass" };
    else if (pType === "Electric") move1 = poke.level >= 15 ? { name: "Thunderbolt", power: 45, type: "Electric" } : { name: "Thunder Shock", power: 30, type: "Electric" };
    else if (pType === "Psychic") move1 = poke.level >= 15 ? { name: "Psybeam", power: 40, type: "Psychic" } : { name: "Confusion", power: 30, type: "Psychic" };
    else if (pType === "Ghost") move1 = poke.level >= 15 ? { name: "Shadow Ball", power: 45, type: "Ghost" } : { name: "Lick", power: 30, type: "Ghost" };
    else if (pType === "Dragon") move1 = poke.level >= 15 ? { name: "Dragon Claw", power: 45, type: "Dragon" } : { name: "Twister", power: 30, type: "Dragon" };
    else if (pType === "Fairy") move1 = poke.level >= 15 ? { name: "Dazzling Gleam", power: 45, type: "Fairy" } : { name: "Fairy Wind", power: 30, type: "Fairy" };
    else if (pType === "Normal") move1 = poke.level >= 15 ? { name: "Double-Edge", power: 45, type: "Normal" } : { name: "Pound", power: 25, type: "Normal" };
    else if (pType === "Poison") move1 = { name: "Sludge Bomb", power: 40, type: "Poison" };
    else if (pType === "Ground") move1 = { name: "Mud-Slap", power: 30, type: "Ground" };
    else if (pType === "Flying") move1 = { name: "Gust", power: 30, type: "Flying" };
    else if (pType === "Fighting") move1 = { name: "Karate Chop", power: 35, type: "Fighting" };
    list.push(move1);

    // 2. Move 2: Secondary STAB or Tactical Element Move
    const sType = poke.types[1] || "Normal";
    let move2 = { name: "Slash", power: 35, type: "Normal" };
    if (sType === "Fire") move2 = { name: "Flame Wheel", power: 35, type: "Fire" };
    else if (sType === "Water") move2 = { name: "Water Pulse", power: 35, type: "Water" };
    else if (sType === "Grass") move2 = { name: "Mega Drain", power: 35, type: "Grass" };
    else if (sType === "Electric") move2 = { name: "Spark", power: 35, type: "Electric" };
    else if (sType === "Psychic") move2 = { name: "Psybeam", power: 35, type: "Psychic" };
    else if (sType === "Ghost") move2 = { name: "Night Shade", power: 35, type: "Ghost" };
    else if (sType === "Dragon") move2 = { name: "Dragon Breath", power: 40, type: "Dragon" };
    else if (sType === "Fairy") move2 = { name: "Disarming Voice", power: 30, type: "Fairy" };
    else if (sType === "Poison") move2 = { name: "Poison Fang", power: 35, type: "Poison" };
    else if (sType === "Ground") move2 = { name: "Mud Shot", power: 35, type: "Ground" };
    else if (sType === "Flying") move2 = { name: "Wing Attack", power: 35, type: "Flying" };
    else if (sType === "Fighting") move2 = { name: "Low Kick", power: 35, type: "Fighting" };
    list.push(move2);

    // 3. Move 3: Physical / Structural Tackle
    let move3 = { name: "Quick Attack", power: 25, type: "Normal" };
    if (poke.level >= 22) {
      move3 = { name: "Extreme Speed", power: 45, type: "Normal" };
    } else if (poke.level >= 12) {
      move3 = { name: "Slam Tackle", power: 35, type: "Normal" };
    }
    list.push(move3);

    // 4. Move 4: Ultimate / Signature Move
    let move4 = { name: "Quick Guard", power: 15, type: "Normal" };
    if ((poke.isFused || poke.isShiny) && poke.signatureMove) {
      move4 = { name: poke.signatureMove.name, power: poke.signatureMove.power, type: poke.signatureMove.type || poke.types[0] || "Normal" };
    } else {
      if (pType === "Fire") move4 = { name: "Fire Blast", power: 55, type: "Fire" };
      else if (pType === "Water") move4 = { name: "Hydro Pump", power: 55, type: "Water" };
      else if (pType === "Grass") move4 = { name: "Solar Beam", power: 55, type: "Grass" };
      else if (pType === "Electric") move4 = { name: "Thunder", power: 55, type: "Electric" };
      else if (pType === "Dragon") move4 = { name: "Outrage", power: 60, type: "Dragon" };
      else if (pType === "Normal") move4 = { name: "Hyper Beam", power: 60, type: "Normal" };
      else move4 = { name: "Giga Impact", power: 50, type: "Normal" };
    }
    list.push(move4);

    return list;
  };

  const moves = getCompanionMoves(activePokemon);

  if (!battleType) {
    return (
      <div className="bg-slate-900/40 border border-white/5 backdrop-blur-xl rounded-3xl p-8 shadow-2xl relative overflow-hidden z-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,#1e293b_0%,#020617_70%)] pointer-events-none" />
        <div className="relative z-10 text-center space-y-2 mb-8">
          <h3 className="text-2xl font-black text-indigo-400 font-display uppercase tracking-tight italic flex items-center justify-center gap-2">
            <Swords className="w-6 h-6 animate-pulse" /> Choose Your Combat Mission
          </h3>
          <p className="text-xs text-slate-400 font-mono">
            Active partner: <span className="text-indigo-300 font-bold">{activePokemon.name}</span> (Lv. {activePokemon.level})
          </p>
        </div>

        <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
          {/* OPTION 1: WILD PATROL */}
          <div className="bg-slate-950/80 border border-white/5 hover:border-indigo-500/30 rounded-2xl p-6 flex flex-col justify-between space-y-4 transition-all duration-300 group hover:shadow-[0_0_20px_rgba(99,102,241,0.1)]">
            <div className="space-y-2">
              <div className="w-12 h-12 bg-indigo-500/10 rounded-xl flex items-center justify-center border border-indigo-500/20 text-indigo-400 group-hover:scale-105 transition-transform">
                <Swords className="w-6 h-6" />
              </div>
              <h4 className="text-base font-bold text-slate-100 font-display uppercase">Wild Wilderness Patrol</h4>
              <p className="text-xs text-slate-400 font-mono leading-relaxed">
                Scan elemental fields for wild Pokémon of comparable power. Perfect for gathering experience and capturing fresh specimens to expand your roster.
              </p>
            </div>
            <div className="space-y-3 pt-2">
              <div className="text-[10px] font-mono text-slate-500 uppercase space-y-1">
                <div>• Expected Level: <span className="text-slate-300 font-bold">{Math.max(1, activePokemon.level - 1)} - {activePokemon.level + 1}</span></div>
                <div>• Quantum Snare: <span className="text-emerald-400 font-bold">Enabled</span></div>
                <div>• Victory Rewards: <span className="text-indigo-400 font-bold">+2 Training Points & XP</span></div>
              </div>
              <button
                onClick={() => setBattleType("wild")}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold uppercase tracking-widest transition-all cursor-pointer active:scale-95 shadow-md shadow-indigo-600/10"
              >
                Launch Patrol
              </button>
            </div>
          </div>

          {/* OPTION 2: APEX BOSS CHALLENGE */}
          <div className="bg-slate-950/80 border border-white/5 hover:border-amber-500/30 rounded-2xl p-6 flex flex-col justify-between space-y-4 transition-all duration-300 group hover:shadow-[0_0_20px_rgba(245,158,11,0.1)]">
            <div className="space-y-2">
              <div className="w-12 h-12 bg-amber-500/10 rounded-xl flex items-center justify-center border border-amber-500/20 text-amber-400 group-hover:scale-105 transition-transform">
                <Skull className="w-6 h-6 animate-pulse" />
              </div>
              <h4 className="text-base font-bold text-amber-400 font-display uppercase">Apex Fusion Raid Boss</h4>
              <p className="text-xs text-slate-400 font-mono leading-relaxed">
                Confront an unstable, dual-element hybrid aberration possessing massive health reserves. Unconquerable via snare, but yields immense training dividends.
              </p>
            </div>
            <div className="space-y-3 pt-2">
              <div className="text-[10px] font-mono text-slate-500 uppercase space-y-1">
                <div>• Expected Level: <span className="text-amber-400 font-bold">Lv. {activePokemon.level + 5} (Apex Elite)</span></div>
                <div>• Quantum Snare: <span className="text-red-400 font-bold">Disabled (Genetic Overload)</span></div>
                <div>• Victory Rewards: <span className="text-amber-400 font-bold">+10 Training Points & Triple XP</span></div>
              </div>
              <button
                onClick={() => setBattleType("boss")}
                className="w-full py-2.5 bg-gradient-to-r from-amber-600 to-red-600 hover:from-amber-500 hover:to-red-500 text-white rounded-xl text-xs font-bold uppercase tracking-widest transition-all cursor-pointer active:scale-95 shadow-md shadow-amber-600/10"
              >
                Engage Apex Boss
              </button>
            </div>
          </div>
        </div>

        <div className="text-center mt-6 relative z-10">
          <button
            onClick={onExit}
            className="text-xs font-mono text-slate-500 hover:text-slate-300 uppercase tracking-widest transition cursor-pointer"
          >
            ← Cancel and Retreat to Laboratory
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-900/40 border border-white/5 backdrop-blur-xl rounded-3xl p-6 shadow-2xl relative overflow-hidden">
      {/* Visual background element grid decoration */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,#1e293b_0%,#020617_70%)] pointer-events-none" />

      {/* Title Header */}
      <div className="flex justify-between items-center border-b border-white/10 pb-4 mb-6 relative z-10">
        <h3 className="text-lg font-bold flex items-center gap-2 text-indigo-400 font-display uppercase tracking-tight italic">
          <Swords className="w-5 h-5 text-indigo-400 animate-pulse" /> Extreme Battle Zone
        </h3>
        <button
          onClick={onExit}
          className="px-4 py-1.5 bg-slate-800 border border-white/10 rounded-full text-xs font-mono font-bold uppercase tracking-widest transition text-slate-300 hover:bg-slate-700 active:scale-95 cursor-pointer"
        >
          Retreat to Lab
        </button>
      </div>

      {/* Main Encounter Stage (2 Side Columns with Status Bars) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center min-h-[300px] mb-6 relative z-10">
        {/* PLAYER PARTY COLUMN */}
        <div className="flex flex-col items-center bg-slate-950/60 p-6 rounded-2xl border border-white/5 relative">
          {/* Status Bar */}
          <div className="w-full space-y-1.5 mb-4">
            <div className="flex justify-between text-xs font-mono text-slate-200 font-semibold uppercase tracking-wider">
              <span className="text-indigo-400">{activePokemon.name}</span>
              <span>Lv. {activePokemon.level}</span>
            </div>
            {/* Dynamic HP bar */}
            <div className="w-full bg-slate-950 border border-white/5 h-2.5 rounded-full overflow-hidden">
              <div
                style={{ width: `${Math.min(100, (playerHp / activePokemon.baseStats.hp) * 100)}%` }}
                className={`h-full transition-all duration-300 ${
                  playerHp / activePokemon.baseStats.hp < 0.3 ? "bg-red-500" : "bg-teal-400 font-bold"
                }`}
              />
            </div>
            <div className="flex justify-between text-[10px] font-mono text-slate-500 uppercase tracking-widest">
              <span>HP Status</span>
              <span>
                {playerHp}/{activePokemon.baseStats.hp}
              </span>
            </div>
          </div>

          {/* Player Animation Area */}
          <motion.div
            animate={{
              x: animatingPlayerHit ? [0, -15, 10, -5, 0] : 0,
              scale: animatingPlayerHit ? [1, 0.95, 1.05, 1] : 1,
            }}
            transition={{ duration: 0.3 }}
            className="w-44 h-44 flex items-center justify-center relative"
          >
            {animatingPlayerHit && (
              <div className="absolute inset-0 bg-red-500/25 blur-xl rounded-full" />
            )}
            <img
              src={activePokemon.sprite}
              alt={activePokemon.name}
              referrerPolicy="no-referrer"
              className="w-full h-full object-contain filter drop-shadow-[0_8px_16px_rgba(0,0,0,0.5)]"
            />
            {activePokemon.isShiny && (
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <Sparkles className="w-12 h-12 text-amber-400 animate-pulse absolute -top-2 -right-2" />
                <Sparkles className="w-8 h-8 text-indigo-300 animate-bounce absolute -bottom-2 -left-2" />
              </div>
            )}
          </motion.div>
        </div>

        {/* OPPONENT WILD COLUMN */}
        <div className="flex flex-col items-center bg-slate-950/60 p-6 rounded-2xl border border-white/5 relative">
          {/* Status Bar */}
          <div className="w-full space-y-1.5 mb-4">
            <div className="flex justify-between text-xs font-mono text-slate-200 font-semibold uppercase tracking-wider">
              <span className="text-red-400">{opponent.name}</span>
              <span>Lv. {opponent.level}</span>
            </div>
            {/* Dynamic HP bar */}
            <div className="w-full bg-slate-950 border border-white/5 h-2.5 rounded-full overflow-hidden">
              <div
                style={{ width: `${Math.min(100, (opponent.hpRemaining / opponent.hpMax) * 100)}%` }}
                className={`h-full transition-all duration-300 ${
                  opponent.hpRemaining / opponent.hpMax < 0.3 ? "bg-red-500" : "bg-red-400 font-bold"
                }`}
              />
            </div>
            <div className="flex justify-between text-[10px] font-mono text-slate-500 uppercase tracking-widest">
              <span>HP Status</span>
              <span>
                {opponent.hpRemaining}/{opponent.hpMax}
              </span>
            </div>
          </div>

          {/* Opponent Animation Area */}
          {isCatching ? (
            <div className="relative w-44 h-44 flex items-center justify-center">
              {/* Captured sprite shrinking or glowing */}
              <motion.img
                src={opponent.sprite}
                alt={opponent.name}
                referrerPolicy="no-referrer"
                animate={
                  catchStatus === "success"
                    ? { scale: [1, 0.4, 0], opacity: [1, 0.8, 0], rotate: [0, 180, 360] }
                    : catchStatus === "throwing"
                    ? { scale: [1, 0.8, 1, 0.8, 1], rotate: [0, -10, 10, -10, 0] }
                    : { scale: 1 }
                }
                transition={{ duration: 2.2, ease: "easeInOut" }}
                className="w-full h-full object-contain filter drop-shadow-[0_8px_16px_rgba(0,0,0,0.5)] brightness-110"
              />
              
              {/* Glowing Resonance Ring around the captured Pokemon */}
              <motion.div
                animate={{
                  rotate: 360,
                  scale: [0.9, 1.1, 0.9],
                }}
                transition={{
                  rotate: { repeat: Infinity, duration: 2, ease: "linear" },
                  scale: { repeat: Infinity, duration: 1.5, ease: "easeInOut" },
                }}
                className={`absolute inset-0 rounded-full border-4 border-dashed ${
                  catchStatus === "success"
                    ? "border-emerald-400 shadow-[0_0_30px_rgba(52,211,153,0.6)]"
                    : "border-teal-400 shadow-[0_0_20px_rgba(45,212,191,0.4)] animate-pulse"
                }`}
              />

              {/* Shaking Snare Sphere in center */}
              <motion.div
                animate={
                  catchStatus === "throwing"
                    ? {
                        x: [0, -10, 10, -10, 10, -5, 5, 0],
                        rotate: [0, -15, 15, -15, 15, -5, 5, 0],
                      }
                    : catchStatus === "success"
                    ? { scale: [1, 1.2, 0], opacity: [1, 1, 0] }
                    : { scale: 1 }
                }
                transition={{ repeat: Infinity, repeatDelay: 0.5, duration: 1.2 }}
                className="absolute w-16 h-16 bg-gradient-to-br from-emerald-400 to-teal-600 rounded-full border-2 border-white flex items-center justify-center shadow-[0_0_25px_rgba(52,211,153,0.8)] z-10"
              >
                <Sparkles className="w-8 h-8 text-white animate-pulse" />
              </motion.div>
            </div>
          ) : (
            <motion.div
              animate={{
                x: animatingOpponentHit ? [0, 15, -10, 5, 0] : 0,
                scale: animatingOpponentHit ? [1, 0.95, 1.05, 1] : 1,
              }}
              transition={{ duration: 0.3 }}
              className="w-44 h-44 flex items-center justify-center relative"
            >
              {animatingOpponentHit && (
                <div className="absolute inset-0 bg-orange-500/25 blur-xl rounded-full" />
              )}
              <img
                src={opponent.sprite}
                alt={opponent.name}
                referrerPolicy="no-referrer"
                className="w-full h-full object-contain filter drop-shadow-[0_8px_16px_rgba(0,0,0,0.5)]"
              />
            </motion.div>
          )}
        </div>
      </div>

      {/* Action panel vs Victory board */}
      <AnimatePresence mode="wait">
        {!isBattleOver ? (
          <motion.div
            key="actions"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-white/10 relative z-20"
          >
            {/* Realtime Action Logs */}
            <div className="bg-slate-950/60 border border-white/5 rounded-2xl p-4 h-[120px] overflow-y-auto font-mono text-xs text-slate-300 space-y-1.5 scrollbar-thin">
              {combatLog.slice(-5).map((log, index) => (
                <div key={index} className="flex gap-1.5 leading-relaxed items-start">
                  <span className="text-indigo-400 font-bold select-none">&gt;</span>
                  <span>{log}</span>
                </div>
              ))}
            </div>

            {/* Battle Moves List */}
            <div className="flex flex-col gap-2.5 justify-center">
              <div className="flex justify-between items-center px-1">
                <span className="text-xs uppercase tracking-widest text-slate-400 font-mono">
                  Select Skill Ability:
                </span>
                {battleType !== "boss" && (
                  <span className="text-[10px] font-mono text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full animate-pulse">
                    Catch Rate: {Math.min(95, Math.round(15 + (1 - opponent.hpRemaining / opponent.hpMax) * 80))}%
                  </span>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                {moves.map((move, i) => {
                  const typeColor = TYPE_COLORS[move.type as keyof typeof TYPE_COLORS] || { bg: "bg-slate-600", text: "text-slate-200" };
                  // TYPE_COLORS might be a simple string or an object with tailwind color classes.
                  // Let's check how TYPE_COLORS is defined or safely fall back.
                  const bgClass = typeof typeColor === "string" ? typeColor : (typeColor.bg || "bg-slate-500");
                  const borderStyle = typeof typeColor === "string" ? "border-white/10" : "border-white/5";

                  return (
                    <button
                      key={i}
                      onClick={() => handleAttack(move.name, move.power, move.type)}
                      disabled={!canAttack}
                      className="flex flex-col items-start px-4 py-3 bg-slate-950 border border-white/10 hover:border-indigo-500/50 rounded-xl hover:bg-slate-900 font-sans text-left transition disabled:opacity-40 disabled:pointer-events-none cursor-pointer hover:shadow-[0_0_15px_rgba(99,102,241,0.25)] relative group overflow-hidden"
                    >
                      <div className="flex justify-between items-center w-full">
                        <span className="font-bold text-xs md:text-sm text-slate-100 flex items-center gap-1 z-10">
                          <Zap className="w-3 h-3 text-indigo-400" /> {move.name}
                        </span>
                        <span className={`text-[8px] font-bold uppercase px-1.5 py-0.5 rounded-md text-white ${bgClass} z-10`}>
                          {move.type}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono mt-1 z-10">Power: {move.power}</span>
                    </button>
                  );
                })}
              </div>

              {/* QUANTUM CAPTURE SNARE BUTTON */}
              {battleType === "boss" ? (
                <div className="w-full mt-1.5 py-3 px-4 bg-red-950/20 border border-red-500/30 text-red-400 font-mono text-[10px] text-center uppercase tracking-wider rounded-xl">
                  🚨 SNARE OFFLINE: Apex dual-elements too unstable for quantum lock!
                </div>
              ) : (
                <button
                  onClick={handleCaptureAttempt}
                  disabled={!canAttack}
                  className="w-full mt-1.5 py-3.5 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold text-xs uppercase tracking-widest rounded-xl shadow-lg shadow-emerald-600/10 active:scale-95 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 disabled:pointer-events-none"
                >
                  <Sparkles className="w-4 h-4 text-emerald-200 animate-pulse" /> Deploy Quantum Snare
                </button>
              )}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="results"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center text-center p-6 bg-slate-950/60 border border-white/10 rounded-3xl z-20 relative"
          >
            {victoryState === "victory" ? (
              <div className="space-y-4">
                <div className={`p-4 ${catchStatus === "success" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-teal-500/10 text-teal-400 border-teal-500/20"} rounded-full w-14 h-14 flex items-center justify-center mx-auto border`}>
                  {catchStatus === "success" ? (
                    <Sparkles className="w-8 h-8 animate-spin text-emerald-400" />
                  ) : (
                    <Trophy className="w-8 h-8" />
                  )}
                </div>
                <div className="space-y-1">
                  <h4 className={`text-xl font-bold ${catchStatus === "success" ? "text-emerald-400 font-sans" : "text-teal-400"} font-display uppercase tracking-wider`}>
                    {catchStatus === "success" ? "Quantum Lock Secured!" : "Encounter Victorious!"}
                  </h4>
                  <p className="text-xs font-mono text-slate-400">
                    {catchStatus === "success"
                      ? "Successfully synchronized element resonance frequencies! The species has been registered and added to your Dex Box."
                      : "Your Pokémon was highly disciplined in execution and completed tactical gains."}
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-4 bg-red-500/10 rounded-full w-14 h-14 flex items-center justify-center mx-auto text-red-400 border border-red-500/20">
                  <Skull className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-xl font-bold text-red-400 font-display uppercase tracking-wider">Combat Defeated</h4>
                  <p className="text-xs font-mono text-slate-400">
                    Do not despair. Retreat to the Fusion Chamber or Training core. Each fight breeds wisdom.
                  </p>
                </div>
              </div>
            )}

            <button
              onClick={onExit}
              className="mt-6 px-10 py-3 bg-indigo-600 text-white rounded-full text-xs font-bold uppercase tracking-widest shadow-lg shadow-indigo-600/20 hover:bg-indigo-500 active:scale-95 transition cursor-pointer"
            >
              {catchStatus === "success" ? "Claim & Conclude" : "Conclude Exercise"}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
