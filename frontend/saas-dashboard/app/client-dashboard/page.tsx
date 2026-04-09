"use client";// comment bhi chalega
// comment bhi chalega
import { useClientDashboard } from "@/hooks/useClientDashboard";
import api from "@/lib/axios/api";
import React from "react";
export default function ClientDashboardPage() {
  const { data, loading, error, refetch } = useClientDashboard();

  // ==============================
  // LOGOUT FUNCTION
  // ==============================

  const handleLogout = async () => {
    try {
      await api.post("/logout");
      window.location.href = "/client-login"; // redirect after logout
    } catch (err) {
      console.error("Logout failed");
    }
  };

  // ==============================
  // LOADING
  // ==============================

  if (loading) {
  return (
    <div className="min-h-screen bg-zinc-900 p-6 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>

        <div className="grid grid-cols-2 gap-5 max-w-xl">
          <SkeletonCard />
          <SkeletonCard />
        </div>

      </div>
    </div>
  );
}

  // ==============================
  // ERROR
  // ==============================

  if (error || !data) {
    return (
      <div className="min-h-screen bg-black text-red-500 flex flex-col items-center justify-center gap-4">
        <p>{error || "Failed to load data"}</p>
        <button
          onClick={refetch}
          className="px-4 py-2 bg-white text-black rounded-lg"
        >
          Retry
        </button>
      </div>
    );
  }

  // ==============================
  // DERIVED UI VALUES (SAFE VERSION)
  // ==============================

  const usagePercent = data.total_limit
    ? Math.min(100, Math.round((data.used / data.total_limit) * 100))
    : 0;

  const remainingPercent = data.total_limit
    ? Math.min(100, Math.round((data.remaining / data.total_limit) * 100))
    : 0;

  const daysPercent = data.total_validity
    ? Math.min(100, Math.round((data.expire_in / data.total_validity) * 100))
    : 0;

  // ==============================
  // UI
  // ==============================

  return (
  <div className="relative min-h-screen bg-[#0a0f1c] text-white px-4 py-6 md:px-8 md:py-8 overflow-hidden">

    {/* BACKGROUND GLOW */}
    <div className="absolute inset-0 -z-10">
      <div className="absolute top-[-100px] left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-blue-500/20 blur-[120px] rounded-full" />
      <div className="absolute bottom-[-100px] right-[-100px] w-[400px] h-[400px] bg-indigo-500/20 blur-[120px] rounded-full" />
    </div>

    {/* ===== CONTAINER ===== */}
    <div className="max-w-6xl mx-auto space-y-8">

      {/* ===== HEADER ===== */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">

        <div>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
            {data.company} Dashboard
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Track usage, limits and plan validity
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleLogout}
            className="text-sm bg-red-500 hover:bg-red-600 px-4 py-2 rounded-lg transition"
          >
            Logout
          </button>
        </div>

      </div>

      {/* ===== METRICS SECTION ===== */}
      <div className="space-y-6">

        {/* PRIMARY METRICS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">

          <ProgressCard
            title="Uses Limit"
            value={`${data.total_limit}`}
            percent={100}
            forceColor="bg-blue-500"
          />

          <ProgressCard
            title="Total Used"
            value={`${data.used}`}
            percent={usagePercent}
          />

          <ProgressCard
            title="Remaining"
            value={`${data.remaining} left`}
            percent={remainingPercent}
            reverse
          />

          {/* Usage Percent */}
          <ProgressCard
            title="Usage Percent"
            value={`${usagePercent}%`}
            percent={usagePercent}
          />

        </div>

        {/* SECONDARY METRICS */}
        <div className="max-w-md mx-auto">
          <div className="grid grid-cols-2 gap-3">

            <CircleCard
              label="Total Validity"
              value={`${data.total_validity} Days`}
              percent={100}
              isStatic
            />

            {/* ✅ CHANGE 1: reverse prop added — days kam = circle zyada fill (green → yellow → red) */}
            <CircleCard
              label="Days Left"
              value={
                data.expire_unit === "expired"
                   ? "Expired"
                   : `${data.expire_in} ${data.expire_unit} left`
              }
              percent={daysPercent}
              reverse
            />

          </div>
        </div>

      {/* CLOSE METRICS */}
      </div>

    {/* CLOSE CONTAINER */}
    </div>

  {/* CLOSE MAIN WRAPPER */}
  
  </div>
  
);
}

    
//////////////////////////////////////////
////// PROGRESS CARD COMPONENT //////////
////////////////////////////////////////

interface ProgressCardProps {
  title: string;
  value: string | number;
  percent: number;
  forceColor?: string;
  icon?: React.ReactNode;
  reverse?: boolean;
}

