import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { PokemonInstance, BattleOpponent } from "../types";
import { POKEMON_SPECIES_LIST, getOfficialArtworkUrl, TYPE_COLORS, getMinLevelForSpecies } from "../pokemonData";
import { Swords, SwordsIcon, Trophy, Skull, RefreshCw, ChevronRight, Zap } from "lucide-react";

interface BattleArenaProps {
  activePokemon: PokemonInstance;
  onExit: () => void;
  onVictory: (expGained: number) => void;
}

export function BattleArena({ activePokemon, onExit, onVictory }: BattleArenaProps) {
  const [opponent, setOpponent] = useState<BattleOpponent | null>(null);
  const [playerHp, setPlayerHp] = useState(activePokemon.baseStats.hp);
  const [combatLog, setCombatLog] = useState<string[]>([]);
  const [isBattleOver, setIsBattleOver] = useState(false);
  const [victoryState, setVictoryState] = useState<"victory" | "defeat" | null>(null);
  const [animatingPlayerHit, setAnimatingPlayerHit] = useState(false);
  const [animatingOpponentHit, setAnimatingOpponentHit] = useState(false);
  const [canAttack, setCanAttack] = useState(true);

  // Generate a random wild opponent when the arena opens
  useEffect(() => {
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
  }, [activePokemon]);

  // Turn calculation logic
  const handleAttack = (moveName: string, movePower: number = 20) => {
    if (isBattleOver || !opponent || !canAttack) return;

    setCanAttack(false);

    // --- PLAYER ATTACK TURN ---
    setAnimatingOpponentHit(true);
    setTimeout(() => setAnimatingOpponentHit(false), 300);

    // Calculate Damage
    const baseDamage = Math.floor(
      ((2 * activePokemon.level) / 5 + 2) * movePower * (activePokemon.baseStats.attack / opponent.baseStats.defense) / 20 + 2
    );
    const damage = Math.max(2, Math.floor(baseDamage * (0.85 + Math.random() * 0.15)));
    const nextOpponentHp = Math.max(0, opponent.hpRemaining - damage);

    const playerLog = `🔥 ${activePokemon.name} used ${moveName}! It dealt ${damage} damage to ${opponent.name}.`;
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
        const rewardXP = activePokemon.isFused ? Math.floor(baseXP * 1.5) : baseXP;
        setCombatLog((prev) => [
          ...prev,
          `🏆 Wild ${opponent.name} fainted!`,
          `✨ ${activePokemon.name} won the combat and gained +${rewardXP} EXP!`,
        ]);
        onVictory(rewardXP);
      }, 800);
      return;
    }

    // --- OPPONENT COUNTER TURN ---
    setTimeout(() => {
      setAnimatingPlayerHit(true);
      setTimeout(() => setAnimatingPlayerHit(false), 300);

      // Simple normal wild strike
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
        `💥 ${opponent.name} fought back with ${opMoveName}! Dealt ${opponentDamage} damage.`,
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
    const list: { name: string; power: number }[] = [];

    // 1. Move 1: STAB Primary Type Move
    const pType = poke.types[0] || "Normal";
    let move1 = { name: "Tackle", power: 30 };
    if (pType === "Fire") move1 = poke.level >= 15 ? { name: "Flamethrower", power: 45 } : { name: "Ember", power: 30 };
    else if (pType === "Water") move1 = poke.level >= 15 ? { name: "Hydro Pump", power: 45 } : { name: "Water Gun", power: 30 };
    else if (pType === "Grass") move1 = poke.level >= 15 ? { name: "Giga Drain", power: 45 } : { name: "Vine Whip", power: 30 };
    else if (pType === "Electric") move1 = poke.level >= 15 ? { name: "Thunderbolt", power: 45 } : { name: "Thunder Shock", power: 30 };
    else if (pType === "Psychic") move1 = poke.level >= 15 ? { name: "Psybeam", power: 40 } : { name: "Confusion", power: 30 };
    else if (pType === "Ghost") move1 = poke.level >= 15 ? { name: "Shadow Ball", power: 45 } : { name: "Lick", power: 30 };
    else if (pType === "Dragon") move1 = poke.level >= 15 ? { name: "Dragon Claw", power: 45 } : { name: "Twister", power: 30 };
    else if (pType === "Fairy") move1 = poke.level >= 15 ? { name: "Dazzling Gleam", power: 45 } : { name: "Fairy Wind", power: 30 };
    else if (pType === "Normal") move1 = poke.level >= 15 ? { name: "Double-Edge", power: 45 } : { name: "Pound", power: 25 };
    else if (pType === "Poison") move1 = { name: "Sludge Bomb", power: 40 };
    else if (pType === "Ground") move1 = { name: "Mud-Slap", power: 30 };
    else if (pType === "Flying") move1 = { name: "Gust", power: 30 };
    else if (pType === "Fighting") move1 = { name: "Karate Chop", power: 35 };
    list.push(move1);

    // 2. Move 2: Secondary STAB or Tactical Element Move
    const sType = poke.types[1] || "Normal";
    let move2 = { name: "Slash", power: 35 };
    if (sType === "Fire") move2 = { name: "Flame Wheel", power: 35 };
    else if (sType === "Water") move2 = { name: "Water Pulse", power: 35 };
    else if (sType === "Grass") move2 = { name: "Mega Drain", power: 35 };
    else if (sType === "Electric") move2 = { name: "Spark", power: 35 };
    else if (sType === "Psychic") move2 = { name: "Psybeam", power: 35 };
    else if (sType === "Ghost") move2 = { name: "Night Shade", power: 35 };
    else if (sType === "Dragon") move2 = { name: "Dragon Breath", power: 40 };
    else if (sType === "Fairy") move2 = { name: "Disarming Voice", power: 30 };
    else if (sType === "Poison") move2 = { name: "Poison Fang", power: 35 };
    else if (sType === "Ground") move2 = { name: "Mud Shot", power: 35 };
    else if (sType === "Flying") move2 = { name: "Wing Attack", power: 35 };
    else if (sType === "Fighting") move2 = { name: "Low Kick", power: 35 };
    list.push(move2);

    // 3. Move 3: Physical / Structural Tackle
    let move3 = { name: "Quick Attack", power: 25 };
    if (poke.level >= 22) {
      move3 = { name: "Extreme Speed", power: 45 };
    } else if (poke.level >= 12) {
      move3 = { name: "Slam Tackle", power: 35 };
    }
    list.push(move3);

    // 4. Move 4: Ultimate / Signature Move
    let move4 = { name: "Quick Guard", power: 15 };
    if (poke.isFused && poke.signatureMove) {
      move4 = { name: poke.signatureMove.name, power: poke.signatureMove.power };
    } else {
      if (pType === "Fire") move4 = { name: "Fire Blast", power: 55 };
      else if (pType === "Water") move4 = { name: "Hydro Pump", power: 55 };
      else if (pType === "Grass") move4 = { name: "Solar Beam", power: 55 };
      else if (pType === "Electric") move4 = { name: "Thunder", power: 55 };
      else if (pType === "Dragon") move4 = { name: "Outrage", power: 60 };
      else if (pType === "Normal") move4 = { name: "Hyper Beam", power: 60 };
      else move4 = { name: "Giga Impact", power: 50 };
    }
    list.push(move4);

    return list;
  };

  const moves = getCompanionMoves(activePokemon);

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
              <span className="text-xs uppercase tracking-widest text-slate-400 font-mono px-1">
                Select Skill Ability:
              </span>
              <div className="grid grid-cols-2 gap-3">
                {moves.map((move, i) => (
                  <button
                    key={i}
                    onClick={() => handleAttack(move.name, move.power)}
                    disabled={!canAttack}
                    className="flex flex-col items-start px-4 py-3 bg-slate-950 border border-white/10 hover:border-indigo-500/50 rounded-xl hover:bg-slate-900 font-sans text-left transition disabled:opacity-40 disabled:pointer-events-none cursor-pointer hover:shadow-[0_0_15px_rgba(99,102,241,0.25)]"
                  >
                    <span className="font-bold text-sm text-slate-100 flex items-center gap-1">
                      <Zap className="w-3.5 h-3.5 text-indigo-400" /> {move.name}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">Power: {move.power}</span>
                  </button>
                ))}
              </div>
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
                <div className="p-4 bg-teal-500/10 rounded-full w-14 h-14 flex items-center justify-center mx-auto text-teal-400 border border-teal-500/20">
                  <Trophy className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-xl font-bold text-teal-400 font-display uppercase tracking-wider">Encounter Victorious!</h4>
                  <p className="text-xs font-mono text-slate-400">
                    Your Pokémon was highly disciplined in execution and completed tactical gains.
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
              Conclude Exercise
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
