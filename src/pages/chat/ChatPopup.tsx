import { useEffect, useRef, useState } from 'react';
import {
  MessageCircle,
  X,
  Send,
  UserPlus,
  UsersRound,
  MessageSquarePlus,
  MoreVertical,
  UserMinus,
  Search,
  ChevronLeft,
  Users,
  Settings,
} from 'lucide-react';
import { connection, joinGroup, leaveGroup } from '@/pages/chat/signalR';
import { useAppSelector } from '@/redux/hooks';
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
  getConversationById,
} from '@/services/chatService.js';
import { toast } from 'react-toastify';
import { v4 as uuidv4 } from 'uuid';
import { ChatListSkeleton } from '@/pages/chat/ChatSkeleton';

type Conversation = {
  id: string;
  type: number; // 1 private, 2 group
  name: string;
  peerUserId?: string;
  avatar?: string;
  time?: string;
  hasUnread?: boolean;
  title?: string;
};

type ChatMessage = {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  createdAt?: string;
  senderName?: string;
  senderAvatar?: string;
  mine: boolean;
};

type Friend = {
  id: string;
  friendshipId: string;
  name: string;
  email: string;
  avatar?: string;
  online: boolean;
};

type FriendRequest = {
  id: string;
  requesterId: string;
  requesterName?: string;
  requesterAvatar?: string;
  requestedAt: string;
};

type PopupView = 'chats' | 'friends' | 'settings';

