"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, Star, MessageCircle, TrendingUp } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

interface DashboardStats {
  profile_views: number;
  avg_rating: number;
  review_count: number;
}

interface ReviewItem {
  id: number;
  rating: number;
  text: string | null;
  reviewer_username?: string;
  created_at: string;
}

export default function DashboardPage() {
  const { user, token, loading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (loading) return;
    if (!user || (user.role !== "creator" && user.role !== "supplier")) {
      router.push("/");
      return;
    }

    async function fetchData() {
      try {
        const headers = { Authorization: `Bearer ${token}` };

        const [statsRes, profileRes] = await Promise.all([
          fetch("/api/dashboard/stats", { headers }),
          fetch("/api/dashboard/profile", { headers }),
        ]);

        if (statsRes.ok) {
          setStats(await statsRes.json());
        }

        if (profileRes.ok) {
          const profileData = await profileRes.json();
          const profile = profileData.profile;
          if (profile?.id) {
            const targetType = profileData.role === "creator" ? "creator" : "supplier";
            const revRes = await fetch(
              `/api/marketplace/reviews?target_type=${targetType}&target_id=${profile.id}`
            );
            if (revRes.ok) {
              const revData = await revRes.json();
              setReviews(revData.reviews?.slice(0, 5) || []);
            }
          }
        }
      } catch (err) {
        console.error("Dashboard fetch error:", err);
      } finally {
        setLoadingData(false);
      }
    }

    fetchData();
  }, [user, token, loading, router]);

  if (loading || loadingData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent" />
      </div>
    );
  }

  if (!user || (user.role !== "creator" && user.role !== "supplier")) {
    return null;
  }

  const statCards = [
    {
      label: "Profil Goruntuleme",
      value: stats?.profile_views ?? 0,
      icon: Eye,
      color: "text-blue-500",
    },
    {
      label: "Ortalama Puan",
      value: stats?.avg_rating ?? 0,
      icon: Star,
      color: "text-yellow-500",
    },
    {
      label: "Yorum Sayisi",
      value: stats?.review_count ?? 0,
      icon: MessageCircle,
      color: "text-green-500",
    },
    {
      label: "Trend",
      value: "-",
      icon: TrendingUp,
      color: "text-purple-500",
    },
  ];

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8">
      <h1 className="text-2xl font-bold text-text-primary">Dashboard</h1>

      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <div
            key={card.label}
            className="bg-bg-card border border-border-default rounded-[14px] p-5 space-y-2"
          >
            <div className="flex items-center gap-2">
              <card.icon size={20} className={card.color} />
              <span className="text-sm text-text-muted">{card.label}</span>
            </div>
            <p className="text-2xl font-bold text-text-primary">{card.value}</p>
          </div>
        ))}
      </div>

      {/* Edit profile link */}
      <div>
        <Link
          href="/dashboard/profile"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-accent text-white rounded-[10px] text-sm font-medium hover:opacity-90 transition-opacity"
        >
          Profili Duzenle
        </Link>
      </div>

      {/* Recent reviews */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-text-primary">Son Yorumlar</h2>
        {reviews.length === 0 ? (
          <p className="text-text-muted text-sm">Henuz yorum yok.</p>
        ) : (
          <div className="space-y-3">
            {reviews.map((review) => (
              <div
                key={review.id}
                className="bg-bg-card border border-border-default rounded-[12px] p-4 space-y-1"
              >
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        size={14}
                        className={
                          i < review.rating
                            ? "text-yellow-500 fill-yellow-500"
                            : "text-gray-300"
                        }
                      />
                    ))}
                  </div>
                  <span className="text-xs text-text-muted">
                    {review.reviewer_username || "Anonim"}
                  </span>
                </div>
                {review.text && (
                  <p className="text-sm text-text-secondary">{review.text}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
