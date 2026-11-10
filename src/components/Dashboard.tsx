import { useEffect, useState } from "react";
import { Coins, Crown, HandCoins, Medal, Scale, Users as UsersIcon } from "lucide-react";
import { fetchSummary, fetchTopDonors } from "@/lib/api";
import { formatAmount } from "@/lib/format";
import { CURRENCY } from "@/lib/config";
import type { Summary, TopDonor } from "@/types";

export function Dashboard() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [topDonors, setTopDonors] = useState<TopDonor[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [s, t] = await Promise.all([fetchSummary(), fetchTopDonors(10)]);
      if (!cancelled) {
        setSummary(s);
        setTopDonors(t);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const hasDonors = (topDonors?.length ?? 0) > 0;

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

      {hasDonors ? (
        <TopDonorsCard donors={topDonors!} />
      ) : (
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
      )}
    </section>
  );
}

function TopDonorsCard({ donors }: { donors: TopDonor[] }) {
  const grandTotal = donors.reduce((s, d) => s + d.total, 0);
  return (
    <div className="card-gold p-6">
      <div className="flex items-center gap-2 mb-1">
        <Crown className="h-5 w-5 text-gold-700" />
        <h2 className="font-display text-xl text-gold-gradient tracking-wider">
          Meilleurs donateurs
        </h2>
      </div>
      <p className="text-ink-soft text-sm italic">
        Les plus généreuses âmes ayant soutenu la Nation.
      </p>
      <hr className="section-divider" />
      <ol className="space-y-2">
        {donors.map((d, i) => {
          const share = grandTotal > 0 ? (d.total / grandTotal) * 100 : 0;
          const rank = i + 1;
          return (
            <li
              key={`${d.citizen_id ?? "label"}-${d.display_name ?? d.label ?? i}`}
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/70 transition-colors"
            >
              <RankBadge rank={rank} />
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2 flex-wrap">
                  <span className="font-medium truncate">
                    {d.display_name ?? "(donateur retiré)"}
                  </span>
                  {d.title && (
                    <span className="badge-gold badge text-xs">{d.title}</span>
                  )}
                  {!d.citizen_id && d.label && (
                    <span className="text-xs italic text-ink-soft">
                      (libre)
                    </span>
                  )}
                </div>
                <div className="mt-1 flex items-center gap-2">
                  <div className="h-1.5 flex-1 bg-sky-100 rounded-full overflow-hidden min-w-20 max-w-xs">
                    <div
                      className="h-full bg-gradient-to-r from-gold-300 to-gold-600"
                      style={{ width: `${Math.max(2, share)}%` }}
                    />
                  </div>
                  <span className="text-xs text-ink-soft whitespace-nowrap">
                    {d.n} don{d.n > 1 ? "s" : ""}
                  </span>
                </div>
              </div>
              <div className="text-right font-display text-gold-gradient text-lg whitespace-nowrap">
                {formatAmount(d.total)}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) {
    return (
      <div className="h-9 w-9 grid place-items-center rounded-full bg-gradient-to-br from-gold-300 to-gold-600 text-white shadow-md shadow-gold-500/40">
        <Crown className="h-4 w-4" />
      </div>
    );
  }
  if (rank === 2) {
    return (
      <div className="h-9 w-9 grid place-items-center rounded-full bg-gradient-to-br from-slate-200 to-slate-400 text-slate-700 shadow-sm">
        <Medal className="h-4 w-4" />
      </div>
    );
  }
  if (rank === 3) {
    return (
      <div className="h-9 w-9 grid place-items-center rounded-full bg-gradient-to-br from-amber-400 to-amber-700 text-white shadow-sm">
        <Medal className="h-4 w-4" />
      </div>
    );
  }
  return (
    <div className="h-9 w-9 grid place-items-center rounded-full bg-white border border-sky-200 text-sky-800 font-display">
      {rank}
    </div>
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
