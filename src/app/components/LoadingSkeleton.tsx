/**
 * Reusable loading skeleton for Sadock FC pages.
 * Shows animated pulse placeholders while data loads from Supabase.
 */

export function PageLoadingSkeleton({ title, subtitle }: { title?: string; subtitle?: string }) {
  return (
    <div className="min-h-screen bg-[#0b0b0b] pt-24 pb-16 px-4 sm:px-8 lg:px-16">
      <div className="max-w-7xl mx-auto">
        {/* Header skeleton */}
        <div className="mb-10">
          {subtitle && (
            <p className="text-[#d3b379] font-['Roboto',sans-serif] text-[10px] tracking-[0.3em] uppercase mb-2">
              {subtitle}
            </p>
          )}
          {title && (
            <h1 className="font-['Anton',sans-serif] text-white text-5xl sm:text-7xl">{title}</h1>
          )}
        </div>

        {/* Card grid skeleton */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
          {Array.from({ length: 10 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div className="bg-gradient-to-b from-[#1a1a1a] to-[#111] rounded-2xl overflow-hidden border border-white/[0.04] animate-pulse">
      <div className="aspect-[3/4] bg-[#161616]" />
      <div className="p-4 -mt-10 relative z-10">
        <div className="h-2 w-16 bg-white/[0.04] rounded mb-2" />
        <div className="h-4 w-24 bg-white/[0.06] rounded" />
      </div>
    </div>
  );
}

export function SkeletonRow() {
  return (
    <div className="flex items-center gap-3.5 bg-gradient-to-r from-[#141414] to-[#111] rounded-xl overflow-hidden border border-white/[0.04] pr-4 animate-pulse">
      <div className="w-16 h-16 shrink-0 bg-[#161616]" />
      <div className="flex-1 py-3">
        <div className="h-2 w-16 bg-white/[0.04] rounded mb-2" />
        <div className="h-3 w-28 bg-white/[0.06] rounded" />
      </div>
    </div>
  );
}

export function HomeLoadingSkeleton() {
  return (
    <div className="min-h-screen bg-[#0b0b0b] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-16 h-16 border-2 border-[#d3b379]/20 border-t-[#d3b379] rounded-full animate-spin" />
        <p className="text-white/20 font-['Roboto',sans-serif] text-xs tracking-[0.2em] uppercase">
          Carregando...
        </p>
      </div>
    </div>
  );
}

export function MatchesLoadingSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="bg-gradient-to-r from-[#141414] to-[#111] rounded-xl border border-white/[0.04] h-20 animate-pulse"
        />
      ))}
    </div>
  );
}
