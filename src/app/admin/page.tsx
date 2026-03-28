"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import {
  Users,
  Search,
  MessageCircle,
  Zap,
  ChevronDown,
  ChevronRight,
  Filter,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

interface UserRow {
  id: number;
  username: string;
  role: string;
  created_at: string;
}

interface ActivityRow {
  id: number;
  user_id: number;
  action_type: string;
  keyword: string | null;
  tokens_used: number;
  created_at: string;
  users?: { username: string };
}

interface UserDetail {
  folders: string[];
  searchCount: number;
  chatCount: number;
  lastActivity: string | null;
}

export default function AdminPage() {
  const { user, token } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [activities, setActivities] = useState<ActivityRow[]>([]);
  const [stats, setStats] = useState({
    totalUsers: 0,
    searchesToday: 0,
    chatsToday: 0,
    totalTokens: 0,
  });
  const [expandedUser, setExpandedUser] = useState<number | null>(null);
  const [userDetails, setUserDetails] = useState<Record<number, UserDetail>>({});
  const [filterUser, setFilterUser] = useState("");
  const [filterAction, setFilterAction] = useState("");
  const [loading, setLoading] = useState(true);

  // Redirect non-admin
  useEffect(() => {
    if (user && user.role !== "admin") {
      router.push("/");
    }
  }, [user, router]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch users
      const { data: usersData } = await supabase
        .from("users")
        .select("id, username, role, created_at")
        .order("created_at", { ascending: false });
      setUsers(usersData || []);

      // Fetch activities (last 200)
      const { data: actData } = await supabase
        .from("user_activity")
        .select("id, user_id, action_type, keyword, tokens_used, created_at, users(username)")
        .order("created_at", { ascending: false })
        .limit(200);
      setActivities((actData as unknown as ActivityRow[]) || []);

      // Stats
      const today = new Date().toISOString().split("T")[0];
      const { count: totalUsers } = await supabase
        .from("users")
        .select("id", { count: "exact", head: true });

      const { count: searchesToday } = await supabase
        .from("user_activity")
        .select("id", { count: "exact", head: true })
        .eq("action_type", "search")
        .gte("created_at", today);

      const { count: chatsToday } = await supabase
        .from("user_activity")
        .select("id", { count: "exact", head: true })
        .eq("action_type", "chat")
        .gte("created_at", today);

      // Total tokens
      const { data: tokenData } = await supabase
        .from("user_activity")
        .select("tokens_used");
      const totalTokens = (tokenData || []).reduce((sum, r) => sum + (r.tokens_used || 0), 0);

      setStats({
        totalUsers: totalUsers || 0,
        searchesToday: searchesToday || 0,
        chatsToday: chatsToday || 0,
        totalTokens,
      });
    } catch (err) {
      console.error("Admin fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user?.role === "admin") {
      fetchData();
    }
  }, [user, fetchData]);

  async function loadUserDetail(userId: number) {
    if (userDetails[userId]) return;
    try {
      const { data: folders } = await supabase
        .from("folders")
        .select("name")
        .eq("user_id", userId);

      const { count: searchCount } = await supabase
        .from("user_activity")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("action_type", "search");

      const { count: chatCount } = await supabase
        .from("user_activity")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("action_type", "chat");

      const { data: lastAct } = await supabase
        .from("user_activity")
        .select("created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(1);

      setUserDetails((prev) => ({
        ...prev,
        [userId]: {
          folders: (folders || []).map((f) => f.name),
          searchCount: searchCount || 0,
          chatCount: chatCount || 0,
          lastActivity: lastAct?.[0]?.created_at || null,
        },
      }));
    } catch {
      // ignore
    }
  }

  function toggleUser(userId: number) {
    if (expandedUser === userId) {
      setExpandedUser(null);
    } else {
      setExpandedUser(userId);
      loadUserDetail(userId);
    }
  }

  const filteredActivities = activities.filter((a) => {
    if (filterUser && !(a.users?.username || "").toLowerCase().includes(filterUser.toLowerCase())) return false;
    if (filterAction && a.action_type !== filterAction) return false;
    return true;
  });

  if (!user || user.role !== "admin") {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-gray-400">Erisim reddedildi</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-gray-400">Yukleniyor...</p>
      </div>
    );
  }

  function formatDate(d: string) {
    return new Date(d).toLocaleString("tr-TR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Admin Paneli</h1>
        <p className="text-gray-500 mt-1">Kullanici yonetimi ve aktivite izleme</p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#667eea]/10 flex items-center justify-center">
              <Users size={20} className="text-[#667eea]" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.totalUsers}</p>
              <p className="text-xs text-gray-500">Toplam Kullanici</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
              <Search size={20} className="text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.searchesToday}</p>
              <p className="text-xs text-gray-500">Bugunki Arama</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
              <MessageCircle size={20} className="text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.chatsToday}</p>
              <p className="text-xs text-gray-500">Bugunki Chat</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
              <Zap size={20} className="text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.totalTokens.toLocaleString("tr-TR")}</p>
              <p className="text-xs text-gray-500">Toplam Token</p>
            </div>
          </div>
        </div>
      </div>

      {/* Users table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-8">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">Kullanicilar</h2>
        </div>
        <div className="divide-y divide-gray-100">
          {users.map((u) => {
            const isExpanded = expandedUser === u.id;
            const detail = userDetails[u.id];
            return (
              <div key={u.id}>
                <button
                  onClick={() => toggleUser(u.id)}
                  className="w-full flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors text-left"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-9 h-9 rounded-full bg-[#667eea]/10 flex items-center justify-center">
                      <span className="text-sm font-bold text-[#667eea]">
                        {u.username.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{u.username}</p>
                      <p className="text-xs text-gray-400">{formatDate(u.created_at)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        u.role === "admin"
                          ? "bg-red-100 text-red-700"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {u.role}
                    </span>
                    {isExpanded ? <ChevronDown size={16} className="text-gray-400" /> : <ChevronRight size={16} className="text-gray-400" />}
                  </div>
                </button>
                {isExpanded && detail && (
                  <div className="px-6 pb-4 bg-gray-50">
                    <div className="grid grid-cols-3 gap-4 py-3">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Klasorler</p>
                        <div className="flex flex-wrap gap-1">
                          {detail.folders.length > 0 ? detail.folders.map((f) => (
                            <span key={f} className="inline-block bg-white border border-gray-200 px-2 py-0.5 rounded text-xs text-gray-600">{f}</span>
                          )) : <span className="text-xs text-gray-400">-</span>}
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Aramalar / Chatler</p>
                        <p className="text-sm font-medium text-gray-800">{detail.searchCount} / {detail.chatCount}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Son Aktivite</p>
                        <p className="text-sm text-gray-800">{detail.lastActivity ? formatDate(detail.lastActivity) : "-"}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
          {users.length === 0 && (
            <div className="px-6 py-8 text-center text-gray-400 text-sm">
              Henuz kullanici yok
            </div>
          )}
        </div>
      </div>

      {/* Activity log */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Aktivite Kayitlari</h2>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 bg-gray-50 rounded-lg px-3 py-1.5">
              <Filter size={14} className="text-gray-400" />
              <input
                type="text"
                value={filterUser}
                onChange={(e) => setFilterUser(e.target.value)}
                placeholder="Kullanici ara..."
                className="bg-transparent text-xs text-gray-600 outline-none w-24"
              />
            </div>
            <select
              value={filterAction}
              onChange={(e) => setFilterAction(e.target.value)}
              className="bg-gray-50 rounded-lg px-3 py-1.5 text-xs text-gray-600 outline-none border-none"
            >
              <option value="">Tum aksiyonlar</option>
              <option value="search">Arama</option>
              <option value="chat">Chat</option>
            </select>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left">
                <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Kullanici</th>
                <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Aksiyon</th>
                <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Anahtar Kelime</th>
                <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Token</th>
                <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Tarih</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredActivities.map((a, i) => (
                <tr key={a.id} className={i % 2 === 0 ? "bg-white" : "bg-gray-50/50"}>
                  <td className="px-6 py-3 text-gray-800">{a.users?.username || `#${a.user_id}`}</td>
                  <td className="px-6 py-3">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                        a.action_type === "search"
                          ? "bg-emerald-100 text-emerald-700"
                          : a.action_type === "chat"
                          ? "bg-purple-100 text-purple-700"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {a.action_type}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-gray-600">{a.keyword || "-"}</td>
                  <td className="px-6 py-3 text-gray-600">{a.tokens_used || 0}</td>
                  <td className="px-6 py-3 text-gray-400 text-xs">{formatDate(a.created_at)}</td>
                </tr>
              ))}
              {filteredActivities.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-400">
                    Aktivite kaydi bulunamadi
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
