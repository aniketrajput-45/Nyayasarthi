import express from 'express';
import { ChatMessage, ChatRoom } from '../models/Chat.js';
import Case from '../models/Case.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

// ----- Case-based chat: one thread per (case + participant pair) -----

function getCaseParticipantIds(caseDoc) {
  const ids = new Set();
  if (caseDoc.filedBy) ids.add(caseDoc.filedBy.toString());
  if (caseDoc.assignedPolice) ids.add(caseDoc.assignedPolice.toString());
  if (caseDoc.assignedLawyer) ids.add(caseDoc.assignedLawyer.toString());
  if (caseDoc.assignedJudge) ids.add(caseDoc.assignedJudge.toString());
  return ids;
}

function canAccessCase(caseDoc, userId) {
  return getCaseParticipantIds(caseDoc).has(userId);
}

// Find or create room for case + two participants (order normalized)
async function getOrCreateThreadRoom(caseId, participantA, participantB) {
  const [p1, p2] = [participantA, participantB].sort();
  let room = await ChatRoom.findOne({
    caseId,
    $or: [
      { participant1: p1, participant2: p2 },
      { participant1: p2, participant2: p1 },
    ],
  });
  if (!room) {
    room = new ChatRoom({
      caseId,
      participant1: p1,
      participant2: p2,
    });
    await room.save();
  }
  return room;
}

// Get messages for a case thread (with specific other participant)
router.get('/case/:caseId/thread/:otherParticipantId/messages', verifyToken, async (req, res) => {
  try {
    const caseDoc = await Case.findById(req.params.caseId);
    if (!caseDoc) return res.status(404).json({ message: 'Case not found' });

    const userId = req.user.userId;
    const otherId = req.params.otherParticipantId;

    // For simplicity, allow any authenticated user to open the chat
    // as long as the other participant belongs to this case.
    if (!canAccessCase(caseDoc, otherId)) {
      return res.status(403).json({ message: 'Other participant does not have access to this case' });
    }

    const room = await ChatRoom.findOne({
      caseId: req.params.caseId,
      $or: [
        { participant1: userId, participant2: otherId },
        { participant1: otherId, participant2: userId },
      ],
    });
    if (!room) return res.json([]);

    const messages = await ChatMessage.find({ roomId: room._id })
      .populate('senderId', 'fullName email')
      .sort({ createdAt: 1 })
      .limit(200);
    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching messages', error: error.message });
  }
});

// Send message in a case thread
router.post('/case/:caseId/thread/:otherParticipantId/message', verifyToken, async (req, res) => {
  try {
    const { message } = req.body;
    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({ message: 'Message is required' });
    }

    const caseDoc = await Case.findById(req.params.caseId);
    if (!caseDoc) return res.status(404).json({ message: 'Case not found' });

    const userId = req.user.userId;
    const otherId = req.params.otherParticipantId;

    // For simplicity, allow any authenticated user to send messages
    // as long as the other participant belongs to this case.
    if (!canAccessCase(caseDoc, otherId)) {
      return res.status(403).json({ message: 'Other participant does not have access to this case' });
    }

    const room = await getOrCreateThreadRoom(req.params.caseId, userId, otherId);

    const newMessage = new ChatMessage({
      roomId: room._id,
      senderId: userId,
      message: message.trim(),
    });
    await newMessage.save();

    await ChatRoom.findByIdAndUpdate(room._id, {
      lastMessage: message.trim(),
      lastMessageTime: new Date(),
    });

    const populated = await ChatMessage.findById(newMessage._id).populate('senderId', 'fullName email');
    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: 'Error sending message', error: error.message });
  }
});

// Legacy: single room per case (kept for backward compat; prefer thread API)
router.get('/case/:caseId/room', verifyToken, async (req, res) => {
  try {
    const caseDoc = await Case.findById(req.params.caseId);
    if (!caseDoc) return res.status(404).json({ message: 'Case not found' });
    const userId = req.user.userId;
    if (!canAccessCase(caseDoc, userId)) return res.status(403).json({ message: 'No access' });
    const otherId = caseDoc.assignedLawyer?.toString() || caseDoc.filedBy?.toString();
    if (!otherId) return res.status(400).json({ message: 'No other participant' });
    const room = await getOrCreateThreadRoom(req.params.caseId, userId, otherId);
    res.json(room);
  } catch (error) {
    res.status(500).json({ message: 'Error getting room', error: error.message });
  }
});

