"use client";

import { useRef, useState } from "react";
import { Paperclip, X } from "lucide-react";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

interface MentorImageUploadProps {
  onImageSelect: (base64: string | null) => void;
  previewUrl: string | null;
}

export default function MentorImageUpload({ onImageSelect, previewUrl }: MentorImageUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    setError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ACCEPTED_TYPES.includes(file.type)) {
      setError("Sadece JPEG, PNG, WebP veya GIF formatları desteklenir.");
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setError("Görsel 5MB'dan küçük olmalı.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      onImageSelect(result);
    };
    reader.readAsDataURL(file);

    // Reset input so same file can be re-selected
    e.target.value = "";
  }

  function handleRemove() {
    onImageSelect(null);
    setError(null);
  }

  return (
    <div className="relative">
      {/* Preview */}
      {previewUrl && (
        <div className="mb-2 relative inline-block">
          <img
            src={previewUrl}
            alt="Yüklenecek görsel"
            className="h-20 rounded-lg object-cover"
            style={{ border: "1px solid var(--border-subtle)" }}
          />
          <button
            onClick={handleRemove}
            className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center"
            style={{
              background: "#ef4444",
              color: "#fff",
            }}
          >
            <X size={12} />
          </button>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="text-xs mb-1" style={{ color: "#ef4444" }}>
          {error}
        </div>
      )}

      {/* Upload button */}
      <button
        onClick={() => fileInputRef.current?.click()}
        className="p-2 rounded-lg transition-all duration-150"
        style={{
          color: "var(--text-muted)",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = "var(--bg-hover)";
          e.currentTarget.style.color = "#a78bfa";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "transparent";
          e.currentTarget.style.color = "var(--text-muted)";
        }}
        title="Görsel ekle"
      >
        <Paperclip size={18} />
      </button>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
}
