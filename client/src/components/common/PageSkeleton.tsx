export function PageSkeleton() {
  return (
    <div className="flex flex-col gap-4 animate-pulse">
      <div className="h-32 rounded-2xl bg-neutral-200" />
      <div className="grid grid-cols-2 gap-3">
        <div className="h-24 rounded-xl bg-neutral-200" />
        <div className="h-24 rounded-xl bg-neutral-200" />
      </div>
      <div className="h-16 rounded-xl bg-neutral-200" />
      <div className="h-24 rounded-xl bg-neutral-200" />
      <div className="h-24 rounded-xl bg-neutral-200" />
    </div>
  );
}
