import React, { useState, useEffect, useRef, useCallback } from "react";
import * as THREE from "three";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
} from "recharts";
import {
  Brain,
  Zap,
  Skull,
  Sparkles,
  Download,
  Link2,
  Check,
  Clock,
  RotateCcw,
  ChevronRight,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  DATA                                                               */
/* ------------------------------------------------------------------ */

const QUESTIONS = [
  {
    id: 1,
    category: "slang",
    prompt: "Someone in the group chat types \"that's crazy, no cap, fr fr.\" You:",
    options: [
      { text: "Have no idea what any of those words mean", points: 0 },
      { text: "Nod along and hope context saves you", points: 1 },
      { text: "Reply \"ong\" without even thinking", points: 2 },
      { text: "Already said all three before they finished typing", points: 3 },
    ],
  },
  {
    id: 2,
    category: "slang",
    prompt: "A coworker calls a slow Tuesday afternoon \"so Ohio.\" What just happened?",
    options: [
      { text: "You assume they mean the actual state", points: 0 },
      { text: "You laugh but don't fully get it", points: 1 },
      { text: "You know it means something's cursed", points: 2 },
      { text: "You've called three unrelated things \"Ohio\" today", points: 3 },
    ],
  },
  {
    id: 3,
    category: "slang",
    prompt: "Someone tells you that you've got \"the rizz.\" Your reaction:",
    options: [
      { text: "Bless you?", points: 0 },
      { text: "You think it's a compliment, you'll take it", points: 1 },
      { text: "Obviously — you were born with unspoken rizz", points: 2 },
      { text: "You clip it immediately for the rizz reel", points: 3 },
    ],
  },
  {
    id: 4,
    category: "slang",
    prompt: "Where do you land on the sigma / alpha / beta scale?",
    options: [
      { text: "The what scale", points: 0 },
      { text: "Looked it up once out of confusion", points: 1 },
      { text: "Know exactly where you land, defend it fiercely", points: 2 },
      { text: "Made an unprompted slideshow about it", points: 3 },
    ],
  },
  {
    id: 5,
    category: "screen",
    prompt: "It's 3:14 AM and your screen time report just lit up. You:",
    options: [
      { text: "This never happens, you're asleep by 10", points: 0 },
      { text: "Wince, close the app immediately", points: 1 },
      { text: "Scroll a little more out of spite", points: 2 },
      { text: "Scream internally, keep the streak alive", points: 3 },
    ],
  },
  {
    id: 6,
    category: "screen",
    prompt: "Describe your average pre-bed scroll session:",
    options: [
      { text: "You don't really scroll before bed", points: 0 },
      { text: "Ten minutes, tops, then lights out", points: 1 },
      { text: "An hour disappears and you don't notice", points: 2 },
      { text: "You've watched the sunrise through the screen", points: 3 },
    ],
  },
  {
    id: 7,
    category: "screen",
    prompt: "A video starts with unrelated gameplay running underneath the actual content. You:",
    options: [
      { text: "Distracting — close the tab", points: 0 },
      { text: "Mute the bottom half, focus on the top", points: 1 },
      { text: "Need both halves or you can't focus at all", points: 2 },
      { text: "Have started expecting a third layer by now", points: 3 },
    ],
  },
  {
    id: 8,
    category: "speed",
    prompt: "How fast do you know a meme is already dead?",
    options: [
      { text: "You find out from a cousin, months later", points: 0 },
      { text: "Usually right when it hits your feed", points: 1 },
      { text: "Called it dead before most people found it", points: 2 },
      { text: "Mourned and moved on before it even peaked", points: 3 },
    ],
  },
  {
    id: 9,
    category: "speed",
    prompt: "The \"oh no no no no no\" audio clip starts playing. You instantly know:",
    options: [
      { text: "Nothing, never heard that sound before", points: 0 },
      { text: "Something's about to go comically wrong", points: 1 },
      { text: "The exact video format this belongs to", points: 2 },
      { text: "You're already mouthing the next three seconds", points: 3 },
    ],
  },
];

const CATEGORY_META = {
  slang: { label: "Slang Lore", max: 12 },
  screen: { label: "Screen Time Risk", max: 9 },
  speed: { label: "Meme Speed", max: 6 },
};

const TIERS = [
  {
    max: 25,
    name: "Grounded Scholar",
    tagline: "Unused brain. Reads actual books.",
    color: "#22c55e",
    icon: Brain,
  },
  {
    max: 50,
    name: "Casual Scroller",
    tagline: "Knows mainstream memes, still functional.",
    color: "#3b82f6",
    icon: Sparkles,
  },
  {
    max: 75,
    name: "Chronic Doomscroller",
    tagline: "Uses slang in real life. Brain sloshing.",
    color: "#a855f7",
    icon: Zap,
  },
  {
    max: 100,
    name: "Terminal Brainrot",
    tagline: "Skibidi level achieved. Beyond saving.",
    color: "#ec4899",
    icon: Skull,
  },
];

const getTier = (pct) => TIERS.find((t) => pct <= t.max) || TIERS[TIERS.length - 1];

const TOTAL_POINTS = QUESTIONS.reduce((s) => s + 3, 0);
const QUESTION_TIME = 12;

/* ------------------------------------------------------------------ */
/*  THREE.JS BACKGROUND                                                */
/* ------------------------------------------------------------------ */

function ThreeBackground({ colorTarget }) {
  const mountRef = useRef(null);
  const stateRef = useRef({});

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      55,
      mount.clientWidth / mount.clientHeight,
      0.1,
      100
    );
    camera.position.z = 9;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mount.appendChild(renderer.domElement);

    const group = new THREE.Group();
    scene.add(group);

    const shapes = [];
    const geoFactories = [
      () => new THREE.IcosahedronGeometry(1.3, 0),
      () => new THREE.OctahedronGeometry(1.1, 0),
      () => new THREE.TorusKnotGeometry(0.8, 0.24, 90, 12),
      () => new THREE.IcosahedronGeometry(0.9, 1),
    ];

    for (let i = 0; i < 4; i++) {
      const geo = geoFactories[i]();
      const mat = new THREE.MeshBasicMaterial({
        color: 0xa855f7,
        wireframe: true,
        transparent: true,
        opacity: 0.55,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(
        Math.cos((i / 4) * Math.PI * 2) * 3.4,
        Math.sin((i / 4) * Math.PI * 2) * 2.2,
        -2 - i * 0.6
      );
      mesh.userData.spin = {
        x: 0.002 + Math.random() * 0.004,
        y: 0.003 + Math.random() * 0.004,
      };
      group.add(mesh);
      shapes.push(mesh);
    }

    const mouse = { x: 0, y: 0 };
    const onMove = (e) => {
      mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
    };
    window.addEventListener("mousemove", onMove);

    const onResize = () => {
      if (!mount) return;
      camera.aspect = mount.clientWidth / mount.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mount.clientWidth, mount.clientHeight);
    };
    window.addEventListener("resize", onResize);

    const currentColor = new THREE.Color(0xa855f7);
    let rafId;

    const animate = () => {
      rafId = requestAnimationFrame(animate);

      group.rotation.y += (mouse.x * 0.4 - group.rotation.y) * 0.02;
      group.rotation.x += (-mouse.y * 0.3 - group.rotation.x) * 0.02;

      shapes.forEach((mesh) => {
        mesh.rotation.x += mesh.userData.spin.x;
        mesh.rotation.y += mesh.userData.spin.y;
      });

      const target = new THREE.Color(stateRef.current.colorTarget || "#a855f7");
      currentColor.lerp(target, 0.03);
      shapes.forEach((mesh) => mesh.material.color.copy(currentColor));

      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("resize", onResize);
      shapes.forEach((mesh) => {
        mesh.geometry.dispose();
        mesh.material.dispose();
      });
      renderer.dispose();
      if (mount.contains(renderer.domElement)) {
        mount.removeChild(renderer.domElement);
      }
    };
  }, []);

  useEffect(() => {
    stateRef.current.colorTarget = colorTarget;
  }, [colorTarget]);

  return (
    <div
      ref={mountRef}
      className="absolute inset-0 pointer-events-none"
      style={{ zIndex: 0 }}
    />
  );
}

