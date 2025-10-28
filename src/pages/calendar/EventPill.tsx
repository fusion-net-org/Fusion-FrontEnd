import type { EventContentArg } from '@fullcalendar/core';

function EventPill(arg: EventContentArg) {
  const { event, timeText } = arg;
  const ex: any = event.extendedProps || {};

  const owner = ex.owner || 'U';
  const ownerColor = ex.ownerColor || 'bg-slate-600';
  const tags: string[] = ex.tags || [];
  const priority = ex.priority || '';
  const type = ex.type || '';

  const priorityClass = (() => {
    switch (priority) {
      case 'High':
        return 'bg-red-500 text-white';
      case 'Medium':
        return 'bg-yellow-400 text-black';
      case 'Low':
        return 'bg-green-400 text-black';
      default:
        return 'bg-slate-200 text-gray-900';
    }
  })();

  return (
    <div
      className={`flex items-center gap-2 rounded-md px-2 py-1 text-xs hover:opacity-90 transition-opacity cursor-pointer ${priorityClass}`}
      title={`${event.title}\nPriority: ${priority}\nType: ${type}`}
    >
      {owner ? (
        <span
          className={`inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white ${ownerColor}`}
          title={`Assigned to: ${ex.assignedTo || owner}`}
        >
          {owner}
        </span>
      ) : null}

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
