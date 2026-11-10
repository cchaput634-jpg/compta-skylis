import { useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import {
  Pencil,
  Plus,
  ShieldCheck,
  Trash2,
  Users as UsersIcon,
  X,
} from "lucide-react";
import {
  createRole,
  deleteRole,
  deleteUser,
  fetchRoles,
  fetchUsers,
  setUserRoles,
  updateRole,
} from "@/lib/api";
import { PERMISSION_GROUPS, PERMISSION_LABELS } from "@/lib/config";
import type { AdminUser, Role } from "@/types";

type Tab = "roles" | "users";

interface Props {
  onClose: () => void;
  currentUserId: string;
}

export function AdminPanel({ onClose, currentUserId }: Props) {
  const [tab, setTab] = useState<Tab>("roles");

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-[60] flex items-center justify-center bg-sky-900/40 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, y: 20, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.95, y: 20, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="card relative w-full max-w-5xl max-h-[90vh] flex flex-col p-0"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Fermer"
          className="absolute top-3 right-3 grid h-8 w-8 place-items-center rounded-full text-sky-700/70 hover:bg-sky-50 z-10"
        >
          <X className="h-4 w-4" />
        </button>

        <header className="px-6 pt-6 pb-3">
          <h2 className="font-display text-2xl text-sky-gradient tracking-wider">
            Administration du Trésor
          </h2>
          <p className="text-sm text-ink-soft mt-1">
            Gère les rôles et les accès des gardien·ne·s du Trésor.
          </p>
        </header>

        <nav className="px-6 border-b border-sky-200 flex gap-1">
          <TabButton active={tab === "roles"} onClick={() => setTab("roles")}>
            <ShieldCheck className="h-4 w-4" /> Rôles
          </TabButton>
          <TabButton active={tab === "users"} onClick={() => setTab("users")}>
            <UsersIcon className="h-4 w-4" /> Utilisateurs
          </TabButton>
        </nav>

        <div className="flex-1 min-h-0 overflow-auto p-6 fancy-scroll">
          {tab === "roles" && <RolesTab />}
          {tab === "users" && <UsersTab currentUserId={currentUserId} />}
        </div>
      </motion.div>
    </motion.div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-2 px-4 py-2.5 text-sm font-display tracking-wider border-b-2 -mb-px transition-colors no-tap ${
        active
          ? "border-sky-600 text-sky-800"
          : "border-transparent text-sky-700/60 hover:text-sky-700"
      }`}
    >
      {children}
    </button>
  );
}

/* ====================== RÔLES ====================== */

function RolesTab() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Role | "new" | null>(null);

  async function refresh() {
    setLoading(true);
    setRoles(await fetchRoles());
    setLoading(false);
  }
  useEffect(() => {
    void refresh();
  }, []);

  async function handleDelete(role: Role) {
    if (role.isSuper) return;
    if (!confirm(`Supprimer le rôle « ${role.name} » ?`)) return;
    await deleteRole(role.id);
    await refresh();
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-ink-soft">
          Un rôle regroupe des permissions. Attribue-le dans l'onglet
          Utilisateurs.
        </p>
        <button
          type="button"
          onClick={() => setEditing("new")}
          className="btn-primary"
        >
          <Plus className="h-4 w-4" />
          <span>Nouveau rôle</span>
        </button>
      </div>

      {loading ? (
        <div className="text-center text-ink-soft py-6">Chargement…</div>
      ) : (
        <div className="space-y-2">
          {roles.map((r) => (
            <div
              key={r.id}
              className="card flex flex-col sm:flex-row sm:items-center gap-3 p-3"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-display text-lg text-sky-gradient">
                    {r.name}
                  </span>
                  {r.isSuper && (
                    <span className="badge badge-super">
                      <ShieldCheck className="h-3 w-3" /> Super Admin
                    </span>
                  )}
                </div>
                <div className="mt-1.5 flex flex-wrap gap-1">
                  {r.isSuper ? (
                    <span className="badge-gold badge">Tous les droits</span>
                  ) : r.permissions.length === 0 ? (
                    <span className="text-xs italic text-ink-soft">
                      Aucune permission
                    </span>
                  ) : (
                    r.permissions.map((p) => (
                      <span key={p} className="badge">
                        {PERMISSION_LABELS[p] ?? p}
                      </span>
                    ))
                  )}
                </div>
              </div>
              {!r.isSuper && (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setEditing(r)}
                    className="btn-ghost"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    <span>Modifier</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(r)}
                    className="btn-danger"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {editing && (
        <RoleEditor
          role={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={async () => {
            setEditing(null);
            await refresh();
          }}
        />
      )}
    </div>
  );
}

function RoleEditor({
  role,
  onClose,
  onSaved,
}: {
  role: Role | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(role?.name ?? "");
  const [perms, setPerms] = useState<Set<string>>(
    new Set(role?.permissions ?? []),
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggle(p: string) {
    setPerms((prev) => {
      const next = new Set(prev);
      if (next.has(p)) next.delete(p);
      else next.add(p);
      return next;
    });
  }

  async function handleSave() {
    setError(null);
    if (!name.trim()) {
      setError("Nom requis.");
      return;
    }
    setSaving(true);
    if (role) {
      await updateRole(role.id, { name: name.trim(), permissions: [...perms] });
    } else {
      const id = await createRole(name.trim(), [...perms]);
      if (!id) {
        setError("Nom déjà pris ou erreur.");
        setSaving(false);
        return;
      }
    }
    onSaved();
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[70] flex items-center justify-center bg-sky-900/40 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, y: 20, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        onClick={(e) => e.stopPropagation()}
        className="card relative w-full max-w-lg p-6"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3 right-3 grid h-8 w-8 place-items-center rounded-full text-sky-700/70 hover:bg-sky-50"
        >
          <X className="h-4 w-4" />
        </button>
        <h3 className="font-display text-xl text-sky-gradient tracking-wider">
          {role ? "Modifier le rôle" : "Nouveau rôle"}
        </h3>
        <hr className="section-divider" />
        <div className="space-y-3">
          <div>
            <label className="label">Nom du rôle</label>
            <input
              className="input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Comptable, Observateur, Conseil…"
              autoFocus
            />
          </div>
          <div>
            <label className="label">Permissions</label>
            <div className="space-y-3">
              {PERMISSION_GROUPS.map((group) => (
                <div key={group.title}>
                  <div className="text-xs font-display uppercase tracking-wider text-sky-800 mb-1.5">
                    {group.title}
                  </div>
                  <div className="space-y-1">
                    {group.perms.map((p) => (
                      <label
                        key={p.key}
                        className="flex items-center gap-2 cursor-pointer text-sm"
                      >
                        <input
                          type="checkbox"
                          checked={perms.has(p.key)}
                          onChange={() => toggle(p.key)}
                          className="h-4 w-4 accent-sky-600"
                        />
                        <span>{PERMISSION_LABELS[p.key] ?? p.key}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs text-ink-soft mt-2 italic">
              « Voir » autorise la lecture ; « Modifier » autorise lecture +
              ajout/édition/suppression. Ne coche rien → aucun accès à la
              section.
            </p>
          </div>
          {error && (
            <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg p-2">
              {error}
            </div>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="btn-ghost">
              Annuler
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="btn-primary"
            >
              {saving ? "…" : "Enregistrer"}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ====================== UTILISATEURS ====================== */

function UsersTab({ currentUserId }: { currentUserId: string }) {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);

  async function refresh() {
    setLoading(true);
    const [u, r] = await Promise.all([fetchUsers(), fetchRoles()]);
    setUsers(u);
    setRoles(r);
    setLoading(false);
  }
  useEffect(() => {
    void refresh();
  }, []);

  async function handleToggle(user: AdminUser, roleId: string) {
    const next = new Set(user.roles);
    if (next.has(roleId)) next.delete(roleId);
    else next.add(roleId);
    await setUserRoles(user.discord_id, [...next]);
    await refresh();
  }

  async function handleDeleteUser(user: AdminUser) {
    if (user.discord_id === currentUserId) return;
    if (!confirm(`Retirer « ${user.username} » du Trésor ?`)) return;
    await deleteUser(user.discord_id);
    await refresh();
  }

  const rolesById = useMemo(
    () => Object.fromEntries(roles.map((r) => [r.id, r])),
    [roles],
  );

  return (
    <div className="space-y-4">
      <p className="text-sm text-ink-soft">
        Attribue un ou plusieurs rôles à chaque utilisateur. Le premier
        connecté est automatiquement Super Admin.
      </p>

      {loading ? (
        <div className="text-center text-ink-soft py-6">Chargement…</div>
      ) : users.length === 0 ? (
        <div className="text-center text-ink-soft py-6 italic">
          Personne ne s'est encore connecté.
        </div>
      ) : (
        <div className="space-y-2">
          {users.map((u) => {
            const isSuper = u.roles.some((rid) => rolesById[rid]?.isSuper);
            const isMe = u.discord_id === currentUserId;
            return (
              <div key={u.discord_id} className="card p-3">
                <div className="flex items-center gap-3 flex-wrap">
                  {u.avatar ? (
                    <img
                      src={`https://cdn.discordapp.com/avatars/${u.discord_id}/${u.avatar}.png?size=48`}
                      alt=""
                      className="h-10 w-10 rounded-full"
                    />
                  ) : (
                    <div className="h-10 w-10 rounded-full bg-sky-200 grid place-items-center text-sky-700 font-display">
                      {u.username.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium">{u.username}</span>
                      {isMe && <span className="badge">Moi</span>}
                      {isSuper && (
                        <span className="badge badge-super">
                          <ShieldCheck className="h-3 w-3" /> Super Admin
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-ink-soft">
                      Discord: {u.discord_id}
                    </div>
                  </div>
                  {!isMe && (
                    <button
                      type="button"
                      onClick={() => handleDeleteUser(u)}
                      className="btn-danger"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {roles.map((r) => {
                    const checked = u.roles.includes(r.id);
                    const lockSuper =
                      r.isSuper && isMe && checked; // ne peut pas retirer sa super admin
                    return (
                      <button
                        key={r.id}
                        type="button"
                        disabled={lockSuper}
                        onClick={() => handleToggle(u, r.id)}
                        className={`text-xs px-2.5 py-1 rounded-full border transition-colors no-tap ${
                          checked
                            ? r.isSuper
                              ? "badge-super border-gold-300 shadow-sm"
                              : "bg-sky-600 text-white border-sky-700"
                            : "bg-white border-sky-200 text-ink-soft hover:bg-sky-50"
                        } ${lockSuper ? "opacity-70 cursor-not-allowed" : ""}`}
                        title={lockSuper ? "Impossible de retirer ton propre Super Admin" : undefined}
                      >
                        {r.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
