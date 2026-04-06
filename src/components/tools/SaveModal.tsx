"use client";

import { useState } from "react";
import { X } from "lucide-react";

interface SaveModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (name: string) => void;
  loading?: boolean;
  title?: string;
  placeholder?: string;
}

export default function SaveModal({ open, onClose, onSave, loading, title = "Hesaplamayı Kaydet", placeholder = "Hesaplama adı" }: SaveModalProps) {
  const [name, setName] = useState("");

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-bg-card rounded-[14px] border border-border-default shadow-xl w-full max-w-sm p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-text-primary">{title}</h3>
          <button onClick={onClose} className="text-text-muted hover:text-text-secondary">
            <X size={18} />
          </button>
        </div>

        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={placeholder}
          autoFocus
          className="w-full py-2.5 px-4 border border-border-default rounded-lg text-sm bg-bg-input text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent/30 mb-4"
          onKeyDown={(e) => {
            if (e.key === "Enter" && name.trim()) {
              onSave(name.trim());
              setName("");
            }
          }}
        />

        <button
          onClick={() => {
            if (name.trim()) {
              onSave(name.trim());
              setName("");
            }
          }}
          disabled={!name.trim() || loading}
          className="w-full py-2.5 rounded-full bg-accent text-white font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {loading ? "Kaydediliyor..." : "Kaydet"}
        </button>
      </div>
    </div>
  );
}
