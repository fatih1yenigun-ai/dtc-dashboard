"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { Review } from "@/lib/marketplace";
import StarRating from "./StarRating";

interface ReviewSectionProps {
  targetType: "creator" | "supplier";
  targetId: number;
}

export default function ReviewSection({
  targetType,
  targetId,
}: ReviewSectionProps) {
  const { user, token } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState({ avg_rating: 0, review_count: 0 });
  const [showForm, setShowForm] = useState(false);
  const [formRating, setFormRating] = useState(0);
  const [formText, setFormText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        target_type: targetType,
        target_id: String(targetId),
      });
      const res = await fetch(`/api/reviews?${params}`);
      if (res.ok) {
        const data = await res.json();
        setReviews(data.reviews ?? []);
        setStats(data.stats ?? { avg_rating: 0, review_count: 0 });
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, [targetType, targetId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (formRating === 0) {
      setError("Lütfen bir puan seçin.");
      return;
    }
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          target_type: targetType,
          target_id: targetId,
          rating: formRating,
          text: formText.trim() || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Yorum gönderilemedi.");
        return;
      }

      // Reset form and refresh
      setShowForm(false);
      setFormRating(0);
      setFormText("");
      await fetchData();
    } catch {
      setError("Bir hata oluştu. Tekrar deneyin.");
    } finally {
      setSubmitting(false);
    }
  }

  function formatDate(dateStr: string): string {
    const d = new Date(dateStr);
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `${day}.${month}.${year}`;
  }

  if (loading) {
    return (
      <div className="text-text-muted text-sm py-4">Yorumlar yükleniyor...</div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Stats header */}
      <div className="flex items-center gap-3">
        <StarRating rating={stats.avg_rating} readonly size={22} />
        <span className="text-text-secondary text-sm">
          {stats.avg_rating > 0 ? stats.avg_rating.toFixed(1) : "0"} (
          {stats.review_count} yorum)
        </span>
      </div>

      {/* Write review button */}
      {user && !showForm && (
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="px-4 py-2 text-sm bg-brand-primary text-white rounded-lg hover:bg-brand-primary/90 transition-colors"
        >
          Yorum Yaz
        </button>
      )}

      {/* Review form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="space-y-3 p-4 rounded-lg border border-border-subtle bg-bg-card">
          <div className="space-y-1">
            <label className="text-sm text-text-secondary">Puanınız</label>
            <StarRating rating={formRating} onChange={setFormRating} size={24} />
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-sm text-text-secondary">
                Yorumunuz (isteğe bağlı)
              </label>
              <span className="text-xs text-text-muted">
                {formText.length}/500
              </span>
            </div>
            <textarea
              value={formText}
              onChange={(e) => {
                if (e.target.value.length <= 500) setFormText(e.target.value);
              }}
              rows={3}
              maxLength={500}
              className="w-full rounded-lg border border-border-subtle bg-bg-input px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-brand-primary resize-none"
              placeholder="Deneyiminizi paylaşın..."
            />
          </div>

          {error && (
            <p className="text-sm text-red-500">{error}</p>
          )}

          <div className="flex items-center gap-2">
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 text-sm bg-brand-primary text-white rounded-lg hover:bg-brand-primary/90 transition-colors disabled:opacity-50"
            >
              {submitting ? "Gönderiliyor..." : "Gönder"}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                setFormRating(0);
                setFormText("");
                setError(null);
              }}
              className="px-4 py-2 text-sm text-text-secondary hover:text-text-primary transition-colors"
            >
              İptal
            </button>
          </div>
        </form>
      )}

      {/* Reviews list */}
      {reviews.length > 0 ? (
        <div className="divide-y divide-border-subtle">
          {reviews.map((review) => (
            <div key={review.id} className="py-4 space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-text-primary">
                  {review.reviewer_username ?? "Anonim"}
                </span>
                {review.is_expert && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-500 font-medium">
                    Uzman
                  </span>
                )}
                <span className="text-xs text-text-muted ml-auto">
                  {formatDate(review.created_at)}
                </span>
              </div>
              <StarRating rating={review.rating} readonly size={16} />
              {review.text && (
                <p className="text-sm text-text-secondary">{review.text}</p>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-text-muted py-2">Henüz yorum yapılmamış.</p>
      )}
    </div>
  );
}