export default function ChatPopup() {
  const user = useAppSelector((s) => s.user.user);
  const [open, setOpen] = useState(false);
  const [currentView, setCurrentView] = useState<PopupView>('chats');
  const [chats, setChats] = useState<Conversation[]>([]);
  const [activeChat, setActiveChat] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState('');
  const [joinedGroupId, setJoinedGroupId] = useState<string | null>(null);
  const [searchKeyword, setSearchKeyword] = useState('');

  // Friends state
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loadingFriends, setLoadingFriends] = useState(false);

  // Add friend
  const [showAddFriend, setShowAddFriend] = useState(false);
  const [friendEmail, setFriendEmail] = useState('');
  const [adding, setAdding] = useState(false);

  // Friend requests
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [showRequestDrawer, setShowRequestDrawer] = useState(false);
  const [loadingRequests, setLoadingRequests] = useState(false);

  // Create group
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [groupTitle, setGroupTitle] = useState('');
  const [selectedFriendIds, setSelectedFriendIds] = useState<string[]>([]);
  const [creatingGroup, setCreatingGroup] = useState(false);

  // Unfriend
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [confirmFriend, setConfirmFriend] = useState<Friend | null>(null);
  const [unfriending, setUnfriending] = useState(false);

  // Loading states
  const [loadingChats, setLoadingChats] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);

  // Group members
  const [showGroupMembers, setShowGroupMembers] = useState(false);
  const [groupMembers, setGroupMembers] = useState<any[]>([]);
  const [groupOwnerId, setGroupOwnerId] = useState<string | null>(null);
  const [loadingMembers, setLoadingMembers] = useState(false);

  const activeChatRef = useRef<Conversation | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const searchTimeoutRef = useRef<any>(null);

  // SignalR connection
  useEffect(() => {
    if (!open) return;

    connection
      .start()
      .then(() => {
        console.log('Popup SignalR connected');

        connection.on('ReceiveGroupMessage', (msg: any) => {
          const current = activeChatRef.current;
          if (!current || current.type !== 2) return;
          if (msg.conversationId !== current.id) return;

          setMessages((prev) => [
            ...prev,
            {
              id: msg.id,
              conversationId: msg.conversationId,
              senderId: msg.senderId,
              content: msg.content,
              createdAt: new Date(msg.createdAt || Date.now()).toLocaleTimeString(),
              senderName: msg.nameSender,
              senderAvatar: msg.avatarSender,
              mine: msg.emailSender === user?.email,
            },
          ]);
        });

        connection.on('ReceivePrivateMessage', (msg: any) => {
          const current = activeChatRef.current;
          if (!current || current.type !== 1) return;
          if (msg.conversationId !== current.id) return;

          setMessages((prev) => [
            ...prev,
            {
              id: msg.id,
              conversationId: msg.conversationId,
              senderId: msg.senderId,
              content: msg.content,
              createdAt: new Date(msg.createdAt || Date.now()).toLocaleTimeString(),
              senderName: msg.nameSender,
              senderAvatar: msg.avatarSender,
              mine: msg.emailSender === user?.email,
            },
          ]);
        });
      })
      .catch(console.error);

    return () => {
      if (joinedGroupId) leaveGroup(joinedGroupId);
      connection.off('ReceiveGroupMessage');
      connection.off('ReceivePrivateMessage');
      connection.stop();
    };
  }, [open]);

  // Fetch data
  const fetchChats = async (keyword = '') => {
    try {
      setLoadingChats(true);
      const res = await getMyGroupChatList(keyword);
      const mapped: Conversation[] = res.data.items.map((i: any) =>
        i.type === 1
          ? {
              id: i.id,
              type: 1,
              name: i.peerUserName || 'Unknown',
              peerUserId: i.peerUserId,
              avatar: i.peerAvatar,
              time: i.lastMessageAt ? new Date(i.lastMessageAt).toLocaleTimeString() : '',
            }
          : {
              id: i.id,
              type: 2,
              name: i.title || 'Group',
              time: i.lastMessageAt ? new Date(i.lastMessageAt).toLocaleTimeString() : '',
            },
      );

      setChats(mapped);
    } catch {
      //toast.error('Cannot load chats');
    } finally {
      setLoadingChats(false);
    }
  };

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

  const loadMessages = async (conversationId: string) => {
    setLoadingMessages(true);
    try {
      setMessages([]);
      const res = await getMessages(conversationId);

      const mapped = res.data.items
        .sort((a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
        .map((m: any) => ({
          id: m.id,
          conversationId: m.conversationId,
          senderId: m.senderId,
          content: m.content,
          createdAt: new Date(m.createdAt).toLocaleTimeString(),
          senderName: m.senderName,
          senderAvatar: m.senderAvatar,
          mine: m.senderName === user?.username,
        }));

      setMessages(mapped);
    } catch {
      toast.error('Load messages failed');
    } finally {
      setLoadingMessages(false);
    }
  };

  const loadConversationDetail = async (conversationId: string) => {
    try {
      setLoadingMembers(true);
      const res = await getConversationById(conversationId);

      const members = res.data.members || [];
      const owner = members.find((m: any) => m.role === 1);

      setGroupMembers(members);
      setGroupOwnerId(owner?.userId || null);
    } catch (err) {
      toast.error('Cannot load group members');
    } finally {
      setLoadingMembers(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchChats();
      fetchFriends();
      fetchFriendRequests();
    }
  }, [open]);

  // Handle send
  const handleSend = async () => {
    if (!text.trim() || !activeChat) return;

    const clientId = uuidv4();

    try {
      if (activeChat.type === 2) {
        await connection.invoke('SendGroupMessage', activeChat.id, clientId, text, []);
      } else {
        await connection.invoke(
          'SendPrivateMessage',
          activeChat.peerUserId,
          activeChat.id,
          clientId,
          text,
        );
      }

      setText('');
    } catch {
      toast.error('Send failed');
    }
  };

  const handleAddFriend = async () => {
    if (!friendEmail.trim()) return;

    try {
      setAdding(true);
      await sendAddFriend(friendEmail);
      setFriendEmail('');
      setShowAddFriend(false);
      fetchFriends();
      toast.success('Friend request sent!');
    } catch (err: any) {
      toast.error(err?.message || 'Add friend failed');
    } finally {
      setAdding(false);
    }
  };

  const handleCreateGroup = async () => {
    if (!groupTitle.trim()) {
      toast.error('Group title is required');
      return;
    }

    if (selectedFriendIds.length < 2) {
      toast.warn('Select at least 2 friends');
      return;
    }

    try {
      setCreatingGroup(true);
      await createGroupChat({
        title: groupTitle,
        memberIds: selectedFriendIds,
      });

      toast.success('Group created!');
      setGroupTitle('');
      setSelectedFriendIds([]);
      setShowCreateGroup(false);
      fetchChats();
    } catch (err: any) {
      toast.error(err?.message || 'Create group failed');
    } finally {
      setCreatingGroup(false);
    }
  };

  const handleAcceptRequest = async (requestId: string) => {
    try {
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

  const handleConfirmUnfriend = async () => {
    if (!confirmFriend) return;

    try {
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

  useEffect(() => {
    activeChatRef.current = activeChat;
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, activeChat]);

  const getInitials = (name?: string) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map((word) => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-40
                   w-14 h-14 rounded-full 
                   bg-blue-500
                   text-white shadow-2xl flex items-center justify-center
                   hover:scale-110 active:scale-95 transition-all duration-200
                   "
      >
        <MessageCircle size={24} />
        {friendRequests.length > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1.5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-bold border-2 border-white">
            {friendRequests.length}
          </span>
        )}
      </button>

      {/* POPUP */}
      {open && (
        <div
          className="fixed bottom-6 right-24 z-[45]
                        w-[420px] h-[620px]
                        bg-white rounded-2xl shadow-2xl
                        border border-gray-200 flex flex-col overflow-hidden
                        animate-in slide-in-from-bottom-4 duration-300"
        >
          {/* HEADER */}
          <div className="h-14 px-4 border-b bg-gradient-to-r from-blue-50 to-purple-50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
                <MessageCircle size={16} className="text-white" />
              </div>
              <span className="font-bold text-gray-800">Fusion Chat</span>
            </div>

            <div className="flex items-center gap-1">
              {/* Friend requests badge */}
              <button
                onClick={() => setShowRequestDrawer(true)}
                className="relative p-2 rounded-lg hover:bg-white/60 transition"
                title="Friend requests"
              >
                <UsersRound size={18} className="text-gray-600" />
                {friendRequests.length > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center font-bold">
                    {friendRequests.length}
                  </span>
                )}
              </button>

              <button
                onClick={() => setOpen(false)}
                className="p-2 rounded-lg hover:bg-white/60 transition"
              >
                <X size={18} className="text-gray-600" />
              </button>
            </div>
          </div>

          {/* NAVIGATION TABS */}
          {!activeChat && (
            <div className="flex border-b bg-gray-50">
              <button
                onClick={() => setCurrentView('chats')}
                className={`flex-1 py-3 text-sm font-medium transition-all ${
                  currentView === 'chats'
                    ? 'text-purple-600 border-b-2 border-purple-600 bg-white'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <MessageSquarePlus size={16} />
                  <span>Chats ({chats.length})</span>
                </div>
              </button>

              <button
                onClick={() => setCurrentView('friends')}
                className={`flex-1 py-3 text-sm font-medium transition-all ${
                  currentView === 'friends'
                    ? 'text-purple-600 border-b-2 border-purple-600 bg-white'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <Users size={16} />
                  <span>Friends ({friends.length})</span>
                </div>
              </button>
            </div>
          )}

          {/* CONTENT AREA */}
          <div className="flex-1 overflow-hidden flex flex-col">
            {/* CHAT VIEW */}
            {activeChat ? (
              <>
                {/* Chat header */}
                <div className="h-12 px-3 border-b flex items-center gap-3 bg-white">
                  {/* Back */}
                  <button
                    onClick={() => {
                      setActiveChat(null);
                      setMessages([]);
                    }}
                    className="p-1 rounded-lg hover:bg-gray-100"
                  >
                    <ChevronLeft size={18} />
                  </button>

                  {/* Avatar */}
                  {activeChat.avatar ? (
                    <img
                      src={activeChat.avatar}
                      alt={activeChat.name}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-purple-200 flex items-center justify-center text-purple-700 text-xs font-semibold">
                      {getInitials(activeChat.name)}
                    </div>
                  )}

                  {/* Name */}
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm truncate">{activeChat.name}</div>
                    {activeChat.type === 2 && (
                      <div className="text-xs text-gray-400">Group chat</div>
                    )}
                  </div>

                  {/* Actions */}
                  {activeChat.type === 2 && (
                    <button
                      onClick={() => setShowGroupMembers(true)}
                      className="p-2 rounded-lg hover:bg-gray-100"
                      title="Group members"
                    >
                      <MoreVertical size={18} />
                    </button>
                  )}
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-gradient-to-br from-gray-50 to-blue-50/30">
                  {loadingMessages ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500" />
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-gray-400 text-sm">
                      No messages yet. Start the conversation!
                    </div>
                  ) : (
                    messages.map((m) => (
                      <div
                        key={m.id}
                        className={`flex items-end gap-2 ${
                          m.mine ? 'justify-end' : 'justify-start'
                        }`}
                      >
                        {!m.mine && (
                          <div className="relative group">
                            {m.senderAvatar ? (
                              <img
                                src={m.senderAvatar}
                                alt={m.senderName}
                                className="w-7 h-7 rounded-full object-cover"
                              />
                            ) : (
                              <div className="w-7 h-7 rounded-full bg-purple-200 flex items-center justify-center text-xs font-semibold text-purple-700">
                                {getInitials(m.senderName)}
                              </div>
                            )}

                            <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-1 hidden group-hover:block">
                              <div className="px-2 py-1 text-[10px] text-white bg-black/75 rounded whitespace-nowrap">
                                {m.senderName}
                              </div>
                            </div>
                          </div>
                        )}

                        <div className="max-w-[75%]">
                          {!m.mine && activeChat.type === 2 && (
                            <div className="text-[10px] text-gray-500 mb-0.5 ml-1">
                              {m.senderName}
                            </div>
                          )}

                          <div
                            className={`px-3 py-2 rounded-2xl text-sm break-words ${
                              m.mine
                                ? 'bg-purple-500 text-white rounded-br-none shadow-md'
                                : 'bg-white text-gray-800 rounded-bl-none shadow-sm border border-gray-100'
                            }`}
                          >
                            <div>{m.content}</div>
                            <div
                              className={`text-[9px] mt-1 text-right ${
                                m.mine ? 'text-blue-100' : 'text-gray-400'
                              }`}
                            >
                              {m.createdAt}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                  <div ref={bottomRef} />
                </div>

                {/* Input */}
                <div className="p-3 border-t bg-white flex items-center gap-2">
                  <input
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    className="flex-1 px-4 py-2 border border-gray-200 rounded-full text-sm 
                             focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent"
                    placeholder="Type a message..."
                  />
                  <button
                    onClick={handleSend}
                    disabled={!text.trim()}
                    className="w-9 h-9 rounded-full bg-purple-500 
                             text-white flex items-center justify-center
                             disabled:opacity-40 disabled:cursor-not-allowed
                             hover:scale-105 active:scale-95 transition-all shadow-md"
                  >
                    <Send size={16} />
                  </button>
                </div>
              </>
            ) : (
              <>
                {/* CHATS TAB */}
                {currentView === 'chats' && (
                  <div className="flex-1 overflow-hidden flex flex-col">
                    {/* Search bar */}
                    <div className="p-3 border-b bg-white">
                      <div className="relative">
                        <Search
                          size={16}
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                        />
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
                          className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-200 text-sm
                                   focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent"
                        />
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="px-3 py-2 flex gap-2 bg-gray-50 border-b">
                      <button
                        onClick={() => setShowCreateGroup(true)}
                        className="flex-1 px-3 py-2 rounded-lg bg-white border border-gray-200 
                                 text-sm font-medium text-gray-700 hover:bg-gray-50 
                                 flex items-center justify-center gap-2 transition-all"
                      >
                        <MessageSquarePlus size={14} />
                        <span>New Group</span>
                      </button>
                    </div>

                    {/* Chats list */}
                    <div className="flex-1 overflow-y-auto">
                      {loadingChats ? (
                        <ChatListSkeleton count={6} />
                      ) : chats.length === 0 ? (
                        <div className="py-12 text-center">
                          <MessageCircle size={48} className="mx-auto text-gray-300 mb-3" />
                          <p className="text-sm text-gray-400">No conversations yet</p>
                          <p className="text-xs text-gray-400 mt-1">
                            Create a group to start chatting
                          </p>
                        </div>
                      ) : (
                        <div className="p-2 space-y-1">
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
                                  await loadConversationDetail(c.id);
                                }

                                setActiveChat(c);
                                activeChatRef.current = c;
                                await loadMessages(c.id);
                              }}
                              className="relative p-3 rounded-xl cursor-pointer 
                                       hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50
                                       transition-all duration-200 group"
                            >
                              <div className="flex items-center gap-3">
                                {c.avatar ? (
                                  <img
                                    src={c.avatar}
                                    alt={c.name}
                                    className="w-10 h-10 rounded-full object-cover ring-2 ring-gray-100 group-hover:ring-purple-200"
                                  />
                                ) : (
                                  <div className="w-10 h-10 rounded-full bg-purple-400 flex items-center justify-center text-white text-sm font-semibold ring-2 ring-gray-100 group-hover:ring-purple-200">
                                    {getInitials(c.name)}
                                  </div>
                                )}

                                <div className="flex-1 min-w-0">
                                  <div className="font-semibold text-sm text-gray-800 truncate">
                                    {c.name}
                                  </div>
                                  <div className="text-xs text-gray-400">
                                    {c.type === 2 ? 'Group' : ''}
                                  </div>
                                </div>

                                {c.time && (
                                  <span className="text-[10px] text-gray-400">{c.time}</span>
                                )}
                              </div>

                              {c.hasUnread && (
                                <span className="absolute top-3 right-3 w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* FRIENDS TAB */}
                {currentView === 'friends' && (
                  <div className="flex-1 overflow-hidden flex flex-col">
                    {/* Action buttons */}
                    <div className="px-3 py-2 flex gap-2 bg-gray-50 border-b">
                      <button
                        onClick={() => setShowAddFriend(true)}
                        className="flex-1 px-3 py-2 rounded-lg bg-white border border-gray-200 
                                 text-sm font-medium text-gray-700 hover:bg-gray-50 
                                 flex items-center justify-center gap-2 transition-all"
                      >
                        <UserPlus size={14} />
                        <span>Add Friend</span>
                      </button>
                    </div>

                    {/* Friends list */}
                    <div className="flex-1 overflow-y-auto">
                      {loadingFriends ? (
                        <ChatListSkeleton count={8} />
                      ) : friends.length === 0 ? (
                        <div className="py-12 text-center">
                          <Users size={48} className="mx-auto text-gray-300 mb-3" />
                          <p className="text-sm text-gray-400">No friends yet</p>
                          <p className="text-xs text-gray-400 mt-1">
                            Add friends to start chatting
                          </p>
                        </div>
                      ) : (
                        <div className="p-2 space-y-1">
                          {friends.map((f) => (
                            <div
                              key={f.id}
                              className="flex items-center gap-3 p-3 rounded-xl 
                                       hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50
                                       transition-all group"
                            >
                              <div className="relative">
                                {f.avatar ? (
                                  <img
                                    src={f.avatar}
                                    alt={f.name}
                                    className="w-10 h-10 rounded-full object-cover ring-2 ring-gray-100 group-hover:ring-purple-200"
                                  />
                                ) : (
                                  <div className="w-10 h-10 rounded-full bg-purple-400 flex items-center justify-center text-white text-sm font-semibold ring-2 ring-gray-100 group-hover:ring-purple-200">
                                    {getInitials(f.name)}
                                  </div>
                                )}

                                {f.online && (
                                  <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
                                )}
                              </div>

                              <div className="flex-1 min-w-0">
                                <div className="font-semibold text-sm text-gray-800 truncate">
                                  {f.name}
                                </div>
                                <div className="text-xs text-gray-400 truncate">{f.email}</div>
                              </div>

                              <div className="relative">
                                <button
                                  onClick={() => setOpenMenuId(openMenuId === f.id ? null : f.id)}
                                  className="p-1.5 rounded-lg hover:bg-white/80"
                                >
                                  <MoreVertical size={16} className="text-gray-400" />
                                </button>

                                {openMenuId === f.id && (
                                  <div className="absolute right-0 mt-1 w-32 rounded-lg bg-white border shadow-xl z-10">
                                    <button
                                      onClick={() => {
                                        setConfirmFriend(f);
                                        setOpenMenuId(null);
                                      }}
                                      className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-600 hover:bg-red-50 rounded-lg"
                                    >
                                      <UserMinus size={14} />
                                      Unfriend
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* USER INFO */}
          {!activeChat && (
            <div className="p-3 border-t bg-gradient-to-r from-blue-50 to-purple-50 flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-blue-500 flex items-center justify-center text-sm font-semibold text-white">
                {getInitials(user?.username)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-gray-800 truncate">
                  {user?.username || 'User'}
                </div>
                <div className="text-xs text-gray-500 truncate">{user?.email}</div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* MODALS */}
      {/* Add Friend Modal */}
      {showAddFriend && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={() => setShowAddFriend(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-800">Add Friend</h3>
              <button
                onClick={() => setShowAddFriend(false)}
                className="p-1 hover:bg-gray-100 rounded-lg"
              >
                <X size={18} className="text-gray-400" />
              </button>
            </div>

            <input
              value={friendEmail}
              onChange={(e) => setFriendEmail(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddFriend()}
              placeholder="Enter friend's email"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm 
                       focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent mb-4"
            />

            <div className="flex gap-3">
              <button
                onClick={() => setShowAddFriend(false)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAddFriend}
                disabled={adding || !friendEmail.trim()}
                className="flex-1 px-4 py-2.5 rounded-xl bg-blue-500
                         text-white text-sm font-medium disabled:opacity-50 hover:shadow-lg transition-all"
              >
                {adding ? 'Sending...' : 'Add Friend'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Group Modal */}
      {showCreateGroup && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={() => setShowCreateGroup(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-800">Create Group</h3>
              <button
                onClick={() => setShowCreateGroup(false)}
                className="p-1 hover:bg-gray-100 rounded-lg"
              >
                <X size={18} className="text-gray-400" />
              </button>
            </div>

            <input
              value={groupTitle}
              onChange={(e) => setGroupTitle(e.target.value)}
              placeholder="Group name"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm 
                       focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent mb-4"
            />

            <div className="text-xs font-semibold text-gray-500 mb-2 px-1">
              SELECT FRIENDS (Min. 2)
            </div>

            <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-xl p-2 mb-4">
              {friends.length === 0 ? (
                <div className="py-8 text-center text-sm text-gray-400">
                  You don't have any friends yet
                </div>
              ) : (
                <div className="space-y-1">
                  {friends.map((f) => (
                    <label
                      key={f.id}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer"
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
                        className="w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                      />

                      {f.avatar ? (
                        <img
                          src={f.avatar}
                          alt={f.name}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-purple-400 flex items-center justify-center text-white text-xs font-semibold">
                          {getInitials(f.name)}
                        </div>
                      )}

                      <span className="text-sm font-medium text-gray-700">{f.name}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowCreateGroup(false)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateGroup}
                disabled={creatingGroup || selectedFriendIds.length < 2 || !groupTitle.trim()}
                className="flex-1 px-4 py-2.5 rounded-xl bg-blue-500 
                         text-white text-sm font-medium disabled:opacity-50 hover:shadow-lg transition-all"
              >
                {creatingGroup ? 'Creating...' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Friend Requests Drawer */}
      {showRequestDrawer && (
        <div className="fixed inset-0 z-[60]">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowRequestDrawer(false)}
          />

          <div className="absolute right-0 top-0 h-full w-80 bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
            <div className="p-4 border-b bg-gradient-to-r from-blue-50 to-purple-50 flex items-center justify-between">
              <h3 className="font-bold text-gray-800">Friend Requests</h3>
              <button
                onClick={() => setShowRequestDrawer(false)}
                className="p-1 hover:bg-white/60 rounded-lg"
              >
                <X size={18} className="text-gray-600" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {loadingRequests ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500" />
                </div>
              ) : friendRequests.length === 0 ? (
                <div className="py-12 text-center">
                  <UsersRound size={48} className="mx-auto text-gray-300 mb-3" />
                  <p className="text-sm text-gray-400">No pending requests</p>
                </div>
              ) : (
                friendRequests.map((r) => (
                  <div
                    key={r.id}
                    className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-blue-50 to-purple-50 border border-purple-100"
                  >
                    <div className="w-10 h-10 rounded-full bg-purple-400 flex items-center justify-center text-white text-sm font-semibold">
                      {getInitials(r.requesterName)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-gray-800 truncate">
                        {r.requesterName || 'Unknown'}
                      </div>
                      <div className="text-xs text-gray-500">Wants to be friends</div>
                    </div>

                    <div className="flex flex-col gap-1">
                      <button
                        onClick={() => handleAcceptRequest(r.id)}
                        className="px-3 py-1 text-xs rounded-lg bg-green-500 text-white font-medium hover:bg-green-600"
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => handleRejectRequest(r.id)}
                        className="px-3 py-1 text-xs rounded-lg bg-gray-200 text-gray-600 font-medium hover:bg-gray-300"
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

      {/* Unfriend Confirmation Modal */}
      {confirmFriend && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold text-gray-800 mb-2">Unfriend</h3>
            <p className="text-sm text-gray-600 mb-6">
              Are you sure you want to unfriend{' '}
              <span className="font-semibold text-gray-800">{confirmFriend.name}</span>?
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setConfirmFriend(null)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmUnfriend}
                disabled={unfriending}
                className="flex-1 px-4 py-2.5 rounded-xl bg-red-500 text-white text-sm font-medium disabled:opacity-50 hover:bg-red-600"
              >
                {unfriending ? 'Removing...' : 'Unfriend'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showGroupMembers && activeChat?.type === 2 && (
        <div className="fixed inset-0 z-[60]">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setShowGroupMembers(false)}
          />

          <div className="absolute right-0 top-0 h-full w-80 bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
            {/* Header */}
            <div className="p-4 border-b flex items-center justify-between bg-gradient-to-r from-blue-50 to-purple-50">
              <div className="flex items-center gap-2">
                <Users size={18} />
                <span className="font-bold">Group Members</span>
              </div>
              <button onClick={() => setShowGroupMembers(false)}>
                <X size={18} />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {loadingMembers ? (
                <div className="flex justify-center py-6">
                  <div className="animate-spin w-6 h-6 border-b-2 border-purple-500 rounded-full" />
                </div>
              ) : (
                groupMembers.map((m) => (
                  <div
                    key={m.userId}
                    className="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50"
                  >
                    {m.avatar ? (
                      <img
                        src={m.avatar}
                        alt={m.userName}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-purple-400 text-white flex items-center justify-center font-semibold">
                        {getInitials(m.userName)}
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1">
                        <span className="font-semibold text-sm truncate">{m.userName}</span>

                        {m.role == 1 && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-yellow-100 text-yellow-700 font-semibold">
                            OWNER
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-gray-400 truncate">{m.email}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
