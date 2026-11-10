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

          {/* Histogramme (droite, 2/5) */}
          <div className="lg:col-span-2 flex flex-col">
            <BarChart donors={donors} />
            <div className="mt-3 text-center">
              <div className="text-xs font-display uppercase tracking-wider text-ink-soft">
                Total des dons
              </div>
              <div className="font-display text-gold-gradient text-xl">
                <Amount n={grandTotal} size="md" />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function BarChart({ donors }: { donors: TopDonor[] }) {
  const maxAmount = Math.max(1, ...donors.map((d) => d.total));

  // Dimensions SVG
  const padLeft = 10;
  const padRight = 10;
  const padTop = 24; // place pour les montants au-dessus
  const padBottom = 58; // place pour les noms penchés
  const chartH = 180;
  const barGap = 6;
  const barW = Math.max(14, Math.floor((300 - padLeft - padRight) / donors.length) - barGap);
  const width = padLeft + padRight + donors.length * (barW + barGap) - barGap;
  const height = padTop + chartH + padBottom;

  // Lignes de grille Y (25 / 50 / 75 / 100 %)
  const gridLines = [0, 0.25, 0.5, 0.75, 1];

  const nf = new Intl.NumberFormat("fr-FR");

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="w-full h-auto max-w-full"
      role="img"
      aria-label="Histogramme des dons par donateur"
    >
      {/* Grille horizontale */}
      {gridLines.map((g) => {
        const y = padTop + chartH - g * chartH;
        return (
          <line
            key={g}
            x1={padLeft}
            x2={width - padRight}
            y1={y}
            y2={y}
            stroke="rgba(252, 211, 77, 0.3)"
            strokeDasharray={g === 0 ? undefined : "2 3"}
            strokeWidth={g === 0 ? 1.2 : 1}
          />
        );
      })}

      {donors.map((d, i) => {
        const h = (d.total / maxAmount) * chartH;
        const x = padLeft + i * (barW + barGap);
        const y = padTop + chartH - h;
        const color = SLICE_PALETTE[i % SLICE_PALETTE.length];
        const fullName = d.display_name ?? d.label ?? "—";
        const shortName =
          fullName.length > 10 ? fullName.slice(0, 10) + "…" : fullName;
        const nameCx = x + barW / 2;
        const nameCy = padTop + chartH + 10;
        return (
          <g key={`${d.citizen_id ?? "label"}-${i}`}>
            {/* Montant au-dessus */}
            <text
              x={x + barW / 2}
              y={y - 6}
              textAnchor="middle"
              className="fill-gold-800 font-display"
              style={{ fontSize: 11 }}
            >
              {nf.format(d.total)}
            </text>
            {/* La barre */}
            <rect
              x={x}
              y={y}
              width={barW}
              height={h}
              rx={3}
              fill={color}
              style={{ transition: "y 0.3s, height 0.3s" }}
            >
              <title>
                {fullName} : {nf.format(d.total)} Couronnes ({d.n} don
                {d.n > 1 ? "s" : ""})
              </title>
            </rect>
            {/* Nom en bas, penché */}
            <text
              x={nameCx}
              y={nameCy}
              textAnchor="end"
              className="fill-ink-soft"
              style={{ fontSize: 10 }}
              transform={`rotate(-40 ${nameCx} ${nameCy})`}
            >
              {shortName}
            </text>
          </g>
        );
      })}
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
