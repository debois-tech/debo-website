import { HeroSkeleton, LoadingShell, Skeleton } from "@/components/Skeleton";
import { Section } from "@/components/ui";

export default function Loading() {
  return (
    <LoadingShell label="Loading the contact form">
      <HeroSkeleton />
      <Section theme="white">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:gap-16">
          <div className="space-y-5">
            <Skeleton className="h-12" />
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2"><Skeleton className="h-12" /><Skeleton className="h-12" /></div>
            <Skeleton className="h-36" />
            <Skeleton className="h-12 w-44 rounded-full" />
          </div>
          <div className="space-y-4"><Skeleton className="h-6 w-1/2" /><Skeleton className="h-4" /><Skeleton className="h-4 w-4/5" /><Skeleton className="h-6 w-2/5" /><Skeleton className="h-4 w-3/5" /></div>
        </div>
      </Section>
    </LoadingShell>
  );
}
