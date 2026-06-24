import React, { useState, useEffect, useRef } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "motion/react";
import { PokemonInstance } from "../types";
import { TYPE_COLORS } from "../pokemonData";
import { Shield, Zap, Flame, Droplet, Wind, Sparkles, AlertCircle, Swords } from "lucide-react";

interface FusionCardProps {
  pokemon: PokemonInstance;
  onClick?: () => void;
  selected?: boolean;
  onInsertLeft?: () => void;
  onInsertRight?: () => void;
  onBattle?: () => void;
}

export const FusionCard: React.FC<FusionCardProps> = ({
  pokemon,
  onClick,
  selected,
  onInsertLeft,
  onInsertRight,
  onBattle,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [blendMode, setBlendMode] = useState<"overlap" | "split" | "hologram">("overlap");

  // Framer Motion spring 3D tilt tracking
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [15, -15]), { damping: 20, stiffness: 300 });
  const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-15, 15]), { damping: 20, stiffness: 300 });

  // Level up tracking & particle effect
  const prevLevelRef = useRef<number>(pokemon.level);
  const prevPokemonIdRef = useRef<string>(pokemon.id);
  const [particles, setParticles] = useState<{ id: number; x: number; y: number; size: number; color: string; tx: number; ty: number; delay: number; duration: number }[]>([]);
  const [showLevelUp, setShowLevelUp] = useState(false);

  useEffect(() => {
    // If the pokemon itself changed, just sync the refs and do not play animation
    if (pokemon.id !== prevPokemonIdRef.current) {
      prevPokemonIdRef.current = pokemon.id;
      prevLevelRef.current = pokemon.level;
      return;
    }

    if (pokemon.level > prevLevelRef.current) {
      setShowLevelUp(true);

      // Generate colorful bursting/glowing upward particles
      const newParticles = Array.from({ length: 24 }).map((_, i) => {
        const colors = ["#fbbf24", "#38bdf8", "#a855f7", "#ec4899", "#10b981", "#ffffff"];
        const color = colors[Math.floor(Math.random() * colors.length)];
        return {
          id: Math.random() + i,
          x: 100 + Math.random() * 80, // centered X starting point
          y: 200 + Math.random() * 60,  // mid-to-lower third starting point
          size: Math.random() * 6 + 4,   // 4px to 10px
          color,
          tx: (Math.random() - 0.5) * 140, // spread left/right
          ty: -180 - Math.random() * 100,   // shoot upwards
          delay: Math.random() * 0.15,      // slight stagger
          duration: Math.random() * 1.0 + 0.8 // 0.8s to 1.8s
        };
      });

      setParticles(newParticles);

      const timer = setTimeout(() => {
        setShowLevelUp(false);
        setParticles([]);
      }, 2400);

      prevLevelRef.current = pokemon.level;
      return () => clearTimeout(timer);
    }

    prevLevelRef.current = pokemon.level;
  }, [pokemon.level, pokemon.id]);

  function handleMouseMove(event: React.MouseEvent<HTMLDivElement>) {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = event.clientX - rect.left - width / 2;
    const mouseY = event.clientY - rect.top - height / 2;
    x.set(mouseX / width);
    y.set(mouseY / height);
  }

  function handleMouseLeave() {
    x.set(0);
    y.set(0);
  }

  // Draw fusion composites in a standard <canvas> with real-time animation loop if fused
  useEffect(() => {
    if (!pokemon.isFused || !pokemon.fusionParents) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = 400;
    canvas.height = 400;

    const img1 = new Image();
    const img2 = new Image();
    img1.crossOrigin = "anonymous";
    img2.crossOrigin = "anonymous";

    let loadedCount = 0;
    let animationFrameId: number;

    const handleLoad = () => {
      loadedCount++;
      if (loadedCount === 2) {
        startLoop();
      }
    };

    img1.src = pokemon.fusionParents.pokemon1.sprite;
    img2.src = pokemon.fusionParents.pokemon2.sprite;
    img1.onload = handleLoad;
    img2.onload = handleLoad;

    const startLoop = () => {
      const render = () => {
        if (!ctx) return;
        ctx.clearRect(0, 0, 400, 400);

        // Draw background glow
        const grad = ctx.createRadialGradient(200, 200, 50, 200, 200, 200);
        grad.addColorStop(0, pokemon.colors?.primary || "#FF005544");
        grad.addColorStop(1, "transparent");
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 400, 400);

        if (blendMode === "overlap") {
          // Quantum Bond Layering! Beautiful hue-glowing overlaps with chemical covalent links
          // Parent 1 (left shifted translucent avatar)
          ctx.save();
          ctx.globalAlpha = 0.7;
          ctx.shadowColor = pokemon.colors?.primary || "#a855f7";
          ctx.shadowBlur = 8;
          ctx.drawImage(img1, 20, 50, 280, 280);
          ctx.restore();

          // Parent 2 (right shifted crystal avatar)
          ctx.save();
          ctx.globalAlpha = 1.0;
          ctx.shadowColor = pokemon.colors?.secondary || "#06b6d4";
          ctx.shadowBlur = 18;
          ctx.drawImage(img2, 100, 70, 280, 280);
          ctx.restore();

          // Covalent dynamic pairing cables
          const pulse = Math.sin(Date.now() * 0.005) * 6 + 12;
          ctx.save();
          ctx.strokeStyle = "rgba(255, 255, 255, 0.25)";
          ctx.shadowColor = pokemon.colors?.primary || "#6366f1";
          ctx.shadowBlur = pulse;
          ctx.lineWidth = 1.5;
          ctx.setLineDash([5, 5]);

          ctx.beginPath();
          // Head connection
          ctx.moveTo(170, 130);
          ctx.lineTo(250, 150);
          // Body connection
          ctx.moveTo(140, 180);
          ctx.lineTo(230, 200);
          // Tail connection
          ctx.moveTo(160, 250);
          ctx.lineTo(240, 270);
          ctx.stroke();
          ctx.restore();

        } else if (blendMode === "split") {
          // Spliced Hybrid Chimera: Flawless physical left-half/right-half genetic alignment!
          ctx.save();
          ctx.beginPath();
          ctx.rect(0, 0, 200, 400);
          ctx.clip();
          ctx.drawImage(img1, 50, 50, 300, 300);
          ctx.restore();

          ctx.save();
          ctx.beginPath();
          ctx.rect(200, 0, 200, 400);
          ctx.clip();
          ctx.drawImage(img2, 50, 50, 300, 300);
          ctx.restore();

          // High-energy laser seam suture
          ctx.save();
          ctx.shadowColor = pokemon.colors?.primary || "#6366f1";
          ctx.shadowBlur = 16;
          ctx.strokeStyle = "#ffffff";
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.moveTo(200, 50);
          ctx.lineTo(200, 350);
          ctx.stroke();

          // Animated genetic spark nodes travelling along the stitch seam
          const time = Date.now() * 0.003;
          const nodeY1 = 120 + Math.sin(time) * 70;
          const nodeY2 = 280 + Math.cos(time) * 70;

          ctx.fillStyle = "#ffffff";
          ctx.shadowColor = pokemon.colors?.secondary || "#38bdf8";
          ctx.shadowBlur = 15;
          ctx.beginPath();
          ctx.arc(200, nodeY1, 6, 0, Math.PI * 2);
          ctx.arc(200, nodeY2, 6, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();

        } else if (blendMode === "hologram") {
          // Bio-Synthesis Pixel Morph: Sliced cross-blend gradient sequence (CORS-friendly!)
          const startX = 50;
          const width = 300;
          const slices = 25;
          const sliceW = width / slices;

          for (let i = 0; i < slices; i++) {
            const xPos = startX + i * sliceW;
            const t = i / (slices - 1); // 0.0 to 1.0

            // Cosine distribution curve for smooth physical transition
            const alpha1 = Math.cos(t * Math.PI * 0.5);
            const alpha2 = Math.sin(t * Math.PI * 0.5);

            // Left Parent Slice
            ctx.save();
            ctx.beginPath();
            ctx.rect(xPos, 50, sliceW + 0.5, 300);
            ctx.clip();
            ctx.globalAlpha = alpha1;
            ctx.drawImage(img1, 50, 50, 300, 300);
            ctx.restore();

            // Right Parent Slice
            ctx.save();
            ctx.beginPath();
            ctx.rect(xPos, 50, sliceW + 0.5, 300);
            ctx.clip();
            ctx.globalAlpha = alpha2;
            ctx.drawImage(img2, 50, 50, 300, 300);
            ctx.restore();
          }

          // Quantum scan laser sweep
          ctx.save();
          const scanY = 60 + ((Date.now() * 0.08) % 280);
          ctx.strokeStyle = "rgba(255, 255, 255, 0.45)";
          ctx.lineWidth = 2;
          ctx.shadowColor = pokemon.colors?.secondary || "#6366f1";
          ctx.shadowBlur = 10;
          ctx.beginPath();
          ctx.moveTo(50, scanY);
          ctx.lineTo(350, scanY);
          ctx.stroke();
          ctx.restore();

          // Cyber matrix grid lines
          ctx.save();
          ctx.strokeStyle = "rgba(99, 102, 241, 0.06)";
          ctx.lineWidth = 1;
          for (let y = 60; y < 340; y += 4) {
            ctx.beginPath();
            ctx.moveTo(50, y);
            ctx.lineTo(350, y);
            ctx.stroke();
          }
          ctx.restore();
        }

        // Draw elegant circuit line overlay
        ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(50, 350);
        ctx.lineTo(350, 350);
        ctx.stroke();

        animationFrameId = requestAnimationFrame(render);
      };

      render();
    };

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [pokemon, blendMode]);

  const primaryColor = pokemon.colors?.primary || TYPE_COLORS[pokemon.types[0]] || "#777777";
  const secondaryColor = pokemon.colors?.secondary || TYPE_COLORS[pokemon.types[1]] || primaryColor;

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      style={{
        rotateX,
        rotateY,
        transformStyle: "preserve-3d",
      }}
      className={`relative w-full max-w-[320px] min-h-[395px] flex flex-col rounded-3xl cursor-pointer select-none overflow-hidden transition-all duration-300 ${
        selected ? "ring-4 ring-indigo-505 ring-[#6366f1] shadow-[0_0_20px_rgba(99,102,241,0.5)] scale-[1.02]" : "hover:scale-[1.01]"
      }`}
      id={`pokemon-card-${pokemon.id}`}
    >
      {/* Background card gradient */}
      <div
        className="absolute inset-0 opacity-90"
        style={{
          background: `linear-gradient(135deg, ${primaryColor}dd 0%, ${secondaryColor}cc 100%)`,
        }}
      />

      {/* Cyber/Holographic mesh texture overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.06)_1px,transparent_1px)] bg-[size:14px_24px]" />

      {/* Futuristic shiny overlay */}
      <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/5 to-white/20 pointer-events-none" />
      {pokemon.isShiny && (
        <>
          {/* Animated cosmic shimmer overlay */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,215,0,0.15)_0%,transparent_60%)] animate-pulse pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-transparent to-amber-500/10 pointer-events-none" />
          {/* Sparkles trailing elements */}
          <div className="absolute top-2 right-2 flex gap-1 animate-bounce pointer-events-none">
            <Sparkles className="w-4 h-4 text-amber-300 animate-spin" />
          </div>
        </>
      )}

      {/* Dynamic Level Up Particles */}
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full pointer-events-none z-30"
          style={{
            left: p.x,
            top: p.y,
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            boxShadow: `0 0 10px ${p.color}`,
          }}
          initial={{ x: 0, y: 0, opacity: 1, scale: 0.2 }}
          animate={{
            x: p.tx,
            y: p.ty,
            opacity: [1, 1, 0],
            scale: [0.2, 1.2, 0],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            ease: "easeOut",
          }}
        />
      ))}

      {/* Floating Level Up Celebration Banner */}
      {showLevelUp && (
        <div className="absolute inset-0 pointer-events-none z-30 flex flex-col items-center justify-center bg-slate-950/30 backdrop-blur-[1px] transition-all duration-300">
          <motion.div
            initial={{ scale: 0.3, opacity: 0, y: 40 }}
            animate={{
              scale: [0.3, 1.15, 1],
              opacity: [0, 1, 1, 0],
              y: [40, -10, -35],
            }}
            transition={{
              duration: 2.2,
              times: [0, 0.15, 0.85, 1],
              ease: "easeOut",
            }}
            className="flex flex-col items-center gap-1.5"
          >
            {/* Pulsing visual energy circles */}
            <div className="absolute w-24 h-24 rounded-full bg-amber-400/20 animate-ping border border-amber-400/30" />
            <div className="absolute w-32 h-32 rounded-full bg-indigo-500/15 animate-pulse border border-indigo-400/20" />

            {/* Glowing Icon Holder */}
            <div className="relative p-3 bg-gradient-to-br from-amber-400 to-yellow-600 rounded-2xl border border-amber-300/30 shadow-[0_0_20px_rgba(245,158,11,0.6)]">
              <Sparkles className="w-6 h-6 text-white animate-spin" />
            </div>

            {/* LEVEL UP! text badge */}
            <div className="px-3.5 py-1 bg-slate-950/95 border border-amber-400/50 rounded-full shadow-[0_0_15px_rgba(251,191,36,0.4)]">
              <span className="text-xs font-extrabold font-display tracking-widest text-amber-300 uppercase italic flex items-center gap-1">
                LEVEL UP!
              </span>
            </div>

            {/* Next Level Indicator */}
            <span className="text-lg font-bold text-white font-mono tracking-tight drop-shadow-[0_2px_6px_rgba(0,0,0,0.9)]">
              LV. {pokemon.level}
            </span>
          </motion.div>
        </div>
      )}

      {/* Content wrapper with perspective */}
      <div className="relative flex-1 flex flex-col justify-between p-5 text-white" style={{ transform: "translateZ(30px)" }}>
        {/* Header line */}
        <div className="flex justify-between items-center z-10">
          <div className="flex flex-col">
            <span className="text-[10px] uppercase tracking-widest font-mono text-white/70">
              {pokemon.isFused ? "Hybrid Fusion" : `Stage ${pokemon.stage}`}
            </span>
            <h3 className="text-xl font-bold font-sans tracking-tight leading-tight">{pokemon.name}</h3>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-sm font-mono font-semibold bg-white/10 px-2.5 py-0.5 rounded-full border border-white/10">
              Lv.{pokemon.level}
            </span>
          </div>
        </div>

        {/* Sprite Display Container */}
        <div className="relative flex-1 flex items-center justify-center -my-3 group">
          {pokemon.isFused ? (
            <div className="relative w-full h-[180px] flex items-center justify-center">
              <canvas ref={canvasRef} className="w-full h-full object-contain pointer-events-none" />
              {/* Blend control toolbar */}
              <div className="absolute bottom-[-10px] left-1/2 transform -translate-x-1/2 flex gap-1.5 bg-black/80 backdrop-blur-md px-2.5 py-1 rounded-full text-[10px] border border-white/15 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-30 shadow-lg shadow-black/80">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setBlendMode("overlap");
                  }}
                  className={`px-2 py-0.5 rounded-full transition font-mono ${blendMode === "overlap" ? "bg-indigo-600 text-white font-bold" : "text-slate-400 hover:text-white"}`}
                  title="Covalent Quantum Bonding"
                >
                  Bond
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setBlendMode("split");
                  }}
                  className={`px-2 py-0.5 rounded-full transition font-mono ${blendMode === "split" ? "bg-indigo-600 text-white font-bold" : "text-slate-400 hover:text-white"}`}
                  title="Physical Genetic Splicing Sequence"
                >
                  Spliced
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setBlendMode("hologram");
                  }}
                  className={`px-2 py-0.5 rounded-full transition font-mono ${blendMode === "hologram" ? "bg-indigo-600 text-white font-bold" : "text-slate-400 hover:text-white"}`}
                  title="Seamless Gradient Bio-Synthesis Morph"
                >
                  Synth
                </button>
              </div>
            </div>
          ) : (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="relative w-[180px] h-[180px] flex items-center justify-center"
            >
              <div className={`absolute inset-0 rounded-full blur-xl group-hover:bg-white/10 transition-colors ${pokemon.isShiny ? "bg-amber-400/20 shadow-[0_0_20px_rgba(251,191,36,0.3)]" : "bg-white/5"}`} />
              <img
                src={pokemon.sprite}
                alt={pokemon.name}
                referrerPolicy="no-referrer"
                className={`w-full h-full object-contain filter drop-shadow-[0_8px_16px_rgba(0,0,0,0.3)] group-hover:scale-105 transition-transform duration-300 ${pokemon.isShiny ? "brightness-110 contrast-105" : ""}`}
              />
              {pokemon.isShiny && (
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-amber-300 animate-pulse absolute top-4 left-4" />
                  <Sparkles className="w-4 h-4 text-white animate-ping absolute bottom-4 right-4" />
                </div>
              )}
            </motion.div>
          )}
        </div>

        {/* Footer Info / Attributes */}
        <div className="z-10 bg-black/40 backdrop-blur-md rounded-2xl p-3 border border-white/10 space-y-2">
          {/* Types and XP */}
          <div className="flex justify-between items-center text-xs">
            <div className="flex gap-1.5">
              {pokemon.types.map((type) => (
                <span
                  key={type}
                  style={{ backgroundColor: TYPE_COLORS[type] || "#777777" }}
                  className="px-2 py-0.5 rounded text-[10px] font-semibold tracking-wide shadow-sm"
                >
                  {type}
                </span>
              ))}
            </div>
            {pokemon.isShiny && (
              <span className="flex items-center gap-1 text-amber-300 font-mono text-[10px] font-bold animate-pulse">
                <Sparkles className="w-3 h-3 text-amber-300 fill-amber-300/30 animate-spin" /> SHINY
              </span>
            )}
            {pokemon.isFused && (
              <span className="flex items-center gap-1 text-indigo-300 font-mono text-[10px] font-bold">
                <Sparkles className="w-3 h-3 text-indigo-300" /> FUSED
              </span>
            )}
          </div>

          {/* Stat summary */}
          <div className="grid grid-cols-3 gap-y-1 gap-x-2 text-[10px] font-mono border-t border-white/5 pt-2 text-white/80">
            <div>
              <span className="text-white/40">HP:</span> {pokemon.baseStats.hp}
            </div>
            <div>
              <span className="text-white/40">ATK:</span> {pokemon.baseStats.attack}
            </div>
            <div>
              <span className="text-white/40">DEF:</span> {pokemon.baseStats.defense}
            </div>
            <div>
              <span className="text-white/40">SATK:</span> {pokemon.baseStats.spAtk}
            </div>
            <div>
              <span className="text-white/40">SDEF:</span> {pokemon.baseStats.spDef}
            </div>
            <div>
              <span className="text-white/40">SPD:</span> {pokemon.baseStats.speed}
            </div>
          </div>

          {/* Level / XP Progress bar */}
          <div className="space-y-1">
            <div className="flex justify-between text-[8px] font-mono text-white/50">
              <span>EXP Progress</span>
              <span>
                {pokemon.exp}/{pokemon.expNeeded}
              </span>
            </div>
            <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, (pokemon.exp / pokemon.expNeeded) * 100)}%` }}
                className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]"
              />
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex gap-1.5 pt-2 border-t border-white/5 relative z-20">
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (onInsertLeft) onInsertLeft();
              }}
              title="Insert to Left Reactor"
              className="flex-1 py-1 px-1 bg-slate-950 hover:bg-slate-900 border border-white/10 rounded-xl text-[9px] font-mono font-bold tracking-tighter text-slate-300 hover:text-white transition flex items-center justify-center gap-1 cursor-pointer active:scale-95"
            >
              ← Pod L
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (onBattle) onBattle();
              }}
              title="Battle & Train"
              className="flex-1.5 py-1 px-1.5 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-[9px] font-mono font-bold tracking-wide text-white transition flex items-center justify-center gap-1 cursor-pointer active:scale-95"
            >
              <Swords className="w-3 h-3 text-white" /> Battle
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (onInsertRight) onInsertRight();
              }}
              title="Insert to Right Reactor"
              className="flex-1 py-1 px-1 bg-slate-950 hover:bg-slate-900 border border-white/10 rounded-xl text-[9px] font-mono font-bold tracking-tighter text-slate-300 hover:text-white transition flex items-center justify-center gap-1 cursor-pointer active:scale-95"
            >
              Pod R →
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
