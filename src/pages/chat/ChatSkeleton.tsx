export const ChatListSkeleton = ({ count = 6 }: { count?: number }) => {
  return (
    <div className="space-y-3 p-2">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 animate-pulse">
          <div className="h-10 w-10 rounded-full bg-gray-300" />

          <div className="flex-1 space-y-2">
            <div className="h-3 w-1/2 rounded bg-gray-300" />
            <div className="h-3 w-3/4 rounded bg-gray-200" />
          </div>
        </div>
      ))}
    </div>
  );
};
