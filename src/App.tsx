/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  Play, 
  Pause, 
  ChevronDown, 
  ChevronUp, 
  Send, 
  RotateCcw, 
  Anchor, 
  Map as MapIcon, 
  BookOpen, 
  ExternalLink,
  Menu,
  X,
  Square,
  Search,
  Settings2,
  FileText,
  MoreVertical,
  Maximize
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI } from "@google/genai";
import { get, set } from 'idb-keyval';
import { CHAPTERS, TOPIC_MAP, Chapter, Topic } from './constants';
import { RAW_TRANSCRIPT } from './transcriptData';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const BOSUN_SYSTEM_PROMPT = `
You are the "Bosun", a salty, wise, and helpful veteran sailor acting as an AI co-pilot for Lin Pardey's "Cost Control While You Cruise" video seminar.
Your goal is to answer user questions about cruising, budgeting, and seamanship, drawing upon the wisdom of Lin Pardey.

Lin Pardey's core philosophy: "Go simple, go small, go now." She believes that cruising shouldn't be reserved for the wealthy and that maintenance, provisioning, and gear choices should prioritize simplicity and reliability over high cost.

Your persona:
- Use nautical terms occasionally (Aye, matey, chart a course, steady as she goes, shipshape).
- Be respectful, helpful, and direct.
- Keep responses concise (under 3 sentences) unless a more detailed explanation is needed.
- Stay in character as a weathered but kind sailor.

STAY ON TARGET:
- Your primary purpose is to help users navigate Lin and Larry Pardey's "Cost Control While You Cruise" video seminar.
- If a user asks a question that is totally off-target (e.g., about space travel, unrelated products, or general non-sailing advice), you MUST politely explain that your expertise is limited to Lin and Larry's cruising wisdom. Suggest they ask about cruising budgets, boat maintenance, or seamanship instead.

CHAPTER ROUTING:
You MUST analyze the user's question and determine if it relates to one of the following chapters. Even if the match is partial, pick the most relevant chapter. 

Available Chapters and Topics (Use the exact name before the colon):
- Unstoppable Boat: Seamanship, hull integrity, heavy weather prep, safety
- Sails: Choosing sails, dacron vs laminates, rigging, simplicity, sail care
- Being Comfortable at Anchor: Ground tackle, chain vs rope, choosing anchorages, comfort
- Yacht Insurance: Cost control for hull/liability insurance, risk management
- Health Insurance: Medical coverage for cruisers, evacuation, medical kits
- Boat as Warehouse: Storage efficiency, organization, multi-purpose gear, inventory
- Onboard Communications: VHF, SSB, satellite, email, costs, staying in touch
- Cruising in Company: Buddy boating, sharing costs, social life, safety in numbers
- Purchase Local Foods: Provisioning, eating local, markets, cooking, preservation
- Flying Home: Mid-cruise breaks, leaving the boat secure, costs of travel
- Paper Charts & Guide Books: Traditional navigation vs electronics, cost of charts, local knowledge
- Haul Out: Maintenance, bottom paint, DIY yard work, inspections
- Less Cruised Areas: Safety and cost benefits of unusual destinations, avoiding crowds
- How to Spend Some Money: Prioritizing upgrades, safety equipment, investing for time
- Interlude 1: Musical interlude, music, songs, relaxation, entertainment
- Interlude 2: Musical interlude, music, songs, relaxation, entertainment
- Interlude 3: Musical interlude, music, songs, relaxation, entertainment

RESPONSE FORMAT:
You MUST respond in valid JSON format with two keys:
1. "answer": Your response in the Bosun persona.
2. "matchedChapterTitle": The exact title of the most relevant chapter from the list above. You MUST NOT return null; pick the most relevant one even if the connection is broad.

Example:
{
  "answer": "Aye, matey! Keepin' your sails in top shape is key to savin' coin. Lin recommends Dacron for durability.",
  "matchedChapterTitle": "Sails"
}
`;

// --- COMPONENTS ---
const WaveformVisualizer = ({ isListening }: { isListening: boolean }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    if (isListening) {
      const startVisualizer = async () => {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
          
          if (audioContext.state === 'suspended') {
            await audioContext.resume();
          }

          const analyser = audioContext.createAnalyser();
          const source = audioContext.createMediaStreamSource(stream);
          
          source.connect(analyser);
          analyser.fftSize = 64; 
          const bufferLength = analyser.frequencyBinCount;
          const dataArray = new Uint8Array(bufferLength);
          
          audioContextRef.current = audioContext;
          analyserRef.current = analyser;
          dataArrayRef.current = dataArray;
          sourceRef.current = source;

          const draw = () => {
            if (!canvasRef.current || !analyserRef.current || !dataArrayRef.current) return;
            const canvas = canvasRef.current;
            const ctx = canvas.getContext('2d');
            if (!ctx) return;

            const width = canvas.width;
            const height = canvas.height;
            analyserRef.current.getByteFrequencyData(dataArrayRef.current);

            ctx.clearRect(0, 0, width, height);
            
            const barWidth = width / bufferLength;
            let x = 0;

            for (let i = 0; i < bufferLength; i++) {
              const barHeight = (dataArrayRef.current[i] / 255) * height;
              
              ctx.fillStyle = '#f5c96b';
              // Draw rounded bars or glow
              ctx.shadowBlur = 4;
              ctx.shadowColor = '#f5c96b';
              ctx.fillRect(x, height - barHeight, barWidth - 2, barHeight);
              ctx.shadowBlur = 0;
              x += barWidth;
            }

            animationRef.current = requestAnimationFrame(draw);
          };

          draw();
        } catch (err) {
          console.error("Visualizer error:", err);
        }
      };
      startVisualizer();
    } else {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      if (sourceRef.current) {
        sourceRef.current.mediaStream.getTracks().forEach(t => t.stop());
      }
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(console.error);
        audioContextRef.current = null;
      }
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        ctx?.clearRect(0, 0, canvas.width, canvas.height);
      }
    }

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      if (sourceRef.current) {
        sourceRef.current.mediaStream.getTracks().forEach(t => t.stop());
      }
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(console.error);
        audioContextRef.current = null;
      }
    };
  }, [isListening]);

  return (
    <div className="flex items-center gap-3 px-4 py-2 bg-black/40 rounded-xl border border-[#f5c96b]/30 shadow-[0_0_15px_rgba(245,201,107,0.1)]">
      <div className="flex flex-col">
        <span className="text-[9px] font-bold uppercase tracking-widest text-[#f5c96b] opacity-80">Listening</span>
        <span className="text-[8px] text-gray-500 uppercase tracking-[0.2em]">Voice Activity</span>
      </div>
      <canvas ref={canvasRef} width={100} height={20} className="opacity-90" />
    </div>
  );
};

const InlineEqualizer = ({ isSpeaking, isPaused, size = 'md' }: { isSpeaking: boolean, isPaused: boolean, size?: 'sm' | 'md' | 'lg' }) => {
  if (!isSpeaking) return null;
  const height = size === 'sm' ? 8 : size === 'lg' ? 14 : 11;
  const widthClass = size === 'sm' ? 'w-[1px]' : 'w-[1.5px]';
  const count = size === 'sm' ? 3 : size === 'lg' ? 5 : 4;

  return (
    <div className="flex items-end gap-[1.5px] px-0.5 shrink-0" style={{ height: `${height}px` }}>
      {Array.from({ length: count }).map((_, i) => (
        <motion.div
          key={i}
          animate={{ 
            height: isPaused ? 2 : [2, height, 4, height - 2, 2][i % 5] 
          }}
          transition={{ 
            repeat: Infinity, 
            duration: 0.35 + i * 0.08, 
            ease: 'easeInOut' 
          }}
          className={`${widthClass} bg-[#f5c96b] rounded-full`}
        />
      ))}
    </div>
  );
};

// --- TYPES & INTERFACES ---
interface Message {
  id: string;
  sender: 'User' | 'Bosun';
  text: string;
  type: 'user' | 'bosun';
  timestamp: Date;
  showJumpButton?: boolean;
}

interface DisplaySegment {
  text: string;
  speaker?: string;
  startTime: number; // absolute seconds in video
  endTime: number; // absolute seconds in video
}

interface TranscriptSegment extends DisplaySegment {
  chapterIdx: number;
  segmentIdx: number;
  overallIdx: number;
  chapterTitle: string;
}

// --- UTILS ---
const formatTime = (seconds: number) => {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
};

const getSearchTermsToHighlight = (query: string): string[] => {
  if (!query.trim()) return [];
  const terms = [query.trim().toLowerCase()];
  
  // Look up synonyms
  const normalizedQuery = query.toLowerCase().trim();
  const synonyms = [
    {
      keys: ["sailing with other boats", "sailing with another boat", "sailing companions", "sailing as a group", "buddy boating", "buddy-boating", "buddy boat", "buddy boats", "flotilla", "loose flotilla", "cruising group", "social sailing"],
      related: ["cruising in company", "buddy boating", "loose flotilla", "companions"]
    },
    {
      keys: ["storm", "rough weather", "gale", "severe weather", "heavy seas", "bad weather", "tempest", "squall"],
      related: ["unstoppable boat", "storm tactics", "heavy weather", "seamanship", "sound hull"]
    },
    {
      keys: ["medical", "doctor", "hospital", "medicine", "injury", "sick", "illness", "evacuation", "first-aid", "first aid", "health"],
      related: ["health insurance", "medical", "evacuation", "first-aid kit", "emergency", "doctor"]
    },
    {
      keys: ["food", "groceries", "provisions", "provisioning", "cooking", "eat", "eating", "meals", "markets", "supermarket", "organic", "fresh fruits", "vegetables"],
      related: ["purchase local foods", "eat where you are", "local produce", "markets", "pressure cooker"]
    },
    {
      keys: ["insurance", "boat coverage", "yacht coverage", "hull insurance", "boating insurance", "liability"],
      related: ["yacht insurance", "liability-only", "deductibles", "premium", "coverage"]
    },
    {
      keys: ["anchoring", "anchor", "mooring", "ground tackle", "chain", "rode", "holding ground", "anchor alarm", "cavel", "cleat", "windlass"],
      related: ["comfortable at anchor", "ground tackle", "all-chain rode", "anchor alarm"]
    },
    {
      keys: ["sails", "sailing gear", "canvas", "reefing", "reef", "main sail", "mainsail", "jib", "genoa", "downwind", "dacron"],
      related: ["sails", "dacron", "reef early", "tradewind sails", "mainsail"]
    },
    {
      keys: ["radio", "ssb", "vhf", "satellite", "phone", "comms", "communication", "internet", "wifi", "cellular", "cell phone"],
      related: ["onboard communications", "ssb radio", "vhf radio", "satellite phone", "sailmail"]
    },
    {
      keys: ["charts", "navigation", "gps", "maps", "guidebooks", "guide books", "pilot books", "electronic charts", "paper charts"],
      related: ["paper charts", "guide books", "electronic charts", "pilot books", "navigation"]
    },
    {
      keys: ["haul out", "haulout", "bottom paint", "dry dock", "antifouling", "yard", "boat yard", "boatyard", "slipping"],
      related: ["haul out", "haulout", "bottom paint", "osmosis", "keel bolts", "yard"]
    },
    {
      keys: ["spending", "money", "budget", "finances", "costs", "expenses", "saving", "frugal", "cheap", "cost control", "upgrades"],
      related: ["how to spend some money", "costs", "budget", "finances", "cruising is about time", "cost control"]
    }
  ];

  for (const group of synonyms) {
    const queryMatchesKey = group.keys.some(key => normalizedQuery.includes(key) || key.includes(normalizedQuery));
    if (queryMatchesKey) {
      terms.push(...group.related);
    }
  }
  
  return Array.from(new Set(terms));
};

const testSearchMatch = (textToSearch: string, query: string): boolean => {
  if (!query) return false;
  const normalizedText = textToSearch.toLowerCase();
  const normalizedQuery = query.toLowerCase().trim();
  
  if (normalizedText.includes(normalizedQuery)) {
    return true;
  }
  
  const terms = getSearchTermsToHighlight(query);
  return terms.some(term => normalizedText.includes(term));
};

