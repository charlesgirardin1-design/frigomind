// Carte "squelette" affichée pendant la brève fenêtre de chargement des
// données utilisateur (favoris/historique) juste après la connexion, pour
// éviter un flash de l'état vide avant l'arrivée des vraies données.
// Reprend grossièrement la forme d'une RecipeCard : bloc "emoji/image",
// puis 2-3 lignes de texte de largeurs variées, toutes animées avec
// l'utilitaire Tailwind `animate-pulse` (pas de keyframes custom nécessaires).
export default function SkeletonCard() {
  return (
    <div className="card p-4 w-full" aria-hidden="true">
      <div className="flex items-start justify-between gap-2">
        <div className="w-9 h-9 rounded-lg bg-neutral-200 animate-pulse" />
        <div className="w-10 h-5 rounded-full bg-neutral-200 animate-pulse" />
      </div>

      <div className="mt-3 h-4 w-3/4 rounded bg-neutral-200 animate-pulse" />

      <div className="mt-3 flex flex-wrap gap-1.5">
        <div className="h-5 w-16 rounded-full bg-neutral-200 animate-pulse" />
        <div className="h-5 w-12 rounded-full bg-neutral-200 animate-pulse" />
        <div className="h-5 w-14 rounded-full bg-neutral-200 animate-pulse" />
      </div>

      <div className="mt-3 h-3 w-1/2 rounded bg-neutral-200 animate-pulse" />
    </div>
  )
}
