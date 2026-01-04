import { useEffect, useRef, useState } from 'react';
import { Plus, MessageSquarePlus, UsersRound, X } from 'lucide-react';
import { connection, joinGroup, leaveGroup } from '@/pages/chat/signalR';
import { useAppSelector, useAppDispatch } from '@/redux/hooks';
import {
  getMyFriendList,
  sendAddFriend,
  getMyGroupChatList,
  createGroupChat,
} from '@/services/chatService.js';
import { toast } from 'react-toastify';
import { v4 as uuidv4 } from 'uuid';

// const chats = [
//   { id: 1, name: 'Nhóm Test', members: 3, time: '22m' },
//   { id: 2, name: 'group2', members: 3, time: '15h' },
//   { id: 3, name: 'Nhóm Backend Dev', members: 3, time: '22h' },
//   { id: 4, name: 'KienMinh', members: 2, time: '' },
// ];

// const friends = [
//   { id: 1, name: 'NguyenDuy', status: 'nguyenduy@gmail.com', online: true },
//   { id: 2, name: 'CaoDung', status: 'kienminh@gmail.com', online: false },
//   { id: 3, name: 'KienMinh', status: 'kienminh@gmail.com', online: false },
// ];

// const messages = [
//   { id: 1, text: 'e lô', time: '29/9 15:46', mine: false },
//   { id: 2, text: 'looo', time: '29/9 15:47', mine: false },
//   { id: 3, text: '???', time: '29/9 15:49', mine: false },
//   { id: 4, text: 'làm xong chưa', time: '29/9 15:49', mine: false },
//   { id: 5, text: 'chưa', time: '13:50', mine: true },
//   { id: 6, text: 'doi ty', time: '14:09', mine: true },
// ];

export interface UserInfo {
  name: string;
  email: string;
  avatar?: string;
  initials?: string;
}

export type ChatMessage = {
  id: string;
  conversationId: string;
  senderId: string;
  emailSender?: string;
  content: string;
  clientMessageId?: string;
  createdAt?: string;
  mine: boolean;
};

type Friend = {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  online: boolean;
};

type Conversation = {
  id: string;
  type: number; // 1: direct, 2: group
  name: string;
  members?: number;
  time?: string;
  avatar?: string | null;
  peerEmail?: string;
  peerUserId?: string;
  lastMessage?: string;
  hasUnread?: boolean;
};

