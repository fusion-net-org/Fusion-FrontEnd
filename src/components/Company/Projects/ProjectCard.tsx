import React from 'react';
import '@/layouts/Company/css/project/projects.css';
import type { Project } from '@/interfaces/Project/project';

function statusClasses(status: Project['status']) {
  switch (status) {
    case 'To do':       return { card: 'todo', dot: 'todo' };
    case 'Done':        return { card: 'done', dot: 'done' };
    case 'In review':   return { card: 'inreview', dot: 'inreview' };
    case 'In progress': return { card: 'inprogress', dot: 'inprogress' };
  }
}

export default function ProjectCard({ item }: { item: Project }) {
  const pct = item.progress.total > 0
    ? Math.min(100, Math.round((item.progress.done / item.progress.total) * 100))
    : 0;

  const sc = statusClasses(item.status);

  return (
    <article className={`card ${sc.card}`}>
      <div className="head">
        <div className="code">{item.code}</div>
        <div className="menu" aria-label="More">⋯</div>
      </div>

      <div className="status">
        <span className={`dot ${sc.dot}`} />
        {item.status}
      </div>

      <h3 className="name">Projects Name</h3>

      <div className="badges">
        <span className="pill">{item.hireLabel}</span>
        {item.convertedFrom && (
          <span className="pill pillGray">🔗 Converted from {item.convertedFrom}</span>
        )}
      </div>

      <p className="desc">{item.description}</p>

      <div className="progressRow">
        <span className="progressLabel">Progress</span>
        <span className="progressValue">
          {item.progress.done}/{item.progress.total} ({pct}%)
        </span>
      </div>
      <div className="progressBar">
        <div
          className="progressFill"
          style={{ width: `${pct}%`, background: item.overdueTasks ? 'var(--rose-500)' : undefined }}
        />
      </div>
      {!!item.overdueTasks && (
        <div className="warn">⚠ {item.overdueTasks} {item.overdueTasks > 1 ? 'tasks' : 'task'} overdue</div>
      )}

      <div className="meta">
        <i>📅 {item.startDate} — {item.endDate}</i>
        <i>⟳ Update {item.lastUpdatedAgo}</i>
        <i>👥 {item.membersCount} members</i>
      </div>

      <div className="ownerRow">
        <span className="avatar" />
        <span className="ownerName">{item.owner.name}</span>
      </div>

      <div className="tags">
        <span className="tag tagBoard">Board</span>
        <span className="tag tagTicket">Ticket</span>
        <span className="tag tagRequest">Request</span>
        <span className="tag tagMembers">Members</span>
      </div>
    </article>
  );
}
