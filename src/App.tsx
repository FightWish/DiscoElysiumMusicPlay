/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, SkipBack, SkipForward, Volume2, Shuffle, Repeat, Star } from 'lucide-react';
import chocologicalLrc from './assets/songlyrics/Chocological_Kim.lrc?raw';
import euSemVoceLrc from './assets/songlyrics/Eu sem você_cut_Kim.lrc?raw';
import planuLrc from './assets/songlyrics/一切按计划进行_Kim.lrc?raw';

// --- Types & Data ---

interface LyricLine {
  time: number;
  text: string;
  speaker?: string;
  dialogue?: string;
}

interface Track {
  id: string;
  title: string;
  artist: string;
  album: string;
  cover: string;
  audioUrl: string;
  lrc: string;
}

const PLAYLIST: Track[] = [
  {
    id: 't1',
    title: 'Chocological\n(Key Ingredient ver.)',
    artist: '[Original] Mili',
    album: '狂飙怪人.FM',
    cover: 'https://images.unsplash.com/photo-1621252179027-94459d278660?w=400&q=80',
    audioUrl: '/songupload/Chocological_Kim.mp3',
    lrc: chocologicalLrc
  },
  {
    id: 't2',
    title: 'Eu Sem Você (Por Que Te Vás)\n失去你的我',
    artist: '[Original] Lilian',
    album: '狂飙怪人.FM',
    cover: 'https://images.unsplash.com/photo-1596700812739-16f5c5319888?w=400&q=80',
    audioUrl: '/songupload/Eu sem você_cut_Kim.mp3',
    lrc: euSemVoceLrc
  },
  {
    id: 't3',
    title: 'Всё идёт по плану\n一切按计划进行',
    artist: '[Original] Егор Летов',
    album: '狂飙怪人.FM',
    cover: 'https://images.unsplash.com/photo-1505672678657-cc7037095e60?w=400&q=80',
    audioUrl: '/songupload/一切按计划进行_Kim.mp3',
    lrc: planuLrc
  },
  {
    id: 't4',
    title: '——',
    artist: '[Original] 随机',
    album: '狂飙怪人.FM',
    cover: 'https://images.unsplash.com/photo-1505672678657-cc7037095e60?w=400&q=80',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
    lrc: `[00:00.00]警觉 - 有海浪的声音...
[00:04.00]旁白 - 冰冷的海水拍打着暗礁，一台老式收音机被遗弃在岸边。
[00:11.00]你 - 还能用吗？
[00:16.00]能工巧匠 - 勉强可以。电子管虽然老化，但核心还没完全烧毁。
[00:24.00]旁白 - 刺耳的电流音之后，一阵劲爆的电子乐穿透了潮湿的空气。`
  }
];

// --- Utility Functions ---

const parseLRC = (lrcString: string): LyricLine[] => {
  const lines = lrcString.split('\n');
  const result: LyricLine[] = [];
  const timeReg = /\[(\d{2}):(\d{2})\.(\d{2,3})\]/;

  lines.forEach((line) => {
    const match = timeReg.exec(line);
    if (!match) return;
    
    const minutes = parseInt(match[1]);
    const seconds = parseInt(match[2]);
    const milliseconds = parseInt(match[3]) * (match[3].length === 2 ? 10 : 1);
    const time = minutes * 60 + seconds + milliseconds / 1000;
    
    const rawText = line.replace(timeReg, '').trim();
    if (!rawText) return;

    // Try to split logic for DE style Dialogue if it has ' - '
    const separatorIdx = rawText.indexOf(' - ');
    if (separatorIdx !== -1) {
      result.push({
        time,
        text: rawText,
        speaker: rawText.substring(0, separatorIdx).trim(),
        dialogue: rawText.substring(separatorIdx + 3).trim(),
      });
    } else {
      result.push({ time, text: rawText });
    }
  });

  return result.sort((a, b) => a.time - b.time);
};

// --- Components ---

