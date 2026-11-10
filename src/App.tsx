import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Coins } from "lucide-react";
import { fetchMe, loginWithDiscord, logoutDiscord } from "@/lib/api";
import type { MeResponse, PermissionKey } from "@/types";
import { Nav, type View } from "@/components/Nav";
import { Dashboard } from "@/components/Dashboard";
import { CitizensPage } from "@/components/CitizensPage";
import { DonationsPage } from "@/components/DonationsPage";
import { GainsPage } from "@/components/GainsPage";
import { ExpensesPage } from "@/components/ExpensesPage";
import { AdminPanel } from "@/components/AdminPanel";

export function App() {
  const [me, setMe] = useState<MeResponse | null>(null);
  const [view, setView] = useState<View>("dashboard");
  const [adminOpen, setAdminOpen] = useState(false);

  const refresh = useCallback(async () => {
    setMe(await fetchMe());
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  if (!me) {
    return <SplashLoading />;
  }

  if (!me.user) {
    return <LoginGate />;
  }

  const can = (p: PermissionKey) =>
    me.isSuper || me.permissions.includes(p);
  const canSeeCitizens = can("citizens.view") || can("citizens.edit");
  const canSeeDonations = can("donations.view") || can("donations.edit");
  const canSeeGains = can("gains.view") || can("gains.edit");
  const canSeeExpenses = can("expenses.view") || can("expenses.edit");

  async function handleLogout() {
    await logoutDiscord();
    await refresh();
    setView("dashboard");
  }

  // Si la vue courante devient invisible après changement de rôle, bascule
  if (view === "citizens" && !canSeeCitizens) setView("dashboard");
  if (view === "donations" && !canSeeDonations) setView("dashboard");
  if (view === "gains" && !canSeeGains) setView("dashboard");
  if (view === "expenses" && !canSeeExpenses) setView("dashboard");

  return (
    <div className="flex-1 flex flex-col pb-16">
      <Nav
        view={view}
        onView={setView}
        user={me.user}
        canManage={me.isSuper || can("manage_users")}
        canSeeCitizens={canSeeCitizens}
        canSeeDonations={canSeeDonations}
        canSeeGains={canSeeGains}
        canSeeExpenses={canSeeExpenses}
        onOpenAdmin={() => setAdminOpen(true)}
        onLogout={handleLogout}
      />

      <main className="flex-1">
        {view === "dashboard" && <Dashboard />}
        {view === "citizens" && canSeeCitizens && (
          <CitizensPage canEdit={can("citizens.edit")} />
        )}
        {view === "donations" && canSeeDonations && (
          <DonationsPage canEdit={can("donations.edit")} />
        )}
        {view === "gains" && canSeeGains && (
          <GainsPage canEdit={can("gains.edit")} />
        )}
        {view === "expenses" && canSeeExpenses && (
          <ExpensesPage canEdit={can("expenses.edit")} />
        )}
      </main>

      <AnimatePresence>
        {adminOpen && (me.isSuper || can("manage_users")) && (
          <AdminPanel
            onClose={async () => {
              setAdminOpen(false);
              await refresh();
            }}
            currentUserId={me.user.discord_id}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function SplashLoading() {
  return (
    <div className="flex-1 grid place-items-center">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-center"
      >
        <div className="h-16 w-16 mx-auto rounded-full bg-gradient-to-br from-sky-500 to-sky-700 grid place-items-center shadow-xl shadow-sky-500/30">
          <Coins className="h-7 w-7 text-gold-200 animate-pulse" />
        </div>
        <div className="mt-3 font-display text-sky-gradient tracking-wider">
          Chargement du Trésor…
        </div>
      </motion.div>
    </div>
  );
}

function LoginGate() {
  const err = new URLSearchParams(window.location.search).get("auth_error");
  return (
    <div className="flex-1 grid place-items-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card max-w-md w-full p-8 text-center"
      >
        <div className="h-16 w-16 mx-auto rounded-full bg-gradient-to-br from-sky-500 to-sky-700 grid place-items-center shadow-xl shadow-sky-500/40">
          <Coins className="h-8 w-8 text-gold-200" />
        </div>
        <h1 className="mt-4 font-display text-3xl text-sky-gradient tracking-wider title-shimmer">
          Trésor de Skylis
        </h1>
        <p className="mt-1 text-ink-soft italic">
          Compta de la Nation du vent
        </p>
        <hr className="section-divider" />
        <p className="text-sm text-ink-soft mb-4">
          Connecte-toi avec ton compte Discord pour accéder au Trésor.
        </p>
        <button
          type="button"
          onClick={loginWithDiscord}
          className="btn-primary w-full justify-center py-2.5"
        >
          Se connecter avec Discord
        </button>
        {err && (
          <div className="mt-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg p-2">
            Erreur de connexion : <code>{err}</code>
          </div>
        )}
      </motion.div>
    </div>
  );
}
