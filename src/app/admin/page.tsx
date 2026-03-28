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
  DollarSign,
  X,
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

interface UserModalData {
  user: UserRow;
  totalTokens: number;
  activities: ActivityRow[];
  folders: { name: string; brandCount: number }[];
  recentKeywords: string[];
  dailyBreakdown: { date: string; searches: number; chats: number; tokens: number }[];
}

// Sonnet pricing: $3/M input, $15/M output. Approximate as $8/M average
const COST_PER_TOKEN = 8 / 1_000_000; // $0.000008 per token

function formatCost(tokens: number): string {
  const cost = tokens * COST_PER_TOKEN;
  if (cost < 0.01) return `${(cost * 100).toFixed(2)}c`;
  return `$${cost.toFixed(2)}`;
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
  const [userModal, setUserModal] = useState<UserModalData | null>(null);
  const [modalLoading, setModalLoading] = useState(false);

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

  async function openUserModal(u: UserRow) {
    setModalLoading(true);
    setUserModal(null);
    try {
      // Fetch all activity for this user
      const { data: userActivities } = await supabase
        .from("user_activity")
        .select("id, user_id, action_type, keyword, tokens_used, created_at")
        .eq("user_id", u.id)
        .order("created_at", { ascending: false });

      const acts = (userActivities || []) as ActivityRow[];

      // Total tokens
      const totalTokens = acts.reduce((sum, a) => sum + (a.tokens_used || 0), 0);

      // Recent keywords (last 20 unique)
      const recentKeywords: string[] = [];
      const seenKw = new Set<string>();
      for (const a of acts) {
        if (a.keyword && !seenKw.has(a.keyword)) {
          seenKw.add(a.keyword);
          recentKeywords.push(a.keyword);
          if (recentKeywords.length >= 20) break;
        }
      }

      // Daily breakdown
      const dailyMap: Record<string, { searches: number; chats: number; tokens: number }> = {};
      for (const a of acts) {
        const day = a.created_at.split("T")[0];
        if (!dailyMap[day]) dailyMap[day] = { searches: 0, chats: 0, tokens: 0 };
        if (a.action_type === "search") dailyMap[day].searches += 1;
        if (a.action_type === "chat") dailyMap[day].chats += 1;
        dailyMap[day].tokens += a.tokens_used || 0;
      }
      const dailyBreakdown = Object.entries(dailyMap)
        .map(([date, d]) => ({ date, ...d }))
        .sort((a, b) => b.date.localeCompare(a.date));

      // Folders with brand counts
      const { data: foldersData } = await supabase
        .from("folders")
        .select("id, name")
        .eq("user_id", u.id);

      const foldersWithCounts: { name: string; brandCount: number }[] = [];
      for (const f of foldersData || []) {
        const { count } = await supabase
          .from("saved_brands")
          .select("id", { count: "exact", head: true })
          .eq("folder_id", f.id);
        foldersWithCounts.push({ name: f.name, brandCount: count || 0 });
      }

      setUserModal({
        user: u,
        totalTokens,
        activities: acts,
        folders: foldersWithCounts,
        recentKeywords,
        dailyBreakdown,
      });
    } catch (err) {
      console.error("Error loading user modal:", err);
    } finally {
      setModalLoading(false);
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
        <p className="text-gray-400">Erişim reddedildi</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-gray-400">Yükleniyor...</p>
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
        <p className="text-gray-500 mt-1">Kullanıcı yönetimi ve aktivite izleme</p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#667eea]/10 flex items-center justify-center">
              <Users size={20} className="text-[#667eea]" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.totalUsers}</p>
              <p className="text-xs text-gray-500">Toplam Kullanıcı</p>
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
              <p className="text-xs text-gray-500">Bugünkü Arama</p>
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
              <p className="text-xs text-gray-500">Bugünkü Chat</p>
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
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
              <DollarSign size={20} className="text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{formatCost(stats.totalTokens)}</p>
              <p className="text-xs text-gray-500">Toplam Maliyet</p>
            </div>
          </div>
        </div>
      </div>

      {/* Users table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-8">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">Kullanıcılar</h2>
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
                    {(() => {
                      const userTokens = activities.filter((a) => a.user_id === u.id).reduce((s, a) => s + (a.tokens_used || 0), 0);
                      return userTokens > 0 ? (
                        <span className="text-xs text-green-600 font-medium">{formatCost(userTokens)}</span>
                      ) : null;
                    })()}
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        u.role === "admin"
                          ? "bg-red-100 text-red-700"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {u.role}
                    </span>
                    <button
                      onClick={(e) => { e.stopPropagation(); openUserModal(u); }}
                      className="px-2 py-0.5 rounded text-xs font-medium bg-[#667eea]/10 text-[#667eea] hover:bg-[#667eea]/20 transition-colors"
                    >
                      Detay
                    </button>
                    {isExpanded ? <ChevronDown size={16} className="text-gray-400" /> : <ChevronRight size={16} className="text-gray-400" />}
                  </div>
                </button>
                {isExpanded && detail && (
                  <div className="px-6 pb-4 bg-gray-50">
                    <div className="grid grid-cols-3 gap-4 py-3">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Klasörler</p>
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
              Henüz kullanıcı yok
            </div>
          )}
        </div>
      </div>

      {/* User Detail Modal */}
      {(userModal || modalLoading) && (
        <div className="fixed inset-0 bg-black/50 z-50 flex justify-end" onClick={() => { setUserModal(null); setModalLoading(false); }}>
          <div
            className="bg-[#0D1B2A] w-full max-w-lg h-full overflow-y-auto shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {modalLoading ? (
              <div className="flex items-center justify-center h-full">
                <p className="text-gray-400">Yükleniyor...</p>
              </div>
            ) : userModal ? (
              <>
                {/* Modal Header */}
                <div className="sticky top-0 bg-[#0D1B2A] border-b border-gray-700 px-6 py-4 flex items-center justify-between z-10">
                  <div>
                    <h2 className="text-lg font-bold text-white">{userModal.user.username}</h2>
                    <p className="text-xs text-gray-400">{userModal.user.role} | Kayıt: {formatDate(userModal.user.created_at)}</p>
                  </div>
                  <button onClick={() => setUserModal(null)} className="text-gray-400 hover:text-white transition-colors">
                    <X size={22} />
                  </button>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-3 px-6 py-4">
                  <div className="bg-[#1a2942] rounded-xl p-4">
                    <p className="text-xs text-gray-400 mb-1">Toplam Token</p>
                    <p className="text-xl font-bold text-white">{userModal.totalTokens.toLocaleString("tr-TR")}</p>
                  </div>
                  <div className="bg-[#1a2942] rounded-xl p-4">
                    <p className="text-xs text-gray-400 mb-1">Toplam Maliyet</p>
                    <p className="text-xl font-bold text-green-400">{formatCost(userModal.totalTokens)}</p>
                  </div>
                </div>

                {/* Daily Breakdown */}
                <div className="px-6 py-3">
                  <h3 className="text-sm font-semibold text-gray-300 mb-3">Günlük Detay</h3>
                  <div className="bg-[#1a2942] rounded-xl overflow-hidden">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="text-gray-400 border-b border-gray-700">
                          <th className="px-3 py-2 text-left">Tarih</th>
                          <th className="px-3 py-2 text-center">Arama</th>
                          <th className="px-3 py-2 text-center">Chat</th>
                          <th className="px-3 py-2 text-right">Token</th>
                          <th className="px-3 py-2 text-right">Maliyet</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-700/50">
                        {userModal.dailyBreakdown.slice(0, 30).map((d) => (
                          <tr key={d.date} className="text-gray-300">
                            <td className="px-3 py-2">{d.date}</td>
                            <td className="px-3 py-2 text-center">{d.searches}</td>
                            <td className="px-3 py-2 text-center">{d.chats}</td>
                            <td className="px-3 py-2 text-right">{d.tokens.toLocaleString("tr-TR")}</td>
                            <td className="px-3 py-2 text-right text-green-400">{formatCost(d.tokens)}</td>
                          </tr>
                        ))}
                        {userModal.dailyBreakdown.length === 0 && (
                          <tr>
                            <td colSpan={5} className="px-3 py-4 text-center text-gray-500">Veri yok</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Folders */}
                <div className="px-6 py-3">
                  <h3 className="text-sm font-semibold text-gray-300 mb-3">Klasörler</h3>
                  <div className="flex flex-wrap gap-2">
                    {userModal.folders.length > 0 ? userModal.folders.map((f) => (
                      <span key={f.name} className="inline-flex items-center gap-1.5 bg-[#1a2942] px-3 py-1.5 rounded-lg text-xs text-gray-300">
                        {f.name}
                        <span className="bg-[#667eea]/20 text-[#667eea] px-1.5 py-0.5 rounded text-[10px] font-bold">{f.brandCount}</span>
                      </span>
                    )) : (
                      <span className="text-xs text-gray-500">Klasör yok</span>
                    )}
                  </div>
                </div>

                {/* Recent Keywords */}
                <div className="px-6 py-3 pb-6">
                  <h3 className="text-sm font-semibold text-gray-300 mb-3">Son Aramalar</h3>
                  <div className="flex flex-wrap gap-2">
                    {userModal.recentKeywords.length > 0 ? userModal.recentKeywords.map((kw) => (
                      <span key={kw} className="inline-block bg-[#1a2942] px-3 py-1.5 rounded-lg text-xs text-gray-300">{kw}</span>
                    )) : (
                      <span className="text-xs text-gray-500">Arama yok</span>
                    )}
                  </div>
                </div>
              </>
            ) : null}
          </div>
        </div>
      )}

      {/* Activity log */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Aktivite Kayıtları</h2>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 bg-gray-50 rounded-lg px-3 py-1.5">
              <Filter size={14} className="text-gray-400" />
              <input
                type="text"
                value={filterUser}
                onChange={(e) => setFilterUser(e.target.value)}
                placeholder="Kullanıcı ara..."
                className="bg-transparent text-xs text-gray-600 outline-none w-24"
              />
            </div>
            <select
              value={filterAction}
              onChange={(e) => setFilterAction(e.target.value)}
              className="bg-gray-50 rounded-lg px-3 py-1.5 text-xs text-gray-600 outline-none border-none"
            >
              <option value="">Tüm aksiyonlar</option>
              <option value="search">Arama</option>
              <option value="chat">Chat</option>
            </select>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left">
                <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Kullanıcı</th>
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
                    Aktivite kaydı bulunamadı
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
