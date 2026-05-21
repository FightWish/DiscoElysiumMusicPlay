/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, SkipBack, SkipForward, Shuffle, Repeat, Star } from 'lucide-react';
import chocologicalLrc from '../SongLyrics/Chocological_Kim.lrc?raw';
import euSemVoceLrc from '../SongLyrics/Eu sem você_cut_Kim.lrc?raw';
import planuLrc from '../SongLyrics/一切按计划进行_Kim.lrc?raw';

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
    audioUrl: '/SongUpload/Chocological_Kim.mp3',
    lrc: chocologicalLrc
  },
  {
    id: 't2',
    title: 'Eu Sem Você (Por Que Te Vás)\n失去你的我',
    artist: '[Original] Lilian',
    album: '狂飙怪人.FM',
    cover: 'https://images.unsplash.com/photo-1596700812739-16f5c5319888?w=400&q=80',
    audioUrl: '/SongUpload/Eu sem você_cut_Kim.mp3',
    lrc: euSemVoceLrc
  },
  {
    id: 't3',
    title: 'Всё идёт по плану\n一切按计划进行',
    artist: '[Original] Егор Летов',
    album: '狂飙怪人.FM',
    cover: 'https://images.unsplash.com/photo-1505672678657-cc7037095e60?w=400&q=80',
    audioUrl: '/SongUpload/一切按计划进行_Kim.mp3',
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

function Knob({ label, value, onChange, isVolume = false, inactive = false, isLight = false }: { label: string, value: number, onChange?: (val: number) => void, isVolume?: boolean, inactive?: boolean, isLight?: boolean }) {
  const safeValue = Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : 0;
  const rotation = inactive ? 45 : (safeValue * 270 - 135);
  
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (inactive || !onChange) return;
    
    e.preventDefault();
    
    const startY = e.clientY;
    const startX = e.clientX;
    const startValue = safeValue;
    
    const onMove = (moveEv: PointerEvent) => {
      moveEv.preventDefault();
      const deltaY = startY - moveEv.clientY;
      const deltaX = moveEv.clientX - startX;
      const delta = (deltaY + deltaX) * 0.005; 
      onChange(Math.max(0, Math.min(1, startValue + delta)));
    };
    
    const onUp = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
    };
    
    window.addEventListener('pointermove', onMove, { passive: false });
    window.addEventListener('pointerup', onUp, { once: true });
    window.addEventListener('pointercancel', onUp, { once: true });
  };

  return (
    <div className="flex flex-col items-center gap-1">
      <div 
        className={`w-16 h-16 rounded-full border-4 ${isLight ? 'border-[#b5af9f] bg-[#e8e4db]' : 'border-[#3a3d45] bg-[#121417]'} relative flex items-center justify-center shadow-inner touch-none transition-transform ${inactive ? 'opacity-70' : 'cursor-pointer active:scale-[0.98]'}`}
        onPointerDown={handlePointerDown}
      >
        <div 
          className={`w-1 h-6 ${isVolume ? 'bg-[#b0351b]' : (isLight ? 'bg-[#618029]' : 'bg-[#666]')} absolute top-2 rounded-full transform origin-bottom ${inactive ? '' : 'transition-transform duration-75 ease-out'}`}
          style={{ transform: `rotate(${rotation}deg)` }}
        />
      </div>
      <span className="text-[10px] uppercase tracking-widest text-[#666] font-sans -mt-0.5">{label}</span>
    </div>
  );
}