export default function ChatPage() {
  //Group Activation
  const [activeChat, setActiveChat] = useState<Conversation | null>(null);
  const [joinedGroupId, setJoinedGroupId] = useState<string | null>(null);
  const activeChatRef = useRef<Conversation | null>(null);

  const dispatch = useAppDispatch();
  const userFromRedux = useAppSelector((state) => state.user.user);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState('');
  const [friends, setFriends] = useState<Friend[]>([]);

  // Add friend
  const [showAddFriend, setShowAddFriend] = useState(false);
  const [friendEmail, setFriendEmail] = useState('');
  const [adding, setAdding] = useState(false);

  // conversation
  const [chats, setChats] = useState<Conversation[]>([]);

  // Create group modal
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [groupTitle, setGroupTitle] = useState('');
  const [selectedFriendIds, setSelectedFriendIds] = useState<string[]>([]);
  const [creatingGroup, setCreatingGroup] = useState(false);

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

        // Group message
        connection.on('ReceiveGroupMessage', (msg: ChatMessage) => {
          const currentChat = activeChatRef.current;

          if (currentChat?.type !== 2) return;
          if (msg.conversationId !== currentChat.id) return;

          setMessages((prev) => [
            ...prev,
            {
              id: msg.id,
              conversationId: msg.conversationId,
              senderId: msg.senderId,
              content: msg.content,
              createdAt: new Date(msg.createdAt || Date.now()).toLocaleTimeString(),
              mine: msg.emailSender === userFromRedux?.email,
            },
          ]);
        });

        // Private message
        connection.on('ReceivePrivateMessage', (msg: ChatMessage) => {
          const currentChat = activeChatRef.current;

          if (!currentChat) return;
          if (currentChat.type !== 1) return;
          if (msg.conversationId !== currentChat.id) return;

          setMessages((prev) => [
            ...prev,
            {
              id: msg.id,
              conversationId: msg.conversationId,
              senderId: msg.senderId,
              content: msg.content,
              createdAt: new Date(msg.createdAt || Date.now()).toLocaleTimeString(),
              mine: msg.emailSender === userFromRedux?.email,
            },
          ]);
        });
      })
      .catch(console.error);

    return () => {
      if (joinedGroupId) {
        leaveGroup(joinedGroupId);
      }

      connection.off('ReceivePrivateMessage');
      connection.off('ReceiveGroupMessage');
      connection.stop();
    };
  }, []);

  // get friend list
  const fetchFriends = async () => {
    try {
      const res = await getMyFriendList();

      const mappedFriends: Friend[] = res.data.items.map((item: any) => ({
        id: item.friendshipId,
        name: item.email.split('@')[0],
        email: item.email,
        avatar: item.avatar,
        online: false,
      }));

      setFriends(mappedFriends);
    } catch (err) {
      console.error('Fetch friends failed', err);
    }
  };

  // get group chat
  const fetchChats = async () => {
    try {
      const res = await getMyGroupChatList();

      const mappedChats: Conversation[] = res.data.items.map((item: any) => {
        // Direct message
        if (item.type === 1) {
          return {
            id: item.id,
            type: 1,
            name: item.peerEmail?.split('@')[0] || 'Unknown',
            members: 2,
            time: item.lastMessageAt ? new Date(item.lastMessageAt).toLocaleTimeString() : '',
            avatar: item.peerAvatar,
            peerUserId: item.peerUserId,
          };
        }

        // Group chat
        return {
          id: item.id,
          type: 2,
          name: item.title || 'Unnamed Group',
          members: undefined,
          time: item.lastMessageAt ? new Date(item.lastMessageAt).toLocaleTimeString() : '',
        };
      });

      setChats(mappedChats);
    } catch (err) {
      console.error('Fetch chats failed', err);
    }
  };

  useEffect(() => {
    fetchFriends();
    fetchChats();
  }, []);

  useEffect(() => {
    activeChatRef.current = activeChat;
  }, [activeChat]);

  //Add new friend
  const handleAddFriend = async () => {
    if (!friendEmail.trim()) return;

    try {
      setAdding(true);
      const res = await sendAddFriend(friendEmail);
      console.log(res.messages);
      setFriendEmail('');
      setShowAddFriend(false);

      // reload friend list
      fetchFriends();
      toast.success('Created friend request successfully!');
    } catch (err: any) {
      toast.error(err?.message || 'Add friend failed');
    } finally {
      setAdding(false);
    }
  };

  // Create group
  const handleCreateGroup = async () => {
    if (!groupTitle.trim()) {
      toast.error('Group title is required');
      return;
    }

    if (selectedFriendIds.length < 2) {
      toast.warn('Select at least 2 friends to create group!');
      return;
    }

    try {
      setCreatingGroup(true);
      await createGroupChat({
        title: groupTitle,
        memberIds: selectedFriendIds,
      });

      toast.success('Group created successfully');

      setGroupTitle('');
      setSelectedFriendIds([]);
      setShowCreateGroup(false);

      // reload group chat list
      fetchChats();
    } catch (err: any) {
      toast.error(err?.message || 'Create group failed');
    } finally {
      setCreatingGroup(false);
    }
  };

  //Send Message
  const handleSend = async () => {
    if (!text.trim() || !activeChat) return;

    const clientMessageId = uuidv4();

    if (activeChat.type === 2) {
      await connection.invoke('SendGroupMessage', activeChat.id, clientMessageId, text, []);
    }

    console.log('Active Chat:', activeChat);
    console.log('Messgae Chat:', clientMessageId, text);

    if (activeChat.type === 1) {
      await connection.invoke(
        'SendPrivateMessage',
        activeChat.peerUserId,
        activeChat.id,
        clientMessageId,
        text,
      );
    }

    setText('');
  };

  return (
    <>
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
              onClick={() => setShowCreateGroup(true)}
            >
              <MessageSquarePlus size={16} className="text-gray-500" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-2">
            {chats.length === 0 ? (
              <div className="py-6 text-center text-sm text-gray-400">No Group</div>
            ) : (
              chats.map((c) => (
                <div
                  key={c.id}
                  onClick={async () => {
                    if (joinedGroupId && joinedGroupId !== c.id) {
                      await leaveGroup(joinedGroupId);
                      setJoinedGroupId(null);
                    }

                    if (c.type === 2) {
                      await joinGroup(c.id);
                      setJoinedGroupId(c.id);
                    }

                    setActiveChat(c);
                    setMessages([]);

                    setChats((prev) =>
                      prev.map((x) => (x.id === c.id ? { ...x, hasUnread: false } : x)),
                    );
                  }}
                  className={`relative p-3 rounded-xl cursor-pointer ${
                    activeChat?.id === c.id
                      ? 'border border-purple-400 bg-purple-50'
                      : 'hover:bg-gray-100'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Avatar */}
                      {c.type === 1 && c.avatar ? (
                        <img src={c.avatar} className="w-9 h-9 rounded-full object-cover" />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-purple-200 flex items-center justify-center font-semibold text-purple-700">
                          {c.name[0]?.toUpperCase()}
                        </div>
                      )}

                      <div className="min-w-0">
                        <div className="font-medium text-sm">{c.name}</div>

                        {c.lastMessage && (
                          <div className="text-xs text-gray-400 truncate max-w-[160px]">
                            {c.lastMessage}
                          </div>
                        )}
                      </div>
                    </div>

                    {c.time && <span className="text-xs text-gray-400">{c.time}</span>}
                  </div>

                  {/* 🔴 UNREAD DOT */}
                  {c.hasUnread && (
                    <span className="absolute top-2 right-2 w-2.5 h-2.5 rounded-full bg-purple-500 animate-pulse" />
                  )}
                </div>
              ))
            )}
          </div>

          <div className="px-4 flex items-center justify-between text-xs text-gray-400 font-semibold">
            <span>FRIENDS</span>

            <button
              className="p-1 rounded hover:bg-gray-200 transition"
              title="Add friend"
              onClick={() => setShowAddFriend(true)}
            >
              <UsersRound size={16} className="text-gray-500" />
            </button>
          </div>
          {showAddFriend && (
            <div className="mx-2 mt-2 p-3 rounded-xl border bg-white shadow-md space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold">Add Friend</span>
                <button onClick={() => setShowAddFriend(false)}>
                  <X size={16} className="text-gray-400 hover:text-gray-600" />
                </button>
              </div>

              <input
                value={friendEmail}
                onChange={(e) => setFriendEmail(e.target.value)}
                placeholder="Enter email"
                className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-purple-400"
              />

              <button
                onClick={handleAddFriend}
                disabled={adding}
                className="w-full py-2 rounded-lg bg-purple-500 text-white text-sm font-medium disabled:opacity-50"
              >
                {adding ? 'Sending...' : 'Add'}
              </button>
            </div>
          )}
          <div className="p-2 space-y-2">
            {friends.length === 0 ? (
              <div className="py-6 text-center text-sm text-gray-400">No Friend</div>
            ) : (
              friends.map((f) => (
                <div
                  key={f.id}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100 cursor-pointer"
                >
                  <div className="relative">
                    {f.avatar ? (
                      <img
                        src={f.avatar}
                        alt={f.name}
                        className="w-9 h-9 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-purple-200 flex items-center justify-center font-semibold text-purple-700">
                        {f.name[0].toUpperCase()}
                      </div>
                    )}

                    {f.online && (
                      <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full" />
                    )}
                  </div>

                  <div className="flex-1">
                    <div className="text-sm font-medium">{f.name}</div>
                    <div className="text-xs text-gray-400 truncate">{f.email}</div>
                  </div>
                </div>
              ))
            )}
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
                  <div>{m.content}</div>
                  <div className="text-[10px] opacity-60 mt-1 text-right">{m.createdAt}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Input */}
          <div className="p-4 bg-white border-t flex items-center gap-3">
            <input
              value={text}
              disabled={!activeChat}
              onChange={(e) => setText(e.target.value)}
              placeholder={activeChat ? 'Soạn tin nhắn...' : 'Chọn group để chat'}
              className="flex-1 px-4 py-2 border rounded-full disabled:bg-gray-100"
            />

            <button
              onClick={handleSend}
              className="w-10 h-10 rounded-full bg-purple-500 text-white flex items-center justify-center"
            >
              ➤
            </button>
          </div>
          {showCreateGroup && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
              onClick={() => setShowCreateGroup(false)}
            >
              <div
                className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Header */}
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-lg font-semibold">Create Group</h2>
                  <button onClick={() => setShowCreateGroup(false)}>
                    <X className="text-gray-400 hover:text-gray-600" />
                  </button>
                </div>

                {/* Group title */}
                <input
                  value={groupTitle}
                  onChange={(e) => setGroupTitle(e.target.value)}
                  placeholder="Group title"
                  className="mb-4 w-full rounded-lg border px-3 py-2 text-sm"
                />
                <div className="flex items-center justify-between text-xs text-gray-400 font-semibold mb-2">
                  <span>FRIEND LIST</span>
                </div>
                {/* Friend list */}
                <div className="mb-4 max-h-48 space-y-2 overflow-y-auto rounded-lg border p-3">
                  {friends.map((f) => (
                    <label key={f.id} className="flex items-center gap-2 text-sm cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedFriendIds.includes(f.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedFriendIds((prev) => [...prev, f.id]);
                          } else {
                            setSelectedFriendIds((prev) => prev.filter((id) => id !== f.id));
                          }
                        }}
                      />
                      <span>{f.name}</span>
                    </label>
                  ))}
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => setShowCreateGroup(false)}
                    className="rounded-lg border px-4 py-2 text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    disabled={creatingGroup}
                    onClick={handleCreateGroup}
                    className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
                  >
                    {creatingGroup ? 'Creating...' : 'Create Group'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </>
  );
}
