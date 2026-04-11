"use client";

import { useRef, useState } from "react";
import { Play, Image as ImageIcon } from "lucide-react";

interface SavedAdCreativeProps {
  cover?: string;
  videoUrl?: string;
  alt?: string;
  /** Visual size — "card" for the saved-card grid, "modal" for the detail modal. */
  size?: "card" | "modal";
}

/**
 * Renders a saved ad's creative: thumbnail by default, click-to-play video if a
 * `videoUrl` is available. Used on the saved/koleksiyonum page so users can watch
 * the actual ad they saved (not just metadata) — same vibe as the search pages.
 */
export function SavedAdCreative({ cover, videoUrl, alt = "", size = "card" }: SavedAdCreativeProps) {
  const [playing, setPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  if (!cover && !videoUrl) return null;

  const aspect = size === "modal" ? "aspect-video" : "aspect-[4/5]";
  const playIconSize = size === "modal" ? 32 : 24;
  const playWrapSize = size === "modal" ? "w-16 h-16" : "w-12 h-12";

  function handleClick(e: React.MouseEvent) {
    if (!videoUrl) return;
    e.stopPropagation();
    if (playing) {
      videoRef.current?.pause();
      setPlaying(false);
    } else {
      videoRef.current?.play();
      setPlaying(true);
    }
  }

  return (
    <div
      className={`relative ${aspect} bg-bg-hover rounded-lg overflow-hidden ${videoUrl ? "cursor-pointer" : ""}`}
      onClick={handleClick}
    >
      {videoUrl && playing ? (
        <video
          ref={videoRef}
          src={videoUrl}
          poster={cover}
          className="w-full h-full object-cover"
          autoPlay
          loop
          playsInline
          controls={size === "modal"}
        />
      ) : cover ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={cover} alt={alt} className="w-full h-full object-cover" loading="lazy" />
          {videoUrl && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className={`${playWrapSize} rounded-full bg-black/40 flex items-center justify-center`}>
                <Play size={playIconSize} className="text-white ml-1" fill="white" />
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="w-full h-full flex items-center justify-center text-text-muted">
          <ImageIcon size={size === "modal" ? 56 : 36} />
        </div>
      )}
    </div>
  );
}
