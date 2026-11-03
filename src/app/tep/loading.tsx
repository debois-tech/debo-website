import { HeroSkeleton, LoadingShell, Skeleton } from "@/components/Skeleton";
import { Section } from "@/components/ui";

export default function Loading() {
  return (
    <LoadingShell label="Loading the Technology Excellence Program">
      <HeroSkeleton />
      <Section theme="white">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2"><Skeleton className="h-28" /><Skeleton className="h-28" /></div>
        <div className="mt-10 flex flex-col gap-2 lg:flex-row lg:items-end">
          {[0, 1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="w-full lg:flex-1" style={{ height: `${9.5 + i * 2.6}rem` }} />)}
        </div>
      </Section>
    </LoadingShell>
  );
}
