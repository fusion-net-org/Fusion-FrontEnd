import React, { useEffect, useMemo, useState } from 'react';
import '@/layouts/Company/css/project/projects.css';
import ProjectCard from './ProjectCard';
import type { Project } from '@/interfaces/Project/project';

function useColumns() {
  const [cols, setCols] = useState(3);
  useEffect(() => {
    const handle = () => {
      const w = window.innerWidth;
      if (w < 680) setCols(1);
      else if (w < 1024) setCols(2);
      else setCols(3);
    };
    handle();
    window.addEventListener('resize', handle);
    return () => window.removeEventListener('resize', handle);
  }, []);
  return cols;
}

export default function ProjectsGrid({ items, title = 'Projects' }: { items: Project[]; title?: string }) {
  const cols = useColumns();
  const rowsPerPage = 2;           // <= yêu cầu: tối đa 2 dòng/thẻ mỗi trang
  const pageSize = cols * rowsPerPage;

  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));

  useEffect(() => { setPage(p => Math.min(p, totalPages)); }, [totalPages]);

  const current = useMemo(() => {
    const start = (page - 1) * pageSize;
    return items.slice(start, start + pageSize);
  }, [items, page, pageSize]);

  return (
    <div className="page">
      <div className="header">
        <div>
          <div className="title">{title}</div>
          <div className="subtle">Projects List</div>
        </div>
        <div className="actions">
          <button className="btn">⚙️ Explore templates</button>
          <button className="btn btnPrimary">＋ Create New</button>
        </div>
      </div>

      <div className="toolbar">
        <div className="subtle"></div>
        <button className="btn" title="Filter">⛭</button>
      </div>

      <section className="grid">
        {current.map(p => <ProjectCard key={p.id} item={p} />)}
      </section>

      {items.length > pageSize && (
        <nav className="pagination" aria-label="Pagination">
          <button className="pageBtn" disabled={page===1} onClick={() => setPage(p => Math.max(1, p-1))}>Prev</button>
          {Array.from({length: totalPages}).map((_,i) => {
            const n = i+1;
            return (
              <button key={n} className={`pageBtn ${n===page?'pageActive':''}`} onClick={() => setPage(n)}>{n}</button>
            );
          })}
          <button className="pageBtn" disabled={page===totalPages} onClick={() => setPage(p => Math.min(totalPages, p+1))}>Next</button>
        </nav>
      )}
    </div>
  );
}
