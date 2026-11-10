import { Coins } from "lucide-react";

const nf = new Intl.NumberFormat("fr-FR");

/**
 * Affiche un montant : nombre + petite pièce d'or.
 * Évite les troncatures que donnait l'ancien "1 200 Couronnes".
 */
export function Amount({
  n,
  size = "sm",
  className = "",
}: {
  n: number;
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
}) {
  const sizes = {
    xs: "h-3 w-3",
    sm: "h-3.5 w-3.5",
    md: "h-4 w-4",
    lg: "h-5 w-5",
  };
  return (
    <span
      className={`inline-flex items-baseline gap-1 whitespace-nowrap ${className}`}
    >
      {nf.format(n)}
      <Coins
        className={`${sizes[size]} text-gold-600 translate-y-0.5 shrink-0`}
        aria-label="Couronnes"
      />
    </span>
  );
}
