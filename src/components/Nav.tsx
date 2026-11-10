import { Coins, HandCoins, LayoutDashboard, LogOut, Settings, Sparkles, Users as UsersIcon } from "lucide-react";
import type { DiscordUser } from "@/types";

export type View = "dashboard" | "citizens" | "donations" | "gains" | "expenses";

interface Props {
  view: View;
  onView: (v: View) => void;
  user: DiscordUser;
  canManage: boolean;
  canSeeCitizens: boolean;
  canSeeDonations: boolean;
  canSeeGains: boolean;
  canSeeExpenses: boolean;
  onOpenAdmin: () => void;
  onLogout: () => void;
}

export function Nav({
  view,
  onView,
  user,
  canManage,
  canSeeCitizens,
  canSeeDonations,
  canSeeGains,
  canSeeExpenses,
  onOpenAdmin,
  onLogout,
}: Props) {
  return (
    <header className="w-full max-w-6xl mx-auto px-4 sm:px-8 pt-6">
      <div className="card flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between p-3 sm:p-4">
        {/* Branding */}
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-sky-500 to-sky-700 grid place-items-center text-ivory shadow-md shadow-sky-500/40">
            <Coins className="h-5 w-5 text-gold-200" />
          </div>
          <div>
            <div className="font-display text-xl text-sky-gradient tracking-wider leading-tight">
              Trésor de Skylis
            </div>
            <div className="text-xs text-ink-soft italic">
              Compta de la Nation du vent
            </div>
          </div>
        </div>

        {/* Nav tabs */}
        <nav className="flex items-center flex-wrap gap-1.5">
          <TabBtn
            active={view === "dashboard"}
            onClick={() => onView("dashboard")}
            icon={<LayoutDashboard className="h-4 w-4" />}
            label="Aperçu"
          />
          {canSeeCitizens && (
            <TabBtn
              active={view === "citizens"}
              onClick={() => onView("citizens")}
              icon={<UsersIcon className="h-4 w-4" />}
              label="Citoyens"
            />
          )}
          {canSeeDonations && (
            <TabBtn
              active={view === "donations"}
              onClick={() => onView("donations")}
              icon={<HandCoins className="h-4 w-4" />}
              label="Dons"
            />
          )}
          {canSeeGains && (
            <TabBtn
              active={view === "gains"}
              onClick={() => onView("gains")}
              icon={<Sparkles className="h-4 w-4" />}
              label="Gains"
            />
          )}
          {canSeeExpenses && (
            <TabBtn
              active={view === "expenses"}
              onClick={() => onView("expenses")}
              icon={<Coins className="h-4 w-4" />}
              label="Dépenses"
            />
          )}
        </nav>

        {/* User + actions */}
        <div className="flex items-center gap-2">
          <div className="hidden sm:inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/70 border border-sky-300/70 text-sm">
            {user.avatar ? (
              <img
                src={`https://cdn.discordapp.com/avatars/${user.discord_id}/${user.avatar}.png?size=32`}
                alt=""
                className="h-6 w-6 rounded-full"
              />
            ) : (
              <span className="h-6 w-6 rounded-full bg-sky-200 grid place-items-center text-sky-700 text-xs font-display">
                {user.username.charAt(0).toUpperCase()}
              </span>
            )}
            <span className="text-sky-800">{user.username}</span>
          </div>

          {canManage && (
            <button
              type="button"
              onClick={onOpenAdmin}
              className="btn-ghost"
              title="Administration"
            >
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">Admin</span>
            </button>
          )}
          <button
            type="button"
            onClick={onLogout}
            className="btn-ghost"
            title="Déconnexion"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
}

function TabBtn({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors no-tap font-display tracking-wider ${
        active
          ? "bg-gradient-to-br from-sky-500 to-sky-700 text-ivory shadow-sm shadow-sky-500/40"
          : "text-sky-800 hover:bg-sky-50/80"
      }`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}
