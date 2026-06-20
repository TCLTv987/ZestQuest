import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { PokemonInstance } from "../types";
import { Sparkles, ArrowRight, TrendingUp } from "lucide-react";

interface EvolutionOverlayProps {
  pokemonBefore: PokemonInstance;
  pokemonAfter: PokemonInstance;
  onComplete: () => void;
}

export function EvolutionOverlay({ pokemonBefore, pokemonAfter, onComplete }: EvolutionOverlayProps) {
  const [phase, setPhase] = useState<"intro" | "glowing" | "reveal">("intro");

  useEffect(() => {
    // Stage-managed cinematic timing
    const timer1 = setTimeout(() => setPhase("glowing"), 2000);
    const timer2 = setTimeout(() => setPhase("reveal"), 4500);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, []);

  // Calculate stat changes
  const statDiffs = {
    hp: pokemonAfter.baseStats.hp - pokemonBefore.baseStats.hp,
    attack: pokemonAfter.baseStats.attack - pokemonBefore.baseStats.attack,
    defense: pokemonAfter.baseStats.defense - pokemonBefore.baseStats.defense,
    spAtk: pokemonAfter.baseStats.spAtk - pokemonBefore.baseStats.spAtk,
    spDef: pokemonAfter.baseStats.spDef - pokemonBefore.baseStats.spDef,
    speed: pokemonAfter.baseStats.speed - pokemonBefore.baseStats.speed,
  };

  return (
    <div className="fixed inset-0 bg-slate-950/95 backdrop-blur-2xl z-50 flex flex-col items-center justify-center p-6 select-none overflow-hidden text-white">
      {/* Dynamic Cosmic Energy Particle Aura */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-40 overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-indigo-500/15 blur-[120px] animate-pulse" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full bg-purple-500/15 blur-[100px]" />
      </div>

      <AnimatePresence mode="wait">
        {phase === "intro" && (
          <motion.div
            key="intro"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            className="z-10 flex flex-col items-center text-center space-y-6 animate-fade-in"
          >
            <span className="text-xs tracking-widest uppercase text-indigo-300 font-mono flex items-center gap-1.5 px-3 py-1 bg-indigo-500/10 rounded-full border border-indigo-500/20">
              <Sparkles className="w-3.5 h-3.5" /> Evolutionary Resonance
            </span>
            <h2 className="text-4xl md:text-5xl font-display tracking-tight font-extrabold max-w-xl uppercase italic">
              What? <span className="text-indigo-400">{pokemonBefore.name}</span> is evolving!
            </h2>
            <div className="relative w-64 h-64 flex items-center justify-center mt-6">
              <motion.img
                animate={{
                  scale: [1, 1.05, 0.95, 1.1, 1],
                  rotate: [0, -3, 3, -1, 0],
                }}
                transition={{ repeat: Infinity, duration: 1.5 }}
                src={pokemonBefore.sprite}
                alt={pokemonBefore.name}
                referrerPolicy="no-referrer"
                className="w-full h-full object-contain filter drop-shadow-[0_0_40px_rgba(99,102,241,0.4)]"
              />
            </div>
            <p className="text-sm text-slate-400 font-mono uppercase tracking-widest">Drawing raw elemental energy...</p>
          </motion.div>
        )}

        {phase === "glowing" && (
          <motion.div
            key="glowing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="z-10 flex flex-col items-center justify-center text-center space-y-8"
          >
            <div className="relative w-72 h-72 flex items-center justify-center">
              {/* Spinning energy rings */}
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
                className="absolute inset-0 rounded-full border-4 border-dashed border-indigo-400/20"
              />
              <motion.div
                animate={{ rotate: -360 }}
                transition={{ repeat: Infinity, duration: 5, ease: "linear" }}
                className="absolute -inset-4 rounded-full border border-double border-purple-500/30"
              />

              {/* Shifting sprites morph simulation */}
              <motion.img
                animate={{
                  filter: ["brightness(1) contrast(1)", "brightness(5) contrast(1.5)", "brightness(1) contrast(1)"],
                  scale: [1, 1.3, 0.7, 1.5],
                }}
                transition={{ duration: 2.5 }}
                src={pokemonBefore.sprite}
                alt={pokemonBefore.name}
                referrerPolicy="no-referrer"
                className="absolute w-56 h-56 object-contain"
              />
            </div>
            <div className="space-y-1">
              <div className="h-1.5 w-48 bg-slate-900 border border-white/5 rounded-full overflow-hidden mx-auto">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 2.5 }}
                  className="h-full bg-gradient-to-r from-indigo-500 to-purple-500"
                />
              </div>
              <p className="text-xs font-mono text-slate-400 uppercase tracking-widest pt-2">Synthesizing cellular genetic matrix...</p>
            </div>
          </motion.div>
        )}

        {phase === "reveal" && (
          <motion.div
            key="reveal"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="z-10 flex flex-col items-center text-center space-y-6 max-w-4xl"
          >
            <motion.div
              initial={{ scale: 0, rotate: -45 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", damping: 12 }}
              className="px-4 py-1.5 bg-teal-500/15 text-teal-300 border border-teal-500/20 rounded-full text-xs font-semibold tracking-wider font-mono flex items-center gap-1.5 uppercase"
            >
              <Sparkles className="w-4.5 h-4.5" /> EVOLUTION SUCCESSFUL
            </motion.div>

            <h2 className="text-4xl md:text-5xl font-extrabold font-display tracking-tight uppercase italic leading-tight">
              Congratulations! <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">{pokemonBefore.name}</span> evolved into <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 to-teal-300">{pokemonAfter.name}</span>!
            </h2>

            {/* Displaying dual visual comparative mapping */}
            <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-6 py-4 w-full max-w-2xl">
              <div className="flex flex-col items-center bg-slate-900/60 p-5 rounded-2xl border border-white/5">
                <span className="text-xs text-slate-400 mb-2 font-mono uppercase tracking-wider">Original Form</span>
                <img src={pokemonBefore.sprite} alt={pokemonBefore.name} referrerPolicy="no-referrer" className="w-32 h-32 object-contain" />
                <span className="font-semibold">{pokemonBefore.name}</span>
                <span className="text-xs text-slate-500 font-mono">Lv. {pokemonBefore.level}</span>
              </div>

              <div className="flex justify-center">
                <div className="p-3 bg-slate-800 border border-white/10 rounded-full">
                  <ArrowRight className="w-6 h-6 text-indigo-400 animate-pulse" />
                </div>
              </div>

              <div className="flex flex-col items-center bg-slate-900/60 p-5 rounded-2xl border border-white/5">
                <span className="text-xs text-indigo-300 mb-2 font-mono uppercase tracking-wider">Evolved Form</span>
                <img src={pokemonAfter.sprite} alt={pokemonAfter.name} referrerPolicy="no-referrer" className="w-32 h-32 object-contain filter drop-shadow-[0_0_20px_rgba(99,102,241,0.4)]" />
                <span className="font-semibold text-indigo-400">{pokemonAfter.name}</span>
                <span className="text-xs text-slate-500 font-mono">Lv. {pokemonAfter.level}</span>
              </div>
            </div>

            {/* Stats delta overview panel */}
            <div className="bg-slate-900/60 border border-white/5 rounded-3xl p-5 w-full max-w-lg space-y-3">
              <h4 className="text-xs tracking-widest uppercase text-slate-400 font-mono flex items-center gap-1.5 justify-center mb-1 font-bold">
                <TrendingUp className="w-4 h-4 text-emerald-400 animate-bounce" /> Stats Breakthrough
              </h4>
              <div className="grid grid-cols-3 gap-3 text-xs font-mono">
                <div className="bg-slate-950 border border-white/5 px-2.5 py-1.5 rounded-xl flex flex-col items-center">
                  <span className="text-white/40 text-[10px]">HP</span>
                  <span className="font-bold text-slate-200">{pokemonAfter.baseStats.hp}</span>
                  <span className="text-emerald-400 text-[10px]">+{statDiffs.hp}</span>
                </div>
                <div className="bg-slate-950 border border-white/5 px-2.5 py-1.5 rounded-xl flex flex-col items-center">
                  <span className="text-white/40 text-[10px]">Attack</span>
                  <span className="font-bold text-slate-200">{pokemonAfter.baseStats.attack}</span>
                  <span className="text-emerald-400 text-[10px]">+{statDiffs.attack}</span>
                </div>
                <div className="bg-slate-950 border border-white/5 px-2.5 py-1.5 rounded-xl flex flex-col items-center">
                  <span className="text-white/40 text-[10px]">Defense</span>
                  <span className="font-bold text-slate-200">{pokemonAfter.baseStats.defense}</span>
                  <span className="text-emerald-400 text-[10px]">+{statDiffs.defense}</span>
                </div>
                <div className="bg-slate-950 border border-white/5 px-2.5 py-1.5 rounded-xl flex flex-col items-center">
                  <span className="text-white/40 text-[10px]">Sp. Atk</span>
                  <span className="font-bold text-slate-200">{pokemonAfter.baseStats.spAtk}</span>
                  <span className="text-emerald-400 text-[10px]">+{statDiffs.spAtk}</span>
                </div>
                <div className="bg-slate-950 border border-white/5 px-2.5 py-1.5 rounded-xl flex flex-col items-center">
                  <span className="text-white/40 text-[10px]">Sp. Def</span>
                  <span className="font-bold text-slate-200">{pokemonAfter.baseStats.spDef}</span>
                  <span className="text-emerald-400 text-[10px]">+{statDiffs.spDef}</span>
                </div>
                <div className="bg-slate-950 border border-white/5 px-2.5 py-1.5 rounded-xl flex flex-col items-center">
                  <span className="text-white/40 text-[10px]">Speed</span>
                  <span className="font-bold text-slate-200">{pokemonAfter.baseStats.speed}</span>
                  <span className="text-emerald-400 text-[10px]">+{statDiffs.speed}</span>
                </div>
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              onClick={onComplete}
              className="mt-6 px-10 py-3 bg-indigo-600 text-white rounded-full text-xs font-bold uppercase tracking-widest shadow-lg shadow-indigo-600/20 hover:bg-indigo-500 active:scale-95 transition cursor-pointer"
            >
              Excellent! Continue Journey
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
