import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Trophy, Award, Sparkles, Flame, ShieldAlert } from 'lucide-react';

const Leaderboard = () => {
  const { user } = useAuth();
  const [leaderboard, setLeaderboard] = useState([]);
  const [currentUserRank, setCurrentUserRank] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchLeaderboard = async () => {
    try {
      const data = await api.get('/leaderboard');
      setLeaderboard(data.leaderboard || []);
      setCurrentUserRank(data.currentUserRank || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
  }, [user]);

  // Extract top 3 and others
  const topThree = leaderboard.slice(0, 3);
  const otherUsers = leaderboard.slice(3);

  // Rearrange top 3 for classic podium: [2nd, 1st, 3rd]
  const podiumOrder = [];
  if (topThree[1]) podiumOrder.push({ ...topThree[1], pos: 2 });
  if (topThree[0]) podiumOrder.push({ ...topThree[0], pos: 1 });
  if (topThree[2]) podiumOrder.push({ ...topThree[2], pos: 3 });

  const getPodiumStyles = (pos) => {
    if (pos === 1) return {
      height: 'h-28 sm:h-36 md:h-40',
      podiumBg: 'bg-gradient-to-t from-yellow-600/30 to-yellow-500/25 border-yellow-500/50 shadow-neon-cyan',
      badgeColor: 'text-yellow-400',
      badgeText: 'GOLD'
    };
    if (pos === 2) return {
      height: 'h-20 sm:h-28 md:h-32',
      podiumBg: 'bg-gradient-to-t from-slate-500/25 to-slate-400/20 border-slate-400/40',
      badgeColor: 'text-slate-300',
      badgeText: 'SILVER'
    };
    return {
      height: 'h-16 sm:h-20 md:h-24',
      podiumBg: 'bg-gradient-to-t from-amber-700/25 to-amber-600/20 border-amber-600/40',
      badgeColor: 'text-amber-500',
      badgeText: 'BRONZE'
    };
  };

  return (
    <div className="flex-1 min-h-screen bg-brand-bg px-4 md:px-8 py-6 md:py-8 relative flex">
      {/* Background glow */}
      <div className="absolute top-1/3 left-1/4 w-96 h-96 bg-brand-accent/5 rounded-full blur-[140px] pointer-events-none" />

      <div className="flex-1 max-w-4xl mx-auto flex flex-col justify-between">
        
        {/* Header */}
        <div className="flex items-center gap-3.5 mb-8">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-accent to-brand-neonCyan flex items-center justify-center shadow-glass-glow text-white animate-float">
            <Trophy className="w-5 h-5 fill-current" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold text-brand-text tracking-wide">
              Global Leaderboard
            </h1>
            <p className="text-brand-textMuted text-sm mt-0.5">
              Compete with learners worldwide. Earn XP by focusing and completing AI quizzes.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-20 text-brand-textMuted flex-1">Loading leaderboard rankings...</div>
        ) : (
          <div className="flex-1 flex flex-col gap-8">
            
            {/* 1. TOP 3 PODIUM */}
            {podiumOrder.length > 0 && (
              <div className="flex items-end justify-center gap-2 sm:gap-6 mt-6 mb-4">
                {podiumOrder.map((u) => {
                  const { height, podiumBg, badgeColor, badgeText } = getPodiumStyles(u.pos);
                  return (
                    <div 
                      key={u._id}
                      className="flex flex-col items-center select-none w-28 sm:w-36 md:w-48 text-center"
                    >
                      {/* Avatar */}
                      <div className="relative mb-3.5 flex flex-col items-center">
                        <div className={`w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-full bg-brand-accent/15 border border-brand-accent/40 flex items-center justify-center text-xs sm:text-base md:text-lg font-black text-brand-text ${u.pos === 1 ? 'w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 text-sm sm:text-lg md:text-xl shadow-glass' : ''}`}>
                          {u.name.charAt(0).toUpperCase()}
                        </div>
                        <span className={`absolute -top-3 px-1.5 sm:px-2 py-0.5 rounded-full text-[8px] sm:text-[9px] font-black border uppercase tracking-wider ${podiumBg} ${badgeColor}`}>
                          {badgeText}
                        </span>
                      </div>

                      {/* Username */}
                      <span className="text-[10px] sm:text-xs font-bold text-brand-text truncate max-w-[80px] sm:max-w-[120px] md:max-w-[150px] block">{u.name}</span>
                      <span className="text-[9px] sm:text-[10px] text-brand-textMuted mt-0.5">{u.xp} XP</span>

                      {/* Podium Stand */}
                      <div className={`w-full ${height} rounded-t-2xl border-t border-x mt-4 flex items-center justify-center ${podiumBg}`}>
                        <span className={`text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tighter ${badgeColor}`}>#{u.pos}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* 2. REMAINING RANKS LIST */}
            <div className="glass-panel rounded-3xl p-6 flex-1 flex flex-col gap-2.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-brand-textMuted ml-1 mb-2">
                Ranking Standings
              </h3>
              
              {otherUsers.length === 0 && podiumOrder.length === 0 ? (
                <div className="text-center text-xs text-brand-textMuted py-8">
                  No rankings logged yet. Be the first!
                </div>
              ) : (
                <div className="flex flex-col gap-2.5 max-h-[300px] overflow-y-auto pr-1">
                  {otherUsers.map((u, index) => {
                    const actualRank = index + 4;
                    const isMe = u._id === user?._id;
                    return (
                      <div
                        key={u._id}
                        className={`flex items-center justify-between p-3.5 rounded-xl border transition-all duration-300 ${
                          isMe 
                            ? 'bg-brand-accent/20 border-brand-accent/50 text-brand-text shadow-glass' 
                            : 'bg-brand-surface/40 border-brand-accent/5 text-brand-textMuted'
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <span className="w-6 text-center text-xs font-extrabold text-brand-text">#{actualRank}</span>
                          <div className="w-8 h-8 rounded-full bg-brand-accent/10 border border-brand-accent/20 flex items-center justify-center font-bold text-xs text-brand-text">
                            {u.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <span className="text-xs font-bold text-brand-text">{u.name}</span>
                            <span className="text-[9px] text-brand-textMuted ml-2">Level {u.level}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-1 text-[10px] text-brand-neonPink font-bold">
                            <Flame className="w-3.5 h-3.5 fill-current" />
                            <span>{u.streak}d</span>
                          </div>
                          <span className="text-xs font-black text-brand-text">{u.xp} XP</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Current user positioning banner at the bottom */}
            {currentUserRank > 0 && (
              <div className="p-4 rounded-2xl bg-gradient-to-r from-brand-accent/25 to-brand-bg border border-brand-accent/35 flex flex-col sm:flex-row gap-3 items-center justify-between shadow-glass mt-2 select-none animate-pulse-glow">
                <div className="flex items-center gap-3">
                  <Award className="w-5 h-5 text-brand-neonCyan" />
                  <span className="text-xs font-semibold text-brand-text text-center sm:text-left">Your Standing Position: <span className="text-brand-neonCyan font-black">Rank #{currentUserRank}</span></span>
                </div>
                <span className="text-[10px] uppercase font-bold tracking-widest text-brand-textMuted">Level {user?.level} • {user?.xp} XP</span>
              </div>
            )}

          </div>
        )}

      </div>
    </div>
  );
};

export default Leaderboard;
