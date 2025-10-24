import type { EventContentArg } from '@fullcalendar/core';

function EventPill(arg: EventContentArg) {
  const { event, timeText } = arg;
  const ex: any = event.extendedProps || {};
  const pill = ex.pill || 'bg-slate-300';
  const owner = ex.owner || '';
  const ownerColor = ex.ownerColor || 'bg-slate-600';
  const tags: string[] = ex.tags || [];

  return (
    <div className={`flex items-center gap-2 rounded-md px-2 py-1 text-xs text-gray-900 ${pill}`}>
      {/* avatar initials */}
      {owner ? (
        <span
          className={`inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white ${ownerColor}`}
          title={owner}
        >
          {owner}
        </span>
      ) : null}

      {/* giờ (chỉ hiện nếu event có giờ) */}
      {timeText ? <b className="mr-1 hidden sm:inline">{timeText}</b> : null}

      {/* tiêu đề */}
      <span className="min-w-0 truncate">{event.title}</span>

      {/* tag màu vuông */}
      <span className="ml-auto flex gap-1">
        {tags.map((c, i) => (
          <span key={i} className={`h-3 w-3 rounded-sm ${c}`} />
        ))}
      </span>
    </div>
  );
}
