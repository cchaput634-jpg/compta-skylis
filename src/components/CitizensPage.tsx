import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Pencil, Plus, Trash2, X } from "lucide-react";
import {
  createCitizen,
  deleteCitizen,
  fetchCitizens,
  fetchRoleOptions,
  fetchUserOptions,
  updateCitizen,
  type RoleOption,
  type UserOption,
} from "@/lib/api";
import type { Citizen } from "@/types";

interface Props {
  canEdit: boolean;
}

export function CitizensPage({ canEdit }: Props) {
  const [citizens, setCitizens] = useState<Citizen[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Citizen | "new" | null>(null);
  const [query, setQuery] = useState("");

  async function refresh() {
    setLoading(true);
    setCitizens(await fetchCitizens());
    setLoading(false);
  }
  useEffect(() => {
    void refresh();
  }, []);

  async function handleDelete(c: Citizen) {
    if (!confirm(`Retirer « ${c.name} » du registre des citoyens ?`)) return;
    await deleteCitizen(c.id);
    await refresh();
  }

  const filtered = query.trim()
    ? citizens.filter((c) => {
        const h = `${c.name} ${c.title ?? ""} ${c.discord_id ?? ""}`.toLowerCase();
        return h.includes(query.trim().toLowerCase());
      })
    : citizens;

  return (
    <section className="w-full max-w-6xl mx-auto px-4 sm:px-8 pt-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl text-sky-gradient tracking-wider title-shimmer">
            Registre des Citoyens
          </h1>
          <p className="text-ink-soft italic mt-1">
            Les âmes inscrites au Trésor.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher…"
            className="input max-w-[220px]"
          />
          {canEdit && (
            <button
              type="button"
              onClick={() => setEditing("new")}
              className="btn-gold"
            >
              <Plus className="h-4 w-4" />
              <span>Nouveau citoyen</span>
            </button>
          )}
        </div>
      </div>
      <hr className="section-divider" />

      <div className="card overflow-hidden">
        <div className="overflow-x-auto fancy-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th>Nom</th>
                <th>Titre</th>
                <th>Discord</th>
                <th>Notes</th>
                {canEdit && <th className="w-32 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={canEdit ? 5 : 4} className="text-center text-ink-soft py-6">
                    Chargement…
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={canEdit ? 5 : 4} className="text-center text-ink-soft py-6 italic">
                    Aucun citoyen inscrit pour l'instant.
                  </td>
                </tr>
              ) : (
                filtered.map((c) => (
                  <tr key={c.id}>
                    <td className="font-medium">{c.name}</td>
                    <td>
                      {c.title ? (
                        <span className="badge-gold badge">{c.title}</span>
                      ) : (
                        <span className="text-ink-soft/60">—</span>
                      )}
                    </td>
                    <td className="text-sm">
                      {c.discord_id ? (
                        <code className="text-sky-700">{c.discord_id}</code>
                      ) : (
                        <span className="text-ink-soft/60">—</span>
                      )}
                    </td>
                    <td className="text-sm text-ink-soft max-w-sm truncate">
                      {c.notes || "—"}
                    </td>
                    {canEdit && (
                      <td className="text-right">
                        <div className="inline-flex gap-1.5">
                          <button
                            type="button"
                            onClick={() => setEditing(c)}
                            className="btn-ghost"
                            aria-label="Modifier"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(c)}
                            className="btn-danger"
                            aria-label="Supprimer"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {editing && (
          <CitizenFormModal
            citizen={editing === "new" ? null : editing}
            onClose={() => setEditing(null)}
            onSaved={async () => {
              setEditing(null);
              await refresh();
            }}
          />
        )}
      </AnimatePresence>
    </section>
  );
}

function CitizenFormModal({
  citizen,
  onClose,
  onSaved,
}: {
  citizen: Citizen | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(citizen?.name ?? "");
  // Le "Titre" stocke le NOM du rôle choisi (pas son id), pour rester
  // lisible si le rôle est renommé/supprimé plus tard.
  const [title, setTitle] = useState(citizen?.title ?? "");
  const [discordId, setDiscordId] = useState(citizen?.discord_id ?? "");
  const [notes, setNotes] = useState(citizen?.notes ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [users, setUsers] = useState<UserOption[]>([]);
  const [roles, setRoles] = useState<RoleOption[]>([]);
  const [optionsLoading, setOptionsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [u, r] = await Promise.all([fetchUserOptions(), fetchRoleOptions()]);
      if (!cancelled) {
        setUsers(u);
        setRoles(r);
        setOptionsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSave() {
    if (!name.trim()) {
      setError("Le nom est requis.");
      return;
    }
    setSaving(true);
    setError(null);
    const payload = {
      name: name.trim(),
      title: title.trim() || undefined,
      discord_id: discordId.trim() || undefined,
      notes: notes.trim() || undefined,
    };
    if (citizen) {
      await updateCitizen(citizen.id, payload);
    } else {
      const res = await createCitizen(payload);
      if ("error" in res) {
        setError(res.error);
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
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-[60] flex items-center justify-center bg-sky-900/40 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, y: 20, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.95, y: 20, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="card relative w-full max-w-lg p-6"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Fermer"
          className="absolute top-3 right-3 grid h-8 w-8 place-items-center rounded-full text-sky-700/70 hover:bg-sky-50"
        >
          <X className="h-4 w-4" />
        </button>
        <h2 className="font-display text-2xl text-sky-gradient tracking-wider">
          {citizen ? "Modifier un citoyen" : "Nouveau citoyen"}
        </h2>
        <hr className="section-divider" />
        <div className="space-y-3">
          <div>
            <label className="label">Nom *</label>
            <input
              className="input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </div>
          <div>
            <label className="label">Titre / Rang</label>
            <select
              className="select"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={optionsLoading}
            >
              <option value="">— Aucun —</option>
              {/* Garde l'ancienne valeur si elle ne matche plus un rôle */}
              {title && !roles.some((r) => r.name === title) && (
                <option value={title}>{title} (ancien)</option>
              )}
              {roles.map((r) => (
                <option key={r.id} value={r.name}>
                  {r.name}
                </option>
              ))}
            </select>
            <p className="text-xs text-ink-soft mt-1 italic">
              Les titres viennent des rôles créés dans l'administration.
            </p>
          </div>
          <div>
            <label className="label">Compte Discord lié</label>
            <select
              className="select"
              value={discordId}
              onChange={(e) => setDiscordId(e.target.value)}
              disabled={optionsLoading}
            >
              <option value="">— Aucun —</option>
              {/* Garde l'ancienne valeur si elle ne matche plus un user connu */}
              {discordId &&
                !users.some((u) => u.discord_id === discordId) && (
                  <option value={discordId}>
                    {discordId} (non connecté)
                  </option>
                )}
              {users.map((u) => (
                <option key={u.discord_id} value={u.discord_id}>
                  {u.username}
                </option>
              ))}
            </select>
            <p className="text-xs text-ink-soft mt-1 italic">
              Liste des personnes qui se sont déjà connectées au site.
            </p>
          </div>
          <div>
            <label className="label">Notes</label>
            <textarea
              className="textarea"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
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
              {saving ? "Enregistrement…" : "Enregistrer"}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
