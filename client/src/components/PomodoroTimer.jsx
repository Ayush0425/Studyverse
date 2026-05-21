import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Maximize2, Minimize2, CheckCircle, Volume2, VolumeX, BookOpen } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import confetti from 'canvas-confetti';

const PomodoroTimer = ({ compact = false, defaultSubject = 'General', onSessionCompleted }) => {
  const { user, refreshProfile } = useAuth();
  
  // Timer States
  const [secondsLeft, setSecondsLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [mode, setMode] = useState('focus'); // 'focus', 'shortBreak', 'longBreak'
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [subject, setSubject] = useState(defaultSubject);
  const [soundEnabled, setSoundEnabled] = useState(true);
  
  // XP & Level-up states
  const [xpReward, setXpReward] = useState(null);
  const [levelUpNotice, setLevelUpNotice] = useState(false);

  // Audio references
  const completionAudio = useRef(null);

  // Constants
  const MODE_SETTINGS = {
    focus: { time: 25 * 60, label: 'Focus Time', color: 'text-brand-neonPurple', border: 'border-brand-neonPurple/30' },
    shortBreak: { time: 5 * 60, label: 'Short Break', color: 'text-brand-neonCyan', border: 'border-brand-neonCyan/30' },
    longBreak: { time: 15 * 60, label: 'Long Break', color: 'text-brand-neonPink', border: 'border-brand-neonPink/30' }
  };

  useEffect(() => {
    // Set timer based on mode
    setSecondsLeft(MODE_SETTINGS[mode].time);
    setIsRunning(false);
  }, [mode]);

  useEffect(() => {
    let interval = null;
    if (isRunning && secondsLeft > 0) {
      interval = setInterval(() => {
        setSecondsLeft((prev) => prev - 1);
      }, 1000);
    } else if (isRunning && secondsLeft === 0) {
      handleTimerComplete();
    }
    return () => clearInterval(interval);
  }, [isRunning, secondsLeft]);

  const handleTimerComplete = async () => {
    setIsRunning(false);
    
    // Play chime sound
    if (soundEnabled && completionAudio.current) {
      completionAudio.current.play().catch(e => console.log("Audio play failed:", e));
    }

    // Explode confetti!
    confetti({
      particleCount: 150,
      spread: 80,
      origin: { y: 0.6 }
    });

    if (mode === 'focus') {
      try {
        const duration = MODE_SETTINGS.focus.time;
        const res = await api.post('/focus/log', { duration, subject });
        
        setXpReward(res.xpEarned);
        if (res.leveledUp) {
          setLevelUpNotice(true);
        }
        
        // Refresh Auth Context User details
        await refreshProfile();
        
        if (onSessionCompleted) {
          onSessionCompleted(res);
        }
      } catch (err) {
        console.error('Failed to log study session:', err);
      }
    }

    // Auto-transition to next state
    if (mode === 'focus') {
      setMode('shortBreak');
    } else {
      setMode('focus');
    }
  };

  const toggleTimer = () => setIsRunning(!isRunning);

  const resetTimer = () => {
    setIsRunning(false);
    setSecondsLeft(MODE_SETTINGS[mode].time);
  };

  const formatTime = (totalSeconds) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progressPercent = ((MODE_SETTINGS[mode].time - secondsLeft) / MODE_SETTINGS[mode].time) * 100;

  // Render Compact view (for sidebar widget or dashboard item)
  if (compact) {
    return (
      <div className="glass-panel p-6 rounded-2xl flex flex-col gap-4 relative overflow-hidden">
        <audio ref={completionAudio} src="https://assets.mixkit.co/active_storage/sfx/2568/2568-84.wav" preload="auto" />
        
        <div className="flex justify-between items-center">
          <span className="text-xs uppercase tracking-wider font-semibold text-brand-textMuted">
            Focus Session
          </span>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setSoundEnabled(!soundEnabled)} 
              className="text-brand-textMuted hover:text-brand-text transition-colors"
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4 text-brand-neonPink" />}
            </button>
            <span className={`text-xs px-2 py-0.5 rounded-full font-bold border ${MODE_SETTINGS[mode].border} ${MODE_SETTINGS[mode].color}`}>
              {MODE_SETTINGS[mode].label}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-4xl font-extrabold font-mono text-brand-text tracking-widest">
              {formatTime(secondsLeft)}
            </span>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="What are you studying?"
              className="bg-transparent border-b border-transparent hover:border-brand-accent/25 focus:border-brand-accent text-xs mt-1 text-brand-textMuted focus:text-brand-text focus:outline-none w-36 transition-colors"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={toggleTimer}
              className={`p-3 rounded-full flex items-center justify-center transition-all ${
                isRunning 
                  ? 'bg-brand-neonPink/20 text-brand-neonPink border border-brand-neonPink/30' 
                  : 'bg-brand-accent/20 text-brand-neonPurple border border-brand-accent/30 hover:scale-105'
              }`}
            >
              {isRunning ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
            </button>
            <button
              onClick={resetTimer}
              className="p-3 rounded-full bg-brand-surface border border-brand-accent/15 text-brand-textMuted hover:text-brand-text transition-colors"
            >
              <RotateCcw className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-1 bg-brand-bg rounded-full overflow-hidden">
          <div 
            className={`h-full transition-all duration-1000 ${
              mode === 'focus' ? 'bg-brand-neonPurple' : mode === 'shortBreak' ? 'bg-brand-neonCyan' : 'bg-brand-neonPink'
            }`} 
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* XP Reward Notification */}
        {xpReward && (
          <div className="absolute inset-0 bg-brand-surface/95 flex flex-col items-center justify-center gap-2 z-10 animate-fade-in p-4 text-center">
            <CheckCircle className="w-8 h-8 text-brand-neonCyan shadow-neon-cyan" />
            <h4 className="font-bold text-sm text-brand-text">Session Finished!</h4>
            <p className="text-xs text-brand-textMuted">You earned <span className="text-brand-neonCyan font-bold">+{xpReward} XP</span> for studying {subject}.</p>
            <button 
              onClick={() => setXpReward(null)} 
              className="mt-2 text-[10px] uppercase font-bold text-brand-neonPurple hover:text-brand-text"
            >
              Continue
            </button>
          </div>
        )}
      </div>
    );
  }

  // Full Screen/Focus Mode View
  return (
    <div className={`
      ${isFullscreen 
        ? 'fixed inset-0 bg-brand-bg z-50 flex flex-col items-center justify-center p-8' 
        : 'glass-panel p-8 rounded-3xl relative overflow-hidden flex flex-col items-center justify-center'
      }
    `}>
      <audio ref={completionAudio} src="https://assets.mixkit.co/active_storage/sfx/2568/2568-84.wav" preload="auto" />
      
      {/* Floating stars or animation in background for Fullscreen focus mode */}
      {isFullscreen && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-accent/5 rounded-full blur-[120px] animate-pulse-glow" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-brand-neonCyan/5 rounded-full blur-[140px] animate-pulse-glow" style={{ animationDelay: '2s' }} />
        </div>
      )}

      {/* Close button for Fullscreen */}
      {isFullscreen && (
        <button
          onClick={() => setIsFullscreen(false)}
          className="absolute top-6 right-6 p-3 rounded-full bg-brand-surface/60 border border-brand-accent/20 text-brand-textMuted hover:text-brand-text hover:scale-105 transition-all"
        >
          <Minimize2 className="w-5 h-5" />
        </button>
      )}

      {/* Mode selectors */}
      <div className="flex gap-2.5 mb-8 z-10">
        {['focus', 'shortBreak', 'longBreak'].map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold tracking-wide border transition-all duration-300 ${
              mode === m 
                ? m === 'focus' 
                  ? 'bg-brand-accent/30 border-brand-neonPurple text-brand-neonPurple shadow-neon-purple'
                  : m === 'shortBreak'
                    ? 'bg-brand-neonCyan/20 border-brand-neonCyan text-brand-neonCyan shadow-neon-cyan'
                    : 'bg-brand-neonPink/20 border-brand-neonPink text-brand-neonPink shadow-neon-pink'
                : 'bg-brand-surface/40 border-brand-accent/10 text-brand-textMuted hover:text-brand-text'
            }`}
          >
            {MODE_SETTINGS[m].label}
          </button>
        ))}
      </div>

      {/* Main Timer Display */}
      <div className="relative flex items-center justify-center w-72 h-72 mb-8 z-10">
        {/* Outer radial SVG progress circle */}
        <svg className="absolute w-full h-full transform -rotate-90">
          <circle
            cx="144"
            cy="144"
            r="120"
            className="stroke-brand-surface"
            strokeWidth="8"
            fill="transparent"
          />
          <circle
            cx="144"
            cy="144"
            r="120"
            stroke={mode === 'focus' ? '#9D4EDD' : mode === 'shortBreak' ? '#00F0FF' : '#FF007A'}
            strokeWidth="8"
            fill="transparent"
            strokeDasharray={2 * Math.PI * 120}
            strokeDashoffset={2 * Math.PI * 120 * (1 - progressPercent / 100)}
            strokeLinecap="round"
            className="transition-all duration-1000"
          />
        </svg>

        {/* Text Timer */}
        <div className="flex flex-col items-center">
          <span className="text-5xl font-extrabold font-mono text-brand-text tracking-widest select-none">
            {formatTime(secondsLeft)}
          </span>
          <span className="text-xs uppercase tracking-widest text-brand-textMuted mt-1.5 font-bold">
            {MODE_SETTINGS[mode].label}
          </span>
        </div>
      </div>

      {/* Configuration & Controls */}
      <div className="flex flex-col items-center w-full max-w-xs z-10 gap-6">
        <div className="flex items-center gap-2 border border-brand-accent/15 bg-brand-surface/40 px-4 py-2.5 rounded-2xl w-full">
          <BookOpen className="w-4 h-4 text-brand-neonPurple flex-shrink-0" />
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Focus subject (e.g. DSA, Web Tech)"
            className="bg-transparent text-sm text-brand-text focus:outline-none w-full text-center"
          />
        </div>

        {/* Action controls */}
        <div className="flex items-center justify-center gap-6">
          <button
            onClick={resetTimer}
            className="p-4 rounded-full bg-brand-surface border border-brand-accent/15 text-brand-textMuted hover:text-brand-text hover:scale-105 transition-all"
          >
            <RotateCcw className="w-5 h-5" />
          </button>

          <button
            onClick={toggleTimer}
            className={`p-6 rounded-full flex items-center justify-center shadow-glass transition-all duration-300 hover:scale-110 cursor-pointer ${
              isRunning 
                ? 'bg-brand-neonPink text-white shadow-neon-pink' 
                : 'bg-gradient-to-r from-brand-accent to-brand-neonPurple text-white shadow-neon-purple'
            }`}
          >
            {isRunning ? <Pause className="w-7 h-7 fill-current" /> : <Play className="w-7 h-7 fill-current ml-1" />}
          </button>

          {!isFullscreen && (
            <button
              onClick={() => setIsFullscreen(true)}
              className="p-4 rounded-full bg-brand-surface border border-brand-accent/15 text-brand-textMuted hover:text-brand-text hover:scale-105 transition-all"
            >
              <Maximize2 className="w-5 h-5" />
            </button>
          )}

          {isFullscreen && (
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="p-4 rounded-full bg-brand-surface border border-brand-accent/15 text-brand-textMuted hover:text-brand-text hover:scale-105 transition-all"
            >
              {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5 text-brand-neonPink" />}
            </button>
          )}
        </div>
      </div>

      {/* Rewards overlays */}
      {xpReward && (
        <div className="absolute inset-0 bg-brand-surface/98 flex flex-col items-center justify-center gap-3 z-20 animate-fade-in p-6 text-center">
          <CheckCircle className="w-12 h-12 text-brand-neonCyan shadow-neon-cyan animate-bounce" />
          <h3 className="text-xl font-extrabold text-brand-text">Session Completed!</h3>
          <p className="text-sm text-brand-textMuted max-w-xs">
            Fantastic work studying <span className="text-brand-neonPurple font-bold">{subject}</span>! You have been awarded:
          </p>
          <div className="text-3xl font-extrabold text-brand-neonCyan my-2 shadow-neon-cyan">
            +{xpReward} XP
          </div>
          
          {levelUpNotice && (
            <div className="mt-1 mb-3 px-4 py-2 bg-gradient-to-r from-brand-neonPurple to-brand-neonPink text-white rounded-full font-bold text-xs uppercase tracking-widest animate-pulse border border-white/20">
              ⚡ LEVEL UP! LEVEL {user?.level + 1} ⚡
            </div>
          )}

          <button
            onClick={() => {
              setXpReward(null);
              setLevelUpNotice(false);
            }}
            className="px-6 py-2.5 bg-brand-accent text-white rounded-xl font-bold text-sm tracking-wide hover:bg-brand-neonPurple transition-all mt-2 shadow-glass cursor-pointer"
          >
            Claim Rewards
          </button>
        </div>
      )}
    </div>
  );
};

export default PomodoroTimer;
