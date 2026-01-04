import { useEffect, useState } from 'react';
import { Plus, MessageSquarePlus, UsersRound } from 'lucide-react';
import { connection } from '@/pages/chat/signalR';
import { useAppSelector, useAppDispatch } from '@/redux/hooks';

const chats = [
  { id: 1, name: 'Nhóm Test', members: 3, time: '22m' },
  { id: 2, name: 'group2', members: 3, time: '15h' },
  { id: 3, name: 'Nhóm Backend Dev', members: 3, time: '22h' },
  { id: 4, name: 'KienMinh', members: 2, time: '' },
];

const friends = [
  { id: 1, name: 'NguyenDuy', status: 'nguyenduy@gmail.com', online: true },
  { id: 2, name: 'CaoDung', status: 'kienminh@gmail.com', online: false },
  { id: 3, name: 'KienMinh', status: 'kienminh@gmail.com', online: false },
];

const messages = [
  { id: 1, text: 'e lô', time: '29/9 15:46', mine: false },
  { id: 2, text: 'looo', time: '29/9 15:47', mine: false },
  { id: 3, text: '???', time: '29/9 15:49', mine: false },
  { id: 4, text: 'làm xong chưa', time: '29/9 15:49', mine: false },
  { id: 5, text: 'chưa', time: '13:50', mine: true },
  { id: 6, text: 'doi ty', time: '14:09', mine: true },
];

export interface UserInfo {
  name: string;
  email: string;
  avatar?: string;
  initials?: string;
}

type Message = {
  id: number;
  text: string;
  time: string;
  mine: boolean;
};

export default function ChatPage() {
  const [activeChat, setActiveChat] = useState<number | null>(null);
  const dispatch = useAppDispatch();
  const userFromRedux = useAppSelector((state) => state.user.user);
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState('');

  //User Info
  const currentUser: UserInfo = userFromRedux
    ? {
        name: userFromRedux.username || 'Unknown',
        email: userFromRedux.email,
      }
    : { name: 'Unknown', email: 'user@company.com' };

  const getInitials = () =>
    currentUser.name
      .split(' ')
      .map((word) => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);

  // Tạo connection
  useEffect(() => {
    connection
      .start()
      .then(() => {
        console.log('SignalR connected');

        connection.on('ReceiveMessage', (message: Message) => {
          setMessages((prev) => [...prev, message]);
        });
      })
      .catch(console.error);

    return () => {
      connection.off('ReceiveMessage');
      connection.stop();
    };
  }, []);

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-80 bg-white border-r flex flex-col">
        <div className="p-3">
          <div className="p-4 bg-gradient-to-r from-blue-500 to-pink-400 text-white font-bold text-lg rounded-2xl">
            Fusion Chat
          </div>
        </div>

        <div className="p-3">
          <button className="w-full py-2 rounded-lg bg-purple-100 text-purple-700 font-medium">
            New Message
          </button>
        </div>

        <div className="px-4 flex items-center justify-between text-xs text-gray-400 font-semibold">
          <span>GROUP CHAT</span>

          <button
            className="p-1 rounded hover:bg-gray-200 transition"
            title="Add group"
            onClick={() => {
              console.log('Add group');
            }}
          >
            <MessageSquarePlus size={16} className="text-gray-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-2">
          {chats.map((c) => (
            <div
              key={c.id}
              onClick={() => setActiveChat(c.id)}
              className={`p-3 rounded-xl cursor-pointer flex justify-between items-center ${
                activeChat === c.id ? 'border border-purple-400 bg-purple-50' : 'hover:bg-gray-100'
              }`}
            >
              <div>
                <div className="font-medium text-sm">{c.name}</div>
                <div className="text-xs text-gray-400">{c.members} thành viên</div>
              </div>
              {c.time && <span className="text-xs text-gray-400">{c.time}</span>}
            </div>
          ))}
        </div>

        <div className="px-4 flex items-center justify-between text-xs text-gray-400 font-semibold">
          <span>FRIENDS</span>

          <button
            className="p-1 rounded hover:bg-gray-200 transition"
            title="Add group"
            onClick={() => {
              console.log('Add friend');
            }}
          >
            <UsersRound size={16} className="text-gray-500" />
          </button>
        </div>
        <div className="p-2 space-y-2">
          {friends.map((f) => (
            <div
              key={f.id}
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100 cursor-pointer"
            >
              <div className="relative">
                <div className="w-9 h-9 rounded-full bg-purple-200 flex items-center justify-center font-semibold text-purple-700">
                  {f.name[0]}
                </div>
                {f.online && (
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full" />
                )}
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium">{f.name}</div>
                <div className="text-xs text-gray-400 truncate">{f.status}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-auto p-3 border-t flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-sm font-semibold text-white">
            {getInitials()}
          </div>
          <div className="flex-1">
            <div className="text-sm font-semibold">{currentUser.name}</div>
            <div className="text-xs text-gray-400">{currentUser.email}</div>
          </div>
        </div>
      </aside>

      {/* Chat area */}
      <main className="flex-1 flex flex-col">
        {/* Header */}
        <header className="h-16 bg-white border-b flex items-center px-6 font-semibold">
          KienMinh
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((m) => (
            <div key={m.id} className={`flex ${m.mine ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-xs px-4 py-2 rounded-2xl text-sm ${
                  m.mine
                    ? 'bg-purple-500 text-white rounded-br-none'
                    : 'bg-white text-gray-800 rounded-bl-none'
                }`}
              >
                <div>{m.text}</div>
                <div className="text-[10px] opacity-60 mt-1 text-right">{m.time}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Input */}
        <div className="p-4 bg-white border-t flex items-center gap-3">
          <input
            disabled={!activeChat}
            placeholder={activeChat ? 'Soạn tin nhắn...' : 'Chọn group để chat'}
            className="flex-1 px-4 py-2 border rounded-full disabled:bg-gray-100"
          />

          <button className="w-10 h-10 rounded-full bg-purple-500 text-white flex items-center justify-center">
            ➤
          </button>
        </div>
      </main>
    </div>
  );
}
