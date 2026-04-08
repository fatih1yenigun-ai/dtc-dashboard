"use client";

import { useState } from "react";
import { Star } from "lucide-react";

interface StarRatingProps {
  rating: number;
  onChange?: (rating: number) => void;
  readonly?: boolean;
  size?: number;
}

export default function StarRating({
  rating,
  onChange,
  readonly = false,
  size = 20,
}: StarRatingProps) {
  const [hoverRating, setHoverRating] = useState(0);

  const isInteractive = !readonly && !!onChange;
  const displayRating = isInteractive && hoverRating > 0 ? hoverRating : rating;

  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = displayRating >= star;
        const halfFilled = !filled && readonly && displayRating >= star - 0.5;

        return (
          <button
            key={star}
            type="button"
            disabled={!isInteractive}
            className={`relative p-0 border-0 bg-transparent ${
              isInteractive ? "cursor-pointer" : "cursor-default"
            }`}
            onClick={() => isInteractive && onChange(star)}
            onMouseEnter={() => isInteractive && setHoverRating(star)}
            onMouseLeave={() => isInteractive && setHoverRating(0)}
          >
            {halfFilled ? (
              <div className="relative" style={{ width: size, height: size }}>
                {/* Empty star background */}
                <Star
                  size={size}
                  className="text-text-muted absolute inset-0"
                  strokeWidth={1.5}
                />
                {/* Half-filled overlay */}
                <div
                  className="absolute inset-0 overflow-hidden"
                  style={{ width: size / 2 }}
                >
                  <Star
                    size={size}
                    className="text-amber-400"
                    fill="currentColor"
                    strokeWidth={1.5}
                  />
                </div>
              </div>
            ) : (
              <Star
                size={size}
                className={filled ? "text-amber-400" : "text-text-muted"}
                fill={filled ? "currentColor" : "none"}
                strokeWidth={1.5}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
