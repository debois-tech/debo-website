import { HeroSkeleton, LoadingShell, Skeleton, SkeletonLines } from "@/components/Skeleton";
import { Section } from "@/components/ui";

export default function Loading() {
  return (
    <LoadingShell label="Loading programs">
      <HeroSkeleton />
      <Section theme="white">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16">
          <div>
            <Skeleton className="h-7 w-40 rounded-full" />
            <Skeleton className="mt-5 h-14 w-[min(28rem,90%)]" />
            <SkeletonLines lines={3} className="mt-6 max-w-xl" />
            <div className="mt-8 flex flex-wrap gap-3"><Skeleton className="h-12 w-40 rounded-full" /><Skeleton className="h-12 w-44 rounded-full" /></div>
          </div>
          <div className="space-y-4">{[0, 1].map((i) => <div key={i} className="rounded-[var(--radius)] border border-line p-4"><Skeleton className="h-6 w-1/2" /><SkeletonLines lines={2} className="mt-3" /></div>)}</div>
        </div>
      </Section>
    </LoadingShell>
  );
}