export default function App() {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [currentTrackIdx, setCurrentTrackIdx] = useState(0);

  const isLight = theme === 'light';

  const T = {
    bg: isLight ? 'bg-[#ebede6] text-[#2a2b25]' : 'bg-de-bg text-de-text',
    leftGradient: isLight ? 'from-[#e1ddcb] to-[#d4cfbd] border-[#b5af9f]' : 'from-[#121417] to-[#0c0d10] border-[#2a2c31]',
    chassis: isLight ? 'bg-[#d8d3c1] border-[#9c9484]' : 'bg-de-panel border-[#3a3d45]',
    dialBg: isLight ? 'bg-[#ebede6] border-[#b5af9f]' : 'bg-[#08090a] border-[#2a2c31]',
    freqText: isLight ? 'text-[#2a2b25]' : 'text-[#e3e0d7]',
    fmMark: isLight ? 'bg-[#618029]/30' : 'bg-white/40',
    playlistHeader: isLight ? 'text-[#ebede6] bg-[#618029]' : 'text-[#111] bg-[#e3e0d7]',
    playlistItemActive: isLight ? 'text-[#2a2b25] bg-[#899c75]/20 font-bold' : 'text-white bg-white/10',
    playlistItemInactive: isLight ? 'text-[#61734f] hover:text-[#2a2b25] hover:bg-[#899c75]/10' : 'text-[#888] hover:text-white hover:bg-white/5',
    playlistNumActive: isLight ? 'text-[#b0351b]' : 'text-[#b0351b]',
    playlistNumInactive: isLight ? 'text-[#61734f]/80' : 'text-[#888]',
    btnRandActive: isLight ? 'bg-[#b0351b] border-[#5a1b0d] shadow-inner text-white' : 'bg-[#b0351b] border-[#3a1a1a] shadow-inner text-white',
    btnRandInactive: isLight ? 'bg-[#ebede6] border-[#b5af9f] border-b-[#8c8678] border-r-[#8c8678] text-[#697d55] hover:text-[#2a2b25]' : 'bg-[#1a1c22] border-[#3a3d45] border-b-[#111] border-r-[#111] text-[#666] hover:text-[#e3e0d7]',
    playBtnWrap: isLight ? 'bg-[#d4cfbd] border-[#9c9484]' : 'bg-[#2a2c31] border-[#1a1a1a]',
    playSecondary: isLight ? 'bg-[#ebede6] border-[#b5af9f] border-b-[#8c8678] border-r-[#8c8678] text-[#697d55] hover:text-[#2a2b25] hover:border-[#b0351b]' : 'bg-[#1a1c22] border-[#3a3d45] border-b-[#111] border-r-[#111] text-[#666] hover:text-[#e3e0d7] hover:border-[#b0351b]',
    playActive: isLight ? 'bg-[#b0351b] text-white shadow-[#b0351b]/30 border-[#b0351b] border-b-[#5a1b0d] border-r-[#5a1b0d]' : 'bg-[#b0351b]/20 text-white shadow-[#b0351b]/30 border-t-[#b0351b] border-l-[#b0351b] border-[#3a3d45] border-b-[#111] border-r-[#111]',
    playInactive: isLight ? 'bg-[#ebede6] text-[#697d55] hover:text-[#2a2b25] border-[#b5af9f] border-b-[#8c8678] border-r-[#8c8678] hover:border-t-[#b0351b] hover:border-l-[#b0351b]' : 'bg-[#1a1c22] text-[#666] hover:text-[#e3e0d7] border-[#3a3d45] border-b-[#111] border-r-[#111] hover:border-t-[#b0351b] hover:border-l-[#b0351b]',
    rightBg: isLight ? 'bg-[#e1ddcb]' : 'bg-[#111317]',
    lyricNorSpeaker: isLight ? 'text-[#618029]' : 'text-[#666]',
    lyricYouSpeaker: isLight ? 'text-[#d96b00]' : 'text-[#ff8a00]',
    lyricOthSpeaker: isLight ? 'text-[#364968]' : 'text-[#5d80d2]',
    lyricActiveText: isLight ? 'text-[#b0351b]' : 'text-[#e3e0d7]',
    lyricSub: isLight ? 'text-[#899c75]' : 'text-[#999]',
  };
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(1);
  const [volume, setVolume] = useState(0.8);
  const [playMode, setPlayMode] = useState<'seq' | 'rand'>('seq');
  const [now, setNow] = useState(new Date());
  const [isPlaylistExpanded, setIsPlaylistExpanded] = useState(true);
  
  const audioRef = useRef<HTMLAudioElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const chassisRef = useRef<HTMLDivElement>(null);
  const [chassisHeight, setChassisHeight] = useState<number | undefined>(undefined);

  useEffect(() => {
    if (!chassisRef.current) return;
    const observer = new ResizeObserver((entries) => {
      setChassisHeight(entries[0].borderBoxSize?.[0]?.blockSize || entries[0].contentRect.height);
    });
    observer.observe(chassisRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);
  const dialogueEndRef = useRef<HTMLDivElement>(null);
  
  const currentTrack = PLAYLIST[currentTrackIdx];
  const activeLyrics = parseLRC(currentTrack.lrc);
  const progressRatio = Number.isFinite(duration) && duration > 0
    ? Math.max(0, Math.min(1, currentTime / duration))
    : 0;

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

  const seekToRatio = (ratio: number) => {
    if (!Number.isFinite(duration) || duration <= 0) return;

    const clampedRatio = Math.max(0, Math.min(1, ratio));
    const newTime = clampedRatio * duration;
    if (audioRef.current) audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleProgressPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!progressRef.current || !Number.isFinite(duration) || duration <= 0) return;

    e.preventDefault();

    const updateFromClientX = (clientX: number) => {
      if (!progressRef.current) return;
      const rect = progressRef.current.getBoundingClientRect();
      if (rect.width <= 0) return;
      seekToRatio((clientX - rect.left) / rect.width);
    };

    const onMove = (moveEv: PointerEvent) => {
      moveEv.preventDefault();
      updateFromClientX(moveEv.clientX);
    };

    const onUp = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
    };

    updateFromClientX(e.clientX);
    window.addEventListener('pointermove', onMove, { passive: false });
    window.addEventListener('pointerup', onUp, { once: true });
    window.addEventListener('pointercancel', onUp, { once: true });
  };

  const handleProgressKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      seekToRatio(progressRatio - 0.02);
    }

    if (e.key === 'ArrowRight') {
      e.preventDefault();
      seekToRatio(progressRatio + 0.02);
    }
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
    <>
      <div className={`min-h-[100dvh] md:h-screen ${T.bg} font-serif flex md:items-center justify-center p-0 selection:bg-de-orange selection:text-white select-none transition-colors duration-500 overflow-hidden`}>
        
        {/* Hidden Audio Element */}
        <audio 
          ref={audioRef}
          src={currentTrack.audioUrl}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={handleTrackEnded}
        />

        <div className={`w-full h-full min-h-[100dvh] md:min-h-0 flex flex-col md:flex-row overflow-hidden relative`}>
          
          {/* LEFT PANEL : The FM Radio Player (4/7 of screen on desktop) */}
          <div className={`md:ml-[3.57%] md:w-[57.14%] flex-shrink-0 flex-none min-h-[600px] md:min-h-0 flex flex-col p-4 sm:p-8 md:pl-6 lg:pl-10 xl:pl-12 border-b md:border-b-0 md:border-r border-t-0 border-l-0 ${T.leftGradient} overflow-y-auto scrollbar-de`}>
          
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
          <div className="flex-1 flex flex-col items-center justify-center min-h-[400px]">
            <div ref={chassisRef} className={`w-full ${T.chassis} rounded-sm p-4 sm:p-6 lg:p-8 shadow-2xl flex flex-col relative overflow-hidden transition-colors duration-500`}>
            {/* Grime overlay removed */}
            
            {/* Dial & Frequencies */}
            <div className={`${T.dialBg} border-2 p-6 mb-6 relative overflow-hidden shadow-inner flex flex-col gap-4 transition-colors duration-500`}>
              <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none bg-[radial-gradient(circle_at_center,_#fff_0%,_transparent_100%)]"></div>
              
              {/* Top row: Frequency & Signal */}
              <div className={`flex justify-between items-end border-b pb-4 relative z-10 ${isLight ? 'border-[#b5af9f]' : 'border-[#2a2c31]'}`}>
                <div className="flex flex-col shrink-0">
                  <span className="text-[10px] uppercase text-[#b0351b] font-sans font-bold tracking-tighter whitespace-nowrap">Frequency</span>
                  <span className={`text-5xl font-mono tracking-tighter transition-colors ${T.freqText} whitespace-nowrap`}>78.9<span className="text-xl">FM</span></span>
                </div>
                
                {/* Visual Dial (FM marks) */}
                <div className="flex-1 mx-6 mb-[1.1rem]">
                  <div className={`flex items-center ${isLight ? 'text-[#899c75]' : 'text-de-muted'} font-oswald text-xs opacity-70 w-full relative`}>
                    <span className="shrink-0">88</span>
                    <span className={`flex-1 mx-3 min-w-[40px] h-[1px] ${isLight ? 'bg-[#899c75]' : 'bg-de-muted'} relative flex justify-between items-center`}>
                       {[...Array(31)].map((_, i) => (
                          <span key={i} className={`${T.fmMark} ${i % 5 === 0 ? 'h-4 w-[2px]' : 'h-2 w-[1px]'}`} />
                       ))}
                       
                       {/* Active needle for FM (locked at ~10% for 78.9) */}
                       <span className="absolute left-[10%] top-1/2 -translate-y-1/2 -ml-[1.5px] h-[2.5rem] w-[3px] bg-[#b0351b]/90 shadow-[0_0_5px_rgba(176,53,27,0.5)] z-10 pointer-events-none" />
                       <span className="absolute left-[10%] top-1/2 -translate-y-[60%] -ml-[3px] h-3 w-[6px] bg-[#b0351b] pointer-events-none" />
                    </span>
                    <span className="shrink-0">108</span>
                  </div>
                </div>

                <div className="text-right leading-none w-1/4 shrink-0">
                   <span className="text-[10px] uppercase text-[#666] font-sans block mb-1 whitespace-nowrap">Signal Strength</span>
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
                <span className="text-[10px] uppercase text-[#666] font-sans block mb-2 tracking-widest whitespace-nowrap relative -top-1">Playback Progress</span>
                <div className={`flex justify-between items-center ${isLight ? 'text-[#899c75]' : 'text-de-muted'} font-oswald text-xs gap-[2px] opacity-70 w-full relative`}>
                  <span className="w-10 shrink-0">{formatTime(currentTime)}</span>
                  {/* Tick marks container */}
                  <div
                    ref={progressRef}
                    onPointerDown={handleProgressPointerDown}
                    onKeyDown={handleProgressKeyDown}
                    className="flex-1 h-8 -my-2 relative flex items-center justify-between px-2 cursor-ew-resize touch-none min-w-[100px]"
                    role="slider"
                    aria-label="Playback progress"
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={Math.round(progressRatio * 100)}
                    tabIndex={0}
                  >
                    {[...Array(41)].map((_, i) => <div key={i} className={`w-[1px] ${i % 10 === 0 ? 'h-3' : 'h-2'} ${isLight ? 'bg-[#899c75]/30' : 'bg-de-muted/40'}`} />)}
                    {/* Active needle for progress */}
                    <span 
                      className={`absolute top-[-0.5rem] h-[2rem] w-[3px] z-10 pointer-events-none flex flex-col justify-end items-center ${isLight ? 'bg-[#697d55]/90' : 'bg-white/90 shadow-[0_0_5px_rgba(255,255,255,0.5)]'}`} 
                      style={{ left: `calc(8px + ${progressRatio * 100}% - 4px)`, transform: 'translateX(-50%)' }}
                    >
                      <span className={`h-2 w-[6px] absolute bottom-[-4px] ${isLight ? 'bg-[#618029]' : 'bg-white'}`} />
                    </span>
                  </div>
                  <span className="w-10 text-right shrink-0">{formatTime(duration)}</span>
                </div>
              </div>
            </div>

            {/* Playlist (Frequency selector) */}
            <div className="flex-1 max-h-48 flex flex-col gap-1 overflow-y-auto scrollbar-de pr-2 z-10 relative mt-4 pt-2">
              <button 
                onClick={() => setIsPlaylistExpanded(!isPlaylistExpanded)}
                className={`w-full text-left flex items-center justify-between px-2 py-[4px] font-serif transition-colors font-black ${T.playlistHeader}`}
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
                    className={`w-full text-left flex items-center justify-between px-2 py-[4px] font-serif transition-colors pl-8 ${isActive ? T.playlistItemActive : T.playlistItemInactive}`}
                  >
                    <div className="flex gap-4 items-center">
                      <span className={`font-oswald w-6 ${isActive ? T.playlistNumActive : T.playlistNumInactive}`}>{(i+1).toString().padStart(2, '0')}</span>
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
            <div className={`mt-6 pt-4 border-t ${isLight ? 'border-[#b5af9f]' : 'border-[#4a4a4a]'} flex justify-between items-center z-10 relative w-full`}>
              
              {/* Left side knobs */}
              <div className="flex gap-2 lg:gap-5 px-2 lg:px-4 flex-shrink-0">
                <Knob label="音 量" value={volume} onChange={(v) => setVolume(v)} isVolume isLight={isLight} />
                <Knob label="调 谐" value={progressRatio} onChange={seekToRatio} isLight={isLight} />
                <Knob label="调 频" value={0.1} inactive isLight={isLight} />
              </div>
              
              {/* Play Controls - Radio Buttons */}
              <div className="flex gap-2 justify-end items-center mr-2 lg:mr-8 flex-1">
                {/* Shuffle & Repeat Buttons (Utility) */}
                <div className="flex gap-2 mr-2">
                    <button onClick={() => setPlayMode('rand')} className={`w-8 h-8 flex items-center justify-center border-t border-l border-b-2 border-r-2 transition-all active:scale-95 ${playMode === 'rand' ? T.btnRandActive : T.btnRandInactive}`} title="随机播放">
                      <Shuffle size={14} />
                    </button>
                    <button onClick={() => setPlayMode('seq')} className={`w-8 h-8 flex items-center justify-center border-t border-l border-b-2 border-r-2 transition-all active:scale-95 ${playMode === 'seq' ? T.btnRandActive : T.btnRandInactive}`} title="顺序播放">
                      <Repeat size={14} />
                    </button>
                </div>

                {/* Primary Media Buttons (Hardware aesthetic) */}
                <div className={`flex gap-1 ml-2 p-1 rounded-sm shadow-inner border ${T.playBtnWrap}`}>
                  <button onClick={() => playIndex((currentTrackIdx - 1 + PLAYLIST.length) % PLAYLIST.length)} className={`w-10 h-10 border-t border-l border-b-2 border-r-2 flex items-center justify-center transition-all outline-none active:scale-95 ${T.playSecondary}`} title="上一首">
                    <SkipBack size={18} fill="currentColor" />
                  </button>
                  
                  <button onClick={togglePlay} className={`w-12 h-12 border-t border-l border-b-[3px] border-r-[3px] flex items-center justify-center transition-all active:scale-95 shadow-lg outline-none ${isPlaying ? T.playActive : T.playInactive}`} title={isPlaying ? "暂停" : "播放"}>
                    {isPlaying ? <Pause size={22} fill="currentColor"/> : <Play size={22} fill="currentColor" />}
                  </button>

                  <button onClick={handleTrackEnded} className={`w-10 h-10 border-t border-l border-b-2 border-r-2 flex items-center justify-center transition-all outline-none active:scale-95 ${T.playSecondary}`} title="下一首">
                    <SkipForward size={18} fill="currentColor" />
                  </button>
                </div>
              </div>
            </div>
            
            {/* Status light (Bottom left) */}
            <div className="absolute bottom-4 left-4 flex items-center gap-3">
              <div 
                className={`w-2 h-2 rounded-full transition-all duration-500 ${isPlaying ? 'bg-de-orange shadow-[0_0_8px_#d85c27]' : (isLight ? 'bg-de-orange/30 shadow-inner' : 'bg-red-900 shadow-inner')}`} 
                title={isPlaying ? "播放中" : "已暂停"}
              />
            </div>
            
            {/* Theme Switch (Bottom right) */}
            <div className="absolute bottom-4 right-4 flex items-center gap-3">
              <button 
                onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}
                className={`w-8 h-4 relative transition-colors duration-500 cursor-pointer active:scale-95 shadow-inner border-t border-b overflow-hidden rounded-sm ${isLight ? 'bg-[#618029] border-[#899c75] border-b-[#354518]' : 'bg-[#444] border-[#222] border-t-white/30 border-b-black/80'}`}
                title="切换视觉方案 (Kim & Harry)"
              >
                <div className={`absolute top-0 bottom-0 w-1/2 transition-all duration-500 ${isLight ? 'translate-x-full bg-[#b0351b]' : 'translate-x-0 bg-black/40'}`} />
              </button>
            </div>

          </div>
          </div>
        </div>

        {/* RIGHT PANEL : Dialogue / Lyrics Log (3/7 of screen on desktop) */}
        <div className={`md:w-[32.14%] flex flex-col flex-none min-h-[400px] md:min-h-0 md:h-full p-4 sm:p-8 md:pr-6 lg:pr-10 xl:pr-12 md:border-r border-t-0 border-r-0 border-b-0 ${isLight ? 'border-[#b5af9f]' : 'border-[#2a2c31]'} overflow-hidden relative ${T.rightBg}`}>
           
           {/* Spacer to align with left panel's control module perfectly */}
           <div className="hidden md:block mb-8 opacity-0 pointer-events-none select-none" aria-hidden="true">
             <h1 className="text-xs uppercase tracking-widest text-[#666] mb-2 font-sans font-bold">
               收 音 机
             </h1>
             <div className="h-[2px] w-12 bg-de-orange mb-2"></div>
             <div className="text-[10px] font-sans uppercase tracking-widest text-[#666]">
               你把手搭在了老式收音机的旋钮上。
             </div>
           </div>

           <div className="flex-1 flex flex-col items-center justify-center min-h-[400px]">
             <div className="w-full flex flex-col relative" style={{ height: chassisHeight ? `${chassisHeight}px` : '100%' }}>
               {/* Current Track Info Header - Designed like a Skill context block */}
               <div className="mb-4">
                 <div className="flex flex-col font-serif">
                    <span className="text-de-orange font-bold text-2xl tracking-wider leading-tight mb-3 whitespace-pre-line drop-shadow-sm">
                      {currentTrack.title}
                    </span>
                    <div className="flex flex-col gap-1">
                      <span className={`${T.rightPanelSub} text-sm tracking-wide flex transition-colors duration-500`}>
                        <span className="inline-block w-[95px] font-bold shrink-0">[ORIGINAL]</span>
                        <span className={`${T.rightPanelVal}`}>{currentTrack.artist.replace(/\[?Original\]?\s*/i, '').trim()}</span>
                      </span>
                      <span className={`${T.rightPanelSub} text-sm tracking-wide flex transition-colors duration-500`}>
                        <span className="inline-block w-[95px] font-bold shrink-0 whitespace-pre">[AI  COVER]</span>
                        <span className={`${T.rightPanelVal}`}>Kim Kitsuragi</span>
                      </span>
                    </div>
                 </div>
               </div>

               <div className={`h-px bg-gradient-to-r ${isLight ? 'from-transparent via-[#8c8678] to-transparent' : 'from-transparent via-white/20 to-transparent'} w-full mb-6`} />

               {/* Lyrics Dialogue Stream */}
               <div className="flex-1 overflow-y-auto scrollbar-de pr-4 pb-2 relative space-y-4">
                  
                  {activeLyrics.length === 0 && (
                    <div className={`${T.lyricSub} italic mt-10`}>信号微弱，未接收到文本数据...</div>
                  )}

                  {activeLyrics.map((lyric, idx) => {
                    const isActive = idx === activeLyricIndex;
                    
                    return (
                      <div 
                        key={idx} 
                        id={`lyric-${idx}`}
                        className={`flex flex-col gap-1 ${isActive ? 'opacity-100' : 'opacity-70'} transition-opacity duration-500 ease-in-out`}
                      >
                         {lyric.time !== undefined && (
                           <span 
                             className={`font-bold text-sm tracking-wide cursor-pointer hover:underline ${isActive ? (lyric.speaker === '你' ? T.lyricYouSpeaker : T.lyricOthSpeaker) : T.lyricNorSpeaker}`}
                             onClick={() => {
                               if (audioRef.current) audioRef.current.currentTime = lyric.time as number;
                               setCurrentTime(lyric.time as number);
                             }}
                           >
                             [{formatLrcTime(lyric.time)}]
                           </span>
                         )}
                         <p className={`leading-relaxed italic transition-colors duration-500 ${isActive ? `${T.lyricActiveText} text-lg not-italic font-bold` : T.lyricSub}`}>
                           {lyric.text}
                         </p>
                      </div>
                    );
                  })}
                  <div ref={dialogueEndRef} />
                  
                  {/* Optional: Decorator line moving down */}
                  {activeLyricIndex !== -1 && (
                     <div className={`absolute left-[-1.5rem] top-0 bottom-0 w-px ${isLight ? 'bg-[#9c9484]' : 'bg-white/10'} hidden md:block`}>
                        {/* A moving pip indicating current position relative to history could go here */}
                     </div>
                  )}
               </div>
             </div>
           </div>

           {/* The bottom right specific UI (Like "Continue" button context in DE) */}
           <div className={`absolute bottom-2 right-8 left-8 flex justify-end font-oswald tracking-widest text-sm pointer-events-none uppercase ${isLight ? 'text-[#8c8678]' : 'text-[#a0a0a0]'}`}>
              {now.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}  {now.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric', weekday: 'short' })}
           </div>
        </div>

      </div>
    </div>
    </>
  );
}
