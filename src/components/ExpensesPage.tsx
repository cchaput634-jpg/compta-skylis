import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Pencil, Plus, Trash2, X } from "lucide-react";
import {
  createExpense,
  deleteExpense,
  fetchExpenses,
  updateExpense,
} from "@/lib/api";
import { dateInputValue, formatDate, parseDateInput } from "@/lib/format";
import type { Expense } from "@/types";
import { Amount } from "./Amount";

interface Props {
  canEdit: boolean;
}

export function ExpensesPage({ canEdit }: Props) {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Expense | "new" | null>(null);

  async function refresh() {
    setLoading(true);
    setExpenses(await fetchExpenses());
    setLoading(false);
  }
  useEffect(() => {
    void refresh();
  }, []);

  const total = useMemo(
    () => expenses.reduce((s, e) => s + e.amount, 0),
    [expenses],
  );

  async function handleDelete(e: Expense) {
    if (!confirm(`Supprimer la dépense « ${e.label} » ?`)) return;
    await deleteExpense(e.id);
    await refresh();
  }

  return (
    <section className="w-full max-w-6xl mx-auto px-4 sm:px-8 pt-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl text-sky-gradient tracking-wider title-shimmer">
            Dépenses de la Nation
          </h1>
          <p className="text-ink-soft italic mt-1">
            Les sorties d'or du Trésor de Skylis.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="card px-3 py-2 text-sm">
            <span className="text-ink-soft mr-2">Total :</span>
            <span className="font-display text-sky-gradient text-lg">
              <Amount n={total} size="md" />
            </span>
          </div>
          {canEdit && (
            <button
              type="button"
              onClick={() => setEditing("new")}
              className="btn-primary"
            >
              <Plus className="h-4 w-4" />
              <span>Nouvelle dépense</span>
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
                <th>Intitulé</th>
                <th>Catégorie</th>
                <th className="text-right">Montant</th>
                <th>Description</th>
                {canEdit && <th className="w-32 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={canEdit ? 6 : 5}
                    className="text-center text-ink-soft py-6"
                  >
                    Chargement…
                  </td>
                </tr>
              ) : expenses.length === 0 ? (
                <tr>
                  <td
                    colSpan={canEdit ? 6 : 5}
                    className="text-center text-ink-soft py-6 italic"
                  >
                    Aucune dépense enregistrée.
                  </td>
                </tr>
              ) : (
                expenses.map((e) => (
                  <tr key={e.id}>
                    <td className="whitespace-nowrap text-sm">
                      {formatDate(e.occurred_at)}
                    </td>
                    <td className="font-medium">{e.label}</td>
                    <td>
                      {e.category ? (
                        <span className="badge">{e.category}</span>
                      ) : (
                        <span className="text-ink-soft/60">—</span>
                      )}
                    </td>
                    <td className="text-right whitespace-nowrap">
                      <span className="font-display text-sky-gradient text-lg">
                        <Amount n={e.amount} size="sm" />
                      </span>
                    </td>
                    <td className="text-sm text-ink-soft max-w-sm truncate">
                      {e.description || "—"}
                    </td>
                    {canEdit && (
                      <td className="text-right">
                        <div className="inline-flex gap-1.5">
                          <button
                            type="button"
                            onClick={() => setEditing(e)}
                            className="btn-ghost"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(e)}
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
          <ExpenseFormModal
            expense={editing === "new" ? null : editing}
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

function ExpenseFormModal({
  expense,
  onClose,
  onSaved,
}: {
  expense: Expense | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [label, setLabel] = useState(expense?.label ?? "");
  const [category, setCategory] = useState(expense?.category ?? "");
  const [amount, setAmount] = useState(expense ? String(expense.amount) : "");
  const [occurredDate, setOccurredDate] = useState(
    dateInputValue(expense?.occurred_at ?? Date.now()),
  );
  const [description, setDescription] = useState(expense?.description ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    setError(null);
    if (!label.trim()) {
      setError("L'intitulé est requis.");
      return;
    }
    const amt = parseInt(amount, 10);
    if (!Number.isFinite(amt) || amt <= 0) {
      setError("Montant invalide.");
      return;
    }
    const occurredAt = parseDateInput(occurredDate) ?? Date.now();
    const payload = {
      label: label.trim(),
      category: category.trim() || undefined,
      amount: amt,
      occurred_at: occurredAt,
      description: description.trim() || undefined,
    };
    setSaving(true);
    if (expense) {
      await updateExpense(expense.id, payload);
    } else {
      const res = await createExpense(payload);
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
          {expense ? "Modifier la dépense" : "Nouvelle dépense"}
        </h2>
        <hr className="section-divider" />
        <div className="space-y-3">
          <div>
            <label className="label">Intitulé *</label>
            <input
              className="input"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Ex: Festivités du solstice, Réfection du temple…"
              autoFocus
            />
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
            <label className="label">Catégorie</label>
            <input
              className="input"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="Festivités, Fournitures, Diplomatie…"
            />
          </div>
          <div>
            <label className="label">Description</label>
            <textarea
              className="textarea"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
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
