import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Users, Plus, ArrowRight, Home, LogIn, Hash, Laptop } from 'lucide-react';

const Rooms = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Room lobbies forms
  const [createName, setCreateName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [error, setError] = useState('');

  const fetchRooms = async () => {
    setLoading(true);
    try {
      const data = await api.get('/rooms');
      setRooms(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, [user]);

  const handleCreateRoom = async (e) => {
    e.preventDefault();
    setError('');
    if (!createName.trim()) return;

    try {
      const data = await api.post('/rooms', { name: createName });
      navigate(`/rooms/${data.code}`);
    } catch (err) {
      setError(err.message || 'Failed to create room.');
    }
  };

  const handleJoinByCode = async (e) => {
    e.preventDefault();
    setError('');
    if (!joinCode.trim()) return;

    try {
      // Check if room exists
      const data = await api.get(`/rooms/${joinCode.toUpperCase()}`);
      navigate(`/rooms/${data.code}`);
    } catch (err) {
      setError(err.message || 'Room not found. Check code.');
    }
  };

  return (
    <div className="flex-1 min-h-screen bg-brand-bg px-4 md:px-8 py-6 md:py-8 relative flex">
      {/* Background Neon glows */}
      <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-brand-accent/5 rounded-full blur-[140px] pointer-events-none" />

      <div className="flex-1 max-w-5xl mx-auto">
        {/* Lobby Header */}
        <div className="flex items-center gap-3.5 mb-8">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-brand-accent to-brand-neonCyan flex items-center justify-center shadow-glass-glow text-white animate-float">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold text-brand-text tracking-wide">
              Collaborative Study Rooms
            </h1>
            <p className="text-brand-textMuted text-sm mt-0.5">
              Create a group session, chat in real-time, write shared notes, and sync timers.
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-brand-neonPink/10 border border-brand-neonPink/35 text-brand-neonPink text-xs rounded-xl">
            {error}
          </div>
        )}

        {/* Action Forms Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Create Room */}
          <div className="glass-panel p-6 rounded-3xl">
            <h3 className="text-sm font-bold uppercase tracking-wider text-brand-textMuted mb-3 flex items-center gap-2">
              <Plus className="w-4.5 h-4.5 text-brand-neonPurple" />
              Create A Study Room
            </h3>
            <form onSubmit={handleCreateRoom} className="flex gap-2">
              <input
                type="text"
                value={createName}
                onChange={(e) => setCreateName(e.target.value)}
                placeholder="Room name (e.g. WT Prep Session)"
                className="flex-1 px-4 py-3 rounded-xl glass-input text-xs"
                required
              />
              <button
                type="submit"
                className="px-5 py-3 rounded-xl bg-gradient-to-r from-brand-accent to-brand-neonPurple text-white font-bold text-xs uppercase tracking-wider shadow-glass hover:scale-102 transition-all cursor-pointer"
              >
                Create
              </button>
            </form>
          </div>

          {/* Join by Code */}
          <div className="glass-panel p-6 rounded-3xl">
            <h3 className="text-sm font-bold uppercase tracking-wider text-brand-textMuted mb-3 flex items-center gap-2">
              <Hash className="w-4.5 h-4.5 text-brand-neonCyan" />
              Join Room via Code
            </h3>
            <form onSubmit={handleJoinByCode} className="flex gap-2">
              <input
                type="text"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value)}
                placeholder="6-character room code (e.g. X8J9L4)"
                className="flex-1 px-4 py-3 rounded-xl glass-input text-xs uppercase font-mono tracking-widest text-center"
                required
                maxLength={6}
              />
              <button
                type="submit"
                className="px-5 py-3 rounded-xl bg-gradient-to-r from-brand-neonCyan to-brand-accent text-white font-bold text-xs uppercase tracking-wider shadow-neon-cyan hover:scale-102 transition-all cursor-pointer"
              >
                Join
              </button>
            </form>
          </div>
        </div>

        {/* Rooms Listing Grid */}
        <h3 className="text-xs uppercase tracking-wider font-semibold text-brand-textMuted mb-4 ml-1">
          Active Public Lobbies
        </h3>

        {loading ? (
          <div className="text-center py-12 text-brand-textMuted">Loading active lobbies...</div>
        ) : rooms.length === 0 ? (
          <div className="glass-panel rounded-3xl p-12 text-center text-brand-textMuted border-dashed">
            <Laptop className="w-12 h-12 text-brand-accent/40 mx-auto mb-3" />
            <h4 className="font-bold text-brand-text mb-1">No Active Lobbies</h4>
            <p className="text-xs">Create your own room above to invite classmates and peers.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {rooms.map((room) => (
              <div
                key={room._id}
                onClick={() => navigate(`/rooms/${room.code}`)}
                className="glass-panel p-5 rounded-2xl cursor-pointer hover:border-brand-accent/40 hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between h-[150px]"
              >
                <div>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] uppercase font-mono tracking-widest text-brand-neonCyan bg-brand-neonCyan/10 border border-brand-neonCyan/25 px-2 py-0.5 rounded">
                      CODE: {room.code}
                    </span>
                    <span className="text-[10px] text-brand-textMuted flex items-center gap-1">
                      <Users className="w-3.5 h-3.5" />
                      {room.members?.length || 1} online
                    </span>
                  </div>

                  <h3 className="font-bold text-base text-brand-text mt-3 line-clamp-2">
                    {room.name}
                  </h3>
                </div>

                <div className="flex items-center justify-between mt-3 pt-3 border-t border-brand-accent/10">
                  <span className="text-[10px] text-brand-textMuted">
                    Host: <span className="font-semibold text-brand-text">{room.host?.name}</span>
                  </span>
                  <span className="text-[10px] text-brand-neonPurple font-bold flex items-center gap-0.5">
                    Join Session <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Rooms;
