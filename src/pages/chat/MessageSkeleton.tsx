export function MessageSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => {
        const mine = i % 2 === 0;

        return (
          <div key={i} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-xs w-[180px] px-4 py-3 rounded-2xl animate-pulse ${
                mine ? 'bg-purple-300 rounded-br-none' : 'bg-gray-200 rounded-bl-none'
              }`}
            >
              <div className="h-3 bg-white/50 rounded mb-2" />
              <div className="h-3 bg-white/40 rounded w-3/4" />

              <div className="h-2 bg-white/30 rounded w-10 mt-2 ml-auto" />
            </div>
          </div>
        );
      })}
    </div>
  );
}
