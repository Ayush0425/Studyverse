import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import api from '../services/api';
import { 
  Users, 
  Send, 
  Clock, 
  FileText, 
  LogOut, 
  Hash, 
  Volume2, 
  VolumeX, 
  Play, 
  Pause, 
  RotateCcw,
  Sparkles
} from 'lucide-react';
import confetti from 'canvas-confetti';

const RoomDetail = () => {
  const { code } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const socket = useSocket();

  // Room details
  const [room, setRoom] = useState(null);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('timer'); // 'timer', 'notes', 'chat'

  // Chat States
  const [messages, setMessages] = useState([]);
  const [typedMessage, setTypedMessage] = useState('');
  
  // Collaborative notepad
  const [notepad, setNotepad] = useState('');
  
  // Synced Pomodoro States
  const [focusMinutes, setFocusMinutes] = useState(25);
  const [breakMinutes, setBreakMinutes] = useState(5);
  const [roomMaxSeconds, setRoomMaxSeconds] = useState(25 * 60);
  const [secondsLeft, setSecondsLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [timerMode, setTimerMode] = useState('focus'); // 'focus', 'break'
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Host duration update
  const handleUpdateRoomDurations = (type, newMins) => {
    if (!isHost) return;
    const mins = Math.max(1, Math.min(120, newMins));
    let nextFocus = focusMinutes;
    let nextBreak = breakMinutes;
    let nextSeconds = secondsLeft;
    
    if (type === 'focus') {
      nextFocus = mins;
      setFocusMinutes(mins);
      if (timerMode === 'focus' && !isRunning) {
        nextSeconds = mins * 60;
        setSecondsLeft(nextSeconds);
      }
    } else {
      nextBreak = mins;
      setBreakMinutes(mins);
      if (timerMode === 'break' && !isRunning) {
        nextSeconds = mins * 60;
        setSecondsLeft(nextSeconds);
      }
    }

    const maxSeconds = timerMode === 'focus' ? nextFocus * 60 : nextBreak * 60;
    setRoomMaxSeconds(maxSeconds);

    if (socket) {
      socket.emit('sync_timer', {
        roomCode: room.code,
        timerState: { 
          secondsLeft: nextSeconds, 
          isRunning, 
          timerMode, 
          focusMinutes: nextFocus, 
          breakMinutes: nextBreak,
          roomMaxSeconds: maxSeconds
        }
      });
    }
  };
  
  const chatBottomRef = useRef(null);
  const completionAudio = useRef(null);

  const playChimeSound = () => {
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        const audioCtx = new AudioContextClass();
        if (audioCtx.state === 'suspended') {
          audioCtx.resume();
        }
        const playNote = (frequency, startTime, duration) => {
          const osc = audioCtx.createOscillator();
          const gain = audioCtx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(frequency, startTime);
          gain.gain.setValueAtTime(0.15, startTime);
          gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
          osc.connect(gain);
          gain.connect(audioCtx.destination);
          osc.start(startTime);
          osc.stop(startTime + duration);
        };
        const now = audioCtx.currentTime;
        playNote(523.25, now, 0.4);
        playNote(659.25, now + 0.12, 0.6);
        return;
      }
    } catch (e) {
      console.warn("Web Audio API chime failed, falling back to HTMLAudioElement:", e);
    }
    if (completionAudio.current) {
      completionAudio.current.play().catch(err => console.log("Audio play failed:", err));
    }
  };

  const isHost = room && user && room.host?._id === user._id;

  const fetchRoomDetails = async () => {
    try {
      const data = await api.get(`/rooms/${code.toUpperCase()}`);
      setRoom(data);
      setMembers(data.members || []);
      setNotepad(data.sharedNotes || '');
    } catch (err) {
      console.error(err);
      navigate('/rooms');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoomDetails();
  }, [code]);

  // Socket triggers and listeners
  useEffect(() => {
    if (!socket || !room) return;

    // Join room
    socket.emit('join_room', { roomCode: room.code, user });

    // Sockets listeners
    socket.on('member_joined', (newUser) => {
      setMembers((prev) => {
        if (prev.some(u => u._id === newUser._id)) return prev;
        return [...prev, newUser];
      });
      // System message
      setMessages((prev) => [
        ...prev,
        { system: true, text: `${newUser.name} joined the room` }
      ]);
    });

    socket.on('member_left', (exitedUser) => {
      setMembers((prev) => prev.filter(u => u._id !== exitedUser?._id));
      setMessages((prev) => [
        ...prev,
        { system: true, text: `${exitedUser?.name || 'Someone'} left the room` }
      ]);
    });

    socket.on('receive_message', (msg) => {
      setMessages((prev) => [...prev, msg]);
      scrollToBottom();
    });

    socket.on('receive_notes', (notesContent) => {
      setNotepad(notesContent);
    });

    socket.on('receive_timer_sync', ({ 
      secondsLeft: sLeft, 
      isRunning: running, 
      timerMode: tMode,
      focusMinutes: fMins,
      breakMinutes: bMins,
      roomMaxSeconds: rMaxSecs,
      hasCompleted
    }) => {
      // Sync only if not the host (who is sending it)
      if (!isHost) {
        setSecondsLeft(sLeft);
        setIsRunning(running);
        setTimerMode(tMode);
        if (fMins !== undefined) setFocusMinutes(fMins);
        if (bMins !== undefined) setBreakMinutes(bMins);
        if (rMaxSecs !== undefined) setRoomMaxSeconds(rMaxSecs);

        if (hasCompleted) {
          if (soundEnabled) {
            playChimeSound();
          }
          confetti({
            particleCount: 100,
            spread: 60,
            origin: { y: 0.8 }
          });
        }
      }
    });

    return () => {
      socket.emit('leave_room', { roomCode: room.code, user });
      socket.off('member_joined');
      socket.off('member_left');
      socket.off('receive_message');
      socket.off('receive_notes');
      socket.off('receive_timer_sync');
    };
  }, [socket, room]);

  // Local synced countdown (synchronized from host)
  useEffect(() => {
    let timerInterval = null;
    
    if (isRunning && secondsLeft > 0) {
      timerInterval = setInterval(() => {
        setSecondsLeft(prev => prev - 1);
        
        // Host broadcasts synced seconds Left
        if (isHost && socket) {
          socket.emit('sync_timer', {
            roomCode: room.code,
            timerState: { 
              secondsLeft: secondsLeft - 1, 
              isRunning, 
              timerMode,
              focusMinutes,
              breakMinutes,
              roomMaxSeconds: timerMode === 'focus' ? focusMinutes * 60 : breakMinutes * 60
            }
          });
        }
      }, 1000);
    } else if (isRunning && secondsLeft === 0) {
      handleTimerCompletion();
    }

    return () => clearInterval(timerInterval);
  }, [isRunning, secondsLeft, isHost, socket, room, focusMinutes, breakMinutes, timerMode]);

  const handleTimerCompletion = () => {
    setIsRunning(false);
    
    if (soundEnabled) {
      playChimeSound();
    }

    confetti({
      particleCount: 100,
      spread: 60,
      origin: { y: 0.8 }
    });

    // Auto-transition
    if (timerMode === 'focus') {
      setTimerMode('break');
      const nextSeconds = breakMinutes * 60;
      setSecondsLeft(nextSeconds);
      setRoomMaxSeconds(nextSeconds);
      if (isHost && socket) {
        socket.emit('sync_timer', {
          roomCode: room.code,
          timerState: { 
            secondsLeft: nextSeconds, 
            isRunning: false, 
            timerMode: 'break',
            focusMinutes,
            breakMinutes,
            roomMaxSeconds: nextSeconds,
            hasCompleted: true
          }
        });
      }
    } else {
      setTimerMode('focus');
      const nextSeconds = focusMinutes * 60;
      setSecondsLeft(nextSeconds);
      setRoomMaxSeconds(nextSeconds);
      if (isHost && socket) {
        socket.emit('sync_timer', {
          roomCode: room.code,
          timerState: { 
            secondsLeft: nextSeconds, 
            isRunning: false, 
            timerMode: 'focus',
            focusMinutes,
            breakMinutes,
            roomMaxSeconds: nextSeconds,
            hasCompleted: true
          }
        });
      }
    }
  };

  const handleHostControlTimer = (action) => {
    if (!isHost) return;
    
    let nextRunning = isRunning;
    let nextSeconds = secondsLeft;
    let nextMode = timerMode;

    if (action === 'toggle') {
      nextRunning = !isRunning;
    } else if (action === 'reset') {
      nextRunning = false;
      nextSeconds = timerMode === 'focus' ? focusMinutes * 60 : breakMinutes * 60;
    } else if (action === 'switch') {
      nextRunning = false;
      nextMode = timerMode === 'focus' ? 'break' : 'focus';
      nextSeconds = nextMode === 'focus' ? focusMinutes * 60 : breakMinutes * 60;
    }

    setIsRunning(nextRunning);
    setSecondsLeft(nextSeconds);
    setTimerMode(nextMode);
    
    const maxSecs = nextMode === 'focus' ? focusMinutes * 60 : breakMinutes * 60;
    setRoomMaxSeconds(maxSecs);

    if (socket) {
      socket.emit('sync_timer', {
        roomCode: room.code,
        timerState: { 
          secondsLeft: nextSeconds, 
          isRunning: nextRunning, 
          timerMode: nextMode,
          focusMinutes,
          breakMinutes,
          roomMaxSeconds: maxSecs
        }
      });
    }
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!typedMessage.trim() || !socket) return;

    socket.emit('send_message', {
      roomCode: room.code,
      message: typedMessage,
      user: {
        _id: user._id,
        name: user.name,
      }
    });

    setTypedMessage('');
  };

  const handleNotepadChange = (e) => {
    const val = e.target.value;
    setNotepad(val);
    if (socket) {
      socket.emit('update_notes', {
        roomCode: room.code,
        notes: val,
      });
    }
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const formatTime = (totalSeconds) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleLeaveRoom = () => {
    navigate('/rooms');
  };

  if (loading) {
    return <div className="text-center py-20 text-brand-textMuted">Entering Study Room portal...</div>;
  }

  return (
    <div className="flex-1 h-screen bg-brand-bg flex flex-col overflow-hidden relative">
      <audio ref={completionAudio} src="https://assets.mixkit.co/active_storage/sfx/2568/2568-84.wav" preload="auto" />

      {/* Global Room Header */}
      <header className="flex justify-between items-center px-5 py-4 border-b border-brand-accent/15 bg-brand-surface/90 backdrop-blur-md z-10 flex-shrink-0">
        <div>
          <h1 className="text-lg md:text-xl font-extrabold text-brand-text flex items-center gap-2 truncate max-w-[160px] sm:max-w-md">
            {room.name}
          </h1>
          <span className="text-[9px] md:text-[10px] font-mono tracking-widest text-brand-neonCyan mt-0.5 block">
            ROOM CODE: {room.code}
          </span>
        </div>

        <button
          onClick={handleLeaveRoom}
          className="flex items-center gap-1.5 md:gap-2 px-3 py-2 border border-brand-neonPink/25 hover:bg-brand-neonPink/5 text-brand-neonPink rounded-xl text-[10px] md:text-xs font-bold uppercase tracking-wider transition-all"
        >
          <LogOut className="w-3.5 h-3.5 md:w-4 h-4" />
          Leave
        </button>
      </header>

      {/* Mobile Navigation Tabs */}
      <div className="flex border-b border-brand-accent/15 bg-brand-surface/60 lg:hidden flex-shrink-0">
        <button 
          onClick={() => setActiveTab('timer')}
          className={`flex-1 py-3 text-center text-[10px] sm:text-xs font-bold uppercase tracking-wider transition-all border-b-2 flex items-center justify-center gap-1.5 ${
            activeTab === 'timer' 
              ? 'border-brand-neonPurple text-brand-neonPurple bg-brand-accent/5' 
              : 'border-transparent text-brand-textMuted hover:text-brand-text'
          }`}
        >
          <Clock className="w-4 h-4" />
          Timer
        </button>
        <button 
          onClick={() => setActiveTab('notes')}
          className={`flex-1 py-3 text-center text-[10px] sm:text-xs font-bold uppercase tracking-wider transition-all border-b-2 flex items-center justify-center gap-1.5 ${
            activeTab === 'notes' 
              ? 'border-brand-neonPurple text-brand-neonPurple bg-brand-accent/5' 
              : 'border-transparent text-brand-textMuted hover:text-brand-text'
          }`}
        >
          <FileText className="w-4 h-4" />
          Notepad ({members.length})
        </button>
        <button 
          onClick={() => setActiveTab('chat')}
          className={`flex-1 py-3 text-center text-[10px] sm:text-xs font-bold uppercase tracking-wider transition-all border-b-2 flex items-center justify-center gap-1.5 ${
            activeTab === 'chat' 
              ? 'border-brand-neonPurple text-brand-neonPurple bg-brand-accent/5' 
              : 'border-transparent text-brand-textMuted hover:text-brand-text'
          }`}
        >
          <Send className="w-3.5 h-3.5" />
          Chat
        </button>
      </div>

      {/* Main split area */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* LEFT COLUMN: notepad & online members */}
        <div className={`
          ${activeTab === 'notes' ? 'flex' : 'hidden'} 
          lg:flex lg:w-80 lg:border-r border-brand-accent/15 bg-brand-surface/40 flex-col justify-between flex-1 lg:flex-initial overflow-hidden
        `}>
          
          {/* Members list */}
          <div className="p-5 flex-1 flex flex-col overflow-y-auto">
            <h3 className="text-xs font-bold uppercase tracking-wider text-brand-textMuted flex items-center gap-2 mb-4">
              <Users className="w-4 h-4 text-brand-neonCyan" />
              Members ({members.length})
            </h3>
            <div className="flex flex-col gap-2.5">
              {members.map((m) => (
                <div 
                  key={m._id} 
                  className="flex items-center gap-2.5 p-2 bg-brand-bg/50 border border-brand-accent/5 rounded-xl"
                >
                  <div className="w-7 h-7 rounded-full bg-brand-accent/20 border border-brand-accent/50 flex items-center justify-center font-bold text-xs text-brand-neonPurple">
                    {m.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="overflow-hidden">
                    <span className="text-xs font-bold text-brand-text truncate block">{m.name}</span>
                    <span className="text-[9px] text-brand-textMuted">Lvl {m.level || 1} • {room.host?._id === m._id ? 'Host' : 'Member'}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Collaborative Notepad */}
          <div className="p-5 border-t border-brand-accent/15 flex flex-col h-[280px]">
            <h3 className="text-xs font-bold uppercase tracking-wider text-brand-textMuted flex items-center gap-2 mb-3">
              <FileText className="w-4 h-4 text-brand-neonPurple" />
              Shared Notepad
            </h3>
            <textarea
              value={notepad}
              onChange={handleNotepadChange}
              placeholder="Collaborative notepad. Write questions or notes to share instantly with members..."
              className="flex-1 p-3 rounded-xl glass-input text-xs resize-none"
            />
          </div>

        </div>

        {/* MIDDLE: sync timer and room lobby workspace */}
        <div className={`
          ${activeTab === 'timer' ? 'flex' : 'hidden'} 
          lg:flex flex-1 flex-col justify-between p-4 md:p-6 overflow-y-auto
        `}>
          
          {/* Sync Pomodoro timer widget */}
          <div className="flex-1 flex flex-col items-center justify-center py-6">
            <div className="glass-panel p-6 sm:p-8 rounded-3xl flex flex-col items-center justify-center max-w-sm w-full relative">
              <button 
                onClick={() => setSoundEnabled(!soundEnabled)} 
                className="absolute top-4 right-4 text-brand-textMuted hover:text-brand-text transition-colors p-1"
                title={soundEnabled ? 'Mute Chime' : 'Unmute Chime'}
              >
                {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4 text-brand-neonPink" />}
              </button>
              <span className={`text-[10px] uppercase px-2.5 py-0.5 rounded-full font-bold border border-brand-accent/20 mb-6 tracking-widest ${
                timerMode === 'focus' ? 'text-brand-neonPurple bg-brand-neonPurple/5' : 'text-brand-neonCyan bg-brand-neonCyan/5'
              }`}>
                {timerMode === 'focus' ? 'FOCUS INTERVAL' : 'BREAK ACTIVE'}
              </span>

              <div className="relative flex items-center justify-center w-48 h-48 sm:w-60 sm:h-60 mb-6">
                <svg className="absolute w-full h-full transform -rotate-90" viewBox="0 0 240 240">
                  <circle
                    cx="120"
                    cy="120"
                    r="100"
                    className="stroke-brand-surface"
                    strokeWidth="6"
                    fill="transparent"
                  />
                  <circle
                    cx="120"
                    cy="120"
                    r="100"
                    stroke={timerMode === 'focus' ? '#9D4EDD' : '#00F0FF'}
                    strokeWidth="6"
                    fill="transparent"
                    strokeDasharray={2 * Math.PI * 100}
                    strokeDashoffset={2 * Math.PI * 100 * (1 - (roomMaxSeconds - secondsLeft) / roomMaxSeconds)}
                    strokeLinecap="round"
                    className="transition-all duration-1000"
                  />
                </svg>
                <div className="flex flex-col items-center">
                  <span className="text-3xl sm:text-4xl font-extrabold font-mono text-brand-text tracking-widest select-none">
                    {formatTime(secondsLeft)}
                  </span>
                  <span className="text-[9px] uppercase tracking-wider text-brand-textMuted mt-1">
                    {isRunning ? 'timer synchronized' : 'paused'}
                  </span>
                </div>
              </div>

              {/* Host Custom Timer Inputs */}
              {isHost && (
                <div className="flex gap-4 mb-4 text-xs bg-brand-surface/30 p-2.5 rounded-xl border border-brand-accent/10">
                  <div className="flex flex-col items-center">
                    <span className="text-[9px] uppercase tracking-wider text-brand-textMuted mb-1 font-bold">Focus</span>
                    <div className="flex items-center gap-1">
                      <button 
                        onClick={() => handleUpdateRoomDurations('focus', focusMinutes - 1)}
                        className="w-5 h-5 rounded bg-brand-surface border border-brand-accent/15 flex items-center justify-center font-extrabold text-brand-text hover:border-brand-neonPurple hover:text-brand-neonPurple"
                      >-</button>
                      <span className="font-mono text-brand-text w-6 text-center">{focusMinutes}m</span>
                      <button 
                        onClick={() => handleUpdateRoomDurations('focus', focusMinutes + 1)}
                        className="w-5 h-5 rounded bg-brand-surface border border-brand-accent/15 flex items-center justify-center font-extrabold text-brand-text hover:border-brand-neonPurple hover:text-brand-neonPurple"
                      >+</button>
                    </div>
                  </div>
                  <div className="flex flex-col items-center">
                    <span className="text-[9px] uppercase tracking-wider text-brand-textMuted mb-1 font-bold">Break</span>
                    <div className="flex items-center gap-1">
                      <button 
                        onClick={() => handleUpdateRoomDurations('break', breakMinutes - 1)}
                        className="w-5 h-5 rounded bg-brand-surface border border-brand-accent/15 flex items-center justify-center font-extrabold text-brand-text hover:border-brand-neonCyan hover:text-brand-neonCyan"
                      >-</button>
                      <span className="font-mono text-brand-text w-6 text-center">{breakMinutes}m</span>
                      <button 
                        onClick={() => handleUpdateRoomDurations('break', breakMinutes + 1)}
                        className="w-5 h-5 rounded bg-brand-surface border border-brand-accent/15 flex items-center justify-center font-extrabold text-brand-text hover:border-brand-neonCyan hover:text-brand-neonCyan"
                      >+</button>
                    </div>
                  </div>
                </div>
              )}

              {/* Host Controls */}
              {isHost ? (
                <div className="flex items-center gap-4 mt-2">
                  <button
                    onClick={() => handleHostControlTimer('switch')}
                    className="p-3 rounded-xl bg-brand-surface border border-brand-accent/15 text-brand-textMuted hover:text-brand-text text-[11px] sm:text-xs font-bold transition-all"
                    title="Switch Mode"
                  >
                    Mode
                  </button>
                  <button
                    onClick={() => handleHostControlTimer('toggle')}
                    className="p-3.5 sm:p-4 rounded-full bg-brand-accent hover:bg-brand-neonPurple text-white shadow-neon-purple transition-all"
                  >
                    {isRunning ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
                  </button>
                  <button
                    onClick={() => handleHostControlTimer('reset')}
                    className="p-3 rounded-xl bg-brand-surface border border-brand-accent/15 text-brand-textMuted hover:text-brand-text transition-all"
                    title="Reset Timer"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="text-center text-[10px] text-brand-textMuted mt-2 max-w-[220px]">
                  Only the host (<span className="font-semibold text-brand-text">{room.host?.name}</span>) controls the timers.
                </div>
              )}
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: chat panel */}
        <div className={`
          ${activeTab === 'chat' ? 'flex' : 'hidden'} 
          lg:flex lg:w-80 lg:border-l border-brand-accent/15 bg-brand-surface/40 flex-col justify-between flex-1 lg:flex-initial overflow-hidden
        `}>
          
          {/* Chat log */}
          <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-brand-textMuted mb-2 border-b border-brand-accent/10 pb-2">
              Group Chat
            </h3>
            <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-2.5">
              {messages.length === 0 ? (
                <div className="text-center text-[10px] text-brand-textMuted my-auto">
                  No chat messages. Say hi to the room!
                </div>
              ) : (
                messages.map((msg, index) => {
                  if (msg.system) {
                    return (
                      <div key={index} className="text-center text-[9px] uppercase tracking-wider font-semibold text-brand-neonCyan">
                        {msg.text}
                      </div>
                    );
                  }

                  const isMe = msg.user?._id === user._id;

                  return (
                    <div 
                      key={index}
                      className={`flex flex-col max-w-[80%] ${isMe ? 'self-end items-end' : 'self-start items-start'}`}
                    >
                      <span className="text-[8px] text-brand-textMuted mb-0.5 ml-1">{msg.user?.name}</span>
                      <div className={`p-3 rounded-2xl text-xs ${
                        isMe 
                          ? 'bg-brand-accent/20 border border-brand-accent/30 text-brand-text rounded-tr-none' 
                          : 'bg-brand-bg/60 border border-brand-accent/10 text-brand-text rounded-tl-none'
                      }`}>
                        {msg.message}
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={chatBottomRef} />
            </div>
          </div>

          {/* Message Entry bar */}
          <form onSubmit={handleSendMessage} className="p-4 border-t border-brand-accent/15 flex gap-2">
            <input
              type="text"
              value={typedMessage}
              onChange={(e) => setTypedMessage(e.target.value)}
              placeholder="Type message..."
              className="flex-1 px-3.5 py-2.5 rounded-xl glass-input text-xs"
            />
            <button
              type="submit"
              className="p-2.5 rounded-xl bg-brand-accent hover:bg-brand-neonPurple text-white transition-colors cursor-pointer"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>

        </div>
      </div>
    </div>
  );
};

export default RoomDetail;
