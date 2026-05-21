import FocusLog from '../models/FocusLog.js';
import User from '../models/User.js';

// Level up calculation helper
const calculateLevel = (xp) => {
  // L = floor(sqrt(XP / 100)) + 1
  return Math.floor(Math.sqrt(xp / 100)) + 1;
};

// Badges system helper
const checkAndAwardBadges = (user, totalFocusSeconds) => {
  const newBadges = [...user.badges];
  
  // Focus duration badges
  if (totalFocusSeconds >= 3600 && !newBadges.includes('focus_1h')) {
    newBadges.push('focus_1h');
  }
  if (totalFocusSeconds >= 18000 && !newBadges.includes('focus_5h')) {
    newBadges.push('focus_5h');
  }
  if (totalFocusSeconds >= 36000 && !newBadges.includes('focus_10h')) {
    newBadges.push('focus_10h');
  }

  // Streak badges
  if (user.streak >= 3 && !newBadges.includes('streak_3d')) {
    newBadges.push('streak_3d');
  }
  if (user.streak >= 7 && !newBadges.includes('streak_7d')) {
    newBadges.push('streak_7d');
  }
  if (user.streak >= 14 && !newBadges.includes('streak_14d')) {
    newBadges.push('streak_14d');
  }

  return newBadges;
};

// @desc    Log a completed focus session
// @route   POST /api/focus/log
// @access  Private
export const logFocusSession = async (req, res) => {
  const { duration, subject } = req.body; // duration in seconds

  if (!duration || duration <= 0) {
    return res.status(400).json({ message: 'Invalid session duration' });
  }

  try {
    // Create Focus Log
    const focusLog = await FocusLog.create({
      user: req.user._id,
      duration,
      subject: subject || 'General',
    });

    // Update User XP, Level, and Badges
    const user = await User.findById(req.user._id);
    
    // Award 1 XP per minute of study (minimum 1 XP)
    const xpEarned = Math.max(1, Math.floor(duration / 60));
    user.xp += xpEarned;

    // Check level up
    const newLevel = calculateLevel(user.xp);
    const leveledUp = newLevel > user.level;
    user.level = newLevel;

    // Get all focus logs for this user to check total focus time
    const userLogs = await FocusLog.find({ user: user._id });
    const totalFocusSeconds = userLogs.reduce((acc, log) => acc + log.duration, 0);

    // Check and award badges
    const updatedBadges = checkAndAwardBadges(user, totalFocusSeconds);
    
    let badgeEarned = null;
    if (updatedBadges.length > user.badges.length) {
      // Find the new badge(s)
      badgeEarned = updatedBadges.find(b => !user.badges.includes(b));
      user.badges = updatedBadges;
    }

    user.lastActive = new Date();
    await user.save();

    res.status(201).json({
      message: 'Focus session logged successfully',
      focusLog,
      xpEarned,
      newXp: user.xp,
      newLevel: user.level,
      leveledUp,
      badgeEarned,
      badges: user.badges,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get focus statistics for graphs
// @route   GET /api/focus/stats
// @access  Private
export const getFocusStats = async (req, res) => {
  try {
    // Get logs in the last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const logs = await FocusLog.find({
      user: req.user._id,
      createdAt: { $gte: sevenDaysAgo },
    });

    // 1. Weekly study hours breakdown (by day of the week)
    const dailyHours = Array(7).fill(0); // [Sun, Mon, Tue, Wed, Thu, Fri, Sat]
    const weekdayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    // Map logs to days
    logs.forEach(log => {
      const dayIndex = new Date(log.createdAt).getDay();
      dailyHours[dayIndex] += log.duration / 3600; // convert seconds to hours
    });

    // Rearrange starting from 6 days ago to today
    const chartLabels = [];
    const chartData = [];
    const today = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      const idx = d.getDay();
      chartLabels.push(weekdayNames[idx]);
      chartData.push(parseFloat(dailyHours[idx].toFixed(2)));
    }

    // 2. Subject progress breakdown (doughnut chart)
    const allLogs = await FocusLog.find({ user: req.user._id });
    const subjectMinutes = {};
    
    allLogs.forEach(log => {
      const sub = log.subject || 'General';
      subjectMinutes[sub] = (subjectMinutes[sub] || 0) + Math.floor(log.duration / 60);
    });

    const subjects = Object.keys(subjectMinutes);
    const subjectTimes = Object.values(subjectMinutes);

    // 3. Overall summary metrics
    const totalFocusSeconds = allLogs.reduce((acc, log) => acc + log.duration, 0);
    
    res.json({
      weeklyHours: {
        labels: chartLabels,
        data: chartData,
      },
      subjectBreakdown: {
        labels: subjects,
        data: subjectTimes,
      },
      summary: {
        totalHours: parseFloat((totalFocusSeconds / 3600).toFixed(1)),
        sessionsCount: allLogs.length,
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
