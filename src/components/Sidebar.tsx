"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Menu,
  X,
  FolderOpen,
  ShoppingBag,
  Shield,
  LogOut,
} from "lucide-react";
import { loadFolders, getAllSavedCount } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";

const navItems = [
  { href: "/storeleads", label: "Marka Pusulası", iconKey: "marka-pusulasi" },
  { href: "/reklam-tara", label: "Reklam Tara", iconKey: "reklam-tara" },
  { href: "/kombine", label: "Çoklu Analiz (Beta)", iconKey: "coklu-analiz" },
  { href: "/amazon", label: "Pazar Talebi", iconKey: "hacimler" },
  { href: "/expert-browse", label: "Uzman Arşivi", iconKey: "uzman-arsivi" },
  { href: "/saved", label: "Arşivim", iconKey: "arsivim" },
  { href: "/research", label: "AI ile Araştır (Beta)", iconKey: "ai-ile-arastir" },
  { href: "/brands", label: "Marka X-Ray (Beta)", iconKey: "marka-xray" },
  { href: "/tools", label: "Araçlar", iconKey: "araclar" },
  { href: "/pano", label: "Pano (Beta)", iconKey: "pano" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [folderCount, setFolderCount] = useState(0);
  const [brandCount, setBrandCount] = useState(0);

  useEffect(() => {
    if (!user) return;
    loadFolders(user.userId)
      .then((f) => setFolderCount(f.length))
      .catch(() => {});
    getAllSavedCount(user.userId)
      .then((c) => setBrandCount(c))
      .catch(() => {});
  }, [pathname, user]);

  const sidebar = (
    <div className="flex flex-col h-full bg-[#0D1B2A] text-white w-[260px] min-w-[260px]">
      {/* Logo */}
      <div className="px-6 py-6 border-b border-white/10">
        <h1 className="text-xl font-bold tracking-tight">
          <span className="text-[#667eea]">DTC</span> Araştırma
        </h1>
        <p className="text-xs text-gray-400 mt-1">Marka Araştırma Paneli</p>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const iconPath = isActive
            ? `/icons/active/${item.iconKey}.svg`
            : `/icons/default/${item.iconKey}.svg`;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? "bg-[#667eea]/20 text-[#667eea]"
                  : "text-gray-300 hover:bg-white/5 hover:text-white"
              }`}
            >
              <Image
                src={iconPath}
                alt={item.label}
                width={22}
                height={22}
                className="flex-shrink-0"
              />
              {item.label}
            </Link>
          );
        })}

        {/* Expert archive - expert/admin only */}
        {(user?.role === "expert" || user?.role === "admin") && (
          <Link
            href="/expert-archive"
            onClick={() => setMobileOpen(false)}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
              pathname === "/expert-archive"
                ? "bg-[#667eea]/20 text-[#667eea]"
                : "text-gray-300 hover:bg-white/5 hover:text-white"
            }`}
          >
            <Image
              src={pathname === "/expert-archive" ? "/icons/active/uzman-arsivi.svg" : "/icons/default/uzman-arsivi.svg"}
              alt="Uzman Arşivim"
              width={22}
              height={22}
              className="flex-shrink-0"
            />
            Uzman Arşivim
          </Link>
        )}

        {/* Admin link */}
        {user?.role === "admin" && (
          <Link
            href="/admin"
            onClick={() => setMobileOpen(false)}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
              pathname === "/admin"
                ? "bg-[#667eea]/20 text-[#667eea]"
                : "text-gray-300 hover:bg-white/5 hover:text-white"
            }`}
          >
            <Shield size={18} />
            Admin Paneli
          </Link>
        )}
      </nav>

      {/* Stats */}
      <div className="px-6 py-4 border-t border-white/10 space-y-2">
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <ShoppingBag size={14} />
          <span>{brandCount} kayıtlı marka</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <FolderOpen size={14} />
          <span>{folderCount} klasör</span>
        </div>
      </div>

      {/* User info + logout */}
      {user && (
        <div className="px-6 py-4 border-t border-white/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-full bg-[#667eea]/20 flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-bold text-[#667eea]">
                  {user.username.charAt(0).toUpperCase()}
                </span>
              </div>
              <span className="text-sm text-gray-300 truncate">{user.username}</span>
            </div>
            <button
              onClick={logout}
              className="text-gray-500 hover:text-red-400 transition-colors"
              title="Çıkış Yap"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="fixed top-4 left-4 z-50 md:hidden bg-[#0D1B2A] text-white p-2 rounded-lg"
      >
        {mobileOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-40 transform transition-transform md:hidden ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {sidebar}
      </div>

      {/* Desktop sidebar */}
      <div className="hidden md:flex h-screen sticky top-0">{sidebar}</div>
    </>
  );
}
