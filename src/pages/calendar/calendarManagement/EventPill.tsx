import type { EventContentArg } from '@fullcalendar/core';

function EventPill(arg: EventContentArg) {
  const { event, timeText } = arg;
  const ex: any = event.extendedProps || {};
  const owner = ex.owner || 'U';
  const ownerColor = ex.ownerColor || 'bg-slate-600';
  const tags: string[] = ex.tags || [];
  const priority = ex.priority || ex.pillClass || 'Low';
  const type = ex.type || 'Task';

  return (
    <div
      className={`
        flex items-center gap-2 rounded-md px-2 py-1 text-xs
        transition-all duration-150 ease-in-out cursor-pointer
        ${priority}
        hover:opacity-90 hover:scale-[1.02] hover:shadow-md
        active:scale-[0.98] active:shadow-sm
      `}
      title={`${event.title}\nPriority: ${priority}\nType: ${type}\nFrom: ${ex.createAt?.slice(
        0,
        10,
      )} → To: ${ex.dueDate?.slice(0, 10)}`}
    >
      <span
        className={`inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white ${ownerColor}`}
        title={`Assigned to: ${ex.assignedTo || owner}`}
      >
        {owner}
      </span>

      {timeText ? <b className="mr-1 hidden sm:inline">{timeText}</b> : null}

      <span className="min-w-0 truncate font-medium">{event.title}</span>

      {tags.length > 0 && (
        <span className="ml-auto flex gap-1">
          {tags.map((colorClass, i) => (
            <span key={i} className={`h-3 w-3 rounded-sm ${colorClass}`} title={type} />
          ))}
        </span>
      )}
    </div>
  );
}

export default EventPill;
