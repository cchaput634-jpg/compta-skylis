import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, X } from "lucide-react";
import type { Citizen } from "@/types";

/**
 * Menu déroulant filtrable pour choisir un citoyen.
 * Permet aussi d'indiquer un nom libre (donateur extérieur / anonyme).
 */

export type PickerValue =
  | { kind: "citizen"; citizenId: string }
  | { kind: "label"; label: string }
  | { kind: "none" };

interface Props {
  citizens: Citizen[];
  value: PickerValue;
  onChange: (v: PickerValue) => void;
  placeholder?: string;
  allowFreeText?: boolean;
}

export function CitizenPicker({
  citizens,
  value,
  onChange,
  placeholder = "Sélectionner un citoyen…",
  allowFreeText = true,
}: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIdx, setActiveIdx] = useState(0);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const selectedCitizen = useMemo(() => {
    if (value.kind !== "citizen") return null;
    return citizens.find((c) => c.id === value.citizenId) ?? null;
  }, [value, citizens]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return citizens;
    return citizens.filter((c) => {
      const haystack = `${c.name} ${c.title ?? ""} ${c.discord_id ?? ""}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [citizens, query]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 0);
  }, [open]);

  useEffect(() => {
    setActiveIdx(0);
  }, [query, open]);

  function pickCitizen(c: Citizen) {
    onChange({ kind: "citizen", citizenId: c.id });
    setOpen(false);
    setQuery("");
  }

  function pickFreeText() {
    const text = query.trim();
    if (!text) return;
    onChange({ kind: "label", label: text });
    setOpen(false);
    setQuery("");
  }

  function clear() {
    onChange({ kind: "none" });
    setQuery("");
  }

  const displayText =
    value.kind === "citizen"
      ? selectedCitizen
        ? `${selectedCitizen.name}${selectedCitizen.title ? ` — ${selectedCitizen.title}` : ""}`
        : "(citoyen supprimé)"
      : value.kind === "label"
        ? value.label
        : "";

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="input flex items-center justify-between text-left"
      >
        <span className={displayText ? "text-ink" : "text-ink-soft/70"}>
          {displayText || placeholder}
        </span>
        <span className="flex items-center gap-1">
          {displayText && (
            <span
              role="button"
              aria-label="Effacer"
              onClick={(e) => {
                e.stopPropagation();
                clear();
              }}
              className="text-sky-700/60 hover:text-sky-800 no-tap grid place-items-center h-5 w-5"
            >
              <X className="h-3.5 w-3.5" />
            </span>
          )}
          <ChevronDown className="h-4 w-4 text-sky-700/70" />
        </span>
      </button>

      {open && (
        <div className="citizen-picker-pop mt-1 w-full fancy-scroll">
          <div className="p-2 border-b border-sky-100 sticky top-0 bg-white">
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "ArrowDown") {
                  e.preventDefault();
                  setActiveIdx((i) => Math.min(filtered.length - 1, i + 1));
                } else if (e.key === "ArrowUp") {
                  e.preventDefault();
                  setActiveIdx((i) => Math.max(0, i - 1));
                } else if (e.key === "Enter") {
                  e.preventDefault();
                  if (filtered[activeIdx]) pickCitizen(filtered[activeIdx]);
                  else if (allowFreeText && query.trim()) pickFreeText();
                } else if (e.key === "Escape") {
                  setOpen(false);
                }
              }}
              placeholder="Rechercher…"
              className="input"
            />
          </div>
          {filtered.length === 0 && !allowFreeText && (
            <div className="p-3 text-sm text-ink-soft">Aucun résultat.</div>
          )}
          {filtered.map((c, i) => (
            <div
              key={c.id}
              data-active={i === activeIdx}
              onClick={() => pickCitizen(c)}
              onMouseEnter={() => setActiveIdx(i)}
              className="citizen-picker-item"
            >
              <div className="font-medium">{c.name}</div>
              {(c.title || c.discord_id) && (
                <div className="text-xs text-ink-soft">
                  {c.title}
                  {c.title && c.discord_id ? " · " : ""}
                  {c.discord_id ? `@${c.discord_id}` : ""}
                </div>
              )}
            </div>
          ))}
          {allowFreeText && query.trim() && (
            <div
              onClick={pickFreeText}
              className="citizen-picker-item text-gold-800 italic"
              data-active={activeIdx >= filtered.length}
            >
              Utiliser « {query.trim()} » comme donateur libre
            </div>
          )}
        </div>
      )}
    </div>
  );
}
