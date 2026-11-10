import { useEffect, useState } from "react";
import { Coins, HandCoins, Scale, Users as UsersIcon } from "lucide-react";
import { fetchSummary } from "@/lib/api";
import { formatAmount } from "@/lib/format";
import { CURRENCY } from "@/lib/config";
import type { Summary } from "@/types";

export function Dashboard() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const s = await fetchSummary();
      if (!cancelled) {
        setSummary(s);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="w-full max-w-6xl mx-auto px-4 sm:px-8 pt-6">
      <h1 className="font-display text-3xl text-sky-gradient tracking-wider title-shimmer">
        Aperçu du Trésor
      </h1>
      <p className="text-ink-soft italic mt-1">
        État des finances de la Nation du vent — exprimé en {CURRENCY}.
      </p>
      <hr className="section-divider" />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<Scale className="h-5 w-5" />}
          label="Solde du Trésor"
          value={
            loading
              ? "…"
              : summary?.balance != null
                ? formatAmount(summary.balance)
                : "—"
          }
          tone={
            summary?.balance != null && summary.balance < 0 ? "red" : "gold"
          }
        />
        <StatCard
          icon={<HandCoins className="h-5 w-5" />}
          label="Dons reçus"
          value={
            loading
              ? "…"
              : summary?.donations
                ? `${formatAmount(summary.donations.total)}`
                : "—"
          }
          sub={
            summary?.donations
              ? `${summary.donations.n} enregistrement${summary.donations.n > 1 ? "s" : ""}`
              : undefined
          }
          tone="sky"
        />
        <StatCard
          icon={<Coins className="h-5 w-5" />}
          label="Dépenses"
          value={
            loading
              ? "…"
              : summary?.expenses
                ? `${formatAmount(summary.expenses.total)}`
                : "—"
          }
          sub={
            summary?.expenses
              ? `${summary.expenses.n} enregistrement${summary.expenses.n > 1 ? "s" : ""}`
              : undefined
          }
          tone="sky"
        />
        <StatCard
          icon={<UsersIcon className="h-5 w-5" />}
          label="Citoyens inscrits"
          value={
            loading ? "…" : summary?.citizens ? String(summary.citizens.n) : "—"
          }
          tone="sky"
        />
      </div>

      <hr className="section-divider" />

      <div className="card p-6">
        <h2 className="font-display text-xl text-sky-gradient tracking-wider mb-2">
          Bienvenue, gardien·ne du Trésor
        </h2>
        <p className="text-ink-soft">
          Choisis une rubrique dans la barre du haut pour tenir le registre
          des citoyens, inscrire un nouveau don ou enregistrer une dépense
          de la nation. Les droits de chaque main sur le Trésor sont réglés
          dans le panneau d'administration.
        </p>
      </div>
    </section>
  );
}

function StatCard({
  icon,
  label,
  value,
  sub,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  tone: "sky" | "gold" | "red";
}) {
  const cls =
    tone === "gold"
      ? "card-gold"
      : tone === "red"
        ? "card border-red-300/60"
        : "card";
  const valueCls =
    tone === "gold"
      ? "text-gold-gradient"
      : tone === "red"
        ? "text-red-700"
        : "text-sky-gradient";
  const iconCls =
    tone === "gold"
      ? "text-gold-700 bg-gold-100 border-gold-200"
      : tone === "red"
        ? "text-red-700 bg-red-100 border-red-200"
        : "text-sky-700 bg-sky-100 border-sky-200";
  return (
    <div className={`${cls} p-4 flex items-start gap-3`}>
      <div
        className={`h-10 w-10 shrink-0 rounded-lg grid place-items-center border ${iconCls}`}
      >
        {icon}
      </div>
      <div className="min-w-0">
        <div className="text-xs font-display tracking-wider uppercase text-ink-soft">
          {label}
        </div>
        <div className={`font-display text-2xl truncate ${valueCls}`}>
          {value}
        </div>
        {sub && <div className="text-xs text-ink-soft mt-0.5">{sub}</div>}
      </div>
    </div>
  );
}
