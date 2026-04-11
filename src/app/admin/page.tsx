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
  Send,
  CheckCircle,
  XCircle,
  Trash2,
  AlertTriangle,
  Shield,
  Star,
  Mail,
} from "lucide-react";
import { supabase, uploadExpertAvatar, updateExpertProfile } from "@/lib/supabase";
import { Upload } from "lucide-react";

interface UserRow {
  id: number;
  username: string;
  role: string;
  created_at: string;
  expertise: string | null;
  avatar_url: string | null;
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

interface ApprovalRow {
  id: number;
  user_id: number;
  name: string;
  email: string;
  type: string;
  profile_type: "creator" | "supplier";
  created_at: string;
}

interface ReviewRow {
  id: number;
  reviewer_user_id: number;
  target_type: string;
  target_id: number;
  rating: number;
  text: string | null;
  is_expert: boolean;
  created_at: string;
  reviewer_username: string | null;
}

interface SuspiciousRow {
  id: number;
  user_id: number;
  violation_type: string;
  details: Record<string, unknown> | null;
  created_at: string;
  username: string | null;
}

// Sonnet pricing: $3/M input, $15/M output. Approximate as $8/M average
const COST_PER_TOKEN = 8 / 1_000_000; // $0.000008 per token

function formatCost(tokens: number): string {
  const cost = tokens * COST_PER_TOKEN;
  if (cost < 0.01) return `${(cost * 100).toFixed(2)}c`;
  return `$${cost.toFixed(2)}`;
}

function ExpertProfileEditor({ userRow, onUpdate }: { userRow: UserRow; onUpdate: (u: Partial<UserRow>) => void }) {
  const [expertise, setExpertise] = useState(userRow.expertise || "");
  const [avatarUrl, setAvatarUrl] = useState(userRow.avatar_url || "");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  async function handleFileUpload(file: File) {
    setUploading(true);
    setMsg("");
    try {
      const url = await uploadExpertAvatar(userRow.id, file);
      if (url) {
        // Add cache-busting param
        const freshUrl = url + "?t=" + Date.now();
        setAvatarUrl(freshUrl);
        onUpdate({ avatar_url: freshUrl });
        setMsg("Fotoğraf yüklendi!");
      } else {
        setMsg("Yükleme hatası — Storage bucket ayarlarını kontrol edin");
      }
    } catch {
      setMsg("Yükleme hatası");
    } finally {
      setUploading(false);
      setTimeout(() => setMsg(""), 3000);
    }
  }

  async function handleSave() {
    setSaving(true);
    setMsg("");
    try {
      await updateExpertProfile(userRow.id, { expertise: expertise.trim() || null });
      onUpdate({ expertise: expertise.trim() || null });
      setMsg("Kaydedildi!");
    } catch {
      setMsg("Kaydetme hatası");
    } finally {
      setSaving(false);
      setTimeout(() => setMsg(""), 3000);
    }
  }

  return (
    <div className="px-6 py-4 border-b border-gray-700">
      <h3 className="text-sm font-semibold text-text-muted mb-3">Uzman Profili</h3>
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <div className="flex flex-col items-center gap-2">
          <div className="w-20 h-20 rounded-full overflow-hidden bg-gradient-to-br from-[#667eea] to-[#764ba2] flex items-center justify-center">
            {avatarUrl ? (
              <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="text-2xl font-bold text-white">
                {userRow.username.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <label className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1a2942] border border-gray-600 rounded-lg text-xs text-text-muted hover:border-accent transition-colors cursor-pointer">
            {uploading ? (
              <span>Yükleniyor...</span>
            ) : (
              <>
                <Upload size={12} />
                Fotoğraf Yükle
              </>
            )}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              disabled={uploading}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileUpload(file);
              }}
            />
          </label>
        </div>

        {/* Expertise + save */}
        <div className="flex-1">
          <label className="text-xs text-text-muted mb-1 block">Uzmanlık Alanı</label>
          <input
            type="text"
            value={expertise}
            onChange={(e) => setExpertise(e.target.value)}
            placeholder="ör. DTC Kozmetik Uzmanı"
            className="w-full bg-[#1a2942] border border-gray-600 rounded-lg px-3 py-2 text-sm text-white placeholder-text-secondary focus:outline-none focus:border-accent transition-colors mb-3"
          />
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 bg-accent text-white rounded-lg text-xs font-medium hover:opacity-90 transition-opacity disabled:opacity-40"
          >
            {saving ? "Kaydediliyor..." : "Kaydet"}
          </button>
          {msg && (
            <span className={`ml-3 text-xs font-medium ${msg.includes("hata") ? "text-red-400" : "text-green-400"}`}>
              {msg}
            </span>
          )}
        </div>
      </div>
    </div>
  );
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
  const [adminTab, setAdminTab] = useState<"users" | "approvals" | "reviews" | "suspicious">("users");
  const [approvals, setApprovals] = useState<ApprovalRow[]>([]);
  const [approvalsLoading, setApprovalsLoading] = useState(false);
  const [reviews, setReviews] = useState<ReviewRow[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [suspicious, setSuspicious] = useState<SuspiciousRow[]>([]);
  const [suspiciousLoading, setSuspiciousLoading] = useState(false);
  const [messageModal, setMessageModal] = useState<{ userId: number; username: string } | null>(null);
  const [messageTitle, setMessageTitle] = useState("");
  const [messageBody, setMessageBody] = useState("");
  const [messageSending, setMessageSending] = useState(false);
  const [messageStatus, setMessageStatus] = useState("");

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
        .select("id, username, role, created_at, expertise, avatar_url")
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

  const fetchApprovals = useCallback(async () => {
    if (!token) return;
    setApprovalsLoading(true);
    try {
      const res = await fetch("/api/admin/approvals", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setApprovals(data.approvals || []);
    } catch (err) {
      console.error("Approvals fetch error:", err);
    } finally {
      setApprovalsLoading(false);
    }
  }, [token]);

  const fetchReviews = useCallback(async () => {
    if (!token) return;
    setReviewsLoading(true);
    try {
      const res = await fetch("/api/admin/reviews", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setReviews(data.reviews || []);
    } catch (err) {
      console.error("Reviews fetch error:", err);
    } finally {
      setReviewsLoading(false);
    }
  }, [token]);

  const fetchSuspicious = useCallback(async () => {
    if (!token) return;
    setSuspiciousLoading(true);
    try {
      const res = await fetch("/api/admin/suspicious", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setSuspicious(data.suspicious || []);
    } catch (err) {
      console.error("Suspicious fetch error:", err);
    } finally {
      setSuspiciousLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (adminTab === "approvals") fetchApprovals();
    if (adminTab === "reviews") fetchReviews();
    if (adminTab === "suspicious") fetchSuspicious();
  }, [adminTab, fetchApprovals, fetchReviews, fetchSuspicious]);

  async function handleApproval(id: number, profileType: "creator" | "supplier", action: "approve" | "reject") {
    if (!token) return;
    try {
      await fetch("/api/admin/approvals", {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ id, profile_type: profileType, action }),
      });
      fetchApprovals();
    } catch (err) {
      console.error("Approval action error:", err);
    }
  }

  async function handleDeleteReview(id: number) {
    if (!token) return;
    try {
      await fetch("/api/admin/reviews", {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      fetchReviews();
    } catch (err) {
      console.error("Delete review error:", err);
    }
  }

  async function handleSendMessage() {
    if (!token || !messageModal) return;
    setMessageSending(true);
    setMessageStatus("");
    try {
      const res = await fetch("/api/admin/message", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: messageModal.userId, title: messageTitle, body: messageBody }),
      });
      if (res.ok) {
        setMessageStatus("Mesaj gönderildi!");
        setTimeout(() => {
          setMessageModal(null);
          setMessageTitle("");
          setMessageBody("");
          setMessageStatus("");
        }, 1500);
      } else {
        setMessageStatus("Gönderim hatası");
      }
    } catch {
      setMessageStatus("Gönderim hatası");
    } finally {
      setMessageSending(false);
    }
  }

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
        <p className="text-text-muted">Erişim reddedildi</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-text-muted">Yükleniyor...</p>
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
        <h1 className="text-2xl font-bold text-text-primary">Admin Paneli</h1>
        <p className="text-text-secondary mt-1">Kullanıcı yönetimi ve aktivite izleme</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-bg-main rounded-lg p-1">
        {([
          { key: "users" as const, label: "Kullanıcılar", icon: Users },
          { key: "approvals" as const, label: "Onay Bekleyenler", icon: Shield },
          { key: "reviews" as const, label: "Yorum Moderasyonu", icon: Star },
          { key: "suspicious" as const, label: "Şüpheli Aktiviteler", icon: AlertTriangle },
        ]).map((tab) => (
          <button
            key={tab.key}
            onClick={() => setAdminTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              adminTab === tab.key
                ? "bg-bg-card text-text-primary shadow-sm"
                : "text-text-secondary hover:text-text-primary"
            }`}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      {adminTab === "users" && (<>
      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
        <div className="bg-bg-card rounded-xl shadow-sm border border-border-default p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
              <Users size={20} className="text-accent" />
            </div>
            <div>
              <p className="text-2xl font-bold text-text-primary">{stats.totalUsers}</p>
              <p className="text-xs text-text-secondary">Toplam Kullanıcı</p>
            </div>
          </div>
        </div>
        <div className="bg-bg-card rounded-xl shadow-sm border border-border-default p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
              <Search size={20} className="text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-text-primary">{stats.searchesToday}</p>
              <p className="text-xs text-text-secondary">Bugünkü Arama</p>
            </div>
          </div>
        </div>
        <div className="bg-bg-card rounded-xl shadow-sm border border-border-default p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
              <MessageCircle size={20} className="text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-text-primary">{stats.chatsToday}</p>
              <p className="text-xs text-text-secondary">Bugünkü Chat</p>
            </div>
          </div>
        </div>
        <div className="bg-bg-card rounded-xl shadow-sm border border-border-default p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
              <Zap size={20} className="text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-text-primary">{stats.totalTokens.toLocaleString("tr-TR")}</p>
              <p className="text-xs text-text-secondary">Toplam Token</p>
            </div>
          </div>
        </div>
        <div className="bg-bg-card rounded-xl shadow-sm border border-border-default p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
              <DollarSign size={20} className="text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-text-primary">{formatCost(stats.totalTokens)}</p>
              <p className="text-xs text-text-secondary">Toplam Maliyet</p>
            </div>
          </div>
        </div>
      </div>

      {/* Users table */}
      <div className="bg-bg-card rounded-xl shadow-sm border border-border-default mb-8">
        <div className="px-6 py-4 border-b border-border-default">
          <h2 className="text-lg font-semibold text-text-primary">Kullanıcılar</h2>
        </div>
        <div className="divide-y divide-border-default">
          {users.map((u) => {
            const isExpanded = expandedUser === u.id;
            const detail = userDetails[u.id];
            return (
              <div key={u.id}>
                <button
                  onClick={() => toggleUser(u.id)}
                  className="w-full flex items-center justify-between px-6 py-4 hover:bg-bg-main transition-colors text-left"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-9 h-9 rounded-full bg-accent/10 flex items-center justify-center">
                      <span className="text-sm font-bold text-accent">
                        {u.username.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-text-primary">{u.username}</p>
                      <p className="text-xs text-text-muted">{formatDate(u.created_at)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {(() => {
                      const userTokens = activities.filter((a) => a.user_id === u.id).reduce((s, a) => s + (a.tokens_used || 0), 0);
                      return userTokens > 0 ? (
                        <span className="text-xs text-green-600 font-medium">{formatCost(userTokens)}</span>
                      ) : null;
                    })()}
                    {u.role === "admin" ? (
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
                        admin
                      </span>
                    ) : (
                      <select
                        value={u.role}
                        onClick={(e) => e.stopPropagation()}
                        onChange={async (e) => {
                          const newRole = e.target.value;
                          await supabase.from("users").update({ role: newRole }).eq("id", u.id);
                          setUsers((prev) => prev.map((x) => x.id === u.id ? { ...x, role: newRole } : x));
                        }}
                        className={`px-2 py-0.5 rounded-full text-xs font-medium cursor-pointer border-0 outline-none ${
                          u.role === "expert"
                            ? "bg-amber-100 text-amber-700"
                            : "bg-bg-hover text-text-secondary"
                        }`}
                      >
                        <option value="user">user</option>
                        <option value="expert">expert</option>
                      </select>
                    )}
                    <button
                      onClick={(e) => { e.stopPropagation(); openUserModal(u); }}
                      className="px-2 py-0.5 rounded text-xs font-medium bg-accent/10 text-accent hover:bg-accent/20 transition-colors"
                    >
                      Detay
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); setMessageModal({ userId: u.id, username: u.username }); }}
                      className="px-2 py-0.5 rounded text-xs font-medium bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 transition-colors"
                    >
                      <Mail size={12} className="inline mr-1" />
                      Mesaj
                    </button>
                    {isExpanded ? <ChevronDown size={16} className="text-text-muted" /> : <ChevronRight size={16} className="text-text-muted" />}
                  </div>
                </button>
                {isExpanded && detail && (
                  <div className="px-6 pb-4 bg-bg-main">
                    <div className="grid grid-cols-3 gap-4 py-3">
                      <div>
                        <p className="text-xs text-text-secondary mb-1">Klasörler</p>
                        <div className="flex flex-wrap gap-1">
                          {detail.folders.length > 0 ? detail.folders.map((f) => (
                            <span key={f} className="inline-block bg-bg-card border border-border-default px-2 py-0.5 rounded text-xs text-text-secondary">{f}</span>
                          )) : <span className="text-xs text-text-muted">-</span>}
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-text-secondary mb-1">Aramalar / Chatler</p>
                        <p className="text-sm font-medium text-text-primary">{detail.searchCount} / {detail.chatCount}</p>
                      </div>
                      <div>
                        <p className="text-xs text-text-secondary mb-1">Son Aktivite</p>
                        <p className="text-sm text-text-primary">{detail.lastActivity ? formatDate(detail.lastActivity) : "-"}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
          {users.length === 0 && (
            <div className="px-6 py-8 text-center text-text-muted text-sm">
              Henüz kullanıcı yok
            </div>
          )}
        </div>
      </div>

      {/* User Detail Modal */}
      {(userModal || modalLoading) && (
        <div className="fixed inset-0 bg-black/50 z-50 flex justify-end" onClick={() => { setUserModal(null); setModalLoading(false); }}>
          <div
            className="bg-bg-sidebar w-full max-w-lg h-full overflow-y-auto shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {modalLoading ? (
              <div className="flex items-center justify-center h-full">
                <p className="text-text-muted">Yükleniyor...</p>
              </div>
            ) : userModal ? (
              <>
                {/* Modal Header */}
                <div className="sticky top-0 bg-bg-sidebar border-b border-gray-700 px-6 py-4 flex items-center justify-between z-10">
                  <div>
                    <h2 className="text-lg font-bold text-white">{userModal.user.username}</h2>
                    <p className="text-xs text-text-muted">{userModal.user.role} | Kayıt: {formatDate(userModal.user.created_at)}</p>
                  </div>
                  <button onClick={() => setUserModal(null)} className="text-text-muted hover:text-white transition-colors">
                    <X size={22} />
                  </button>
                </div>

                {/* Expert Profile Section */}
                {(userModal.user.role === "expert" || userModal.user.role === "admin") && (
                  <ExpertProfileEditor
                    userRow={userModal.user}
                    onUpdate={(updates) => {
                      setUserModal((prev) => prev ? {
                        ...prev,
                        user: { ...prev.user, ...updates },
                      } : null);
                      setUsers((prev) => prev.map((x) =>
                        x.id === userModal.user.id ? { ...x, ...updates } : x
                      ));
                    }}
                  />
                )}

                {/* Stats */}
                <div className="grid grid-cols-2 gap-3 px-6 py-4">
                  <div className="bg-[#1a2942] rounded-xl p-4">
                    <p className="text-xs text-text-muted mb-1">Toplam Token</p>
                    <p className="text-xl font-bold text-white">{userModal.totalTokens.toLocaleString("tr-TR")}</p>
                  </div>
                  <div className="bg-[#1a2942] rounded-xl p-4">
                    <p className="text-xs text-text-muted mb-1">Toplam Maliyet</p>
                    <p className="text-xl font-bold text-green-400">{formatCost(userModal.totalTokens)}</p>
                  </div>
                </div>

                {/* Daily Breakdown */}
                <div className="px-6 py-3">
                  <h3 className="text-sm font-semibold text-text-muted mb-3">Günlük Detay</h3>
                  <div className="bg-[#1a2942] rounded-xl overflow-hidden">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="text-text-muted border-b border-gray-700">
                          <th className="px-3 py-2 text-left">Tarih</th>
                          <th className="px-3 py-2 text-center">Arama</th>
                          <th className="px-3 py-2 text-center">Chat</th>
                          <th className="px-3 py-2 text-right">Token</th>
                          <th className="px-3 py-2 text-right">Maliyet</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-700/50">
                        {userModal.dailyBreakdown.slice(0, 30).map((d) => (
                          <tr key={d.date} className="text-text-muted">
                            <td className="px-3 py-2">{d.date}</td>
                            <td className="px-3 py-2 text-center">{d.searches}</td>
                            <td className="px-3 py-2 text-center">{d.chats}</td>
                            <td className="px-3 py-2 text-right">{d.tokens.toLocaleString("tr-TR")}</td>
                            <td className="px-3 py-2 text-right text-green-400">{formatCost(d.tokens)}</td>
                          </tr>
                        ))}
                        {userModal.dailyBreakdown.length === 0 && (
                          <tr>
                            <td colSpan={5} className="px-3 py-4 text-center text-text-secondary">Veri yok</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Folders */}
                <div className="px-6 py-3">
                  <h3 className="text-sm font-semibold text-text-muted mb-3">Klasörler</h3>
                  <div className="flex flex-wrap gap-2">
                    {userModal.folders.length > 0 ? userModal.folders.map((f) => (
                      <span key={f.name} className="inline-flex items-center gap-1.5 bg-[#1a2942] px-3 py-1.5 rounded-lg text-xs text-text-muted">
                        {f.name}
                        <span className="bg-accent/20 text-accent px-1.5 py-0.5 rounded text-[10px] font-bold">{f.brandCount}</span>
                      </span>
                    )) : (
                      <span className="text-xs text-text-secondary">Klasör yok</span>
                    )}
                  </div>
                </div>

                {/* Recent Keywords */}
                <div className="px-6 py-3 pb-6">
                  <h3 className="text-sm font-semibold text-text-muted mb-3">Son Aramalar</h3>
                  <div className="flex flex-wrap gap-2">
                    {userModal.recentKeywords.length > 0 ? userModal.recentKeywords.map((kw) => (
                      <span key={kw} className="inline-block bg-[#1a2942] px-3 py-1.5 rounded-lg text-xs text-text-muted">{kw}</span>
                    )) : (
                      <span className="text-xs text-text-secondary">Arama yok</span>
                    )}
                  </div>
                </div>
              </>
            ) : null}
          </div>
        </div>
      )}

      {/* Activity log */}
      <div className="bg-bg-card rounded-xl shadow-sm border border-border-default">
        <div className="px-6 py-4 border-b border-border-default flex items-center justify-between">
          <h2 className="text-lg font-semibold text-text-primary">Aktivite Kayıtları</h2>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 bg-bg-main rounded-lg px-3 py-1.5">
              <Filter size={14} className="text-text-muted" />
              <input
                type="text"
                value={filterUser}
                onChange={(e) => setFilterUser(e.target.value)}
                placeholder="Kullanıcı ara..."
                className="bg-transparent text-xs text-text-secondary outline-none w-24"
              />
            </div>
            <select
              value={filterAction}
              onChange={(e) => setFilterAction(e.target.value)}
              className="bg-bg-main rounded-lg px-3 py-1.5 text-xs text-text-secondary outline-none border-none"
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
              <tr className="bg-bg-main text-left">
                <th className="px-6 py-3 text-xs font-medium text-text-secondary uppercase tracking-wider">Kullanıcı</th>
                <th className="px-6 py-3 text-xs font-medium text-text-secondary uppercase tracking-wider">Aksiyon</th>
                <th className="px-6 py-3 text-xs font-medium text-text-secondary uppercase tracking-wider">Anahtar Kelime</th>
                <th className="px-6 py-3 text-xs font-medium text-text-secondary uppercase tracking-wider">Token</th>
                <th className="px-6 py-3 text-xs font-medium text-text-secondary uppercase tracking-wider">Tarih</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-default">
              {filteredActivities.map((a, i) => (
                <tr key={a.id} className={i % 2 === 0 ? "bg-bg-card" : "bg-bg-main/50"}>
                  <td className="px-6 py-3 text-text-primary">{a.users?.username || `#${a.user_id}`}</td>
                  <td className="px-6 py-3">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                        a.action_type === "search"
                          ? "bg-emerald-100 text-emerald-700"
                          : a.action_type === "chat"
                          ? "bg-purple-100 text-purple-700"
                          : "bg-bg-hover text-text-secondary"
                      }`}
                    >
                      {a.action_type}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-text-secondary">{a.keyword || "-"}</td>
                  <td className="px-6 py-3 text-text-secondary">{a.tokens_used || 0}</td>
                  <td className="px-6 py-3 text-text-muted text-xs">{formatDate(a.created_at)}</td>
                </tr>
              ))}
              {filteredActivities.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-text-muted">
                    Aktivite kaydı bulunamadı
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      </>)}

      {/* Approvals Tab */}
      {adminTab === "approvals" && (
        <div className="bg-bg-card rounded-xl shadow-sm border border-border-default">
          <div className="px-6 py-4 border-b border-border-default">
            <h2 className="text-lg font-semibold text-text-primary">Onay Bekleyenler</h2>
          </div>
          {approvalsLoading ? (
            <div className="px-6 py-8 text-center text-text-muted text-sm">Yükleniyor...</div>
          ) : approvals.length === 0 ? (
            <div className="px-6 py-8 text-center text-text-muted text-sm">Onay bekleyen başvuru yok</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-bg-main text-left">
                    <th className="px-6 py-3 text-xs font-medium text-text-secondary uppercase tracking-wider">Ad/Firma</th>
                    <th className="px-6 py-3 text-xs font-medium text-text-secondary uppercase tracking-wider">Tür</th>
                    <th className="px-6 py-3 text-xs font-medium text-text-secondary uppercase tracking-wider">E-posta</th>
                    <th className="px-6 py-3 text-xs font-medium text-text-secondary uppercase tracking-wider">Başvuru Tarihi</th>
                    <th className="px-6 py-3 text-xs font-medium text-text-secondary uppercase tracking-wider">İşlem</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-default">
                  {approvals.map((a, i) => (
                    <tr key={`${a.profile_type}-${a.id}`} className={i % 2 === 0 ? "bg-bg-card" : "bg-bg-main/50"}>
                      <td className="px-6 py-3 text-text-primary">{a.name}</td>
                      <td className="px-6 py-3">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                          a.profile_type === "creator" ? "bg-purple-100 text-purple-700" : "bg-amber-100 text-amber-700"
                        }`}>
                          {a.profile_type === "creator" ? "İçerik Üretici" : "Tedarikçi"} ({a.type})
                        </span>
                      </td>
                      <td className="px-6 py-3 text-text-secondary">{a.email}</td>
                      <td className="px-6 py-3 text-text-muted text-xs">{formatDate(a.created_at)}</td>
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleApproval(a.id, a.profile_type, "approve")}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors"
                          >
                            <CheckCircle size={14} />
                            Onayla
                          </button>
                          <button
                            onClick={() => handleApproval(a.id, a.profile_type, "reject")}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
                          >
                            <XCircle size={14} />
                            Reddet
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Reviews Tab */}
      {adminTab === "reviews" && (
        <div className="bg-bg-card rounded-xl shadow-sm border border-border-default">
          <div className="px-6 py-4 border-b border-border-default">
            <h2 className="text-lg font-semibold text-text-primary">Yorum Moderasyonu</h2>
          </div>
          {reviewsLoading ? (
            <div className="px-6 py-8 text-center text-text-muted text-sm">Yükleniyor...</div>
          ) : reviews.length === 0 ? (
            <div className="px-6 py-8 text-center text-text-muted text-sm">Henüz yorum yok</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-bg-main text-left">
                    <th className="px-6 py-3 text-xs font-medium text-text-secondary uppercase tracking-wider">Yorumcu</th>
                    <th className="px-6 py-3 text-xs font-medium text-text-secondary uppercase tracking-wider">Profil</th>
                    <th className="px-6 py-3 text-xs font-medium text-text-secondary uppercase tracking-wider">Puan</th>
                    <th className="px-6 py-3 text-xs font-medium text-text-secondary uppercase tracking-wider">Yorum</th>
                    <th className="px-6 py-3 text-xs font-medium text-text-secondary uppercase tracking-wider">Tarih</th>
                    <th className="px-6 py-3 text-xs font-medium text-text-secondary uppercase tracking-wider">İşlem</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-default">
                  {reviews.map((r, i) => (
                    <tr key={r.id} className={i % 2 === 0 ? "bg-bg-card" : "bg-bg-main/50"}>
                      <td className="px-6 py-3 text-text-primary">
                        {r.reviewer_username || `#${r.reviewer_user_id}`}
                        {r.is_expert && (
                          <span className="ml-1.5 px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-100 text-amber-700">Uzman</span>
                        )}
                      </td>
                      <td className="px-6 py-3 text-text-secondary">{r.target_type} #{r.target_id}</td>
                      <td className="px-6 py-3">
                        <span className="text-amber-400">{"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}</span>
                      </td>
                      <td className="px-6 py-3 text-text-secondary max-w-xs truncate">{r.text || "-"}</td>
                      <td className="px-6 py-3 text-text-muted text-xs">{formatDate(r.created_at)}</td>
                      <td className="px-6 py-3">
                        <button
                          onClick={() => handleDeleteReview(r.id)}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
                        >
                          <Trash2 size={14} />
                          Sil
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Suspicious Tab */}
      {adminTab === "suspicious" && (
        <div className="bg-bg-card rounded-xl shadow-sm border border-border-default">
          <div className="px-6 py-4 border-b border-border-default">
            <h2 className="text-lg font-semibold text-text-primary">Şüpheli Aktiviteler</h2>
          </div>
          {suspiciousLoading ? (
            <div className="px-6 py-8 text-center text-text-muted text-sm">Yükleniyor...</div>
          ) : suspicious.length === 0 ? (
            <div className="px-6 py-8 text-center text-text-muted text-sm">Şüpheli aktivite yok</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-bg-main text-left">
                    <th className="px-6 py-3 text-xs font-medium text-text-secondary uppercase tracking-wider">Kullanıcı</th>
                    <th className="px-6 py-3 text-xs font-medium text-text-secondary uppercase tracking-wider">İhlal Türü</th>
                    <th className="px-6 py-3 text-xs font-medium text-text-secondary uppercase tracking-wider">Detay</th>
                    <th className="px-6 py-3 text-xs font-medium text-text-secondary uppercase tracking-wider">Tarih</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-default">
                  {suspicious.map((s, i) => (
                    <tr key={s.id} className={i % 2 === 0 ? "bg-bg-card" : "bg-bg-main/50"}>
                      <td className="px-6 py-3 text-text-primary">{s.username || `#${s.user_id}`}</td>
                      <td className="px-6 py-3">
                        <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
                          {s.violation_type}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-text-secondary text-xs max-w-md">
                        {s.details ? (
                          <pre className="whitespace-pre-wrap break-all bg-bg-main rounded p-2 text-[11px]">
                            {JSON.stringify(s.details, null, 2)}
                          </pre>
                        ) : "-"}
                      </td>
                      <td className="px-6 py-3 text-text-muted text-xs">{formatDate(s.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Message Modal */}
      {messageModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center" onClick={() => { setMessageModal(null); setMessageTitle(""); setMessageBody(""); setMessageStatus(""); }}>
          <div className="bg-bg-card rounded-xl shadow-2xl border border-border-default w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-border-default flex items-center justify-between">
              <h3 className="text-lg font-semibold text-text-primary">Mesaj Gönder — {messageModal.username}</h3>
              <button onClick={() => { setMessageModal(null); setMessageTitle(""); setMessageBody(""); setMessageStatus(""); }} className="text-text-muted hover:text-text-primary transition-colors">
                <X size={20} />
              </button>
            </div>
            <div className="px-6 py-4 space-y-4">
              <div>
                <label className="text-xs text-text-secondary mb-1 block">Başlık</label>
                <input
                  type="text"
                  value={messageTitle}
                  onChange={(e) => setMessageTitle(e.target.value)}
                  placeholder="Mesaj başlığı..."
                  className="w-full bg-bg-main border border-border-default rounded-lg px-3 py-2 text-sm text-text-primary placeholder-text-secondary focus:outline-none focus:border-accent transition-colors"
                />
              </div>
              <div>
                <label className="text-xs text-text-secondary mb-1 block">Mesaj</label>
                <textarea
                  value={messageBody}
                  onChange={(e) => setMessageBody(e.target.value)}
                  placeholder="Mesaj içeriği..."
                  rows={4}
                  className="w-full bg-bg-main border border-border-default rounded-lg px-3 py-2 text-sm text-text-primary placeholder-text-secondary focus:outline-none focus:border-accent transition-colors resize-none"
                />
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleSendMessage}
                  disabled={messageSending || !messageTitle.trim() || !messageBody.trim()}
                  className="flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-40"
                >
                  <Send size={14} />
                  {messageSending ? "Gönderiliyor..." : "Gönder"}
                </button>
                {messageStatus && (
                  <span className={`text-xs font-medium ${messageStatus.includes("hata") ? "text-red-400" : "text-green-400"}`}>
                    {messageStatus}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
