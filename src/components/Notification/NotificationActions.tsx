import React from 'react';
import { Check, BellOff, Trash } from 'lucide-react';

interface Props {
  onMarkRead: () => void;
  onDelete: () => void;
  onTurnOff: () => void;
}

const NotificationActions: React.FC<Props> = ({ onMarkRead, onDelete, onTurnOff }) => {
  return (
    <div className="absolute right-0 top-6 z-50 bg-white border shadow-md rounded-lg overflow-hidden w-56">
      <button
        onClick={onMarkRead}
        className="flex items-center px-3 py-2 text-sm w-full hover:bg-gray-100"
      >
        <Check className="w-4 h-4 mr-2" />
        Mark as read
      </button>
      <button
        onClick={onDelete}
        className="flex items-center px-3 py-2 text-sm w-full hover:bg-gray-100"
      >
        <Trash className="w-4 h-4 mr-2" />
        Delete this notification
      </button>
      <button
        onClick={onTurnOff}
        className="flex items-center px-3 py-2 text-sm w-full hover:bg-gray-100"
      >
        <BellOff className="w-4 h-4 mr-2" />
        Turn off this notification type
      </button>
    </div>
  );
};

export default NotificationActions;