function Knob({ label, value, onChange, isVolume = false, inactive = false }: { label: string, value: number, onChange?: (val: number) => void, isVolume?: boolean, inactive?: boolean }) {
  const rotation = inactive ? 45 : (value * 270 - 135);
  
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (inactive || !onChange) return;
    
    const el = e.currentTarget;
    try { el.setPointerCapture(e.pointerId); } catch (err) {}
    
    const startY = e.clientY;
    const startX = e.clientX;
    const startValue = value;
    
    const onMove = (eMove: Event) => {
      const moveEv = eMove as unknown as PointerEvent;
      const deltaY = startY - moveEv.clientY;
      const deltaX = moveEv.clientX - startX;
      const delta = (deltaY + deltaX) * 0.005; 
      onChange(Math.max(0, Math.min(1, startValue + delta)));
    };
    
    const onUp = (eUp: Event) => {
      const upEv = eUp as unknown as PointerEvent;
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerup', onUp);
      try { el.releasePointerCapture(upEv.pointerId); } catch (err) {}
    };
    
    el.addEventListener('pointermove', onMove);
    el.addEventListener('pointerup', onUp);
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <div 
        className={`w-16 h-16 rounded-full border-4 border-[#3a3d45] bg-[#121417] relative flex items-center justify-center shadow-inner touch-none transition-transform ${inactive ? 'opacity-70' : 'cursor-pointer active:scale-[0.98]'}`}
        onPointerDown={handlePointerDown}
      >
        <div 
          className={`w-1 h-6 ${isVolume ? 'bg-[#b0351b]' : 'bg-[#666]'} absolute top-2 rounded-full transform origin-bottom ${inactive ? '' : 'transition-transform duration-75 ease-out'}`}
          style={{ transform: `rotate(${rotation}deg)` }}
        />
      </div>
      <span className="text-[10px] uppercase tracking-widest text-[#666] font-sans">{label}</span>
    </div>
  );
}


