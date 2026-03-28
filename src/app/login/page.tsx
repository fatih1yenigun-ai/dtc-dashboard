"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { LogIn, UserPlus, Loader2 } from "lucide-react";

export default function LoginPage() {
  const { login, signup } = useAuth();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (mode === "login") {
        await login(username, password);
      } else {
        await signup(username, password);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Bir hata oluştu");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center overflow-hidden">
      {/* Animated wave background */}
      <div className="absolute inset-0 z-0">
        {/* Base gradient */}
        <div
          className="absolute inset-0"
          style={{
            background: "linear-gradient(135deg, #1a0533 0%, #2d1b69 25%, #4c1d95 50%, #5b21b6 75%, #1e3a8a 100%)",
          }}
        />
        {/* Animated wave layers */}
        <svg
          className="absolute bottom-0 left-0 w-full"
          viewBox="0 0 1440 600"
          preserveAspectRatio="none"
          style={{ height: "100%", width: "100%" }}
        >
          <defs>
            <linearGradient id="wave1" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="rgba(99,102,241,0.3)" />
              <stop offset="50%" stopColor="rgba(139,92,246,0.3)" />
              <stop offset="100%" stopColor="rgba(59,130,246,0.3)" />
            </linearGradient>
            <linearGradient id="wave2" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="rgba(67,56,202,0.25)" />
              <stop offset="50%" stopColor="rgba(109,40,217,0.25)" />
              <stop offset="100%" stopColor="rgba(37,99,235,0.25)" />
            </linearGradient>
            <linearGradient id="wave3" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="rgba(79,70,229,0.2)" />
              <stop offset="50%" stopColor="rgba(124,58,237,0.2)" />
              <stop offset="100%" stopColor="rgba(29,78,216,0.2)" />
            </linearGradient>
            <linearGradient id="wave4" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="rgba(55,48,163,0.15)" />
              <stop offset="50%" stopColor="rgba(91,33,182,0.15)" />
              <stop offset="100%" stopColor="rgba(30,64,175,0.15)" />
            </linearGradient>
          </defs>
          <path fill="url(#wave4)" className="animate-wave4">
            <animate
              attributeName="d"
              dur="12s"
              repeatCount="indefinite"
              values="
                M0,400 C180,350 360,450 540,380 C720,310 900,420 1080,370 C1260,320 1440,400 1440,400 L1440,600 L0,600 Z;
                M0,380 C180,430 360,340 540,400 C720,460 900,350 1080,410 C1260,370 1440,420 1440,420 L1440,600 L0,600 Z;
                M0,400 C180,350 360,450 540,380 C720,310 900,420 1080,370 C1260,320 1440,400 1440,400 L1440,600 L0,600 Z
              "
            />
          </path>
          <path fill="url(#wave3)" className="animate-wave3">
            <animate
              attributeName="d"
              dur="10s"
              repeatCount="indefinite"
              values="
                M0,420 C200,380 400,460 600,410 C800,360 1000,440 1200,400 C1400,360 1440,420 1440,420 L1440,600 L0,600 Z;
                M0,440 C200,470 400,390 600,440 C800,490 1000,380 1200,430 C1400,410 1440,440 1440,440 L1440,600 L0,600 Z;
                M0,420 C200,380 400,460 600,410 C800,360 1000,440 1200,400 C1400,360 1440,420 1440,420 L1440,600 L0,600 Z
              "
            />
          </path>
          <path fill="url(#wave2)" className="animate-wave2">
            <animate
              attributeName="d"
              dur="8s"
              repeatCount="indefinite"
              values="
                M0,450 C160,420 320,480 480,440 C640,400 800,460 960,430 C1120,400 1280,450 1440,440 L1440,600 L0,600 Z;
                M0,460 C160,490 320,430 480,470 C640,510 800,420 960,460 C1120,440 1280,470 1440,460 L1440,600 L0,600 Z;
                M0,450 C160,420 320,480 480,440 C640,400 800,460 960,430 C1120,400 1280,450 1440,440 L1440,600 L0,600 Z
              "
            />
          </path>
          <path fill="url(#wave1)" className="animate-wave1">
            <animate
              attributeName="d"
              dur="6s"
              repeatCount="indefinite"
              values="
                M0,480 C120,460 240,500 360,475 C480,450 600,490 720,470 C840,450 960,480 1080,465 C1200,450 1320,475 1440,470 L1440,600 L0,600 Z;
                M0,470 C120,500 240,460 360,485 C480,510 600,460 720,480 C840,500 960,460 1080,490 C1200,470 1320,490 1440,480 L1440,600 L0,600 Z;
                M0,480 C120,460 240,500 360,475 C480,450 600,490 720,470 C840,450 960,480 1080,465 C1200,450 1320,475 1440,470 L1440,600 L0,600 Z
              "
            />
          </path>
        </svg>
        {/* Floating orbs */}
        <div
          className="absolute w-96 h-96 rounded-full opacity-20 blur-3xl"
          style={{
            background: "radial-gradient(circle, #7c3aed 0%, transparent 70%)",
            top: "10%",
            left: "10%",
            animation: "floatOrb 15s ease-in-out infinite",
          }}
        />
        <div
          className="absolute w-80 h-80 rounded-full opacity-15 blur-3xl"
          style={{
            background: "radial-gradient(circle, #3b82f6 0%, transparent 70%)",
            top: "30%",
            right: "15%",
            animation: "floatOrb 12s ease-in-out infinite reverse",
          }}
        />
        <div
          className="absolute w-64 h-64 rounded-full opacity-10 blur-3xl"
          style={{
            background: "radial-gradient(circle, #6366f1 0%, transparent 70%)",
            bottom: "20%",
            left: "40%",
            animation: "floatOrb 18s ease-in-out infinite",
          }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 w-full max-w-md px-4" style={{ animation: "cardAppear 0.6s ease-out" }}>
        {/* Logo */}
        <div className="text-center mb-8">
          <p className="text-gray-400 tracking-[0.3em] text-xs uppercase mb-2">DTC Araştırma</p>
          <h1 className="text-4xl font-black text-white tracking-tight">
            RESEARCH PORTAL
          </h1>
        </div>

        {/* Card */}
        <div
          className="rounded-2xl p-8 backdrop-blur-xl"
          style={{
            background: "rgba(15, 15, 35, 0.75)",
            boxShadow: "0 0 60px rgba(102,126,234,0.15), 0 25px 80px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          {/* Mode toggle */}
          <div className="flex bg-white/5 rounded-xl p-1 mb-6">
            <button
              onClick={() => { setMode("login"); setError(""); }}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all duration-300 ${
                mode === "login"
                  ? "bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white shadow-lg"
                  : "text-gray-400 hover:text-white"
              }`}
              style={mode === "login" ? { boxShadow: "0 4px 20px rgba(102,126,234,0.4)" } : undefined}
            >
              Giriş Yap
            </button>
            <button
              onClick={() => { setMode("signup"); setError(""); }}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all duration-300 ${
                mode === "signup"
                  ? "bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white shadow-lg"
                  : "text-gray-400 hover:text-white"
              }`}
              style={mode === "signup" ? { boxShadow: "0 4px 20px rgba(102,126,234,0.4)" } : undefined}
            >
              Kayıt Ol
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Kullanıcı Adı"
                className="w-full bg-white/5 border border-white/10 rounded-full px-6 py-3.5 text-white placeholder:text-gray-400 focus:outline-none focus:border-[#667eea]/60 focus:ring-2 focus:ring-[#667eea]/20 transition-all text-sm"
                autoComplete="username"
              />
            </div>

            <div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={mode === "signup" ? "Şifre (en az 6 karakter)" : "Şifre"}
                className="w-full bg-white/5 border border-white/10 rounded-full px-6 py-3.5 text-white placeholder:text-gray-400 focus:outline-none focus:border-[#667eea]/60 focus:ring-2 focus:ring-[#667eea]/20 transition-all text-sm"
                autoComplete={mode === "login" ? "current-password" : "new-password"}
              />
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
                <p className="text-red-400 text-sm text-center">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !username || !password}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-full text-white font-semibold text-sm transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-[0.98]"
              style={{
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                boxShadow: "0 6px 30px rgba(102,126,234,0.4)",
              }}
            >
              {loading ? (
                <Loader2 size={18} className="animate-spin" />
              ) : mode === "login" ? (
                <>
                  <LogIn size={18} />
                  Giriş Yap
                </>
              ) : (
                <>
                  <UserPlus size={18} />
                  Kayıt Ol
                </>
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-gray-500/60 text-xs mt-6">
          {mode === "login"
            ? "Hesabınız yok mu? Yukarıdaki 'Kayıt Ol' butonuna tıklayın."
            : "Zaten hesabınız var mı? 'Giriş Yap' butonuna tıklayın."}
        </p>
      </div>

      {/* Animations */}
      <style jsx global>{`
        @keyframes floatOrb {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -30px) scale(1.05); }
          66% { transform: translate(-20px, 20px) scale(0.95); }
        }
        @keyframes cardAppear {
          from {
            opacity: 0;
            transform: translateY(30px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
    </div>
  );
}
