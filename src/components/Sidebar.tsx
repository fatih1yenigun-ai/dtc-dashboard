"use client";

import { useState, useEffect, useRef } from "react";
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
  Sun,
  Moon,
  LayoutDashboard,
  ChevronDown,
  GraduationCap,
  Briefcase,
} from "lucide-react";
import { loadFolders, getAllSavedCount } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import NotificationBell from "@/components/NotificationBell";

type NavItem = { href: string; label: string; iconKey: string; accentDark: string; accentLight: string };

const topNavItems: NavItem[] = [];

const workspaceItems: NavItem[] = [
  { href: "/storeleads", label: "Marka Nabzı", iconKey: "marka-pusulasi", accentDark: "#3890f8", accentLight: "#185fa5" },
  { href: "/reklam-tara", label: "Reklam Tara", iconKey: "reklam-tara", accentDark: "#c09af0", accentLight: "#534ab7" },
  { href: "/kombine", label: "Bütünsel Analiz", iconKey: "coklu-analiz", accentDark: "#e0b020", accentLight: "#854f0b" },
  { href: "/amazon", label: "Pazar Talebi", iconKey: "hacimler", accentDark: "#f0b040", accentLight: "#854f0b" },
  { href: "/expert-browse", label: "Uzman Arşivi", iconKey: "uzman-arsivi", accentDark: "#e84040", accentLight: "#a32d2d" },
  { href: "/saved", label: "Koleksiyonum", iconKey: "arsivim", accentDark: "#30c8a0", accentLight: "#0f6e56" },
  { href: "/research", label: "Akıllı Tarama", iconKey: "ai-ile-arastir", accentDark: "#20d0f8", accentLight: "#185fa5" },
  { href: "/brands", label: "Marka X-Ray (Beta)", iconKey: "marka-xray", accentDark: "#f07030", accentLight: "#993c1d" },
  { href: "/tools", label: "Atölye", iconKey: "araclar", accentDark: "#40c860", accentLight: "#3b6d11" },
];

