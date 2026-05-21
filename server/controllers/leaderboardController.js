import User from '../models/User.js';

// @desc    Get top users ranked by XP
// @route   GET /api/leaderboard
// @access  Private
export const getLeaderboard = async (req, res) => {
  try {
    const topUsers = await User.find()
      .select('name email xp level streak badges')
      .sort({ xp: -1 })
      .limit(10);

    // Find the position of the current user on the leaderboard
    const allUsersSorted = await User.find().select('_id').sort({ xp: -1 });
    const userRank = allUsersSorted.findIndex(u => u._id.toString() === req.user._id.toString()) + 1;

    res.json({
      leaderboard: topUsers,
      currentUserRank: userRank,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
