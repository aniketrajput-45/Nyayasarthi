import mongoose from 'mongoose';

const chatMessageSchema = new mongoose.Schema({
  roomId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ChatRoom',
    required: true,
  },
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  read: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const chatRoomSchema = new mongoose.Schema({
  caseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Case',
    default: null,
  },
  participant1: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  participant2: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  lastMessage: String,
  lastMessageTime: Date,
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export const ChatMessage = mongoose.model('ChatMessage', chatMessageSchema);
export const ChatRoom = mongoose.model('ChatRoom', chatRoomSchema);
