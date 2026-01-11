import { useEffect, useRef, useState } from 'react';
import { MessageSquarePlus, UsersRound, X, UserPlus, MoreVertical, UserMinus } from 'lucide-react';
import { connection, joinGroup, leaveGroup } from '@/pages/chat/signalR';
import { useAppSelector, useAppDispatch } from '@/redux/hooks';
import {
  getMyFriendList,
  sendAddFriend,
  getMyGroupChatList,
  createGroupChat,
  getMessages,
  getFriendInvitationList,
  acceptFriendInvitation,
  rejectFriendInvitation,
  unfriend,
} from '@/services/chatService.js';
import { toast } from 'react-toastify';
import { v4 as uuidv4 } from 'uuid';
import { ChatListSkeleton } from './ChatSkeleton';
import { MessageSkeleton } from './MessageSkeleton';

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
  senderAvatar?: string;
  senderName?: string;
  mine: boolean;
  nameSender?: string;
  avatarSender?: string;
};

type Friend = {
  id: string;
  friendshipId: string;
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
  title?: string;
};

type FriendRequest = {
  id: string;
  requesterId: string;
  requesterName?: string;
  requesterAvatar?: string;
  requestedAt: string;
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

  //loading
  const [loadingChats, setLoadingChats] = useState(true);
  const [loadingFriends, setLoadingFriends] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);

  // Add friend
  const [showAddFriend, setShowAddFriend] = useState(false);
  const [friendEmail, setFriendEmail] = useState('');
  const [adding, setAdding] = useState(false);

  // conversation
  const [chats, setChats] = useState<Conversation[]>([]);
  const [searchKeyword, setSearchKeyword] = useState('');
  const searchTimeoutRef = useRef<any>(null);

  // Create group modal
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [groupTitle, setGroupTitle] = useState('');
  const [selectedFriendIds, setSelectedFriendIds] = useState<string[]>([]);
  const [creatingGroup, setCreatingGroup] = useState(false);

  //friend req
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [showRequestDrawer, setShowRequestDrawer] = useState(false);
  const [loadingRequests, setLoadingRequests] = useState(false);

  //unfriend
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [confirmFriend, setConfirmFriend] = useState<Friend | null>(null);
  const [unfriending, setUnfriending] = useState(false);

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
          console.log(msg);
          setMessages((prev) => [
            ...prev,
            {
              id: msg.id,
              senderName: msg.nameSender,
              senderAvatar: msg.avatarSender,
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
              senderName: msg.nameSender,
              senderAvatar: msg.avatarSender,
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
      setLoadingFriends(true);
      const res = await getMyFriendList();

      const mappedFriends: Friend[] = res.data.items.map((item: any) => ({
        id: item.id,
        friendshipId: item.friendshipId,
        name: item.userName,
        email: item.email,
        avatar: item.avatar,
        online: false,
      }));

      setFriends(mappedFriends);
    } catch (err) {
      console.error('Fetch friends failed', err);
    } finally {
      setLoadingFriends(false);
    }
  };

  //get friend req list
  const fetchFriendRequests = async () => {
    try {
      setLoadingRequests(true);
      const res = await getFriendInvitationList();
      setFriendRequests(res.data);
    } catch (err) {
      console.error('Fetch friend requests failed', err);
    } finally {
      setLoadingRequests(false);
    }
  };

  // get group chat
  const fetchChats = async (keyword = '') => {
    try {
      setLoadingChats(true);
      const res = await getMyGroupChatList(keyword);

      const mappedChats: Conversation[] = res.data.items.map((item: any) => {
        if (item.type === 1) {
          return {
            id: item.id,
            type: 1,
            name: item.peerUserName || 'Unknown',
            time: item.lastMessageAt ? new Date(item.lastMessageAt).toLocaleTimeString() : '',
            avatar: item.peerAvatar,
            peerUserId: item.peerUserId,
          };
        }

        return {
          id: item.id,
          type: 2,
          name: item.title || 'Unnamed Group',
          time: item.lastMessageAt ? new Date(item.lastMessageAt).toLocaleTimeString() : '',
        };
      });

      setChats(mappedChats);
    } catch (err) {
      console.error('Fetch chats failed', err);
    } finally {
      setLoadingChats(false);
    }
  };

  useEffect(() => {
    fetchFriends();
    fetchFriendRequests();
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

  //loadMess
  const mapMessages = (items: any[]): ChatMessage[] => {
    return items
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
      .map((m) => ({
        id: m.id,
        conversationId: m.conversationId,
        senderId: m.senderId,
        senderName: m.senderName,
        senderAvatar: m.senderAvatar,
        content: m.content,
        createdAt: new Date(m.createdAt).toLocaleTimeString(),
        mine: m.senderName === userFromRedux?.username,
      }));
  };

  const loadMessages = async (conversationId: string) => {
    setLoadingMessages(true);
    try {
      setMessages([]);
      const res = await getMessages(conversationId);

      const mapped = mapMessages(res.data.items);
      setMessages(mapped);
    } catch (err) {
      console.error('Load messages failed', err);
      toast.error('Cannot load messages');
    } finally {
      setLoadingMessages(false);
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

  // handle friend reqs
  const handleAcceptRequest = async (requestId: string) => {
    try {
      console.log(requestId);
      await acceptFriendInvitation(requestId);
      setFriendRequests((prev) => prev.filter((r) => r.id !== requestId));
      fetchFriends();
      toast.success('Friend added');
    } catch {
      toast.error('Accept failed');
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    try {
      await rejectFriendInvitation(requestId);
      setFriendRequests((prev) => prev.filter((r) => r.id !== requestId));
      toast.info('Request rejected');
    } catch {
      toast.error('Reject failed');
    }
  };

  // handle unfriend
  const handleConfirmUnfriend = async () => {
    if (!confirmFriend) return;

    try {
      console.log(confirmFriend.id);
      setUnfriending(true);
      await unfriend(confirmFriend.id);

      setFriends((prev) => prev.filter((f) => f.id !== confirmFriend.id));
      toast.success(`Unfriended ${confirmFriend.name}`);
    } catch (err: any) {
      toast.error(err?.message || 'Unfriend failed');
    } finally {
      setUnfriending(false);
      setConfirmFriend(null);
    }
  };

  return (
    <>
      <div className="flex h-screen bg-gray-100">
        {/* Sidebar */}
        <aside className="w-80 bg-white border-r-black flex flex-col">
          <div className="p-3">
            <div className="p-4 bg-blue-500 text-white font-bold text-lg rounded-2xl">
              Fusion Chat
            </div>
          </div>

          <div className="m-4 relative">
            <input
              value={searchKeyword}
              onChange={(e) => {
                const value = e.target.value;
                setSearchKeyword(value);

                if (searchTimeoutRef.current) {
                  clearTimeout(searchTimeoutRef.current);
                }

                searchTimeoutRef.current = setTimeout(() => {
                  fetchChats(value);
                }, 400);
              }}
              placeholder="Search conversations..."
              className="w-full pl-9 pr-3 py-2 rounded-lg border text-sm
               focus:outline-none focus:ring-2 focus:ring-purple-400"
            />

            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              width="16"
              height="16"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="7" cy="7" r="5" />
              <line x1="11" y1="11" x2="15" y2="15" />
            </svg>
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

          <div className="flex-1 overflow-y-auto">
            {loadingChats ? (
              <ChatListSkeleton count={6} />
            ) : chats.length === 0 ? (
              <div className="py-6 text-center text-sm text-gray-400">No Group</div>
            ) : (
              <div className="space-y-2 p-2">
                {chats.map((c) => (
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
                      activeChatRef.current = c;

                      await loadMessages(c.id);

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

                          {/* {c.lastMessage && (
                            <div className="text-xs text-gray-400 truncate max-w-[160px]">
                              {c.lastMessage}
                            </div>
                          )} */}
                        </div>
                      </div>

                      {c.time && <span className="text-xs text-gray-400">{c.time}</span>}
                    </div>

                    {c.hasUnread && (
                      <span className="absolute top-2 right-2 w-2.5 h-2.5 rounded-full bg-purple-500 animate-pulse" />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="px-4 flex items-center justify-between text-xs text-gray-400 font-semibold">
            <span>FRIENDS</span>

            <div className="flex items-center gap-1">
              {/* Add friend */}
              <button
                className="p-1 rounded hover:bg-gray-200 transition"
                title="Add friend"
                onClick={() => setShowAddFriend(true)}
              >
                <UserPlus size={16} className="text-gray-500" />
              </button>

              {/* Friend requests */}
              <button
                className="relative p-1 rounded hover:bg-gray-200 transition"
                title="Friend requests"
                onClick={() => setShowRequestDrawer(true)}
              >
                <UsersRound size={16} className="text-gray-500" />

                {friendRequests.length > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center">
                    {friendRequests.length}
                  </span>
                )}
              </button>
            </div>
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
            {loadingFriends ? (
              <ChatListSkeleton count={4} />
            ) : friends.length === 0 ? (
              <div className="py-6 text-center text-sm text-gray-400">No Friend</div>
            ) : (
              friends.map((f) => (
                <div
                  key={f.id}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100"
                >
                  {/* Avatar */}
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

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{f.name}</div>
                    <div className="text-xs text-gray-400 truncate">{f.email}</div>
                  </div>

                  {/* More */}
                  <div className="relative">
                    <button
                      onClick={() => setOpenMenuId(openMenuId === f.id ? null : f.id)}
                      className="p-1 rounded hover:bg-gray-200"
                    >
                      <MoreVertical size={16} />
                    </button>

                    {openMenuId === f.id && (
                      <div className="absolute right-0 mt-1 w-32 rounded-lg bg-white border shadow-lg z-10">
                        <button
                          onClick={() => {
                            setConfirmFriend(f);
                            setOpenMenuId(null);
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-600 hover:bg-red-50 disabled:opacity-50"
                        >
                          <UserMinus size={14} />
                          Unfriend
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="mt-auto p-3 border-t flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-500 text-sm font-semibold text-white">
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
            {activeChat
              ? activeChat.type === 2
                ? activeChat.title || activeChat.name
                : activeChat.name
              : 'Fusion chat'}
          </header>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {loadingMessages ? (
              <MessageSkeleton />
            ) : (
              messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex items-end gap-2 ${m.mine ? 'justify-end' : 'justify-start'}`}
                >
                  {!m.mine && (
                    <div className="relative group">
                      {m.senderAvatar ? (
                        <img
                          src={m.senderAvatar}
                          alt={m.senderName}
                          className="w-9 h-9 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-purple-200 flex items-center justify-center font-semibold text-purple-700">
                          {m.senderName?.[0]?.toUpperCase()}
                        </div>
                      )}

                      {/* Hover tooltip */}
                      <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 hidden group-hover:block">
                        <div className="px-2 py-1 text-xs text-white bg-black rounded-md whitespace-nowrap">
                          {m.senderName}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Message content */}
                  <div className="max-w-xs">
                    {!m.mine && (
                      <div className="text-xs text-gray-500 mb-1 ml-1">{m.senderName}</div>
                    )}

                    <div
                      className={`px-4 py-2 rounded-2xl text-sm ${
                        m.mine
                          ? 'bg-purple-500 text-white rounded-br-none'
                          : 'bg-white text-gray-800 rounded-bl-none'
                      }`}
                    >
                      <div>{m.content}</div>
                      <div className="text-[10px] opacity-60 mt-1 text-right">{m.createdAt}</div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Input */}
          <div className="p-4 bg-white border-t flex items-center gap-3">
            <input
              value={text}
              disabled={!activeChat}
              onChange={(e) => setText(e.target.value)}
              placeholder={activeChat ? 'Type a message...' : 'Choose a group to chat'}
              className="flex-1 px-4 py-2 border rounded-full disabled:bg-gray-100"
            />

            <button
              onClick={handleSend}
              className="w-10 h-10 rounded-full bg-purple-500 text-white flex items-center justify-center"
            >
              ➤
            </button>
          </div>
          {/* MODALS */}
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
                <div className="mb-4 max-h-48 overflow-y-auto rounded-lg border p-3">
                  {friends.length === 0 ? (
                    <div className="py-6 text-center text-sm text-gray-400">
                      You don’t have any friends yet
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {friends.map((f) => (
                        <label
                          key={f.id}
                          className="flex items-center gap-3 rounded-lg p-2 hover:bg-gray-100 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={selectedFriendIds.includes(f.friendshipId)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedFriendIds((prev) => [...prev, f.friendshipId]);
                              } else {
                                setSelectedFriendIds((prev) =>
                                  prev.filter((id) => id !== f.friendshipId),
                                );
                              }
                            }}
                          />

                          {/* Avatar */}
                          {f.avatar ? (
                            <img
                              src={f.avatar}
                              alt={f.name}
                              className="w-8 h-8 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-purple-200 flex items-center justify-center text-xs font-semibold text-purple-700">
                              {f.name?.[0]?.toUpperCase()}
                            </div>
                          )}

                          {/* Name */}
                          <span className="text-sm">{f.name}</span>
                        </label>
                      ))}
                    </div>
                  )}
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
                    disabled={creatingGroup || friends.length === 0 || selectedFriendIds.length < 2}
                    onClick={handleCreateGroup}
                    className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
                  >
                    {creatingGroup ? 'Creating...' : 'Create Group'}
                  </button>
                </div>
              </div>
            </div>
          )}
          {showRequestDrawer && (
            <div className="fixed inset-0 z-50">
              {/* Overlay */}
              <div
                className="absolute inset-0 bg-black/30"
                onClick={() => setShowRequestDrawer(false)}
              />

              {/* Drawer */}
              <div className="absolute right-0 top-0 h-full w-80 bg-white shadow-xl flex flex-col">
                {/* Header */}
                <div className="p-4 border-b flex items-center justify-between">
                  <h3 className="font-semibold">Friend Requests</h3>
                  <button onClick={() => setShowRequestDrawer(false)}>
                    <X size={18} className="text-gray-400 hover:text-gray-600" />
                  </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-3 space-y-2">
                  {loadingRequests ? (
                    <div className="text-center text-sm text-gray-400">Loading...</div>
                  ) : friendRequests.length === 0 ? (
                    <div className="text-center text-sm text-gray-400">No pending requests</div>
                  ) : (
                    friendRequests.map((r) => (
                      <div key={r.id} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50">
                        {/* Avatar */}
                        <div className="w-10 h-10 rounded-full bg-purple-200 flex items-center justify-center font-semibold text-purple-700">
                          {r.requesterName?.[0]?.toUpperCase()}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium truncate">
                            {r.requesterName || 'Unknown'}
                          </div>
                          <div className="text-xs text-gray-400">Wants to be your friend!!!</div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-1">
                          <button
                            onClick={() => handleAcceptRequest(r.id)}
                            className="px-2 py-1 text-xs rounded bg-green-500 text-white"
                          >
                            Accept
                          </button>
                          <button
                            onClick={() => handleRejectRequest(r.id)}
                            className="px-2 py-1 text-xs rounded bg-gray-200 text-gray-600"
                          >
                            Reject
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
          {confirmFriend && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
              <div className="w-full max-w-sm rounded-xl bg-white p-5 shadow-xl">
                <h3 className="text-lg font-semibold mb-2">Unfriend</h3>

                <p className="text-sm text-gray-600 mb-4">
                  Are you sure you want to unfriend{' '}
                  <span className="font-medium">{confirmFriend.name}</span>?
                </p>

                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => setConfirmFriend(null)}
                    className="px-4 py-2 text-sm rounded-lg border"
                  >
                    Cancel
                  </button>

                  <button
                    disabled={unfriending}
                    onClick={handleConfirmUnfriend}
                    className="px-4 py-2 text-sm rounded-lg bg-red-500 text-white disabled:opacity-50"
                  >
                    {unfriending ? 'Removing...' : 'Unfriend'}
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
