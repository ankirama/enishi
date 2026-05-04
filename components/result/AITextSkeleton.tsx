export function AITextSkeleton() {
  return (
    <div className="max-w-2xl mx-auto" aria-busy="true" aria-label="Génération du texte poétique en cours">
      <div className="skeleton-line h-[18px] w-full mb-4" />
      <div className="skeleton-line h-[18px] w-[95%] mb-4" />
      <div className="skeleton-line h-[18px] w-[88%] mb-4" />
      <div className="skeleton-line h-[18px] w-[60%]" />
    </div>
  );
}
