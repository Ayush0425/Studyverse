import React, { useState } from 'react';
import { useSoundscape } from '../context/SoundscapeContext';
import { 
  CloudRain, 
  Flame, 
  Headphones, 
  Play, 
  Pause, 
  ChevronDown, 
  Volume2, 
  VolumeX, 
  Sparkles 
} from 'lucide-react';

const SoundscapeController = () => {
  const {
    isPlaying,
    playingChannels,
    volumes,
    activePreset,
    toggleMasterPlay,
    toggleChannel,
    setChannelVolume,
    applyPreset
  } = useSoundscape();

  const [isExpanded, setIsExpanded] = useState(false);

  // Soundscape presets list
  const presets = [
    { id: 'focus', label: 'Deep Focus', icon: Headphones, desc: 'Binaural + Rain' },
    { id: 'rainy', label: 'Rain Storm', icon: CloudRain, desc: 'Rain + Soft Fire' },
    { id: 'cozy', label: 'Cozy Fire', icon: Flame, desc: 'Hearth Rumble' }
  ];

  return (
    <>
      {/* Visualizer CSS style tag (modularized) */}
      <style>{`
        @keyframes visualizerBounce {
          0%, 100% { height: 4px; }
          50% { height: 16px; }
        }
        .vis-bar {
          width: 3px;
          border-radius: 1px;
          transition: height 0.3s ease;
        }
        .vis-active {
          animation: visualizerBounce 0.8s ease-in-out infinite;
        }
        .vis-bar-1 { animation-delay: 0.1s; animation-duration: 0.7s; }
        .vis-bar-2 { animation-delay: 0.3s; animation-duration: 0.9s; }
        .vis-bar-3 { animation-delay: 0.2s; animation-duration: 0.6s; }
        .vis-bar-4 { animation-delay: 0.4s; animation-duration: 0.8s; }
      `}</style>

      <div className="fixed bottom-6 right-6 z-50 font-sans">
        {/* COLLAPSED FLOATING CONTROL POD */}
        {!isExpanded && (
          <button
            onClick={() => setIsExpanded(true)}
            className={`
              w-14 h-14 rounded-full glass-panel flex items-center justify-center relative cursor-pointer
              transition-all duration-300 hover:scale-105 border border-brand-accent/30 shadow-glass-glow group
              ${isPlaying ? 'shadow-neon-cyan border-brand-neonCyan/50' : ''}
            `}
            title="Ambient Study Soundscapes"
          >
            {/* Animated Audio Visualizer inside the collapsed pod */}
            {isPlaying ? (
              <div className="flex items-end gap-0.5 h-4 mb-0.5 z-10">
                <div className="vis-bar vis-active vis-bar-1 bg-brand-neonCyan" />
                <div className="vis-bar vis-active vis-bar-2 bg-brand-neonPurple" />
                <div className="vis-bar vis-active vis-bar-3 bg-brand-neonCyan" />
                <div className="vis-bar vis-active vis-bar-4 bg-brand-neonPurple" />
              </div>
            ) : (
              <Headphones className="w-6 h-6 text-brand-textMuted group-hover:text-brand-neonCyan transition-colors z-10" />
            )}

            {/* Glowing neon ring when playing */}
            {isPlaying && (
              <div className="absolute inset-0 rounded-full border border-brand-neonCyan/40 animate-ping opacity-60" />
            )}
          </button>
        )}

        {/* EXPANDED CONTROL CENTER CARD */}
        {isExpanded && (
          <div className="w-76 sm:w-80 glass-panel-heavy rounded-3xl p-5 border border-brand-neonPurple/30 shadow-glass-glow animate-fade-in relative">
            
            {/* Header */}
            <div className="flex justify-between items-center mb-4 border-b border-brand-accent/10 pb-3">
              <div className="flex items-center gap-2">
                <Headphones className="w-5 h-5 text-brand-neonCyan" />
                <div>
                  <h3 className="text-sm font-extrabold text-white tracking-wide uppercase">Soundscapes</h3>
                  <span className="text-[9px] text-brand-textMuted font-bold uppercase tracking-wider">
                    {isPlaying ? 'Active Synthesis' : 'Muted / Idle'}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setIsExpanded(false)}
                className="p-1.5 rounded-lg border border-brand-accent/15 bg-brand-bg/40 text-brand-textMuted hover:text-white transition-colors cursor-pointer"
                title="Collapse Controller"
              >
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>

            {/* Presets Grid */}
            <div className="mb-4">
              <div className="flex items-center gap-1 mb-2">
                <Sparkles className="w-3.5 h-3.5 text-brand-neonPurple" />
                <span className="text-[10px] text-brand-textMuted font-bold uppercase tracking-widest">Presets</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {presets.map(preset => {
                  const Icon = preset.icon;
                  const isActive = activePreset === preset.id;
                  return (
                    <button
                      key={preset.id}
                      onClick={() => applyPreset(preset.id)}
                      className={`
                        p-2 rounded-xl border text-center flex flex-col items-center justify-center transition-all cursor-pointer group
                        ${isActive 
                          ? 'bg-brand-neonPurple/20 border-brand-neonPurple text-brand-neonPurple shadow-neon-purple font-extrabold' 
                          : 'bg-brand-bg/50 border-brand-accent/15 text-brand-textMuted hover:border-brand-neonPurple/40 hover:text-brand-text'
                        }
                      `}
                    >
                      <Icon className={`w-4 h-4 mb-1 ${isActive ? 'text-brand-neonPurple' : 'text-brand-textMuted group-hover:text-brand-neonPurple'} transition-colors`} />
                      <span className="text-[9px] tracking-wide block truncate w-full">{preset.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Individual Channels Sliders */}
            <div className="flex flex-col gap-3.5 mb-5">
              
              {/* Rain Channel */}
              <div className="flex flex-col gap-1.5 p-2.5 rounded-2xl bg-brand-surface/40 border border-brand-accent/5">
                <div className="flex items-center justify-between">
                  <button 
                    onClick={() => toggleChannel('rain')}
                    className="flex items-center gap-2 text-left cursor-pointer group"
                  >
                    <div className={`
                      w-7 h-7 rounded-lg flex items-center justify-center transition-colors
                      ${playingChannels.rain && isPlaying 
                        ? 'bg-brand-neonCyan/15 text-brand-neonCyan border border-brand-neonCyan/30' 
                        : 'bg-brand-bg/60 text-brand-textMuted border border-brand-accent/10'
                      }
                    `}>
                      <CloudRain className="w-4 h-4" />
                    </div>
                    <div>
                      <span className={`text-xs font-bold transition-colors ${playingChannels.rain && isPlaying ? 'text-white' : 'text-brand-textMuted group-hover:text-brand-text'}`}>Rainfall</span>
                    </div>
                  </button>
                  <span className="text-[10px] text-brand-textMuted font-mono">
                    {playingChannels.rain ? Math.round(volumes.rain * 100) : 0}%
                  </span>
                </div>
                <div className="flex items-center gap-2.5 mt-1 px-1">
                  {volumes.rain === 0 ? <VolumeX className="w-3.5 h-3.5 text-brand-textMuted" /> : <Volume2 className="w-3.5 h-3.5 text-brand-neonCyan" />}
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={volumes.rain}
                    onChange={(e) => setChannelVolume('rain', e.target.value)}
                    className="flex-1 h-1 bg-brand-bg rounded-lg appearance-none cursor-pointer accent-brand-neonCyan"
                    disabled={!playingChannels.rain}
                  />
                </div>
              </div>

              {/* Binaural Focus Channel */}
              <div className="flex flex-col gap-1.5 p-2.5 rounded-2xl bg-brand-surface/40 border border-brand-accent/5">
                <div className="flex items-center justify-between">
                  <button 
                    onClick={() => toggleChannel('binaural')}
                    className="flex items-center gap-2 text-left cursor-pointer group"
                  >
                    <div className={`
                      w-7 h-7 rounded-lg flex items-center justify-center transition-colors
                      ${playingChannels.binaural && isPlaying 
                        ? 'bg-brand-neonPurple/15 text-brand-neonPurple border border-brand-neonPurple/30' 
                        : 'bg-brand-bg/60 text-brand-textMuted border border-brand-accent/10'
                      }
                    `}>
                      <Headphones className="w-4 h-4" />
                    </div>
                    <div>
                      <span className={`text-xs font-bold transition-colors ${playingChannels.binaural && isPlaying ? 'text-white' : 'text-brand-textMuted group-hover:text-brand-text'}`}>Focus Waves</span>
                    </div>
                  </button>
                  <span className="text-[10px] text-brand-textMuted font-mono">
                    {playingChannels.binaural ? Math.round(volumes.binaural * 100) : 0}%
                  </span>
                </div>
                <div className="flex items-center gap-2.5 mt-1 px-1">
                  {volumes.binaural === 0 ? <VolumeX className="w-3.5 h-3.5 text-brand-textMuted" /> : <Volume2 className="w-3.5 h-3.5 text-brand-neonPurple" />}
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={volumes.binaural}
                    onChange={(e) => setChannelVolume('binaural', e.target.value)}
                    className="flex-1 h-1 bg-brand-bg rounded-lg appearance-none cursor-pointer accent-brand-neonPurple"
                    disabled={!playingChannels.binaural}
                  />
                </div>
              </div>

              {/* Campfire Channel */}
              <div className="flex flex-col gap-1.5 p-2.5 rounded-2xl bg-brand-surface/40 border border-brand-accent/5">
                <div className="flex items-center justify-between">
                  <button 
                    onClick={() => toggleChannel('campfire')}
                    className="flex items-center gap-2 text-left cursor-pointer group"
                  >
                    <div className={`
                      w-7 h-7 rounded-lg flex items-center justify-center transition-colors
                      ${playingChannels.campfire && isPlaying 
                        ? 'bg-brand-neonPink/15 text-brand-neonPink border border-brand-neonPink/30' 
                        : 'bg-brand-bg/60 text-brand-textMuted border border-brand-accent/10'
                      }
                    `}>
                      <Flame className="w-4 h-4" />
                    </div>
                    <div>
                      <span className={`text-xs font-bold transition-colors ${playingChannels.campfire && isPlaying ? 'text-white' : 'text-brand-textMuted group-hover:text-brand-text'}`}>Campfire</span>
                    </div>
                  </button>
                  <span className="text-[10px] text-brand-textMuted font-mono">
                    {playingChannels.campfire ? Math.round(volumes.campfire * 100) : 0}%
                  </span>
                </div>
                <div className="flex items-center gap-2.5 mt-1 px-1">
                  {volumes.campfire === 0 ? <VolumeX className="w-3.5 h-3.5 text-brand-textMuted" /> : <Volume2 className="w-3.5 h-3.5 text-brand-neonPink" />}
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={volumes.campfire}
                    onChange={(e) => setChannelVolume('campfire', e.target.value)}
                    className="flex-1 h-1 bg-brand-bg rounded-lg appearance-none cursor-pointer accent-brand-neonPink"
                    disabled={!playingChannels.campfire}
                  />
                </div>
              </div>

            </div>

            {/* Master Control Footer Button */}
            <div className="flex gap-2.5">
              {activePreset && activePreset !== 'clear' && (
                <button
                  onClick={() => applyPreset('clear')}
                  className="px-3 py-3 rounded-xl border border-brand-accent/20 hover:border-brand-neonPink/40 text-brand-textMuted hover:text-brand-neonPink transition-colors cursor-pointer text-xs font-semibold"
                >
                  Silence
                </button>
              )}
              <button
                onClick={toggleMasterPlay}
                className={`
                  flex-1 py-3 rounded-xl flex items-center justify-center gap-2 cursor-pointer font-black text-xs uppercase tracking-wider
                  transition-all duration-300 active:scale-95 shadow-neon-cyan
                  ${isPlaying 
                    ? 'bg-gradient-to-r from-brand-neonPink to-brand-accent text-white shadow-neon-pink' 
                    : 'bg-gradient-to-r from-brand-neonCyan to-brand-neonPurple text-brand-bg'
                  }
                `}
              >
                {isPlaying ? (
                  <>
                    <Pause className="w-4 h-4 fill-current" />
                    Pause Ambient
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-current ml-0.5" />
                    Play Ambient
                  </>
                )}
              </button>
            </div>

          </div>
        )}
      </div>
    </>
  );
};

export default SoundscapeController;
