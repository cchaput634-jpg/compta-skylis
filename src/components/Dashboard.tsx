import { useEffect, useState } from "react";
import { Coins, Crown, HandCoins, Medal, Scale, Sparkles, Users as UsersIcon } from "lucide-react";
import { fetchSummary, fetchTopDonors } from "@/lib/api";
import type { Summary, TopDonor } from "@/types";
import { Amount } from "./Amount";

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

  return (
    <section className="w-full max-w-6xl mx-auto px-4 sm:px-8 pt-6">
      <h1 className="font-display text-3xl text-sky-gradient tracking-wider title-shimmer">
        Aperçu du Trésor
      </h1>
      <p className="text-ink-soft italic mt-1">
        État des finances de la Nation du vent.
      </p>
      <hr className="section-divider" />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          icon={<Scale className="h-5 w-5" />}
          label="Solde du Trésor"
          value={
            loading
              ? "…"
              : summary?.balance != null
                ? <Amount n={summary.balance} size="md" />
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
                ? <Amount n={summary.donations.total} size="md" />
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
          icon={<Sparkles className="h-5 w-5" />}
          label="Gains"
          value={
            loading
              ? "…"
              : summary?.gains
                ? <Amount n={summary.gains.total} size="md" />
                : "—"
          }
          sub={
            summary?.gains
              ? `${summary.gains.n} enregistrement${summary.gains.n > 1 ? "s" : ""}`
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
                ? <Amount n={summary.expenses.total} size="md" />
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

      <TopDonorsCard donors={topDonors ?? []} loading={loading} />
    </section>
  );
}

/* Palette pour les tranches du donut : or → turquoise */
const SLICE_PALETTE = [
  "#d97706", "#f59e0b", "#fbbf24", "#fcd34d", "#fde68a",
  "#2dd4bf", "#14b8a6", "#0d9488", "#0f766e", "#115e59",
];

function TopDonorsCard({
  donors,
  loading,
}: {
  donors: TopDonor[];
  loading: boolean;
}) {
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
      {loading ? (
        <div className="text-center text-ink-soft py-6">Chargement…</div>
      ) : donors.length === 0 ? (
        <div className="text-center py-6 text-ink-soft italic">
          Aucun don enregistré pour l'instant.
          <br />
          <span className="text-sm">
            Ajoute un premier don dans l'onglet « Dons » pour voir le classement
            apparaître.
          </span>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
          {/* Classement (gauche, 3/5) */}
          <ol className="space-y-2 lg:col-span-3">
            {donors.map((d, i) => {
              const share = grandTotal > 0 ? (d.total / grandTotal) * 100 : 0;
              const rank = i + 1;
              const color = SLICE_PALETTE[i % SLICE_PALETTE.length];
              return (
                <li
                  key={`${d.citizen_id ?? "label"}-${d.display_name ?? d.label ?? i}`}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/70 transition-colors border-l-4"
                  style={{ borderLeftColor: color }}
                >
                  <RankBadge rank={rank} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2 flex-wrap">
                      <span className="font-medium truncate">
                        {d.display_name ?? "(donateur retiré)"}
                      </span>
                      {d.title && (
                        <span className="badge-gold badge text-xs">
                          {d.title}
                        </span>
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
                          className="h-full rounded-full"
                          style={{
                            width: `${Math.max(2, share)}%`,
                            backgroundColor: color,
                          }}
                        />
                      </div>
                      <span className="text-xs text-ink-soft whitespace-nowrap">
                        {share.toFixed(1)} % · {d.n} don{d.n > 1 ? "s" : ""}
                      </span>
                    </div>
                  </div>
                  <div className="text-right font-display text-gold-gradient text-lg">
                    <Amount n={d.total} size="sm" />
                  </div>
                </li>
              );
            })}
          </ol>

          {/* Donut + légende (droite, 2/5) */}
          <div className="lg:col-span-2 flex flex-col items-center">
            <DonutChart donors={donors} grandTotal={grandTotal} />
            <div className="mt-3 text-center">
              <div className="text-xs font-display uppercase tracking-wider text-ink-soft">
                Total des dons
              </div>
              <div className="font-display text-gold-gradient text-xl">
                <Amount n={grandTotal} size="md" />
              </div>
            </div>

            {/* Légende */}
            <ul className="mt-4 w-full space-y-1 text-sm">
              {donors.map((d, i) => {
                const share = grandTotal > 0 ? (d.total / grandTotal) * 100 : 0;
                const color = SLICE_PALETTE[i % SLICE_PALETTE.length];
                return (
                  <li
                    key={`legend-${d.citizen_id ?? "label"}-${i}`}
                    className="flex items-center gap-2"
                  >
                    <span
                      className="h-3 w-3 rounded-sm shrink-0"
                      style={{ backgroundColor: color }}
                      aria-hidden
                    />
                    <span className="flex-1 truncate">
                      {d.display_name ?? d.label ?? "—"}
                    </span>
                    <span className="text-ink-soft whitespace-nowrap font-display tracking-wider">
                      {share.toFixed(1)} %
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

function DonutChart({
  donors,
  grandTotal,
}: {
  donors: TopDonor[];
  grandTotal: number;
}) {
  const size = 220;
  const thickness = 30;
  const cx = size / 2;
  const cy = size / 2;
  const r = (size - thickness) / 2;
  const circumference = 2 * Math.PI * r;

  if (grandTotal <= 0) return null;

  let acc = 0;
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className="max-w-full h-auto"
      role="img"
      aria-label="Répartition des dons par donateur"
    >
      {/* Piste de fond */}
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        stroke="rgba(254, 243, 199, 0.5)"
        strokeWidth={thickness}
      />
      {donors.map((d, i) => {
        const share = d.total / grandTotal;
        const dash = share * circumference;
        const rotation = acc * 360 - 90;
        acc += share;
        const color = SLICE_PALETTE[i % SLICE_PALETTE.length];
        return (
          <circle
            key={`${d.citizen_id ?? "label"}-${i}`}
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke={color}
            strokeWidth={thickness}
            strokeDasharray={`${dash} ${circumference - dash}`}
            strokeDashoffset={0}
            transform={`rotate(${rotation} ${cx} ${cy})`}
            style={{ transition: "stroke-dasharray 0.4s" }}
          >
            <title>
              {`${d.display_name ?? d.label ?? "—"} : ${Math.round(share * 100)} %`}
            </title>
          </circle>
        );
      })}
      {/* Centre : juste le nombre de donateurs, discrètement */}
      <text
        x={cx}
        y={cy + 6}
        textAnchor="middle"
        className="font-display fill-gold-800"
        style={{ fontSize: 36 }}
      >
        {donors.length}
      </text>
    </svg>
  );
}

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) {
    return (
      <div className="h-9 w-9 shrink-0 grid place-items-center rounded-full bg-gradient-to-br from-gold-300 to-gold-600 text-white shadow-md shadow-gold-500/40">
        <Crown className="h-4 w-4" />
      </div>
    );
  }
  if (rank === 2) {
    return (
      <div className="h-9 w-9 shrink-0 grid place-items-center rounded-full bg-gradient-to-br from-slate-200 to-slate-400 text-slate-700 shadow-sm">
        <Medal className="h-4 w-4" />
      </div>
    );
  }
  if (rank === 3) {
    return (
      <div className="h-9 w-9 shrink-0 grid place-items-center rounded-full bg-gradient-to-br from-amber-400 to-amber-700 text-white shadow-sm">
        <Medal className="h-4 w-4" />
      </div>
    );
  }
  return (
    <div className="h-9 w-9 shrink-0 grid place-items-center rounded-full bg-white border border-sky-200 text-sky-800 font-display">
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
  value: React.ReactNode;
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
        <div className={`font-display text-2xl ${valueCls}`}>{value}</div>
        {sub && <div className="text-xs text-ink-soft mt-0.5">{sub}</div>}
      </div>
    </div>
  );
}
