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
      setError(err instanceof Error ? err.message : "Bir hata olustu");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#0D1B2A] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white">
            <span className="text-[#667eea]">DTC</span> Arastirma
          </h1>
          <p className="text-gray-400 mt-2 text-sm">Marka Arastirma Paneli</p>
        </div>

        {/* Card */}
        <div
          className="rounded-2xl p-8"
          style={{
            background: "linear-gradient(135deg, #1a2d45 0%, #162236 100%)",
            boxShadow: "0 0 40px rgba(102,126,234,0.1), 0 20px 60px rgba(0,0,0,0.3)",
          }}
        >
          {/* Mode toggle */}
          <div className="flex bg-white/5 rounded-xl p-1 mb-6">
            <button
              onClick={() => { setMode("login"); setError(""); }}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
                mode === "login"
                  ? "bg-[#667eea] text-white shadow-sm"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              Giris Yap
            </button>
            <button
              onClick={() => { setMode("signup"); setError(""); }}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
                mode === "signup"
                  ? "bg-[#667eea] text-white shadow-sm"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              Kayit Ol
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                Kullanici Adi
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="kullanici_adi"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-gray-500 focus:outline-none focus:border-[#667eea]/50 focus:ring-1 focus:ring-[#667eea]/20 transition-colors text-sm"
                autoComplete="username"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                Sifre
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={mode === "signup" ? "En az 6 karakter" : "Sifreniz"}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-gray-500 focus:outline-none focus:border-[#667eea]/50 focus:ring-1 focus:ring-[#667eea]/20 transition-colors text-sm"
                autoComplete={mode === "login" ? "current-password" : "new-password"}
              />
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !username || !password}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-[#667eea] text-white font-medium text-sm hover:bg-[#5a6fd6] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ boxShadow: "0 0 20px rgba(102,126,234,0.3)" }}
            >
              {loading ? (
                <Loader2 size={18} className="animate-spin" />
              ) : mode === "login" ? (
                <>
                  <LogIn size={18} />
                  Giris Yap
                </>
              ) : (
                <>
                  <UserPlus size={18} />
                  Kayit Ol
                </>
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-gray-500 text-xs mt-6">
          {mode === "login"
            ? "Hesabiniz yok mu? Yukaridaki 'Kayit Ol' butonuna tiklayin."
            : "Zaten hesabiniz var mi? Yukaridaki 'Giris Yap' butonuna tiklayin."}
        </p>
      </div>
    </div>
  );
}
