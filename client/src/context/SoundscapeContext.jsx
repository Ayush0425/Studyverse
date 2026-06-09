import React, { createContext, useContext, useState, useEffect, useRef } from 'react';

const SoundscapeContext = createContext(null);

export const SoundscapeProvider = ({ children }) => {
  // Initialize state from localStorage or defaults
  const [isPlaying, setIsPlaying] = useState(false);
  const [playingChannels, setPlayingChannels] = useState(() => {
    const saved = localStorage.getItem('studyverse_soundscape_channels');
    return saved ? JSON.parse(saved) : { rain: true, binaural: false, campfire: false };
  });
  const [volumes, setVolumes] = useState(() => {
    const saved = localStorage.getItem('studyverse_soundscape_volumes');
    return saved ? JSON.parse(saved) : { rain: 0.5, binaural: 0.5, campfire: 0.5 };
  });
  const [activePreset, setActivePreset] = useState(() => {
    return localStorage.getItem('studyverse_soundscape_preset') || null;
  });

  // Web Audio Node and Context References
  const audioCtxRef = useRef(null);
  const masterGainRef = useRef(null);
  const noiseBufferRef = useRef(null);

  // Channel-specific node refs
  const rainSourceRef = useRef(null);
  const rainGainRef = useRef(null);

  const waveOscLRef = useRef(null);
  const waveOscRRef = useRef(null);
  const waveGainLRef = useRef(null);
  const waveGainRRef = useRef(null);

  const fireBaseSourceRef = useRef(null);
  const fireBaseGainRef = useRef(null);
  const fireCrackleGainRef = useRef(null);
  const crackleTimeoutRef = useRef(null);
  const isCampfirePlayingRef = useRef(false);

  // Sync state changes to localStorage
  useEffect(() => {
    localStorage.setItem('studyverse_soundscape_channels', JSON.stringify(playingChannels));
  }, [playingChannels]);

  useEffect(() => {
    localStorage.setItem('studyverse_soundscape_volumes', JSON.stringify(volumes));
  }, [volumes]);

  useEffect(() => {
    if (activePreset) {
      localStorage.setItem('studyverse_soundscape_preset', activePreset);
    } else {
      localStorage.removeItem('studyverse_soundscape_preset');
    }
  }, [activePreset]);

  // Create White Noise Buffer for Rain and Campfire
  const createNoiseBuffer = (ctx) => {
    const sampleRate = ctx.sampleRate;
    const bufferSize = sampleRate * 2; // 2 seconds of noise
    const buffer = ctx.createBuffer(1, bufferSize, sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    return buffer;
  };

  // Initialize Audio Context and Master Gain
  const initAudioContext = () => {
    if (!audioCtxRef.current) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      audioCtxRef.current = new AudioCtx();
      masterGainRef.current = audioCtxRef.current.createGain();
      masterGainRef.current.gain.setValueAtTime(0.8, audioCtxRef.current.currentTime); // Master volume limit
      masterGainRef.current.connect(audioCtxRef.current.destination);
      noiseBufferRef.current = createNoiseBuffer(audioCtxRef.current);
    }

    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  };

  // Click crackle scheduler for Campfire sound
  const playCampfireCrackle = (ctx, targetGainNode) => {
    if (!isCampfirePlayingRef.current || !isPlaying) return;

    const now = ctx.currentTime;
    
    // Create Click Oscillator
    const clickSource = ctx.createOscillator();
    clickSource.type = 'triangle';
    clickSource.frequency.setValueAtTime(700 + Math.random() * 1800, now);
    
    // Filter click to make it snappy and wood-like
    const clickFilter = ctx.createBiquadFilter();
    clickFilter.type = 'bandpass';
    clickFilter.frequency.setValueAtTime(1400, now);
    clickFilter.Q.setValueAtTime(4.0, now);

    const clickGain = ctx.createGain();
    
    // Very fast attack and exponential decay envelope
    clickGain.gain.setValueAtTime(0, now);
    clickGain.gain.linearRampToValueAtTime(0.04 + Math.random() * 0.08, now + 0.001);
    clickGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.008 + Math.random() * 0.015);
    
    clickSource.connect(clickFilter);
    clickFilter.connect(clickGain);
    clickGain.connect(targetGainNode);
    
    clickSource.start(now);
    clickSource.stop(now + 0.05);

    // Schedule next click randomly (campfire crackles are irregular)
    const nextClickMs = 70 + Math.random() * 450;
    crackleTimeoutRef.current = setTimeout(() => {
      playCampfireCrackle(ctx, targetGainNode);
    }, nextClickMs);
  };

  // Start specific channel nodes
  const startChannel = (channel, ctx) => {
    const now = ctx.currentTime;

    if (channel === 'rain') {
      if (rainSourceRef.current) return; // Already running

      const source = ctx.createBufferSource();
      source.buffer = noiseBufferRef.current;
      source.loop = true;

      // Filter for rainfall profile: Lowpass at 750Hz, Highpass at 80Hz
      const lowpass = ctx.createBiquadFilter();
      lowpass.type = 'lowpass';
      lowpass.frequency.setValueAtTime(750, now);

      const highpass = ctx.createBiquadFilter();
      highpass.type = 'highpass';
      highpass.frequency.setValueAtTime(80, now);

      const gainNode = ctx.createGain();
      gainNode.gain.setValueAtTime(0, now);
      // Smooth fade-in
      gainNode.gain.linearRampToValueAtTime(volumes.rain, now + 0.5);

      source.connect(lowpass);
      lowpass.connect(highpass);
      highpass.connect(gainNode);
      gainNode.connect(masterGainRef.current);

      source.start(now);

      rainSourceRef.current = source;
      rainGainRef.current = gainNode;
    } 
    else if (channel === 'binaural') {
      if (waveOscLRef.current) return; // Already running

      const oscL = ctx.createOscillator();
      const oscR = ctx.createOscillator();
      oscL.type = 'sine';
      oscR.type = 'sine';
      oscL.frequency.setValueAtTime(140, now); // Left carrier
      oscR.frequency.setValueAtTime(148, now); // Right carrier (+8Hz theta diff)

      const gainL = ctx.createGain();
      const gainR = ctx.createGain();
      gainL.gain.setValueAtTime(0, now);
      gainR.gain.setValueAtTime(0, now);
      gainL.gain.linearRampToValueAtTime(volumes.binaural * 0.8, now + 0.8);
      gainR.gain.linearRampToValueAtTime(volumes.binaural * 0.8, now + 0.8);

      // Pan left and right for stereophonic binaural effect
      if (ctx.createStereoPanner) {
        const panL = ctx.createStereoPanner();
        panL.pan.setValueAtTime(-1, now);
        const panR = ctx.createStereoPanner();
        panR.pan.setValueAtTime(1, now);

        oscL.connect(panL);
        panL.connect(gainL);
        oscR.connect(panR);
        panR.connect(gainR);
      } else {
        // Fallback if panner not supported
        oscL.connect(gainL);
        oscR.connect(gainR);
      }

      gainL.connect(masterGainRef.current);
      gainR.connect(masterGainRef.current);

      oscL.start(now);
      oscR.start(now);

      waveOscLRef.current = oscL;
      waveOscRRef.current = oscR;
      waveGainLRef.current = gainL;
      waveGainRRef.current = gainR;
    } 
    else if (channel === 'campfire') {
      if (fireBaseSourceRef.current) return; // Already running

      // 1. Cozy Fire Low Rumble Base
      const source = ctx.createBufferSource();
      source.buffer = noiseBufferRef.current;
      source.loop = true;

      const lowpass = ctx.createBiquadFilter();
      lowpass.type = 'lowpass';
      lowpass.frequency.setValueAtTime(180, now); // Deep hearth rumble

      const baseGain = ctx.createGain();
      baseGain.gain.setValueAtTime(0, now);
      baseGain.gain.linearRampToValueAtTime(volumes.campfire * 0.35, now + 0.5); // Soft base rumble

      source.connect(lowpass);
      lowpass.connect(baseGain);
      baseGain.connect(masterGainRef.current);

      source.start(now);

      // 2. Click Crackles Gain Node
      const crackleGainNode = ctx.createGain();
      crackleGainNode.gain.setValueAtTime(0, now);
      crackleGainNode.gain.linearRampToValueAtTime(volumes.campfire * 0.9, now + 0.3);
      crackleGainNode.connect(masterGainRef.current);

      fireBaseSourceRef.current = source;
      fireBaseGainRef.current = baseGain;
      fireCrackleGainRef.current = crackleGainNode;

      // Start crackle loops
      isCampfirePlayingRef.current = true;
      playCampfireCrackle(ctx, crackleGainNode);
    }
  };

  // Stop specific channel nodes
  const stopChannel = (channel) => {
    if (channel === 'rain') {
      if (rainSourceRef.current) {
        try { rainSourceRef.current.stop(); } catch(e) {}
        try { rainSourceRef.current.disconnect(); } catch(e) {}
        rainSourceRef.current = null;
        rainGainRef.current = null;
      }
    } 
    else if (channel === 'binaural') {
      if (waveOscLRef.current) {
        try { waveOscLRef.current.stop(); } catch(e) {}
        try { waveOscRRef.current.stop(); } catch(e) {}
        try { waveOscLRef.current.disconnect(); } catch(e) {}
        try { waveOscRRef.current.disconnect(); } catch(e) {}
        waveOscLRef.current = null;
        waveOscRRef.current = null;
        waveGainLRef.current = null;
        waveGainRRef.current = null;
      }
    } 
    else if (channel === 'campfire') {
      isCampfirePlayingRef.current = false;
      if (crackleTimeoutRef.current) {
        clearTimeout(crackleTimeoutRef.current);
        crackleTimeoutRef.current = null;
      }
      if (fireBaseSourceRef.current) {
        try { fireBaseSourceRef.current.stop(); } catch(e) {}
        try { fireBaseSourceRef.current.disconnect(); } catch(e) {}
        fireBaseSourceRef.current = null;
        fireBaseGainRef.current = null;
        fireCrackleGainRef.current = null;
      }
    }
  };

  // Synchronize Volumes with Audio Nodes
  useEffect(() => {
    if (!isPlaying || !audioCtxRef.current) return;
    const now = audioCtxRef.current.currentTime;

    if (rainGainRef.current && playingChannels.rain) {
      rainGainRef.current.gain.setTargetAtTime(volumes.rain, now, 0.15);
    }
    if (waveGainLRef.current && waveGainRRef.current && playingChannels.binaural) {
      waveGainLRef.current.gain.setTargetAtTime(volumes.binaural * 0.8, now, 0.15);
      waveGainRRef.current.gain.setTargetAtTime(volumes.binaural * 0.8, now, 0.15);
    }
    if (fireBaseGainRef.current && fireCrackleGainRef.current && playingChannels.campfire) {
      fireBaseGainRef.current.gain.setTargetAtTime(volumes.campfire * 0.35, now, 0.15);
      fireCrackleGainRef.current.gain.setTargetAtTime(volumes.campfire * 0.9, now, 0.15);
    }
  }, [volumes, playingChannels, isPlaying]);

  // Synchronize Master Playback Trigger
  useEffect(() => {
    if (isPlaying) {
      const ctx = initAudioContext();
      // Start all enabled channels
      Object.keys(playingChannels).forEach(channel => {
        if (playingChannels[channel]) {
          startChannel(channel, ctx);
        } else {
          stopChannel(channel);
        }
      });
    } else {
      // Stop all running nodes
      stopChannel('rain');
      stopChannel('binaural');
      stopChannel('campfire');

      if (audioCtxRef.current && audioCtxRef.current.state !== 'suspended') {
        try { audioCtxRef.current.suspend(); } catch (e) {}
      }
    }

    return () => {
      // Safety cleanup on unmount
      if (!isPlaying) {
        stopChannel('rain');
        stopChannel('binaural');
        stopChannel('campfire');
      }
    };
  }, [isPlaying]);

  // Dynamic Channel Toggle Handler
  const toggleChannel = (channel) => {
    setPlayingChannels(prev => {
      const newState = { ...prev, [channel]: !prev[channel] };
      setActivePreset(null); // Clear active preset if user manual toggles

      if (isPlaying && audioCtxRef.current) {
        if (newState[channel]) {
          startChannel(channel, audioCtxRef.current);
        } else {
          stopChannel(channel);
        }
      }
      return newState;
    });
  };

  // Dynamic Volume Slider Handler
  const setChannelVolume = (channel, volume) => {
    setVolumes(prev => ({
      ...prev,
      [channel]: parseFloat(volume)
    }));
    setActivePreset(null); // Clear active preset if user manual adjusts
  };

  // Preset Configurations Applier
  const applyPreset = (preset) => {
    setActivePreset(preset);
    if (preset === 'clear') {
      setPlayingChannels({ rain: false, binaural: false, campfire: false });
      if (isPlaying) {
        stopChannel('rain');
        stopChannel('binaural');
        stopChannel('campfire');
      }
      return;
    }

    let targetChannels = { rain: false, binaural: false, campfire: false };
    let targetVolumes = { ...volumes };

    if (preset === 'focus') {
      targetChannels = { rain: true, binaural: true, campfire: false };
      targetVolumes.rain = 0.3;
      targetVolumes.binaural = 0.7;
    } else if (preset === 'rainy') {
      targetChannels = { rain: true, binaural: false, campfire: true };
      targetVolumes.rain = 0.85;
      targetVolumes.campfire = 0.25;
    } else if (preset === 'cozy') {
      targetChannels = { rain: false, binaural: false, campfire: true };
      targetVolumes.campfire = 0.85;
    }

    setVolumes(targetVolumes);
    setPlayingChannels(targetChannels);

    // Apply changes if active
    if (isPlaying && audioCtxRef.current) {
      const ctx = audioCtxRef.current;
      Object.keys(targetChannels).forEach(channel => {
        if (targetChannels[channel]) {
          startChannel(channel, ctx);
        } else {
          stopChannel(channel);
        }
      });
    }
  };

  // Toggle Global Master Play status
  const toggleMasterPlay = () => {
    setIsPlaying(prev => !prev);
  };

  return (
    <SoundscapeContext.Provider value={{
      isPlaying,
      playingChannels,
      volumes,
      activePreset,
      toggleMasterPlay,
      toggleChannel,
      setChannelVolume,
      applyPreset
    }}>
      {children}
    </SoundscapeContext.Provider>
  );
};

export const useSoundscape = () => {
  const context = useContext(SoundscapeContext);
  if (!context) {
    throw new Error('useSoundscape must be used within a SoundscapeProvider');
  }
  return context;
};

export default SoundscapeContext;