const highlightSearchText = (text: string, search: string) => {
  if (!search.trim()) return text;
  
  const terms = getSearchTermsToHighlight(search);
  const escapedTerms = terms
    .map(t => t.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'))
    .sort((a, b) => b.length - a.length);
  
  if (escapedTerms.length === 0) return text;
  
  const regex = new RegExp(`(${escapedTerms.join('|')})`, 'gi');
  const parts = text.split(regex);
  return (
    <>
      {parts.map((part, i) => 
        regex.test(part) ? (
          <mark key={i} className="bg-[#f5c96b]/30 text-[#f5c96b] rounded-sm px-0.5 font-bold font-sans">
            {part}
          </mark>
        ) : (
          part
        )
      )}
    </>
  );
};

const parseTimecode = (tc: string): number => {
  const parts = tc.trim().split(':');
  if (parts.length < 3) return 0;
  
  const h = parseFloat(parts[0]) || 0;
  const m = parseFloat(parts[1]) || 0;
  const s = parseFloat(parts[2]) || 0;
  let sub = 0;
  if (parts.length >= 4) {
    const frame = parseFloat(parts[3]) || 0;
    if (frame >= 30) {
      sub = frame / 1000;
    } else {
      sub = frame / 30;
    }
  }
  return h * 3600 + m * 60 + s + sub;
};

const parseSrtText = (text: string): TranscriptSegment[] => {
  const blocks = text.split(/\r?\n\s*\r?\n/);
  const tcRegex = /(\d{2}:\d{2}:\d{2}[:\d]*)\s*[-➔→]+\s*(\d{2}:\d{2}:\d{2}[:\d]*)/;
  
  const segments: TranscriptSegment[] = [];
  let overallIdx = 0;
  
  for (const block of blocks) {
    const lines = block.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    if (lines.length < 2) continue;
    
    const timeMatch = lines[0].match(tcRegex);
    if (!timeMatch) continue;
    
    const startSec = parseTimecode(timeMatch[1]);
    const endSec = parseTimecode(timeMatch[2]);
    
    let speaker = "";
    let content = "";
    
    if (lines.length >= 3) {
      speaker = lines[1];
      if (speaker.trim().toLowerCase() === "lin pardey") {
        speaker = "";
      }
      content = lines.slice(2).join(" ");
    } else {
      content = lines[1];
    }
    
    let chapterIdx = 0;
    for (let i = 0; i < CHAPTERS.length; i++) {
      if (startSec >= CHAPTERS[i].time) {
        chapterIdx = i;
      } else {
        break;
      }
    }
    
    segments.push({
      text: content,
      speaker: speaker,
      startTime: startSec,
      endTime: endSec,
      chapterIdx: chapterIdx,
      chapterTitle: CHAPTERS[chapterIdx].title,
      segmentIdx: 0,
      overallIdx: overallIdx++
    });
  }
  
  const counts: Record<number, number> = {};
  for (const seg of segments) {
    if (counts[seg.chapterIdx] === undefined) {
      counts[seg.chapterIdx] = 0;
    }
    seg.segmentIdx = counts[seg.chapterIdx]++;
  }
  
  return segments;
};

const splitTextIntoCaptionLines = (text: string, maxChars = 55): string[] => {
  if (!text) return [];
  // Split into sentences using a regex that captures delimiters
  const rawSentences = text.split(/([.!?])/g).map(s => s.trim()).filter(Boolean);
  
  const sentences: string[] = [];
  let currentSentence = "";
  
  for (let i = 0; i < rawSentences.length; i++) {
    const part = rawSentences[i];
    if (/[.!?]/.test(part)) {
      currentSentence += part;
      sentences.push(currentSentence.trim());
      currentSentence = "";
    } else {
      if (currentSentence) {
        currentSentence += " " + part;
      } else {
        currentSentence = part;
      }
    }
  }
  if (currentSentence.trim()) {
    sentences.push(currentSentence.trim());
  }
  
  // Now process each sentence. If it's longer than maxChars, we split it by commas or spaces.
  const result: string[] = [];
  for (const sentence of sentences) {
    if (sentence.length <= maxChars) {
      result.push(sentence);
    } else {
      // Split by commas first if present
      const rawClauses = sentence.split(/(,)/g).map(s => s.trim()).filter(Boolean);
      let currentClause = "";
      
      for (const part of rawClauses) {
        if (part === ",") {
          currentClause += ",";
          if (currentClause.trim().length > 25) {
            result.push(currentClause.trim());
            currentClause = "";
          }
        } else {
          if (currentClause) {
            currentClause += " " + part;
          } else {
            currentClause = part;
          }
        }
      }
      
      if (currentClause.trim()) {
        const remaining = currentClause.trim();
        if (remaining.length <= maxChars) {
          result.push(remaining);
        } else {
          const words = remaining.split(/\s+/);
          let currentLine = "";
          for (const word of words) {
            if ((currentLine + " " + word).trim().length > maxChars) {
              if (currentLine.trim()) result.push(currentLine.trim());
              currentLine = word;
            } else {
              currentLine = currentLine ? currentLine + " " + word : word;
            }
          }
          if (currentLine.trim()) {
            result.push(currentLine.trim());
          }
        }
      }
    }
  }
  
  return result.filter(Boolean);
};

const ClosedCaptionText = ({ segment, currentTime }: { segment: DisplaySegment; currentTime: number }) => {
  const lines = splitTextIntoCaptionLines(segment.text);
  const totalLines = lines.length;
  
  if (totalLines === 0) return null;
  
  const duration = Math.max(0.1, segment.endTime - segment.startTime);
  const elapsed = currentTime - segment.startTime;
  const progress = Math.max(0, Math.min(1, elapsed / duration));
  
  // Distribute sentences/clauses evenly across the duration of the segment
  const lineIndex = Math.min(totalLines - 1, Math.floor(progress * totalLines));
  const activeLine = lines[lineIndex] || "";
  
  const displayText = segment.speaker ? `${segment.speaker}: ${activeLine}` : activeLine;

  return (
    <div className="w-full text-center flex items-center justify-center overflow-hidden">
      <span className="text-xs sm:text-sm md:text-base font-semibold leading-relaxed tracking-wide drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] px-1 block truncate">
        {displayText}
      </span>
    </div>
  );
};

const splitIntoCaptionSegments = (text: string): string[] => {
  if (text.startsWith('[') && text.endsWith(']')) {
    return [text];
  }

  // Do NOT edit, strip, or interpret the transcript text. Keep it identical to the source file.
  // Split strictly by sentence ends (. ! ?) followed by whitespace.
  const sentences = text.split(/(?<=[.!?])\s+/).map(p => p.trim()).filter(Boolean);

  const segments: string[] = [];
  for (const sentence of sentences) {
    const words = sentence.split(/\s+/);
    if (words.length <= 16) {
      segments.push(sentence);
    } else {
      // For sentences longer than 16 words, split them into natural, sequential sub-phrases of ~10-12 words
      for (let i = 0; i < words.length; i += 12) {
        const chunk = words.slice(i, i + 12).join(" ");
        if (chunk) {
          segments.push(chunk);
        }
      }
    }
  }
  return segments;
};

export default function App() {
  // --- STATE ---
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'Bosun',
      text: "Aye, welcome aboard. Ask me anything about Lin & Larry’s Cost Control While You Cruise. You can use your voice by clicking the microphone!",
      type: 'bosun',
      timestamp: new Date()
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [activeTab, setActiveTab] = useState<'chat' | 'notes' | 'logbook' | 'search'>('chat');
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);
  const [isBosunVoiceEnabled, setIsBosunVoiceEnabled] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const [showChapterOverlay, setShowChapterOverlay] = useState(false);
  const [currentChapterTitle, setCurrentChapterTitle] = useState('');
  const [currentChapterThumbnail, setCurrentChapterThumbnail] = useState('');
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    linBio: false,
    aboutBosun: false,
    aboutTSC: false
  });
  const [videoSrc, setVideoSrc] = useState<string | null>(null); // Placeholder, user will load
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [notes, setNotes] = useState(() => localStorage.getItem('bosunNotes') || '');
  const [historySearch, setHistorySearch] = useState('');
  const [notesSearch, setNotesSearch] = useState('');
  const [globalSearchQuery, setGlobalSearchQuery] = useState('');
  const [searchResultFilter, setSearchResultFilter] = useState<'all' | 'notes' | 'chat' | 'transcript'>('all');
  const [isLoadingPersistedVideo, setIsLoadingPersistedVideo] = useState(false);
  const [highlightedMessageId, setHighlightedMessageId] = useState<string | null>(null);
  const [showCaptions, setShowCaptions] = useState(false);
  const [showTranscript, setShowTranscript] = useState(false);
  const [autoScrollTranscript, setAutoScrollTranscript] = useState(true);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [volume, setVolume] = useState(1.0);
  const [srtSegments, setSrtSegments] = useState<TranscriptSegment[]>(() => {
    try {
      return parseSrtText(RAW_TRANSCRIPT);
    } catch (e) {
      console.error("Failed to parse initial RAW_TRANSCRIPT:", e);
      return [];
    }
  });

  // --- REFS ---
  const videoRef = useRef<HTMLVideoElement>(null);
  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesis|null>(null);
  const moreMenuRef = useRef<HTMLDivElement>(null);
  const transcriptContainerRef = useRef<HTMLDivElement>(null);

  // --- CAPTIONS & TRANSCRIPT GENERATION HELPERS ---
  const getSegmentsForChapter = (chapterIdx: number): DisplaySegment[] => {
    if (srtSegments && srtSegments.length > 0) {
      return srtSegments.filter(seg => seg.chapterIdx === chapterIdx);
    }
    return [];
  };

  const getAllTranscriptSegments = (): TranscriptSegment[] => {
    if (srtSegments && srtSegments.length > 0) {
      return srtSegments;
    }
    return [];
  };

  const getActiveSegment = (): TranscriptSegment | null => {
    if (!videoSrc || !showCaptions) return null;
    return srtSegments.find(seg => currentTime >= seg.startTime && currentTime < seg.endTime) || null;
  };

  const getActiveCaption = () => {
    if (!videoSrc || !showCaptions) return "";
    const activeSeg = srtSegments.find(seg => currentTime >= seg.startTime && currentTime < seg.endTime);
    if (activeSeg) {
      return activeSeg.speaker ? `${activeSeg.speaker}: ${activeSeg.text}` : activeSeg.text;
    }
    return "";
  };

  // 1. Decisive Scroll Restoration & Focus Management
  React.useLayoutEffect(() => {
    if (typeof window !== 'undefined') {
      const isIframe = window.self !== window.top;
      
      const performFocusHeader = () => {
        const h = document.getElementById('app-header') || document.querySelector('header');
        if (h) {
          if (h.getAttribute('tabindex') !== '-1') h.setAttribute('tabindex', '-1');
          h.focus({ preventScroll: true });
        }
      };

      const performScrollReset = () => {
        const scrollableDiv = document.getElementById('main-content');
        window.scrollTo(0, 0);
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;
        if (scrollableDiv) scrollableDiv.scrollTop = 0;
        
        // Always try to re-focus during the reset phase if user requested it
        performFocusHeader();
      };

      // Always focus header on load as requested
      performFocusHeader();

      // ONLY apply aggressive "jump to top" scroll fixes if we are in an iframe
      // Standalone version allows standard browser scroll restoration or focuses header
      if (isIframe) {
        if ('scrollRestoration' in window.history) {
          window.history.scrollRestoration = 'manual';
        }
        if (window.location.hash) {
          window.history.replaceState('', document.title, window.location.pathname + window.location.search);
        }
        performScrollReset();
      }

      // Repeated attempts to counter dynamic content loading or secondary focus steals
      const timerIds = [
        setTimeout(isIframe ? performScrollReset : performFocusHeader, 0),
        setTimeout(isIframe ? performScrollReset : performFocusHeader, 50),
        setTimeout(isIframe ? performScrollReset : performFocusHeader, 150),
        setTimeout(isIframe ? performScrollReset : performFocusHeader, 500),
        setTimeout(isIframe ? performScrollReset : performFocusHeader, 1000),
        setTimeout(isIframe ? performScrollReset : performFocusHeader, 2000),
      ];

      return () => timerIds.forEach(clearTimeout);
    }
  }, []);

  useEffect(() => {
    const fetchEditedSrt = async () => {
      try {
        const response = await fetch('/MConverter.eu_cost-control-transcript-edited.srt');
        if (response.ok) {
          const text = await response.text();
          const parsed = parseSrtText(text);
          if (parsed.length > 0) {
            setSrtSegments(parsed);
          }
        }
      } catch (err) {
        console.error("Error fetching public srt file, keeping raw transcript fallback:", err);
      }
    };
    fetchEditedSrt();
  }, []);

  useEffect(() => {
    const checkPersistedVideo = async () => {
      try {
        setIsLoadingPersistedVideo(true);
        const savedFile = await get('persistedVideo');
        if (savedFile instanceof File || savedFile instanceof Blob) {
          const url = URL.createObjectURL(savedFile);
          setVideoSrc(url);
        }
      } catch (err) {
        console.error("Failed to load persisted video:", err);
      } finally {
        setIsLoadingPersistedVideo(false);
      }
    };

    checkPersistedVideo();

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      synthRef.current = window.speechSynthesis;
      synthRef.current.getVoices();
      if (synthRef.current.onvoiceschanged !== undefined) {
        synthRef.current.onvoiceschanged = () => synthRef.current?.getVoices();
      }
    }
  }, []);

  // --- PERSISTENCE ---
  useEffect(() => {
    localStorage.setItem('bosunNotes', notes);
  }, [notes]);

  // More Options Menu click outside handler
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (moreMenuRef.current && !moreMenuRef.current.contains(event.target as Node)) {
        setIsMoreMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Synchronize playback speed
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = playbackSpeed;
    }
  }, [playbackSpeed, videoSrc]);

  // Synchronize volume level
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.volume = volume;
    }
  }, [volume, videoSrc]);

  // Handle auto-scrolling of active transcript segments
  useEffect(() => {
    if (!showTranscript || !autoScrollTranscript || !videoSrc) return;

    const allSegs = getAllTranscriptSegments();
    const activeSeg = allSegs.find(seg => currentTime >= seg.startTime && currentTime < seg.endTime);

    if (activeSeg) {
      const activeEl = document.getElementById(`transcript-seg-${activeSeg.overallIdx}`);
      const container = transcriptContainerRef.current;
      if (activeEl && container) {
        const containerRect = container.getBoundingClientRect();
        const activeRect = activeEl.getBoundingClientRect();
        const relativeTop = activeRect.top - containerRect.top + container.scrollTop;
        const targetScrollTop = relativeTop - (containerRect.height / 2) + (activeRect.height / 2);
        container.scrollTo({
          top: Math.max(0, targetScrollTop),
          behavior: 'smooth'
        });
      }
    }
  }, [currentTime, showTranscript, autoScrollTranscript, videoSrc]);

  // --- SPEECH RECOGNITION SETUP ---
  const [isSpeechSupported, setIsSpeechSupported] = useState(true);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInputText(transcript);
        handleSend(transcript);
        setIsListening(false);
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error', event.error);
        setIsListening(false);
        
        let errorMsg = "";
        if (event.error === 'not-allowed') {
          errorMsg = "Aye, it seems I don't have permission to use your microphone. Check your browser settings, matey! You might also need to open this app in a new tab.";
        } else if (event.error === 'no-speech') {
          // Silent timeout, no need to alert unless they keep failing
        } else if (event.error === 'network') {
          errorMsg = "The winds of the network are against us. I couldn't hear your voice.";
        }

        if (errorMsg) {
          setMessages(prev => [...prev, {
            id: `error-${Date.now()}`,
            sender: 'Bosun',
            text: errorMsg,
            type: 'bosun',
            timestamp: new Date()
          }]);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    } else {
      setIsSpeechSupported(false);
    }
  }, []);

  const toggleListening = () => {
    if (!isSpeechSupported) {
      setMessages(prev => [...prev, {
        id: `unsupported-${Date.now()}`,
        sender: 'Bosun',
        text: "I'm sorry shipmate, but it seems your current browser doesn't support speech recognition. You might try usin' a different browser or just typin' your message.",
        type: 'bosun',
        timestamp: new Date()
      }]);
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      // Prime the speech synth on user gesture
      if (isBosunVoiceEnabled && synthRef.current) {
        const prime = new SpeechSynthesisUtterance("");
        prime.volume = 0;
        synthRef.current.speak(prime);
      }
      try {
        recognitionRef.current?.start();
        // setIsListening(true) is now handled in onstart to be more precise
      } catch (err) {
        console.error("Failed to start recognition:", err);
        setIsListening(false);
      }
    }
  };

  // --- TEXT TO SPEECH ---
  const speak = useCallback((text: string, id: string | null = null, onEnd?: () => void) => {
    if (!isBosunVoiceEnabled || !synthRef.current) {
      if (onEnd) onEnd();
      return;
    }

    // Stop existing speech
    synthRef.current.cancel();

    // Small delay to ensure synthesis is ready to receive new command
    setTimeout(() => {
      if (!synthRef.current) return;
      
      const utterance = new SpeechSynthesisUtterance(text);
      // Try to find a rugged or older male sounding voice if available
      const voices = synthRef.current.getVoices();
      
      // Enhanced voice selection logic for the "Salty Bosun"
      // Prioritize Daniel (UK Male), Alex (Mac Male), and UK English Male voices
      const preferredVoice = voices.find(v => v.name.includes('Daniel')) || 
                            voices.find(v => v.name === 'Alex') ||
                            voices.find(v => v.name.includes('Google UK English Male')) ||
                            voices.find(v => v.name.includes('Male') && v.lang.startsWith('en-GB')) ||
                            voices.find(v => v.name.includes('Male') && v.lang.startsWith('en-US')) ||
                            voices.find(v => v.name.includes('Guy')) ||
                            voices.find(v => v.name.includes('Male')) ||
                            voices[0];
      
      if (preferredVoice) utterance.voice = preferredVoice;
      utterance.pitch = 0.6; // Deep, gravely "Old Salt" pitch
      utterance.rate = 1.1;  // Balanced, steady pace

      utterance.onstart = () => {
        setIsSpeaking(true);
        setIsPaused(false);
        setSpeakingMessageId(id);
      };
      utterance.onend = () => {
        setIsSpeaking(false);
        setIsPaused(false);
        setSpeakingMessageId(null);
        if (onEnd) onEnd();
      };
      utterance.onerror = (e) => {
        console.error("SpeechSynthesis Error:", e);
        setIsSpeaking(false);
        setIsPaused(false);
        setSpeakingMessageId(null);
        if (onEnd) onEnd();
      };

      synthRef.current.speak(utterance);
    }, 50);
  }, [isBosunVoiceEnabled]);

  const handleSpeechAction = useCallback((text: string, id: string | null = null) => {
    if (!synthRef.current) return;

    if (isSpeaking && !isPaused && speakingMessageId === id) {
      synthRef.current.pause();
      setIsPaused(true);
    } else if (isPaused && speakingMessageId === id) {
      synthRef.current.resume();
      setIsPaused(false);
    } else {
      speak(text, id);
    }
  }, [isSpeaking, isPaused, speakingMessageId, speak]);

  // --- CHAT LOGIC ---
  const handleSend = (text: string = inputText) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    // Prime the speech synth on user gesture
    if (isBosunVoiceEnabled && synthRef.current) {
      const prime = new SpeechSynthesisUtterance("");
      prime.volume = 0;
      synthRef.current.speak(prime);
    }

    const userMsg: Message = {
      id: Date.now().toString(),
      sender: 'User',
      text: trimmed,
      type: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    
    // Bosun reaction logic
    setTimeout(() => {
      bosunRespond(trimmed);
    }, 500);
  };

  const bosunRespond = async (text: string) => {
    setIsTyping(true);
    // Cancel any current speech immediately when thinking starts
    if (synthRef.current) synthRef.current.cancel();
    
    try {
      // Build conversation history for context awareness
      // We take the last 10 messages to keep context manageable
      const history = messages.slice(-10).map(msg => ({
        role: msg.sender === 'Bosun' ? 'model' : 'user',
        parts: [{ text: msg.text }]
      }));

      // Add the current message
      history.push({
        role: 'user',
        parts: [{ text: text }]
      });

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: history,
        config: {
          systemInstruction: BOSUN_SYSTEM_PROMPT,
          responseMimeType: "application/json"
        },
      });

      const data = JSON.parse(response.text || "{}");
      const replyText = data.answer || "Aye, the signal is weak. Could you repeat that, shipmate?";
      const matchedChapterTitle = data.matchedChapterTitle;

      let finalReply = replyText;
      let speechText = replyText;
      let matchedTopic: Topic | undefined;
      let matchedChapter: Chapter | undefined;

      if (matchedChapterTitle) {
        let targetTitle = matchedChapterTitle.trim();
        // Remove anything in parentheses if AI included it
        targetTitle = targetTitle.split('(')[0].split(':')[0].trim();
        
        matchedChapter = CHAPTERS.find(ch => ch.title.toLowerCase() === targetTitle.toLowerCase());
        matchedTopic = TOPIC_MAP.find(t => t.chapter.toLowerCase() === targetTitle.toLowerCase());

        // If still not found, try a partial match
        if (!matchedChapter) {
          matchedChapter = CHAPTERS.find(ch => targetTitle.toLowerCase().includes(ch.title.toLowerCase()) || ch.title.toLowerCase().includes(targetTitle.toLowerCase()));
          if (matchedChapter) {
             matchedTopic = TOPIC_MAP.find(t => t.chapter.toLowerCase() === matchedChapter?.title.toLowerCase());
          }
        }
      }

      if (matchedChapter) {
        const isInterlude = matchedChapter.title.toLowerCase().includes('interlude');
        const topicLabel = matchedTopic?.chapter || matchedChapter.title;
        
        let transition = "";
        if (isInterlude) {
          transition = `Aye, I've cued up some music for ya. Enjoy the interlude!`;
        } else {
          transition = `Here is a transcript of Lin's advice about ${topicLabel}. The chapter is cued up for you to watch the video when you are ready.`;
        }

        finalReply += `\n\n${transition}`;
        speechText += ` ${transition}`;
        
        const chIdx = CHAPTERS.findIndex(c => c.title.toLowerCase() === (matchedChapter?.title || "").toLowerCase());
        const chapterLines = srtSegments.filter(s => s.chapterIdx === chIdx);
        
        if (chapterLines.length > 0) {
          const fullText = chapterLines.map(s => {
            const prefix = s.speaker ? `[${s.speaker}]` : "•";
            return `${prefix} ${s.text}`;
          }).join('\n\n');
          finalReply += `\n\nVerbatim Transcript for "${matchedChapter?.title}":\n\n${fullText}`;
        } else if (matchedTopic) {
          finalReply += `\n\n"${matchedTopic.transcript}"`;
        } else if (!isInterlude) {
          finalReply += `\n\n[The video is cued to this chapter for full advice]`;
        }
      }

      const bosunMsg: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'Bosun',
        text: finalReply,
        type: 'bosun',
        timestamp: new Date(),
        showJumpButton: matchedChapter !== undefined
      };

      setMessages(prev => [...prev, bosunMsg]);

      // If it's an interlude, we wait for speech to finish before playing the video
      const handleVisualResponse = () => {
        if (matchedChapter && videoRef.current) {
          const isInterlude = matchedChapter.title.toLowerCase().includes('interlude');
          if (isInterlude) {
            handleJumpAndPlay(matchedChapter);
          } else {
            handleJumpAndPause(matchedChapter);
          }
        }
      };

      if (matchedChapter && matchedChapter.title.toLowerCase().includes('interlude')) {
        speak(speechText, bosunMsg.id, () => {
          // A generous breath after the Bosun speaks before the music fills the sails
          setTimeout(handleVisualResponse, 1000);
        });
      } else {
        speak(speechText, bosunMsg.id);
        handleVisualResponse();
      }
    } catch (error) {
      console.error("Gemini error:", error);
      const errorText = "Aye, the fog is thick and I lost my bearings. Let's try that again.";
      const fallbackMsg: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'Bosun',
        text: errorText,
        type: 'bosun',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, fallbackMsg]);
      speak(errorText, fallbackMsg.id);
    } finally {
      setIsTyping(false);
    }
  };

  const handleJumpAndPause = (ch: Chapter) => {
    if (videoRef.current) {
      videoRef.current.currentTime = ch.time;
      videoRef.current.pause();
      setCurrentChapterTitle(ch.title);
      setCurrentChapterThumbnail(ch.thumbnail || '/images/Pardey_CostControl_VimOTT_1920x1080.jpg');
      setShowChapterOverlay(true);
      setIsSidebarOpen(false);
    }
  };

  const handleJumpAndPlay = (ch: Chapter) => {
    if (videoRef.current) {
      // Defensive pause and seek to avoid buffer issues
      videoRef.current.pause();
      videoRef.current.muted = false; 
      videoRef.current.currentTime = ch.time;
      
      const playPromise = videoRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch(err => {
          console.warn("Auto-play blocked or failed:", err);
          setShowChapterOverlay(true);
          setCurrentChapterTitle(ch.title);
        });
      }

      setShowChapterOverlay(false);
      setIsSidebarOpen(false);
    }
  };

  const handlePlay = () => {
    if (videoRef.current) {
      videoRef.current.play();
      setShowChapterOverlay(false);
    }
  };

  const handleFullScreen = () => {
    if (videoRef.current) {
      const container = videoRef.current;
      if (!document.fullscreenElement) {
        const req = container.requestFullscreen || (container as any).webkitRequestFullscreen || (container as any).msRequestFullscreen;
        if (req) {
          req.call(container).catch((err: any) => {
            console.error("Error enabling full-screen mode:", err);
          });
        }
      } else {
        const exit = document.exitFullscreen || (document as any).webkitExitFullscreen || (document as any).msExitFullscreen;
        if (exit) {
          exit.call(document);
        }
      }
    }
  };

  // --- HANDLERS ---
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Revoke previous URL to avoid memory leaks
      if (videoSrc) {
        URL.revokeObjectURL(videoSrc);
      }
      
      const url = URL.createObjectURL(file);
      setVideoSrc(url);
      setShowChapterOverlay(false);

      // Persist to IndexedDB
      try {
        await set('persistedVideo', file);
      } catch (err) {
        console.error("Failed to persist video:", err);
      }
    }
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-[#020617] text-[#e5e7eb] font-sans selection:bg-[#f5c96b]/30">
      {/* 
        CRITICAL: We use h-screen overflow-hidden on the root to prevent the window itself from scrolling.
        This completely eliminates the browser's "jump to bottom" behavior on load.
      */}
      
      {/* BRANDING BANNER */}
      <header id="app-header" className="shrink-0 w-full bg-linear-to-r from-[#050b18] via-[#071426] via-70% to-[#111827] border-b border-[#f5c96b]/35 shadow-[0_10px_30px_rgba(0,0,0,0.65)] p-2.5 flex items-center justify-between gap-4 z-50">
        <div className="flex items-center gap-4">
          <div className="flex flex-col items-center gap-1">
            <div className="w-16 h-16 md:w-20 md:h-20 lg:w-24 lg:h-24 rounded-xl overflow-hidden border border-[#f5c96b]/30 bg-[#020617] shrink-0 shadow-lg relative">
              <img 
                src={encodeURI("/images/Lin 2008, larger file Michael Marris.jpg")} 
                alt="Lin Pardey" 
                className="w-full h-full object-cover" 
              />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#f5c96b]/80">Lin Pardey</span>
          </div>

           <div className="flex flex-col gap-3 items-start max-w-70 hidden sm:flex">
            <div className="w-full bg-white/5 border border-white/10 rounded-xl overflow-hidden">
              <div 
                onClick={() => toggleSection('linBio')}
                className="w-full flex items-center justify-between px-3 py-1 cursor-pointer hover:bg-white/10 transition-colors"
                role="button"
              >
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-bold tracking-widest uppercase text-[#f5c96b]">ABOUT LIN</span>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      const text = "Lin Pardey is a legendary long-distance cruiser, author, and sailor with a lifetime of bluewater experience. She and her late husband, Larry Pardey, are famous for advocating self-sufficient, affordable cruising aboard small boats. Together, Lin and Larry circumnavigated the world, wrote bestselling books like Cruising Handbook and Storm Tactics, and inspired generations of sailors to explore the world with confidence and simplicity. Their philosophy is rooted in seamanship, soul, and smart cost control—making them the perfect guides for this video seminar.";
                      handleSpeechAction(text, 'about-lin-header');
                      if (!expandedSections.linBio) toggleSection('linBio');
                    }}
                    className={`p-0.5 px-2 rounded-md transition-all flex items-center gap-1 ${
                      speakingMessageId === 'about-lin-header' 
                        ? "bg-[#f5c96b]/20 text-[#f5c96b] ring-1 ring-[#f5c96b]/40 shadow-[0_0_8px_rgba(245,201,107,0.25)]" 
                        : "bg-white/5 text-gray-500 hover:text-[#f5c96b] hover:bg-white/10"
                    }`}
                  >
                    {speakingMessageId === 'about-lin-header' && isPaused ? <Play size={8} fill="currentColor" /> : speakingMessageId === 'about-lin-header' && isSpeaking ? <Pause size={8} fill="currentColor" /> : <Volume2 size={8} />}
                    <span className="text-[7px] font-bold uppercase">{speakingMessageId === 'about-lin-header' ? (isPaused ? 'Resume' : 'Pause') : 'Read'}</span>
                    <InlineEqualizer isSpeaking={speakingMessageId === 'about-lin-header' && isSpeaking} isPaused={isPaused} size="sm" />
                  </button>
                </div>
                {expandedSections.linBio ? <ChevronUp size={12} className="text-gray-400" /> : <ChevronDown size={12} className="text-gray-400" />}
              </div>
              <AnimatePresence>
                {expandedSections.linBio && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="p-3 text-[10px] leading-relaxed border-t border-white/10 text-gray-300 space-y-3">
                      <div className="w-full h-32 overflow-hidden rounded-lg border border-white/10">
                        <img 
                          src={encodeURI("/images/Lin 2008, larger file Michael Marris.jpg")} 
                          alt="Lin Pardey" 
                          className="w-full h-full object-cover" 
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      <p>Lin Pardey is a legendary long-distance cruiser, author, and sailor with a lifetime of bluewater experience. She and her late husband, Larry Pardey, are famous for advocating self-sufficient, affordable cruising aboard small boats.</p>
                      <p>Together, Lin and Larry circumnavigated the world, wrote bestselling books like Cruising Handbook and Storm Tactics, and inspired generations of sailors to explore the world with confidence and simplicity.</p>
                      <p>Their philosophy is rooted in seamanship, soul, and smart cost control—making them the perfect guides for this video seminar.</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <div className="flex flex-col gap-0.5">
            <h1 className="text-sm md:text-xl tracking-widest uppercase text-[#f5c96b] font-bold leading-tight">
              Cost Control <span className="hidden sm:inline">While You Cruise</span>
            </h1>
            <div className="flex items-center gap-x-3 gap-y-0.5 flex-wrap">
              <p className="text-[9px] md:text-xs text-gray-400 font-medium">Lin Pardey • Sailflix Originals</p>
              <span className="text-gray-600 text-[10px] hidden md:inline">•</span>
              <p className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-gray-300">Video Seminar Companion</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex flex-col items-end leading-none">
            <div className="text-sm font-semibold tracking-widest mb-0.5">TheSailingChannel.TV</div>
            <div className="text-[10px] text-gray-400 text-right leading-tight">Stories, skills, and seamanship from real cruisers</div>
          </div>
          
          <div className="w-16 h-16 rounded-xl overflow-hidden border border-white/10 shrink-0 hidden sm:block bg-[#050d1a]">
            <img 
              src="/images/tsc_logo-sailflix_002.png" 
              alt="TheSailingChannel Logo" 
              className="w-full h-full object-contain" 
            />
          </div>

          <div className="flex flex-col items-center gap-1">
            <label className="cursor-pointer bg-[#f5c96b]/15 border border-[#f5c96b] text-[#f5c96b] px-4 py-1.5 text-[10px] rounded-full hover:bg-[#f5c96b]/25 transition-all font-semibold flex items-center gap-2 whitespace-nowrap">
              {videoSrc ? <Settings2 size={10} /> : <Play size={10} />}
              {isLoadingPersistedVideo ? 'Checking Storage...' : videoSrc ? 'Change Source' : 'Load Video'}
              <input id="video-upload" type="file" accept="video/mp4" onChange={handleFileUpload} className="hidden" />
            </label>
            <a href="/README.txt" target="_blank" rel="noopener noreferrer" className="text-[9px] font-medium text-[#f5c96b]/50 hover:text-[#f5c96b] transition-colors flex items-center gap-1 uppercase tracking-tighter">
              <FileText size={8} /> App README
            </a>
          </div>

          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="md:hidden p-2 text-white">
            {isSidebarOpen ? <X /> : <Menu />}
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* SIDEBAR (CHAPTERS) */}
        <aside className={`
          fixed inset-y-0 left-0 z-40 w-72 bg-[#050d1a] border-r border-[#1f2937] p-4 overflow-y-auto transition-transform duration-300 md:relative md:translate-x-0 h-full
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}>
          <div className="flex items-center gap-2 mb-6 text-[#f5c96b]">
            <Anchor size={20} />
            <h2 className="text-lg tracking-widest uppercase font-bold">Chapters</h2>
          </div>

          <div className="mb-8 md:hidden">
            <div className="w-full bg-white/5 border border-white/10 rounded-xl overflow-hidden">
              <div 
                onClick={() => toggleSection('linBioSidebar')}
                className="w-full flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-white/10 transition-colors text-left"
                role="button"
              >
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg overflow-hidden border border-[#f5c96b]/30">
                    <img src={encodeURI("/images/Lin 2008, larger file Michael Marris.jpg")} alt="Lin" className="w-full h-full object-cover" />
                  </div>
                  <span className="text-[10px] font-bold tracking-widest uppercase text-[#f5c96b]">ABOUT LIN</span>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      const text = "Lin Pardey is a legendary long-distance cruiser, author, and sailor with a lifetime of bluewater experience. She and her late husband, Larry Pardey, are famous for advocating self-sufficient, affordable cruising aboard small boats. Together, Lin and Larry circumnavigated the world, wrote bestselling books like Cruising Handbook and Storm Tactics, and inspired generations of sailors to explore the world with confidence and simplicity. Their philosophy is rooted in seamanship, soul, and smart cost control—making them the perfect guides for this video seminar.";
                      handleSpeechAction(text, 'about-lin-sidebar');
                      if (!expandedSections.linBioSidebar) toggleSection('linBioSidebar');
                    }}
                    className={`p-1 px-2 rounded-md transition-all flex items-center gap-1.5 ${
                      speakingMessageId === 'about-lin-sidebar' 
                        ? "bg-[#f5c96b]/20 text-[#f5c96b] ring-1 ring-[#f5c96b]/40 shadow-[0_0_8px_rgba(245,201,107,0.25)]" 
                        : "bg-white/5 text-gray-500 hover:text-[#f5c96b] hover:bg-white/10"
                    }`}
                  >
                    {speakingMessageId === 'about-lin-sidebar' && isPaused ? <Play size={10} fill="currentColor" /> : speakingMessageId === 'about-lin-sidebar' && isSpeaking ? <Pause size={10} fill="currentColor" /> : <Volume2 size={10} />}
                    <InlineEqualizer isSpeaking={speakingMessageId === 'about-lin-sidebar' && isSpeaking} isPaused={isPaused} size="md" />
                  </button>
                  {expandedSections.linBioSidebar ? <ChevronUp size={14} className="text-gray-400" /> : <ChevronDown size={14} className="text-gray-400" />}
                </div>
              </div>
              <AnimatePresence>
                {expandedSections.linBioSidebar && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="p-3 text-[10px] leading-relaxed border-t border-white/10 text-gray-300 space-y-3 bg-[#020617]">
                      <div className="w-full h-32 overflow-hidden rounded-lg border border-white/10">
                        <img 
                          src={encodeURI("/images/Lin 2008, larger file Michael Marris.jpg")} 
                          alt="Lin Pardey" 
                          className="w-full h-full object-cover" 
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      <p>Lin Pardey is a legendary long-distance cruiser, author, and sailor with a lifetime of bluewater experience. She and her late husband, Larry Pardey, are famous for advocating self-sufficient, affordable cruising aboard small boats.</p>
                      <p>Together, Lin and Larry circumnavigated the world, wrote bestselling books like Cruising Handbook and Storm Tactics, and inspired generations of sailors to explore the world with confidence and simplicity.</p>
                      <p>Their philosophy is rooted in seamanship, soul, and smart cost control—making them the perfect guides for this video seminar.</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
          
          <ul className="space-y-2">
            {CHAPTERS.map((ch, idx) => (
              <li 
                key={idx}
                onClick={() => handleJumpAndPlay(ch)}
                className="group flex justify-between items-center p-3 rounded-xl bg-[#4a90c2]/10 border border-[#4a90c2]/20 hover:bg-[#4a90c2]/20 hover:translate-x-1 transition-all cursor-pointer"
              >
                <span className="text-xs font-medium group-hover:text-white">{ch.title}</span>
                <span className="text-[10px] font-bold text-[#f5c96b]">{formatTime(ch.time)}</span>
              </li>
            ))}
          </ul>

          <div className="mt-8 border-t border-white/10 pt-6">
            <div className="w-full bg-white/5 border border-white/10 rounded-xl overflow-hidden">
              <div 
                onClick={() => toggleSection('aboutTSC')}
                className="w-full flex items-center justify-between px-3 py-3 cursor-pointer hover:bg-white/10 transition-colors text-left"
                role="button"
              >
                <span className="text-[10px] font-bold tracking-widest uppercase text-[#f5c96b]">About TheSailingChannel.TV & Sailflix.com</span>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      const text = "TheSailingChannel.TV sells video downloads and streaming rentals through Vimeo on Demand. We also offer DVDs and Blu-rays of selected titles. Choose from our large library of free and paid sailing videos – sailing adventures, how-to sail, and sailboat maintenance. Sailflix.com is our subscription service. Stream our entire library of contemporary & classic sailing documentaries, how-to videos, and Web series -- with a focus on cruising. No extra costs. No ads. All titles included. Use our powerful SEARCH option for quick access to destinations like Caribbean, topics like Rigging, and sailors like Pardey and Jobson. Whether you sail across a lake, a bay, or an ocean, you’ll find our sailing videos inspiring and informative. Our filmmakers are sailors who share your passion for adventure, travel, exploration, and the fun of just messing about in boats. Please consider purchasing a video to support our producers.";
                      handleSpeechAction(text, 'about-tsc');
                      if (!expandedSections.aboutTSC) toggleSection('aboutTSC');
                    }}
                    className={`p-1 px-2 rounded-md transition-all flex items-center gap-1.5 ${
                      speakingMessageId === 'about-tsc' 
                        ? "bg-[#f5c96b]/20 text-[#f5c96b] ring-1 ring-[#f5c96b]/40 shadow-[0_0_8px_rgba(245,201,107,0.25)]" 
                        : "bg-white/5 text-gray-500 hover:text-[#f5c96b] hover:bg-white/10"
                    }`}
                  >
                    {speakingMessageId === 'about-tsc' && isPaused ? <Play size={10} fill="currentColor" /> : speakingMessageId === 'about-tsc' && isSpeaking ? <Pause size={10} fill="currentColor" /> : <Volume2 size={10} />}
                    <InlineEqualizer isSpeaking={speakingMessageId === 'about-tsc' && isSpeaking} isPaused={isPaused} size="md" />
                  </button>
                  {expandedSections.aboutTSC ? <ChevronUp size={14} className="text-gray-400" /> : <ChevronDown size={14} className="text-gray-400" />}
                </div>
              </div>
              <AnimatePresence>
                {expandedSections.aboutTSC && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="p-4 text-[10px] leading-relaxed border-t border-white/10 text-gray-300 space-y-4 bg-[#020617]">
                      <p>
                        <a href="https://thesailingchannel.tv" target="_blank" rel="noopener noreferrer" className="text-[#f5c96b] font-bold hover:underline">TheSailingChannel.TV</a> sells video downloads and streaming rentals through Vimeo on Demand. We also offer DVDs and Blu-rays of selected titles. Choose from our large library of free and paid sailing videos – sailing adventures, how-to sail, and sailboat maintenance.
                      </p>
                      <p>
                        <a href="https://sailflix.com" target="_blank" rel="noopener noreferrer" className="text-[#f5c96b] font-bold hover:underline">Sailflix.com</a> is our subscription service. Stream our entire library of contemporary & classic sailing documentaries, how-to videos, and Web series -- with a focus on cruising. No extra costs. No ads. All titles included. Use our powerful SEARCH option for quick access to destinations like Caribbean, topics like Rigging, and sailors like Pardey and Jobson.
                      </p>
                      <p>
                        Whether you sail across a lake, a bay, or an ocean, you’ll find our sailing videos inspiring and informative. Our filmmakers are sailors who share your passion for adventure, travel, exploration, and the fun of just messing about in boats. Please consider purchasing a video to support our producers.
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </aside>

        {/* MAIN CONTENT AREA - This is the scrollable container */}
        <main id="main-content" className="flex-1 min-w-0 flex flex-col bg-linear-to-b from-[#020617] to-black overflow-y-auto custom-scrollbar scroll-smooth">
          {/* VIDEO DISPLAY DECK & TRANSCRIPT SPLIT ROW */}
          <div className={`flex flex-col lg:flex-row lg:items-start w-full border-b border-[#1f2937] bg-black shrink-0 relative overflow-hidden transition-all duration-300 ${
            showTranscript ? 'lg:p-4 lg:gap-4 bg-[#090d16]' : ''
          }`}>
            {/* VIDEO BOX */}
            <div className={`relative bg-black transition-all duration-300 overflow-hidden group shrink-0 min-h-[180px] ${
              showTranscript 
                ? 'w-full lg:w-2/3 aspect-video border border-white/10 lg:rounded-2xl shadow-xl' 
                : 'w-full aspect-video'
            }`}>
              {!videoSrc && (
                <div className="absolute inset-0 flex flex-col items-center justify-center overflow-hidden z-10">
                  <img 
                    src="/images/Pardey_CostControl_VimOTT_1920x1080.jpg" 
                    alt="Cost Control While You Cruise" 
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center p-6 backdrop-blur-xs">
                    <div className="w-20 h-20 mb-4 text-[#f5c96b] drop-shadow-xl cursor-copy" onClick={() => document.getElementById('video-upload')?.click()}>
                      <Play size={80} />
                    </div>
                    <p className="mt-2 text-sm text-white font-bold uppercase tracking-widest bg-black/60 px-4 py-2 rounded-full border border-white/20">Please load your cruise seminar video file</p>
                    <a href="/README.txt" target="_blank" rel="noopener noreferrer" className="mt-4 text-xs text-[#f5c96b]/60 hover:text-[#f5c96b] transition-colors flex items-center gap-2 bg-black/40 px-3 py-1.5 rounded-lg border border-white/5 backdrop-blur-sm">
                      <FileText size={14} /> Read the App README for setup instructions
                    </a>
                  </div>
                </div>
              )}

              <AnimatePresence>
                {showChapterOverlay && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 z-20 bg-black/60 backdrop-blur-md flex items-center justify-center p-8 text-center"
                  >
                    <div className="max-w-2xl flex flex-col items-center">
                      <motion.div 
                        initial={{ scale: 0.9, y: 20 }}
                        animate={{ scale: 1, y: 0 }}
                        className="relative w-72 h-40 md:w-96 md:h-56 rounded-2xl overflow-hidden border-2 border-[#f5c96b] shadow-2xl mb-6 flex items-center justify-center bg-[#050d1a]"
                      >
                        <img 
                          src={currentChapterThumbnail} 
                          alt="Chapter Thumbnail" 
                          className="w-full h-full object-cover absolute inset-0"
                        />
                      </motion.div>
                      
                      <button 
                        onClick={handlePlay}
                        className="group flex items-center gap-3 bg-[#f5c96b] text-black px-8 py-3 rounded-full font-bold uppercase tracking-widest hover:scale-105 transition-all shadow-xl"
                      >
                        <Play size={24} fill="currentColor" />
                        Play Chapter
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <video 
                ref={videoRef}
                src={videoSrc || undefined}
                poster="/images/Pardey_CostControl_VimOTT_1920x1080.jpg"
                controls
                className="w-full h-full object-contain"
                onTimeUpdate={() => setCurrentTime(videoRef.current?.currentTime || 0)}
                onPlay={() => {
                  setIsPlaying(true);
                  setShowChapterOverlay(false);
                }}
                onPause={() => setIsPlaying(false)}
              />
              
              {/* EMBEDDED THREE-DOT MORE OPTIONS MENU (TOP-RIGHT DECK OVERLAY) */}
              {videoSrc && (
                <div ref={moreMenuRef} className="absolute top-4 right-4 z-25">
                  <button 
                    onClick={() => setIsMoreMenuOpen(!isMoreMenuOpen)}
                    className={`p-2 rounded-full border bg-black/80 backdrop-blur-md shadow-lg transition-all flex items-center justify-center cursor-pointer hover:bg-black/95 hover:scale-105 active:scale-95 ${
                      isMoreMenuOpen 
                        ? "text-[#f5c96b] border-[#f5c96b]" 
                        : "text-white/75 border-white/10 hover:text-white"
                    }`}
                    title="More Video Options"
                  >
                    <MoreVertical size={16} />
                  </button>

                  <AnimatePresence>
                    {isMoreMenuOpen && (
                      <motion.div 
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 mt-2 w-56 bg-[#050d1a]/95 border border-white/10 rounded-xl p-3 shadow-2xl backdrop-blur-md z-30 space-y-3 font-sans"
                      >
                        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-white/5 pb-1">Video Options</div>

                        {/* Closed Captions Option */}
                        <div className="flex items-center justify-between text-xs text-gray-200">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-[8px] px-1 py-0.5 bg-[#f5c96b]/10 text-[#f5c96b] rounded font-mono border border-[#f5c96b]/20">CC</span>
                            <span>Closed Captions</span>
                          </div>
                          <button 
                            onClick={() => setShowCaptions(!showCaptions)}
                            className={`text-[9px] font-bold px-2 py-1 rounded transition-all cursor-pointer ${
                              showCaptions 
                                ? 'bg-[#f5c96b] text-black font-bold' 
                                : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
                            }`}
                          >
                            {showCaptions ? 'ON' : 'OFF'}
                          </button>
                        </div>

                        {/* Transcript Window Option */}
                        <div className="flex items-center justify-between text-xs text-gray-200 border-t border-white/5 pt-2">
                          <div className="flex items-center gap-2">
                            <FileText size={12} className="text-[#f5c96b]" />
                            <span>Transcript Panel</span>
                          </div>
                          <button 
                            onClick={() => setShowTranscript(!showTranscript)}
                            className={`text-[9px] font-bold px-2 py-1 rounded transition-all cursor-pointer ${
                              showTranscript 
                                ? 'bg-[#f5c96b] text-black font-bold' 
                                : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
                            }`}
                          >
                            {showTranscript ? 'ON' : 'OFF'}
                          </button>
                        </div>

                        {/* Audio Level Control Option */}
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-xs text-gray-200">
                            <div className="flex items-center gap-1.5">
                              {volume === 0 ? (
                                <VolumeX size={12} className="text-gray-400" />
                              ) : (
                                <Volume2 size={12} className="text-[#f5c96b]" />
                              )}
                              <span>Audio Level</span>
                            </div>
                            <span className="font-mono text-[9px] font-bold text-gray-400">
                              {Math.round(volume * 100)}%
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <button 
                              onClick={() => setVolume(volume === 0 ? 1 : 0)} 
                              className="text-gray-400 hover:text-white p-0.5"
                              title={volume === 0 ? "Unmute" : "Mute"}
                            >
                              {volume === 0 ? <VolumeX size={12} /> : <Volume2 size={12} />}
                            </button>
                            <input 
                              type="range"
                              min="0"
                              max="1"
                              step="0.05"
                              value={volume}
                              onChange={(e) => setVolume(parseFloat(e.target.value))}
                              className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#f5c96b]"
                            />
                          </div>
                        </div>

                        {/* Speed Control Option */}
                        <div className="space-y-1.5 border-t border-white/5 pt-2">
                          <div className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Playback Speed</div>
                          <div className="grid grid-cols-4 gap-1 p-0.5 bg-black/40 rounded-lg">
                            {[1, 1.25, 1.5, 2].map((s) => (
                              <button
                                key={s}
                                onClick={() => setPlaybackSpeed(s)}
                                className={`text-[9px] py-1 rounded font-mono font-bold transition-all cursor-pointer ${
                                  playbackSpeed === s 
                                    ? 'bg-[#f5c96b] text-black font-bold' 
                                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                                }`}
                              >
                                {s}x
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Full Screen Control Option */}
                        <button 
                          onClick={() => {
                            setIsMoreMenuOpen(false);
                            handleFullScreen();
                          }}
                          className="w-full flex items-center justify-between px-2.5 py-1.5 text-xs rounded-lg hover:bg-white/5 text-gray-200 border-t border-white/5 transition-colors cursor-pointer font-medium"
                        >
                          <div className="flex items-center gap-2">
                            <Maximize size={12} className="text-[#f5c96b]" />
                            <span>Full Screen</span>
                          </div>
                          <span className="text-[8px] bg-white/5 px-1.5 py-0.5 rounded text-gray-500 uppercase font-bold tracking-wider">Toggle</span>
                        </button>

                        {/* Change Video File Option */}
                        <button 
                          onClick={() => {
                            setIsMoreMenuOpen(false);
                            document.getElementById('video-upload')?.click();
                          }}
                          className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs rounded-lg hover:bg-white/5 text-left transition-colors text-gray-200 border-t border-white/5 cursor-pointer font-medium"
                        >
                          <Settings2 size={12} className="text-gray-400" />
                          <span>Change Video file</span>
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
              
              {/* INLINE CLOSED CAPTIONS OVERLAY */}
              {videoSrc && showCaptions && getActiveSegment() && (
                <div 
                  className="absolute left-1/2 -translate-x-1/2 bottom-12 md:bottom-16 w-[85%] max-w-[700px] px-4 py-2 bg-black/85 text-white rounded-xl border border-white/5 shadow-2.5xl backdrop-blur-md pointer-events-none select-none z-10 overflow-hidden"
                >
                  <ClosedCaptionText segment={getActiveSegment()!} currentTime={currentTime} />
                </div>
              )}


            </div>

            {/* SYNCED TRANSCRIPT DRAWER */}
            {showTranscript && (
              <div className="w-full lg:w-1/3 bg-[#030712]/95 border border-white/10 rounded-xl flex flex-col h-[200px] lg:h-[320px] lg:self-start lg:mt-0 shadow-2xl relative overflow-hidden">
                {videoSrc ? (
                  <>
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 bg-[#050d1a] border-b border-white/10 font-sans relative shrink-0">
                      <div className="flex flex-col min-w-0">
                        <span className="text-[9px] font-extrabold text-[#f5c96b] uppercase tracking-widest leading-none">Seminar Transcript</span>
                        <span className="text-[11px] font-bold text-white uppercase mt-1 truncate max-w-[200px]">
                          {(() => {
                            let currentChIdx = 0;
                            for (let i = 0; i < CHAPTERS.length; i++) {
                              if (currentTime >= CHAPTERS[i].time) currentChIdx = i;
                              else break;
                            }
                            return CHAPTERS[currentChIdx]?.title || "N/A";
                          })()}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2 shrink-0">
                        {/* Auto scroll Sync button */}
                        <button 
                          onClick={() => setAutoScrollTranscript(!autoScrollTranscript)}
                          className={`flex items-center gap-1 px-1.5 py-0.5 text-[9px] font-bold uppercase rounded border transition-all cursor-pointer ${
                            autoScrollTranscript 
                              ? "bg-[#f5c96b]/10 border-[#f5c96b]/30 text-[#f5c96b] shadow-[0_0_8px_rgba(245,201,107,0.1)]" 
                              : "bg-white/5 border-white/10 text-gray-500 hover:text-white hover:bg-white/10"
                          }`}
                          title="Auto-scroll to follow speaking pacing"
                        >
                          <span className={`w-1 h-1 rounded-full ${autoScrollTranscript ? 'bg-[#f5c96b] animate-pulse' : 'bg-gray-600'}`}></span>
                          <span>Auto Scroll</span>
                        </button>

                        <button 
                          onClick={() => setShowTranscript(false)}
                          className="p-1 rounded text-gray-400 hover:text-white hover:bg-white/5 cursor-pointer"
                          title="Hide Transcript Panel"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    </div>

                    {/* Scrollable Transcript List */}
                    <div 
                      ref={transcriptContainerRef}
                      className="flex-1 overflow-y-auto p-3.5 space-y-4 custom-scrollbar bg-black/20"
                    >
                      {(() => {
                        const allSegs = getAllTranscriptSegments();
                        if (allSegs.length === 0) {
                          return (
                            <div className="flex flex-col items-center justify-center h-full py-8 text-center text-gray-500 font-sans">
                              <span className="text-[10px] uppercase font-bold tracking-widest text-gray-400">Silence</span>
                              <p className="text-[10px] text-gray-500 mt-1">No captions active in this segment.</p>
                            </div>
                          );
                        }

                        // Group all segments by chapter for a highly structured, interactive experience
                        interface ChapterGroup {
                          chapterIdx: number;
                          chapterTitle: string;
                          segments: typeof allSegs;
                        }

                        const chaptersWithSegs: ChapterGroup[] = [];
                        allSegs.forEach(seg => {
                          let group = chaptersWithSegs.find(g => g.chapterIdx === seg.chapterIdx);
                          if (!group) {
                            group = {
                              chapterIdx: seg.chapterIdx,
                              chapterTitle: seg.chapterTitle,
                              segments: []
                            };
                            chaptersWithSegs.push(group);
                          }
                          group.segments.push(seg);
                        });

                        return chaptersWithSegs.map((group) => {
                          let currentChIdx = 0;
                          for (let i = 0; i < CHAPTERS.length; i++) {
                            if (currentTime >= CHAPTERS[i].time) currentChIdx = i;
                            else break;
                          }
                          const isCurrentChapter = group.chapterIdx === currentChIdx;

                          return (
                            <div key={group.chapterIdx} className="space-y-1.5 pb-2">
                              {/* Chapter Subheader in the transcript */}
                              <div className={`text-[10px] uppercase tracking-wider font-extrabold px-2 py-1.5 rounded-lg flex items-center justify-between sticky top-0 bg-[#050d1a] z-5 border border-white/5 shadow-xs ${
                                isCurrentChapter 
                                  ? 'text-[#f5c96b] bg-[#050d1a]/100' 
                                  : 'text-gray-400 bg-[#050d1a]/80'
                              }`}>
                                <span className="truncate justify-start text-left shrink pr-2">
                                  CH {group.chapterIdx + 1}: {group.chapterTitle}
                                </span>
                                <span className="font-mono text-[9px] font-bold text-gray-500 shrink-0">
                                  {formatTime(CHAPTERS[group.chapterIdx].time)}
                                </span>
                              </div>

                              <div className="space-y-1.5 pl-1">
                                {group.segments.map((seg) => {
                                  const isActive = currentTime >= seg.startTime && currentTime < seg.endTime;
                                  return (
                                    <div 
                                      key={seg.overallIdx}
                                      id={`transcript-seg-${seg.overallIdx}`}
                                      onClick={() => {
                                        if (videoRef.current) {
                                          videoRef.current.currentTime = seg.startTime;
                                          setCurrentTime(seg.startTime);
                                          if (!isPlaying) {
                                            videoRef.current.play().catch(e => console.error(e));
                                            setIsPlaying(true);
                                          }
                                        }
                                      }}
                                      className={`group flex items-start gap-2.5 p-2 rounded-xl transition-all cursor-pointer select-none text-left border-l-2 ${
                                        isActive 
                                          ? 'bg-[#f5c96b]/8 border-[#f5c96b] shadow-xs animate-pulse-subtle' 
                                          : 'hover:bg-white/5 border-transparent'
                                      }`}
                                    >
                                      <span 
                                        className={`font-mono text-[9px] font-bold px-1.5 py-0.5 rounded shrink-0 transition-colors ${
                                          isActive 
                                            ? 'bg-[#f5c96b] text-black font-extrabold shadow-sm' 
                                            : 'bg-white/5 text-gray-400 group-hover:bg-[#f5c96b]/20 group-hover:text-[#f5c96b]'
                                        }`}
                                      >
                                        {formatTime(seg.startTime)}
                                      </span>
                                      <p className={`text-xs leading-relaxed transition-colors ${
                                        isActive 
                                          ? 'text-white font-semibold animate-glow-subtle' 
                                          : 'text-gray-400 group-hover:text-gray-200'
                                      }`}>
                                        {seg.speaker && (
                                          <span className="font-bold text-[#f5c96b] mr-1 block sm:inline text-[10px] uppercase tracking-wide">
                                            {seg.speaker}:
                                          </span>
                                        )}
                                        {seg.text}
                                      </p>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        });
                      })()}
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-gray-500 font-sans">
                    <FileText className="w-8 h-8 text-[#f5c96b]/30 mb-2 animate-pulse" />
                    <p className="text-[10px] uppercase font-extrabold tracking-widest text-gray-400">Audio & Speech Sync</p>
                    <p className="text-[10px] text-gray-500 max-w-[200px] mt-1">Please load your cruise seminar video file to seek and interact with transcripts.</p>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="bg-[#050d1a] border-b border-[#1f2937] py-3.5 px-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-center gap-4">
              <div className="flex flex-col">
                <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Cruising Seminar</span>
                <span className="text-sm text-[#f5c96b] font-bold uppercase tracking-wide">Cost Control While You Cruise</span>
              </div>
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
              <div className="text-xs font-mono text-gray-400 bg-black/30 px-3 py-1.5 rounded-full border border-white/5 flex items-center gap-1.5 ml-auto md:ml-0 shadow-inner">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                {formatTime(currentTime)}
              </div>
            </div>
          </div>

          {/* BOSUN PANEL */}
          <div className="p-5 flex flex-col md:flex-row gap-6 bg-[#020617] border-b border-[#1f2937]">
            <div className="w-28 h-40 rounded-2xl overflow-hidden border border-white/10 shrink-0 shadow-2xl relative group bg-[#050d1a]">
              <img 
                src="/images/openart-image_vintage-sailor.jpg" 
                alt="Bosun" 
                className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500" 
              />
              <div className="absolute inset-0 bg-linear-to-t from-black via-transparent to-transparent opacity-60"></div>
            </div>

            <div className="flex-1 bg-white/5 border border-white/10 rounded-2xl overflow-hidden flex flex-col">
              <div className="flex items-center justify-between p-4 border-b border-white/5">
                <div className="flex items-center gap-4 flex-1">
                  <button 
                    onClick={() => toggleSection('aboutBosun')}
                    className="flex items-center gap-3 cursor-pointer hover:text-white transition-colors text-left"
                  >
                    <div className="w-2 h-2 rounded-full bg-[#f5c96b] animate-pulse"></div>
                    <span className="text-sm font-bold tracking-widest uppercase text-[#f5c96b]">About the Bosun</span>
                    {expandedSections.aboutBosun ? <ChevronUp size={16} className="text-gray-500" /> : <ChevronDown size={16} className="text-gray-500" />}
                  </button>
                  
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => {
                          const text = "Ahoy, mate! I'm your seasoned guide to exploring Lin Pardey's Cost Control While You Cruise video seminar. With decades of sailing wisdom and a deep knowledge of every chapter, I'm here to answer your questions and steer you toward the exact advice you need. Aboard any ship, the Bosun is responsible for the ship's hull, rigging, anchors, and all things nautical—keeping the vessel shipshape and ready for any sea. Here, I serve a similar role: maintaining the integrity of your cruising knowledge and ensuring you're equipped for smooth sailing ahead. Ask me anything about sails, anchoring, insurance, provisioning, communications, or any other aspect of cost-conscious cruising. I'll point you to Lin's expert guidance and share the wisdom of the sea.";
                          handleSpeechAction(text, 'about-bosun');
                          if (!expandedSections.aboutBosun) toggleSection('aboutBosun');
                        }}
                        className={`p-1 px-3 rounded-md transition-all flex items-center gap-2 ${
                          speakingMessageId === 'about-bosun' 
                            ? "bg-[#f5c96b]/20 text-[#f5c96b] ring-1 ring-[#f5c96b]/40 shadow-[0_0_8px_rgba(245,201,107,0.25)]" 
                            : "bg-white/5 text-gray-400 hover:text-[#f5c96b] hover:bg-white/10"
                        }`}
                        title={speakingMessageId === 'about-bosun' && isPaused ? "Resume Reading" : speakingMessageId === 'about-bosun' && isSpeaking ? "Pause Reading" : "Read Aloud"}
                      >
                        {speakingMessageId === 'about-bosun' && isPaused ? <Play size={12} fill="currentColor" /> : speakingMessageId === 'about-bosun' && isSpeaking ? <Pause size={12} fill="currentColor" /> : <Volume2 size={12} />}
                        <span className="text-[10px] font-bold uppercase tracking-tighter">
                          {speakingMessageId === 'about-bosun' && isPaused ? "Resume" : speakingMessageId === 'about-bosun' && isSpeaking ? "Pause" : "Read Aloud"}
                        </span>
                        <InlineEqualizer isSpeaking={speakingMessageId === 'about-bosun' && isSpeaking} isPaused={isPaused} size="md" />
                      </button>

                      {speakingMessageId === 'about-bosun' && isSpeaking && (
                        <div className="flex items-end gap-0.5 h-3 px-1">
                          <motion.div 
                            animate={{ height: isPaused ? 2 : [2, 8, 4, 10, 2] }}
                            transition={{ repeat: Infinity, duration: 0.5 }}
                            className="w-1 bg-[#f5c96b]"
                          />
                          <motion.div 
                            animate={{ height: isPaused ? 2 : [4, 10, 6, 12, 4] }}
                            transition={{ repeat: Infinity, duration: 0.6, delay: 0.1 }}
                            className="w-1 bg-[#f5c96b]"
                          />
                          <motion.div 
                            animate={{ height: isPaused ? 2 : [2, 6, 4, 8, 2] }}
                            transition={{ repeat: Infinity, duration: 0.4, delay: 0.2 }}
                            className="w-1 bg-[#f5c96b]"
                          />
                        </div>
                      )}

                      {speakingMessageId === 'about-bosun' && (isSpeaking || isPaused) && (
                        <button 
                          onClick={() => {
                            synthRef.current?.cancel();
                            setIsSpeaking(false);
                            setIsPaused(false);
                            setSpeakingMessageId(null);
                          }}
                          className="p-1 px-2 bg-white/5 text-gray-500 rounded-md hover:text-red-400 hover:bg-red-500/10 transition-all flex items-center gap-1"
                          title="Stop Speaking"
                        >
                          <Square size={10} fill="currentColor" />
                          <span className="text-[9px] font-bold uppercase">Stop</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <AnimatePresence>
                {expandedSections.aboutBosun && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="p-4 pt-0 text-xs text-gray-300 leading-relaxed space-y-3">
                      <p>Ahoy, mate! I'm your seasoned guide to exploring Lin Pardey's Cost Control While You Cruise video seminar. With decades of sailing wisdom and a deep knowledge of every chapter, I'm here to answer your questions and steer you toward the exact advice you need.</p>
                      <p>Aboard any ship, the Bosun is responsible for the ship's hull, rigging, anchors, and all things nautical—keeping the vessel shipshape and ready for any sea. Here, I serve a similar role: maintaining the integrity of your cruising knowledge and ensuring you're equipped for smooth sailing ahead.</p>
                      <p>Ask me anything about sails, anchoring, insurance, provisioning, communications, or any other aspect of cost-conscious cruising. I'll point you to Lin's expert guidance and share the wisdom of the sea.</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* INTERACTIVE TABS */}
          <div className="flex bg-[#071426] border-b border-[#1f2937]">
            <button 
              onClick={() => setActiveTab('chat')}
              className={`flex items-center gap-2 px-6 py-3 text-xs font-semibold uppercase tracking-widest transition-all ${activeTab === 'chat' ? 'bg-[#f5c96b]/15 text-[#f5c96b] border-r border-[#1f2937]' : 'text-gray-500 hover:text-gray-300'}`}
            >
              Chat
              {isSpeaking && <div className="flex gap-0.5"><div className="w-0.5 h-3 bg-[#f5c96b] animate-bounce"></div><div className="w-0.5 h-2 bg-[#f5c96b] animate-bounce delay-75"></div></div>}
            </button>
            <button 
              onClick={() => setActiveTab('notes')}
              className={`flex items-center gap-2 px-6 py-3 text-xs font-semibold uppercase tracking-widest transition-all ${activeTab === 'notes' ? 'bg-[#f5c96b]/15 text-[#f5c96b] border-r border-[#1f2937]' : 'text-gray-500 hover:text-gray-300'}`}
            >
              Notes
              <BookOpen size={14} />
            </button>
            <button 
              onClick={() => setActiveTab('logbook')}
              className={`flex items-center gap-2 px-6 py-3 text-xs font-semibold uppercase tracking-widest transition-all ${activeTab === 'logbook' ? 'bg-[#f5c96b]/15 text-[#f5c96b] border-r border-[#1f2937]' : 'text-gray-500 hover:text-gray-300'}`}
            >
              History
              <RotateCcw size={14} />
            </button>
            <button 
              onClick={() => setActiveTab('search')}
              className={`flex items-center gap-2 px-6 py-3 text-xs font-semibold uppercase tracking-widest transition-all ${activeTab === 'search' ? 'bg-[#f5c96b]/15 text-[#f5c96b] border-r border-[#1f2937]' : 'text-gray-500 hover:text-gray-300'}`}
            >
              Search
              <Search size={14} />
            </button>
          </div>

          {/* TAB PANELS */}
          <div className="flex-1 min-h-[750px] bg-black/20">
            {activeTab === 'chat' && (
              <div className="flex flex-col">
                <div className="p-4 space-y-6">
                  {messages.map((m) => (
                    <motion.div 
                      key={m.id} 
                      id={`msg-${m.id}`}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex gap-3 transition-all duration-500 rounded-3xl p-1.5 ${
                        highlightedMessageId === m.id 
                          ? 'bg-[#f5c96b]/5 ring-1 ring-[#f5c96b]/30 shadow-[0_0_25px_rgba(245,201,107,0.15)] scale-[1.01]' 
                          : ''
                      } ${m.type === 'user' ? 'flex-row-reverse' : ''}`}
                    >
                      {m.type === 'bosun' && (
                        <div className="relative shrink-0 select-none">
                          {/* Rich Concentric Ripples mapping active voice */}
                          {speakingMessageId === m.id && isSpeaking && !isPaused && (
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none -m-1">
                              <motion.div
                                initial={{ scale: 0.9, opacity: 0.8 }}
                                animate={{ scale: 1.6, opacity: 0 }}
                                transition={{ repeat: Infinity, duration: 1.2, ease: "easeOut" }}
                                className="absolute inset-0 rounded-lg border-2 border-[#f5c96b]/60"
                              />
                              <motion.div
                                initial={{ scale: 0.9, opacity: 0.4 }}
                                animate={{ scale: 2.1, opacity: 0 }}
                                transition={{ repeat: Infinity, duration: 1.2, ease: "easeOut", delay: 0.4 }}
                                className="absolute inset-0 rounded-lg border border-[#f5c96b]/30"
                              />
                            </div>
                          )}
                          <div className={`w-10 h-10 rounded-lg overflow-hidden border shrink-0 bg-[#050d1a] transition-all duration-300 relative z-10 ${
                            speakingMessageId === m.id && isSpeaking && !isPaused 
                              ? 'border-[#f5c96b] shadow-[0_0_12px_rgba(245,201,107,0.4)]' 
                              : 'border-white/10'
                          }`}>
                            <img 
                              src="/images/openart-image_vintage-sailor.jpg" 
                              alt="B" 
                              className={`w-full h-full object-cover transition-all duration-500 ${
                                speakingMessageId === m.id && isSpeaking && !isPaused ? 'grayscale-0 scale-105' : 'grayscale'
                              }`} 
                            />
                            
                            {/* Small audio equalizer bands across the bottom of avatar when talking */}
                            {speakingMessageId === m.id && isSpeaking && !isPaused && (
                              <div className="absolute inset-x-0 bottom-0 bg-black/80 py-0.5 flex justify-center items-end gap-0.5 h-3.5 border-t border-white/10">
                                <span className="w-0.5 h-2 bg-[#f5c96b] animate-[bounce_0.6s_infinite_alternate]" />
                                <span className="w-0.5 h-1 px-0 bg-[#f5c96b] animate-[bounce_0.5s_infinite_alternate_75ms] h-2" />
                                <span className="w-0.5 h-3 bg-[#f5c96b] animate-[bounce_0.7s_infinite_alternate_150ms]" />
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                      <div className={`w-full ${m.type === 'bosun' ? 'max-w-[95%] sm:max-w-[92%]' : 'max-w-[85%]'} ${m.type === 'user' ? 'text-right' : ''}`}>
                        <div className="text-[10px] font-bold uppercase tracking-widest text-[#f5c96b] mb-1">{m.sender}</div>
                        <div className={`rounded-2xl leading-relaxed shadow-lg transition-all duration-300 ${
                          m.type === 'user' 
                            ? `p-3 text-sm rounded-tr-none ${
                                highlightedMessageId === m.id 
                                  ? 'bg-[#4a90c2]/35 border-2 border-[#4a90c2] shadow-[0_0_15px_rgba(74,144,194,0.4)]' 
                                  : 'bg-[#4a90c2]/20 border border-[#4a90c2]/30'
                              }` 
                            : `p-4 md:p-5 text-sm md:text-[15px] rounded-tl-none ${
                                highlightedMessageId === m.id 
                                  ? 'bg-[#1e345c] border-2 border-[#f5c96b] shadow-[0_0_15px_rgba(245,201,107,0.3)]' 
                                  : 'bg-[#1a2b4b] border border-white/10'
                              }`
                        }`}>
                          <div className="whitespace-pre-wrap break-words">
                            {m.text}
                          </div>
                          
                          {m.type === 'bosun' && (
                            <div className="flex items-center gap-3 mt-3 pt-3 border-t border-white/5">
                              <button 
                                onClick={() => handleSpeechAction(m.text, m.id)}
                                className={`p-1 px-2 rounded-md transition-all flex items-center gap-1.5 ${
                                  speakingMessageId === m.id 
                                    ? "bg-[#f5c96b]/25 text-[#f5c96b] ring-1 ring-[#f5c96b]/40 shadow-[0_0_8px_rgba(245,201,107,0.25)]" 
                                    : "bg-white/5 text-gray-500 hover:text-[#f5c96b] hover:bg-white/10"
                                }`}
                                title={speakingMessageId === m.id && isPaused ? "Resume Reading" : speakingMessageId === m.id && isSpeaking ? "Pause Reading" : "Read Aloud"}
                              >
                                {speakingMessageId === m.id && isPaused ? <Play size={10} fill="currentColor" /> : speakingMessageId === m.id && isSpeaking ? <Pause size={10} fill="currentColor" /> : <Volume2 size={10} />}
                                <span className="text-[9px] font-bold uppercase tracking-tighter">
                                  {speakingMessageId === m.id && isPaused ? "Resume" : speakingMessageId === m.id && isSpeaking ? "Pause" : "Listen"}
                                </span>
                                <InlineEqualizer isSpeaking={speakingMessageId === m.id && isSpeaking} isPaused={isPaused} size="sm" />
                              </button>

                              {speakingMessageId === m.id && isSpeaking && (
                                <div className="flex items-center gap-1.5 px-2 bg-[#f5c96b]/10 border border-[#f5c96b]/20 rounded-lg py-1 h-6">
                                  <span className="text-[8px] font-bold text-[#f5c96b] uppercase tracking-wider animate-pulse">Speaking</span>
                                  <div className="flex items-end gap-0.5 h-3">
                                    {[1, 2, 3, 4, 5].map((val) => (
                                      <motion.div 
                                        key={val}
                                        animate={{ 
                                          height: isPaused ? 2 : [2, 11, 4, 12, 2][val - 1],
                                        }}
                                        transition={{ 
                                          repeat: Infinity, 
                                          duration: 0.35 + (val * 0.05), 
                                          delay: val * 0.03 
                                        }}
                                        className="w-0.5 rounded-full bg-[#f5c96b]"
                                      />
                                    ))}
                                  </div>
                                </div>
                              )}

                              {speakingMessageId === m.id && (isSpeaking || isPaused) && (
                                <button 
                                  onClick={() => {
                                    synthRef.current?.cancel();
                                    setIsSpeaking(false);
                                    setIsPaused(false);
                                    setSpeakingMessageId(null);
                                  }}
                                  className="p-1 px-2 bg-white/5 text-gray-500 rounded-md hover:text-red-400 hover:bg-red-500/10 transition-all flex items-center gap-1"
                                  title="Stop Speaking"
                                >
                                  <Square size={8} fill="currentColor" />
                                  <span className="text-[8px] font-bold uppercase">Stop</span>
                                </button>
                              )}
                            </div>
                          )}

                          {m.showJumpButton && (
                            <button 
                              onClick={() => {
                                if (videoRef.current) {
                                  videoRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                }
                              }}
                              className="mt-4 flex items-center gap-2 px-4 py-2 bg-[#f5c96b] text-black text-xs font-bold uppercase tracking-widest rounded-full hover:scale-105 active:scale-95 transition-all w-fit"
                            >
                              <ChevronUp size={14} />
                              Jump to Video
                            </button>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                  {isTyping && (
                    <div className="flex gap-3">
                      <div className="w-10 h-10 rounded-lg overflow-hidden border border-white/10 shrink-0 bg-[#050d1a]">
                        <img src="/images/openart-image_vintage-sailor.jpg" alt="B" className="w-full h-full object-cover grayscale" />
                      </div>
                      <div className="bg-[#1a2b4b] border border-white/10 p-4 rounded-2xl rounded-tl-none flex gap-1">
                        <div className="w-1.5 h-1.5 bg-[#f5c96b] rounded-full animate-bounce"></div>
                        <div className="w-1.5 h-1.5 bg-[#f5c96b] rounded-full animate-bounce delay-75"></div>
                        <div className="w-1.5 h-1.5 bg-[#f5c96b] rounded-full animate-bounce delay-150"></div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="p-4 bg-[#050d1a] border-t border-[#1f2937] space-y-3">
                  <AnimatePresence>
                    {isListening && (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        className="flex justify-center"
                      >
                        <WaveformVisualizer isListening={isListening} />
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="flex items-center gap-2">
                     <button 
                      onClick={toggleListening}
                      className={`p-3 rounded-full transition-all flex items-center justify-center relative ${
                        isListening 
                          ? 'bg-red-500 text-white shadow-[0_0_15px_rgba(239,68,68,0.5)] border border-red-400/30' 
                          : 'bg-white/5 border border-white/5 text-gray-400 hover:text-white hover:bg-white/10'
                      }`}
                      title={isListening ? "Stop Listening" : "Voice Command"}
                    >
                      {isListening ? (
                        <>
                          <Mic size={20} className="relative z-10 animate-pulse" />
                          <div className="absolute inset-0 pointer-events-none">
                            <motion.div
                              initial={{ scale: 1, opacity: 0.6 }}
                              animate={{ scale: 2.2, opacity: 0 }}
                              transition={{ repeat: Infinity, duration: 1.4, ease: "easeOut" }}
                              className="absolute inset-0 rounded-full border-2 border-red-500/60"
                            />
                            <motion.div
                              initial={{ scale: 1, opacity: 0.4 }}
                              animate={{ scale: 3.2, opacity: 0 }}
                              transition={{ repeat: Infinity, duration: 1.4, ease: "easeOut", delay: 0.45 }}
                              className="absolute inset-0 rounded-full border border-red-500/30"
                            />
                          </div>
                        </>
                      ) : (
                        <Mic size={20} />
                      )}
                    </button>
                    
                    <input 
                      type="text" 
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                      placeholder={isListening ? "Listening shipmate..." : "Ask the Bosun..."}
                      className="flex-1 bg-black/40 border border-[#1f2937] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#f5c96b]/50 transition-colors"
                    />
                    
                    <button 
                      onClick={() => handleSend()}
                      disabled={!inputText.trim()}
                      className="p-3 bg-[#f5c96b] text-black rounded-xl hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                    >
                      <Send size={20} />
                    </button>
                  </div>

                  <div className="flex items-center justify-between px-1">
                    <div className="flex items-center gap-4">
                      <button 
                        onClick={() => {
                          const nextState = !isBosunVoiceEnabled;
                          setIsBosunVoiceEnabled(nextState);
                          if (nextState) {
                            speak("Aye, I'm ready to talk!");
                          } else if (synthRef.current) {
                            synthRef.current.cancel();
                          }
                        }}
                        className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-gray-500 hover:text-[#f5c96b] transition-colors"
                        title={isBosunVoiceEnabled ? "Disable Voice" : "Enable Voice"}
                      >
                        {isBosunVoiceEnabled ? <Volume2 size={12} /> : <VolumeX size={12} />}
                        Bosun Voice: {isBosunVoiceEnabled ? 'ON' : 'OFF'}
                      </button>

                      {isSpeaking && (
                        <button 
                          onClick={() => synthRef.current?.cancel()}
                          className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-[#f5c96b] hover:text-white transition-colors animate-pulse"
                          title="Silence the Bosun"
                        >
                          <Square size={10} fill="currentColor" />
                          <span>Stop Speaking</span>
                        </button>
                      )}
                    </div>
                    <button 
                      onClick={() => {
                        setMessages([{ id: 'reset', sender: 'Bosun', text: "Ready for your next question, shipmate!", type: 'bosun', timestamp: new Date() }]);
                        synthRef.current?.cancel();
                      }}
                      className="text-[10px] font-bold uppercase tracking-widest text-gray-500 hover:text-white transition-colors flex items-center gap-1"
                    >
                      <RotateCcw size={12} />
                      Clear Chat
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'notes' && (
              <div className="p-4 flex flex-col gap-4 min-h-[750px]">
                <div className="flex items-center justify-between px-2">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-[#f5c96b] flex items-center gap-2">
                    <BookOpen size={14} /> My Notes
                  </h3>
                  <div className="relative">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                    <input 
                      type="text"
                      value={notesSearch}
                      onChange={(e) => setNotesSearch(e.target.value)}
                      placeholder="Search notes..."
                      className="bg-black/40 border border-[#1f2937] rounded-full pl-8 pr-3 py-1 text-[10px] focus:outline-none focus:border-[#f5c96b]/50 transition-colors w-40"
                    />
                  </div>
                </div>
                <div className="relative flex-1">
                  <textarea 
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Record your cruising insights here..."
                    className="w-full h-full bg-black/20 border border-[#1f2937] rounded-2xl p-4 text-sm font-mono focus:outline-none focus:border-[#f5c96b]/30 resize-none overflow-y-auto"
                  />
                  {notesSearch && (
                    <div className={`absolute top-4 right-8 px-2 py-1 text-[10px] rounded border transition-all ${
                      notes.toLowerCase().includes(notesSearch.toLowerCase()) 
                        ? "bg-[#f5c96b]/20 text-[#f5c96b] border-[#f5c96b]/30 animate-pulse" 
                        : "bg-red-500/20 text-red-500 border-red-500/30"
                    }`}>
                      {notes.toLowerCase().includes(notesSearch.toLowerCase()) ? "Matches Found" : "No Matches"}
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'logbook' && (
              <div className="p-6 space-y-4 flex flex-col">
                <div className="flex items-center justify-between border-b border-[#1f2937] pb-2">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-[#f5c96b]">Conversation Log</h3>
                  <div className="relative">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                    <input 
                      type="text"
                      value={historySearch}
                      onChange={(e) => setHistorySearch(e.target.value)}
                      placeholder="Search history..."
                      className="bg-black/40 border border-[#1f2937] rounded-full pl-8 pr-3 py-1 text-[10px] focus:outline-none focus:border-[#f5c96b]/50 transition-colors w-48"
                    />
                  </div>
                </div>
                <div className="space-y-4 pr-2 custom-scrollbar">
                  {messages.filter(m => m.type === 'user' && m.text.toLowerCase().includes(historySearch.toLowerCase())).length === 0 ? (
                    <p className="text-xs text-gray-500 italic">No entries found matching your search.</p>
                  ) : (
                    messages.filter(m => m.type === 'user' && m.text.toLowerCase().includes(historySearch.toLowerCase())).map((m, i) => {
                      const userIdx = messages.findIndex(msg => msg.id === m.id);
                      const bosunReply = userIdx !== -1 ? messages.slice(userIdx + 1).find(msg => msg.type === 'bosun') : null;

                      return (
                        <button 
                          key={m.id || i} 
                          onClick={() => {
                            setActiveTab('chat');
                            
                            setTimeout(() => {
                              const targetId = bosunReply ? bosunReply.id : m.id;
                              const elementId = `msg-${targetId}`;
                              const el = document.getElementById(elementId);
                              if (el) {
                                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                setHighlightedMessageId(targetId);
                                setTimeout(() => {
                                  setHighlightedMessageId(null);
                                }, 3000);
                              }
                              
                              if (bosunReply) {
                                handleSpeechAction(bosunReply.text, bosunReply.id);
                              }
                            }, 150);
                          }}
                          className="w-full text-left flex items-start justify-between gap-4 border-l-2 border-[#f5c96b]/30 hover:border-l-[#f5c96b] pl-4 py-2 hover:bg-[#f5c96b]/5 transition-all group rounded-r-lg cursor-pointer"
                        >
                          <div className="flex flex-col gap-1 min-w-0">
                            <span className="text-[10px] font-mono text-gray-500 group-hover:text-[#f5c96b] transition-colors">{m.timestamp.toLocaleTimeString()}</span>
                            <span className="text-xs italic text-gray-300 group-hover:text-white transition-colors">"{m.text}"</span>
                          </div>
                          {bosunReply && (
                            <span className="shrink-0 flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider text-[#f5c96b] bg-[#f5c96b]/10 group-hover:bg-[#f5c96b]/20 transition-all border border-[#f5c96b]/20">
                              <Volume2 size={10} className="group-hover:scale-110 transition-transform" />
                              Recall Reply
                            </span>
                          )}
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {activeTab === 'search' && (
              <div className="p-6 space-y-6 flex flex-col min-h-[750px]">
                {/* Search Input Area */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-[#1f2937] pb-2">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-[#f5c96b] flex items-center gap-2">
                      <Search size={14} /> Global Search
                    </h3>
                    <span className="text-[10px] text-gray-500 font-mono font-bold tracking-wider">SEARCH ALL CHANNELS</span>
                  </div>
                  
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input 
                      type="text"
                      value={globalSearchQuery}
                      onChange={(e) => setGlobalSearchQuery(e.target.value)}
                      placeholder="Search Chat, Notes, and Video Transcript..."
                      className="w-full bg-black/40 border border-[#1f2937] pl-12 pr-4 py-3 placeholder-gray-500 text-sm focus:outline-none focus:border-[#f5c96b]/50 transition-all text-white rounded-2xl"
                      autoFocus
                    />
                    {globalSearchQuery && (
                      <button 
                        onClick={() => setGlobalSearchQuery('')}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white text-xs font-semibold transition-colors cursor-pointer"
                      >
                        Clear
                      </button>
                    )}
                  </div>

                  {/* Filter Tabs / Chips */}
                  <div className="flex items-center gap-2 pt-1 flex-wrap">
                    <span className="text-[10px] text-gray-500 uppercase font-bold mr-1">Filter:</span>
                    {(['all', 'notes', 'chat', 'transcript'] as const).map((filter) => {
                      // Count number of matches to display inside badge
                      let count = 0;
                      if (globalSearchQuery.trim()) {
                        if (filter === 'all' || filter === 'notes') {
                          count += notes.split('\n').filter(line => testSearchMatch(line, globalSearchQuery) && line.trim() !== '').length;
                        }
                        if (filter === 'all' || filter === 'chat') {
                          count += messages.filter(m => testSearchMatch(m.text, globalSearchQuery)).length;
                        }
                        if (filter === 'all' || filter === 'transcript') {
                          count += srtSegments.filter(s => testSearchMatch(s.text, globalSearchQuery)).length;
                        }
                      }
                      
                      const label = filter === 'all' ? 'All Results' : filter.charAt(0).toUpperCase() + filter.slice(1);
                      const isSelected = searchResultFilter === filter;
                      
                      return (
                        <button
                          key={filter}
                          onClick={() => setSearchResultFilter(filter)}
                          className={`px-3 py-1 text-[10px] font-semibold uppercase tracking-wider rounded-full transition-all flex items-center gap-1.5 border cursor-pointer ${
                            isSelected 
                              ? 'bg-[#f5c96b]/25 border-[#f5c96b]/40 text-[#f5c96b]' 
                              : 'bg-black/25 border-[#1f2937] text-gray-400 hover:text-gray-200'
                          }`}
                        >
                          {label}
                          {globalSearchQuery.trim() && (
                            <span className={`px-1.5 py-0.2 rounded-full text-[9px] ${
                              isSelected ? 'bg-[#f5c96b]/20 text-[#f5c96b]' : 'bg-white/5 text-gray-500'
                            }`}>
                              {count}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Results Screen */}
                <div className="flex-1 overflow-y-auto space-y-6 pr-2 custom-scrollbar min-h-[450px]">
                  {!globalSearchQuery.trim() ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center text-gray-500">
                      <Search className="text-gray-600 mb-3 opacity-30" size={32} />
                      <p className="text-xs max-w-xs">Type a keyword or phrase above to query your active notes, the AI conversation log, and full seminar video transcripts.</p>
                    </div>
                  ) : (() => {
                    const matchedNotes = notes.split('\n')
                      .map((text, idx) => ({ text, idx }))
                      .filter(item => testSearchMatch(item.text, globalSearchQuery) && item.text.trim() !== '');
                      
                    const matchedChat = messages.filter(m => testSearchMatch(m.text, globalSearchQuery));
                    const matchedTranscript = srtSegments.filter(s => testSearchMatch(s.text, globalSearchQuery));

                    const hasNotes = matchedNotes.length > 0;
                    const hasChat = matchedChat.length > 0;
                    const hasTranscript = matchedTranscript.length > 0;
                    
                    const isAll = searchResultFilter === 'all';

                    if (!hasNotes && !hasChat && !hasTranscript) {
                      return (
                        <div className="text-center py-16 text-gray-500">
                          <p className="text-xs">No matching results found across notes, chat, or transcript for <span className="text-white">"{globalSearchQuery}"</span>.</p>
                          <p className="text-[10px] text-gray-600 mt-1">Try refining your search text or shifting keywords.</p>
                        </div>
                      );
                    }

                    return (
                      <div className="space-y-8 pb-8">
                        {/* 1. NOTES SECTION */}
                        {(isAll || searchResultFilter === 'notes') && hasNotes && (
                          <div className="space-y-3">
                            <h4 className="text-[10px] font-bold uppercase tracking-widest text-[#f5c96b] flex items-center gap-1.5 border-b border-[#f5c96b]/15 pb-1">
                              <BookOpen size={10} /> Notes Matches ({matchedNotes.length})
                            </h4>
                            <div className="space-y-2">
                              {matchedNotes.map((item, i) => (
                                <button
                                  key={`note-${i}`}
                                  onClick={() => {
                                    setNotesSearch(globalSearchQuery);
                                    setActiveTab('notes');
                                  }}
                                  className="w-full text-left block p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-[#1f2937] transition-all group cursor-pointer"
                                >
                                  <div className="flex items-center justify-between mb-1 text-[9px] font-mono text-[#f5c96b]/80">
                                    <span>Line {item.idx + 1}</span>
                                    <span className="opacity-0 group-hover:opacity-100 transition-opacity uppercase font-bold">Go to Notes →</span>
                                  </div>
                                  <p className="text-xs text-gray-300 font-mono line-clamp-2">
                                    {highlightSearchText(item.text, globalSearchQuery)}
                                  </p>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* 2. CHAT HISTORY SECTION */}
                        {(isAll || searchResultFilter === 'chat') && hasChat && (
                          <div className="space-y-3">
                            <h4 className="text-[10px] font-bold uppercase tracking-widest text-[#f5c96b] flex items-center gap-1.5 border-b border-[#f5c96b]/15 pb-1">
                              <RotateCcw size={10} /> Chat & Logbook Matches ({matchedChat.length})
                            </h4>
                            <div className="space-y-2">
                              {matchedChat.map((m, i) => {
                                const isUser = m.type === 'user';
                                return (
                                  <button
                                    key={`chat-${m.id || i}`}
                                    onClick={() => {
                                      setActiveTab('chat');
                                      setTimeout(() => {
                                        const elementId = `msg-${m.id}`;
                                        const el = document.getElementById(elementId);
                                        if (el) {
                                          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                          setHighlightedMessageId(m.id);
                                          setTimeout(() => {
                                            setHighlightedMessageId(null);
                                          }, 3000);
                                        }
                                      }, 150);
                                    }}
                                    className="w-full text-left block p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-[#1f2937] transition-all group cursor-pointer"
                                  >
                                    <div className="flex items-center justify-between mb-1 text-[9px] font-mono text-[#f5c96b]/80">
                                      <span>{isUser ? 'User Message' : 'Bosun Co-Pilot'} • {new Date(m.timestamp).toLocaleTimeString()}</span>
                                      <span className="opacity-0 group-hover:opacity-100 transition-opacity uppercase font-bold">Show in Chat →</span>
                                    </div>
                                    <p className="text-xs text-gray-300 line-clamp-2">
                                      {highlightSearchText(m.text, globalSearchQuery)}
                                    </p>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* 3. TRANSCRIPT SECTION */}
                        {(isAll || searchResultFilter === 'transcript') && hasTranscript && (
                          <div className="space-y-3">
                            <h4 className="text-[10px] font-bold uppercase tracking-widest text-[#f5c96b] flex items-center gap-1.5 border-b border-[#f5c96b]/15 pb-1">
                              <Play size={10} className="inline rotate-0" /> Video Transcript Matches ({matchedTranscript.length})
                            </h4>
                            <div className="space-y-2">
                              {matchedTranscript.map((seg, i) => (
                                <button
                                  key={`tr-${i}`}
                                  onClick={() => {
                                    if (videoRef.current) {
                                      // Scroll video player to view if needed
                                      videoRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                      videoRef.current.currentTime = seg.startTime;
                                      videoRef.current.play().catch(e => console.error(e));
                                    }
                                  }}
                                  className="w-full text-left block p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-[#1f2937] transition-all group cursor-pointer"
                                >
                                  <div className="flex items-center justify-between mb-1 text-[9px] font-mono text-[#f5c96b]/80">
                                    <span>Time: {formatTime(seg.startTime)} - {formatTime(seg.endTime)}</span>
                                    <span className="opacity-0 group-hover:opacity-100 transition-opacity uppercase font-bold flex items-center gap-0.5 mt-0.5 md:mt-0">Seek & Play <Play size={8} /></span>
                                  </div>
                                  <p className="text-xs text-gray-300 line-clamp-2">
                                    {seg.speaker ? <span className="font-bold text-[#f5c96b]/70 mr-1">{seg.speaker}:</span> : null}
                                    {highlightSearchText(seg.text, globalSearchQuery)}
                                  </p>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              </div>
            )}
          </div>
          
          {/* FOOTER - Moved inside main to be part of the main scrollable area */}
          <footer className="w-full mt-auto shrink-0">
            <div className="bg-[#050d1a] border-t border-white/5 pt-12 pb-16 px-6">
              <div className="max-w-6xl mx-auto">
                <div className="bg-[#f5c96b]/5 rounded-3xl p-6 md:p-10 border border-[#f5c96b]/10 shadow-2xl">
                  <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                    <h4 className="text-[#f5c96b] font-bold uppercase tracking-[0.2em] text-xs">More Sailing Videos from Lin & Larry Pardey</h4>
                    <div className="h-px flex-1 bg-[#f5c96b]/10 hidden md:block mx-8"></div>
                    <div className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Sailflix Originals</div>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {[
                      { 
                        title: "Storm Tactics", 
                        link: "https://thesailingchannel.tv/product/storm-tactics-pardey/",
                        thumb: "/images/storm-tactics.jpg"
                      },
                      { 
                        title: "Get Ready to Cruise", 
                        link: "https://thesailingchannel.tv/product/grtc-pardey-cruising-tips/",
                        thumb: "/images/get-ready-cruise.jpg"
                      },
                      { 
                        title: "Get Ready to Cross Oceans", 
                        link: "https://thesailingchannel.tv/product/ocean-sailing-tips-grtco/",
                        thumb: "/images/get-ready-oceans.jpg"
                      },
                      { 
                        title: "The Real Deal: Larry Pardey", 
                        link: "https://thesailingchannel.tv/product/the-real-deal-larry-pardey/",
                        thumb: "/images/real-deal.jpg"
                      },
                      { 
                        title: "Wind, Sand, and Sea", 
                        link: "https://thesailingchannel.tv/product/wind-sand-sea-with-lin-larry-pardey/",
                        thumb: "/images/wind-sand-sea.jpg"
                      },
                      { 
                        title: "Cruising Has No Limits", 
                        link: "https://thesailingchannel.tv/product/chnl-pardey-sailing-adventures/",
                        thumb: "/images/cruising-no-limits.jpg"
                      },
                      { 
                        title: "Storytelling for Sailors", 
                        link: "https://thesailingchannel.tv/product/storytelling-for-sailors/",
                        thumb: "/images/story-telling.jpg"
                      },
                      { 
                        title: "Cost Control While You Cruise", 
                        link: "https://thesailingchannel.tv/product/ccwyc-pardey-cruising-budget-tips/",
                        thumb: "/images/Pardey_CostControl_VimOTT_1920x1080.jpg"
                      }
                    ].map((item, i) => (
                      <a 
                        key={i}
                        href={item.link} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="group block bg-black/40 border border-white/5 rounded-2xl overflow-hidden hover:border-[#f5c96b]/30 hover:shadow-[0_0_20px_rgba(245,201,107,0.1)] transition-all flex flex-col"
                      >
                        <div className="aspect-video w-full overflow-hidden bg-[#050d1a]">
                          <img 
                            src={item.thumb} 
                            alt={item.title} 
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                        <div className="p-4 flex-1 flex flex-col justify-center">
                          <div className="text-xs font-bold group-hover:text-[#f5c96b] transition-colors line-clamp-2 text-center uppercase tracking-wider">{item.title}</div>
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-[#020617] border-t border-white/5 py-10 px-6 text-center">
              <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 rounded-lg overflow-hidden border border-white/10 opacity-50 grayscale hover:grayscale-0 hover:opacity-100 transition-all">
                  <img 
                    src="/images/tsc_logo-sailflix_002.png" 
                    alt="TSC" 
                    className="w-full h-full object-contain" 
                  />
                </div>
                <div className="text-[10px] text-gray-500 font-medium tracking-[0.2em]">
                  © 2026 TheSailingChannel.TV LLC. All rights reserved.
                </div>
              </div>
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
}