export default function App() {
  const [currentTrackIdx, setCurrentTrackIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(1);
  const [volume, setVolume] = useState(0.8);
  const [playMode, setPlayMode] = useState<'seq' | 'rand'>('seq');
  const [now, setNow] = useState(new Date());
  const [isPlaylistExpanded, setIsPlaylistExpanded] = useState(true);
  
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);
  const dialogueEndRef = useRef<HTMLDivElement>(null);
  
  const currentTrack = PLAYLIST[currentTrackIdx];
  const activeLyrics = parseLRC(currentTrack.lrc);

  const formatTime = (time: number) => {
    if (isNaN(time) || !isFinite(time)) return "00:00";
    const m = Math.floor(time / 60).toString().padStart(2, '0');
    const s = Math.floor(time % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const formatLrcTime = (time: number) => {
    if (isNaN(time) || !isFinite(time)) return "00:00.000";
    const m = Math.floor(time / 60).toString().padStart(2, '0');
    const s = Math.floor(time % 60).toString().padStart(2, '0');
    const ms = Math.floor((time % 1) * 1000).toString().padStart(3, '0');
    return `${m}:${s}.${ms}`;
  };

  // Audio Event Handlers
  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = (Number(e.target.value) / 100) * duration;
    if (audioRef.current) audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleTrackEnded = () => {
    if (playMode === 'rand') {
      let nextIdx = Math.floor(Math.random() * PLAYLIST.length);
      if (nextIdx === currentTrackIdx) nextIdx = (nextIdx + 1) % PLAYLIST.length;
      setCurrentTrackIdx(nextIdx);
    } else {
      setCurrentTrackIdx((prev) => (prev + 1) % PLAYLIST.length);
    }
  };

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const playIndex = (index: number) => {
    setCurrentTrackIdx(index);
    setIsPlaying(true);
  };

  // Sync Volume
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  // Handle track change auto-play
  useEffect(() => {
    if (isPlaying && audioRef.current) {
      audioRef.current.play().catch(e => console.log("Auto-play blocked:", e));
    }
  }, [currentTrackIdx]);

  // Calculate current active lyric index
  let activeLyricIndex = -1;
  for (let i = 0; i < activeLyrics.length; i++) {
    if (currentTime >= activeLyrics[i].time) {
      if (i === activeLyrics.length - 1 || currentTime < activeLyrics[i + 1].time) {
        activeLyricIndex = i;
        break;
      }
    }
  }

  // Auto-scroll dialogue
  useEffect(() => {
    // Scroll small amount just enough to keep the active item near bottom
    if (dialogueEndRef.current && activeLyricIndex !== -1) {
      const activeEl = document.getElementById(`lyric-${activeLyricIndex}`);
      if (activeEl) {
        activeEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [activeLyricIndex]);

  return (
    <div className="min-h-screen bg-de-bg text-de-text font-serif flex items-center justify-center p-4 selection:bg-de-orange selection:text-white overflow-hidden select-none">
      
      {/* Hidden Audio Element */}
      <audio 
        ref={audioRef}
        src={currentTrack.audioUrl}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleTrackEnded}
      />

      <div className="w-full max-w-[1280px] aspect-video flex flex-col md:flex-row shadow-2xl rounded overflow-hidden">
        
        {/* LEFT PANEL : The FM Radio Player */}
        <div className="md:w-3/5 flex flex-col p-8 border-r border-[#2a2c31] bg-gradient-to-br from-[#121417] to-[#0c0d10]">
          
          {/* Header Title */}
          <div className="mb-8">
            <h1 className="text-xs uppercase tracking-widest text-[#666] mb-2 font-sans font-bold">
              收 音 机
            </h1>
            <div className="h-[2px] w-12 bg-de-orange mb-2"></div>
            <div className="text-[10px] font-sans uppercase tracking-widest text-[#666]">
              你把手搭在了老式收音机的旋钮上。
            </div>
          </div>

          {/* Radio Chassis */}
          <div className="flex-1 flex flex-col items-center justify-center">
            <div className="w-full bg-de-panel border-[3px] border-[#3a3d45] rounded-sm p-8 shadow-2xl flex flex-col relative overflow-hidden">
            {/* Grime overlay removed */}
            
            {/* Dial & Frequencies */}
            <div className="bg-[#08090a] border-2 border-[#2a2c31] p-6 mb-6 relative overflow-hidden shadow-inner flex flex-col gap-4">
              <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none bg-[radial-gradient(circle_at_center,_#fff_0%,_transparent_100%)]"></div>
              
              {/* Top row: Frequency & Signal */}
              <div className="flex justify-between items-end border-b border-[#2a2c31] pb-4 relative z-10">
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase text-[#b0351b] font-sans font-bold tracking-tighter">Frequency</span>
                  <span className="text-5xl font-mono tracking-tighter text-[#e3e0d7]">78.9<span className="text-xl">FM</span></span>
                </div>
                
                {/* Visual Dial (FM marks) */}
                <div className="flex-1 mx-6 mb-[1.1rem]">
                  <div className="flex items-center text-de-muted font-oswald text-xs opacity-70 w-full relative">
                    <span>88</span>
                    <span className="flex-1 mx-3 h-[1px] bg-de-muted block relative">
                       <span className="absolute left-[30%] -top-2 h-4 w-[2px] bg-white/40" />
                       <span className="absolute left-[60%] -top-2 h-4 w-[2px] bg-white/40" />
                       
                       {/* Active needle for FM (locked at ~10% for 78.9) */}
                       <span className="absolute left-[10%] -top-[1.2rem] h-[2.5rem] w-[3px] bg-[#b0351b]/90 shadow-[0_0_5px_rgba(176,53,27,0.5)] z-10" />
                       <span className="absolute left-[10%] -top-1 h-3 w-[6px] bg-[#b0351b] -ml-[1px]" />
                    </span>
                    <span>108</span>
                  </div>
                </div>

                <div className="text-right leading-none w-1/4">
                   <span className="text-[10px] uppercase text-[#666] font-sans block mb-1">Signal Strength</span>
                   <div className="flex gap-1 h-4 items-end justify-end">
                      <div className="w-1 h-full bg-[#b0351b]"></div>
                      <div className="w-1 h-4/5 bg-[#b0351b]"></div>
                      <div className="w-1 h-3/5 bg-[#b0351b]"></div>
                      <div className="w-1 h-2/5 bg-[#666]"></div>
                   </div>
                </div>
              </div>

              {/* Bottom row: Progress Bar */}
              <div className="flex-1 relative z-10">
                <span className="text-[10px] uppercase text-[#666] font-sans block mb-2 tracking-widest">Playback Progress</span>
                <div className="flex justify-between items-center text-de-muted font-oswald text-xs gap-[2px] opacity-70 w-full relative">
                  <span className="w-10">{formatTime(currentTime)}</span>
                  {/* Tick marks container */}
                  <div className="flex-1 h-4 relative flex items-center justify-between px-2">
                    {[...Array(12)].map((_, i) => <div key={i} className="w-[1px] h-2 bg-de-muted/30" />)}
                    {/* Active needle for progress */}
                    <span 
                      className="absolute top-[-0.5rem] h-[2rem] w-[3px] bg-white/90 shadow-[0_0_5px_rgba(255,255,255,0.5)] z-10 pointer-events-none flex flex-col justify-end items-center" 
                      style={{ left: `calc(8px + ${duration ? (currentTime / duration) * 100 : 0}% - 4px)`, transform: 'translateX(-50%)' }}
                    >
                      <span className="h-2 w-[6px] bg-white absolute bottom-[-4px]" />
                    </span>
                  </div>
                  <span className="w-10 text-right">{formatTime(duration)}</span>
                </div>
                <input 
                  type="range" 
                  min="0" 
                  max="100" 
                  value={duration ? (currentTime / duration) * 100 : 0} 
                  onChange={handleSeek}
                  className="absolute bottom-[-10px] left-10 right-10 h-8 opacity-0 cursor-ew-resize z-20"
                />
              </div>
            </div>

            {/* Playlist (Frequency selector) */}
            <div className="flex-1 max-h-48 flex flex-col gap-1 overflow-y-auto scrollbar-de pr-2 z-10 relative mt-4 pt-2">
              <button 
                onClick={() => setIsPlaylistExpanded(!isPlaylistExpanded)}
                className="w-full text-left flex items-center justify-between px-2 py-[4px] font-serif transition-colors text-[#111] bg-[#e3e0d7] font-black"
              >
                <div className="flex gap-4 items-center">
                  <span className="font-oswald w-10 text-[#b0351b]">78.9</span>
                  <span className="tracking-widest flex items-center gap-2">狂飙怪人.FM <Star size={14} className="fill-current text-[#b0351b]" /></span>
                </div>
                <span className="text-sm">{isPlaylistExpanded ? '▼' : '▶'}</span>
              </button>

              {isPlaylistExpanded && PLAYLIST.map((track, i) => {
                const isActive = i === currentTrackIdx;
                return (
                  <button 
                    key={track.id}
                    onClick={() => playIndex(i)}
                    className={`w-full text-left flex items-center justify-between px-2 py-[4px] font-serif transition-colors pl-8 ${isActive ? 'text-white bg-white/10' : 'text-de-muted hover:text-white hover:bg-white/5'}`}
                  >
                    <div className="flex gap-4 items-center">
                      <span className={`font-oswald w-6 ${isActive ? 'text-[#b0351b]' : 'text-de-muted/50'}`}>{(i+1).toString().padStart(2, '0')}</span>
                      <span className="tracking-widest text-sm">{track.title}</span>
                    </div>
                  </button>
                );
              })}
              {[...Array(5)].map((_, i) => (
                <div key={i} className="w-full text-left flex items-center gap-4 px-2 py-[4px] font-serif text-de-muted/40 cursor-not-allowed">
                  <span className="font-oswald w-10 text-center">??</span>
                  <span className="tracking-widest">未知电台静电噪音</span>
                </div>
              ))}
            </div>

            {/* Information & Controls Area */}
            <div className="mt-6 pt-4 border-t border-[#4a4a4a] flex justify-between items-center z-10 relative w-full">
              
              {/* Left side knobs */}
              <div className="flex gap-4 lg:gap-8 px-2 lg:px-4 flex-shrink-0">
                <Knob label="音 量" value={volume} onChange={(v) => setVolume(v)} isVolume />
                <Knob label="调 谐" value={duration ? currentTime / duration : 0} onChange={(v) => {
                  const newTime = v * duration;
                  if (audioRef.current) audioRef.current.currentTime = newTime;
                  setCurrentTime(newTime);
                }} />
                <Knob label="调 频" value={0.1} inactive />
              </div>
              
              {/* Play Controls - Radio Buttons */}
              <div className="flex gap-2 justify-end items-center mr-2 lg:mr-8 flex-1">
                {/* Shuffle & Repeat Buttons (Utility) */}
                <div className="flex gap-2 mr-2">
                    <button onClick={() => setPlayMode('rand')} className={`w-8 h-8 flex items-center justify-center border-t border-l border-b-2 border-r-2 transition-all active:scale-95 ${playMode === 'rand' ? 'bg-[#b0351b] border-[#3a1a1a] shadow-inner text-white' : 'bg-[#1a1c22] border-[#3a3d45] border-b-[#111] border-r-[#111] text-[#666] hover:text-[#e3e0d7]'}`} title="随机播放">
                      <Shuffle size={14} />
                    </button>
                    <button onClick={() => setPlayMode('seq')} className={`w-8 h-8 flex items-center justify-center border-t border-l border-b-2 border-r-2 transition-all active:scale-95 ${playMode === 'seq' ? 'bg-[#b0351b] border-[#3a1a1a] shadow-inner text-white' : 'bg-[#1a1c22] border-[#3a3d45] border-b-[#111] border-r-[#111] text-[#666] hover:text-[#e3e0d7]'}`} title="顺序播放">
                      <Repeat size={14} />
                    </button>
                </div>

                {/* Primary Media Buttons (Hardware aesthetic) */}
                <div className="flex gap-1 ml-2 bg-[#2a2c31] p-1 rounded-sm shadow-inner border border-[#1a1a1a]">
                  <button onClick={() => playIndex((currentTrackIdx - 1 + PLAYLIST.length) % PLAYLIST.length)} className="w-10 h-10 bg-[#1a1c22] border-t border-l border-[#3a3d45] border-b-2 border-r-2 border-b-[#111] border-r-[#111] flex items-center justify-center text-[#666] hover:text-[#e3e0d7] hover:border-[#b0351b] active:bg-[#b0351b]/20 active:scale-95 transition-all outline-none" title="上一首">
                    <SkipBack size={18} fill="currentColor" />
                  </button>
                  
                  <button onClick={togglePlay} className={`w-12 h-12 border-t border-l border-[#3a3d45] border-b-[3px] border-r-[3px] border-b-[#111] border-r-[#111] flex items-center justify-center transition-all active:scale-95 shadow-lg outline-none ${isPlaying ? 'bg-[#b0351b]/20 text-white shadow-[#b0351b]/30 border-t-[#b0351b]' : 'bg-[#1a1c22] text-[#666] hover:text-[#e3e0d7] hover:border-t-[#b0351b] hover:border-l-[#b0351b]'}`} title={isPlaying ? "暂停" : "播放"}>
                    {isPlaying ? <Pause size={22} fill="currentColor"/> : <Play size={22} fill="currentColor" />}
                  </button>

                  <button onClick={handleTrackEnded} className="w-10 h-10 bg-[#1a1c22] border-t border-l border-[#3a3d45] border-b-2 border-r-2 border-b-[#111] border-r-[#111] flex items-center justify-center text-[#666] hover:text-[#e3e0d7] hover:border-[#b0351b] active:bg-[#b0351b]/20 active:scale-95 transition-all outline-none" title="下一首">
                    <SkipForward size={18} fill="currentColor" />
                  </button>
                </div>
              </div>
            </div>
            
            {/* Status light (Bottom left) */}
            <div className="absolute bottom-4 left-4 flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${isPlaying ? 'bg-de-orange shadow-[0_0_8px_#d85c27]' : 'bg-red-900 shadow-inner'}`} />
              <div className="w-4 h-3 bg-[#444] border-t border-white/20 border-b border-black/50" />
            </div>

          </div>
          </div>
        </div>

        {/* RIGHT PANEL : Dialogue / Lyrics Log */}
        <div className="md:w-2/5 flex flex-col h-full bg-[#111317] p-10 overflow-hidden relative">
           
           {/* Current Track Info Header - Designed like a Skill context block */}
           <div className="mb-4">
             <div className="flex flex-col pt-2 font-serif">
                <span className="text-de-orange font-bold text-2xl tracking-wider leading-tight mb-3 whitespace-pre-line">
                  {currentTrack.title}
                </span>
                <div className="flex flex-col gap-1">
                  <span className="text-[#a0a0a0] text-sm tracking-wide flex">
                    <span className="inline-block w-[95px] font-bold shrink-0">[ORIGINAL]</span>
                    <span className="text-[#d0d0d0]">{currentTrack.artist.replace(/\[?Original\]?\s*/i, '').trim()}</span>
                  </span>
                  <span className="text-[#a0a0a0] text-sm tracking-wide flex">
                    <span className="inline-block w-[95px] font-bold shrink-0 whitespace-pre">[AI  COVER]</span>
                    <span className="text-[#d0d0d0]">Kim Kitsuragi</span>
                  </span>
                </div>
             </div>
           </div>

           <div className="h-px bg-gradient-to-r from-transparent via-white/20 to-transparent w-full mb-6" />

           {/* Lyrics Dialogue Stream */}
           <div className="flex-1 overflow-y-auto scrollbar-de pr-4 pb-24 relative space-y-4">
              
              {activeLyrics.length === 0 && (
                <div className="text-de-muted italic mt-10">信号微弱，未接收到文本数据...</div>
              )}

              {activeLyrics.map((lyric, idx) => {
                // If it hasn't played yet, hide it or dim it? Usually DE log keeps history, doesn't show future.
                // We will only render up to the active lyric
                if (idx > activeLyricIndex && activeLyricIndex !== -1) return null;
                // If we haven't started playing anything, maybe show nothing or just the first line dimmed
                if (activeLyricIndex === -1 && idx > 0) return null;

                const isActive = idx === activeLyricIndex;
                
                return (
                  <div 
                    key={idx} 
                    id={`lyric-${idx}`}
                    className={`flex flex-col gap-1 ${isActive ? 'opacity-100' : 'opacity-30'} transition-opacity duration-500 ease-in-out`}
                  >
                     {lyric.time !== undefined && (
                       <span 
                         className={`font-bold text-sm tracking-wide cursor-pointer hover:underline ${isActive ? (lyric.speaker === '你' ? 'text-[#ff8a00]' : 'text-[#5d80d2]') : 'text-[#666]'}`}
                         onClick={() => {
                           if (audioRef.current) audioRef.current.currentTime = lyric.time as number;
                           setCurrentTime(lyric.time as number);
                         }}
                       >
                         [{formatLrcTime(lyric.time)}]
                       </span>
                     )}
                     <p className={`leading-relaxed italic ${isActive ? 'text-[#e3e0d7] text-lg not-italic' : 'text-[#999]'}`}>
                       {lyric.text}
                     </p>
                  </div>
                );
              })}
              <div ref={dialogueEndRef} />
              
              {/* Optional: Decorator line moving down */}
              {activeLyricIndex !== -1 && (
                 <div className="absolute left-[-1.5rem] top-0 bottom-0 w-px bg-white/10 hidden md:block">
                    {/* A moving pip indicating current position relative to history could go here */}
                 </div>
              )}
           </div>

           {/* The bottom right specific UI (Like "Continue" button context in DE) */}
           <div className="absolute bottom-2 right-8 left-8 flex justify-end font-oswald tracking-widest text-[#a0a0a0] text-sm pointer-events-none uppercase">
              {now.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}  {now.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric', weekday: 'short' })}
           </div>
        </div>

      </div>
    </div>
  );
}

