/**
 * Config front — Trésor de Skylis.
 *
 * CURRENCY : unité monétaire affichée (ex: "Souffles", "Zéphyrs"...).
 * Change-la ici et toute l'application se met à jour.
 */

export const CURRENCY = "Souffles";
export const CURRENCY_SHORT = "⚜"; // symbole doré compact

/* Libellé des permissions, pour l'admin et les tooltips. */
export const PERMISSION_LABELS: Record<string, string> = {
  manage_users: "Gérer utilisateurs & rôles",
  "citizens.view": "Voir les citoyens",
  "citizens.edit": "Modifier les citoyens",
  "donations.view": "Voir les dons",
  "donations.edit": "Enregistrer / modifier les dons",
  "expenses.view": "Voir les dépenses",
  "expenses.edit": "Enregistrer / modifier les dépenses",
};

/* Groupes affichés dans l'éditeur de rôle. */
export const PERMISSION_GROUPS: Array<{
  title: string;
  perms: Array<{ key: string; view?: boolean }>;
}> = [
  {
    title: "Citoyens",
    perms: [{ key: "citizens.view" }, { key: "citizens.edit" }],
  },
  {
    title: "Dons",
    perms: [{ key: "donations.view" }, { key: "donations.edit" }],
  },
  {
    title: "Dépenses",
    perms: [{ key: "expenses.view" }, { key: "expenses.edit" }],
  },
  {
    title: "Administration",
    perms: [{ key: "manage_users" }],
  },
];
