"use client";

import { X, Trash2, Clock } from "lucide-react";

export interface SavedItem {
  id: number;
  name: string;
  created_at: string;
}

interface SavedListSlideOverProps {
  open: boolean;
  onClose: () => void;
  items: SavedItem[];
  onLoad: (item: SavedItem) => void;
  onDelete: (id: number) => void;
  title?: string;
}

export default function SavedListSlideOver({ open, onClose, items, onLoad, onDelete, title = "Kayıtlar" }: SavedListSlideOverProps) {
  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-40" onClick={onClose} />
      <div className="fixed inset-y-0 right-0 w-full max-w-[380px] z-50 bg-bg-card border-l border-border-default shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border-default">
          <h3 className="text-lg font-semibold text-text-primary">{title}</h3>
          <button onClick={onClose} className="text-text-muted hover:text-text-secondary">
            <X size={18} />
          </button>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-text-muted text-sm">
              <p>Henüz kayıt yok</p>
            </div>
          ) : (
            <div className="divide-y divide-border-subtle">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="px-5 py-3.5 hover:bg-bg-hover transition-colors cursor-pointer flex items-center justify-between group"
                  onClick={() => onLoad(item)}
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-text-primary truncate">{item.name}</p>
                    <p className="text-xs text-text-muted flex items-center gap-1 mt-0.5">
                      <Clock size={11} />
                      {new Date(item.created_at).toLocaleDateString("tr-TR", { day: "numeric", month: "short", year: "numeric" })}
                    </p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(item.id);
                    }}
                    className="text-text-muted hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all p-1"
                    title="Sil"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
