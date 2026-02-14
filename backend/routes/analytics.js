import express from 'express';
import Case from '../models/Case.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

// Get analytics for citizen
router.get('/citizen', verifyToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    const totalCases = await Case.countDocuments({ filedBy: userId });
    const casesByStatus = await Case.aggregate([
      { $match: { filedBy: userId } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    const resolvedCases = await Case.find({ filedBy: userId, status: 'resolved' });
    const avgResolutionTime = resolvedCases.length > 0
      ? resolvedCases.reduce((sum, c) => {
        const diff = new Date(c.updatedAt) - new Date(c.createdAt);
        return sum + diff;
      }, 0) / resolvedCases.length / (1000 * 60 * 60 * 24)
      : 0;

    res.json({
      totalCases,
        casesByStatus: Object.fromEntries(casesByStatus.map(s => [s._id, s.count])),
      avgResolutionTime: avgResolutionTime.toFixed(1),
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching analytics', error: error.message });
  }
});

// Get analytics for police
router.get('/police', verifyToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    const totalCases = await Case.countDocuments({ assignedPolice: userId });
    const pendingCases = await Case.countDocuments({
      assignedPolice: userId,
      status: { $in: ['filed', 'under-investigation'] },
    });
    const completedCases = await Case.countDocuments({
      assignedPolice: userId,
      status: 'in-court',
    });
    
    const casesByType = await Case.aggregate([
      { $match: { assignedPolice: userId } },
      { $group: { _id: '$type', count: { $sum: 1 } } },
    ]);

    res.json({
      totalCases,
      pendingCases,
      completedCases,
      completionRate: totalCases > 0 ? ((completedCases / totalCases) * 100).toFixed(1) : 0,
      casesByType: Object.fromEntries(casesByType.map(c => [c._id, c.count])),
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching analytics', error: error.message });
  }
});

// Get analytics for lawyer
router.get('/lawyer', verifyToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    const totalCases = await Case.countDocuments({ assignedLawyer: userId });
     const activeCases = await Case.countDocuments({
      assignedLawyer: userId,
      status: { $in: ['under-investigation', 'in-court'] },
    });
    const resolvedCases = await Case.countDocuments({
      assignedLawyer: userId,
      status: 'resolved',
    });

    const casesByType = await Case.aggregate([
      { $match: { assignedLawyer: userId } },
      { $group: { _id: '$type', count: { $sum: 1 } } },
    ]);

    res.json({
      totalCases,
      activeCases,
      resolvedCases,
      winRate: totalCases > 0 ? ((resolvedCases / totalCases) * 100).toFixed(1) : 0,
      casesByType: Object.fromEntries(casesByType.map(c => [c._id, c.count])),
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching analytics', error: error.message });
  }
});

// Get analytics for judge
router.get('/judge', verifyToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    const totalCases = await Case.countDocuments({ assignedJudge: userId });
    const pendingCases = await Case.countDocuments({
      assignedJudge: userId,
      status: { $ne: 'resolved' },
    });
    const completedCases = await Case.countDocuments({
      assignedJudge: userId,
      status: 'resolved',
    });

    const resolvedCases = await Case.find({
      assignedJudge: userId,
      status: 'resolved',
    });

    const avgDuration = resolvedCases.length > 0
      ? resolvedCases.reduce((sum, c) => {
        const diff = new Date(c.updatedAt) - new Date(c.createdAt);
        return sum + diff;
      }, 0) / resolvedCases.length / (1000 * 60 * 60 * 24)
      : 0;

    res.json({
      totalCases,
      pendingCases,
      completedCases,
      avgDuration: avgDuration.toFixed(1),
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching analytics', error: error.message });
  }
});

export default router;
