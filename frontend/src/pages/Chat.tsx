import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Send, MessageSquare, Search, AlertCircle } from 'lucide-react';
import io, { Socket } from 'socket.io-client';

interface ChatRoom {
  _id: string;
  participant1: any;
  participant2: any;
  lastMessage: string;
  lastMessageTime: string;
}

interface ChatMessage {
  _id: string;
  message: string;
  senderId: string;
  createdAt: string;
}

interface User {
  _id: string;
  fullName: string;
  email: string;
  role: string;
}

export const Chat: React.FC = () => {
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<ChatRoom | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [messageText, setMessageText] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    socketRef.current = io(import.meta.env.VITE_SOCKET_URL, {
      auth: { token },
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, [token]);

  useEffect(() => {
    const fetchRoomsAndUsers = async () => {
      try {
        const [roomsRes, usersRes] = await Promise.all([
          fetch(`${import.meta.env.VITE_API_URL}/chat/rooms/user/${user?._id}`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${import.meta.env.VITE_API_URL}/users`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        if (roomsRes.ok) {
          setRooms(await roomsRes.json());
        }
        if (usersRes.ok) {
          const allUsers = await usersRes.json();
          setUsers(allUsers.filter((u: User) => u._id !== user?._id));
        }
      } catch (err) {
        setError('Failed to load chat data');
      } finally {
        setLoading(false);
      }
    };

     fetchRoomsAndUsers();
  }, [token, user?._id]);

  useEffect(() => {
    if (selectedRoom && socketRef.current) {
      const fetchMessages = async () => {
        try {
          const response = await fetch(
            `${import.meta.env.VITE_API_URL}/chat/messages/${selectedRoom._id}`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          if (response.ok) {
            setMessages(await response.json());
          }
        } catch (err) {
          console.error('Failed to fetch messages');
        }
      };

      fetchMessages();
      socketRef.current.emit('join_room', selectedRoom._id);
    }
  }, [selectedRoom, token]);

  useEffect(() => {
    if (socketRef.current) {
      socketRef.current.on('receive_message', (data) => {
        setMessages((prev) => [...prev, data]);
      });

      return () => {
        socketRef.current?.off('receive_message');
      };
    }
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || !selectedRoom) return;

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/chat/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          roomId: selectedRoom._id,
          message: messageText,
        }),
      });
if (response.ok) {
        const newMessage = await response.json();
        socketRef.current?.emit('send_message', {
          ...newMessage,
          roomId: selectedRoom._id,
        });
        setMessageText('');
      }
    } catch (err) {
      console.error('Failed to send message');
    }
  };

  const handleSelectUser = async (targetUser: User) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/chat/room`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ participant2: targetUser._id }),
      });

       if (response.ok) {
        const room = await response.json();
        setSelectedRoom(room);
        setSearchQuery('');
      }
    } catch (err) {
      console.error('Failed to create/fetch room');
    }
  };

  const filteredUsers = users.filter(
    (u) =>
      u.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return <div className="p-8">Loading chat...</div>;
  }

  return (
    <div className="p-8">
      <h2 className="text-3xl font-bold text-slate-900 mb-8">Messages</h2>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}
 <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
        <div className="lg:col-span-1 bg-white rounded-lg shadow flex flex-col">
          <div className="p-4 border-b border-slate-200">
            <h3 className="font-semibold text-slate-900 mb-3">Contacts</h3>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search contacts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {searchQuery ? (
              <div className="p-2 space-y-1">
                {filteredUsers.map((u) => (
                  <button
                    key={u._id}
                    onClick={() => handleSelectUser(u)}
                    className="w-full text-left p-3 hover:bg-slate-100 rounded-lg transition"
                  >
                    <p className="font-medium text-slate-900 text-sm">{u.fullName}</p>
                    <p className="text-xs text-slate-600 capitalize">{u.role}</p>
                  </button>
                ))}

                 </div>
            ) : (
              <div className="p-4 space-y-2">
                {rooms.map((room) => {
                  const otherUser =
                    room.participant1._id === user?._id ? room.participant2 : room.participant1;
                  return (
                    <button
                      key={room._id}
                      onClick={() => setSelectedRoom(room)}
                      className={`w-full text-left p-3 rounded-lg transition ${
                        selectedRoom?._id === room._id
                          ? 'bg-blue-100 border-2 border-blue-600'
                          : 'hover:bg-slate-100'
                      }`}
                    >
                      <p className="font-medium text-slate-900 text-sm">{otherUser.fullName}</p>
                      <p className="text-xs text-slate-600 truncate">{room.lastMessage}</p>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>


        <div className="lg:col-span-2 bg-white rounded-lg shadow flex flex-col">
          {selectedRoom ? (
            <>
              <div className="p-4 border-b border-slate-200">
                <h3 className="font-semibold text-slate-900">
                  {selectedRoom.participant1._id === user?._id
                    ? selectedRoom.participant2.fullName
                    : selectedRoom.participant1.fullName}
                </h3>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg) => (
                  <div
                    key={msg._id}
                    className={`flex ${
                      msg.senderId === user?._id ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    <div
                      className={`max-w-xs px-4 py-2 rounded-lg ${
                        msg.senderId === user?._id
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-100 text-slate-900'
                      }`}
                    >
                      <p className="text-sm">{msg.message}</p>
                      <p
                        className={`text-xs mt-1 ${
                          msg.senderId === user?._id
                            ? 'text-blue-100'
                            : 'text-slate-600'
                        }`}
                      >
                        {new Date(msg.createdAt).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
 <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-200 flex gap-2">
                <input
                  type="text"
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition flex items-center gap-2"
                >
                  <Send size={18} />
                </button>
              </form>
            </>
          ) : (
            <div className="flex items-center justify-center h-full text-slate-600">
              <div className="text-center">
                <MessageSquare className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                <p>Select a contact or start a new conversation</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
