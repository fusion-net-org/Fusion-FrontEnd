import React, { useState, useRef, useEffect } from 'react';
import NotificationActions from './NotificationActions';
import { MoreVertical } from 'lucide-react';

interface Props {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  item: any;
  onMarkRead: (id: string) => void;
  onDelete: (id: string) => void;
  onTurnOff: (event: string) => void;
  children: React.ReactNode;
}

const NotificationItem: React.FC<Props> = ({ item, children, onMarkRead, onDelete, onTurnOff }) => {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative group rounded-lg hover:bg-gray-50 transition-colors">
      {/* Content */}
      <div className="pl-2 pr-10 py-2">{children}</div>

      {/* 3-dot button */}
      <button
        ref={buttonRef}
        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-gray-200 opacity-0 group-hover:opacity-100 transition"
        onClick={() => setOpen((prev) => !prev)}
      >
        <MoreVertical className="w-6 h-6 text-gray-700" />
      </button>

      {/* Menu */}
      {open && (
        <div ref={menuRef} className="absolute right-0 top-8 z-50">
          <NotificationActions
            onMarkRead={() => onMarkRead(item.id)}
            onDelete={() => onDelete(item.id)}
            onTurnOff={() => onTurnOff(item.event)}
          />
        </div>
      )}
    </div>
  );
};

export default NotificationItem;
