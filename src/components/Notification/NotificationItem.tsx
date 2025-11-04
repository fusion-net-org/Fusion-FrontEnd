import React, { useState, useRef, useEffect } from 'react';
import NotificationActions from './NotificationActions';
import { MoreVertical } from 'lucide-react';
import { createPortal } from 'react-dom';

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
  const [hovered, setHovered] = useState(false);
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
    <div
      className="relative rounded-lg hover:bg-gray-50 transition-colors"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Content */}
      <div className="pl-2 pr-10 py-2">{children}</div>

      {/* 3-dot button chỉ hiện khi hover */}
      <button
        ref={buttonRef}
        className={`absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-gray-200 transition ${
          hovered ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={(e) => {
          e.stopPropagation();
          setOpen((prev) => !prev);
        }}
      >
        <MoreVertical className="w-6 h-6 text-gray-700" />
      </button>

      {/* Menu */}
      {open &&
        createPortal(
          <div
            ref={menuRef}
            className="fixed z-[9999]"
            style={{
              top: (buttonRef.current?.getBoundingClientRect().bottom ?? 0) - 20,
              left: (buttonRef.current?.getBoundingClientRect().right ?? 0) - 10,
            }}
            onMouseDown={(e) => {
              e.stopPropagation();
            }}
          >
            <NotificationActions
              onMarkRead={() => {
                onMarkRead(item.id);
                setOpen(false);
              }}
              onDelete={() => {
                onDelete(item.id);
                setOpen(false);
              }}
              onTurnOff={() => {
                onTurnOff(item.event);
                setOpen(false);
              }}
              onClose={() => setOpen(false)}
            />
          </div>,
          document.body,
        )}
    </div>
  );
};

export default NotificationItem;