/* ------------------------------------------------------------------ */
/*  MAGNETIC BUTTON                                                    */
/* ------------------------------------------------------------------ */

function MagneticButton({ children, onClick, className = "", style = {} }) {
  const ref = useRef(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  const handleMove = (e) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    setOffset({ x: (e.clientX - cx) * 0.25, y: (e.clientY - cy) * 0.25 });
  };

  return (
    <button
      ref={ref}
      onMouseMove={handleMove}
      onMouseLeave={() => setOffset({ x: 0, y: 0 })}
      onClick={onClick}
      className={className}
      style={{
        ...style,
        transform: `translate(${offset.x}px, ${offset.y}px)`,
        transition: "transform 0.15s ease-out",
      }}
    >
      {children}
    </button>
  );
}

/* ------------------------------------------------------------------ */
/*  TILT CARD                                                          */
/* ------------------------------------------------------------------ */

function TiltCard({ children, className = "" }) {
  const ref = useRef(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  const handleMove = (e) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    setTilt({ x: py * -8, y: px * 8 });
  };

  return (
    <div
      ref={ref}
      onMouseMove={handleMove}
      onMouseLeave={() => setTilt({ x: 0, y: 0 })}
      className={className}
      style={{
        transform: `perspective(1200px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
        transformStyle: "preserve-3d",
        transition: "transform 0.2s ease-out",
      }}
    >
      {children}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  CIRCULAR GAUGE                                                     */
/* ------------------------------------------------------------------ */

function Gauge({ percent, color }) {
  const [display, setDisplay] = useState(0);
  const r = 88;
  const circumference = 2 * Math.PI * r;

  useEffect(() => {
    const t = setTimeout(() => setDisplay(percent), 150);
    return () => clearTimeout(t);
  }, [percent]);

  const offset = circumference - (display / 100) * circumference;

  return (
    <div className="relative w-56 h-56 flex items-center justify-center">
      <svg width="224" height="224" className="-rotate-90">
        <circle
          cx="112"
          cy="112"
          r={r}
          stroke="#1f1f2b"
          strokeWidth="14"
          fill="none"
        />
        <circle
          cx="112"
          cy="112"
          r={r}
          stroke={color}
          strokeWidth="14"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{
            transition: "stroke-dashoffset 1.4s cubic-bezier(.16,1,.3,1), stroke 0.6s",
            filter: `drop-shadow(0 0 10px ${color})`,
          }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span
          className="text-6xl font-black tabular-nums"
          style={{ fontFamily: "'Space Grotesk', sans-serif", color }}
        >
          {Math.round(display)}%
        </span>
        <span className="text-xs tracking-[0.3em] text-gray-400 mt-1 uppercase">
          Brainrot
        </span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  MAIN APP                                                           */
/* ------------------------------------------------------------------ */

export default function BrainrotAssessment() {
  const [stage, setStage] = useState("landing"); // landing | quiz | results
  const [qIndex, setQIndex] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [transitioning, setTransitioning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(QUESTION_TIME);
  const [selectedIdx, setSelectedIdx] = useState(null);
  const [copied, setCopied] = useState(false);

  const totalPoints = answers.reduce((s, a) => s + a.points, 0);
  const percent = Math.round((totalPoints / TOTAL_POINTS) * 100);
  const tier = getTier(percent);

  const catTotals = { slang: 0, screen: 0, speed: 0 };
  answers.forEach((a) => {
    catTotals[a.category] = (catTotals[a.category] || 0) + a.points;
  });

  const liveColor =
    stage === "results"
      ? tier.color
      : stage === "quiz"
      ? getTier(Math.round((totalPoints / ((qIndex || 1) * 3)) * 100)).color
      : "#a855f7";

  const commitAnswer = useCallback(
    (option) => {
      if (transitioning) return;
      setSelectedIdx(option === null ? -1 : option.idx);
      setTransitioning(true);
      const q = QUESTIONS[qIndex];
      const chosen = option || { points: 1 };
      setAnswers((prev) => [
        ...prev,
        { category: q.category, points: chosen.points },
      ]);
      setTimeout(() => {
        if (qIndex + 1 >= QUESTIONS.length) {
          setStage("results");
        } else {
          setQIndex((i) => i + 1);
          setSelectedIdx(null);
        }
        setTransitioning(false);
      }, 420);
    },
    [qIndex, transitioning]
  );

  // timer
  useEffect(() => {
    if (stage !== "quiz" || transitioning) return;
    setTimeLeft(QUESTION_TIME);
    const interval = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(interval);
          commitAnswer(null);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qIndex, stage]);

  const startQuiz = () => {
    setAnswers([]);
    setQIndex(0);
    setSelectedIdx(null);
    setStage("quiz");
  };

  const restart = () => {
    setAnswers([]);
    setQIndex(0);
    setSelectedIdx(null);
    setStage("landing");
  };

  const radarData = [
    { subject: "Slang Lore", value: Math.round((catTotals.slang / CATEGORY_META.slang.max) * 100) },
    { subject: "Screen Risk", value: Math.round((catTotals.screen / CATEGORY_META.screen.max) * 100) },
    { subject: "Meme Speed", value: Math.round((catTotals.speed / CATEGORY_META.speed.max) * 100) },
  ];

  const handleCopyUrl = () => {
    const payload = btoa(JSON.stringify({ p: percent, t: tier.name }));
    const url = `https://brainrot.diagnosis/r/${payload}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url).catch(() => {});
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const canvas = document.createElement("canvas");
    canvas.width = 900;
    canvas.height = 1100;
    const ctx = canvas.getContext("2d");

    const bg = ctx.createLinearGradient(0, 0, 0, 1100);
    bg.addColorStop(0, "#0a0a0f");
    bg.addColorStop(1, "#141420");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, 900, 1100);

    ctx.strokeStyle = tier.color;
    ctx.lineWidth = 6;
    ctx.strokeRect(24, 24, 852, 1052);

    ctx.textAlign = "center";
    ctx.fillStyle = "#9ca3af";
    ctx.font = "600 26px sans-serif";
    ctx.fillText("TERMINAL BRAINROT DIAGNOSIS", 450, 130);

    ctx.fillStyle = tier.color;
    ctx.font = "900 190px sans-serif";
    ctx.shadowColor = tier.color;
    ctx.shadowBlur = 40;
    ctx.fillText(`${percent}%`, 450, 400);
    ctx.shadowBlur = 0;

    ctx.fillStyle = "#f5f5f7";
    ctx.font = "800 54px sans-serif";
    ctx.fillText(tier.name, 450, 500);

    ctx.fillStyle = "#9ca3af";
    ctx.font = "400 28px sans-serif";
    wrapText(ctx, tier.tagline, 450, 555, 700, 34);

    const bars = [
      { label: "Slang Lore", v: radarData[0].value, color: "#a855f7" },
      { label: "Screen Time Risk", v: radarData[1].value, color: "#3b82f6" },
      { label: "Meme Speed", v: radarData[2].value, color: "#ec4899" },
    ];
    let y = 700;
    bars.forEach((b) => {
      ctx.textAlign = "left";
      ctx.fillStyle = "#e5e7eb";
      ctx.font = "600 26px sans-serif";
      ctx.fillText(b.label, 120, y);
      ctx.fillStyle = "#22232f";
      ctx.fillRect(120, y + 16, 660, 22);
      ctx.fillStyle = b.color;
      ctx.fillRect(120, y + 16, 660 * (b.v / 100), 22);
      ctx.textAlign = "right";
      ctx.fillStyle = "#9ca3af";
      ctx.font = "600 22px sans-serif";
      ctx.fillText(`${b.v}%`, 800, y + 33);
      y += 90;
    });

    ctx.textAlign = "center";
    ctx.fillStyle = "#4b5563";
    ctx.font = "500 22px sans-serif";
    ctx.fillText("brainrot.diagnosis", 450, 1040);

    const link = document.createElement("a");
    link.download = "brainrot-result.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
    const words = text.split(" ");
    let line = "";
    let curY = y;
    ctx.textAlign = "center";
    words.forEach((word) => {
      const test = line + word + " ";
      if (ctx.measureText(test).width > maxWidth && line) {
        ctx.fillText(line, x, curY);
        line = word + " ";
        curY += lineHeight;
      } else {
        line = test;
      }
    });
    ctx.fillText(line, x, curY);
  }

  return (
    <div
      className="relative w-full min-h-screen overflow-hidden text-white"
      style={{ background: "#0a0a0f", fontFamily: "'Plus Jakarta Sans', sans-serif" }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;700;900&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; }
        @keyframes floatY { 0%,100% { transform: translateY(0px); } 50% { transform: translateY(-14px); } }
        @keyframes gradientShift { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
        @keyframes slideInRight { from { opacity: 0; transform: translateX(60px) rotateY(-8deg); } to { opacity: 1; transform: translateX(0) rotateY(0deg); } }
        @keyframes slideOutLeft { from { opacity: 1; transform: translateX(0) rotateY(0deg); } to { opacity: 0; transform: translateX(-60px) rotateY(8deg); } }
        @keyframes sparklePop { 0% { opacity: 0; transform: scale(0) translateY(0); } 40% { opacity: 1; } 100% { opacity: 0; transform: scale(1) translateY(-30px); } }
        @keyframes pulseGlow { 0%,100% { opacity: 0.6; } 50% { opacity: 1; } }
        .brainrot-gradient-text {
          background: linear-gradient(90deg, #a855f7, #ec4899, #3b82f6, #a855f7);
          background-size: 300% 100%;
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
          animation: gradientShift 6s ease infinite;
        }
        .glass-card {
          background: rgba(20, 20, 32, 0.55);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255,255,255,0.08);
        }
        .q-enter { animation: slideInRight 0.42s cubic-bezier(.16,1,.3,1) both; }
        .q-exit { animation: slideOutLeft 0.4s cubic-bezier(.7,0,.84,0) both; }
        @media (prefers-reduced-motion: reduce) {
          .brainrot-gradient-text, .q-enter, .q-exit { animation: none !important; }
        }
      `}</style>

      <ThreeBackground colorTarget={liveColor} />

      {stage === "landing" && (
        <LandingScreen onStart={startQuiz} />
      )}

      {stage === "quiz" && (
        <QuizScreen
          qIndex={qIndex}
          transitioning={transitioning}
          timeLeft={timeLeft}
          selectedIdx={selectedIdx}
          onAnswer={(opt, idx) => commitAnswer({ ...opt, idx })}
        />
      )}

      {stage === "results" && (
        <ResultsScreen
          percent={percent}
          tier={tier}
          radarData={radarData}
          onRestart={restart}
          onCopy={handleCopyUrl}
          onDownload={handleDownload}
          copied={copied}
        />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  LANDING SCREEN                                                     */
/* ------------------------------------------------------------------ */

function LandingScreen({ onStart }) {
  return (
    <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6 text-center">
      <div
        className="flex items-center gap-2 px-4 py-1.5 rounded-full glass-card mb-8"
        style={{ animation: "floatY 4s ease-in-out infinite" }}
      >
        <Sparkles size={14} className="text-pink-400" />
        <span className="text-xs tracking-[0.2em] uppercase text-gray-300">
          Cognitive Diagnostic v2.4
        </span>
      </div>

      <h1
        className="brainrot-gradient-text font-black leading-[0.95] mb-6"
        style={{
          fontFamily: "'Space Grotesk', sans-serif",
          fontSize: "clamp(2.75rem, 8vw, 6.5rem)",
        }}
      >
        TERMINAL
        <br />
        BRAINROT
        <br />
        DIAGNOSIS
      </h1>

      <p className="max-w-md text-gray-400 text-base md:text-lg mb-12">
        9 questions. 12 seconds each. No mercy. We'll measure your slang
        fluency, screen time risk, and meme reaction speed — then tell you
        exactly how cooked you are.
      </p>

      <MagneticButton
        onClick={onStart}
        className="group relative px-10 py-5 rounded-2xl font-bold text-lg overflow-hidden"
        style={{
          background: "linear-gradient(135deg, #a855f7, #ec4899)",
          boxShadow: "0 0 40px rgba(168,85,247,0.45)",
        }}
      >
        <span className="relative z-10 flex items-center gap-2">
          Start Assessment
          <ChevronRight
            size={20}
            className="transition-transform group-hover:translate-x-1"
          />
        </span>
      </MagneticButton>

      <div className="flex gap-8 mt-16 text-gray-500 text-xs tracking-widest uppercase">
        <span>9 Questions</span>
        <span className="opacity-30">/</span>
        <span>~2 Minutes</span>
        <span className="opacity-30">/</span>
        <span>0% Judgment*</span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  QUIZ SCREEN                                                        */
/* ------------------------------------------------------------------ */

function QuizScreen({ qIndex, transitioning, timeLeft, selectedIdx, onAnswer }) {
  const q = QUESTIONS[qIndex];
  const progress = (qIndex / QUESTIONS.length) * 100;
  const colors = ["#a855f7", "#ec4899", "#3b82f6", "#22c55e"];

  return (
    <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 py-10">
      <div className="w-full max-w-xl mb-6">
        <div className="flex justify-between items-center mb-2 text-xs text-gray-400 tracking-widest uppercase">
          <span>
            Question {qIndex + 1} / {QUESTIONS.length}
          </span>
          <span className="flex items-center gap-1">
            <Clock size={12} />
            {timeLeft}s
          </span>
        </div>
        <div className="h-2 w-full rounded-full bg-white/5 overflow-hidden relative">
          <div
            className="h-full rounded-full relative"
            style={{
              width: `${progress}%`,
              background: "linear-gradient(90deg, #a855f7, #ec4899)",
              boxShadow: "0 0 12px rgba(236,72,153,0.7)",
              transition: "width 0.4s cubic-bezier(.16,1,.3,1)",
            }}
          >
            <span
              className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-white"
              style={{ animation: "pulseGlow 1.2s ease-in-out infinite" }}
            />
          </div>
        </div>
      </div>

      <TiltCard
        className={`w-full max-w-xl glass-card rounded-3xl p-8 md:p-10 ${
          transitioning ? "q-exit" : "q-enter"
        }`}
        key={qIndex}
      >
        <span className="text-xs tracking-[0.25em] uppercase text-purple-400 font-semibold">
          {CATEGORY_META[q.category].label}
        </span>
        <h2
          className="mt-3 mb-8 text-2xl md:text-3xl font-bold leading-snug"
          style={{ fontFamily: "'Space Grotesk', sans-serif" }}
        >
          {q.prompt}
        </h2>

        <div className="grid grid-cols-1 gap-3">
          {q.options.map((opt, idx) => (
            <button
              key={idx}
              disabled={transitioning}
              onClick={() => onAnswer(opt, idx)}
              className="text-left px-5 py-4 rounded-xl border transition-all duration-200 font-medium"
              style={{
                borderColor:
                  selectedIdx === idx ? colors[idx] : "rgba(255,255,255,0.08)",
                background:
                  selectedIdx === idx
                    ? `${colors[idx]}22`
                    : "rgba(255,255,255,0.03)",
                boxShadow:
                  selectedIdx === idx ? `0 0 20px ${colors[idx]}55` : "none",
              }}
              onMouseEnter={(e) => {
                if (selectedIdx === null) {
                  e.currentTarget.style.borderColor = colors[idx];
                  e.currentTarget.style.background = `${colors[idx]}14`;
                }
              }}
              onMouseLeave={(e) => {
                if (selectedIdx !== idx) {
                  e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)";
                  e.currentTarget.style.background = "rgba(255,255,255,0.03)";
                }
              }}
            >
              {opt.text}
            </button>
          ))}
        </div>
      </TiltCard>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  RESULTS SCREEN                                                     */
/* ------------------------------------------------------------------ */

function ResultsScreen({ percent, tier, radarData, onRestart, onCopy, onDownload, copied }) {
  const Icon = tier.icon;

  return (
    <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 py-14">
      <div className="flex items-center gap-2 mb-4 text-xs tracking-[0.25em] uppercase text-gray-400">
        <Icon size={14} style={{ color: tier.color }} />
        Diagnosis complete
      </div>

      <Gauge percent={percent} color={tier.color} />

      <h2
        className="mt-6 text-3xl md:text-4xl font-black text-center"
        style={{ fontFamily: "'Space Grotesk', sans-serif", color: tier.color }}
      >
        {tier.name}
      </h2>
      <p className="text-gray-400 mt-2 text-center max-w-sm">{tier.tagline}</p>

      <div className="w-full max-w-md mt-10 glass-card rounded-3xl p-6">
        <h3 className="text-xs tracking-[0.25em] uppercase text-gray-400 mb-2 text-center">
          Breakdown
        </h3>
        <div style={{ width: "100%", height: 260 }}>
          <ResponsiveContainer>
            <RadarChart data={radarData} outerRadius="75%">
              <PolarGrid stroke="rgba(255,255,255,0.12)" />
              <PolarAngleAxis
                dataKey="subject"
                tick={{ fill: "#9ca3af", fontSize: 12 }}
              />
              <Radar
                dataKey="value"
                stroke={tier.color}
                fill={tier.color}
                fillOpacity={0.35}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 justify-center mt-8">
        <MagneticButton
          onClick={onDownload}
          className="flex items-center gap-2 px-6 py-3 rounded-xl font-semibold"
          style={{
            background: "linear-gradient(135deg, #a855f7, #ec4899)",
            boxShadow: "0 0 25px rgba(168,85,247,0.4)",
          }}
        >
          <Download size={16} />
          Download Result Card
        </MagneticButton>

        <MagneticButton
          onClick={onCopy}
          className="flex items-center gap-2 px-6 py-3 rounded-xl font-semibold glass-card"
        >
          {copied ? <Check size={16} className="text-green-400" /> : <Link2 size={16} />}
          {copied ? "Copied!" : "Copy Diagnostic URL"}
        </MagneticButton>

        <MagneticButton
          onClick={onRestart}
          className="flex items-center gap-2 px-6 py-3 rounded-xl font-semibold glass-card"
        >
          <RotateCcw size={16} />
          Retake
        </MagneticButton>
      </div>
    </div>
  );
}