router.get('/case/:caseId/messages', verifyToken, async (req, res) => {
  try {
    const caseDoc = await Case.findById(req.params.caseId);
    if (!caseDoc) return res.status(404).json({ message: 'Case not found' });
    const userId = req.user.userId;
    if (!canAccessCase(caseDoc, userId)) return res.status(403).json({ message: 'No access' });
    const otherId = caseDoc.assignedLawyer?.toString() || caseDoc.filedBy?.toString();
    if (!otherId) return res.json([]);
    const room = await ChatRoom.findOne({ caseId: req.params.caseId, $or: [{ participant1: userId, participant2: otherId }, { participant1: otherId, participant2: userId }] });
    if (!room) return res.json([]);
    const messages = await ChatMessage.find({ roomId: room._id }).populate('senderId', 'fullName email').sort({ createdAt: 1 }).limit(200);
    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching messages', error: error.message });
  }
});

router.post('/case/:caseId/message', verifyToken, async (req, res) => {
  try {
    const { message } = req.body;
    if (!message || typeof message !== 'string' || !message.trim()) return res.status(400).json({ message: 'Message is required' });
    const caseDoc = await Case.findById(req.params.caseId);
    if (!caseDoc) return res.status(404).json({ message: 'Case not found' });
    const userId = req.user.userId;
    if (!canAccessCase(caseDoc, userId)) return res.status(403).json({ message: 'No access' });
    const otherId = caseDoc.assignedLawyer?.toString() || caseDoc.filedBy?.toString();
    if (!otherId) return res.status(400).json({ message: 'No other participant' });
    const room = await getOrCreateThreadRoom(req.params.caseId, userId, otherId);
    const newMessage = new ChatMessage({ roomId: room._id, senderId: userId, message: message.trim() });
    await newMessage.save();
    await ChatRoom.findByIdAndUpdate(room._id, { lastMessage: message.trim(), lastMessageTime: new Date() });
    const populated = await ChatMessage.findById(newMessage._id).populate('senderId', 'fullName email');
    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: 'Error sending message', error: error.message });
  }
});

// Get or create chat room
router.post('/room', verifyToken, async (req, res) => {
  try {
    const { participant2 } = req.body;
    const participant1 = req.user.userId;

    let room = await ChatRoom.findOne({
      $or: [
        { participant1, participant2 },
        { participant1: participant2, participant2: participant1 },
      ],
    });

    if (!room) {
      room = new ChatRoom({
        participant1,
        participant2,
      });
      await room.save();
    }

    res.json(room);
  } catch (error) {
    res.status(500).json({ message: 'Error managing chat room', error: error.message });
  }
});

// Get chat messages
router.get('/messages/:roomId', verifyToken, async (req, res) => {
  try {
    const messages = await ChatMessage.find({ roomId: req.params.roomId })
      .populate('senderId', 'fullName email profileImage')
      .sort({ createdAt: 1 })
      .limit(100);

    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching messages', error: error.message });
  }
});

// Send message
router.post('/message', verifyToken, async (req, res) => {
  try {
    const { roomId, message } = req.body;

    const newMessage = new ChatMessage({
      roomId,
      senderId: req.user.userId,
      message,
    });

    await newMessage.save();

    // Update room's last message
    await ChatRoom.findByIdAndUpdate(
      roomId,
      {
        lastMessage: message,
        lastMessageTime: new Date(),
      }
    );

    res.status(201).json(newMessage);
  } catch (error) {
    res.status(500).json({ message: 'Error sending message', error: error.message });
  }
});

// Get user's chat rooms
router.get('/rooms/user/:userId', verifyToken, async (req, res) => {
  try {
    const rooms = await ChatRoom.find({
      $or: [
        { participant1: req.user.userId },
        { participant2: req.user.userId },
      ],
    })
      .populate('participant1', 'fullName email profileImage')
      .populate('participant2', 'fullName email profileImage')
      .sort({ lastMessageTime: -1 });

    res.json(rooms);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching rooms', error: error.message });
  }
});

// Mark messages as read
router.put('/message/:messageId/read', verifyToken, async (req, res) => {
  try {
    await ChatMessage.findByIdAndUpdate(req.params.messageId, { read: true });
    res.json({ message: 'Message marked as read' });
  } catch (error) {
    res.status(500).json({ message: 'Error marking message', error: error.message });
  }
});

export default router;