const bottomNavItems = [
  { href: "/icerik-tedarik", label: "İçerik & Tedarik", iconKey: "icerik-tedarik", accentDark: "#f59e0b", accentLight: "#b45309" },
  { href: "/pano", label: "Pano (Beta)", iconKey: "pano", accentDark: "#d060f0", accentLight: "#702090" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [workspaceOpen, setWorkspaceOpen] = useState(false);
  const workspaceRef = useRef<HTMLDivElement>(null);
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

  // Auto-open workspace if a workspace item is active
  const isWorkspaceItemActive = workspaceItems.some(
    (item) => pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href + "/"))
  );

  useEffect(() => {
    if (isWorkspaceItemActive) setWorkspaceOpen(true);
  }, [isWorkspaceItemActive]);

  const getAccent = (item: NavItem) =>
    theme === "dark" ? item.accentDark : item.accentLight;

  const renderNavItem = (item: NavItem) => {
    const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href + "/"));
    const accent = getAccent(item);
    const iconPath = isActive
      ? `/icons/active/${item.iconKey}.svg`
      : `/icons/default/${item.iconKey}.svg`;

    return (
      <Link
        key={item.href}
        href={item.href}
        onClick={() => setMobileOpen(false)}
        className="flex items-center gap-3 px-4 h-12 rounded-[10px] text-[15px] font-medium transition-all duration-[120ms]"
        style={
          isActive
            ? {
                background: `${accent}1a`,
                borderLeft: `3px solid ${accent}`,
                color: accent,
                paddingLeft: "13px",
              }
            : undefined
        }
        onMouseEnter={(e) => {
          if (!isActive) {
            e.currentTarget.style.background = "var(--bg-hover)";
            e.currentTarget.style.color = "var(--text-primary)";
          }
        }}
        onMouseLeave={(e) => {
          if (!isActive) {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.color = "var(--text-secondary)";
          }
        }}
      >
        <Image
          src={iconPath}
          alt={item.label}
          width={28}
          height={28}
          className="flex-shrink-0"
        />
        <span
          className={isActive ? "" : "text-text-secondary"}
          style={isActive ? { color: accent } : undefined}
        >
          {item.label}
        </span>
      </Link>
    );
  };

  const sidebar = (
    <div className="flex flex-col h-full bg-bg-sidebar text-text-primary w-[280px] min-w-[280px]">
      {/* Branding */}
      <div className="px-5 pt-5 pb-4 border-b border-border-subtle">
        <h1 className="text-xl font-bold tracking-tight">
          <span className="text-accent">DTC</span>{" "}
          <span className="text-text-primary">Araştırma</span>
        </h1>
        <p className="text-[13px] text-text-muted mt-1">Marka Araştırma Paneli</p>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {/* Top nav items */}
        {topNavItems.map((item) => renderNavItem(item))}

        {/* Çalışma Alanı collapsible section */}
        <div className="pt-1">
          <button
            onClick={() => setWorkspaceOpen((prev) => !prev)}
            className="flex items-center gap-3 px-4 h-12 rounded-[10px] text-[15px] font-medium transition-all duration-[120ms] w-full text-left hover:bg-bg-hover group"
            style={isWorkspaceItemActive && !workspaceOpen ? { color: "var(--accent)" } : undefined}
          >
            <Briefcase
              size={20}
              className={`flex-shrink-0 transition-colors ${
                isWorkspaceItemActive ? "text-accent" : "text-text-muted group-hover:text-text-primary"
              }`}
            />
            <span
              className={
                isWorkspaceItemActive
                  ? "text-accent"
                  : "text-text-secondary group-hover:text-text-primary"
              }
            >
              Çalışma Alanı
            </span>
            <ChevronDown
              size={16}
              className={`ml-auto text-text-muted transition-transform duration-300 ease-in-out ${
                workspaceOpen ? "rotate-180" : ""
              }`}
            />
          </button>
          <div
            ref={workspaceRef}
            className="overflow-hidden transition-all duration-300 ease-in-out"
            style={{
              maxHeight: workspaceOpen
                ? `${workspaceRef.current?.scrollHeight ?? 500}px`
                : "0px",
              opacity: workspaceOpen ? 1 : 0,
            }}
          >
            <div className="pl-2 space-y-0.5 pt-0.5">
              {workspaceItems.map((item) => renderNavItem(item))}
            </div>
          </div>
        </div>

        {/* Bottom nav items */}
        {bottomNavItems.map((item) => renderNavItem(item))}

        {/* Mentör */}
        {(() => {
          const isMentorActive = pathname === "/mentor" || pathname.startsWith("/mentor/");
          return (
            <Link
              href="/mentor"
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-3 px-4 h-12 rounded-[10px] text-[15px] font-medium transition-all duration-[120ms]"
              style={
                isMentorActive
                  ? {
                      background: "rgba(139, 92, 246, 0.1)",
                      borderLeft: "3px solid #8b5cf6",
                      color: theme === "dark" ? "#a78bfa" : "#6d28d9",
                      paddingLeft: "13px",
                    }
                  : undefined
              }
              onMouseEnter={(e) => {
                if (!isMentorActive) {
                  e.currentTarget.style.background = "var(--bg-hover)";
                  e.currentTarget.style.color = "var(--text-primary)";
                }
              }}
              onMouseLeave={(e) => {
                if (!isMentorActive) {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.color = "var(--text-secondary)";
                }
              }}
            >
              <GraduationCap
                size={22}
                className="flex-shrink-0"
                style={isMentorActive ? { color: theme === "dark" ? "#a78bfa" : "#6d28d9" } : undefined}
              />
              <span className={isMentorActive ? "" : "text-text-secondary"}>
                Mentör
              </span>
            </Link>
          );
        })()}

        {/* Mentör2 (Mock) */}
        {(() => {
          const isMentor2Active = pathname === "/mentor2" || pathname.startsWith("/mentor2/");
          return (
            <Link
              href="/mentor2"
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-3 px-4 h-12 rounded-[10px] text-[15px] font-medium transition-all duration-[120ms]"
              style={
                isMentor2Active
                  ? {
                      background: "rgba(139, 92, 246, 0.1)",
                      borderLeft: "3px solid #8b5cf6",
                      color: theme === "dark" ? "#a78bfa" : "#6d28d9",
                      paddingLeft: "13px",
                    }
                  : undefined
              }
              onMouseEnter={(e) => {
                if (!isMentor2Active) {
                  e.currentTarget.style.background = "var(--bg-hover)";
                  e.currentTarget.style.color = "var(--text-primary)";
                }
              }}
              onMouseLeave={(e) => {
                if (!isMentor2Active) {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.color = "var(--text-secondary)";
                }
              }}
            >
              <GraduationCap
                size={22}
                className="flex-shrink-0"
                style={isMentor2Active ? { color: theme === "dark" ? "#a78bfa" : "#6d28d9" } : undefined}
              />
              <span className={isMentor2Active ? "" : "text-text-secondary"}>
                Mentör2
              </span>
            </Link>
          );
        })()}

        {/* Divider before conditional items */}
        {(user?.role === "expert" || user?.role === "admin") && (
          <div className="border-t border-border-subtle my-2.5" />
        )}

        {/* Expert archive - expert/admin only */}
        {(user?.role === "expert" || user?.role === "admin") && (
          <Link
            href="/expert-archive"
            onClick={() => setMobileOpen(false)}
            className={`flex items-center gap-3 px-4 h-12 rounded-[10px] text-[15px] font-medium transition-all duration-[120ms] ${
              pathname === "/expert-archive"
                ? ""
                : "text-text-secondary hover:bg-bg-hover hover:text-text-primary"
            }`}
            style={
              pathname === "/expert-archive"
                ? {
                    background: "rgba(232, 64, 64, 0.1)",
                    borderLeft: "3px solid #e84040",
                    color: theme === "dark" ? "#e84040" : "#a32d2d",
                    paddingLeft: "13px",
                  }
                : undefined
            }
          >
            <Image
              src={pathname === "/expert-archive" ? "/icons/active/uzman-arsivi.svg" : "/icons/default/uzman-arsivi.svg"}
              alt="Uzman Arşivim"
              width={28}
              height={28}
              className="flex-shrink-0"
            />
            Uzman Arşivim
          </Link>
        )}

        {/* Admin link */}
        {user?.role === "admin" && (
          <>
            <div className="border-t border-border-subtle my-2.5" />
            <Link
              href="/admin"
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-4 h-12 rounded-[10px] text-[15px] font-medium transition-all duration-[120ms] ${
                pathname === "/admin"
                  ? "bg-bg-hover text-text-primary"
                  : "text-text-muted hover:bg-bg-hover hover:text-text-secondary"
              }`}
            >
              <Shield size={20} />
              Admin Paneli
            </Link>
          </>
        )}

        {/* Creator/Supplier dashboard link */}
        {(user?.role === "creator" || user?.role === "supplier") && (
          <>
            <div className="border-t border-border-subtle my-2.5" />
            <Link
              href="/dashboard"
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-4 h-12 rounded-[10px] text-[15px] font-medium transition-all duration-[120ms] ${
                pathname === "/dashboard" || pathname.startsWith("/dashboard/")
                  ? "bg-bg-hover text-text-primary"
                  : "text-text-muted hover:bg-bg-hover hover:text-text-secondary"
              }`}
            >
              <LayoutDashboard size={20} />
              Dashboard
            </Link>
          </>
        )}
      </nav>

      {/* Stats */}
      <div className="px-5 py-3 border-t border-border-subtle space-y-1.5">
        <div className="flex items-center gap-2 text-[11px] text-text-muted uppercase tracking-wider">
          <ShoppingBag size={14} />
          <span>{brandCount} kayıtlı marka</span>
        </div>
        <div className="flex items-center gap-2 text-[11px] text-text-muted uppercase tracking-wider">
          <FolderOpen size={14} />
          <span>{folderCount} klasör</span>
        </div>
      </div>

      {/* Theme toggle */}
      <div className="px-5 py-2 border-t border-border-subtle">
        <button
          onClick={toggleTheme}
          className="text-text-muted hover:text-text-secondary transition-colors"
          title={theme === "dark" ? "Açık Tema" : "Koyu Tema"}
        >
          {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
        </button>
      </div>

      {/* User info + logout */}
      {user && (
        <div className="px-5 py-4 border-t border-border-subtle">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-bold text-accent">
                  {user.username.charAt(0).toUpperCase()}
                </span>
              </div>
              <span className="text-sm text-text-secondary truncate">{user.username}</span>
            </div>
            <div className="flex items-center gap-2">
              <NotificationBell />
              <button
                onClick={logout}
                className="text-text-muted hover:text-red-400 transition-colors"
                title="Çıkış Yap"
              >
                <LogOut size={16} />
              </button>
            </div>
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
        className="fixed top-4 left-4 z-50 md:hidden bg-bg-sidebar text-text-primary p-2 rounded-lg"
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
