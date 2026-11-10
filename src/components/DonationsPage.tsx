import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { HandCoins, Pencil, Plus, Trash2, X } from "lucide-react";
import {
  createDonation,
  deleteDonation,
  fetchCitizens,
  fetchDonations,
  updateDonation,
} from "@/lib/api";
import { formatAmount, formatDate, dateInputValue, parseDateInput } from "@/lib/format";
import type { Citizen, Donation } from "@/types";
import { CitizenPicker, type PickerValue } from "./CitizenPicker";

interface Props {
  canEdit: boolean;
}

export function DonationsPage({ canEdit }: Props) {
  const [donations, setDonations] = useState<Donation[]>([]);
  const [citizens, setCitizens] = useState<Citizen[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Donation | "new" | null>(null);

  async function refresh() {
    setLoading(true);
    const [d, c] = await Promise.all([fetchDonations(), fetchCitizens()]);
    setDonations(d);
    setCitizens(c);
    setLoading(false);
  }
  useEffect(() => {
    void refresh();
  }, []);

  const total = useMemo(
    () => donations.reduce((s, d) => s + d.amount, 0),
    [donations],
  );

  async function handleDelete(d: Donation) {
    if (!confirm(`Supprimer ce don de ${formatAmount(d.amount)} ?`)) return;
    await deleteDonation(d.id);
    await refresh();
  }

  return (
    <section className="w-full max-w-6xl mx-auto px-4 sm:px-8 pt-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl text-sky-gradient tracking-wider title-shimmer">
            Dons au Trésor
          </h1>
          <p className="text-ink-soft italic mt-1">
            Chaque souffle versé au service de la nation.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="card-gold px-3 py-2 text-sm">
            <span className="text-ink-soft mr-2">Total :</span>
            <span className="font-display text-gold-gradient text-lg">
              {formatAmount(total)}
            </span>
          </div>
          {canEdit && (
            <button
              type="button"
              onClick={() => setEditing("new")}
              className="btn-gold"
            >
              <Plus className="h-4 w-4" />
              <span>Nouveau don</span>
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
                <th>Date</th>
                <th>Donateur</th>
                <th className="text-right">Montant</th>
                <th>Description</th>
                {canEdit && <th className="w-32 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={canEdit ? 5 : 4}
                    className="text-center text-ink-soft py-6"
                  >
                    Chargement…
                  </td>
                </tr>
              ) : donations.length === 0 ? (
                <tr>
                  <td
                    colSpan={canEdit ? 5 : 4}
                    className="text-center text-ink-soft py-6 italic"
                  >
                    Aucun don enregistré.
                  </td>
                </tr>
              ) : (
                donations.map((d) => (
                  <tr key={d.id}>
                    <td className="whitespace-nowrap text-sm">
                      {formatDate(d.occurred_at)}
                    </td>
                    <td>
                      {d.citizen_id && d.citizen_name ? (
                        <div className="flex flex-col">
                          <span className="font-medium">{d.citizen_name}</span>
                          {d.citizen_title && (
                            <span className="text-xs text-ink-soft">
                              {d.citizen_title}
                            </span>
                          )}
                        </div>
                      ) : d.citizen_label ? (
                        <span className="italic text-ink-soft">
                          {d.citizen_label}
                        </span>
                      ) : (
                        <span className="text-ink-soft/60">—</span>
                      )}
                    </td>
                    <td className="text-right font-display text-gold-gradient text-lg whitespace-nowrap">
                      <span className="inline-flex items-center gap-1">
                        <HandCoins className="h-3.5 w-3.5 text-gold-700" />
                        {formatAmount(d.amount)}
                      </span>
                    </td>
                    <td className="text-sm text-ink-soft max-w-sm truncate">
                      {d.description || "—"}
                    </td>
                    {canEdit && (
                      <td className="text-right">
                        <div className="inline-flex gap-1.5">
                          <button
                            type="button"
                            onClick={() => setEditing(d)}
                            className="btn-ghost"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(d)}
                            className="btn-danger"
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
          <DonationFormModal
            donation={editing === "new" ? null : editing}
            citizens={citizens}
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

function DonationFormModal({
  donation,
  citizens,
  onClose,
  onSaved,
}: {
  donation: Donation | null;
  citizens: Citizen[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const initialPicker: PickerValue = donation
    ? donation.citizen_id
      ? { kind: "citizen", citizenId: donation.citizen_id }
      : donation.citizen_label
        ? { kind: "label", label: donation.citizen_label }
        : { kind: "none" }
    : { kind: "none" };

  const [picker, setPicker] = useState<PickerValue>(initialPicker);
  const [amount, setAmount] = useState(donation ? String(donation.amount) : "");
  const [occurredDate, setOccurredDate] = useState(
    dateInputValue(donation?.occurred_at ?? Date.now()),
  );
  const [description, setDescription] = useState(donation?.description ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    setError(null);
    const amt = parseInt(amount, 10);
    if (!Number.isFinite(amt) || amt <= 0) {
      setError("Montant invalide.");
      return;
    }
    if (picker.kind === "none") {
      setError("Choisis un donateur dans la liste ou saisis un nom libre.");
      return;
    }
    const occurredAt = parseDateInput(occurredDate) ?? Date.now();
    const payload = {
      citizen_id: picker.kind === "citizen" ? picker.citizenId : undefined,
      citizen_label: picker.kind === "label" ? picker.label : undefined,
      amount: amt,
      occurred_at: occurredAt,
      description: description.trim() || undefined,
    };
    setSaving(true);
    if (donation) {
      await updateDonation(donation.id, payload);
    } else {
      const res = await createDonation(payload);
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
          {donation ? "Modifier le don" : "Nouveau don"}
        </h2>
        <hr className="section-divider" />
        <div className="space-y-3">
          <div>
            <label className="label">Donateur</label>
            <CitizenPicker
              citizens={citizens}
              value={picker}
              onChange={setPicker}
              placeholder="Choisir un citoyen ou saisir un donateur libre…"
            />
            <p className="text-xs text-ink-soft mt-1 italic">
              Tape pour filtrer. Un nom qui n'est pas un citoyen est accepté
              comme donateur libre (anonyme, nation voisine…).
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Montant *</label>
              <input
                className="input"
                type="number"
                min={1}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
            <div>
              <label className="label">Date</label>
              <input
                className="input"
                type="date"
                value={occurredDate}
                onChange={(e) => setOccurredDate(e.target.value)}
              />
            </div>
          </div>
          <div>
            <label className="label">Description</label>
            <textarea
              className="textarea"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Motif, contexte, détails…"
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