function ProgressCard({
  title,
  value,
  percent,
  forceColor,
  icon,
  reverse
}: ProgressCardProps) {
  const [animatedWidth, setAnimatedWidth] = React.useState(0);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedWidth(percent);
    }, 100); // smooth start

    return () => clearTimeout(timer);
  }, [percent]);

  const getColor = () => {
    if (forceColor) return forceColor;

    if (reverse) {
      if (percent <= 20) return "bg-red-500";
      if (percent <= 50) return "bg-yellow-400";
      return "bg-green-500";
    }

    if (percent >= 80) return "bg-red-500";
    if (percent >= 50) return "bg-yellow-400";
    return "bg-green-500";
  };

  const getBorderColor = () => {
    if (forceColor) return forceColor.replace("bg", "border");

    if (reverse) {
      if (percent <= 20) return "border-red-500";
      if (percent <= 50) return "border-yellow-400";
      return "border-green-500";
    }

    if (percent >= 80) return "border-red-500";
    if (percent >= 50) return "border-yellow-400";
    return "border-green-500";
  };

  const getShadowColor = () => {
    if (forceColor) {
      if (forceColor === "bg-blue-500")
        return "shadow-[0_0_20px_rgba(59,130,246,0.4)]";
    }

    if (reverse) {
      if (percent <= 20) return "shadow-[0_0_20px_rgba(239,68,68,0.4)]";
      if (percent <= 50) return "shadow-[0_0_20px_rgba(250,204,21,0.4)]";
      return "shadow-[0_0_20px_rgba(34,197,94,0.4)]";
    }

    if (percent >= 80) return "shadow-[0_0_20px_rgba(239,68,68,0.4)]";
    if (percent >= 50) return "shadow-[0_0_20px_rgba(250,204,21,0.4)]";
    return "shadow-[0_0_20px_rgba(34,197,94,0.4)]";
  };


  return (
    <div
      className={`bg-zinc-800/40 backdrop-blur-md border rounded-2xl p-5
      transition-all duration-300 ease-out
      ${getBorderColor()} border-opacity-70
      ${getShadowColor()}
      glow-breath
      hover:scale-[1.02] hover:brightness-110
    `}
    >
      {/* TOP ROW */}
      <div className="flex justify-between items-center mb-3">

        <div className="flex items-center gap-2">
          {icon && <span className="text-zinc-400 text-sm">{icon}</span>}
          <p className="text-zinc-400 text-sm font-medium">{title}</p>
        </div>

        <span className="text-xl font-semibold text-white">
          {value}
        </span>

      </div>

      {/* PROGRESS BAR */}
      <div className="w-full h-2 bg-zinc-700 rounded-full overflow-hidden">
        <div
          className={`h-2 rounded-full ${getColor()} transition-all duration-700 ease-out`}
          style={{ width: `${animatedWidth}%` }}
        />
      </div>

    </div>
  );
}

//////////////////////////////////////////
////// PREMIUM CIRCULAR INDICATOR ///////
//////////////////////////////////////////

// ✅ CHANGE 2: reverse prop interface me add kiya
interface CircleCardProps {
  label: string;
  value: string;
  percent: number;
  isStatic?: boolean;
  reverse?: boolean;
}

// ✅ CHANGE 3: reverse prop destructure kiya aur getColor me reverse logic add kiya
function CircleCard({ label, value, percent, isStatic, reverse }: CircleCardProps) {
  const [progress, setProgress] = React.useState(0);

  React.useEffect(() => {
    const t = setTimeout(() => setProgress(percent), 80);
    return () => clearTimeout(t);
  }, [percent]);

  const getColor = () => {
    if (isStatic) return "#6366f1"; // indigo for total validity

    // reverse = true (Days Left):
    // percent = daysPercent = expire_in / total_validity * 100 (kitne din bache hain)
    // Jab din zyada bache = percent high = green
    // Jab din kam bache = percent low = yellow/red
    if (reverse) {
      if (percent <= 15) return "#ef4444"; // red   — 85%+ time gaya
      if (percent <= 35) return "#facc15"; // yellow — 65%+ time gaya
      return "#22c55e";                   // green  — safe zone
    }

    // default (non-reverse)
    if (percent >= 80) return "#ef4444";
    if (percent >= 50) return "#facc15";
    return "#22c55e";
  };

  const size = 120;
  const stroke = 12;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;

  const dashOffset =
    circumference - (progress / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-3">

      {/* CIRCLE */}
      <div
        className="relative flex items-center justify-center
        w-[90px] h-[90px] sm:w-[110px] sm:h-[110px] md:w-[130px] md:h-[130px]
        bg-transparent"
      >
        <svg
          width="100%"
          height="100%"
          viewBox={`0 0 ${size} ${size}`}
          className="-rotate-90"
        >
          {/* BACKGROUND */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="rgba(255,255,255,0.06)"
            strokeWidth={stroke}
            fill="transparent"
          />
          {/* PROGRESS */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={getColor()}
            strokeWidth={stroke}
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
          />
        </svg>

        {/* CENTER VALUE */}
        <div className="absolute flex flex-col items-center justify-center text-center">
          <span className="text-sm sm:text-base md:text-lg font-semibold text-white">
            {value}
          </span>
        </div>
      </div>

      {/* LABEL */}
      <p className="text-[11px] sm:text-xs text-zinc-400 text-center">
        {label}
      </p>

      {/* ✅ CHANGE 4: Neeche wala "100%" percent span HATA DIYA — dono circles se */}

    </div>
  );
}


//////////////////////////////////////////
//////// SKELETON CARD (PRO) /////////////
//////////////////////////////////////////

function SkeletonCard() {
  return (
    <div className="relative overflow-hidden bg-white/5 border border-white/10 rounded-2xl p-5 space-y-4">

      {/* SHIMMER EFFECT */}
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      {/* TITLE */}
      <div className="h-4 w-28 bg-zinc-700/60 rounded-md" />

      {/* VALUE */}
      <div className="h-6 w-20 bg-zinc-600/60 rounded-md" />

      {/* PROGRESS BAR */}
      <div className="h-2 w-full bg-zinc-700/60 rounded-full" />

    </div>
  );
}