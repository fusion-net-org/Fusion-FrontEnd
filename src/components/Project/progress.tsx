import * as React from 'react';
import { cn } from '@/lib/utils';

interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number;
  max?: number;
}

export const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  ({ value = 0, max = 100, className, ...props }, ref) => {
    const percentage = Math.min(Math.max(value, 0), max);
    return (
      <div
        ref={ref}
        role="progressbar"
        aria-valuenow={percentage}
        aria-valuemin={0}
        aria-valuemax={max}
        className={cn('relative w-full overflow-hidden rounded-full bg-gray-200', className)}
        {...props}
      >
        <div
          className="h-full bg-gradient-to-r from-indigo-500 to-blue-500 transition-all duration-500 ease-in-out rounded-full"
          style={{ width: `${percentage}%` }}
        />
      </div>
    );
  },
);

Progress.displayName = 'Progress';
