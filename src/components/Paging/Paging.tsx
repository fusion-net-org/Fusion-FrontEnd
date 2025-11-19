// Paging.tsx
import React from 'react';
import Pagination from '@mui/material/Pagination';
import PaginationItem from '@mui/material/PaginationItem';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

interface PagingProps {
  page: number;
  pageSize: number;
  totalCount: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}

export function Paging({
  page,
  pageSize,
  totalCount,
  onPageChange,
  onPageSizeChange,
}: PagingProps) {
  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <div className="flex items-center justify-between mt-4 px-1  rounded-xl">
      <div className="flex items-center gap-2 text-gray-600 text-sm">
        <span>Show</span>
        <select
          value={pageSize}
          onChange={(e) => onPageSizeChange(Number(e.target.value))}
          className="border border-gray-300 rounded-md px-2 py-1 text-sm"
        >
          {[8, 20, 50, 100, 200].map((size) => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </select>
      </div>

      <Pagination
        count={totalPages}
        page={page}
        onChange={(_, newPage) => onPageChange(newPage)}
        variant="outlined"
        shape="rounded"
        siblingCount={1}
        boundaryCount={1}
        size="small"
        renderItem={(item) => (
          <PaginationItem
            {...item}
            slots={{
              previous: ChevronLeft,
              next: ChevronRight,
              first: ChevronsLeft,
              last: ChevronsRight,
            }}
          />
        )}
        showFirstButton
        showLastButton
        sx={{
          '& .MuiPaginationItem-root': {
            borderRadius: '8px',
            minWidth: '34px',
            height: '34px',
            fontSize: '14px',
          },
          '& .Mui-selected': {
            backgroundColor: '#1976d2 !important',
            color: '#fff !important',
          },
        }}
        className="ml-12"
      />

      {/* RIGHT – Summary + Jump page */}
      <div className="flex items-center gap-2 text-gray-600 text-sm">
        <span>
          Show {(page - 1) * pageSize + 1} – {Math.min(page * pageSize, totalCount)} of {totalCount}{' '}
          items
        </span>

        <div className="flex items-center gap-2">
          <span>Page</span>
          <input
            type="number"
            min={1}
            max={totalPages}
            value={page}
            onChange={(e) => {
              let newPage = Number(e.target.value);
              if (newPage < 1) newPage = 1;
              if (newPage > totalPages) newPage = totalPages;
              onPageChange(newPage);
            }}
            className="w-14 border rounded-md px-2 py-1 text-center"
          />
          <span>of {totalPages}</span>
        </div>
      </div>
    </div>
  );
}
